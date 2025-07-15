const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying contracts to Irys testnet...");

  // Deploy DataRegistry contract
  const DataRegistry = await ethers.getContractFactory("DataRegistry");
  const dataRegistry = await DataRegistry.deploy();
  await dataRegistry.waitForDeployment();
  
  console.log("DataRegistry deployed to:", await dataRegistry.getAddress());

  // Deploy DataAMM contract
  const DataAMM = await ethers.getContractFactory("DataAMM");
  const dataAMM = await DataAMM.deploy();
  await dataAMM.waitForDeployment();
  
  console.log("DataAMM deployed to:", await dataAMM.getAddress());

  // Save deployment addresses
  const deploymentInfo = {
    network: "irys",
    dataRegistry: await dataRegistry.getAddress(),
    dataAMM: await dataAMM.getAddress(),
    deployedAt: new Date().toISOString(),
    explorerUrl: "https://testnet-explorer.irys.xyz",
  };

  console.log("\nDeployment Summary:");
  console.log("==================");
  console.log(`Network: ${deploymentInfo.network}`);
  console.log(`DataRegistry: ${deploymentInfo.dataRegistry}`);
  console.log(`DataAMM: ${deploymentInfo.dataAMM}`);
  console.log(`Explorer: ${deploymentInfo.explorerUrl}`);
  console.log(`Deployed at: ${deploymentInfo.deployedAt}`);

  return deploymentInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });