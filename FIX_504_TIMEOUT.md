# Fixing 504 Gateway Timeout Errors

## Issue
504 Gateway Timeout errors are occurring on login and other database operations. This typically happens when:
1. Database connection takes too long to establish (cold start)
2. Database queries are slow
3. Connection pool is not optimized for serverless

## Solutions Applied

### 1. Optimized Database Connection Pool
- Reduced `max` connections to 1 (single connection for serverless)
- Reduced `acquire` timeout to 5 seconds
- Added connection eviction for idle connections

### 2. Added Query Timeouts
- All database queries now have 6-8 second timeouts
- Queries fail fast instead of hanging indefinitely

### 3. Optimized Queries
- Only fetch needed attributes
- Added query limits
- Removed unnecessary JOINs

## Recommended Solution: Use Supabase Connection Pooler

If 504 errors persist, you should use **Supabase's Connection Pooler** instead of the direct database URL. This is optimized for serverless environments like Vercel.

### Steps to Fix:

1. **Get Connection Pooler URL from Supabase:**
   - Go to your Supabase project dashboard
   - Navigate to Settings → Database
   - Find the "Connection Pooling" section
   - Copy the "Connection string" (it will look like: `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`)

2. **Update Vercel Environment Variables:**
   - Go to your Vercel project settings
   - Navigate to Environment Variables
   - Update `SUPABASE_DB_URL` or `DATABASE_URL` with the connection pooler URL
   - Make sure to use port **6543** (pooler port) instead of 5432

3. **Connection Pooler Benefits:**
   - Faster connection establishment
   - Better for serverless (handles connection pooling)
   - Reduced connection overhead
   - Optimized for high concurrency

### Alternative: Check Database Performance

If using connection pooler doesn't help:
1. Check Supabase dashboard for slow queries
2. Verify database region matches Vercel's region
3. Check if database is under heavy load
4. Consider upgrading Supabase plan if needed

## Current Timeout Settings

- **Connection acquire timeout:** 5 seconds
- **Query timeout:** 6-8 seconds
- **Vercel function timeout:** 30 seconds

If queries consistently take longer than 6-8 seconds, there's likely a database performance issue that needs to be addressed.

