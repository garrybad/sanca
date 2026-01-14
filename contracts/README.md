## Foundry

**Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.**

Foundry consists of:

- **Forge**: Ethereum testing framework (like Truffle, Hardhat and DappTools).
- **Cast**: Swiss army knife for interacting with EVM smart contracts, sending transactions and getting chain data.
- **Anvil**: Local Ethereum node, akin to Ganache, Hardhat Network.
- **Chisel**: Fast, utilitarian, and verbose solidity REPL.

## Documentation

https://book.getfoundry.sh/

## Usage

### Build

```shell
$ forge build
```

### Test

```shell
$ forge test
```

### Format

```shell
$ forge fmt
```

### Gas Snapshots

```shell
$ forge snapshot
```

### Anvil (Local Node)

```shell
$ anvil
```

### Deploy Contracts

#### Prerequisites

1. Set up environment variables in `.env` file:
```bash
PRIVATE_KEY=your_private_key_here
MANTLE_SEPOLIA_URL=https://mantle-sepolia.g.alchemy.com/v2/API_KEY # Mantle Sepolia
ETHERSCAN_API_KEY=API_KEY
```

2. Ensure you have sufficient MNT tokens for gas fees.

#### Deployment Steps

**Option 1: Deploy Custom USDC Token (Recommended)**

If you want to deploy your own USDC token with logoURI:

1. **Deploy USDC Token**:
```shell
$ forge script script/DeployUSDC.s.sol:DeployUSDC \
  --rpc-url mantle-sepolia \
  --broadcast \
  --verify
```

This will deploy USDC with:
- Name: "USD Coin" (or set `USDC_NAME` env var)
- Symbol: "USDC" (or set `USDC_SYMBOL` env var)
- Logo URI: IPFS CID `bafkreiev6flgstwgefqpaieahshidfhz4czgbvryxbtusqzwarmp4mmkfu` (or set `USDC_LOGO_URI` env var)
- Minter Role: Deployer address (or set `USDC_MINTER_ROLE` env var)

**Customize deployment** (optional, via `.env`):
```bash
USDC_NAME="USD Coin"
USDC_SYMBOL="USDC"
USDC_LOGO_URI="ipfs://bafkreiev6flgstwgefqpaieahshidfhz4czgbvryxbtusqzwarmp4mmkfu"
USDC_MINTER_ROLE=0xYourMinterAddress  # Optional, defaults to deployer
```

2. **Mint tokens to your wallet**:
```shell
$ cast send <USDC_ADDRESS> "mint(address,uint256)" <YOUR_WALLET> 1000000e6 \
  --rpc-url mantle-sepolia \
  --private-key $PRIVATE_KEY
```

3. **Deploy Sanca Platform** (use your USDC address):
```shell
# Update Deploy.s.sol to use your USDC address, or deploy manually
$ forge script script/Deploy.s.sol:Deploy \
  --rpc-url mantle-sepolia \
  --broadcast \
  --verify
```

4. **Update SancaFactory to use your USDC**:
```shell
$ cast send <FACTORY_ADDRESS> "setUSDC(address)" <YOUR_USDC_ADDRESS> \
  --rpc-url mantle-sepolia \
  --private-key $PRIVATE_KEY
```

**Option 2: Use Existing USDC (Mantle Sepolia)**

If you want to use the existing USDC on Mantle Sepolia:

1. **Deploy to Mantle Sepolia (Testnet)**:
```shell
$ forge script script/Deploy.s.sol:Deploy \
  --rpc-url mantle-sepolia \
  --broadcast \
  --verify
```

#### Deployment Order

The deployment script (`Deploy.s.sol`) deploys contracts in the following order:

1. **MockOracle** - Oracle for MockmUSD price calculation
2. **MockmUSD** - Mock rebasing token (testnet only)
3. **SancaPool** - Pool implementation contract
4. **SancaFactory** - Factory contract for creating pools

**Note**: If deploying custom USDC, deploy it first, then deploy the Sanca platform contracts.

#### Post-Deployment

After deployment, update the following files with the deployed addresses:

- `lib/contracts.ts` - Frontend contract addresses
- `ponder/ponder.config.ts` - Ponder indexer configuration
- Environment variables for frontend

#### Example Deployment Output

```
Deploying Sanca Arisan Platform...
Deployer: 0x...
USDC Sepolia: 0xAcab8129E2cE587fD203FD770ec9ECAFA2C88080
Supra Router Sepolia: 0x...

1. Deploying MockOracle...
MockOracle deployed at: 0x...

2. Deploying MockmUSD...
MockmUSD deployed at: 0x...

3. Deploying SancaPool implementation...
SancaPool implementation deployed at: 0x...

4. Deploying SancaFactory...
SancaFactory deployed at: 0x...
Client Wallet Address: 0x...
```

### Cast (Interact with Contracts)

```shell
# Get contract balance
$ cast balance <contract_address> --rpc-url $RPC_URL_5003

# Call a view function
$ cast call <contract_address> "functionName()" --rpc-url $RPC_URL_5003

# Send a transaction
$ cast send <contract_address> "functionName()" --private-key $PRIVATE_KEY --rpc-url $RPC_URL_5003
```

### Help

```shell
$ forge --help
$ anvil --help
$ cast --help
```

## Contract Architecture

### SancaFactory
- Factory contract using EIP-1167 minimal proxy pattern
- Creates new SancaPool instances efficiently
- Manages global configurations (USDC, mUSD, Supra Router, etc.)

### SancaPool
- Individual ROSCA pool contract
- Manages pool lifecycle (Open → Active → Completed)
- Handles member contributions, draws, and payouts
- Integrates with Supra VRF for random winner selection
- Distributes yield from Ondo mUSD

### MockmUSD (Testnet Only)
- Mock rebasing token for testing
- Simulates Ondo mUSD behavior
- Will be replaced with real Ondo mUSD on mainnet

## Testing

Run all tests:
```shell
$ forge test
```

Run specific test file:
```shell
$ forge test --match-path test/Sanca.t.sol
```

Run with verbosity:
```shell
$ forge test -vvv
```

## Security

- All contracts use OpenZeppelin's security libraries
- ReentrancyGuard protection on all external calls
- Input validation on all user inputs
- Access control for critical functions
