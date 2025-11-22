// Quick script to create super admin
// Usage: node CREATE_SUPER_ADMIN_QUICK.js <database-url>
// Or set SUPABASE_DB_URL environment variable

import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Client } = pg;

const email = 'rainiertamayo11067@gmail.com';
const password = 'ADMIn1234';
const firstName = 'Super';
const lastName = 'Admin';

const databaseUrl = process.argv[2] || process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Database URL required!');
  console.error('');
  console.error('Usage:');
  console.error('  node CREATE_SUPER_ADMIN_QUICK.js <database-url>');
  console.error('');
  console.error('Or set environment variable:');
  console.error('  SUPABASE_DB_URL=postgresql://... node CREATE_SUPER_ADMIN_QUICK.js');
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

    // Check if user exists
    const checkResult = await client.query('SELECT id, email, role, password FROM "Users" WHERE email = $1', [email]);
    
    if (checkResult.rows.length > 0) {
      console.log('⚠️  User exists. Updating to super admin...');
      const hashedPassword = await bcrypt.hash(password, 10);
      
      await client.query(
        'UPDATE "Users" SET role = $1, "isVerified" = $2, "emailVerifiedAt" = $3, password = $4 WHERE email = $5',
        ['super_admin', true, new Date(), hashedPassword, email]
      );
      
      console.log('✅ Updated!');
    } else {
      console.log('👤 Creating super admin...');
      const hashedPassword = await bcrypt.hash(password, 10);
      
      await client.query(
        `INSERT INTO "Users" (email, password, "firstName", "lastName", role, "isVerified", "emailVerifiedAt", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [email, hashedPassword, firstName, lastName, 'super_admin', true, new Date(), new Date(), new Date()]
      );
      
      console.log('✅ Created!');
    }

    console.log('');
    console.log('🎉 Super Admin Account:');
    console.log('   Email: rainiertamayo11067@gmail.com');
    console.log('   Password: ADMIn1234');
    console.log('   Access: /super-admin');
    console.log('');

    await client.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();

