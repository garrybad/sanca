#!/bin/bash

# Script to automatically whitelist new pools in Supra
# Usage: ./scripts/auto-whitelist-pools.sh [--once]

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# --- Configuration ---
FACTORY_ADDRESS="0x6AAfB01675De23d9c9117b6Ab27301FE076d661e" # Update with your deployed SancaFactory address
DEPOSIT_CONTRACT="0xd6675f4fD26119bF729B0fF912c28022a63Ae0a9"
RPC_URL="https://rpc.sepolia.mantle.xyz"
# 1000 GWEI = 1000 * 1e9 wei = 1_000_000_000_000 wei
CALLBACK_GAS_PRICE=1000000000000 # 1000 GWEI (in wei)
CALLBACK_GAS_LIMIT=500000
# --- End Configuration ---

# Load .env
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    exit 1
fi

source .env

if [ -z "$PRIVATE_KEY" ]; then
    echo -e "${RED}Error: PRIVATE_KEY not set in .env${NC}"
    exit 1
fi

# Function to whitelist a pool
whitelist_pool() {
    local pool_address=$1
    echo -e "${YELLOW}Attempting to whitelist pool: $pool_address${NC}"

    # Check if already whitelisted
    local is_whitelisted
    is_whitelisted=$(cast call "$DEPOSIT_CONTRACT" \
      "isContractWhitelisted(address)" \
      "$pool_address" \
      --rpc-url "$RPC_URL")

    if [ "$is_whitelisted" == "true" ]; then
        echo -e "${GREEN}✅ Pool already whitelisted: $pool_address${NC}"
        return 0
    fi

    # Whitelist if not already
    cast send "$DEPOSIT_CONTRACT" \
      "addContractToWhitelist(address,uint128,uint128)" \
      "$pool_address" \
      "$CALLBACK_GAS_PRICE" \
      "$CALLBACK_GAS_LIMIT" \
      --rpc-url "$RPC_URL" \
      --private-key "$PRIVATE_KEY"

    echo -e "${GREEN}✅ Pool whitelisted: $pool_address${NC}"
}

# Function to get all pools and whitelist new ones
check_and_whitelist() {
    echo -e "${YELLOW}Checking for new pools to whitelist...${NC}"

    local pool_count
    pool_count=$(cast call "$FACTORY_ADDRESS" \
      "getPoolCount()" \
      --rpc-url "$RPC_URL" | cast --to-dec)

    echo "Total pools found in Factory: $pool_count"

    for (( i=0; i<pool_count; i++ )); do
        local pool_address
        pool_address=$(cast call "$FACTORY_ADDRESS" \
          "getPool(uint256)" \
          "$i" \
          --rpc-url "$RPC_URL")
        
        whitelist_pool "$pool_address"
    done
    echo -e "${GREEN}Finished checking pools.${NC}"
}

# Main execution
if [ "$1" == "--once" ]; then
    echo -e "${YELLOW}Running one-time whitelist check...${NC}"
    check_and_whitelist
else
    echo -e "${GREEN}Watching for new pools (every 30 seconds)...${NC}"
    echo "Press Ctrl+C to stop"

    while true; do
        check_and_whitelist
        sleep 30 # Check every 30 seconds
    done
fi


