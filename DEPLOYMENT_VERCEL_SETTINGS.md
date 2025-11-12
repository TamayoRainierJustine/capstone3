# Vercel Deployment Settings

## Important: Configure These Settings in Vercel Dashboard

When setting up your project in Vercel, make sure to configure these settings:

### Project Settings (Vercel Dashboard)

1. **Root Directory**: Leave as **root** (empty/default)
   - Do NOT set it to `frontend`
   - This is important because your API routes are in `/api` at the root

2. **Framework Preset**: Vite

3. **Build Command**: `cd frontend && npm install && npm run build`
   - Or leave it to use `vercel.json` configuration

4. **Output Directory**: `frontend/dist`

5. **Install Command**: `cd frontend && npm install`
   - Or leave it to use `vercel.json` configuration

### Alternative: Set Root Directory to `frontend`

If you want to set Root Directory to `frontend` in Vercel dashboard:

1. Go to Project Settings → General
2. Set **Root Directory** to `frontend`
3. Update `vercel.json`:
   ```json
   {
     "version": 2,
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "installCommand": "npm install"
   }
   ```

   **BUT**: This will break API routes unless you move them inside the `frontend` folder.

### Recommended: Keep Root as Repository Root

Keep the Root Directory as the repository root and use the current `vercel.json` configuration.

