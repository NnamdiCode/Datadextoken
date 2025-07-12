// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./DataRegistry.sol";
import "./DataAMM.sol";
import "./DataToken.sol";

/**
 * @title DataMarketplace
 * @dev Main marketplace contract that orchestrates the data tokenization ecosystem
 */
contract DataMarketplace {
    DataRegistry public registry;
    DataAMM public amm;
    
    struct MarketStats {
        uint256 totalTokens;
        uint256 totalVolume;
        uint256 totalTrades;
        uint256 totalUsers;
    }
    
    struct UserStats {
        uint256 tokensCreated;
        uint256 totalTrades;
        uint256 totalVolume;
        uint256 liquidityProvided;
        uint256 joinedAt;
    }
    
    struct TokenListing {
        address token;
        uint256 price;
        uint256 lastUpdated;
        bool isActive;
        uint256 volume24h;
        uint256 trades24h;
    }
    
    mapping(address => TokenListing) public tokenListings;
    mapping(address => UserStats) public userStats;
    mapping(address => bool) public registeredUsers;
    
    address[] public listedTokens;
    address[] public allUsers;
    
    uint256 public platformFee = 25; // 0.25% (25/10000)
    address public feeRecipient;
    address public owner;
    
    MarketStats public marketStats;
    
    event TokenListed(
        address indexed token,
        address indexed creator,
        uint256 price,
        uint256 timestamp
    );
    
    event PriceUpdated(
        address indexed token,
        uint256 oldPrice,
        uint256 newPrice,
        uint256 timestamp
    );
    
    event TradeExecuted(
        address indexed trader,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint256 fee,
        uint256 timestamp
    );
    
    event UserRegistered(
        address indexed user,
        uint256 timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "DataMarketplace: caller is not the owner");
        _;
    }

    constructor(address _registry, address _amm) {
        require(_registry != address(0), "DataMarketplace: invalid registry address");
        require(_amm != address(0), "DataMarketplace: invalid AMM address");
        
        registry = DataRegistry(_registry);
        amm = DataAMM(_amm);
        owner = msg.sender;
        feeRecipient = msg.sender;
    }

    /**
     * @dev Create a new data token and list it on the marketplace
     */
    function createAndListToken(
        string memory name,
        string memory symbol,
        string memory dataHash,
        string memory metadata,
        uint256 initialPrice
    ) external returns (address) {
        // Register user if not already registered
        if (!registeredUsers[msg.sender]) {
            _registerUser(msg.sender);
        }
        
        // Create token through registry
        address tokenAddress = registry.createDataToken(name, symbol, dataHash, metadata);
        
        // List token on marketplace
        _listToken(tokenAddress, initialPrice);
        
        // Update user stats
        userStats[msg.sender].tokensCreated++;
        
        // Update market stats
        marketStats.totalTokens++;
        
        return tokenAddress;
    }

    /**
     * @dev List an existing token on the marketplace
     */
    function listToken(address token, uint256 price) external {
        require(registry.isValidToken(token), "DataMarketplace: invalid token");
        
        DataToken dataToken = DataToken(token);
        require(dataToken.creator() == msg.sender, "DataMarketplace: not token creator");
        
        _listToken(token, price);
    }

    /**
     * @dev Update token price
     */
    function updateTokenPrice(address token, uint256 newPrice) external {
        require(tokenListings[token].token != address(0), "DataMarketplace: token not listed");
        
        DataToken dataToken = DataToken(token);
        require(dataToken.creator() == msg.sender, "DataMarketplace: not token creator");
        
        uint256 oldPrice = tokenListings[token].price;
        tokenListings[token].price = newPrice;
        tokenListings[token].lastUpdated = block.timestamp;
        
        emit PriceUpdated(token, oldPrice, newPrice, block.timestamp);
    }

    /**
     * @dev Execute a trade through the AMM with marketplace fee
     */
    function executeTradeWithFee(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut
    ) external returns (uint256 amountOut) {
        require(registeredUsers[msg.sender], "DataMarketplace: user not registered");
        
        // Calculate marketplace fee
        uint256 marketplaceFee = (amountIn * platformFee) / 10000;
        uint256 amountAfterFee = amountIn - marketplaceFee;
        
        // Transfer tokens from user
        DataToken(tokenIn).transferFrom(msg.sender, address(this), amountIn);
        
        // Transfer fee to fee recipient
        if (marketplaceFee > 0) {
            DataToken(tokenIn).transfer(feeRecipient, marketplaceFee);
        }
        
        // Approve AMM to spend tokens
        DataToken(tokenIn).approve(address(amm), amountAfterFee);
        
        // Execute trade through AMM
        amountOut = amm.swap(tokenIn, tokenOut, amountAfterFee, minAmountOut);
        
        // Transfer output tokens to user
        DataToken(tokenOut).transfer(msg.sender, amountOut);
        
        // Update stats
        _updateTradeStats(msg.sender, tokenIn, tokenOut, amountIn, amountOut, marketplaceFee);
        
        emit TradeExecuted(msg.sender, tokenIn, tokenOut, amountIn, amountOut, marketplaceFee, block.timestamp);
        
        return amountOut;
    }

    /**
     * @dev Get token price with market data
     */
    function getTokenPrice(address token) external view returns (uint256) {
        return tokenListings[token].price;
    }

    /**
     * @dev Get market statistics
     */
    function getMarketStats() external view returns (
        uint256 totalTokens,
        uint256 totalVolume,
        uint256 totalTrades
    ) {
        return (
            marketStats.totalTokens,
            marketStats.totalVolume,
            marketStats.totalTrades
        );
    }

    /**
     * @dev Get user statistics
     */
    function getUserStats(address user) external view returns (
        uint256 tokensCreated,
        uint256 totalTrades,
        uint256 totalVolume
    ) {
        UserStats memory stats = userStats[user];
        return (
            stats.tokensCreated,
            stats.totalTrades,
            stats.totalVolume
        );
    }

    /**
     * @dev Get all listed tokens
     */
    function getListedTokens() external view returns (address[] memory) {
        return listedTokens;
    }

    /**
     * @dev Get paginated token listings
     */
    function getTokenListingsPaginated(uint256 offset, uint256 limit)
        external view returns (
            address[] memory tokens,
            uint256[] memory prices,
            bool[] memory isActive,
            uint256 total
        ) {
        total = listedTokens.length;
        
        if (offset >= total) {
            return (new address[](0), new uint256[](0), new bool[](0), total);
        }
        
        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }
        
        tokens = new address[](end - offset);
        prices = new uint256[](end - offset);
        isActive = new bool[](end - offset);
        
        for (uint256 i = offset; i < end; i++) {
            address token = listedTokens[i];
            tokens[i - offset] = token;
            prices[i - offset] = tokenListings[token].price;
            isActive[i - offset] = tokenListings[token].isActive;
        }
        
        return (tokens, prices, isActive, total);
    }

    /**
     * @dev Get top tokens by volume
     */
    function getTopTokensByVolume(uint256 count) external view returns (
        address[] memory tokens,
        uint256[] memory volumes
    ) {
        // This is a simplified implementation
        // In production, you might want to maintain a sorted list or use more efficient sorting
        if (count > listedTokens.length) {
            count = listedTokens.length;
        }
        
        tokens = new address[](count);
        volumes = new uint256[](count);
        
        // Simple selection of first N tokens (in production, implement proper sorting)
        for (uint256 i = 0; i < count && i < listedTokens.length; i++) {
            tokens[i] = listedTokens[i];
            volumes[i] = tokenListings[listedTokens[i]].volume24h;
        }
        
        return (tokens, volumes);
    }

    /**
     * @dev Register a new user
     */
    function registerUser() external {
        _registerUser(msg.sender);
    }

    /**
     * @dev Internal function to register a user
     */
    function _registerUser(address user) internal {
        if (!registeredUsers[user]) {
            registeredUsers[user] = true;
            allUsers.push(user);
            userStats[user].joinedAt = block.timestamp;
            marketStats.totalUsers++;
            
            emit UserRegistered(user, block.timestamp);
        }
    }

    /**
     * @dev Internal function to list a token
     */
    function _listToken(address token, uint256 price) internal {
        require(price > 0, "DataMarketplace: invalid price");
        
        if (tokenListings[token].token == address(0)) {
            // First time listing
            listedTokens.push(token);
        }
        
        tokenListings[token] = TokenListing({
            token: token,
            price: price,
            lastUpdated: block.timestamp,
            isActive: true,
            volume24h: 0,
            trades24h: 0
        });
        
        DataToken dataToken = DataToken(token);
        emit TokenListed(token, dataToken.creator(), price, block.timestamp);
    }

    /**
     * @dev Internal function to update trade statistics
     */
    function _updateTradeStats(
        address trader,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint256 fee
    ) internal {
        // Update user stats
        userStats[trader].totalTrades++;
        userStats[trader].totalVolume += amountIn;
        
        // Update market stats
        marketStats.totalTrades++;
        marketStats.totalVolume += amountIn;
        
        // Update token listing stats (simplified 24h tracking)
        if (tokenListings[tokenIn].token != address(0)) {
            tokenListings[tokenIn].volume24h += amountIn;
            tokenListings[tokenIn].trades24h++;
        }
        
        if (tokenListings[tokenOut].token != address(0)) {
            tokenListings[tokenOut].volume24h += amountOut;
            tokenListings[tokenOut].trades24h++;
        }
    }

    /**
     * @dev Admin functions
     */
    function setPlatformFee(uint256 _platformFee) external onlyOwner {
        require(_platformFee <= 100, "DataMarketplace: fee too high"); // Max 1%
        platformFee = _platformFee;
    }

    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        require(_feeRecipient != address(0), "DataMarketplace: invalid fee recipient");
        feeRecipient = _feeRecipient;
    }

    function deactivateTokenListing(address token) external onlyOwner {
        require(tokenListings[token].token != address(0), "DataMarketplace: token not listed");
        tokenListings[token].isActive = false;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "DataMarketplace: new owner is the zero address");
        owner = newOwner;
    }

    /**
     * @dev Get total number of users
     */
    function getTotalUsers() external view returns (uint256) {
        return allUsers.length;
    }

    /**
     * @dev Check if user is registered
     */
    function isUserRegistered(address user) external view returns (bool) {
        return registeredUsers[user];
    }
}
