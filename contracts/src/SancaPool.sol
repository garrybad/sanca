// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./MockmUSD.sol";

/**
 * @title ISupraRouter
 * @notice Interface for Supra VRF V3 router
 */
interface ISupraRouter {
    function generateRequest(
        string memory _functionSig,
        uint8 _rngCount,
        uint256 _numConfirmations,
        uint256 _clientSeed,
        address _clientWalletAddress
    ) external returns (uint256);
    
    function generateRequest(
        string memory _functionSig,
        uint8 _rngCount,
        uint256 _numConfirmations,
        address _clientWalletAddress
    ) external returns (uint256);
}

/**
 * @title SancaPool
 * @notice Individual Arisan pool contract - manages one savings lottery group
 * @dev Uses minimal proxy pattern (EIP-1167) for gas efficiency
 */
contract SancaPool is ReentrancyGuard {
    address public owner;
    using SafeERC20 for IERC20;
    
    // Pool configuration (set once during initialization)
    uint8 public maxMembers;
    uint256 public contributionPerPeriod;
    uint256 public periodDuration; // in seconds
    uint8 public yieldBonusSplit; // percentage (0-100) of yield to winner
    string public poolName;
    string public poolDescription;
    
    // Token addresses
    address public usdc;
    address public musd;
    address public supraRouter;
    
    // Supra VRF client wallet (whitelisted EOA address)
    address public clientWalletAddress;
    
    // Pool state
    enum PoolState {
        Open,      // Accepting members
        Active,    // Full, cycle running
        Completed  // All cycles completed
    }
    
    PoolState public state;
    
    // Members
    address[] public members;
    mapping(address => bool) public isMember;
    mapping(address => uint256) public memberIndex; // 1-indexed (0 = not member)
    
    // Cycle tracking
    uint256 public currentCycle; // 0-indexed
    uint256 public cycleStartTime;
    uint256 public totalCycles; // maxMembers cycles
    
    // Winner tracking
    mapping(uint256 => address) public cycleWinners; // cycle => winner
    mapping(uint256 => bool) public cycleCompleted; // cycle => completed
    
    // mUSD tracking
    uint256 public totalMusdDeposited; // Total mUSD deposited (for yield calculation)
    uint256 public poolCreationTime;
    
    // Cycle contribution tracking (USDC, tidak di-wrap)
    mapping(uint256 => mapping(address => bool)) public cycleContributions; // cycle => member => contributed
    mapping(uint256 => uint256) public cycleUSDCBalance; // cycle => total USDC collected
    mapping(uint256 => uint256) public cycleContributionCount; // cycle => count of contributors
    mapping(address => uint256) public memberCollateral; // member => mUSD collateral amount
    
    // Randomness request tracking
    mapping(uint256 => uint256) public nonceToCycle; // nonce => cycle
    uint256 public pendingNonce; // Track pending randomness request
    
    // Events
    event Joined(address indexed member, uint256 contribution);
    event PoolStarted(uint256 startTime, uint256 totalCycles);
    event DrawTriggered(uint256 indexed cycle, uint256 nonce);
    event AutoDrawTriggered(uint256 indexed cycle, uint256 nonce, address indexed caller);
    event WinnerSelected(uint256 indexed cycle, address indexed winner, uint256 prize);
    event YieldDistributed(uint256 indexed cycle, address indexed winner, uint256 yieldBonus, uint256 compounded);
    event CycleEnded(uint256 indexed cycle);
    event PoolCompleted();
    event FundsWithdrawn(address indexed member, uint256 amount);
    event Contributed(uint256 indexed cycle, address indexed member, uint256 amount);
    event CollateralLiquidated(uint256 indexed cycle, address indexed member, uint256 amount);
    
    /**
     * @notice Initialize pool (called by factory via minimal proxy)
     * @param _creator Pool creator address
     * @param _maxMembers Maximum number of members (5-50)
     * @param _contributionPerPeriod Contribution amount per period in USDC (6 decimals)
     * @param _periodDuration Period duration in seconds
     * @param _yieldBonusSplit Percentage of yield to winner (0-100)
     * @param _poolName Name of the pool
     * @param _poolDescription Description of the pool
     * @param _usdc USDC token address
     * @param _musd mUSD token address
     * @param _supraRouter Supra VRF router address
     * @param _clientWalletAddress Whitelisted EOA address for Supra VRF (must be whitelisted in Deposit Contract)
     */
    function initialize(
        address _creator,
        uint8 _maxMembers,
        uint256 _contributionPerPeriod,
        uint256 _periodDuration,
        uint8 _yieldBonusSplit,
        string memory _poolName,
        string memory _poolDescription,
        address _usdc,
        address _musd,
        address _supraRouter,
        address _clientWalletAddress
    ) external {
        require(maxMembers == 0, "SancaPool: already initialized");
        require(_maxMembers > 1, "SancaPool: invalid maxMembers");
        require(_contributionPerPeriod > 0, "SancaPool: invalid contribution");
        require(_periodDuration > 0, "SancaPool: invalid periodDuration");
        require(_yieldBonusSplit <= 100, "SancaPool: invalid yieldBonusSplit");
        require(_usdc != address(0) && _musd != address(0) && _supraRouter != address(0), "SancaPool: invalid addresses");
        require(_clientWalletAddress != address(0), "SancaPool: invalid clientWalletAddress");
        
        owner = _creator;
        
        maxMembers = _maxMembers;
        contributionPerPeriod = _contributionPerPeriod;
        periodDuration = _periodDuration;
        yieldBonusSplit = _yieldBonusSplit;
        poolName = _poolName;
        poolDescription = _poolDescription;
        usdc = _usdc;
        musd = _musd;
        supraRouter = _supraRouter;
        clientWalletAddress = _clientWalletAddress;
        
        state = PoolState.Open;
        totalCycles = _maxMembers;
        poolCreationTime = block.timestamp;
    }
    
    /**
     * @notice Join the pool by contributing full upfront collateral
     * @dev Requires: pool is open, not already a member, full collateral = contributionPerPeriod * maxMembers
     */
    function join() external nonReentrant {
        require(state == PoolState.Open, "SancaPool: pool not open");
        require(!isMember[msg.sender], "SancaPool: already a member");
        require(members.length < maxMembers, "SancaPool: pool full");
        
        // Calculate full upfront collateral
        uint256 fullCollateral = contributionPerPeriod * maxMembers;
        
        // Transfer USDC from user
        IERC20(usdc).safeTransferFrom(msg.sender, address(this), fullCollateral);
        
        // Wrap USDC to mUSD (simulate deposit USDY → receive mUSD)
        // In testnet: Direct wrap. Mainnet: Add DEX swap USDC→USDY then wrap
        IERC20(usdc).approve(musd, fullCollateral);
        uint256 musdAmount = MockmUSD(musd).wrap(fullCollateral);
        
        // Track member's collateral
        memberCollateral[msg.sender] = musdAmount;
        
        // Track total mUSD deposited
        totalMusdDeposited += musdAmount;
        
        // Add member
        members.push(msg.sender);
        isMember[msg.sender] = true;
        memberIndex[msg.sender] = members.length; // 1-indexed
        
        emit Joined(msg.sender, fullCollateral);
        
        // Start pool if full
        if (members.length == maxMembers) {
            _startPool();
        }
    }
    
    /**
     * @notice Start the pool when full
     * @dev Internal function called when maxMembers is reached
     */
    function _startPool() internal {
        state = PoolState.Active;
        currentCycle = 0;
        cycleStartTime = block.timestamp;
        
        emit PoolStarted(cycleStartTime, totalCycles);
    }
    
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
    
    /**
     * @notice Internal function to liquidate missing contributions
     * @dev Called automatically in triggerDraw() if period ended
     */
    function _liquidateMissingContributions() internal {
        // Get current mUSD balance (with rebasing applied)
        uint256 currentMusdBalance = IERC20(musd).balanceOf(address(this));
        
        for (uint256 i = 0; i < members.length; i++) {
            address member = members[i];
            
            // Skip if already contributed
            if (cycleContributions[currentCycle][member]) {
                continue;
            }
            
            // Calculate member's proportional share of current mUSD balance
            // This accounts for rebasing - member gets their share of the rebased balance
            uint256 memberCurrentMusdValue = 0;
            if (totalMusdDeposited > 0 && currentMusdBalance > 0) {
                // Calculate member's proportional share: (memberCollateral / totalMusdDeposited) * currentBalance
                memberCurrentMusdValue = (currentMusdBalance * memberCollateral[member]) / totalMusdDeposited;
            }
            
            // Convert contributionPerPeriod (USDC, 6 decimals) to mUSD base amount (18 decimals)
            // 10 USDC (6 decimals) = 10 * 10^6 = 10,000,000
            // 10 mUSD base (18 decimals) = 10 * 10^18 = 10,000,000,000,000,000,000
            // Conversion: multiply by 1e12 (10^12) to go from 6 to 18 decimals
            uint256 musdBaseAmount = contributionPerPeriod * 1e12;
            
            // Check if member has enough collateral (current rebased value >= base amount needed)
            if (memberCurrentMusdValue >= musdBaseAmount) {
                // Unwrap mUSD to USDC
                // unwrap() will handle the conversion from rebased mUSD to USDC
                IERC20(musd).approve(musd, musdBaseAmount);
                uint256 usdcAmount = MockmUSD(musd).unwrap(musdBaseAmount);
                
                // Add to cycle balance
                cycleUSDCBalance[currentCycle] += usdcAmount;
                cycleContributionCount[currentCycle]++;
                
                // Mark as contributed (via liquidation)
                cycleContributions[currentCycle][member] = true;
                
                // Deduct from collateral proportionally
                // Calculate how much of memberCollateral to deduct based on base amount
                // Since we're unwrapping base amount, we deduct proportional base amount from collateral
                uint256 collateralToDeduct = (memberCollateral[member] * musdBaseAmount) / memberCurrentMusdValue;
                memberCollateral[member] -= collateralToDeduct;
                totalMusdDeposited -= collateralToDeduct;
                
                emit CollateralLiquidated(currentCycle, member, usdcAmount);
            }
        }
    }
    
    /**
     * @notice Internal function to execute draw (shared logic for triggerDraw and autoDraw)
     * @dev Calls Supra VRF to get random number
     */
    function _executeDraw() internal {
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
        // Function signature: "fulfillRandomness(uint256,uint256[])"
        // Note: clientWalletAddress must be whitelisted EOA with sufficient balance in Deposit Contract
        uint256 nonce = ISupraRouter(supraRouter).generateRequest(
            "fulfillRandomness(uint256,uint256[])",
            1, // rngCount: 1 random number
            1, // numConfirmations: 1 block confirmations (Min:1, Max:20)
            clientWalletAddress // clientWalletAddress: whitelisted EOA address
        );
        
        pendingNonce = nonce;
        nonceToCycle[nonce] = currentCycle;
        
        emit DrawTriggered(currentCycle, nonce);
    }
    
    /**
     * @notice Auto draw for current cycle (can be called by anyone)
     * @dev Public function that can be called by keeper services, bots, or anyone
     * @dev Calls Supra VRF to get random number automatically when period ends
     */
    function autoDraw() external nonReentrant {
        // Store current cycle and caller before _executeDraw
        uint256 cycleBeforeDraw = currentCycle;
        address caller = msg.sender;
        
        // Call _executeDraw which will emit DrawTriggered
        _executeDraw();
        
        // Get the nonce that was set by _executeDraw
        uint256 nonce = pendingNonce;
        
        // Emit AutoDrawTriggered event to distinguish from manual triggerDraw
        emit AutoDrawTriggered(cycleBeforeDraw, nonce, caller);
    }
    
    /**
     * @notice Trigger draw for current cycle (select winner)
     * @dev Calls Supra VRF to get random number
     * @dev Only pool members can trigger the draw (for backward compatibility)
     * @dev For auto draw, use autoDraw() instead
     */
    function triggerDraw() external nonReentrant {
        require(isMember[msg.sender], "SancaPool: only members can trigger draw");
        _executeDraw();
    }
    
    /**
     * @notice Callback from Supra VRF with random number
     * @dev Selects winner and distributes funds
     * @param _nonce Nonce from VRF request
     * @param _rngList Array of random numbers
     */
    function fulfillRandomness(uint256 _nonce, uint256[] memory _rngList) external {
        require(msg.sender == supraRouter, "SancaPool: only Supra router");
        require(pendingNonce == _nonce, "SancaPool: invalid nonce");
        require(_rngList.length > 0, "SancaPool: empty rngList");
        require(nonceToCycle[_nonce] == currentCycle, "SancaPool: nonce mismatch");
        require(!cycleCompleted[currentCycle], "SancaPool: cycle already completed");
        
        // Clear pending nonce
        pendingNonce = 0;
        
        // Simple lottery: pick winner from eligible members (those who haven't won yet)
        uint256 randomValue = _rngList[0];
        
        // Get eligible members (exclude previous winners)
        address[] memory eligibleMembers = _getEligibleMembers();
        require(eligibleMembers.length > 0, "SancaPool: no eligible members");
        
        // Simple lottery: pick winner using modulo (like example lottery)
        uint256 winnerIndex = randomValue % eligibleMembers.length;
        address winner = eligibleMembers[winnerIndex];
        
        cycleWinners[currentCycle] = winner;
        
        // Transfer prize USDC (from cycle contributions ONLY - per cycle)
        // Collateral mUSD tetap di-hold untuk yield di cycle berikutnya
        uint256 cyclePrize = cycleUSDCBalance[currentCycle];
        if (cyclePrize > 0) {
            IERC20(usdc).safeTransfer(winner, cyclePrize);
            cycleUSDCBalance[currentCycle] = 0; // Clear after transfer
        }
        
        // Distribute yield from mUSD
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
    
    /**
     * @notice Get eligible members (those who haven't won yet)
     * @return Array of eligible member addresses
     */
    function _getEligibleMembers() internal view returns (address[] memory) {
        address[] memory eligibleMembers = new address[](members.length);
        uint256 eligibleCount = 0;
        
        for (uint256 i = 0; i < members.length; i++) {
            bool hasWon = false;
            // Check if this member has won in any previous cycle
            for (uint256 j = 0; j < currentCycle; j++) {
                if (cycleWinners[j] == members[i]) {
                    hasWon = true;
                    break;
                }
            }
            if (!hasWon) {
                eligibleMembers[eligibleCount] = members[i];
                eligibleCount++;
            }
        }
        
        // Resize array to actual count
        address[] memory result = new address[](eligibleCount);
        for (uint256 i = 0; i < eligibleCount; i++) {
            result[i] = eligibleMembers[i];
        }
        
        return result;
    }
    
    /**
     * @notice Distribute yield to winner and compound the rest
     * @param winner Winner address for this cycle
     */
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
            // In testnet: Direct unwrap. Mainnet: Unwrap mUSD→USDY then swap USDY→USDC
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
    
    /**
     * @notice Withdraw funds after pool completion
     * @dev Members can withdraw their share after all cycles complete
     */
    function withdraw() external nonReentrant {
        require(state == PoolState.Completed, "SancaPool: pool not completed");
        require(isMember[msg.sender], "SancaPool: not a member");
        
        // Member can only withdraw their initial collateral if it hasn't been liquidated
        uint256 memberRemainingCollateral = memberCollateral[msg.sender];
        require(memberRemainingCollateral > 0, "SancaPool: no remaining collateral to withdraw");
        
        // Unwrap mUSD to USDC
        IERC20(musd).approve(musd, memberRemainingCollateral);
        uint256 usdcAmount = MockmUSD(musd).unwrap(memberRemainingCollateral);
        
        // Transfer USDC to member
        IERC20(usdc).safeTransfer(msg.sender, usdcAmount);
        
        // Clear collateral
        memberCollateral[msg.sender] = 0;
        totalMusdDeposited -= memberRemainingCollateral; // Adjust total mUSD deposited
        
        emit FundsWithdrawn(msg.sender, usdcAmount);
    }
    
    /**
     * @notice Get pool information
     * @return _state Pool state
     * @return _maxMembers Maximum members
     * @return _currentMembers Current member count
     * @return _contributionPerPeriod Contribution per period
     * @return _periodDuration Period duration in seconds
     * @return _yieldBonusSplit Yield bonus split percentage
     * @return _currentCycle Current cycle number
     * @return _totalCycles Total cycles
     * @return _cycleStartTime Cycle start timestamp
     * @return _totalMusdDeposited Total mUSD deposited
     * @return _currentMusdBalance Current mUSD balance
     */
    function getPoolInfo() external view returns (
        PoolState _state,
        uint8 _maxMembers,
        uint256 _currentMembers,
        uint256 _contributionPerPeriod,
        uint256 _periodDuration,
        uint8 _yieldBonusSplit,
        uint256 _currentCycle,
        uint256 _totalCycles,
        uint256 _cycleStartTime,
        uint256 _totalMusdDeposited,
        uint256 _currentMusdBalance
    ) {
        return (
            state,
            maxMembers,
            uint256(members.length),
            contributionPerPeriod,
            periodDuration,
            yieldBonusSplit,
            currentCycle,
            totalCycles,
            cycleStartTime,
            totalMusdDeposited,
            IERC20(musd).balanceOf(address(this))
        );
    }
    
    /**
     * @notice Get member list
     * @return Array of member addresses
     */
    function getMembers() external view returns (address[] memory) {
        return members;
    }
    
    /**
     * @notice Get winner for a specific cycle
     * @param cycle Cycle number
     * @return Winner address (zero if not selected yet)
     */
    function getCycleWinner(uint256 cycle) external view returns (address) {
        return cycleWinners[cycle];
    }
    
    /**
     * @notice Check if cycle is completed
     * @param cycle Cycle number
     * @return True if cycle is completed
     */
    function isCycleCompleted(uint256 cycle) external view returns (bool) {
        return cycleCompleted[cycle];
    }
}

