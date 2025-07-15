// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract DataAMM is Ownable, ReentrancyGuard {
    struct Pool {
        address tokenA;
        address tokenB;
        uint256 reserveA;
        uint256 reserveB;
        uint256 totalLiquidity;
        mapping(address => uint256) liquidity;
    }
    
    struct Trade {
        address trader;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 amountOut;
        uint256 timestamp;
    }
    
    mapping(bytes32 => Pool) public pools;
    mapping(address => Trade[]) public userTrades;
    Trade[] public allTrades;
    
    event PoolCreated(address indexed tokenA, address indexed tokenB);
    event LiquidityAdded(address indexed user, address indexed tokenA, address indexed tokenB, uint256 amountA, uint256 amountB);
    event TokensSwapped(address indexed user, address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut);
    
    constructor() Ownable(msg.sender) {}
    
    function getPoolKey(address tokenA, address tokenB) internal pure returns (bytes32) {
        return tokenA < tokenB ? keccak256(abi.encodePacked(tokenA, tokenB)) : keccak256(abi.encodePacked(tokenB, tokenA));
    }
    
    function createPool(address tokenA, address tokenB) external {
        require(tokenA != tokenB, "Tokens must be different");
        require(tokenA != address(0) && tokenB != address(0), "Invalid token addresses");
        
        bytes32 poolKey = getPoolKey(tokenA, tokenB);
        require(pools[poolKey].tokenA == address(0), "Pool already exists");
        
        Pool storage pool = pools[poolKey];
        pool.tokenA = tokenA < tokenB ? tokenA : tokenB;
        pool.tokenB = tokenA < tokenB ? tokenB : tokenA;
        
        emit PoolCreated(pool.tokenA, pool.tokenB);
    }
    
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountA,
        uint256 amountB
    ) external nonReentrant {
        bytes32 poolKey = getPoolKey(tokenA, tokenB);
        Pool storage pool = pools[poolKey];
        require(pool.tokenA != address(0), "Pool does not exist");
        
        IERC20(tokenA).transferFrom(msg.sender, address(this), amountA);
        IERC20(tokenB).transferFrom(msg.sender, address(this), amountB);
        
        uint256 liquidityMinted;
        if (pool.totalLiquidity == 0) {
            liquidityMinted = sqrt(amountA * amountB);
        } else {
            liquidityMinted = min(
                (amountA * pool.totalLiquidity) / pool.reserveA,
                (amountB * pool.totalLiquidity) / pool.reserveB
            );
        }
        
        pool.reserveA += amountA;
        pool.reserveB += amountB;
        pool.totalLiquidity += liquidityMinted;
        pool.liquidity[msg.sender] += liquidityMinted;
        
        emit LiquidityAdded(msg.sender, tokenA, tokenB, amountA, amountB);
    }
    
    function swapTokens(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut
    ) external nonReentrant {
        bytes32 poolKey = getPoolKey(tokenIn, tokenOut);
        Pool storage pool = pools[poolKey];
        require(pool.tokenA != address(0), "Pool does not exist");
        
        uint256 amountOut = getAmountOut(amountIn, tokenIn, tokenOut);
        require(amountOut >= minAmountOut, "Insufficient output amount");
        
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
        IERC20(tokenOut).transfer(msg.sender, amountOut);
        
        // Update reserves
        if (tokenIn == pool.tokenA) {
            pool.reserveA += amountIn;
            pool.reserveB -= amountOut;
        } else {
            pool.reserveB += amountIn;
            pool.reserveA -= amountOut;
        }
        
        // Record trade
        Trade memory trade = Trade({
            trader: msg.sender,
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            amountIn: amountIn,
            amountOut: amountOut,
            timestamp: block.timestamp
        });
        
        userTrades[msg.sender].push(trade);
        allTrades.push(trade);
        
        emit TokensSwapped(msg.sender, tokenIn, tokenOut, amountIn, amountOut);
    }
    
    function getAmountOut(
        uint256 amountIn,
        address tokenIn,
        address tokenOut
    ) public view returns (uint256) {
        bytes32 poolKey = getPoolKey(tokenIn, tokenOut);
        Pool storage pool = pools[poolKey];
        require(pool.tokenA != address(0), "Pool does not exist");
        
        uint256 reserveIn = tokenIn == pool.tokenA ? pool.reserveA : pool.reserveB;
        uint256 reserveOut = tokenIn == pool.tokenA ? pool.reserveB : pool.reserveA;
        
        require(reserveIn > 0 && reserveOut > 0, "Insufficient liquidity");
        
        uint256 amountInWithFee = amountIn * 997; // 0.3% fee
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * 1000) + amountInWithFee;
        
        return numerator / denominator;
    }
    
    function getPoolInfo(address tokenA, address tokenB) external view returns (
        uint256 reserveA,
        uint256 reserveB,
        uint256 totalLiquidity
    ) {
        bytes32 poolKey = getPoolKey(tokenA, tokenB);
        Pool storage pool = pools[poolKey];
        return (pool.reserveA, pool.reserveB, pool.totalLiquidity);
    }
    
    function getUserTrades(address user) external view returns (Trade[] memory) {
        return userTrades[user];
    }
    
    function getAllTrades() external view returns (Trade[] memory) {
        return allTrades;
    }
    
    function sqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        return y;
    }
    
    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
}