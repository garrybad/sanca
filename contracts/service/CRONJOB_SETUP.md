# ⏰ Cronjob Setup untuk Auto-Whitelist

Auto-whitelist pools di-handle oleh backend cronjob script, bukan dari contract.

## 📋 Script

**File:** `scripts/auto-whitelist-pools.sh`

**Fungsi:**
- Monitor Factory contract untuk pools baru
- Auto-whitelist pools baru ke Supra Deposit Contract
- Log semua activities

## 🚀 Cara Setup

### Option 1: Run Manual (Testing)

```bash
cd contracts

# Run sekali
./scripts/auto-whitelist-pools.sh --once

# Run continuous (monitor setiap 30 detik)
./scripts/auto-whitelist-pools.sh --interval 30
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
WorkingDirectory=/path/to/sanca/contracts
Environment="PRIVATE_KEY=your_private_key"
Environment="LOG_FILE=/var/log/sanca/auto-whitelist.log"
ExecStart=/path/to/sanca/contracts/scripts/auto-whitelist-pools.sh --interval 30
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
* * * * * cd /path/to/sanca/contracts && ./scripts/auto-whitelist-pools.sh --once >> /var/log/sanca/cron.log 2>&1
```

**Or every 30 seconds (requires script modification or use systemd):**
```cron
* * * * * cd /path/to/sanca/contracts && ./scripts/auto-whitelist-pools.sh --once >> /var/log/sanca/cron.log 2>&1
* * * * * sleep 30 && cd /path/to/sanca/contracts && ./scripts/auto-whitelist-pools.sh --once >> /var/log/sanca/cron.log 2>&1
```

## 🔧 Configuration

### Environment Variables

**Required:**
- `PRIVATE_KEY` - Deployer private key (from .env)

**Optional:**
- `LOG_FILE` - Log file path (default: `/var/log/sanca/auto-whitelist.log`)
- `FACTORY_ADDRESS` - Factory address (default: latest deployment)
- `DEPOSIT_CONTRACT` - Supra Deposit Contract (default: Mantle Sepolia)
- `RPC_URL` - RPC endpoint (default: Mantle Sepolia)

### Update Addresses

Jika addresses berubah, edit script atau set environment variables:

```bash
export FACTORY_ADDRESS="0x5010f881d605F7E675BDa96482364D2dCA74F603"
export DEPOSIT_CONTRACT="0xd6675f4fD26119bF729B0fF912c28022a63Ae0a9"
```

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
./scripts/auto-whitelist-pools.sh --once

# Check output
cat /var/log/sanca/auto-whitelist.log
```

### Verify Whitelist

```bash
# Check if pool is whitelisted
cast call 0xd6675f4fD26119bF729B0fF912c28022a63Ae0a9 \
  "isContractWhitelisted(address)" \
  <POOL_ADDRESS> \
  --rpc-url https://rpc.sepolia.mantle.xyz
```

## ⚠️ Important Notes

1. **Private Key Security:**
   - Jangan commit `.env` file
   - Use secure key management untuk production
   - Consider using hardware wallet atau key management service

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

### Script not running
- Check permissions: `chmod +x scripts/auto-whitelist-pools.sh`
- Check .env file exists and has PRIVATE_KEY
- Check RPC URL is accessible

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
[2026-01-04 14:30:00] === Sanca Auto-Whitelist Script ===
[2026-01-04 14:30:00] Factory: 0x5010f881d605F7E675BDa96482364D2dCA74F603
[2026-01-04 14:30:00] Deposit Contract: 0xd6675f4fD26119bF729B0fF912c28022a63Ae0a9
[2026-01-04 14:30:01] Current pool count: 1 (Last: 0)
[2026-01-04 14:30:01] Found 1 new pool(s)!
[2026-01-04 14:30:01] Attempting to whitelist pool: 0x3268a850d0e224b4d641a60820c8bfe8dd65528d
[2026-01-04 14:30:03] ✅ Pool whitelisted successfully: 0x3268a850d0e224b4d641a60820c8bfe8dd65528d
[2026-01-04 14:30:03] Whitelist summary: 1 succeeded, 0 failed
```

---

**Setup cronjob dan pools akan otomatis di-whitelist!** 🚀

