#!/usr/bin/env node
/**
 * Check if Railway deployment is properly configured
 * Run: node scripts/check-railway-setup.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Checking Railway deployment configuration...\n');

// Check 1: Verify package.json has start script
console.log('1️⃣  Checking package.json...');
const rootPackageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));

if (rootPackageJson.scripts?.start) {
  console.log('   ✅ Start script found:', rootPackageJson.scripts.start);
} else {
  console.log('   ❌ Start script missing!');
  process.exit(1);
}

if (rootPackageJson.scripts?.postinstall) {
  console.log('   ✅ Postinstall script found:', rootPackageJson.scripts.postinstall);
} else {
  console.log('   ⚠️  Postinstall script missing (backend deps might not install)');
}

// Check 2: Verify backend package.json
console.log('\n2️⃣  Checking backend/package.json...');
const backendPackageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'backend', 'package.json'), 'utf8'));

if (backendPackageJson.scripts?.start) {
  console.log('   ✅ Backend start script found:', backendPackageJson.scripts.start);
} else {
  console.log('   ❌ Backend start script missing!');
  process.exit(1);
}

// Check 3: Required environment variables
console.log('\n3️⃣  Checking required environment variables...');
const requiredEnvVars = [
  'SUPABASE_DB_URL',
  'DATABASE_URL', // Alternative
  'JWT_SECRET',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY'
];

let missingEnvVars = [];
let hasAlternative = false;

requiredEnvVars.forEach(varName => {
  if (process.env[varName]) {
    if (varName === 'DATABASE_URL' || varName === 'SUPABASE_DB_URL') {
      hasAlternative = true;
      console.log(`   ✅ ${varName} is set`);
    } else {
      // Mask sensitive values
      const value = process.env[varName];
      const masked = value.substring(0, 8) + '...' + value.substring(value.length - 4);
      console.log(`   ✅ ${varName} is set (${masked})`);
    }
  } else {
    if (varName === 'DATABASE_URL' && process.env.SUPABASE_DB_URL) {
      console.log(`   ✅ SUPABASE_DB_URL is set (alternative to DATABASE_URL)`);
    } else if (varName === 'SUPABASE_DB_URL' && process.env.DATABASE_URL) {
      console.log(`   ✅ DATABASE_URL is set (alternative to SUPABASE_DB_URL)`);
    } else {
      missingEnvVars.push(varName);
      console.log(`   ❌ ${varName} is missing`);
    }
  }
});

// Special check for database URL
if (!process.env.SUPABASE_DB_URL && !process.env.DATABASE_URL) {
  missingEnvVars.push('SUPABASE_DB_URL or DATABASE_URL');
}

// Remove duplicates
missingEnvVars = [...new Set(missingEnvVars)];

if (missingEnvVars.length > 0) {
  console.log('\n   ⚠️  Missing required environment variables:');
  missingEnvVars.forEach(varName => {
    console.log(`      - ${varName}`);
  });
  console.log('\n   📝 These must be set in Railway Dashboard → Variables tab');
} else {
  console.log('\n   ✅ All required environment variables are set!');
}

// Check 4: Port configuration
console.log('\n4️⃣  Checking port configuration...');
if (process.env.PORT) {
  console.log(`   ✅ PORT is set: ${process.env.PORT}`);
  console.log('      (Railway will automatically set this)');
} else {
  console.log('   ℹ️  PORT not set (will default to 5000)');
  console.log('      Railway will automatically set PORT on deployment');
}

// Check 5: Node version
console.log('\n5️⃣  Checking Node.js version...');
const nodeVersion = process.version;
const requiredVersion = rootPackageJson.engines?.node || '>=18.0.0';
console.log(`   ✅ Node.js version: ${nodeVersion}`);
console.log(`   ✅ Required: ${requiredVersion}`);

// Summary
console.log('\n' + '='.repeat(50));
console.log('📋 Summary:');

if (missingEnvVars.length === 0) {
  console.log('✅ All checks passed! Ready for Railway deployment.');
  console.log('\n📝 Next steps:');
  console.log('   1. Push your changes: git push');
  console.log('   2. Add environment variables in Railway Dashboard');
  console.log('   3. Monitor deployment logs');
} else {
  console.log('⚠️  Configuration incomplete!');
  console.log('\n📝 Action required:');
  console.log('   1. Set missing environment variables in Railway Dashboard');
  console.log('   2. Then push your changes: git push');
}

console.log('='.repeat(50) + '\n');

process.exit(missingEnvVars.length === 0 ? 0 : 1);

