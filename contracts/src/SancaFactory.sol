// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./SancaPool.sol";

/**
 * @title SancaFactory
 * @notice Factory contract for creating Arisan pools using minimal proxy pattern (EIP-1167)
 * @dev Gas-efficient pool creation using clone pattern
 */
contract SancaFactory is Ownable {
    using Clones for address;
    
    // Implementation contract address (SancaPool)
    address public immutable poolImplementation;
    
    // Configuration addresses
    address public usdc;
    address public musd;
    address public supraRouter;
    address public clientWalletAddress; // Whitelisted EOA for Supra VRF (must be whitelisted in Deposit Contract)
    address public dexRouter; // For mainnet: Agni router for USDC↔USDY swaps
    address public usdy; // For mainnet: Real USDY token (0x5be26527e817998A7206475496fDE1E68957c5a6)
    
    // Pool tracking
    address[] public pools;
    mapping(address => bool) public isPool;
    mapping(address => address) public poolCreator; // pool => creator
    
    // Events
    event PoolCreated(
        address indexed pool,
        address indexed creator,
        uint8 maxMembers,
        uint256 contributionPerPeriod,
        uint256 periodDuration,
        uint8 yieldBonusSplit,
        string poolName,
        string poolDescription
    );
    
    event ConfigUpdated(string indexed configType, address newAddress);
    
    /**
     * @notice Constructor
     * @param _poolImplementation Address of SancaPool implementation contract
     * @param _usdc USDC token address
     * @param _musd mUSD token address (MockmUSD in testnet)
     * @param _supraRouter Supra VRF router address
     * @param _clientWalletAddress Whitelisted EOA address for Supra VRF (must be whitelisted in Deposit Contract)
     */
    constructor(
        address _poolImplementation,
        address _usdc,
        address _musd,
        address _supraRouter,
        address _clientWalletAddress
    ) Ownable(msg.sender) {
        require(_poolImplementation != address(0), "SancaFactory: invalid implementation");
        require(_usdc != address(0), "SancaFactory: invalid USDC");
        require(_musd != address(0), "SancaFactory: invalid mUSD");
        require(_supraRouter != address(0), "SancaFactory: invalid Supra router");
        require(_clientWalletAddress != address(0), "SancaFactory: invalid clientWalletAddress");
        
        poolImplementation = _poolImplementation;
        usdc = _usdc;
        musd = _musd;
        supraRouter = _supraRouter;
        clientWalletAddress = _clientWalletAddress;
    }
    
    /**
     * @notice Create a new Arisan pool
     * @param _maxMembers Maximum number of members (minimum 2)
     * @param _contributionPerPeriod Contribution amount per period in USDC (6 decimals, e.g., 50e6 for 50 USDC)
     * @param _periodDuration Period duration in seconds (e.g., 2592000 for 30 days)
     * @param _yieldBonusSplit Percentage of yield to winner (0-100)
     * @param _poolName Name of the pool
     * @param _poolDescription Description of the pool
     * @return pool Address of the newly created pool
     */
    function createPool(
        uint8 _maxMembers,
        uint256 _contributionPerPeriod,
        uint256 _periodDuration,
        uint8 _yieldBonusSplit,
        string memory _poolName,
        string memory _poolDescription
    ) external returns (address pool) {
        require(_maxMembers > 1, "SancaFactory: invalid maxMembers");
        require(_contributionPerPeriod > 0, "SancaFactory: invalid contribution");
        require(_periodDuration > 0, "SancaFactory: invalid periodDuration");
        require(_yieldBonusSplit <= 100, "SancaFactory: invalid yieldBonusSplit");
        require(bytes(_poolName).length > 0, "SancaFactory: empty pool name");
        
        // Clone the implementation contract using EIP-1167 minimal proxy
        pool = Clones.clone(poolImplementation);
        
        // Initialize the pool
        SancaPool(pool).initialize(
            msg.sender,
            _maxMembers,
            _contributionPerPeriod,
            _periodDuration,
            _yieldBonusSplit,
            _poolName,
            _poolDescription,
            usdc,
            musd,
            supraRouter,
            clientWalletAddress
        );
        
        // Track the pool
        pools.push(pool);
        isPool[pool] = true;
        poolCreator[pool] = msg.sender;
        
        emit PoolCreated(
            pool,
            msg.sender,
            _maxMembers,
            _contributionPerPeriod,
            _periodDuration,
            _yieldBonusSplit,
            _poolName,
            _poolDescription
        );
        
        // Note: Auto-whitelist is handled by backend cronjob script
        // See scripts/auto-whitelist-pools.sh for implementation
        
        return pool;
    }
    
    /**
     * @notice Update configuration addresses (owner only)
     * @dev For mainnet upgrades: add DEX router, USDY address, etc.
     */
    function setUSDC(address _usdc) external onlyOwner {
        require(_usdc != address(0), "SancaFactory: invalid address");
        usdc = _usdc;
        emit ConfigUpdated("USDC", _usdc);
    }
    
    function setMUSD(address _musd) external onlyOwner {
        require(_musd != address(0), "SancaFactory: invalid address");
        musd = _musd;
        emit ConfigUpdated("mUSD", _musd);
    }
    
    function setSupraRouter(address _supraRouter) external onlyOwner {
        require(_supraRouter != address(0), "SancaFactory: invalid address");
        supraRouter = _supraRouter;
        emit ConfigUpdated("SupraRouter", _supraRouter);
    }
    
    /**
     * @notice Set client wallet address for Supra VRF (must be whitelisted EOA)
     * @param _clientWalletAddress Whitelisted EOA address
     */
    function setClientWalletAddress(address _clientWalletAddress) external onlyOwner {
        require(_clientWalletAddress != address(0), "SancaFactory: invalid address");
        clientWalletAddress = _clientWalletAddress;
        emit ConfigUpdated("ClientWallet", _clientWalletAddress);
    }
    
    /**
     * @notice Set DEX router for mainnet (Agni router for USDC↔USDY swaps)
     * @param _dexRouter DEX router address
     */
    function setDEXRouter(address _dexRouter) external onlyOwner {
        dexRouter = _dexRouter;
        emit ConfigUpdated("DEXRouter", _dexRouter);
    }
    
    /**
     * @notice Set USDY address for mainnet
     * @param _usdy USDY token address (0x5be26527e817998A7206475496fDE1E68957c5a6)
     */
    function setUSDY(address _usdy) external onlyOwner {
        usdy = _usdy;
        emit ConfigUpdated("USDY", _usdy);
    }
    
    /**
     * @notice Get total number of pools created
     * @return Total pools count
     */
    function getPoolCount() external view returns (uint256) {
        return pools.length;
    }
    
    /**
     * @notice Get pool address by index
     * @param index Pool index
     * @return Pool address
     */
    function getPool(uint256 index) external view returns (address) {
        require(index < pools.length, "SancaFactory: invalid index");
        return pools[index];
    }
    
    /**
     * @notice Get all pools
     * @return Array of all pool addresses
     */
    function getAllPools() external view returns (address[] memory) {
        return pools;
    }
}

