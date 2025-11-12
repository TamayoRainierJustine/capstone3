# Vercel Setup Instructions

## The Problem
Vercel can't find the `frontend` directory when running `cd frontend`. This is a common issue with monorepos.

## Solution: Configure in Vercel Dashboard

### Step 1: Go to Vercel Project Settings

1. Go to your project in Vercel dashboard
2. Click **Settings** → **General**

### Step 2: Configure Build Settings

**Option A: Set Root Directory to `frontend` (Simpler, but breaks API routes)**

1. Set **Root Directory** to: `frontend`
2. Set **Framework Preset** to: `Vite`
3. Set **Build Command** to: `npm run build` (or leave empty for auto-detect)
4. Set **Output Directory** to: `dist`
5. Set **Install Command** to: `npm install` (or leave empty for auto-detect)

**⚠️ WARNING**: This will break your API routes because they're in `/api` at the root, not in `frontend`.

**Option B: Keep Root as Repository Root (Recommended)**

1. Set **Root Directory** to: (leave empty - repository root)
2. Set **Framework Preset** to: `Other`
3. Set **Build Command** to: `cd frontend && npm install && npm run build`
4. Set **Output Directory** to: `frontend/dist`
5. Set **Install Command** to: `cd frontend && npm install`

### Step 3: If Option B Still Doesn't Work

If `cd frontend` still doesn't work, try this:

**Set Build Command to:**
```bash
sh -c "cd frontend && npm install && npm run build"
```

**Set Install Command to:**
```bash
sh -c "cd frontend && npm install"
```

Or use the root package.json script:
- **Build Command**: `npm run build` (uses root package.json which does `cd frontend && npm run build`)
- **Install Command**: `cd frontend && npm install` or `npm install --prefix frontend`

## Alternative: Update package.json Scripts

We can also add a script to the root `package.json` that Vercel can use more easily.

