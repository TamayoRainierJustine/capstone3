import bcrypt from 'bcryptjs';
import User from '../models/user.js';
import sequelize from '../config/db.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables - try multiple paths
const envPaths = [
  join(__dirname, '..', '.env'),
  join(__dirname, '..', '..', '.env'),
  resolve(process.cwd(), '.env')
];

for (const envPath of envPaths) {
  try {
    dotenv.config({ path: envPath });
    if (process.env.DATABASE_URL || process.env.SUPABASE_DB_URL) {
      console.log(`✅ Loaded .env from: ${envPath}`);
      break;
    }
  } catch (e) {
    // Continue to next path
  }
}

// Also try loading from process.cwd() (current working directory)
if (!process.env.DATABASE_URL && !process.env.SUPABASE_DB_URL) {
  dotenv.config();
}

const createSuperAdmin = async () => {
  try {
    // Check if database URL is set
    if (!process.env.DATABASE_URL && !process.env.SUPABASE_DB_URL) {
      console.error('');
      console.error('❌ Error: DATABASE_URL or SUPABASE_DB_URL is not set!');
      console.error('');
      console.error('💡 Please set the database URL in your .env file:');
      console.error('   SUPABASE_DB_URL=postgresql://...');
      console.error('   or');
      console.error('   DATABASE_URL=postgresql://...');
      console.error('');
      console.error('📁 Looking for .env in:', resolve(process.cwd(), '.env'));
      console.error('');
      process.exit(1);
    }

    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connected');

    const email = 'rainiertamayo11067@gmail.com';
    const password = 'ADMIn1234';
    const firstName = 'Super';
    const lastName = 'Admin';

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    
    if (existingUser) {
      console.log('⚠️  User already exists. Updating role to super_admin...');
      
      // Update to super admin
      existingUser.role = 'super_admin';
      existingUser.isVerified = true;
      existingUser.emailVerifiedAt = new Date();
      
      // Update password if needed
      const passwordMatch = await bcrypt.compare(password, existingUser.password);
      if (!passwordMatch) {
        console.log('   Updating password...');
        existingUser.password = await bcrypt.hash(password, 10);
      }
      
      await existingUser.save();
      console.log('✅ User updated to super admin!');
      console.log('   Email:', existingUser.email);
      console.log('   Name:', existingUser.firstName, existingUser.lastName);
      console.log('   Role:', existingUser.role);
      console.log('');
      console.log('🎉 You can now login with:');
      console.log('   Email: rainiertamayo11067@gmail.com');
      console.log('   Password: ADMIn1234');
      process.exit(0);
    }

    // Hash password
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create super admin
    console.log('👤 Creating super admin user...');
    const superAdmin = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: 'super_admin',
      isVerified: true,
      emailVerifiedAt: new Date()
    });

    console.log('');
    console.log('✅ Super admin created successfully!');
    console.log('');
    console.log('📧 Details:');
    console.log('   Email:', superAdmin.email);
    console.log('   Name:', superAdmin.firstName, superAdmin.lastName);
    console.log('   Role:', superAdmin.role);
    console.log('   ID:', superAdmin.id);
    console.log('');
    console.log('🎉 You can now login with:');
    console.log('   Email: rainiertamayo11067@gmail.com');
    console.log('   Password: ADMIn1234');
    console.log('');
    console.log('🔗 After logging in, you can access:');
    console.log('   - Super Admin Dashboard: /super-admin');
    console.log('   - API Applications Review: /super-admin/applications');
    
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ Error:', error.message);
    console.error('');
    if (error.name === 'SequelizeConnectionError') {
      console.error('💡 Make sure your database is running and .env file is configured correctly.');
    }
    console.error('Full error:', error);
    process.exit(1);
  }
};

createSuperAdmin();

