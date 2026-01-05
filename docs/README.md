# Sanca Documentation - System Design & Architecture

Documentation for system architecture and design diagrams for the Sanca platform (Web3 ROSCA - Rotating Savings and Credit Association).

## 📋 Available Diagrams

### 1. **Hackathon Architecture** (`hackathon-architecture.mmd`)
High-level overview for hackathon presentation:
- Problem Statement (Traditional ROSCA Issues)
- Solution (Web3 ROSCA Platform)
- Architecture Overview (Frontend, Blockchain, Indexing, DeFi)
- Key Features (5 main features)
- Value Proposition (For Users & For Mantle)

### 2. **System Architecture** (`system-architecture.mmd`)
Complete system architecture:
- Frontend Layer (Next.js + React)
- Indexing Layer (Ponder.sh)
- Blockchain Layer (Mantle Network Smart Contracts)
- External Services (Ondo Finance, Agni DEX, Supra VRF)
- Token Infrastructure (USDC, mUSD, USDY)

## 🔄 Token Mechanism

### Testnet (Current)
```
USDC → MockmUSD (1:1, no rebasing)
```

### Mainnet (Planned)
```
USDC → Agni DEX → USDY → Ondo mUSD (rebasing)
```

**Ondo mUSD** is a rebasing token that:
- Backed by USDY (Ondo Finance)
- Accrues yield automatically via rebasing mechanism
- Share-based system (similar to rUSDY)

## 📊 How to View Diagrams

### Option 1: VS Code Extension
Install extension **"Markdown Preview Mermaid Support"** or **"Mermaid Preview"**

### Option 2: Online Viewer
1. Copy content from `.mmd` file
2. Paste into [Mermaid Live Editor](https://mermaid.live/)
3. View diagram

### Option 3: GitHub
GitHub automatically renders Mermaid diagrams in markdown files.

### Option 4: CLI Tool
```bash
npm install -g @mermaid-js/mermaid-cli
mmdc -i docs/system-architecture.mmd -o docs/system-architecture.png
```

## 🏗️ System Components

### Frontend
- **Framework**: Next.js 16 + React 19
- **Wallet**: RainbowKit + wagmi
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI + shadcn-style

### Indexing
- **Platform**: Ponder.sh
- **Database**: PostgreSQL
- **API**: GraphQL

### Smart Contracts
- **Factory**: `SancaFactory.sol` (EIP-1167 minimal proxy pattern)
- **Pool**: `SancaPool.sol` (individual pool instance)
- **Tokens**: USDC, MockmUSD (testnet) / Ondo mUSD (mainnet)

### External Services
- **VRF**: Supra VRF V3 (on-chain randomness)
- **Yield**: Ondo Finance USDY/mUSD (mainnet)
- **DEX**: Agni Router (USDC ↔ USDY swaps, mainnet only)

## 🚀 Key Features

1. **Transparent Pools**: All transactions recorded on-chain, publicly verifiable
2. **Automated Cycles**: Smart contract execution, no manual intervention
3. **Fair Randomness**: Supra VRF for verifiable random winner selection
4. **Yield Generation**: Ondo mUSD rebasing token for automatic yield accrual
5. **Collateral Protection**: Auto-liquidation if member doesn't contribute

## 🔐 Security Considerations

1. **Reentrancy Protection**: All external calls protected with `ReentrancyGuard`
2. **Access Control**: Only whitelisted EOA can fulfill VRF requests
3. **Input Validation**: All user inputs validated in smart contracts
4. **Collateral Liquidation**: Automatic deduction if member fails to contribute
5. **Yield Calculation**: Based on actual mUSD balance vs total deposited amount

## 🚀 Mainnet Migration Checklist

- [ ] Deploy contracts to Mantle Mainnet
- [ ] Configure Ondo mUSD address
- [ ] Configure Agni DEX router address
- [ ] Configure USDY token address
- [ ] Update SancaPool to support DEX swaps
- [ ] Test USDC → USDY → mUSD flow
- [ ] Test mUSD → USDY → USDC flow
- [ ] Test yield accrual and distribution
- [ ] Update frontend to handle mainnet addresses
- [ ] Deploy Ponder indexer for mainnet
- [ ] Update documentation

## 📝 Notes

- **Rebasing Token**: mUSD balance increases automatically via rebasing mechanism
- **Yield Distribution**: Winner receives `yieldBonusSplit%` of total yield, rest compounds automatically
- **Liquidation**: If member doesn't contribute, `contributionPerPeriod` is deducted from their collateral
- **VRF**: Supra VRF requires whitelisted EOA to fulfill randomness requests
- **ROSCA**: Rotating Savings and Credit Association - traditional community savings model

## 🔗 Related Documentation

- `CONTRACT_MODIFICATION_PROPOSAL.md` - Detailed contract modifications
- `README.MD` - Project overview
- Smart contract source code in `contracts/src/`
