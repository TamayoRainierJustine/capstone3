// Quick script to update user password
// Usage: node scripts/update-password.js

import bcrypt from 'bcryptjs';
import pg from 'pg';

const { Client } = pg;

const email = 'rainiertamayo11067@gmail.com';
const newPassword = 'ADMIn1234';

// Get database URL from environment or prompt
const databaseUrl = process.argv[2] || process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('');
  console.error('❌ Database URL required!');
  console.error('');
  console.error('Usage:');
  console.error('  node scripts/update-password.js <database-url>');
  console.error('');
  console.error('Or set environment variable:');
  console.error('  SUPABASE_DB_URL=postgresql://... node scripts/update-password.js');
  console.error('');
  process.exit(1);
}

(async () => {
  try {
    console.log('🔌 Connecting to database...');
    const client = new Client({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes('supabase') ? { rejectUnauthorized: false } : false
    });

    await client.connect();
    console.log('✅ Connected!');
    console.log('');

    // Hash the password
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    console.log('👤 Updating password for:', email);
    const result = await client.query(
      'UPDATE "Users" SET password = $1 WHERE email = $2',
      [hashedPassword, email]
    );

    if (result.rowCount === 0) {
      console.error('❌ User not found!');
      await client.end();
      process.exit(1);
    }

    console.log('✅ Password updated successfully!');
    console.log('');
    console.log('🎉 You can now login with:');
    console.log('   Email: rainiertamayo11067@gmail.com');
    console.log('   Password: ADMIn1234');
    console.log('');

    await client.end();
    process.exit(0);

  } catch (error) {
    console.error('');
    console.error('❌ Error:', error.message);
    console.error('');
    process.exit(1);
  }
})();

