require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // Local development network
    hardhat: {
      chainId: 31337,
    },
    
    // Irys Testnet configuration
    irys: {
      url: "https://testnet-rpc.irys.xyz/v1/execution-rpc",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 1270,
      gasPrice: "auto",
      gas: "auto",
    },
    
    // Ethereum Sepolia testnet (for testing before Irys)
    sepolia: {
      url: process.env.SEPOLIA_RPC || `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
    },
    
    // Polygon Mumbai testnet (alternative testing network)
    mumbai: {
      url: process.env.MUMBAI_RPC || `https://polygon-mumbai.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 80001,
    },
  },
  
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY || "",
      polygonMumbai: process.env.POLYGONSCAN_API_KEY || "",
      // Add Irys explorer API key when available
    },
  },
  
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    gasPrice: 20,
  },
  
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  
  mocha: {
    timeout: 60000,
  },
};
