# Vercel Environment Variables - Complete Guide

## 📋 Quick Copy-Paste for Vercel Dashboard

Go to: **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

Add these variables for **Production, Preview, and Development** environments:

---

## ✅ Required Environment Variables

### Backend/API Variables (Server-side)

```env
# Database Connection (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-ID].supabase.co:5432/postgres
SUPABASE_DB_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-ID].supabase.co:5432/postgres

# Supabase Configuration
SUPABASE_URL=https://[YOUR-PROJECT-ID].supabase.co
SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR-SERVICE-ROLE-KEY]

# JWT Authentication
JWT_SECRET=[YOUR-SECRET-JWT-KEY-MIN-32-CHARACTERS]

# Node Environment
NODE_ENV=production
```

### Frontend Variables (Client-side - Must start with VITE_)

```env
# API URL (Optional - will use /api if not set)
# VITE_API_URL=https://your-project.vercel.app/api
# OR leave it unset to use relative path /api (recommended)

# Supabase URL (for image storage)
VITE_SUPABASE_URL=https://[YOUR-PROJECT-ID].supabase.co

# Frontend URL (Optional - for CORS/referencing)
FRONTEND_URL=https://your-project.vercel.app
```

---

## 🔧 How to Get Your Supabase Credentials

### Step 1: Get Database URL

1. Go to Supabase Dashboard → Your Project
2. Go to **Settings** → **Database**
3. Copy the **Connection string** (URI format)
4. Replace `[YOUR-PASSWORD]` with your actual database password
5. Format: `postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres`

### Step 2: Get Supabase API Keys

1. Go to Supabase Dashboard → Your Project
2. Go to **Settings** → **API**
3. Copy:
   - **Project URL**: `https://xxxxx.supabase.co` → Use for `SUPABASE_URL` and `VITE_SUPABASE_URL`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` → Use for `SUPABASE_ANON_KEY`
   - **service_role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` → Use for `SUPABASE_SERVICE_ROLE_KEY`
   - ⚠️ **Keep service_role key SECRET!** Never expose it in frontend code.

### Step 3: Generate JWT Secret

Generate a random secure string (minimum 32 characters):

```bash
# Option 1: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 2: Using OpenSSL
openssl rand -hex 32

# Option 3: Use an online generator
# https://randomkeygen.com/
```

Example: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6`

---

## 📝 Complete Example (Replace with Your Values)

```env
# Database
DATABASE_URL=postgresql://postgres:YourPassword123@db.abcdefghijk.supabase.co:5432/postgres
SUPABASE_DB_URL=postgresql://postgres:YourPassword123@db.abcdefghijk.supabase.co:5432/postgres

# Supabase
SUPABASE_URL=https://abcdefghijk.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NTA4OTksImV4cCI6MjA3ODAyNjg5OX0.example
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjQ1MDg5OSwiZXhwIjoyMDc4MDI2ODk5fQ.example

# JWT
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long-change-this

# Node
NODE_ENV=production

# Frontend
VITE_SUPABASE_URL=https://abcdefghijk.supabase.co
FRONTEND_URL=https://your-project.vercel.app
```

---

## ⚠️ Important Notes

### 1. VITE_API_URL (Optional but Recommended)

**Option A (Recommended)**: Don't set `VITE_API_URL` at all
- The frontend will automatically use `/api` (relative path)
- Works because API routes are on the same Vercel deployment
- No CORS issues

**Option B**: Set it to your Vercel domain
- `VITE_API_URL=https://your-project.vercel.app/api`
- Replace `your-project.vercel.app` with your actual Vercel domain
- Must update after first deployment when you get your domain

### 2. Environment Scope

Set all variables for:
- ✅ **Production**
- ✅ **Preview** (for preview deployments)
- ✅ **Development** (for local development with Vercel CLI)

### 3. VITE_ Prefix

Frontend variables **MUST** start with `VITE_`:
- ✅ `VITE_API_URL` - Works in frontend
- ✅ `VITE_SUPABASE_URL` - Works in frontend
- ❌ `API_URL` - Won't work (not exposed to frontend)
- ❌ `SUPABASE_URL` - Won't work (backend only)

### 4. Security

- ⚠️ **Never commit** `.env` files to Git
- ⚠️ **Never expose** `SUPABASE_SERVICE_ROLE_KEY` in frontend code
- ⚠️ **Never expose** `JWT_SECRET` in frontend code
- ⚠️ **Never expose** `DATABASE_URL` in frontend code

### 5. After Adding Variables

1. **Redeploy** your project in Vercel
2. Environment variables are only available after redeployment
3. Check build logs to verify variables are loaded

---

## 🔍 Optional: Payment Gateway Variables

If you're using payment gateways, add these (optional):

```env
# PayPal
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret

# Stripe
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key

# GCash
GCASH_MERCHANT_ID=your_gcash_merchant_id
GCASH_API_KEY=your_gcash_api_key
```

---

## ✅ Verification Checklist

After setting up environment variables:

- [ ] All required variables are set in Vercel
- [ ] Variables are set for Production, Preview, and Development
- [ ] `DATABASE_URL` is correct (test connection)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set (for file uploads)
- [ ] `JWT_SECRET` is set and secure (32+ characters)
- [ ] `VITE_SUPABASE_URL` is set (for image URLs)
- [ ] `FRONTEND_URL` is set to your actual Vercel domain
- [ ] Project is redeployed after adding variables
- [ ] Build logs show no environment variable errors

---

## 🐛 Troubleshooting

### Variable Not Working?

1. **Check spelling** - Variable names are case-sensitive
2. **Check VITE_ prefix** - Frontend variables must start with `VITE_`
3. **Redeploy** - Variables only available after redeployment
4. **Check scope** - Make sure variable is set for the right environment

### Database Connection Failed?

1. Verify `DATABASE_URL` is correct
2. Check password is correct (no special characters need encoding)
3. Verify Supabase project is active
4. Check if SSL is required

### File Upload Not Working?

1. Verify `SUPABASE_SERVICE_ROLE_KEY` is set (not anon key)
2. Check Storage buckets are created (`products`, `backgrounds`)
3. Verify Storage policies are set correctly
4. Check bucket is public for reading

### Images Not Loading?

1. Verify `VITE_SUPABASE_URL` is set correctly
2. Check Storage buckets exist and are public
3. Verify image paths are correct
4. Check CORS settings in Supabase

---

## 📚 Additional Resources

- [Vercel Environment Variables Docs](https://vercel.com/docs/concepts/projects/environment-variables)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)

---

## 🎯 Quick Setup Steps

1. **Get Supabase credentials** (see above)
2. **Generate JWT secret** (see above)
3. **Go to Vercel Dashboard** → Your Project → Settings → Environment Variables
4. **Add all required variables** (copy from above)
5. **Set for all environments** (Production, Preview, Development)
6. **Replace placeholders** with your actual values
7. **Redeploy** your project
8. **Verify** deployment works

---

**Last Updated**: 2024
**Project**: Structura E-commerce Store Builder

