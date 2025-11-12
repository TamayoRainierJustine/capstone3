# Deployment Guide: Vercel + Supabase

This guide will walk you through deploying your Structura application to Vercel with Supabase as the database.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
3. **GitHub Account**: For version control (recommended)

## Step 1: Set Up Supabase

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in:
   - **Name**: structura-db (or your preferred name)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is sufficient

### 1.2 Run Database Migrations

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
4. Click "Run" to execute the migration
5. Verify tables are created in **Table Editor**

### 1.3 Get Supabase Credentials

1. Go to **Project Settings** → **API**
2. Copy the following:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (keep secret!)

3. Go to **Project Settings** → **Database**
4. Copy the **Connection string** (URI format):
   - Format: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`

### 1.4 Set Up Supabase Storage

1. Go to **Storage** in Supabase dashboard
2. Create two buckets:
   - **products**: Public bucket for product images
   - **backgrounds**: Public bucket for background images

3. For each bucket:
   - Click "New bucket"
   - Name: `products` or `backgrounds`
   - Public: ✅ Enable (for public access)
   - File size limit: 5MB
   - Allowed MIME types: `image/jpeg, image/png, image/webp`

4. Set up Storage Policies (in SQL Editor):
```sql
-- Allow public read access
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id IN ('products', 'backgrounds'));

-- Allow authenticated users to upload
CREATE POLICY "Authenticated Upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id IN ('products', 'backgrounds') AND
  auth.role() = 'authenticated'
);

-- Allow users to update their own files
CREATE POLICY "User Update" ON storage.objects
FOR UPDATE USING (
  bucket_id IN ('products', 'backgrounds') AND
  auth.role() = 'authenticated'
);

-- Allow users to delete their own files
CREATE POLICY "User Delete" ON storage.objects
FOR DELETE USING (
  bucket_id IN ('products', 'backgrounds') AND
  auth.role() = 'authenticated'
);
```

## Step 2: Migrate Data from MySQL to Supabase

### 2.1 Export Admin Credentials

If you have an admin user in MySQL, you need to export it:

1. Connect to your MySQL database
2. Run:
```sql
SELECT id, "firstName", "lastName", email, password, role, "createdAt", "updatedAt" 
FROM Users 
WHERE role = 'admin';
```

3. Save the password hash (you'll need it for migration)

### 2.2 Run Migration Script

1. Update `.env` file with both MySQL and Supabase credentials:
```env
# MySQL (source)
DB_NAME=structura_db
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_HOST=localhost
DB_DIALECT=mysql

# Supabase (destination)
SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres

# Supabase API
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

2. Install PostgreSQL driver:
```bash
cd backend
npm install pg
```

3. Run migration:
```bash
npm run migrate:supabase
```

This will migrate all your data including admin credentials.

## Step 3: Prepare for Vercel Deployment

### 3.1 Update Environment Variables

Create `.env.local` in the root directory (for local testing):
```env
# Supabase
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Node Environment
NODE_ENV=production
```

### 3.2 Test Locally

1. Install dependencies:
```bash
npm install
cd frontend && npm install
cd ../backend && npm install
```

2. Test the API routes:
```bash
cd backend
npm run dev
```

3. Test the frontend:
```bash
cd frontend
npm run dev
```

## Step 4: Deploy to Vercel

### 4.1 Install Vercel CLI

```bash
npm install -g vercel
```

### 4.2 Deploy

1. Login to Vercel:
```bash
vercel login
```

2. Deploy from project root:
```bash
vercel
```

3. Follow the prompts:
   - Set up and deploy? **Yes**
   - Which scope? **Your account**
   - Link to existing project? **No**
   - Project name: **structura** (or your preferred name)
   - Directory: **./** (root)
   - Override settings? **No**

### 4.3 Configure Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add all environment variables:
   - `DATABASE_URL`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET`
   - `NODE_ENV=production`

4. Apply to: **Production, Preview, Development**

### 4.4 Deploy Production

```bash
vercel --prod
```

## Step 5: Update Frontend API URLs

After deployment, update the frontend to use the Vercel API URL:

1. The frontend will automatically use `VITE_API_URL` environment variable
2. In Vercel, add `VITE_API_URL=https://your-project.vercel.app/api`
3. Redeploy the frontend

## Step 6: Verify Deployment

1. Visit your Vercel URL: `https://your-project.vercel.app`
2. Test login with admin credentials
3. Test creating a store
4. Test uploading images
5. Test all major features

## Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` is correct in Vercel
- Check Supabase connection pooling settings
- Ensure SSL is enabled in production

### File Upload Issues

- Verify Supabase Storage buckets are created
- Check Storage policies are set correctly
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set (not anon key for uploads)

### CORS Issues

- Update CORS settings in `api/index.js` to include your Vercel domain
- Check Supabase CORS settings

### Environment Variables Not Working

- Ensure variables are prefixed with `VITE_` for frontend
- Redeploy after adding new environment variables
- Check variable names match exactly (case-sensitive)

## Post-Deployment Checklist

- [ ] Database migrations run successfully
- [ ] Admin user can log in
- [ ] Stores can be created
- [ ] Products can be added with images
- [ ] Images upload to Supabase Storage
- [ ] Published stores are accessible
- [ ] All API endpoints work
- [ ] Environment variables are set correctly
- [ ] CORS is configured properly

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check Supabase logs
3. Verify environment variables
4. Test API endpoints directly
5. Check browser console for errors

