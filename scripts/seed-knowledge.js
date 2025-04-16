/**
 * Knowledge Base Seeding Script
 * 
 * This script runs the knowledge base seeding process using our batched approach
 * to avoid timeouts and provide better progress tracking.
 */

import { spawn } from 'child_process';

console.log('Starting AI knowledge base seeding process...');
console.log('Running the seeding shell script to process knowledge in batches.');

// Run the shell script that coordinates the seeding process
const scriptPath = new URL('./run-knowledge-seeding.sh', import.meta.url).pathname;
console.log(`Executing script at: ${scriptPath}`);

const process = spawn('bash', [scriptPath], {
  stdio: 'inherit'
});

process.on('error', (error) => {
  console.error('Error running seed script:', error);
  console.error('If you encounter permission issues, run: chmod +x scripts/run-knowledge-seeding.sh');
});

process.on('exit', (code) => {
  if (code !== 0) {
    console.error(`Process exited with code ${code}`);
    console.log('');
    console.log('Tip: You can still run individual seeding scripts directly:');
    console.log('     npx tsx scripts/seed-essential-knowledge.ts');
  } else {
    console.log('Knowledge base seeding completed successfully!');
    console.log('The AI now has a foundation of platform knowledge to assist users.');
  }
});