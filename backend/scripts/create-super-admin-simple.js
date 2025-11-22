// Simple script to create/update super admin using raw SQL
// This avoids Sequelize connection issues if .env is missing
// Run this from backend directory: node scripts/create-super-admin-simple.js

import pg from 'pg';
import bcrypt from 'bcryptjs';
import readline from 'readline';

const { Client } = pg;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const createSuperAdmin = async () => {
  try {
    console.log('');
    console.log('🔧 Super Admin Account Creator');
    console.log('================================');
    console.log('');

    // Get database connection info
    console.log('Please provide your database connection details:');
    console.log('(Or press Enter to use environment variables if .env exists)');
    console.log('');

    const dbUrl = await question('Database URL (postgresql://user:pass@host:port/dbname) or press Enter to use SUPABASE_DB_URL/DATABASE_URL: ');
    
    let databaseUrl = dbUrl.trim();
    
    // If empty, try to load from .env
    if (!databaseUrl) {
      try {
        const dotenv = await import('dotenv');
        dotenv.config();
        databaseUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
      } catch (e) {
        // dotenv not available, continue
      }
    }

    if (!databaseUrl) {
      console.error('');
      console.error('❌ No database URL provided!');
      console.error('');
      console.error('Please either:');
      console.error('1. Create backend/.env with SUPABASE_DB_URL=...');
      console.error('2. Or provide the URL when prompted');
      console.error('');
      rl.close();
      process.exit(1);
    }

    console.log('');
    console.log('🔌 Connecting to database...');
    const client = new Client({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes('supabase') ? { rejectUnauthorized: false } : false
    });

    await client.connect();
    console.log('✅ Connected!');
    console.log('');

    // User details
    const email = 'rainiertamayo11067@gmail.com';
    const password = 'ADMIn1234';
    const firstName = 'Super';
    const lastName = 'Admin';

    console.log('🔍 Checking if user exists...');
    const checkResult = await client.query('SELECT id, email, "firstName", "lastName", role, password FROM "Users" WHERE email = $1', [email]);
    
    if (checkResult.rows.length > 0) {
      console.log('⚠️  User already exists! Updating to super admin...');
      const existingUser = checkResult.rows[0];
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Update user
      await client.query(
        'UPDATE "Users" SET role = $1, "isVerified" = $2, "emailVerifiedAt" = $3, password = $4 WHERE email = $5',
        ['super_admin', true, new Date(), hashedPassword, email]
      );
      
      console.log('✅ User updated to super admin!');
    } else {
      console.log('👤 Creating new super admin user...');
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      await client.query(
        `INSERT INTO "Users" (email, password, "firstName", "lastName", role, "isVerified", "emailVerifiedAt", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [email, hashedPassword, firstName, lastName, 'super_admin', true, new Date(), new Date(), new Date()]
      );
      
      console.log('✅ Super admin created successfully!');
    }

    console.log('');
    console.log('🎉 Super Admin Account Ready!');
    console.log('================================');
    console.log('   Email:', email);
    console.log('   Password:', password);
    console.log('   Name:', firstName, lastName);
    console.log('   Role: super_admin');
    console.log('');
    console.log('🔗 After logging in, you can access:');
    console.log('   - Super Admin Dashboard: /super-admin');
    console.log('   - API Applications Review: /super-admin/applications');
    console.log('');

    await client.end();
    rl.close();
    process.exit(0);

  } catch (error) {
    console.error('');
    console.error('❌ Error:', error.message);
    console.error('');
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.error('💡 Check your database connection string.');
    }
    console.error('Full error:', error);
    rl.close();
    process.exit(1);
  }
};

createSuperAdmin();

