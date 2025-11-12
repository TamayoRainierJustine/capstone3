# Quick Start: Deploy to Vercel + Supabase

## Prerequisites Checklist

- [ ] Vercel account created
- [ ] Supabase account created
- [ ] GitHub repository (optional but recommended)

## Step 1: Set Up Supabase (5 minutes)

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Name: `structura-db`
   - Set a strong database password (save it!)
   - Choose region closest to you
   - Wait for project to be created (~2 minutes)

2. **Run Database Migration**
   - In Supabase dashboard, go to **SQL Editor**
   - Copy contents of `supabase/migrations/001_initial_schema.sql`
   - Paste and click "Run"
   - Verify tables created in **Table Editor**

3. **Set Up Storage Buckets**
   - Go to **Storage** in Supabase
   - Create bucket: `products` (Public: ✅)
   - Create bucket: `backgrounds` (Public: ✅)
   - Run Storage policies SQL (see DEPLOYMENT.md)

4. **Get Credentials**
   - **Project Settings** → **API**: Copy `Project URL` and `anon key`
   - **Project Settings** → **API**: Copy `service_role key` (keep secret!)
   - **Project Settings** → **Database**: Copy connection string (URI format)

## Step 2: Migrate Data (If you have existing data)

1. **Update `.env` file** with both MySQL and Supabase credentials
2. **Install dependencies**:
   ```bash
   cd backend
   npm install pg
   ```
3. **Run migration**:
   ```bash
   npm run migrate:supabase
   ```

## Step 3: Deploy to Vercel (10 minutes)

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```
   - Follow prompts (use defaults)
   - Project name: `structura`

4. **Set Environment Variables in Vercel Dashboard**:
   - Go to your project → **Settings** → **Environment Variables**
   - Add all variables from `.env.example`:
     - `DATABASE_URL`
     - `SUPABASE_URL`
     - `SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `JWT_SECRET` (generate a random string)
     - `NODE_ENV=production`
     - `VITE_API_URL=https://your-project.vercel.app/api`
     - `FRONTEND_URL=https://your-project.vercel.app`

5. **Deploy Production**:
   ```bash
   vercel --prod
   ```

## Step 4: Verify Deployment

1. Visit your Vercel URL
2. Test login with admin credentials
3. Test creating a store
4. Test uploading images
5. Check all features work

## Troubleshooting

### Database Connection Failed
- Verify `DATABASE_URL` is correct
- Check Supabase project is active
- Ensure SSL is enabled

### File Upload Not Working
- Verify Storage buckets are created
- Check Storage policies are set
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set (not anon key)

### CORS Errors
- Update CORS in `api/index.js` with your Vercel URL
- Check environment variables are set correctly

## Next Steps

- [ ] Set up custom domain (optional)
- [ ] Configure email service (for notifications)
- [ ] Set up monitoring (Vercel Analytics)
- [ ] Enable backups in Supabase

## Support

For detailed instructions, see `DEPLOYMENT.md`

