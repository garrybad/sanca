# Proposal Modifikasi SancaPool Contract

## Requirements

1. **Join**: Deposit collateral `contributionPerPeriod × maxMembers` → wrap ke mUSD (untuk yield)
2. **Setiap Cycle**: Semua member contribute `contributionPerPeriod` USDC (TIDAK wrap, tetap USDC)
3. **Winner**: Dapat `contributionPerPeriod × maxMembers` USDC (dari kontribusi cycle) + yield dari mUSD
4. **Validasi**: Semua member harus contribute sebelum bisa trigger draw
5. **Liquidation**: Jika member tidak contribute, liquidate dari collateral mereka
6. **Yield Distribution**: Total yield dari semua collateral dibagi ke maxMembers (bukan hanya ke winner). Winner dapat yieldBonusSplit%, sisanya compound untuk semua members.

## Perubahan yang Diperlukan

### 1. Tambah State Variables (setelah line 79)

```solidity
// Cycle contribution tracking (USDC, tidak di-wrap)
mapping(uint256 => mapping(address => bool)) public cycleContributions; // cycle => member => contributed
mapping(uint256 => uint256) public cycleUSDCBalance; // cycle => total USDC collected
mapping(uint256 => uint256) public cycleContributionCount; // cycle => count of contributors
mapping(address => uint256) public memberCollateral; // member => mUSD collateral amount
```

### 2. Modifikasi `join()` function (setelah line 163)

**PENTING**: Fix masalah wrap - pool contract perlu approve MockmUSD untuk transfer USDC.

```solidity
// Wrap USDC to mUSD (simulate deposit USDY → receive mUSD)
// In testnet: Direct wrap. Mainnet: Add DEX swap USDC→USDY then wrap
IERC20(usdc).approve(musd, fullCollateral);
uint256 musdAmount = MockmUSD(musd).wrap(fullCollateral);

// Track member's collateral
memberCollateral[msg.sender] = musdAmount;

// Track total mUSD deposited
totalMusdDeposited += musdAmount;
```

**Note**: Masalah di contract saat ini - `MockmUSD.wrap()` melakukan `transferFrom(msg.sender, ...)`, jadi pool perlu approve MockmUSD untuk transfer USDC. Ini sudah benar di line 162, tapi pastikan approval berhasil.

### 3. Tambah fungsi `contribute()` (setelah `_startPool()`)

```solidity
/**
 * @notice Contribute USDC for current cycle
 * @dev Member must contribute contributionPerPeriod USDC (TIDAK wrap ke mUSD)
 */
function contribute() external nonReentrant {
    require(state == PoolState.Active, "SancaPool: pool not active");
    require(isMember[msg.sender], "SancaPool: not a member");
    require(!cycleContributions[currentCycle][msg.sender], "SancaPool: already contributed");
    
    // Transfer USDC from user (TIDAK wrap ke mUSD)
    IERC20(usdc).safeTransferFrom(msg.sender, address(this), contributionPerPeriod);
    
    // Track contribution
    cycleContributions[currentCycle][msg.sender] = true;
    cycleUSDCBalance[currentCycle] += contributionPerPeriod;
    cycleContributionCount[currentCycle]++;
    
    emit Contributed(currentCycle, msg.sender, contributionPerPeriod);
}
```

### 4. Tambah fungsi `liquidateCollateral()` (setelah `contribute()`)

**PENTING**: Liquidation terjadi saat period ended (cycleStartTime + periodDuration) dan member belum contribute. Dipanggil sebelum trigger draw.

```solidity
/**
 * @notice Liquidate collateral for members who didn't contribute
 * @dev Can be called by anyone after period ended, before trigger draw
 * @dev Liquidates contributionPerPeriod amount from member's collateral
 */
function liquidateCollateral() external nonReentrant {
    require(state == PoolState.Active, "SancaPool: pool not active");
    require(block.timestamp >= cycleStartTime + periodDuration, "SancaPool: period not ended");
    require(!cycleCompleted[currentCycle], "SancaPool: cycle already completed");
    
    // Check each member
    for (uint256 i = 0; i < members.length; i++) {
        address member = members[i];
        
        // If member didn't contribute, liquidate contributionPerPeriod from their collateral
        if (!cycleContributions[currentCycle][member] && memberCollateral[member] >= contributionPerPeriod) {
            // Calculate mUSD equivalent of contributionPerPeriod
            // Note: This is approximate, actual conversion may vary
            // For simplicity, we'll unwrap contributionPerPeriod worth of mUSD
            uint256 musdToLiquidate = contributionPerPeriod; // 1:1 ratio in testnet
            
            // Ensure we don't liquidate more than available
            if (musdToLiquidate > memberCollateral[member]) {
                musdToLiquidate = memberCollateral[member];
            }
            
            // Unwrap mUSD to USDC
            IERC20(musd).approve(musd, musdToLiquidate);
            uint256 usdcAmount = MockmUSD(musd).unwrap(musdToLiquidate);
            
            // Add to cycle balance
            cycleUSDCBalance[currentCycle] += usdcAmount;
            cycleContributionCount[currentCycle]++;
            
            // Mark as contributed (via liquidation)
            cycleContributions[currentCycle][member] = true;
            
            // Deduct from collateral
            memberCollateral[member] -= musdToLiquidate;
            totalMusdDeposited -= musdToLiquidate;
            
            emit CollateralLiquidated(currentCycle, member, usdcAmount);
        }
    }
}
```

### 5. Modifikasi `triggerDraw()` (line 197-217)

**PENTING**: Sebelum trigger draw, harus pastikan semua member sudah contribute atau sudah di-liquidate.

```solidity
function triggerDraw() external nonReentrant {
    require(state == PoolState.Active, "SancaPool: pool not active");
    require(block.timestamp >= cycleStartTime + periodDuration, "SancaPool: period not ended");
    require(pendingNonce == 0, "SancaPool: draw already pending");
    require(!cycleCompleted[currentCycle], "SancaPool: cycle already completed");
    
    // Auto-liquidate members who didn't contribute (before checking)
    // This ensures all members have "contributed" (either manually or via liquidation)
    _liquidateMissingContributions();
    
    // Require all members contributed (or liquidated)
    require(
        cycleContributionCount[currentCycle] >= maxMembers,
        "SancaPool: not all members contributed"
    );
    
    // Request randomness from Supra VRF
    uint256 nonce = ISupraRouter(supraRouter).generateRequest(
        "fulfillRandomness(uint256,uint256[])",
        1,
        3,
        clientWalletAddress
    );
    
    pendingNonce = nonce;
    nonceToCycle[nonce] = currentCycle;
    
    emit DrawTriggered(currentCycle, nonce);
}

/**
 * @notice Internal function to liquidate missing contributions
 * @dev Called automatically in triggerDraw() if period ended
 */
function _liquidateMissingContributions() internal {
    for (uint256 i = 0; i < members.length; i++) {
        address member = members[i];
        
        // If member didn't contribute and has collateral, liquidate
        if (!cycleContributions[currentCycle][member] && memberCollateral[member] >= contributionPerPeriod) {
            uint256 musdToLiquidate = contributionPerPeriod;
            
            // Unwrap mUSD to USDC
            IERC20(musd).approve(musd, musdToLiquidate);
            uint256 usdcAmount = MockmUSD(musd).unwrap(musdToLiquidate);
            
            // Add to cycle balance
            cycleUSDCBalance[currentCycle] += usdcAmount;
            cycleContributionCount[currentCycle]++;
            
            // Mark as contributed (via liquidation)
            cycleContributions[currentCycle][member] = true;
            
            // Deduct from collateral
            memberCollateral[member] -= musdToLiquidate;
            totalMusdDeposited -= musdToLiquidate;
            
            emit CollateralLiquidated(currentCycle, member, usdcAmount);
        }
    }
}
```

### 6. Modifikasi `fulfillRandomness()` (line 225-261)

**PENTING**: Prize USDC + yield hanya untuk cycle tersebut. Collateral mUSD tetap di-hold sampai semua cycle selesai.

```solidity
function fulfillRandomness(uint256 _nonce, uint256[] memory _rngList) external {
    require(msg.sender == supraRouter, "SancaPool: only Supra router");
    require(pendingNonce == _nonce, "SancaPool: invalid nonce");
    require(_rngList.length > 0, "SancaPool: empty rngList");
    require(nonceToCycle[_nonce] == currentCycle, "SancaPool: nonce mismatch");
    require(!cycleCompleted[currentCycle], "SancaPool: cycle already completed");
    
    // Clear pending nonce
    pendingNonce = 0;
    
    // Select winner using random number
    uint256 randomValue = _rngList[0];
    uint256 winnerIndex = randomValue % members.length;
    address winner = members[winnerIndex];
    
    cycleWinners[currentCycle] = winner;
    
    // Transfer prize USDC (from cycle contributions ONLY - per cycle)
    // Collateral mUSD tetap di-hold untuk yield di cycle berikutnya
    uint256 cyclePrize = cycleUSDCBalance[currentCycle];
    if (cyclePrize > 0) {
        IERC20(usdc).safeTransfer(winner, cyclePrize);
        cycleUSDCBalance[currentCycle] = 0; // Clear after transfer
    }
    
    // Distribute yield from mUSD
    // PENTING: Total yield dari semua collateral dibagi ke maxMembers
    // Winner dapat yieldBonusSplit% dari yield, sisanya di-compound (untuk semua members)
    _distributeYield(winner);
    
    // Mark cycle as completed
    cycleCompleted[currentCycle] = true;
    
    emit WinnerSelected(currentCycle, winner, cyclePrize);
    
    // Move to next cycle or complete pool
    if (currentCycle + 1 < totalCycles) {
        currentCycle++;
        cycleStartTime = block.timestamp;
        emit CycleEnded(currentCycle - 1);
    } else {
        // All cycles completed
        state = PoolState.Completed;
        emit CycleEnded(currentCycle);
        emit PoolCompleted();
    }
}
```

### 7. Tambah Events (setelah line 93)

```solidity
event Contributed(uint256 indexed cycle, address indexed member, uint256 amount);
event CollateralLiquidated(uint256 indexed cycle, address indexed member, uint256 amount);
```

### 7. Modifikasi `_distributeYield()` (line 267-305)

**PENTING**: 
- Total yield dari semua collateral dibagi ke maxMembers (bukan hanya ke winner)
- Winner dapat yieldBonusSplit% dari yield per cycle
- Sisanya di-compound (untuk semua members, akan dibagi saat withdraw)
- Yield dihitung per cycle (dari cycleStartTime sampai sekarang)

```solidity
function _distributeYield(address winner) internal {
    // Get current mUSD balance (includes rebased yield)
    uint256 currentMusdBalance = IERC20(musd).balanceOf(address(this));
    
    // Calculate total accrued yield (dari semua collateral)
    uint256 totalAccruedYield = currentMusdBalance > totalMusdDeposited 
        ? currentMusdBalance - totalMusdDeposited
        : 0;
    
    if (totalAccruedYield == 0) {
        // No yield yet, skip distribution
        return;
    }
    
    // PENTING: Total yield dibagi ke maxMembers
    // Yield per member = totalYield / maxMembers
    uint256 yieldPerMember = totalAccruedYield / maxMembers;
    
    // Winner dapat yieldBonusSplit% dari yield per member
    uint256 yieldBonus = (yieldPerMember * yieldBonusSplit) / 100;
    
    // Sisanya (yieldPerMember - yieldBonus) akan di-compound untuk semua members
    // Total compounded = (yieldPerMember - yieldBonus) * maxMembers
    uint256 totalCompounded = (yieldPerMember - yieldBonus) * maxMembers;
    
    if (yieldBonus > 0) {
        // Unwrap partial mUSD to USDC for winner
        IERC20(musd).approve(musd, yieldBonus);
        uint256 usdcAmount = MockmUSD(musd).unwrap(yieldBonus);
        
        // Transfer USDC to winner
        IERC20(usdc).safeTransfer(winner, usdcAmount);
        
        // Update total deposited (subtract unwrapped amount)
        totalMusdDeposited -= yieldBonus;
    }
    
    // Rest compounds (stays in mUSD, continues earning yield)
    // This will be divided among all members at withdraw
    if (totalCompounded > 0) {
        totalMusdDeposited = currentMusdBalance - yieldBonus; // New base includes compounded yield
    }
    
    emit YieldDistributed(currentCycle, winner, yieldBonus, totalCompounded);
}
```

### 8. Modifikasi `withdraw()` (line 311-334)

```solidity
function withdraw() external nonReentrant {
    require(state == PoolState.Completed, "SancaPool: pool not completed");
    require(isMember[msg.sender], "SancaPool: not a member");
    
    // Calculate member's share from remaining mUSD collateral
    uint256 currentBalance = IERC20(musd).balanceOf(address(this));
    uint256 memberShare = currentBalance / maxMembers;
    
    require(memberShare > 0, "SancaPool: no funds to withdraw");
    
    // Unwrap mUSD to USDC
    IERC20(musd).approve(musd, memberShare);
    uint256 usdcAmount = MockmUSD(musd).unwrap(memberShare);
    
    // Transfer USDC to member
    IERC20(usdc).safeTransfer(msg.sender, usdcAmount);
    
    emit FundsWithdrawn(msg.sender, usdcAmount);
}
```

## Frontend Changes Needed

1. **Button Contribute**: Tambah button "Contribute" di pool detail page untuk current cycle
2. **Contribution Status**: Display status contribute per member per cycle
3. **Liquidation Warning**: Show warning jika ada member yang belum contribute setelah period ended
4. **Prize Display**: Show prize amount (contributionPerPeriod × maxMembers) untuk current cycle
5. **Countdown Timer**: Show countdown sampai period ended (untuk contribute deadline)
6. **Auto-liquidation Info**: Informasi bahwa liquidation akan otomatis saat trigger draw jika ada yang belum contribute

## Ponder Schema Changes

1. Tambah event handler untuk `Contributed`
2. Tambah event handler untuk `CollateralLiquidated`
3. Update cycles table untuk track contribution status

