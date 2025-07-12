// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./DataToken.sol";

/**
 * @title DataAMM
 * @dev Automated Market Maker for trading data tokens
 * Uses constant product formula (x * y = k) for price discovery
 */
contract DataAMM {
    struct Pool {
        uint256 reserveA;
        uint256 reserveB;
        uint256 totalLiquidity;
        uint256 lastUpdate;
        mapping(address => uint256) liquidityBalance;
    }

    struct TradeInfo {
        address trader;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 amountOut;
        uint256 fee;
        uint256 timestamp;
    }

    mapping(address => mapping(address => Pool)) public pools;
    mapping(bytes32 => bool) public poolExists;
    
    address[] public allPools;
    TradeInfo[] public tradeHistory;
    
    uint256 public constant FEE_RATE = 30; // 0.3% (30/10000)
    uint256 public constant MINIMUM_LIQUIDITY = 1000;
    
    address public owner;
    address public feeRecipient;
    bool public tradingEnabled = true;
    
    event PoolCreated(
        address indexed tokenA,
        address indexed tokenB,
        uint256 amountA,
        uint256 amountB,
        uint256 liquidity,
        address indexed provider
    );
    
    event LiquidityAdded(
        address indexed provider,
        address indexed tokenA,
        address indexed tokenB,
        uint256 amountA,
        uint256 amountB,
        uint256 liquidity
    );
    
    event LiquidityRemoved(
        address indexed provider,
        address indexed tokenA,
        address indexed tokenB,
        uint256 amountA,
        uint256 amountB,
        uint256 liquidity
    );
    
    event Swap(
        address indexed trader,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint256 fee
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "DataAMM: caller is not the owner");
        _;
    }

    modifier tradingActive() {
        require(tradingEnabled, "DataAMM: trading is disabled");
        _;
    }

    constructor() {
        owner = msg.sender;
        feeRecipient = msg.sender;
    }

    /**
     * @dev Add liquidity to a trading pair
     */
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountA,
        uint256 amountB
    ) external tradingActive returns (uint256 liquidity) {
        require(tokenA != tokenB, "DataAMM: identical tokens");
        require(amountA > 0 && amountB > 0, "DataAMM: insufficient amounts");
        
        // Sort tokens to ensure consistent ordering
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        (uint256 amount0, uint256 amount1) = tokenA < tokenB ? (amountA, amountB) : (amountB, amountA);
        
        bytes32 poolId = keccak256(abi.encodePacked(token0, token1));
        Pool storage pool = pools[token0][token1];
        
        // Transfer tokens from user
        DataToken(tokenA).transferFrom(msg.sender, address(this), amountA);
        DataToken(tokenB).transferFrom(msg.sender, address(this), amountB);
        
        if (!poolExists[poolId]) {
            // First liquidity provider
            liquidity = sqrt(amount0 * amount1) - MINIMUM_LIQUIDITY;
            pool.totalLiquidity = liquidity + MINIMUM_LIQUIDITY;
            
            poolExists[poolId] = true;
            allPools.push(token0);
            
            emit PoolCreated(tokenA, tokenB, amountA, amountB, liquidity, msg.sender);
        } else {
            // Subsequent liquidity providers
            liquidity = min(
                (amount0 * pool.totalLiquidity) / pool.reserveA,
                (amount1 * pool.totalLiquidity) / pool.reserveB
            );
            require(liquidity > 0, "DataAMM: insufficient liquidity minted");
            
            pool.totalLiquidity += liquidity;
        }
        
        pool.reserveA += amount0;
        pool.reserveB += amount1;
        pool.liquidityBalance[msg.sender] += liquidity;
        pool.lastUpdate = block.timestamp;
        
        emit LiquidityAdded(msg.sender, tokenA, tokenB, amountA, amountB, liquidity);
        
        return liquidity;
    }

    /**
     * @dev Remove liquidity from a trading pair
     */
    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity
    ) external returns (uint256 amountA, uint256 amountB) {
        require(liquidity > 0, "DataAMM: insufficient liquidity");
        
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        Pool storage pool = pools[token0][token1];
        
        require(pool.liquidityBalance[msg.sender] >= liquidity, "DataAMM: insufficient balance");
        require(pool.totalLiquidity > 0, "DataAMM: no liquidity");
        
        // Calculate token amounts to return
        uint256 amount0 = (liquidity * pool.reserveA) / pool.totalLiquidity;
        uint256 amount1 = (liquidity * pool.reserveB) / pool.totalLiquidity;
        
        require(amount0 > 0 && amount1 > 0, "DataAMM: insufficient liquidity burned");
        
        // Update pool state
        pool.liquidityBalance[msg.sender] -= liquidity;
        pool.totalLiquidity -= liquidity;
        pool.reserveA -= amount0;
        pool.reserveB -= amount1;
        pool.lastUpdate = block.timestamp;
        
        // Determine which amount corresponds to which token
        (amountA, amountB) = tokenA < tokenB ? (amount0, amount1) : (amount1, amount0);
        
        // Transfer tokens back to user
        DataToken(tokenA).transfer(msg.sender, amountA);
        DataToken(tokenB).transfer(msg.sender, amountB);
        
        emit LiquidityRemoved(msg.sender, tokenA, tokenB, amountA, amountB, liquidity);
    }

    /**
     * @dev Execute a token swap
     */
    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut
    ) external tradingActive returns (uint256 amountOut) {
        require(tokenIn != tokenOut, "DataAMM: identical tokens");
        require(amountIn > 0, "DataAMM: insufficient input amount");
        
        (address token0, address token1) = tokenIn < tokenOut ? (tokenIn, tokenOut) : (tokenOut, tokenIn);
        Pool storage pool = pools[token0][token1];
        
        require(pool.totalLiquidity > 0, "DataAMM: no liquidity");
        
        // Calculate output amount with fee
        amountOut = getAmountOut(amountIn, tokenIn, tokenOut);
        require(amountOut >= minAmountOut, "DataAMM: insufficient output amount");
        require(amountOut > 0, "DataAMM: insufficient output amount");
        
        // Calculate fee
        uint256 fee = (amountIn * FEE_RATE) / 10000;
        uint256 amountInAfterFee = amountIn - fee;
        
        // Update reserves
        if (tokenIn == token0) {
            require(amountOut <= pool.reserveB, "DataAMM: insufficient liquidity");
            pool.reserveA += amountInAfterFee;
            pool.reserveB -= amountOut;
        } else {
            require(amountOut <= pool.reserveA, "DataAMM: insufficient liquidity");
            pool.reserveB += amountInAfterFee;
            pool.reserveA -= amountOut;
        }
        
        pool.lastUpdate = block.timestamp;
        
        // Transfer tokens
        DataToken(tokenIn).transferFrom(msg.sender, address(this), amountIn);
        DataToken(tokenOut).transfer(msg.sender, amountOut);
        
        // Transfer fee to fee recipient
        if (fee > 0) {
            DataToken(tokenIn).transfer(feeRecipient, fee);
        }
        
        // Record trade
        tradeHistory.push(TradeInfo({
            trader: msg.sender,
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            amountIn: amountIn,
            amountOut: amountOut,
            fee: fee,
            timestamp: block.timestamp
        }));
        
        emit Swap(msg.sender, tokenIn, tokenOut, amountIn, amountOut, fee);
        
        return amountOut;
    }

    /**
     * @dev Get output amount for a given input (including fee)
     */
    function getAmountOut(
        uint256 amountIn,
        address tokenIn,
        address tokenOut
    ) public view returns (uint256 amountOut) {
        require(amountIn > 0, "DataAMM: insufficient input amount");
        require(tokenIn != tokenOut, "DataAMM: identical tokens");
        
        (address token0, address token1) = tokenIn < tokenOut ? (tokenIn, tokenOut) : (tokenOut, tokenIn);
        Pool storage pool = pools[token0][token1];
        
        require(pool.totalLiquidity > 0, "DataAMM: no liquidity");
        
        uint256 amountInWithFee = amountIn * (10000 - FEE_RATE);
        
        if (tokenIn == token0) {
            uint256 numerator = amountInWithFee * pool.reserveB;
            uint256 denominator = (pool.reserveA * 10000) + amountInWithFee;
            amountOut = numerator / denominator;
        } else {
            uint256 numerator = amountInWithFee * pool.reserveA;
            uint256 denominator = (pool.reserveB * 10000) + amountInWithFee;
            amountOut = numerator / denominator;
        }
        
        return amountOut;
    }

    /**
     * @dev Get input amount required for a given output
     */
    function getAmountIn(
        uint256 amountOut,
        address tokenIn,
        address tokenOut
    ) public view returns (uint256 amountIn) {
        require(amountOut > 0, "DataAMM: insufficient output amount");
        require(tokenIn != tokenOut, "DataAMM: identical tokens");
        
        (address token0, address token1) = tokenIn < tokenOut ? (tokenIn, tokenOut) : (tokenOut, tokenIn);
        Pool storage pool = pools[token0][token1];
        
        require(pool.totalLiquidity > 0, "DataAMM: no liquidity");
        
        if (tokenIn == token0) {
            require(amountOut < pool.reserveB, "DataAMM: insufficient liquidity");
            uint256 numerator = pool.reserveA * amountOut * 10000;
            uint256 denominator = (pool.reserveB - amountOut) * (10000 - FEE_RATE);
            amountIn = (numerator / denominator) + 1;
        } else {
            require(amountOut < pool.reserveA, "DataAMM: insufficient liquidity");
            uint256 numerator = pool.reserveB * amountOut * 10000;
            uint256 denominator = (pool.reserveA - amountOut) * (10000 - FEE_RATE);
            amountIn = (numerator / denominator) + 1;
        }
        
        return amountIn;
    }

    /**
     * @dev Get reserves for a token pair
     */
    function getReserves(address tokenA, address tokenB) 
        public view returns (uint256 reserveA, uint256 reserveB) {
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        Pool storage pool = pools[token0][token1];
        
        if (tokenA == token0) {
            return (pool.reserveA, pool.reserveB);
        } else {
            return (pool.reserveB, pool.reserveA);
        }
    }

    /**
     * @dev Get liquidity balance for a user in a specific pool
     */
    function getLiquidityBalance(
        address user,
        address tokenA,
        address tokenB
    ) public view returns (uint256) {
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        return pools[token0][token1].liquidityBalance[user];
    }

    /**
     * @dev Get pool information
     */
    function getPoolInfo(address tokenA, address tokenB) 
        public view returns (
            uint256 reserveA,
            uint256 reserveB,
            uint256 totalLiquidity,
            uint256 lastUpdate
        ) {
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        Pool storage pool = pools[token0][token1];
        
        if (tokenA == token0) {
            return (pool.reserveA, pool.reserveB, pool.totalLiquidity, pool.lastUpdate);
        } else {
            return (pool.reserveB, pool.reserveA, pool.totalLiquidity, pool.lastUpdate);
        }
    }

    /**
     * @dev Get trade history length
     */
    function getTradeHistoryLength() public view returns (uint256) {
        return tradeHistory.length;
    }

    /**
     * @dev Get recent trades
     */
    function getRecentTrades(uint256 count) public view returns (TradeInfo[] memory) {
        if (count > tradeHistory.length) {
            count = tradeHistory.length;
        }
        
        TradeInfo[] memory recentTrades = new TradeInfo[](count);
        uint256 startIndex = tradeHistory.length - count;
        
        for (uint256 i = 0; i < count; i++) {
            recentTrades[i] = tradeHistory[startIndex + i];
        }
        
        return recentTrades;
    }

    /**
     * @dev Admin functions
     */
    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        require(_feeRecipient != address(0), "DataAMM: invalid fee recipient");
        feeRecipient = _feeRecipient;
    }

    function setTradingEnabled(bool _enabled) external onlyOwner {
        tradingEnabled = _enabled;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "DataAMM: new owner is the zero address");
        owner = newOwner;
    }

    /**
     * @dev Get fee rate
     */
    function feeRate() public pure returns (uint256) {
        return FEE_RATE;
    }

    // Utility functions
    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }

    function sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
}
