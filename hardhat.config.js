require("@nomicfoundation/hardhat-toolbox");

// Import environment variables for private keys and API keys
// These will be used for deployment and verification
require('dotenv').config();

// Define network configurations
const networks = {
  // Local development
  localhost: {
    url: "http://127.0.0.1:8545",
  },
  // BNB Smart Chain Testnet (Chapel)
  bscTestnet: {
    url: "https://data-seed-prebsc-1-s1.binance.org:8545/",
    chainId: 97,
    gasPrice: 20000000000,
    accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
  },
  // BNB Smart Chain Mainnet
  bscMainnet: {
    url: "https://bsc-dataseed.binance.org/",
    chainId: 56,
    gasPrice: 5000000000,
    accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
  }
};

// Set etherscan API key for contract verification
const etherscan = {
  apiKey: {
    bscTestnet: process.env.BSCSCAN_API_KEY || "",
    bsc: process.env.BSCSCAN_API_KEY || "",
  },
};

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks,
  etherscan,
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 40000
  }
};