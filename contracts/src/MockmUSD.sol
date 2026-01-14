// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./MockOracle.sol";

/**
 * @title MockmUSD
 * @notice Mock rebasing yield-bearing token that simulates mUSD/rUSDY behavior
 * @dev Uses shares-based system with oracle price (similar to rUSDY)
 *      Balance = shares * oracle.getPrice() / (1e18 * BPS_DENOMINATOR)
 *      Mainnet: Replace with real mUSD wrapper (0xab575258d37EaA5C8956EfABe71F4eE8F6397cF3)
 */
contract MockmUSD is ERC20, Ownable {
    // BPS denominator (10,000) - same as rUSDY
    uint256 public constant BPS_DENOMINATOR = 10_000;
    
    // Shares tracking (similar to rUSDY)
    mapping(address => uint256) private shares;
    
    // Total shares in existence
    uint256 private totalShares;
    
    // Oracle for price calculation
    IRWADynamicOracle public oracle;
    
    // USDC address (for wrapping/unwrapping simulation)
    address public immutable usdc;
    
    // Error when redeeming shares < BPS_DENOMINATOR
    error UnwrapTooSmall();
    
    event Wrapped(address indexed user, uint256 usdcAmount, uint256 musdAmount, uint256 shares);
    event Unwrapped(address indexed user, uint256 musdAmount, uint256 usdcAmount, uint256 shares);
    event PriceUpdated(uint256 newPrice);
    
    constructor(address _usdc, address _oracle) ERC20("Mock mUSD", "mUSD") Ownable(msg.sender) {
        require(_usdc != address(0), "MockmUSD: invalid USDC");
        require(_oracle != address(0), "MockmUSD: invalid oracle");
        usdc = _usdc;
        oracle = IRWADynamicOracle(_oracle);
    }
    
    /**
     * @notice Wrap USDC to mUSD (simulate deposit USDY → receive mUSD)
     * @dev In testnet: Direct 1:1 conversion. Mainnet: Add DEX swap USDC→USDY then wrap
     * @param amount Amount of USDC to wrap
     * @return musdAmount Amount of mUSD received
     */
    function wrap(uint256 amount) external returns (uint256 musdAmount) {
        require(amount > 0, "MockmUSD: amount must be > 0");
        
        // Transfer USDC from user
        IERC20(usdc).transferFrom(msg.sender, address(this), amount);
        
        // In testnet: 1:1 conversion (no swap, no real USDY wrapping)
        // Mainnet: Would swap USDC→USDY via DEX, then wrap USDY→mUSD
        
        // Mint shares: amount * BPS_DENOMINATOR (same as rUSDY)
        uint256 sharesToMint = amount * BPS_DENOMINATOR;
        _mintShares(msg.sender, sharesToMint);
        
        // Calculate mUSD amount based on current price
        musdAmount = getRUSDYByShares(sharesToMint);
        
        emit Wrapped(msg.sender, amount, musdAmount, sharesToMint);
        return musdAmount;
    }
    
    /**
     * @notice Unwrap mUSD to USDC (simulate redeem mUSD → receive USDC)
     * @dev In testnet: Direct conversion. Mainnet: Unwrap mUSD→USDY then swap USDY→USDC
     * @param amount Amount of mUSD to unwrap
     * @return usdcAmount Amount of USDC received
     */
    function unwrap(uint256 amount) external returns (uint256 usdcAmount) {
        require(amount > 0, "MockmUSD: amount must be > 0");
        
        // Convert rUSDY amount to shares
        uint256 sharesToBurn = getSharesByRUSDY(amount);
        if (sharesToBurn < BPS_DENOMINATOR) revert UnwrapTooSmall();
        
        // Burn shares
        _burnShares(msg.sender, sharesToBurn);
        
        // Calculate USDC amount: shares / BPS_DENOMINATOR
        usdcAmount = sharesToBurn / BPS_DENOMINATOR;
        
        // In testnet: 1:1 conversion (no swap, no real USDY unwrapping)
        // Mainnet: Would unwrap mUSD→USDY, then swap USDY→USDC via DEX
        
        // Transfer USDC to user
        IERC20(usdc).transfer(msg.sender, usdcAmount);
        
        emit Unwrapped(msg.sender, amount, usdcAmount, sharesToBurn);
        return usdcAmount;
    }
    
    /**
     * @notice Get current balance with rebase applied (shares * price)
     * @param account Account to check balance for
     * @return Current rebased balance
     */
    function balanceOf(address account) public view override returns (uint256) {
        return getRUSDYByShares(shares[account]);
    }
    
    /**
     * @notice Get total supply with rebase applied
     * @return Current rebased total supply
     */
    function totalSupply() public view override returns (uint256) {
        return getRUSDYByShares(totalShares);
    }
    
    /**
     * @notice Get shares for an account
     * @param account Account to check
     * @return Shares amount
     */
    function sharesOf(address account) external view returns (uint256) {
        return shares[account];
    }
    
    /**
     * @notice Get total shares
     * @return Total shares amount
     */
    function totalSharesAmount() external view returns (uint256) {
        return totalShares;
    }
    
    /**
     * @notice Convert rUSDY amount to shares
     * @param rUSDYAmount Amount of rUSDY
     * @return Shares amount
     */
    function getSharesByRUSDY(uint256 rUSDYAmount) public view returns (uint256) {
        uint256 price = oracle.getPrice();
        if (price == 0) return 0;
        return (rUSDYAmount * 1e18 * BPS_DENOMINATOR) / price;
    }
    
    /**
     * @notice Convert shares to rUSDY amount
     * @param sharesAmount Amount of shares
     * @return rUSDY amount
     */
    function getRUSDYByShares(uint256 sharesAmount) public view returns (uint256) {
        uint256 price = oracle.getPrice();
        return (sharesAmount * price) / (1e18 * BPS_DENOMINATOR);
    }
    
    /**
     * @notice Mint shares to an account
     * @param account Account to mint shares to
     * @param sharesAmount Amount of shares to mint
     */
    function _mintShares(address account, uint256 sharesAmount) internal {
        require(account != address(0), "MockmUSD: mint to zero address");
        
        totalShares += sharesAmount;
        shares[account] += sharesAmount;
        
        // Emit Transfer event for balance change
        uint256 balance = getRUSDYByShares(shares[account]);
        emit Transfer(address(0), account, balance);
    }
    
    /**
     * @notice Burn shares from an account
     * @param account Account to burn shares from
     * @param sharesAmount Amount of shares to burn
     */
    function _burnShares(address account, uint256 sharesAmount) internal {
        require(account != address(0), "MockmUSD: burn from zero address");
        require(shares[account] >= sharesAmount, "MockmUSD: insufficient shares");
        
        uint256 preRebaseAmount = getRUSDYByShares(sharesAmount);
        
        totalShares -= sharesAmount;
        shares[account] -= sharesAmount;
        
        // Emit Transfer event for balance change
        uint256 balance = getRUSDYByShares(shares[account]);
        emit Transfer(account, address(0), preRebaseAmount);
    }
    
    /**
     * @notice Override transfer to handle shares-based system
     */
    function transfer(address to, uint256 amount) public override returns (bool) {
        address owner = msg.sender;
        _transfer(owner, to, amount);
        return true;
    }
    
    /**
     * @notice Override transferFrom to handle shares-based system
     */
    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        address spender = msg.sender;
        _spendAllowance(from, spender, amount);
        _transfer(from, to, amount);
        return true;
    }
    
    /**
     * @notice Internal transfer function (shares-based)
     * @dev Override ERC20 _update to use shares system
     */
    function _update(address from, address to, uint256 amount) internal override {
        if (from == address(0)) {
            // Minting handled by _mintShares - don't call super
            return;
        }
        if (to == address(0)) {
            // Burning handled by _burnShares - don't call super
            return;
        }
        
        // Regular transfer: convert amount to shares
        uint256 sharesToTransfer = getSharesByRUSDY(amount);
        require(shares[from] >= sharesToTransfer, "MockmUSD: insufficient balance");
        
        shares[from] -= sharesToTransfer;
        shares[to] += sharesToTransfer;
        
        // Call parent to emit Transfer event
        super._update(from, to, amount);
    }
    
    /**
     * @notice Set oracle address (owner only)
     * @param _oracle New oracle address
     */
    function setOracle(address _oracle) external onlyOwner {
        require(_oracle != address(0), "MockmUSD: invalid oracle");
        oracle = IRWADynamicOracle(_oracle);
        emit PriceUpdated(oracle.getPrice());
    }
    
    /**
     * @notice Get accrued yield for an account
     * @param account Account to check
     * @return Accrued yield amount
     */
    function getAccruedYield(address account) external view returns (uint256) {
        uint256 accountShares = shares[account];
        if (accountShares == 0) return 0;
        
        // Calculate initial value (at base price 1e18)
        uint256 initialValue = accountShares / BPS_DENOMINATOR;
        
        // Calculate current value
        uint256 currentValue = getRUSDYByShares(accountShares);
        
        // Yield = current - initial
        return currentValue > initialValue ? currentValue - initialValue : 0;
    }
}
