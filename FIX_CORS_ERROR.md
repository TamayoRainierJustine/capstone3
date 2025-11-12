# Fix CORS Error - Step by Step

## The Problem
- Frontend is at: `https://structura-eight.vercel.app`
- API is trying to call: `https://your-project.vercel.app/api` (placeholder URL)
- CORS is blocking the request

## Solution

### Step 1: Update Environment Variables in Vercel

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

2. Find `VITE_API_URL` and either:
   
   **Option A (Recommended)**: Delete it or set it to `/api`
   - This uses a relative path (same domain)
   - Works automatically with your Vercel deployment
   
   **Option B**: Set it to your actual domain
   - `VITE_API_URL=https://structura-eight.vercel.app/api`

3. Make sure `FRONTEND_URL` is set:
   - `FRONTEND_URL=https://structura-eight.vercel.app`

4. **Save** and **Redeploy** your project

### Step 2: Code Changes (Already Done)

I've already updated the code to:
1. ✅ Fix CORS to allow all `.vercel.app` domains
2. ✅ Make API URL fallback to `/api` if placeholder is detected

### Step 3: Redeploy

After updating environment variables:
1. Go to Vercel Dashboard → Your Project → **Deployments**
2. Click the **3 dots** (⋮) on the latest deployment
3. Click **Redeploy**

Or just push the code changes:
```bash
git add api/index.js frontend/src/config/api.js
git commit -m "Fix CORS error and API URL configuration"
git push
```

## Quick Fix (Easiest)

**Just remove `VITE_API_URL` from Vercel environment variables!**

The code will automatically use `/api` (relative path) which works perfectly since your API routes are on the same domain.

## Verify It Works

After redeploying:
1. Open `https://structura-eight.vercel.app`
2. Open browser DevTools (F12) → Network tab
3. Try to register
4. Check the API call - it should go to `/api/auth/register` (relative path)
5. Should return status 200 (success) ✅

