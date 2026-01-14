#!/usr/bin/env node

/**
 * Auto-whitelist service for Sanca pools
 * Automatically whitelists new pools in Supra Deposit Contract
 * 
 * This service monitors the SancaFactory contract for new pools and
 * automatically whitelists them in the Supra VRF Deposit Contract.
 * 
 * Usage:
 *   npm run whitelist:once    # Run once
 *   npm run whitelist:watch    # Watch mode (every 30 seconds)
 */

import { createPublicClient, createWalletClient, http, type Address, defineChain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { SancaFactoryAbi } from '../ponder/abis/SancaFactoryAbi';
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
// Try multiple paths to find .env file
const envPaths = [
  path.join(__dirname, '..', 'contracts', '.env'),
  path.join(__dirname, '..', '.env'),
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

// Configuration
const FACTORY_ADDRESS = (process.env.FACTORY_ADDRESS || 
  process.env.SANCA_FACTORY || 
  '0x84c9dcDFd5CD9CfC464bB1418b838746AAFfD56C') as `0x${string}`;

const DEPOSIT_CONTRACT = (process.env.DEPOSIT_CONTRACT || 
  '0xd6675f4fD26119bF729B0fF912c28022a63Ae0a9') as `0x${string}`;

const RPC_URL = process.env.RPC_URL || 'https://rpc.sepolia.mantle.xyz';

// 1000 GWEI = 1000 * 1e9 wei = 1_000_000_000_000 wei
const CALLBACK_GAS_PRICE = BigInt(process.env.CALLBACK_GAS_PRICE || '1000000000');
const CALLBACK_GAS_LIMIT = BigInt(process.env.CALLBACK_GAS_LIMIT || '8000000000');

// Supra Deposit Contract ABI (minimal interface)
const SUPRA_DEPOSIT_ABI = [
  {
    inputs: [
      { internalType: 'address', name: '_clientAddress', type: 'address' },
      { internalType: 'address', name: '_contractAddress', type: 'address' },
    ],
    name: 'isContractWhitelisted',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '_contractAddress', type: 'address' },
      { internalType: 'uint128', name: '_callbackGasPrice', type: 'uint128' },
      { internalType: 'uint128', name: '_callbackGasLimit', type: 'uint128' },
    ],
    name: 'addContractToWhitelist',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

// Colors for console output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

type LogColor = 'green' | 'yellow' | 'red' | 'blue' | 'cyan' | 'reset';

function log(message: string, color: LogColor = 'reset', bold = false) {
  const colorCode = colors[color] || colors.reset;
  const boldCode = bold ? colors.bold : '';
  console.log(`${boldCode}${colorCode}${message}${colors.reset}`);
}

// Explorer URL helper
function getExplorerUrl(txHash: string): string {
  return `https://explorer.sepolia.mantle.xyz/tx/${txHash}`;
}

// Initialize clients
function initClients() {
  if (!process.env.PRIVATE_KEY) {
    throw new Error('❌ PRIVATE_KEY not set in .env file');
  }

  const privateKey = process.env.PRIVATE_KEY.trim();
  if (!privateKey.startsWith('0x')) {
    throw new Error('❌ PRIVATE_KEY must start with 0x');
  }

  if (privateKey.length !== 66) {
    throw new Error('❌ PRIVATE_KEY must be 66 characters (0x + 64 hex chars)');
  }

  let account;
  try {
    account = privateKeyToAccount(privateKey as `0x${string}`);
  } catch (error: any) {
    throw new Error(`❌ Invalid PRIVATE_KEY: ${error.message}`);
  }

  const publicClient = createPublicClient({
    chain: mantleSepolia,
    transport: http(RPC_URL),
  });

  const walletClient = createWalletClient({
    account,
    chain: mantleSepolia,
    transport: http(RPC_URL),
  });

  log(`👤 Using account: ${account.address}`, 'cyan');

  return { publicClient, walletClient, account };
}

/**
 * Get client wallet address from Factory
 */
async function getClientWalletAddress(
  publicClient: ReturnType<typeof createPublicClient>
): Promise<Address> {
  try {
    const clientAddress = await publicClient.readContract({
      address: FACTORY_ADDRESS,
      abi: SancaFactoryAbi,
      functionName: 'clientWalletAddress',
    }) as Address;
    return clientAddress;
  } catch (error: any) {
    log(`❌ Failed to get client wallet address from Factory: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * Check if a pool is already whitelisted
 */
async function isWhitelisted(
  publicClient: ReturnType<typeof createPublicClient>,
  clientAddress: Address,
  poolAddress: Address
): Promise<boolean> {
  try {
    const result = await publicClient.readContract({
      address: DEPOSIT_CONTRACT,
      abi: SUPRA_DEPOSIT_ABI,
      functionName: 'isContractWhitelisted',
      args: [clientAddress, poolAddress],
    });
    return result as boolean;
  } catch (error: any) {
    log(`❌ Failed to check whitelist status for ${poolAddress}: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * Whitelist a pool in Supra Deposit Contract
 * Note: This function assumes the pool is NOT already whitelisted
 */
async function whitelistPool(
  publicClient: ReturnType<typeof createPublicClient>,
  walletClient: ReturnType<typeof createWalletClient>,
  poolAddress: Address
): Promise<{ success: boolean; txHash?: string }> {
  try {
    log(`🔄 Attempting to whitelist pool: ${poolAddress}`, 'yellow');

    if (!walletClient.account) {
      throw new Error('Wallet client account is not set');
    }

    // Whitelist the pool
    const hash = await walletClient.writeContract({
      chain: mantleSepolia,
      address: DEPOSIT_CONTRACT,
      abi: SUPRA_DEPOSIT_ABI,
      functionName: 'addContractToWhitelist',
      args: [poolAddress, CALLBACK_GAS_PRICE, CALLBACK_GAS_LIMIT],
      account: walletClient.account,
    });

    log(`📝 Transaction submitted: ${hash}`, 'cyan');
    log(`   Explorer: ${getExplorerUrl(hash)}`, 'cyan');

    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    
    if (receipt.status === 'success') {
      log(`✅ Pool whitelisted successfully: ${poolAddress}`, 'green');
      log(`   Transaction: ${receipt.transactionHash}`, 'green');
      log(`   Block: ${receipt.blockNumber}`, 'green');
      return { success: true, txHash: receipt.transactionHash };
    } else {
      log(`❌ Transaction failed for pool: ${poolAddress}`, 'red');
      return { success: false };
    }
  } catch (error: any) {
    log(`❌ Failed to whitelist pool ${poolAddress}: ${error.message}`, 'red');
    if (error.cause) {
      log(`   Cause: ${error.cause}`, 'red');
    }
    return { success: false };
  }
}

/**
 * Get all pools from Factory and whitelist new ones
 */
async function checkAndWhitelist() {
  const { publicClient, walletClient, account } = initClients();

  log('🔍 Checking for new pools to whitelist...', 'yellow');
  log('', 'reset');

  try {
    // Get client wallet address from Factory
    const clientAddress = await getClientWalletAddress(publicClient);
    log(`👤 Client Wallet Address: ${clientAddress}`, 'cyan');
    log('', 'reset');

    // Get pool count
    const poolCount = await publicClient.readContract({
      address: FACTORY_ADDRESS,
      abi: SancaFactoryAbi,
      functionName: 'getPoolCount',
    });

    const poolCountNum = Number(poolCount);
    log(`📊 Total pools found in Factory: ${poolCountNum}`, 'cyan');
    
    if (poolCountNum === 0) {
      log('ℹ️  No pools found. Nothing to whitelist.', 'yellow');
      return { successCount: 0, failCount: 0, skippedCount: 0 };
    }

    log(`📋 Found ${poolCountNum} pool(s):`, 'cyan');
    log('', 'reset');

    let successCount = 0;
    let failCount = 0;
    let skippedCount = 0;
    const poolAddresses: Address[] = [];

    // First, collect all pool addresses
    for (let i = 0; i < poolCountNum; i++) {
      try {
        const poolAddress = await publicClient.readContract({
          address: FACTORY_ADDRESS,
          abi: SancaFactoryAbi,
          functionName: 'getPool',
          args: [BigInt(i)],
        }) as Address;

        poolAddresses.push(poolAddress);
        log(`   ${i + 1}. ${poolAddress}`, 'cyan');
      } catch (error: any) {
        log(`❌ Error fetching pool at index ${i}: ${error.message}`, 'red');
        failCount++;
      }
    }

    log('', 'reset');

    // Process each pool
    for (let i = 0; i < poolAddresses.length; i++) {
      const poolAddress = poolAddresses[i];
      
      try {
        // Check if already whitelisted first
        const alreadyWhitelisted = await isWhitelisted(publicClient, clientAddress, poolAddress);
        if (alreadyWhitelisted) {
          log(`⏭️  Pool already whitelisted: ${poolAddress}`, 'yellow');
          skippedCount++;
          continue;
        }

        // Whitelist the pool
        const result = await whitelistPool(publicClient, walletClient, poolAddress);
        
        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error: any) {
        log(`❌ Error processing pool ${poolAddress}: ${error.message}`, 'red');
        failCount++;
        // Continue to next pool
      }
      
      // Small delay between transactions to avoid rate limiting
      if (i < poolAddresses.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // Summary
    log('', 'reset');
    log('==================================================', 'cyan', true);
    log('📊 Summary:', 'yellow', true);
    log('==================================================', 'cyan');
    log(`✅ Succeeded: ${successCount}`, successCount > 0 ? 'green' : 'reset');
    log(`❌ Failed: ${failCount}`, failCount > 0 ? 'red' : 'reset');
    log(`⏭️  Skipped (already whitelisted): ${skippedCount}`, skippedCount > 0 ? 'yellow' : 'reset');
    log(`📝 Total: ${poolAddresses.length}`, 'cyan');
    log('==================================================', 'cyan');
    log('✅ Finished checking pools.', 'green');

    return { successCount, failCount, skippedCount };
  } catch (error: any) {
    log(`❌ Fatal error: ${error.message}`, 'red');
    if (error.stack) {
      log(`   Stack: ${error.stack}`, 'red');
    }
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  const mode = process.argv[2] || '--once';

  // Header
  log('', 'reset');
  log('🚀 Sanca Auto-Whitelist Service', 'cyan', true);
  log('==================================================', 'cyan');
  log(`📍 Factory: ${FACTORY_ADDRESS}`, 'yellow');
  log(`📍 Deposit Contract: ${DEPOSIT_CONTRACT}`, 'yellow');
  log(`🌐 RPC: ${RPC_URL}`, 'yellow');
  log(`⛽ Gas Price: ${CALLBACK_GAS_PRICE.toString()} wei (${Number(CALLBACK_GAS_PRICE) / 1e9} GWEI)`, 'yellow');
  log(`⛽ Gas Limit: ${CALLBACK_GAS_LIMIT.toString()}`, 'yellow');
  log('==================================================', 'cyan');
  log('', 'reset');

  if (mode === '--once') {
    log('🔄 Running one-time whitelist check...', 'yellow');
    log('', 'reset');
    await checkAndWhitelist();
    log('', 'reset');
    log('✅ Done!', 'green');
  } else if (mode === '--watch') {
    log('👀 Watching for new pools (every 30 seconds)...', 'green');
    log('Press Ctrl+C to stop', 'yellow');
    log('', 'reset');

    let iteration = 0;
    while (true) {
      try {
        iteration++;
        log(`\n🔄 Iteration #${iteration} - ${new Date().toISOString()}`, 'cyan', true);
        await checkAndWhitelist();
        log(`\n⏳ Waiting 30 seconds before next check...`, 'yellow');
        await new Promise((resolve) => setTimeout(resolve, 30000));
      } catch (error: any) {
        log(`\n❌ Error in watch loop: ${error.message}`, 'red');
        log('⏳ Retrying in 30 seconds...\n', 'yellow');
        await new Promise((resolve) => setTimeout(resolve, 30000));
      }
    }
  } else {
    log(`❌ Unknown mode: ${mode}`, 'red');
    log('', 'reset');
    log('Usage:', 'yellow', true);
    log('  npm run whitelist:once   # Run once', 'yellow');
    log('  npm run whitelist:watch  # Watch mode (every 30 seconds)', 'yellow');
    log('', 'reset');
    process.exit(1);
  }
}

// Run if called directly
main().catch((error) => {
  log(`Fatal error: ${error.message}`, 'red');
  process.exit(1);
});

export { checkAndWhitelist, whitelistPool, isWhitelisted };

