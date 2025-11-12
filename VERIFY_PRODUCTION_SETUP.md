# Verify Production Setup - Does Data Go to Supabase?

## ✅ Quick Check

**Answer: YES, if all environment variables are set correctly in Vercel!**

## Required Environment Variables in Vercel

Go to your Vercel project → **Settings** → **Environment Variables** and verify these are set:

### Backend/API Environment Variables:
```
DATABASE_URL=postgresql://postgres:structuraHAHA69@db.xxtbvhnrbhchgzsguaxe.supabase.co:5432/postgres
SUPABASE_DB_URL=postgresql://postgres:structuraHAHA69@db.xxtbvhnrbhchgzsguaxe.supabase.co:5432/postgres
SUPABASE_URL=https://xxtbvhnrbhchgzsguaxe.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4dGJ2aG5yYmhjaGd6c2d1YXhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NTA4OTksImV4cCI6MjA3ODAyNjg5OX0.eWXuY0VFFEgTvU4c1b915ZJcDVm84qx1f5F4AE0pwi0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4dGJ2aG5yYmhjaGd6c2d1YXhlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjQ1MDg5OSwiZXhwIjoyMDc4MDI2ODk5fQ.P8Z7oHFIHqOpGCwPFPZX_BzAO15AitSM1kdJyI2GE8o
JWT_SECRET=structura-super-secret-jwt-key-2024
NODE_ENV=production
```

### Frontend Environment Variables:
```
VITE_API_URL=https://your-project.vercel.app/api
VITE_SUPABASE_URL=https://xxtbvhnrbhchgzsguaxe.supabase.co
FRONTEND_URL=https://your-project.vercel.app
```

**⚠️ IMPORTANT**: Replace `your-project.vercel.app` with your actual Vercel domain!

## How to Test

### 1. Check Environment Variables
- Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- Make sure all variables above are set for **Production** environment

### 2. Test Registration/Login
1. Go to your deployed website: `https://your-project.vercel.app`
2. Try to register a new account
3. Check Supabase Dashboard → Table Editor → `Users` table
4. You should see the new user!

### 3. Test Store Creation
1. After logging in, create a store
2. Check Supabase Dashboard → Table Editor → `Stores` table
3. You should see the new store!

### 4. Test Product Creation
1. Add a product to your store
2. Check Supabase Dashboard → Table Editor → `Products` table
3. You should see the new product!

## Troubleshooting

### If data is NOT going to Supabase:

1. **Check Vercel Function Logs**:
   - Go to Vercel Dashboard → Your Project → Functions tab
   - Check for any errors in the API routes

2. **Check Browser Console**:
   - Open browser DevTools (F12)
   - Go to Console tab
   - Look for API errors
   - Go to Network tab
   - Check if API calls are successful (status 200)

3. **Verify API URL**:
   - Check if `VITE_API_URL` is set correctly
   - It should be: `https://your-project.vercel.app/api`
   - Check browser console for API calls going to the wrong URL

4. **Check Database Connection**:
   - The API functions need to connect to Supabase
   - Check Vercel Function logs for database connection errors

5. **Verify Supabase Tables**:
   - Make sure tables exist in Supabase
   - Check: Users, Stores, Products, Orders, OrderItems

## Common Issues

### Issue: "Connection refused" or "ECONNREFUSED"
**Solution**: Check if `DATABASE_URL` is correct in Vercel environment variables

### Issue: "Invalid credentials"
**Solution**: Verify `SUPABASE_SERVICE_ROLE_KEY` is correct

### Issue: API calls going to localhost
**Solution**: Make sure `VITE_API_URL` is set in Vercel and points to your Vercel domain

### Issue: CORS errors
**Solution**: Check if `FRONTEND_URL` is set correctly in Vercel

## Quick Verification Steps

1. ✅ Environment variables set in Vercel
2. ✅ `VITE_API_URL` points to your Vercel domain (`/api`)
3. ✅ Database connection string is correct
4. ✅ Supabase tables exist
5. ✅ Test registration/login
6. ✅ Check Supabase for new data

If all steps pass, **YES, your data will go to Supabase!** 🎉

