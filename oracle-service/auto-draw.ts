#!/usr/bin/env node

/**
 * Auto-draw service for Sanca pools
 * Automatically triggers draw when period ends and all members have contributed
 * 
 * This service monitors all active pools and automatically triggers draw
 * when the period ends and all members have contributed.
 * 
 * Usage:
 *   npm run draw:once    # Run once
 *   npm run draw:watch    # Watch mode (every 60 seconds)
 */

import { createPublicClient, createWalletClient, http, type Address, defineChain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { SancaFactoryAbi } from '../ponder/abis/SancaFactoryAbi';
import { SancaPoolAbi } from '../ponder/abis/SancaPoolAbi';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Mantle Sepolia testnet chain definition
const mantleSepolia = defineChain({
  id: 5003,
  name: 'Mantle Sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Mantle',
    symbol: 'MNT',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.sepolia.mantle.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Mantle Sepolia Explorer',
      url: 'https://explorer.sepolia.mantle.xyz',
    },
  },
  testnet: true,
});

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPaths = [
  path.join(__dirname, '.env'),
];

let envLoaded = false;
for (const envPath of envPaths) {
  try {
    const result = dotenv.config({ path: envPath });
    if (!result.error) {
      envLoaded = true;
      break;
    }
  } catch {
    // Continue to next path
  }
}

if (!envLoaded) {
  console.warn('⚠️  Warning: No .env file found. Using environment variables or defaults.');
}

const FACTORY_ADDRESS = (process.env.FACTORY_ADDRESS || 
  '0x84c9dcDFd5CD9CfC464bB1418b838746AAFfD56C') as `0x${string}`;

const RPC_URL = process.env.RPC_URL || 'https://rpc.sepolia.mantle.xyz';
const RPC_URL_FALLBACK = 'https://mantle-sepolia.infura.io/v3/76cf79a022694d02839ffa1827307d27';

const PRIVATE_KEY_O = process.env.PRIVATE_KEY_O;
if (!PRIVATE_KEY_O) {
  console.error('❌ Error: PRIVATE_KEY not found in environment variables');
  process.exit(1);
}

const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

type LogColor = 'green' | 'yellow' | 'red' | 'cyan' | 'reset';

function log(message: string, color: LogColor = 'reset', bold = false) {
  const colorCode = colors[color] || colors.reset;
  const boldCode = bold ? colors.bold : '';
  console.log(`${boldCode}${colorCode}${message}${colors.reset}`);
}

async function initClients() {
  let publicClient = createPublicClient({
    chain: mantleSepolia,
    transport: http(RPC_URL),
  });

  // Test connection
  try {
    await publicClient.getBlockNumber();
  } catch (error: any) {
    log(`⚠️  Primary RPC failed, using fallback...`, 'yellow');
    publicClient = createPublicClient({
      chain: mantleSepolia,
      transport: http(RPC_URL_FALLBACK),
    });
  }

  const account = privateKeyToAccount(PRIVATE_KEY_O as `0x${string}`);
  const walletClient = createWalletClient({
    account,
    chain: mantleSepolia,
    transport: http(RPC_URL),
  });

  return { publicClient, walletClient };
}

async function getAllPools(publicClient: ReturnType<typeof createPublicClient>): Promise<Address[]> {
  try {
    const poolCount = await publicClient.readContract({
      address: FACTORY_ADDRESS,
      abi: SancaFactoryAbi,
      functionName: 'getPoolCount',
    });

    const pools: Address[] = [];
    for (let i = 0; i < Number(poolCount); i++) {
      try {
        const poolAddress = await publicClient.readContract({
          address: FACTORY_ADDRESS,
          abi: SancaFactoryAbi,
          functionName: 'getPool',
          args: [BigInt(i)],
        });
        pools.push(poolAddress);
      } catch (error) {
        // Skip invalid pools
        continue;
      }
    }

    return pools;
  } catch (error: any) {
    log(`❌ Error getting pools: ${error.message}`, 'red');
    return [];
  }
}

async function getPoolInfo(
  publicClient: ReturnType<typeof createPublicClient>,
  poolAddress: Address
): Promise<{
  state: number;
  currentCycle: bigint;
  cycleStartTime: bigint;
  periodDuration: bigint;
  maxMembers: number;
  currentMembers: bigint;
} | null> {
  try {
    const poolInfo = await publicClient.readContract({
      address: poolAddress,
      abi: SancaPoolAbi,
      functionName: 'getPoolInfo',
    });

    return {
      state: Number(poolInfo[0]),
      currentCycle: poolInfo[6],
      cycleStartTime: poolInfo[8],
      periodDuration: poolInfo[4],
      maxMembers: Number(poolInfo[1]),
      currentMembers: poolInfo[2],
    };
  } catch (error: any) {
    log(`   ⚠️  Error getting pool info: ${error.message}`, 'yellow');
    return null;
  }
}

async function canTriggerDraw(
  publicClient: ReturnType<typeof createPublicClient>,
  poolAddress: Address
): Promise<{ canTrigger: boolean; reason?: string; contributionInfo?: string }> {
  try {
    const poolInfo = await getPoolInfo(publicClient, poolAddress);
    if (!poolInfo) {
      return { canTrigger: false, reason: 'Failed to get pool info' };
    }

    // Check if pool is active
    if (poolInfo.state !== 1) { // 1 = Active
      return { canTrigger: false, reason: 'Pool is not active' };
    }

    // Check if period has ended
    const now = BigInt(Math.floor(Date.now() / 1000));
    const periodEndTime = poolInfo.cycleStartTime + poolInfo.periodDuration;
    if (now < periodEndTime) {
      const remaining = Number(periodEndTime - now);
      const hours = Math.floor(remaining / 3600);
      const minutes = Math.floor((remaining % 3600) / 60);
      return { 
        canTrigger: false, 
        reason: `Period not ended yet (${hours}h ${minutes}m remaining)` 
      };
    }

    // Check if draw is already pending
    const pendingNonce = await publicClient.readContract({
      address: poolAddress,
      abi: SancaPoolAbi,
      functionName: 'pendingNonce',
    });

    if (pendingNonce !== BigInt(0)) {
      return { canTrigger: false, reason: 'Draw already pending' };
    }

    // Check if cycle is already completed
    const cycleCompleted = await publicClient.readContract({
      address: poolAddress,
      abi: SancaPoolAbi,
      functionName: 'cycleCompleted',
      args: [poolInfo.currentCycle],
    });

    if (cycleCompleted) {
      return { canTrigger: false, reason: 'Cycle already completed' };
    }

    // Note: We don't check contribution count here because:
    // 1. Contract's _executeDraw() will automatically liquidate missing contributions
    // 2. Contract will check if all members contributed (or liquidated) internally
    // 3. If liquidation fails (insufficient collateral), contract will revert with clear error
    
    // We can still check contribution count for informational purposes
    const cycleContributionCount = await publicClient.readContract({
      address: poolAddress,
      abi: SancaPoolAbi,
      functionName: 'cycleContributionCount',
      args: [poolInfo.currentCycle],
    });

    const contributionInfo = Number(cycleContributionCount) < poolInfo.maxMembers
      ? ` (${cycleContributionCount}/${poolInfo.maxMembers} contributed - will auto-liquidate)`
      : '';

    return { canTrigger: true, contributionInfo };
  } catch (error: any) {
    return { canTrigger: false, reason: `Error: ${error.message}` };
  }
}

async function triggerDraw(
  walletClient: ReturnType<typeof createWalletClient>,
  poolAddress: Address
): Promise<boolean> {
  try {
    log(`   🔄 Triggering draw...`, 'cyan');
    
    // autoDraw should already be in SancaPoolAbi
    const hash = await walletClient.writeContract({
      address: poolAddress,
      abi: SancaPoolAbi,
      functionName: 'autoDraw',
    } as any); // Type assertion needed due to ABI type complexity

    log(`   ✅ Draw triggered! Tx: ${hash}`, 'green');
    log(`   📋 View on explorer: https://explorer.sepolia.mantle.xyz/tx/${hash}`, 'cyan');
    
    return true;
  } catch (error: any) {
    log(`   ❌ Failed to trigger draw: ${error.message}`, 'red');
    return false;
  }
}

async function checkAndTriggerDraws() {
  const { publicClient, walletClient } = await initClients();
  
  log(`\n=== Sanca Auto-Draw Service ===`, 'cyan', true);
  log(`Factory: ${FACTORY_ADDRESS}`, 'cyan');
  log(`Account: ${walletClient.account.address}`, 'cyan');
  log(`Time: ${new Date().toLocaleString()}`, 'cyan');
  log('');

  try {
    const pools = await getAllPools(publicClient);
    log(`Found ${pools.length} pools`, 'cyan');

    if (pools.length === 0) {
      log('No pools found.', 'yellow');
      return;
    }

    let triggeredCount = 0;
    let checkedCount = 0;

    for (const poolAddress of pools) {
      checkedCount++;
      log(`\n[${checkedCount}/${pools.length}] Pool: ${poolAddress}`, 'cyan');

      const canTrigger = await canTriggerDraw(publicClient, poolAddress);
      
      if (!canTrigger.canTrigger) {
        log(`   ⏭️  Skipping: ${canTrigger.reason}`, 'yellow');
        continue;
      }

      log(`   ✅ Can trigger draw!${canTrigger.contributionInfo || ''}`, 'green');
      const success = await triggerDraw(walletClient, poolAddress);
      
      if (success) {
        triggeredCount++;
      }

      // Small delay between transactions
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    log(`\n=== Summary ===`, 'cyan', true);
    log(`Checked: ${checkedCount} pools`, 'cyan');
    log(`Triggered: ${triggeredCount} draws`, triggeredCount > 0 ? 'green' : 'cyan');
    log('');

  } catch (error: any) {
    log(`❌ Error: ${error.message}`, 'red');
    console.error(error);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const watchMode = args.includes('--watch') || args.includes('-w');
  const once = args.includes('--once') || args.includes('-o');

  if (!FACTORY_ADDRESS || FACTORY_ADDRESS === '0x0000000000000000000000000000000000000000') {
    log('❌ Error: FACTORY_ADDRESS not set in environment variables', 'red');
    process.exit(1);
  }

  if (watchMode) {
    log('🔄 Watch mode enabled (checking every 60 seconds)', 'cyan', true);
    log('Press Ctrl+C to stop.\n', 'yellow');

    // Run immediately
    await checkAndTriggerDraws();

    // Then run every 60 seconds
    setInterval(async () => {
      await checkAndTriggerDraws();
    }, 60000);
  } else {
    // Run once
    await checkAndTriggerDraws();
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
