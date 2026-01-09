# Oracle Service - Auto-Whitelist

TypeScript service for automatically whitelisting Sanca pools in the Supra VRF Deposit Contract. This service monitors the SancaFactory contract for new pools and automatically whitelists them, enabling VRF (Verifiable Random Function) functionality for pool draws.

## 📋 Overview

The Oracle Service is responsible for:
- Monitoring the SancaFactory contract for newly created pools
- Automatically whitelisting new pools in the Supra VRF Deposit Contract
- Checking whitelist status before attempting to whitelist (prevents duplicate transactions)
- Providing detailed logging and transaction tracking

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- A wallet with sufficient MNT balance for gas fees
- Access to the SancaFactory contract address
- The client wallet address must be whitelisted in the Supra Deposit Contract

### Installation

1. **Navigate to the oracle-service directory:**
   ```bash
   cd oracle-service
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   
   Create a `.env` file in the project root or `contracts/` directory with the following variables:
   
   ```bash
   # Required
   PRIVATE_KEY=0x your_private_key_here
   
   # Optional (defaults provided)
   FACTORY_ADDRESS=0x5117711063B5cd297E118E28E29Ed9628eEA9B28
   DEPOSIT_CONTRACT=0xd6675f4fD26119bF729B0fF912c28022a63Ae0a9
   RPC_URL=https://rpc.sepolia.mantle.xyz
   CALLBACK_GAS_PRICE=1000000000000  # 1000 GWEI in wei
   CALLBACK_GAS_LIMIT=500000
   ```

   **Important:** The `.env` file will be automatically searched in these locations (in order):
   - `../contracts/.env`
   - `../.env`
   - `./.env`

### Running the Service

#### Option 1: Run Once (Testing)

Execute a single whitelist check:

```bash
npm run whitelist:once
```

#### Option 2: Watch Mode (Production)

Continuously monitor for new pools (checks every 30 seconds):

```bash
npm run whitelist:watch
```

Press `Ctrl+C` to stop the watch mode.

## 📖 Usage

### Command Line Arguments

The service accepts the following modes:

- `--once` (default): Run a single whitelist check and exit
- `--watch`: Continuously monitor for new pools every 30 seconds

### Example Output

```
🚀 Sanca Auto-Whitelist Service
==================================================
📍 Factory: 0x5117711063B5cd297E118E28E29Ed9628eEA9B28
📍 Deposit Contract: 0xd6675f4fD26119bF729B0fF912c28022a63Ae0a9
🌐 RPC: https://rpc.sepolia.mantle.xyz
⛽ Gas Price: 1000000000000 wei (1000 GWEI)
⛽ Gas Limit: 500000
==================================================

🔄 Running one-time whitelist check...

👤 Using account: 0x2C768a20873a479bA9c1ACac17af5c2bB5b7cFDd
🔍 Checking for new pools to whitelist...

👤 Client Wallet Address: 0x2C768a20873a479bA9c1ACac17af5c2bB5b7cFDd

📊 Total pools found in Factory: 2
📋 Found 2 pool(s):

   1. 0x7D82a538CD1eD9b0223FE4b3eC8007dA0aFddf83
   2. 0x2Eae6ef93176050f245e106cAFA4F91cB13fF71B

⏭️  Pool already whitelisted: 0x7D82a538CD1eD9b0223FE4b3eC8007dA0aFddf83
🔄 Attempting to whitelist pool: 0x2Eae6ef93176050f245e106cAFA4F91cB13fF71B
📝 Transaction submitted: 0xabc123...
   Explorer: https://explorer.sepolia.mantle.xyz/tx/0xabc123...
✅ Pool whitelisted successfully: 0x2Eae6ef93176050f245e106cAFA4F91cB13fF71B
   Transaction: 0xabc123...
   Block: 12345678

==================================================
📊 Summary:
==================================================
✅ Succeeded: 1
❌ Failed: 0
⏭️  Skipped (already whitelisted): 1
📝 Total: 2
==================================================
✅ Finished checking pools.

✅ Done!
```

## ⚙️ Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PRIVATE_KEY` | ✅ Yes | - | Private key of the wallet used for whitelisting (must start with `0x`) |
| `FACTORY_ADDRESS` | ❌ No | `0x5117711063B5cd297E118E28E29Ed9628eEA9B28` | SancaFactory contract address |
| `DEPOSIT_CONTRACT` | ❌ No | `0xd6675f4fD26119bF729B0fF912c28022a63Ae0a9` | Supra VRF Deposit Contract address |
| `RPC_URL` | ❌ No | `https://rpc.sepolia.mantle.xyz` | RPC endpoint URL |
| `CALLBACK_GAS_PRICE` | ❌ No | `1000000000000` | Max gas price for Supra callbacks (in wei) |
| `CALLBACK_GAS_LIMIT` | ❌ No | `500000` | Max gas limit for Supra callbacks |

### Important Notes

1. **Client Wallet Address**: The service automatically retrieves the `clientWalletAddress` from the SancaFactory contract. This address must be:
   - Whitelisted in the Supra Deposit Contract
   - Have sufficient balance for VRF requests

2. **Private Key Security**: 
   - Never commit your `.env` file to version control
   - Use secure key management for production environments
   - Consider using hardware wallets or key management services

3. **Gas Costs**: 
   - Each whitelist transaction consumes gas
   - Ensure the wallet has sufficient MNT balance

## 🔧 Development

### Build

Compile TypeScript to JavaScript:

```bash
npm run build
```

The compiled output will be in the `dist/` directory.

### Run Compiled Version

After building, you can run the compiled JavaScript:

```bash
npm start
```

## 📊 Monitoring

### Check Service Status

If running in watch mode, the service will:
- Display iteration numbers
- Show timestamps for each check
- Continue running until manually stopped

### Transaction Tracking

Each whitelist transaction includes:
- Transaction hash
- Block explorer link
- Block number
- Success/failure status

## 🐛 Troubleshooting

### Common Issues

#### 1. "PRIVATE_KEY not set in .env file"

**Solution:** Ensure your `.env` file exists and contains a valid `PRIVATE_KEY` starting with `0x`.

#### 2. "Failed to check whitelist status"

**Possible causes:**
- Client wallet address is not whitelisted in Deposit Contract
- RPC endpoint is unreachable
- Contract addresses are incorrect

**Solution:** 
- Verify the client wallet address is whitelisted
- Check RPC URL connectivity
- Verify contract addresses

#### 3. "Transaction failed"

**Possible causes:**
- Insufficient gas
- Insufficient balance
- Invalid contract address
- Permission denied

**Solution:**
- Ensure wallet has sufficient MNT balance
- Check gas settings
- Verify contract addresses and permissions

#### 4. "Failed to get client wallet address from Factory"

**Solution:** Verify the `FACTORY_ADDRESS` is correct and the contract is deployed.

### Debug Mode

For more detailed error information, check the console output. The service provides colored logging to help identify issues:
- 🟢 Green: Success messages
- 🟡 Yellow: Warning/info messages
- 🔴 Red: Error messages
- 🔵 Cyan: Informational messages

## 📚 Related Documentation

- [CRONJOB_SETUP.md](./CRONJOB_SETUP.md) - Production deployment guide (systemd, cron, etc.)
- [SancaFactory Contract](../../contracts/src/SancaFactory.sol) - Factory contract documentation
- [Supra VRF Documentation](https://docs.supranet.io/) - Supra VRF official documentation

## 🔐 Security Best Practices

1. **Never commit sensitive data:**
   - Add `.env` to `.gitignore`
   - Use environment variables in production

2. **Use secure key management:**
   - Consider using hardware wallets
   - Use key management services (AWS Secrets Manager, HashiCorp Vault, etc.)

3. **Limit permissions:**
   - Use a dedicated wallet for whitelisting
   - Only grant necessary permissions

4. **Monitor transactions:**
   - Regularly check transaction history
   - Set up alerts for failed transactions

## 📝 License

ISC

## 🤝 Contributing

When contributing to this service:
1. Follow TypeScript best practices
2. Maintain error handling standards
3. Update documentation for any changes
4. Test thoroughly before submitting

---

**For production deployment, see [CRONJOB_SETUP.md](./CRONJOB_SETUP.md)** 🚀

