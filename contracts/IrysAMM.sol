// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title IrysAMM
 * @dev Uniswap-like Automated Market Maker for data tokens on Irys VM
 * Implements the x*y=k constant product formula for token swaps
 */
contract IrysAMM is ReentrancyGuard, Ownable {
    using Math for uint256;

    // Trading fee in basis points (300 = 0.3%)
    uint256 public constant TRADING_FEE = 300;
    uint256 public constant BASIS_POINTS = 10000;
    
    // Minimum liquidity to prevent division by zero
    uint256 public constant MINIMUM_LIQUIDITY = 1000;

    struct Pool {
        address tokenA;
        address tokenB;
        uint256 reserveA;
        uint256 reserveB;
        uint256 totalLiquidity;
        uint256 kLast; // Reserve product after most recent liquidity event
        bool exists;
    }

    // Pool identifier => Pool data
    mapping(bytes32 => Pool) public pools;
    
    // User => Pool => Liquidity tokens
    mapping(address => mapping(bytes32 => uint256)) public liquidityBalances;
    
    // All pool identifiers for enumeration
    bytes32[] public allPools;

    event PoolCreated(
        bytes32 indexed poolId,
        address indexed tokenA,
        address indexed tokenB,
        uint256 amountA,
        uint256 amountB
    );

    event LiquidityAdded(
        bytes32 indexed poolId,
        address indexed provider,
        uint256 amountA,
        uint256 amountB,
        uint256 liquidity
    );

    event LiquidityRemoved(
        bytes32 indexed poolId,
        address indexed provider,
        uint256 amountA,
        uint256 amountB,
        uint256 liquidity
    );

    event TokensSwapped(
        bytes32 indexed poolId,
        address indexed trader,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint256 fee
    );

    /**
     * @dev Get pool identifier for a token pair
     */
    function getPoolId(address tokenA, address tokenB) public pure returns (bytes32) {
        return tokenA < tokenB 
            ? keccak256(abi.encodePacked(tokenA, tokenB))
            : keccak256(abi.encodePacked(tokenB, tokenA));
    }

    /**
     * @dev Create a new liquidity pool for two data tokens
     */
    function createPool(
        address tokenA,
        address tokenB,
        uint256 amountA,
        uint256 amountB
    ) external nonReentrant returns (bytes32 poolId) {
        require(tokenA != tokenB, "IrysAMM: IDENTICAL_ADDRESSES");
        require(tokenA != address(0) && tokenB != address(0), "IrysAMM: ZERO_ADDRESS");
        require(amountA > 0 && amountB > 0, "IrysAMM: INSUFFICIENT_AMOUNT");

        poolId = getPoolId(tokenA, tokenB);
        require(!pools[poolId].exists, "IrysAMM: POOL_EXISTS");

        // Sort tokens to maintain consistency
        if (tokenA > tokenB) {
            (tokenA, tokenB) = (tokenB, tokenA);
            (amountA, amountB) = (amountB, amountA);
        }

        // Transfer tokens from user
        IERC20(tokenA).transferFrom(msg.sender, address(this), amountA);
        IERC20(tokenB).transferFrom(msg.sender, address(this), amountB);

        // Calculate initial liquidity (geometric mean)
        uint256 liquidity = Math.sqrt(amountA * amountB) - MINIMUM_LIQUIDITY;
        require(liquidity > 0, "IrysAMM: INSUFFICIENT_LIQUIDITY");

        // Create pool
        pools[poolId] = Pool({
            tokenA: tokenA,
            tokenB: tokenB,
            reserveA: amountA,
            reserveB: amountB,
            totalLiquidity: liquidity + MINIMUM_LIQUIDITY,
            kLast: amountA * amountB,
            exists: true
        });

        // Mint liquidity tokens to provider
        liquidityBalances[msg.sender][poolId] = liquidity;
        
        // Lock minimum liquidity forever
        liquidityBalances[address(0)][poolId] = MINIMUM_LIQUIDITY;

        allPools.push(poolId);

        emit PoolCreated(poolId, tokenA, tokenB, amountA, amountB);
        emit LiquidityAdded(poolId, msg.sender, amountA, amountB, liquidity);
    }

    /**
     * @dev Add liquidity to an existing pool
     */
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountA,
        uint256 amountB,
        uint256 minAmountA,
        uint256 minAmountB
    ) external nonReentrant returns (uint256 liquidity) {
        bytes32 poolId = getPoolId(tokenA, tokenB);
        Pool storage pool = pools[poolId];
        require(pool.exists, "IrysAMM: POOL_NOT_EXISTS");

        // Sort tokens to match pool order
        if (tokenA > tokenB) {
            (tokenA, tokenB) = (tokenB, tokenA);
            (amountA, amountB) = (amountB, amountA);
            (minAmountA, minAmountB) = (minAmountB, minAmountA);
        }

        // Calculate optimal amounts to maintain ratio
        uint256 optimalAmountB = (amountA * pool.reserveB) / pool.reserveA;
        
        if (optimalAmountB <= amountB) {
            amountB = optimalAmountB;
            require(amountA >= minAmountA && amountB >= minAmountB, "IrysAMM: INSUFFICIENT_AMOUNT");
        } else {
            uint256 optimalAmountA = (amountB * pool.reserveA) / pool.reserveB;
            amountA = optimalAmountA;
            require(amountA >= minAmountA && amountB >= minAmountB, "IrysAMM: INSUFFICIENT_AMOUNT");
        }

        // Transfer tokens
        IERC20(tokenA).transferFrom(msg.sender, address(this), amountA);
        IERC20(tokenB).transferFrom(msg.sender, address(this), amountB);

        // Calculate liquidity tokens to mint
        liquidity = Math.min(
            (amountA * pool.totalLiquidity) / pool.reserveA,
            (amountB * pool.totalLiquidity) / pool.reserveB
        );
        require(liquidity > 0, "IrysAMM: INSUFFICIENT_LIQUIDITY_MINTED");

        // Update pool reserves
        pool.reserveA += amountA;
        pool.reserveB += amountB;
        pool.totalLiquidity += liquidity;
        pool.kLast = pool.reserveA * pool.reserveB;

        // Mint liquidity tokens
        liquidityBalances[msg.sender][poolId] += liquidity;

        emit LiquidityAdded(poolId, msg.sender, amountA, amountB, liquidity);
    }

    /**
     * @dev Remove liquidity from a pool
     */
    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 minAmountA,
        uint256 minAmountB
    ) external nonReentrant returns (uint256 amountA, uint256 amountB) {
        bytes32 poolId = getPoolId(tokenA, tokenB);
        Pool storage pool = pools[poolId];
        require(pool.exists, "IrysAMM: POOL_NOT_EXISTS");
        require(liquidityBalances[msg.sender][poolId] >= liquidity, "IrysAMM: INSUFFICIENT_LIQUIDITY");

        // Sort tokens to match pool order
        bool swapped = tokenA > tokenB;
        if (swapped) {
            (tokenA, tokenB) = (tokenB, tokenA);
            (minAmountA, minAmountB) = (minAmountB, minAmountA);
        }

        // Calculate token amounts to return
        amountA = (liquidity * pool.reserveA) / pool.totalLiquidity;
        amountB = (liquidity * pool.reserveB) / pool.totalLiquidity;

        if (swapped) {
            (amountA, amountB) = (amountB, amountA);
        }

        require(amountA >= minAmountA && amountB >= minAmountB, "IrysAMM: INSUFFICIENT_AMOUNT");

        // Update balances
        liquidityBalances[msg.sender][poolId] -= liquidity;
        pool.totalLiquidity -= liquidity;
        
        if (!swapped) {
            pool.reserveA -= amountA;
            pool.reserveB -= amountB;
        } else {
            pool.reserveA -= amountB;
            pool.reserveB -= amountA;
        }
        
        pool.kLast = pool.reserveA * pool.reserveB;

        // Transfer tokens back to user
        IERC20(tokenA).transfer(msg.sender, amountA);
        IERC20(tokenB).transfer(msg.sender, amountB);

        emit LiquidityRemoved(poolId, msg.sender, amountA, amountB, liquidity);
    }

    /**
     * @dev Swap tokens using the AMM formula
     */
    function swapTokens(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut
    ) external nonReentrant returns (uint256 amountOut) {
        require(tokenIn != tokenOut, "IrysAMM: IDENTICAL_ADDRESSES");
        require(amountIn > 0, "IrysAMM: INSUFFICIENT_INPUT_AMOUNT");

        bytes32 poolId = getPoolId(tokenIn, tokenOut);
        Pool storage pool = pools[poolId];
        require(pool.exists, "IrysAMM: POOL_NOT_EXISTS");

        // Determine which reserve is which
        (uint256 reserveIn, uint256 reserveOut) = tokenIn == pool.tokenA 
            ? (pool.reserveA, pool.reserveB)
            : (pool.reserveB, pool.reserveA);

        require(reserveIn > 0 && reserveOut > 0, "IrysAMM: INSUFFICIENT_LIQUIDITY");

        // Calculate output amount using AMM formula: amountOut = (reserveOut * amountIn) / (reserveIn + amountIn)
        // But first apply trading fee
        uint256 amountInWithFee = amountIn * (BASIS_POINTS - TRADING_FEE) / BASIS_POINTS;
        amountOut = (reserveOut * amountInWithFee) / (reserveIn + amountInWithFee);
        
        require(amountOut >= minAmountOut, "IrysAMM: INSUFFICIENT_OUTPUT_AMOUNT");
        require(amountOut < reserveOut, "IrysAMM: INSUFFICIENT_LIQUIDITY");

        // Transfer tokens
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

        // Ensure k doesn't decrease (accounting for fees)
        require(pool.reserveA * pool.reserveB >= pool.kLast, "IrysAMM: K");
        pool.kLast = pool.reserveA * pool.reserveB;

        uint256 fee = amountIn - amountInWithFee;
        emit TokensSwapped(poolId, msg.sender, tokenIn, tokenOut, amountIn, amountOut, fee);
    }

    /**
     * @dev Get quote for token swap
     */
    function getAmountOut(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (uint256 amountOut) {
        require(tokenIn != tokenOut, "IrysAMM: IDENTICAL_ADDRESSES");
        require(amountIn > 0, "IrysAMM: INSUFFICIENT_INPUT_AMOUNT");

        bytes32 poolId = getPoolId(tokenIn, tokenOut);
        Pool memory pool = pools[poolId];
        require(pool.exists, "IrysAMM: POOL_NOT_EXISTS");

        (uint256 reserveIn, uint256 reserveOut) = tokenIn == pool.tokenA 
            ? (pool.reserveA, pool.reserveB)
            : (pool.reserveB, pool.reserveA);

        require(reserveIn > 0 && reserveOut > 0, "IrysAMM: INSUFFICIENT_LIQUIDITY");

        uint256 amountInWithFee = amountIn * (BASIS_POINTS - TRADING_FEE) / BASIS_POINTS;
        amountOut = (reserveOut * amountInWithFee) / (reserveIn + amountInWithFee);
    }

    /**
     * @dev Get pool information
     */
    function getPool(address tokenA, address tokenB) external view returns (
        uint256 reserveA,
        uint256 reserveB,
        uint256 totalLiquidity
    ) {
        bytes32 poolId = getPoolId(tokenA, tokenB);
        Pool memory pool = pools[poolId];
        require(pool.exists, "IrysAMM: POOL_NOT_EXISTS");
        
        if (tokenA == pool.tokenA) {
            return (pool.reserveA, pool.reserveB, pool.totalLiquidity);
        } else {
            return (pool.reserveB, pool.reserveA, pool.totalLiquidity);
        }
    }

    /**
     * @dev Get number of pools
     */
    function getPoolCount() external view returns (uint256) {
        return allPools.length;
    }

    /**
     * @dev Get user's liquidity balance in a pool
     */
    function getUserLiquidity(address user, address tokenA, address tokenB) external view returns (uint256) {
        bytes32 poolId = getPoolId(tokenA, tokenB);
        return liquidityBalances[user][poolId];
    }
}