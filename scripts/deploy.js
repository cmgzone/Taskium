/**
 * Deploy script for TSK Token to BNB Smart Chain Testnet
 * This is the primary deployment script used for testing.
 * For mainnet deployment, use deploy-mainnet.js instead.
 */

const hre = require("hardhat");
const fs = require("fs");
require('dotenv').config();

async function main() {
  // Get network information
  const network = await hre.ethers.provider.getNetwork();
  const networkName = network.name === 'bnbt' ? 'BNB Smart Chain Testnet' : network.name;
  
  console.log(`Deploying to ${networkName}...`);
  
  // Compile contracts if needed
  await hre.run("compile");
  console.log("Contracts compiled successfully");

  // Get deployer address
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deployer address: ${deployer.address}`);
  
  // Get balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`Deployer balance: ${hre.ethers.formatEther(balance)} BNB`);

  // Deploy TSK Token contract
  console.log("\nDeploying TSK Token...");
  const TSKToken = await hre.ethers.deployContract("TSKToken");
  await TSKToken.waitForDeployment();

  const tokenAddress = await TSKToken.getAddress();
  console.log(`TSK Token deployed to: ${tokenAddress}`);

  // Save deployment info
  const deploymentInfo = {
    network: "testnet",
    tokenAddress: tokenAddress,
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber(),
  };

  fs.writeFileSync(
    "testnet-deployment.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("Deployment information saved to testnet-deployment.json");

  // Verify contract on BSCScan
  try {
    console.log("\nWaiting for block confirmations before verification...");
    // Wait for a few seconds to ensure the contract is deployed and indexed
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    console.log("Verifying contract on BSCScan...");
    await hre.run("verify:verify", {
      address: tokenAddress,
      constructorArguments: [],
    });
    console.log("Contract verified successfully on BSCScan!");
  } catch (error) {
    console.error("Error verifying contract:", error);
    console.log("You may need to verify the contract manually.");
  }

  // Get explorer URL
  const explorerUrl = getExplorerUrl(networkName, tokenAddress);

  console.log("\n=== DEPLOYMENT SUMMARY ===");
  console.log(`Network: ${networkName}`);
  console.log(`Token Address: ${tokenAddress}`);
  console.log(`Block Explorer: ${explorerUrl}`);
  console.log(`Deployer: ${deploymentInfo.deployer}`);
  console.log("========================\n");

  console.log("Next steps:");
  console.log(`1. Run: node scripts/update-addresses.js testnet ${tokenAddress}`);
  console.log("2. Restart your application");
  console.log("3. Test token functionality on the testnet\n");
}

/**
 * Get the explorer URL for the contract
 */
function getExplorerUrl(network, address) {
  if (network.includes('Testnet')) {
    return `https://testnet.bscscan.com/address/${address}`;
  } else if (network.includes('BNB')) {
    return `https://bscscan.com/address/${address}`;
  } else {
    return `Address: ${address}`;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });