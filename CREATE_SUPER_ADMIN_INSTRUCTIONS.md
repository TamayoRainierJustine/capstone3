# Paano Gumawa ng Super Admin Account

## Quick Method: Gamitin ang SQL (Pinakamadali)

### Step 1: Buksan ang Supabase SQL Editor
1. Pumunta sa https://supabase.com
2. Piliin ang project mo
3. Pumunta sa **SQL Editor**

### Step 2: I-run ang SQL command

**Kung may existing user account na sa email `rainiertamayo11067@gmail.com`:**
```sql
UPDATE "Users" 
SET role = 'super_admin',
    "isVerified" = true,
    "emailVerifiedAt" = NOW()
WHERE email = 'rainiertamayo11067@gmail.com';
```

**Kung walang user account pa:**
1. Mag-register muna sa website gamit ang email `rainiertamayo11067@gmail.com` at password `ADMIn1234`
2. Tapos i-run ang UPDATE command sa taas

### Step 3: I-check kung successful
```sql
SELECT id, email, "firstName", "lastName", role, "isVerified" 
FROM "Users" 
WHERE email = 'rainiertamayo11067@gmail.com';
```

Dapat lalabas ang `role = 'super_admin'`.

## Pagkatapos:

1. **I-login** sa website:
   - Email: `rainiertamayo11067@gmail.com`
   - Password: `ADMIn1234`

2. Makikita mo ang **"Super Admin"** link sa header (kanan, katabi ng "Sign Out")

3. Pindutin ang link para makapunta sa Super Admin Dashboard

4. O diretso sa URL: `http://localhost:5173/super-admin`

---

## Alternative: Gamitin ang Node.js Script

Kung gusto mong gumamit ng script:

1. **I-set ang database URL** sa backend/.env:
   ```
   SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
   ```

2. **I-run ang script:**
   ```bash
   cd backend
   node scripts/CREATE_SUPER_ADMIN_QUICK.js
   ```

   O kung walang .env file:
   ```bash
   cd backend
   node scripts/CREATE_SUPER_ADMIN_QUICK.js "postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"
   ```

---

## Alternative: Gamitin ang API Endpoint

Kung naka-run ang backend server:

```bash
curl -X POST http://localhost:5000/api/admin-setup/setup-super-admin -H "Content-Type: application/json" -d "{\"email\":\"rainiertamayo11067@gmail.com\",\"password\":\"ADMIn1234\",\"firstName\":\"Super\",\"lastName\":\"Admin\"}"
```

