# How to Check Vercel Logs - Multiple Methods

## Method 1: Check Deployment Logs (Easiest) ✅

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Click on your project

2. **Go to Deployments Tab**
   - Click **"Deployments"** in the top menu
   - You'll see a list of deployments

3. **Click on the Latest Deployment**
   - Click on the top deployment (most recent one)
   - This opens the deployment details

4. **Check the Build Logs**
   - Scroll down or look for **"Build Logs"** or **"Runtime Logs"**
   - Look for any error messages (usually in red)

5. **Check Function Logs**
   - Look for a section called **"Functions"** or **"Serverless Functions"**
   - Click on any function name
   - You should see logs there

## Method 2: Check Real-Time Logs

1. **Go to Vercel Dashboard**
2. **Open your project**
3. **Click on "Functions" in the sidebar** (if available)
   - Or go to: Settings → Functions
4. **You might see function logs there**

## Method 3: Use Browser DevTools (Easiest for Testing) ✅

1. **Open your website**: `https://structura-eight.vercel.app`
2. **Open DevTools**: Press `F12` or `Right-click → Inspect`
3. **Go to Network Tab**
4. **Try to register/login**
5. **Click on the failed request** (it will be red)
6. **Check these tabs**:
   - **Headers**: Shows the request/response headers
   - **Response**: Shows the error message from the server
   - **Preview**: Shows formatted error message

This will show you the exact error! 🎯

## Method 4: Check via Vercel CLI

If you have Vercel CLI installed:

```bash
vercel logs
```

## Method 5: Test the Database Endpoint

I created a test endpoint. Just visit this URL in your browser:

```
https://structura-eight.vercel.app/api/test-db
```

This will show:
- ✅ If database connection works
- ❌ If it fails (with error message)

## Method 6: Check Vercel Dashboard → Monitoring

1. Go to your project
2. Look for **"Analytics"** or **"Monitoring"** tab
3. Check for errors there

## What to Look For

Common errors you might see:
- `ConnectionError` - Database connection failed
- `JWT_SECRET is not defined` - Missing environment variable
- `Cannot find module` - Missing dependency
- `ECONNREFUSED` - Connection refused (database issue)

## Quick Test Right Now

**Just do this**:
1. Open: `https://structura-eight.vercel.app/api/test-db`
2. See what it says
3. Share the response with me

This will tell us if it's a database issue or something else!

