# Quick Setup: Vercel Environment Variables

## 📍 Where to Add Variables

**Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

---

## 🔑 Required Variables (Copy These)

### 1. Database Connection

```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres
SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres
```

**How to get:**
1. Go to Supabase Dashboard → Your Project
2. Settings → Database
3. Copy "Connection string" (URI format)
4. Replace `[PASSWORD]` with your database password
5. Replace `[PROJECT-ID]` with your Supabase project ID

---

### 2. Supabase Configuration

```env
SUPABASE_URL=https://[PROJECT-ID].supabase.co
SUPABASE_ANON_KEY=[ANON-KEY]
SUPABASE_SERVICE_ROLE_KEY=[SERVICE-ROLE-KEY]
```

**How to get:**
1. Go to Supabase Dashboard → Your Project
2. Settings → API
3. Copy:
   - **Project URL** → Use for `SUPABASE_URL` and `VITE_SUPABASE_URL`
   - **anon/public key** → Use for `SUPABASE_ANON_KEY`
   - **service_role key** → Use for `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep secret!)

---

### 3. JWT Secret

```env
JWT_SECRET=[GENERATE-RANDOM-32-CHARACTERS]
```

**How to generate:**
```bash
# Option 1: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 2: Using OpenSSL
openssl rand -hex 32

# Option 3: Use online generator
# https://randomkeygen.com/
```

**Example:** `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6`

---

### 4. Node Environment

```env
NODE_ENV=production
```

---

### 5. Frontend Variables (VITE_ prefix required)

```env
VITE_SUPABASE_URL=https://[PROJECT-ID].supabase.co
FRONTEND_URL=https://your-project.vercel.app
```

**Note:** 
- `VITE_SUPABASE_URL` should match `SUPABASE_URL` (same value)
- `FRONTEND_URL` - Replace `your-project.vercel.app` with your actual Vercel domain after first deployment

---

### 6. API URL (Optional - Recommended to skip)

```env
# Option 1 (Recommended): Don't set this - uses /api automatically
# (No variable needed)

# Option 2: Set after first deployment
VITE_API_URL=https://your-project.vercel.app/api
```

**Recommendation:** Skip `VITE_API_URL` - the frontend will automatically use `/api` which works perfectly since API routes are on the same Vercel deployment.

---

## ✅ Complete Example

Replace all `[VALUES]` with your actual credentials:

```env
DATABASE_URL=postgresql://postgres:YourPassword123@db.abcdefghijk.supabase.co:5432/postgres
SUPABASE_DB_URL=postgresql://postgres:YourPassword123@db.abcdefghijk.supabase.co:5432/postgres
SUPABASE_URL=https://abcdefghijk.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NTA4OTksImV4cCI6MjA3ODAyNjg5OX0.example
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjQ1MDg5OSwiZXhwIjoyMDc4MDI2ODk5fQ.example
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long-change-this
NODE_ENV=production
VITE_SUPABASE_URL=https://abcdefghijk.supabase.co
FRONTEND_URL=https://your-project.vercel.app
```

---

## 📋 Step-by-Step Setup

1. **Open Vercel Dashboard**
   - Go to your project
   - Click **Settings** → **Environment Variables**

2. **Add Each Variable**
   - Click **Add New**
   - Enter variable name
   - Enter variable value
   - Select environments: ✅ Production, ✅ Preview, ✅ Development
   - Click **Save**

3. **Repeat for All Variables**
   - Add all 8 variables from the example above
   - Make sure `VITE_` prefix is used for frontend variables

4. **Redeploy**
   - Go to **Deployments**
   - Click **Redeploy** on latest deployment
   - Or push new code to trigger deployment

5. **Verify**
   - Check build logs for errors
   - Test your deployed app
   - Verify database connection works

---

## ⚠️ Important Notes

1. **VITE_ Prefix**: Frontend variables MUST start with `VITE_` (e.g., `VITE_SUPABASE_URL`)
2. **Environment Scope**: Set variables for Production, Preview, AND Development
3. **Security**: Never commit `.env` files or expose `SUPABASE_SERVICE_ROLE_KEY` in frontend
4. **Redeploy**: Variables only take effect after redeployment
5. **Case Sensitive**: Variable names are case-sensitive (`DATABASE_URL` not `database_url`)

---

## 🔍 Verify Variables Are Set

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Check all variables are listed
3. Verify values are correct (without revealing secrets)
4. Check environments are selected (Production, Preview, Development)

---

## 🐛 Troubleshooting

### Variable Not Working?
- ✅ Check spelling (case-sensitive)
- ✅ Check VITE_ prefix for frontend variables
- ✅ Redeploy after adding variables
- ✅ Check build logs for errors

### Database Connection Failed?
- ✅ Verify `DATABASE_URL` is correct
- ✅ Check password is correct (no special character encoding needed)
- ✅ Verify Supabase project is active

### File Upload Not Working?
- ✅ Verify `SUPABASE_SERVICE_ROLE_KEY` is set (not anon key)
- ✅ Check Storage buckets exist (`products`, `backgrounds`)
- ✅ Verify buckets are public

### Images Not Loading?
- ✅ Verify `VITE_SUPABASE_URL` is set correctly
- ✅ Check Storage buckets are public
- ✅ Verify image paths are correct

---

## 📞 Need Help?

1. Check `VERCEL_ENV_VARIABLES.md` for detailed documentation
2. Check Vercel build logs for specific errors
3. Verify Supabase credentials in Supabase Dashboard
4. Test database connection using Supabase SQL Editor

---

**Quick Checklist:**
- [ ] All 8 variables added to Vercel
- [ ] Variables set for Production, Preview, and Development
- [ ] All `[VALUES]` replaced with actual credentials
- [ ] `VITE_` prefix used for frontend variables
- [ ] Project redeployed after adding variables
- [ ] Build logs show no errors
- [ ] App works correctly after deployment

