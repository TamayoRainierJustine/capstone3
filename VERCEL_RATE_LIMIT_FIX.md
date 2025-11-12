# Fix Vercel Deployment Rate Limit (Free Tier)

## Problem
Vercel free tier has deployment rate limits:
- **100 deployments per day** (across all projects)
- **Rate limit resets after ~2 hours** when exceeded

## Solutions (No Payment Required)

### Solution 1: Disable Auto-Deploy for Preview Branches
1. Go to your Vercel project dashboard
2. Click **Settings** → **Git**
3. Under **Production Branch**, keep auto-deploy ON for `main` branch
4. Under **Preview Deployments**, **DISABLE** auto-deploy for all branches
5. This way, only pushes to `main` will deploy automatically

### Solution 2: Batch Your Commits
Instead of pushing after every small change:
```bash
# Make all your changes locally
# Then commit and push once:
git add .
git commit -m "Multiple fixes: social share, shipping fee, order optimization"
git push
```

### Solution 3: Use Git Workflow to Reduce Deployments
1. Work on a feature branch locally
2. Make multiple commits on the branch
3. When ready, merge to main (one deployment)
```bash
# Work on feature branch
git checkout -b feature/fixes
# Make changes, commit multiple times
git add .
git commit -m "Fix 1"
git add .
git commit -m "Fix 2"
# When done, merge to main
git checkout main
git merge feature/fixes
git push  # Only ONE deployment
```

### Solution 4: Wait and Deploy Manually
1. Wait 2 hours for rate limit to reset
2. Go to Vercel dashboard
3. Click **Deployments** tab
4. Find the latest commit
5. Click **Redeploy** button

### Solution 5: Check for Unnecessary Deployments
- Review your deployment history in Vercel
- Cancel any failed/in-progress deployments
- Delete old preview deployments you don't need

## Recommended Approach
**Best practice for free tier:**
1. ✅ Keep auto-deploy ON for `main` branch only
2. ✅ Disable preview deployments
3. ✅ Batch commits before pushing
4. ✅ Test locally before pushing to main

## Alternative: Use Different Git Account (Temporary)
If you have another GitHub account:
1. Add it as a collaborator to your repo
2. Deploy from that account (separate rate limit)
3. **Note:** This is a workaround, not a permanent solution

## Long-term Solution
If you need more deployments:
- Vercel Pro: $20/month (unlimited deployments)
- Or use alternative hosting (Netlify, Render, Railway) with separate limits

