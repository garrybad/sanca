// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title MockOracle
 * @notice Mock oracle that simulates IRWADynamicOracle for rUSDY price
 * @dev Simulates ~5% APY by increasing price over time
 */
interface IRWADynamicOracle {
    function getPrice() external view returns (uint256);
}

contract MockOracle is IRWADynamicOracle {
    // Base price: 1e18 (represents 1.0)
    uint256 public constant BASE_PRICE = 1e18;
    
    // ~5% APY = 1.000136986301369863 per day (compounded daily)
    uint256 public constant DAILY_RATE = 1.000136986301369863e18; // 18 decimals
    uint256 public constant SECONDS_PER_DAY = 86400;
    
    // Deployment timestamp (base time for price calculation)
    uint256 public immutable deploymentTime;
    
    event PriceUpdated(uint256 newPrice);
    
    constructor() {
        deploymentTime = block.timestamp;
    }
    
    /**
     * @notice Get current USDY price (increases over time to simulate yield)
     * @return Price in 18 decimals (e.g., 1.05e18 = 1.05 = 5% yield)
     */
    function getPrice() external view override returns (uint256) {
        // Calculate days elapsed since deployment
        uint256 secondsElapsed = block.timestamp - deploymentTime;
        uint256 daysElapsed = secondsElapsed / SECONDS_PER_DAY;
        
        if (daysElapsed == 0) return BASE_PRICE;
        
        // Apply daily rate (compounded)
        // price = BASE_PRICE * (DAILY_RATE ^ daysElapsed)
        uint256 price = BASE_PRICE;
        for (uint256 i = 0; i < daysElapsed && i < 365; i++) { // Cap at 365 days for gas efficiency
            price = (price * DAILY_RATE) / 1e18;
        }
        
        return price;
    }
    
    /**
     * @notice Get price at a specific timestamp (for testing)
     * @param timestamp Timestamp to get price for
     * @return Price at that timestamp
     */
    function getPriceAt(uint256 timestamp) external view returns (uint256) {
        require(timestamp >= deploymentTime, "MockOracle: timestamp before deployment");
        
        uint256 secondsElapsed = timestamp - deploymentTime;
        uint256 daysElapsed = secondsElapsed / SECONDS_PER_DAY;
        
        if (daysElapsed == 0) return BASE_PRICE;
        
        uint256 price = BASE_PRICE;
        for (uint256 i = 0; i < daysElapsed && i < 365; i++) {
            price = (price * DAILY_RATE) / 1e18;
        }
        
        return price;
    }
}

