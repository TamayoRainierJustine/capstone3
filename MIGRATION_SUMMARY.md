# Migration Summary: Vercel + Supabase Deployment

## ✅ What Has Been Set Up

### 1. Database Migration Files
- ✅ `supabase/migrations/001_initial_schema.sql` - Complete database schema
- ✅ `supabase/migrations/002_migrate_admin_user.sql` - Admin user migration template
- ✅ `backend/scripts/migrate-to-supabase.js` - Data migration script

### 2. Database Configuration
- ✅ `backend/config/db.js` - Updated for PostgreSQL/Supabase
- ✅ Supports SSL connections for production

### 3. Supabase Storage Integration
- ✅ `backend/utils/supabaseStorage.js` - Utility functions for file uploads
- ✅ Functions for upload, delete, and get public URLs

### 4. Vercel API Routes
- ✅ `api/index.js` - Main Express app for Vercel
- ✅ `api/[...path].js` - Catch-all route handler
- ✅ CORS configured for Vercel domains

### 5. Configuration Files
- ✅ `vercel.json` - Vercel deployment configuration
- ✅ `.vercelignore` - Files to exclude from deployment
- ✅ `package.json` - Root package.json with scripts
- ✅ `backend/package.json` - Updated with PostgreSQL and Supabase dependencies

### 6. Documentation
- ✅ `DEPLOYMENT.md` - Complete deployment guide
- ✅ `QUICK_START.md` - Quick start guide
- ✅ `.env.example` - Environment variables template

## ✅ Completed: Frontend API URLs Updated

All frontend files have been updated to use environment variables instead of hardcoded URLs.

**Files updated (14 files):**
- ✅ `frontend/src/pages/LoginPage.jsx`
- ✅ `frontend/src/pages/RegisterPage.jsx`
- ✅ `frontend/src/pages/Dashboard.jsx`
- ✅ `frontend/src/pages/MyStores.jsx`
- ✅ `frontend/src/pages/StoreSetup.jsx`
- ✅ `frontend/src/pages/AddProduct.jsx`
- ✅ `frontend/src/pages/EditProduct.jsx`
- ✅ `frontend/src/pages/Products.jsx`
- ✅ `frontend/src/pages/Orders.jsx`
- ✅ `frontend/src/pages/SalesAnalytics.jsx`
- ✅ `frontend/src/pages/SiteBuilder.jsx`
- ✅ `frontend/src/pages/PublishPage.jsx`
- ✅ `frontend/src/pages/PublishedStore.jsx`
- ✅ `frontend/src/pages/Settings.jsx`

**Utility files created:**
- ✅ `frontend/src/utils/axios.js` - Centralized API client
- ✅ `frontend/src/utils/imageUrl.js` - Image URL helper
- ✅ `frontend/src/config/api.js` - API URL configuration

## ✅ Completed: File Upload Controllers Updated

**Files updated:**
- ✅ `backend/controllers/productController.js` - Now uses Supabase Storage
- ✅ `backend/controllers/storeController.js` - Background upload uses Supabase Storage

**Changes made:**
- ✅ Replaced local file system operations with Supabase Storage
- ✅ Updated multer to use memoryStorage (required for Supabase)
- ✅ Image paths stored as "bucket/filename" format
- ✅ Old images deleted from Supabase when updated/deleted
- ✅ Error handling for Supabase operations

### ✅ Completed: Image URLs Updated

All image references have been updated:
- ✅ Product images use `getImageUrl()` helper
- ✅ Background images use `getImageUrl()` helper
- ✅ All `http://localhost:5000` prefixes removed
- ✅ Supports Supabase Storage URLs, local dev, and production

### 4. Environment Variables Setup

**For Local Development:**
Create `frontend/.env.local`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SUPABASE_URL=https://xxxxx.supabase.co
```

Create `backend/.env`:
```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres
SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=development
```

**For Vercel Deployment:**
Set in Vercel Dashboard → Settings → Environment Variables:
```env
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
JWT_SECRET=...
VITE_API_URL=https://your-project.vercel.app/api
VITE_SUPABASE_URL=https://xxxxx.supabase.co
FRONTEND_URL=https://your-project.vercel.app
NODE_ENV=production
```

### 5. Install Dependencies

Run these commands:
```bash
# Root
npm install

# Backend
cd backend
npm install pg pg-hstore @supabase/supabase-js

# Frontend (no new dependencies needed)
cd ../frontend
npm install
```

### 6. Test Migration Script

Before deploying:
1. Set up Supabase project
2. Run database migration SQL (`supabase/migrations/001_initial_schema.sql`)
3. Test data migration script locally: `npm run migrate:supabase`
4. Verify admin credentials are migrated

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] Set up Supabase project
- [ ] Run database migrations in Supabase
- [ ] Create Storage buckets (products, backgrounds)
- [ ] Set up Storage policies
- [ ] Test data migration script
- [x] Update all frontend API URLs ✅
- [x] Update file upload controllers ✅
- [ ] Install all dependencies
- [ ] Test locally with Supabase

### Deployment
- [ ] Deploy to Vercel
- [ ] Set environment variables in Vercel
- [ ] Test API endpoints
- [ ] Test file uploads
- [ ] Test admin login
- [ ] Test store creation
- [ ] Test product creation with images
- [ ] Verify all features work

### Post-Deployment
- [ ] Monitor error logs
- [ ] Test on mobile devices
- [ ] Verify CORS is working
- [ ] Check file uploads are working
- [ ] Verify database connections
- [ ] Test published stores

## ✅ All Quick Fixes Completed

### ✅ 1. API URL Helper
- Created: `frontend/src/config/api.js`
- Uses environment variables
- Supports development and production

### ✅ 2. Axios Base URL
- Created: `frontend/src/utils/axios.js`
- Centralized API client with automatic token injection
- Error handling for 401 responses
- All files updated to use `apiClient`

### ✅ 3. Image URL Helper
- Created: `frontend/src/utils/imageUrl.js`
- Handles Supabase Storage URLs
- Handles local development URLs
- Handles relative paths
- All image URLs updated to use `getImageUrl()`

## 🚀 Next Steps

1. **Set Up Supabase** (Priority 1) ✅ IN PROGRESS
   - ✅ Project created: https://xxtbvhnrbhchgzsguaxe.supabase.co
   - ⏳ Get Service Role Key from dashboard
   - ⏳ Run migration SQL (`supabase/migrations/001_initial_schema.sql`)
   - ⏳ Create storage buckets (products, backgrounds)
   - ⏳ Set up storage policies
   - ✅ Credentials received (URL, anon key, connection string)
   
   **See `SETUP_INSTRUCTIONS.md` for detailed steps!**

2. **Install Dependencies** (Priority 2) ⏳
   - Run `npm install` in root
   - Run `npm install` in backend (installs pg, @supabase/supabase-js)
   - Run `npm install` in frontend

3. **Test Locally** (Priority 3) ⏳
   - Set up `.env` files with Supabase credentials
   - Test database connection
   - Test file uploads to Supabase Storage
   - Test all API endpoints
   - Test frontend with new API URLs

4. **Migrate Data** (Priority 4) ⏳
   - Run migration script: `npm run migrate:supabase`
   - Verify admin credentials are migrated
   - Verify all data is migrated correctly

5. **Deploy to Vercel** (Priority 5) ⏳
   - Follow QUICK_START.md
   - Set environment variables in Vercel
   - Deploy and test

## 📝 Notes

- ✅ All frontend API URLs updated to use environment variables
- ✅ All file uploads now use Supabase Storage
- ✅ Image URLs automatically handled by `getImageUrl()` helper
- ✅ The migration script preserves all data including admin credentials
- ✅ Supabase Storage is free up to 1GB (sufficient for most use cases)
- ✅ Vercel free tier includes 100GB bandwidth/month
- ⚠️ All environment variables must be set in Vercel dashboard
- ✅ CORS is configured to allow Vercel domains automatically
- ✅ Multer configured to use memoryStorage (required for Supabase)
- ✅ File paths stored as "bucket/filename" format for easy identification

## 🆘 Troubleshooting

If you encounter issues:
1. Check Vercel deployment logs
2. Verify environment variables are set
3. Check Supabase logs
4. Test API endpoints directly
5. Verify CORS settings
6. Check browser console for errors

## 📞 Support

For detailed instructions, see:
- `DEPLOYMENT.md` - Complete deployment guide
- `QUICK_START.md` - Quick start guide

