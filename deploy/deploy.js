const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting DataSwap deployment...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH\n");

  // Deploy contracts in order
  const contracts = {};

  try {
    // 1. Deploy DataRegistry
    console.log("📋 Deploying DataRegistry...");
    const DataRegistry = await ethers.getContractFactory("DataRegistry");
    const dataRegistry = await DataRegistry.deploy();
    await dataRegistry.waitForDeployment();
    const dataRegistryAddress = await dataRegistry.getAddress();
    contracts.DataRegistry = dataRegistryAddress;
    console.log("✅ DataRegistry deployed to:", dataRegistryAddress);

    // 2. Deploy DataAMM
    console.log("\n💱 Deploying DataAMM...");
    const DataAMM = await ethers.getContractFactory("DataAMM");
    const dataAMM = await DataAMM.deploy();
    await dataAMM.waitForDeployment();
    const dataAMMAddress = await dataAMM.getAddress();
    contracts.DataAMM = dataAMMAddress;
    console.log("✅ DataAMM deployed to:", dataAMMAddress);

    // 3. Deploy DataMarketplace
    console.log("\n🏪 Deploying DataMarketplace...");
    const DataMarketplace = await ethers.getContractFactory("DataMarketplace");
    const dataMarketplace = await DataMarketplace.deploy(dataRegistryAddress, dataAMMAddress);
    await dataMarketplace.waitForDeployment();
    const dataMarketplaceAddress = await dataMarketplace.getAddress();
    contracts.DataMarketplace = dataMarketplaceAddress;
    console.log("✅ DataMarketplace deployed to:", dataMarketplaceAddress);

    // 4. Create a test data token for demonstration
    console.log("\n🧪 Creating test data token...");
    const testTokenTx = await dataRegistry.createDataToken(
      "Sample Weather Data",
      "WEATHER",
      "test-irys-hash-123456789", // Mock Irys transaction ID
      JSON.stringify({
        description: "Historical weather data for testing",
        dataType: "weather",
        location: "Global",
        timeRange: "2020-2023",
        format: "JSON"
      })
    );
    
    const testTokenReceipt = await testTokenTx.wait();
    const testTokenEvent = testTokenReceipt.logs.find(log => {
      try {
        const parsed = dataRegistry.interface.parseLog(log);
        return parsed?.name === 'DataTokenCreated';
      } catch {
        return false;
      }
    });
    
    if (testTokenEvent) {
      const parsedEvent = dataRegistry.interface.parseLog(testTokenEvent);
      const testTokenAddress = parsedEvent?.args[0];
      contracts.TestDataToken = testTokenAddress;
      console.log("✅ Test data token created at:", testTokenAddress);
    }

    // Save contract addresses to files
    console.log("\n💾 Saving contract addresses...");
    
    // Save to JSON file for backend
    const contractsJson = {
      network: await ethers.provider.getNetwork().then(n => n.name),
      chainId: await ethers.provider.getNetwork().then(n => n.chainId.toString()),
      deployer: deployer.address,
      deployedAt: new Date().toISOString(),
      contracts: contracts
    };
    
    fs.writeFileSync(
      path.join(__dirname, "../deployed-contracts.json"),
      JSON.stringify(contractsJson, null, 2)
    );

    // Save to .env format for frontend
    const envContent = `# DataSwap Contract Addresses - ${new Date().toISOString()}
REACT_APP_DATA_REGISTRY_ADDRESS=${contracts.DataRegistry}
REACT_APP_DATA_AMM_ADDRESS=${contracts.DataAMM}
REACT_APP_DATA_MARKETPLACE_ADDRESS=${contracts.DataMarketplace}
DATA_REGISTRY_ADDRESS=${contracts.DataRegistry}
DATA_AMM_ADDRESS=${contracts.DataAMM}
DATA_MARKETPLACE_ADDRESS=${contracts.DataMarketplace}
${contracts.TestDataToken ? `TEST_DATA_TOKEN_ADDRESS=${contracts.TestDataToken}` : ''}
`;

    fs.writeFileSync(
      path.join(__dirname, "../.env.contracts"),
      envContent
    );

    // Display deployment summary
    console.log("\n🎉 Deployment completed successfully!");
    console.log("📋 Contract Addresses:");
    console.log("┌─────────────────────┬──────────────────────────────────────────────┐");
    console.log("│ Contract            │ Address                                      │");
    console.log("├─────────────────────┼──────────────────────────────────────────────┤");
    console.log(`│ DataRegistry        │ ${contracts.DataRegistry.padEnd(44)} │`);
    console.log(`│ DataAMM             │ ${contracts.DataAMM.padEnd(44)} │`);
    console.log(`│ DataMarketplace     │ ${contracts.DataMarketplace.padEnd(44)} │`);
    if (contracts.TestDataToken) {
      console.log(`│ TestDataToken       │ ${contracts.TestDataToken.padEnd(44)} │`);
    }
    console.log("└─────────────────────┴──────────────────────────────────────────────┘");

    console.log("\n📝 Next steps:");
    console.log("1. Copy the contract addresses to your .env file");
    console.log("2. Update your backend configuration with the deployed addresses");
    console.log("3. Fund your Irys account for data uploads");
    console.log("4. Test the complete upload -> tokenize -> trade flow");

    console.log("\n🔧 Configuration files created:");
    console.log("- deployed-contracts.json (for backend)");
    console.log("- .env.contracts (copy to your .env file)");

    return contracts;

  } catch (error) {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  }
}

// Execute deployment
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { main };
