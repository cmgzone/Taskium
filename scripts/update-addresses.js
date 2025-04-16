/**
 * Helper script to update contract addresses in .env file
 * Run after deployment to update the addresses automatically
 * 
 * Usage:
 * node scripts/update-addresses.js testnet 0x123456789...
 * node scripts/update-addresses.js mainnet 0x123456789...
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Get command line arguments
const network = process.argv[2]?.toLowerCase();
const address = process.argv[3];

// Validate input
if (!network || !address) {
  console.error('Usage: node scripts/update-addresses.js <network> <address>');
  console.error('  network: testnet | mainnet');
  console.error('  address: The deployed contract address');
  process.exit(1);
}

if (network !== 'testnet' && network !== 'mainnet') {
  console.error('Error: Network must be either "testnet" or "mainnet"');
  process.exit(1);
}

if (!address.startsWith('0x') || address.length !== 42) {
  console.error('Error: Address must be a valid Ethereum address (0x followed by 40 hex characters)');
  process.exit(1);
}

// Read .env file
const envPath = path.resolve(process.cwd(), '.env');
let envContent;
try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (error) {
  console.error('Error: Could not read .env file. Make sure it exists.');
  process.exit(1);
}

// Update the appropriate address
const envVarName = network === 'testnet' ? 'TSK_TOKEN_ADDRESS_TESTNET' : 'TSK_TOKEN_ADDRESS_MAINNET';
let newEnvContent;

if (envContent.includes(`${envVarName}=`)) {
  // Replace existing entry
  newEnvContent = envContent.replace(
    new RegExp(`${envVarName}=.*`, 'g'),
    `${envVarName}=${address}`
  );
} else {
  // Add new entry
  newEnvContent = envContent + `\n${envVarName}=${address}`;
}

// Update network setting if mainnet
if (network === 'mainnet') {
  if (envContent.includes('CURRENT_NETWORK=')) {
    newEnvContent = newEnvContent.replace(
      /CURRENT_NETWORK=.*/g,
      'CURRENT_NETWORK=mainnet'
    );
  } else {
    newEnvContent = newEnvContent + '\nCURRENT_NETWORK=mainnet';
  }
}

// Write updated content back to .env
try {
  fs.writeFileSync(envPath, newEnvContent);
  console.log(`Successfully updated ${envVarName} in .env file`);
  
  // Create or update .env.local for frontend
  const envLocalPath = path.resolve(process.cwd(), '.env.local');
  let envLocalContent = `VITE_${envVarName}=${address}\nVITE_CURRENT_NETWORK=${network}\n`;
  
  try {
    if (fs.existsSync(envLocalPath)) {
      const existingContent = fs.readFileSync(envLocalPath, 'utf8');
      if (existingContent.includes(`VITE_${envVarName}=`)) {
        envLocalContent = existingContent.replace(
          new RegExp(`VITE_${envVarName}=.*`, 'g'),
          `VITE_${envVarName}=${address}`
        );
      } else {
        envLocalContent = existingContent + `\nVITE_${envVarName}=${address}`;
      }
      
      if (existingContent.includes('VITE_CURRENT_NETWORK=')) {
        envLocalContent = envLocalContent.replace(
          /VITE_CURRENT_NETWORK=.*/g,
          `VITE_CURRENT_NETWORK=${network}`
        );
      } else {
        envLocalContent = envLocalContent + `\nVITE_CURRENT_NETWORK=${network}`;
      }
    }
    
    fs.writeFileSync(envLocalPath, envLocalContent);
    console.log(`Successfully updated VITE_${envVarName} in .env.local for frontend`);
  } catch (error) {
    console.error('Warning: Could not update .env.local file for frontend', error);
  }
  
  console.log('\nNext steps:');
  console.log('1. Restart your frontend application');
  console.log(`2. Update contract-utils.ts with the ${network} address manually if needed`);
  console.log(`3. Test the contract interaction on ${network}`);
  
} catch (error) {
  console.error('Error: Could not write to .env file', error);
  process.exit(1);
}