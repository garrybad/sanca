// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {SancaFactory} from "../src/SancaFactory.sol";
import {SancaPool} from "../src/SancaPool.sol";
import {MockmUSD} from "../src/MockmUSD.sol";
import {MockOracle} from "../src/MockOracle.sol";

/**
 * @title Deploy
 * @notice Deployment script for Sanca Arisan platform on Mantle Sepolia testnet
 * @dev Deploys: MockOracle, MockmUSD, SancaPool (implementation), SancaFactory
 * @dev Auto-whitelist is handled by backend cronjob script (scripts/auto-whitelist-pools.sh)
 */
contract Deploy is Script {
    // Mantle Sepolia addresses
    address constant USDC_SEPOLIA = 0xdd84FFAA4178Fb4549b0582a76d01bd1Fd5148bc;
    address constant SUPRA_ROUTER_SEPOLIA = 0x214F9eD5750D2fC87ae084184e999Ff7DFa1EB09;
    address constant SUPRA_DEPOSIT_SEPOLIA = 0xd6675f4fD26119bF729B0fF912c28022a63Ae0a9;
    
    // Mainnet addresses (for reference, not used in testnet)
    // address constant MUSD_MAINNET = 0xab575258d37EaA5C8956EfABe71F4eE8F6397cF3;
    // address constant USDY_MAINNET = 0x5be26527e817998A7206475496fDE1E68957c5a6;
    // address constant AGNI_ROUTER_MAINNET = <Agni router address>;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying Sanca Arisan Platform...");
        console.log("Deployer:", deployer);
        console.log("USDC Sepolia:", USDC_SEPOLIA);
        console.log("Supra Router Sepolia:", SUPRA_ROUTER_SEPOLIA);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Step 1: Deploy MockOracle
        console.log("\n1. Deploying MockOracle...");
        MockOracle oracle = new MockOracle();
        console.log("MockOracle deployed at:", address(oracle));
        
        // Step 2: Deploy MockmUSD
        console.log("\n2. Deploying MockmUSD...");
        MockmUSD musd = new MockmUSD(USDC_SEPOLIA, address(oracle));
        console.log("MockmUSD deployed at:", address(musd));
        
        // Step 3: Deploy SancaPool implementation
        console.log("\n3. Deploying SancaPool implementation...");
        SancaPool poolImplementation = new SancaPool();
        console.log("SancaPool implementation deployed at:", address(poolImplementation));
        
        // Step 4: Deploy SancaFactory
        console.log("\n4. Deploying SancaFactory...");
        // IMPORTANT: clientWalletAddress must be whitelisted EOA with sufficient balance in Deposit Contract
        // Before deployment, ensure:
        // 1. Whitelist deployer address in Deposit Contract: addClientToWhitelist(maxGasPrice, maxGasLimit)
        // 2. Deposit funds: depositFundClient() with sufficient balance
        SancaFactory factory = new SancaFactory(
            address(poolImplementation),
            USDC_SEPOLIA,
            address(musd),
            SUPRA_ROUTER_SEPOLIA,
            deployer // Use deployer as clientWalletAddress (must be whitelisted EOA)
        );
        console.log("SancaFactory deployed at:", address(factory));
        console.log("Client Wallet Address:", deployer);
        
        vm.stopBroadcast();
        
        // Summary
        console.log("\n=== Deployment Summary ===");
        console.log("MockOracle:", address(oracle));
        console.log("MockmUSD:", address(musd));
        console.log("SancaPool Implementation:", address(poolImplementation));
        console.log("SancaFactory:", address(factory));
        console.log("\nNext steps:");
        console.log("1. Whitelist deployer address in Supra Deposit Contract:");
        console.log("   - addClientToWhitelist(maxGasPrice, maxGasLimit)");
        console.log("   - Or use: ./scripts/whitelist-supra.sh");
        console.log("2. Deposit funds in Deposit Contract:");
        console.log("   - depositFundClient() with sufficient balance");
        console.log("   - Or use: ./scripts/whitelist-supra.sh");
        console.log("3. Setup backend cronjob for auto-whitelist:");
        console.log("   - Use: ./scripts/auto-whitelist-pools.sh");
        console.log("   - Run every 30 seconds or as needed");
        console.log("4. Verify contracts on Mantle Sepolia explorer");
        console.log("5. Create a test pool: factory.createPool(...)");
        console.log("6. Test the full cycle");
        console.log("\nNote:");
        console.log("- Auto-whitelist is handled by backend cronjob script");
        console.log("- Manual whitelist available via dashboard or script");
        console.log("\nMainnet upgrades needed:");
        console.log("- Replace MockmUSD with real mUSD wrapper");
        console.log("- Add DEX swap (Agni router) for USDC<->USDY");
        console.log("- Configure real USDY address");
    }
}

