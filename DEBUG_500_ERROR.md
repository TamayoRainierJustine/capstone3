# Debug 500 Error - Step by Step Guide

## What is a 500 Error?

A 500 error means "Internal Server Error" - something went wrong on the server side. This could be:
- Database connection failure
- Missing environment variables
- Code error
- Missing dependencies

## How to Debug

### Step 1: Check Vercel Function Logs

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Open your project

2. **Go to Functions Tab**
   - Click on **"Functions"** in the top menu
   - Or go to **Deployments** → Click on latest deployment → **"Functions"** tab

3. **Check Logs**
   - Click on any API function (e.g., `/api/auth/register`)
   - Look at the **"Logs"** tab
   - You'll see the actual error message there!

### Step 2: Test Database Connection

I've added a test endpoint. Try this:

1. **Open your browser**
2. **Go to**: `https://structura-eight.vercel.app/api/test-db`
3. **Check the response**:
   - ✅ If it says "success" → Database connection works
   - ❌ If it says "error" → Database connection failed

### Step 3: Verify Environment Variables

1. **Go to Vercel Dashboard**
   - Settings → **Environment Variables**

2. **Check these are set** (for Production):
   ```
   DATABASE_URL=postgresql://postgres:structuraHAHA69@db.xxtbvhnrbhchgzsguaxe.supabase.co:5432/postgres
   SUPABASE_DB_URL=postgresql://postgres:structuraHAHA69@db.xxtbvhnrbhchgzsguaxe.supabase.co:5432/postgres
   JWT_SECRET=structura-super-secret-jwt-key-2024
   NODE_ENV=production
   ```

3. **Make sure they're set for "Production" environment**

### Step 4: Check Browser Console

1. **Open your site**: `https://structura-eight.vercel.app`
2. **Open DevTools** (F12)
3. **Go to Console tab**
4. **Try to register/login**
5. **Look for error messages**

### Step 5: Check Network Tab

1. **Open DevTools** (F12)
2. **Go to Network tab**
3. **Try to register/login**
4. **Click on the failed request** (red)
5. **Check the "Response" tab** - you'll see the error message

## Common Issues and Solutions

### Issue 1: Database Connection Failed

**Error**: `ConnectionError` or `getaddrinfo ENOTFOUND`

**Solution**:
- Check `DATABASE_URL` is correct in Vercel
- Make sure Supabase project is active
- Verify password is correct

### Issue 2: Missing Environment Variables

**Error**: `Cannot read property 'DATABASE_URL' of undefined`

**Solution**:
- Make sure all env variables are set in Vercel
- Make sure they're set for "Production" environment
- Redeploy after adding env variables

### Issue 3: JWT Secret Missing

**Error**: `JWT_SECRET is not defined`

**Solution**:
- Add `JWT_SECRET` to Vercel environment variables
- Redeploy

### Issue 4: Missing Dependencies

**Error**: `Cannot find module 'xyz'`

**Solution**:
- Check `backend/package.json` has all dependencies
- Make sure `npm install` completed successfully

## Quick Fix Checklist

- [ ] Check Vercel Function Logs for actual error
- [ ] Test database connection: `/api/test-db`
- [ ] Verify all environment variables are set
- [ ] Make sure env variables are for "Production"
- [ ] Redeploy after making changes
- [ ] Check browser console for client-side errors
- [ ] Check Network tab for API response errors

## Next Steps

1. **First, check the Vercel Function Logs** - this will tell you exactly what's wrong
2. **Test the database connection** using `/api/test-db`
3. **Share the error message** from the logs, and I can help fix it!

The logs will show the exact error - that's the key to fixing it! 🔍

