// Build script for Vercel that checks if frontend directory exists
import { existsSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const frontendDir = join(__dirname, 'frontend');

console.log('Checking if frontend directory exists...');
console.log('Current directory:', __dirname);
console.log('Frontend directory path:', frontendDir);

if (!existsSync(frontendDir)) {
  console.error('❌ ERROR: frontend directory does not exist!');
  console.error('Please make sure the frontend directory is in your repository.');
  console.error('If you just created a new repo, make sure to push the frontend directory.');
  process.exit(1);
}

console.log('✅ Frontend directory exists');
console.log('Installing root dependencies...');

try {
  // Install root dependencies
  execSync('npm install', { stdio: 'inherit', cwd: __dirname });
  console.log('✅ Root dependencies installed');
  
  // Install frontend dependencies
  console.log('Installing frontend dependencies...');
  execSync('npm install --production=false', { stdio: 'inherit', cwd: frontendDir });
  console.log('✅ Frontend dependencies installed');
  
  // Build frontend
  console.log('Building frontend...');
  execSync('npm run build', { stdio: 'inherit', cwd: frontendDir });
  console.log('✅ Frontend built successfully');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

