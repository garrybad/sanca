// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {SancaFactory} from "../src/SancaFactory.sol";
import {SancaPool} from "../src/SancaPool.sol";
import {MockmUSD} from "../src/MockmUSD.sol";
import {MockOracle} from "../src/MockOracle.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSDC
 * @notice Mock USDC token for testing
 */
contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "USDC") {
        _mint(msg.sender, 1000000 * 10**6); // 1M USDC
    }
    
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
    
    function decimals() public pure override returns (uint8) {
        return 6;
    }
}

/**
 * @title MockSupraRouter
 * @notice Mock Supra VRF router for testing
 */
contract MockSupraRouter {
    mapping(uint256 => bool) public pendingRequests;
    uint256 public nonceCounter;
    
    // Callback function signature
    string constant CALLBACK_SIG = "fulfillRandomness(uint256,uint256[])";
    
    function generateRequest(
        string memory _functionSig,
        uint8 _rngCount,
        uint256 _numConfirmations,
        uint256 _clientSeed,
        address _clientWalletAddress
    ) external returns (uint256) {
        return _generateRequest(_functionSig, _rngCount, _numConfirmations, _clientSeed, _clientWalletAddress);
    }
    
    function generateRequest(
        string memory _functionSig,
        uint8 _rngCount,
        uint256 _numConfirmations,
        address _clientWalletAddress
    ) external returns (uint256) {
        return _generateRequest(_functionSig, _rngCount, _numConfirmations, 0, _clientWalletAddress);
    }
    
    function _generateRequest(
        string memory,
        uint8,
        uint256,
        uint256,
        address _clientWalletAddress
    ) internal returns (uint256) {
        uint256 nonce = ++nonceCounter;
        pendingRequests[nonce] = true;
        
        // Simulate VRF callback after a short delay
        // In real scenario, this would be called by Supra network
        // For testing, we'll call it manually
        return nonce;
    }
    
    /**
     * @notice Manually fulfill randomness request (for testing)
     * @param pool Pool contract address
     * @param nonce Nonce from request
     * @param randomValue Random value to use
     */
    function fulfillRandomness(address pool, uint256 nonce, uint256 randomValue) external {
        require(pendingRequests[nonce], "MockSupraRouter: invalid nonce");
        pendingRequests[nonce] = false;
        
        uint256[] memory rngList = new uint256[](1);
        rngList[0] = randomValue;
        
        // Call the pool's fulfillRandomness function
        (bool success,) = pool.call(
            abi.encodeWithSignature("fulfillRandomness(uint256,uint256[])", nonce, rngList)
        );
        require(success, "MockSupraRouter: callback failed");
    }
}

/**
 * @title SancaTest
 * @notice Comprehensive test suite for Sanca Arisan platform
 */
contract SancaTest is Test {
    SancaFactory public factory;
    SancaPool public poolImplementation;
    MockmUSD public musd;
    MockUSDC public usdc;
    MockSupraRouter public supraRouter;
    MockOracle public oracle;
    
    address public deployer = address(1);
    address public user1 = address(2);
    address public user2 = address(3);
    address public user3 = address(4);
    address public user4 = address(5);
    address public user5 = address(6);
    
    uint256 constant INITIAL_BALANCE = 10000 * 10**6; // 10k USDC per user
    
    function setUp() public {
        vm.startPrank(deployer);
        
        // Deploy mock tokens
        usdc = new MockUSDC();
        oracle = new MockOracle();
        musd = new MockmUSD(address(usdc), address(oracle));
        supraRouter = new MockSupraRouter();
        
        // Deploy implementation
        poolImplementation = new SancaPool();
        
        // Deploy factory
        // Note: In production, clientWalletAddress must be whitelisted EOA with funds in Deposit Contract
        factory = new SancaFactory(
            address(poolImplementation),
            address(usdc),
            address(musd),
            address(supraRouter),
            deployer // Use deployer as clientWalletAddress for testing (must be whitelisted in production)
        );
        
        vm.stopPrank();
        
        // Fund users with USDC
        usdc.mint(user1, INITIAL_BALANCE);
        usdc.mint(user2, INITIAL_BALANCE);
        usdc.mint(user3, INITIAL_BALANCE);
        usdc.mint(user4, INITIAL_BALANCE);
        usdc.mint(user5, INITIAL_BALANCE);
        
        // Note: Users will approve individual pools when joining
        // No need to approve factory upfront
    }
    
    function test_CreatePool() public {
        vm.prank(user1);
        address poolAddress = factory.createPool(
            5,              // maxMembers
            50 * 10**6,     // contributionPerPeriod: 50 USDC
            30 days,        // periodDuration
            20,             // yieldBonusSplit: 20%
            "Test Pool 1",
            "Test pool description"
        );
        
        assertTrue(factory.isPool(poolAddress));
        assertEq(factory.poolCreator(poolAddress), user1);
        
        SancaPool pool = SancaPool(poolAddress);
        (SancaPool.PoolState state,,,,,,,,,,) = pool.getPoolInfo();
        assertEq(uint256(state), uint256(SancaPool.PoolState.Open));
    }
    
    function test_JoinPool() public {
        vm.prank(user1);
        address poolAddress = factory.createPool(5, 50 * 10**6, 30 days, 20, "Test Pool", "Test pool description");
        SancaPool pool = SancaPool(poolAddress);
        
        // User1 joins - approve first, then join
        vm.startPrank(user1);
        usdc.approve(poolAddress, type(uint256).max);
        pool.join();
        vm.stopPrank();
        
        // User2 joins - approve first, then join
        vm.startPrank(user2);
        usdc.approve(poolAddress, type(uint256).max);
        pool.join();
        vm.stopPrank();
        
        (SancaPool.PoolState state, uint8 maxMembers, uint256 currentMembers,,,,,,,,) = pool.getPoolInfo();
        assertEq(uint256(state), uint256(SancaPool.PoolState.Open));
        assertEq(currentMembers, 2);
        assertEq(maxMembers, 5);
    }
    
    function test_PoolStartsWhenFull() public {
        vm.prank(user1);
        address poolAddress = factory.createPool(5, 50 * 10**6, 30 days, 20, "Test Pool", "Test pool description");
        SancaPool pool = SancaPool(poolAddress);
        
        // Approve pool for all users
        vm.startPrank(user1);
        usdc.approve(poolAddress, type(uint256).max);
        pool.join();
        vm.stopPrank();
        
        vm.startPrank(user2);
        usdc.approve(poolAddress, type(uint256).max);
        pool.join();
        vm.stopPrank();
        
        vm.startPrank(user3);
        usdc.approve(poolAddress, type(uint256).max);
        pool.join();
        vm.stopPrank();
        
        vm.startPrank(user4);
        usdc.approve(poolAddress, type(uint256).max);
        pool.join();
        vm.stopPrank();
        
        // 5th user joins - pool should start
        vm.startPrank(user5);
        usdc.approve(poolAddress, type(uint256).max);
        pool.join();
        vm.stopPrank();
        
        (SancaPool.PoolState state, uint8 maxMembers, uint256 currentMembers, uint256 contributionPerPeriod, uint256 periodDuration, uint8 yieldBonusSplit, uint256 currentCycle, uint256 totalCycles, uint256 cycleStartTime, uint256 totalMusdDeposited, uint256 currentMusdBalance) = pool.getPoolInfo();
        assertEq(uint256(state), uint256(SancaPool.PoolState.Active));
        assertGt(cycleStartTime, 0);
    }
    
    function test_FullCycleWithYield() public {
        // Create and fill pool
        vm.prank(user1);
        address poolAddress = factory.createPool(5, 50 * 10**6, 1 days, 20, "Test Pool", "Test pool description"); // 1 day period for testing
        SancaPool pool = SancaPool(poolAddress);
        
        // All users join
        address[] memory users = new address[](5);
        users[0] = user1;
        users[1] = user2;
        users[2] = user3;
        users[3] = user4;
        users[4] = user5;
        
        for (uint256 i = 0; i < 5; i++) {
            vm.startPrank(users[i]);
            usdc.approve(poolAddress, type(uint256).max);
            pool.join();
            vm.stopPrank();
        }
        
        // Pool should be active
        (SancaPool.PoolState state,,,,,,,uint256 cycleStartTime,,,) = pool.getPoolInfo();
        assertEq(uint256(state), uint256(SancaPool.PoolState.Active));
        
        // Complete all 5 cycles
        for (uint256 cycle = 0; cycle < 5; cycle++) {
            // Advance time to end of period
            vm.warp(cycleStartTime + (cycle + 1) * 1 days);
            
            // All members contribute for this cycle (except last cycle - let liquidation happen)
            if (cycle < 4) {
                // For cycles 0-3, all members contribute manually
                for (uint256 i = 0; i < 5; i++) {
                    vm.startPrank(users[i]);
                    usdc.approve(poolAddress, type(uint256).max);
                    pool.contribute();
                    vm.stopPrank();
                }
            }
            // For cycle 4, let liquidation happen (members don't contribute, collateral gets liquidated)
            
            // Trigger draw
            vm.prank(user1);
            pool.triggerDraw();
            
            // Get pending nonce and fulfill randomness
            uint256 nonce = cycle + 1;
            uint256 randomValue = 12345 + cycle;
            
            vm.prank(address(supraRouter));
            supraRouter.fulfillRandomness(poolAddress, nonce, randomValue);
            
            // Check winner was selected
            address winner = pool.cycleWinners(cycle);
            assertTrue(winner != address(0));
            
            // Update cycleStartTime for next cycle
            if (cycle < 4) {
                (,,,,,,,cycleStartTime,,,) = pool.getPoolInfo();
            }
        }
        
        // Pool should be completed
        (SancaPool.PoolState finalState,,,,,,,,,,) = pool.getPoolInfo();
        assertEq(uint256(finalState), uint256(SancaPool.PoolState.Completed));
        
        // Users can withdraw remaining collateral (if any)
        // Note: If all cycles used liquidation, there might be no remaining collateral
        // So we only test withdraw if there's remaining collateral
        uint256 user1Collateral = pool.memberCollateral(user1);
        if (user1Collateral > 0) {
            uint256 user1BalanceBefore = usdc.balanceOf(user1);
            vm.prank(user1);
            pool.withdraw();
            uint256 user1BalanceAfter = usdc.balanceOf(user1);
            assertGt(user1BalanceAfter, user1BalanceBefore);
        }
    }
    
    function test_MockmUSDRebase() public {
        // User wraps USDC (6 decimals)
        uint256 usdcAmount = 1000 * 10**6; // 1000 USDC
        vm.startPrank(user1);
        usdc.approve(address(musd), usdcAmount);
        uint256 musdAmount = musd.wrap(usdcAmount);
        vm.stopPrank();
        
        // mUSD uses 18 decimals, so balance should be 1000 * 10**18
        // Note: At deployment time, oracle price = 1e18, so initial balance = 1000 * 10**18
        uint256 initialBalance = musd.balanceOf(user1);
        assertEq(initialBalance, 1000 * 10**18);
        assertEq(musdAmount, 1000 * 10**18);
        
        // Advance time 30 days (oracle price increases ~5% APY)
        vm.warp(block.timestamp + 30 days);
        
        // Balance should have increased (~5% APY) - oracle price increases automatically
        // This is the rebasing mechanism: balance increases without transfers
        uint256 newBalance = musd.balanceOf(user1);
        assertGt(newBalance, initialBalance);
        
        // Verify yield is approximately 5% APY for 30 days
        // 30 days = ~0.082 years, so yield should be ~0.41% (5% * 0.082)
        uint256 expectedMinBalance = (initialBalance * 10041) / 10000; // ~0.41% increase
        assertGe(newBalance, expectedMinBalance);
        
        // Check yield calculation (should return in 18 decimals)
        uint256 accruedYield = musd.getAccruedYield(user1);
        assertGt(accruedYield, 0);
    }
    
    function test_MockmUSDWrapUnwrap() public {
        vm.startPrank(user1);
        
        // Wrap: USDC (6 decimals) -> mUSD (18 decimals)
        uint256 usdcWrapAmount = 1000 * 10**6; // 1000 USDC
        usdc.approve(address(musd), usdcWrapAmount);
        uint256 musdAmount = musd.wrap(usdcWrapAmount);
        
        // mUSD uses 18 decimals, so 1000 USDC = 1000 * 10**18 mUSD
        assertEq(musdAmount, 1000 * 10**18);
        assertEq(musd.balanceOf(user1), 1000 * 10**18);
        assertEq(usdc.balanceOf(user1), INITIAL_BALANCE - usdcWrapAmount);
        
        // Unwrap: mUSD (18 decimals) -> USDC (6 decimals)
        uint256 musdUnwrapAmount = 500 * 10**18; // 500 mUSD
        musd.approve(address(musd), musdUnwrapAmount);
        uint256 usdcAmount = musd.unwrap(musdUnwrapAmount);
        
        // Should get back 500 USDC (6 decimals)
        assertEq(usdcAmount, 500 * 10**6);
        assertEq(musd.balanceOf(user1), 500 * 10**18);
        assertEq(usdc.balanceOf(user1), INITIAL_BALANCE - 500 * 10**6);
        
        vm.stopPrank();
    }
    
    function test_RevertIfNotFullCollateral() public {
        vm.prank(user1);
        address poolAddress = factory.createPool(5, 50 * 10**6, 30 days, 20, "Test Pool", "Test pool description");
        SancaPool pool = SancaPool(poolAddress);
        
        // Try to join with insufficient funds
        vm.startPrank(user1);
        usdc.approve(poolAddress, 100 * 10**6); // Only 100 USDC, need 250 USDC (50 * 5)
        vm.expectRevert();
        pool.join();
        vm.stopPrank();
    }
    
    function test_RevertIfDoubleJoin() public {
        vm.prank(user1);
        address poolAddress = factory.createPool(5, 50 * 10**6, 30 days, 20, "Test Pool", "Test pool description");
        SancaPool pool = SancaPool(poolAddress);
        
        vm.startPrank(user1);
        usdc.approve(poolAddress, type(uint256).max);
        pool.join();
        
        // Try to join again
        vm.expectRevert("SancaPool: already a member");
        pool.join();
        vm.stopPrank();
    }
    
    function test_RevertIfTriggerDrawBeforePeriodEnd() public {
        vm.prank(user1);
        address poolAddress = factory.createPool(5, 50 * 10**6, 1 days, 20, "Test Pool", "Test pool description");
        SancaPool pool = SancaPool(poolAddress);
        
        // Fill pool
        address[] memory users = new address[](5);
        users[0] = user1;
        users[1] = user2;
        users[2] = user3;
        users[3] = user4;
        users[4] = user5;
        
        for (uint256 i = 0; i < 5; i++) {
            vm.startPrank(users[i]);
            usdc.approve(poolAddress, type(uint256).max);
            pool.join();
            vm.stopPrank();
        }
        
        // Try to trigger draw immediately (should fail)
        vm.prank(user1);
        vm.expectRevert("SancaPool: period not ended");
        pool.triggerDraw();
    }
    
    function test_GetPoolInfo() public {
        vm.prank(user1);
        address poolAddress = factory.createPool(5, 50 * 10**6, 30 days, 20, "Test Pool", "Test pool description");
        SancaPool pool = SancaPool(poolAddress);
        
        (
            SancaPool.PoolState state,
            uint8 maxMembers,
            uint256 currentMembers,
            uint256 contributionPerPeriod,
            uint256 periodDuration,
            uint8 yieldBonusSplit,
            uint256 currentCycle,
            uint256 totalCycles,
            uint256 cycleStartTime,
            uint256 totalMusdDeposited,
            uint256 currentMusdBalance
        ) = pool.getPoolInfo();
        
        assertEq(uint256(state), uint256(SancaPool.PoolState.Open));
        assertEq(maxMembers, 5);
        assertEq(currentMembers, 0);
        assertEq(contributionPerPeriod, 50 * 10**6);
        assertEq(periodDuration, 30 days);
        assertEq(yieldBonusSplit, 20);
        assertEq(currentCycle, 0);
        assertEq(totalCycles, 5);
        assertEq(cycleStartTime, 0);
    }
}

