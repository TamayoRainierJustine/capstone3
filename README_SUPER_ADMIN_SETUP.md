# Super Admin Setup Guide

## Paano Gumawa ng Super Admin Account

### Option 1: Gumamit ng Setup Endpoint (One-time)

1. **Gumawa ng Super Admin** (first time only):
   ```bash
   curl -X POST http://localhost:5000/api/admin-setup/setup-super-admin \
     -H "Content-Type: application/json" \
     -d '{
       "email": "superadmin@example.com",
       "password": "your-secure-password",
       "firstName": "Super",
       "lastName": "Admin"
     }'
   ```

2. **O i-update ang existing user** (kung may existing user ka na):
   - I-set ang `ADMIN_SECRET_KEY` sa `.env` file:
     ```
     ADMIN_SECRET_KEY=your-secret-key-here
     ```
   
   - I-update ang user role:
     ```bash
     curl -X POST http://localhost:5000/api/admin-setup/update-user-role \
       -H "Content-Type: application/json" \
       -d '{
         "email": "your-email@example.com",
         "newRole": "super_admin",
         "secretKey": "your-secret-key-here"
       }'
     ```

### Option 2: Direktang sa Database (PostgreSQL)

1. **I-connect sa database:**
   ```bash
   psql -U your_username -d your_database_name
   ```

2. **Hanapin ang user ID:**
   ```sql
   SELECT id, email, "firstName", "lastName", role FROM "Users" WHERE email = 'your-email@example.com';
   ```

3. **I-update ang role:**
   ```sql
   UPDATE "Users" 
   SET role = 'super_admin' 
   WHERE email = 'your-email@example.com';
   ```

   O kung gusto mong gumawa ng bagong super admin user:
   ```sql
   -- Note: Kailangan mong i-hash ang password gamit ang bcrypt
   -- Mas maganda kung gamitin ang Option 1 endpoint para automatic na ma-hash
   
   INSERT INTO "Users" (email, password, "firstName", "lastName", role, "isVerified", "emailVerifiedAt", "createdAt", "updatedAt")
   VALUES (
     'superadmin@example.com',
     '$2a$10$...hashed-password-here...',  -- Use bcrypt hash
     'Super',
     'Admin',
     'super_admin',
     true,
     NOW(),
     NOW(),
     NOW()
   );
   ```

### Option 3: Gumamit ng Node.js Script

Gumawa ng file `create-super-admin.js` sa root ng backend folder:

```javascript
import bcrypt from 'bcryptjs';
import User from './models/user.js';
import sequelize from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const createSuperAdmin = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    const email = process.argv[2] || 'superadmin@example.com';
    const password = process.argv[3] || 'admin123';
    const firstName = process.argv[4] || 'Super';
    const lastName = process.argv[5] || 'Admin';

    // Check if super admin exists
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      console.log('⚠️  User already exists. Updating role to super_admin...');
      existing.role = 'super_admin';
      existing.isVerified = true;
      existing.emailVerifiedAt = new Date();
      await existing.save();
      console.log('✅ User updated to super admin:', email);
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create super admin
    const superAdmin = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: 'super_admin',
      isVerified: true,
      emailVerifiedAt: new Date()
    });

    console.log('✅ Super admin created successfully!');
    console.log('   Email:', superAdmin.email);
    console.log('   Name:', superAdmin.firstName, superAdmin.lastName);
    console.log('   Role:', superAdmin.role);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createSuperAdmin();
```

Tapos i-run:
```bash
cd backend
node create-super-admin.js superadmin@example.com your-password Super Admin
```

## Pagkatapos Gumawa ng Super Admin:

1. **I-login** sa website gamit ang super admin email at password
2. Makikita mo ang **"Super Admin"** link sa header (kanan, katabi ng "Sign Out")
3. Pindutin ang link para makapunta sa Super Admin Dashboard
4. O diretso sa URL: `http://localhost:5173/super-admin`

## Pag-access sa Super Admin Features:

- **Super Admin Dashboard**: `/super-admin`
- **API Applications Review**: `/super-admin/applications`
- **Help Chat System**: Makikita mo rin ang lahat ng tickets ng store owners

## Security Note:

⚠️ **Important**: After creating the first super admin, dapat mo nang i-disable o i-protect ang `/api/admin-setup` routes para hindi ma-hack ng iba.

