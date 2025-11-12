# Debugging 400 Error on /api/stores

## Error Description
The `/api/stores` endpoint is returning a 400 (Bad Request) status code.

## What I've Fixed

### 1. Enhanced Backend Error Logging
- Added detailed error logging in `getUserStores` function
- Now logs:
  - Error name
  - Error message
  - Error stack trace
  - Parent error details (database errors)
  - Error codes

### 2. Enhanced Frontend Error Logging
- Updated error handling in:
  - `Dashboard.jsx`
  - `MyStores.jsx`
  - `SiteBuilder.jsx`
- Now properly logs error response data as JSON

### 3. Improved Error Response
- Backend now returns more detailed error information:
  ```json
  {
    "message": "Error message",
    "error": "Error name",
    "details": "Detailed error message",
    "code": "Error code"
  }
  ```

## How to Debug

### Step 1: Check Browser Console
After the error occurs, check the browser console. You should now see:
```
❌ Error fetching stores: [error object]
   Error response: [response data]
   Error status: 400
   Error message: [message]
   Error details: [formatted JSON]
```

### Step 2: Check Server Logs
Check your backend server console. You should see:
```
❌ Error fetching stores: [error]
   Error name: [name]
   Error message: [message]
   Error stack: [stack trace]
   Parent error: [database error]
   Parent code: [error code]
```

### Step 3: Common Causes

#### A. Database Connection Issue
- **Symptom**: Error code like `ECONNREFUSED` or `ETIMEDOUT`
- **Solution**: Check database connection string in `.env` file
- **Check**: `SUPABASE_DB_URL` or `DATABASE_URL` environment variable

#### B. Sequelize Association Issue
- **Symptom**: Error about "User is not associated to Store"
- **Solution**: Ensure models are properly imported and associations are set up
- **Check**: `backend/models/store.js` and `backend/app.js`

#### C. JSON Parsing Issue
- **Symptom**: Error about "Unexpected token" or "Invalid JSON"
- **Solution**: Check if any store's `content` field has invalid JSON
- **Check**: Database directly or add validation

#### D. Authentication Issue
- **Symptom**: Error status 401 (not 400)
- **Solution**: Check if token is valid and not expired
- **Check**: Token in localStorage and JWT_SECRET in backend

### Step 4: Quick Fixes to Try

1. **Restart the backend server**
   ```bash
   cd backend
   npm start
   ```

2. **Check database connection**
   - Verify environment variables are set
   - Test database connection manually

3. **Clear browser cache and localStorage**
   - Open DevTools → Application → Local Storage
   - Clear all items
   - Log in again

4. **Check if user exists in database**
   - The error might occur if the user from the JWT token doesn't exist in the database

## Next Steps

1. **Run the application and check the console logs**
2. **Copy the detailed error message from the console**
3. **Share the error details** so we can identify the specific issue

The enhanced logging should now provide enough information to pinpoint the exact cause of the 400 error.

