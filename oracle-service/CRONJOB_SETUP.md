# ⏰ Auto-Whitelist Service Setup

Auto-whitelist pools are handled by a TypeScript service that directly interacts with smart contracts using viem.

## 📋 Service

**File:** `oracle-service/auto-whitelist.ts`

**Features:**
- Monitor Factory contract for new pools
- Auto-whitelist new pools to Supra Deposit Contract
- Log all activities with colored output
- Robust error handling
- Direct blockchain interaction (no need for cast/Foundry)

## 🚀 Setup Guide

### Prerequisites

Install dependencies:
```bash
cd oracle-service
npm install
```

### Option 1: Run Manual (Testing)

```bash
cd oracle-service

# Run once
npm run whitelist:once

# Run continuous (monitor every 30 seconds)
npm run whitelist:watch
```

### Option 2: Systemd Service (Production)

**Create service file:** `/etc/systemd/system/sanca-auto-whitelist.service`

```ini
[Unit]
Description=Sanca Auto-Whitelist Service
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/sanca/oracle-service
Environment="PRIVATE_KEY=your_private_key"
Environment="FACTORY_ADDRESS=0x5117711063B5cd297E118E28E29Ed9628eEA9B28"
Environment="DEPOSIT_CONTRACT=0xd6675f4fD26119bF729B0fF912c28022a63Ae0a9"
ExecStart=/usr/bin/npm run whitelist:watch
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Enable & Start:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable sanca-auto-whitelist
sudo systemctl start sanca-auto-whitelist
sudo systemctl status sanca-auto-whitelist
```

### Option 3: Cron Job

**Edit crontab:**
```bash
crontab -e
```

**Add entry (run every minute):**
```cron
* * * * * cd /path/to/sanca/oracle-service && npm run whitelist:once >> /var/log/sanca/cron.log 2>&1
```

**Or every 30 seconds:**
```cron
* * * * * cd /path/to/sanca/oracle-service && npm run whitelist:once >> /var/log/sanca/cron.log 2>&1
* * * * * sleep 30 && cd /path/to/sanca/oracle-service && npm run whitelist:once >> /var/log/sanca/cron.log 2>&1
```

## 🔧 Configuration

### Environment Variables

Create `.env` file in root project directory or `contracts/` directory:

```bash
# Required
PRIVATE_KEY=your_private_key_here

# Optional (defaults provided)
FACTORY_ADDRESS=0x5117711063B5cd297E118E28E29Ed9628eEA9B28
DEPOSIT_CONTRACT=0xd6675f4fD26119bF729B0fF912c28022a63Ae0a9
RPC_URL=https://rpc.sepolia.mantle.xyz
CALLBACK_GAS_PRICE=1000000000000  # 1000 GWEI in wei
CALLBACK_GAS_LIMIT=500000
```

**Required:**
- `PRIVATE_KEY` - Deployer private key (must have permission to whitelist in Supra)

**Optional:**
- `FACTORY_ADDRESS` - Factory address (default: latest deployment)
- `DEPOSIT_CONTRACT` - Supra Deposit Contract (default: Mantle Sepolia)
- `RPC_URL` - RPC endpoint (default: Mantle Sepolia)
- `CALLBACK_GAS_PRICE` - Max gas price for Supra callbacks (default: 1000 GWEI)
- `CALLBACK_GAS_LIMIT` - Max gas limit for Supra callbacks (default: 500000)

## 📊 Monitoring

### Check Logs

```bash
# View logs
tail -f /var/log/sanca/auto-whitelist.log

# Check last 50 lines
tail -50 /var/log/sanca/auto-whitelist.log

# Search for errors
grep -i error /var/log/sanca/auto-whitelist.log
```

### Check Service Status

```bash
# If using systemd
sudo systemctl status sanca-auto-whitelist

# Check if running
ps aux | grep auto-whitelist
```

## 🧪 Testing

### Test Script

```bash
# Test run once
cd oracle-service
npm run whitelist:once

# Check output (if using logging)
cat /var/log/sanca/auto-whitelist.log
```

### Verify Whitelist

**Using cast (Foundry):**
```bash
# Check if pool is whitelisted
# Note: isContractWhitelisted requires 2 parameters: clientAddress and contractAddress
cast call 0xd6675f4fD26119bF729B0fF912c28022a63Ae0a9 \
  "isContractWhitelisted(address,address)" \
  <CLIENT_ADDRESS> \
  <POOL_ADDRESS> \
  --rpc-url https://rpc.sepolia.mantle.xyz
```

**Or check on explorer:**
- Visit: https://explorer.sepolia.mantle.xyz/address/0xd6675f4fD26119bF729B0fF912c28022a63Ae0a9
- Check contract read functions

## ⚠️ Important Notes

1. **Private Key Security:**
   - Never commit `.env` file
   - Use secure key management for production
   - Consider using hardware wallet or key management service

2. **Gas Costs:**
   - Each whitelist transaction consumes gas
   - Ensure wallet has sufficient balance

3. **Error Handling:**
   - Script will log errors but continue
   - Failed whitelist can be retried manually

4. **Rate Limiting:**
   - Don't run too frequently (min 30 seconds recommended)
   - Supra may have rate limits

## 🔍 Troubleshooting

### Service not running
- Check dependencies: `npm install`
- Check .env file exists in root or `contracts/` directory and has PRIVATE_KEY
- Check RPC URL is accessible
- Check TypeScript/Node.js version compatibility
- Verify Node.js version: `node --version` (should be 18+)

### Whitelist failing
- Check deployer address has permission in Supra
- Check sufficient balance in Deposit Contract
- Check gas settings are correct

### Logs not writing
- Check log directory exists: `mkdir -p /var/log/sanca`
- Check write permissions
- Check disk space

## 📝 Example Output

```
=== Sanca Auto-Whitelist Service ===
Factory: 0x5117711063B5cd297E118E28E29Ed9628eEA9B28
Deposit Contract: 0xd6675f4fD26119bF729B0fF912c28022a63Ae0a9
RPC: https://rpc.sepolia.mantle.xyz

Running one-time whitelist check...
Checking for new pools to whitelist...
Total pools found in Factory: 2
Attempting to whitelist pool: 0x7d82a538cd1ed9b0223fe4b3ec8007da0afddf83
✅ Pool already whitelisted: 0x7d82a538cd1ed9b0223fe4b3ec8007da0afddf83
Attempting to whitelist pool: 0x3268a850d0e224b4d641a60820c8bfe8dd65528d
✅ Pool whitelisted successfully: 0x3268a850d0e224b4d641a60820c8bfe8dd65528d
   Transaction: 0xabc123...

=== Whitelist Summary ===
✅ Succeeded: 1
❌ Failed: 0
⏭️  Skipped (already whitelisted): 1
Finished checking pools.
```

---

**Setup the cronjob and pools will be automatically whitelisted!** 🚀

