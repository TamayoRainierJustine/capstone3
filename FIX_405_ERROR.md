# Fix 405 Method Not Allowed Error

## What's Happening

The frontend is trying to call an API endpoint, but getting a 405 error. This usually means:

1. **VITE_API_URL not set in Vercel** - Frontend falls back to `/api` (Vercel serverless)
2. **Wrong HTTP method** - Requesting GET on a POST route or vice versa
3. **Railway backend not accessible** - The Railway URL might be incorrect

---

## Solution 1: Set VITE_API_URL in Vercel (Most Common Fix)

### Step 1: Get Your Railway Backend URL

1. Go to **Railway Dashboard** → Your Project → Service
2. Find your **Public Domain** (should look like `https://your-service.railway.app`)
3. **Copy this URL**

### Step 2: Add VITE_API_URL to Vercel

1. Go to **Vercel Dashboard** → Your Project
2. Click **Settings** → **Environment Variables**
3. **Add new variable:**
   - **Key**: `VITE_API_URL`
   - **Value**: `https://YOUR-RAILWAY-URL.railway.app/api`
     - Replace `YOUR-RAILWAY-URL` with your actual Railway domain!
   - **Environments**: Select all ✅
     - Production
     - Preview  
     - Development
4. **Save**
5. **Redeploy** your frontend

---

## Solution 2: Check What Endpoint is Failing

### Find the Failing Request

1. Open your website
2. Press **F12** to open Developer Tools
3. Go to **Network** tab
4. Look for the request showing **405** status
5. Click on it to see:
   - **Request URL**: What endpoint was called
   - **Request Method**: GET, POST, PUT, DELETE?
   - **Response**: What error message

### Check if Railway Backend Works

Test your Railway backend directly:

1. Open: `https://YOUR-RAILWAY-URL.railway.app/api/test`
2. Should return: `{ "message": "Server is running", ... }`
3. If this doesn't work, your Railway URL is wrong

---

## Solution 3: Check Browser Console

### Look for Specific Errors

1. Open **Console** tab in Developer Tools (F12)
2. Look for:
   - Network errors
   - CORS errors
   - The exact URL that's failing
3. Share this information to debug further

---

## Common Causes

### 1. VITE_API_URL Not Set

**Symptom**: All API calls return 405 or go to Vercel's `/api`

**Fix**: Set `VITE_API_URL` in Vercel (Solution 1 above)

### 2. Railway URL Missing `/api` at End

**Wrong**: `https://your-service.railway.app`
**Correct**: `https://your-service.railway.app/api`

### 3. Railway Backend Not Running

**Check**: Visit `https://YOUR-RAILWAY-URL.railway.app/api/test`
**Fix**: Check Railway deployment logs

### 4. Wrong HTTP Method

**Example**: Frontend sends GET but backend expects POST

**Fix**: Check the API route in `backend/routes/` files

---

## Quick Checklist

- [ ] Got Railway backend URL
- [ ] Tested Railway URL directly (`/api/test` works)
- [ ] Added `VITE_API_URL` to Vercel environment variables
- [ ] Value includes `/api` at the end
- [ ] Selected all environments (Production, Preview, Development)
- [ ] Redeployed Vercel frontend
- [ ] Checked browser console for specific error
- [ ] Checked Network tab for failing request URL

---

## Still Not Working?

Share this information:

1. **The exact URL** showing 405 error (from browser Network tab)
2. **Request method** (GET, POST, etc.)
3. **VITE_API_URL value** you set in Vercel
4. **Railway backend URL** and if `/api/test` works
5. **Console errors** (screenshot or copy-paste)

