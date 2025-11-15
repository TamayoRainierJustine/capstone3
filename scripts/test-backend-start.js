#!/usr/bin/env node
/**
 * Test if backend can start successfully
 * Run: node scripts/test-backend-start.js
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Testing backend startup...\n');

// Set test environment variables if not set
if (!process.env.PORT) {
  process.env.PORT = '5001'; // Use different port to avoid conflicts
}

console.log('Starting backend server...');
console.log(`Port: ${process.env.PORT}`);
console.log('');

const backendPath = path.join(__dirname, '..', 'backend');
const backendStart = spawn('npm', ['start'], {
  cwd: backendPath,
  env: process.env,
  stdio: 'inherit',
  shell: true
});

let serverStarted = false;
const timeout = setTimeout(() => {
  if (!serverStarted) {
    console.log('\n⏱️  Timeout: Server did not start within 30 seconds');
    console.log('Check your environment variables and database connection');
    backendStart.kill();
    process.exit(1);
  }
}, 30000);

backendStart.on('error', (error) => {
  console.error('❌ Failed to start backend:', error.message);
  clearTimeout(timeout);
  process.exit(1);
});

backendStart.on('exit', (code) => {
  clearTimeout(timeout);
  if (code === 0) {
    console.log('\n✅ Backend started successfully!');
  } else {
    console.log(`\n❌ Backend exited with code ${code}`);
    console.log('Check the logs above for errors');
    process.exit(code);
  }
});

// Listen for SIGINT to gracefully shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down...');
  backendStart.kill();
  clearTimeout(timeout);
  process.exit(0);
});

