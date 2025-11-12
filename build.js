// Build script for Vercel that checks if frontend directory exists
import { existsSync, readdirSync } from 'fs';
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

// List files in frontend directory for debugging
try {
  console.log('Frontend directory contents:', readdirSync(frontendDir).slice(0, 10).join(', '));
} catch (err) {
  console.log('Could not list frontend directory:', err.message);
}

try {
  // Install frontend dependencies
  // Note: Root dependencies are already installed by installCommand
  console.log('Installing frontend dependencies...');
  console.log('Working directory:', frontendDir);
  execSync('npm install --production=false', { 
    stdio: 'inherit', 
    cwd: frontendDir,
    env: { ...process.env }
  });
  console.log('✅ Frontend dependencies installed');
  
  // Build frontend
  console.log('Building frontend...');
  execSync('npm run build', { 
    stdio: 'inherit', 
    cwd: frontendDir,
    env: { ...process.env }
  });
  console.log('✅ Frontend built successfully');
  
  // Verify build output
  const distDir = join(frontendDir, 'dist');
  if (existsSync(distDir)) {
    console.log('✅ Build output directory exists:', distDir);
  } else {
    console.error('❌ Build output directory does not exist:', distDir);
    process.exit(1);
  }
  
} catch (error) {
  console.error('❌ Build failed!');
  console.error('Error message:', error.message);
  if (error.stdout) console.error('stdout:', error.stdout.toString());
  if (error.stderr) console.error('stderr:', error.stderr.toString());
  process.exit(1);
}

