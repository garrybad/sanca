// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {USDC} from "../src/MockUSDC.sol";

/**
 * @title DeployUSDC
 * @notice Deployment script for custom USDC token with logoURI
 * @dev Deploys USDC token with IPFS logo URI
 */
contract DeployUSDC is Script {
    // Default values (can be overridden via environment variables)
    string constant DEFAULT_NAME = "USD Coin";
    string constant DEFAULT_SYMBOL = "USDC";
    string constant DEFAULT_LOGO_URI = "ipfs://bafkreiev6flgstwgefqpaieahshidfhz4czgbvryxbtusqzwarmp4mmkfu";
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        // Get parameters from environment or use defaults
        string memory tokenName = vm.envOr("USDC_NAME", DEFAULT_NAME);
        string memory tokenSymbol = vm.envOr("USDC_SYMBOL", DEFAULT_SYMBOL);
        string memory logoURI = vm.envOr("USDC_LOGO_URI", DEFAULT_LOGO_URI);
        
        // Minter role address (for simplicity, use deployer by default)
        // If you need a different minter, you can grant MINTER_ROLE after deployment
        address minterRole = deployer;
        
        console.log("Deploying Custom USDC Token...");
        console.log("Deployer:", deployer);
        console.log("Token Name:", tokenName);
        console.log("Token Symbol:", tokenSymbol);
        console.log("Logo URI:", logoURI);
        console.log("Minter Role:", minterRole);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy USDC with logoURI
        USDC usdc = new USDC(
            tokenName,
            tokenSymbol,
            minterRole,
            logoURI
        );
        
        console.log("\n=== USDC Deployment Successful ===");
        console.log("USDC Address:", address(usdc));
        console.log("Name:", tokenName);
        console.log("Symbol:", tokenSymbol);
        console.log("Decimals: 6");
        console.log("Logo URI:", logoURI);
        console.log("Minter Role:", minterRole);
        
        vm.stopBroadcast();
        
        console.log("\nNext steps:");
        console.log("1. Mint tokens to your wallet:");
        console.log("   cast send");
        console.log("   USDC Address:", address(usdc));
        console.log("   Command: mint(address,uint256)");
        console.log("   Deployer:", deployer);
        console.log("   Amount: 1000000e6");
        console.log("   --rpc-url mantle-sepolia --private-key $PRIVATE_KEY");
        console.log("\n2. Update SancaFactory to use this USDC:");
        console.log("   cast send <FACTORY_ADDRESS> \"setUSDC(address)\"");
        console.log("   USDC Address:", address(usdc));
        console.log("   --rpc-url mantle-sepolia --private-key $PRIVATE_KEY");
        console.log("\n3. Update frontend .env:");
        console.log("   NEXT_PUBLIC_USDC_ADDRESS=");
        console.log("   USDC Address:", address(usdc));
        console.log("\n4. Verify contract on Mantle Sepolia explorer");
    }
}

