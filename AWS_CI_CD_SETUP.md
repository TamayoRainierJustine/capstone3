# AWS CI/CD Setup Guide - Without Affecting Main Branch

This guide shows you how to set up AWS CodePipeline for your React app **without affecting your main branch**.

## Strategy: Use a Separate Deployment Branch

We'll create a dedicated `aws-deploy` branch that:
- ✅ Keeps your `main` branch completely untouched
- ✅ Only contains deployment-specific files
- ✅ Automatically syncs with `main` when you're ready to deploy
- ✅ Can be deleted/recreated anytime without affecting production

---

## Step 1: Create a Deployment Branch

```bash
# Make sure you're on main and it's up to date
git checkout main
git pull origin main

# Create a new branch for AWS deployment
git checkout -b aws-deploy

# Push the branch to GitHub
git push -u origin aws-deploy
```

**Why this works:** CodePipeline will watch the `aws-deploy` branch, so changes to `main` won't trigger deployments.

---

## Step 2: Create Buildspec File (Only in aws-deploy branch)

Create `buildspec.yml` in the **root** of your project:

```yaml
version: 0.2

phases:
  pre_build:
    commands:
      - echo "Installing dependencies..."
      - cd frontend
      - npm ci
  build:
    commands:
      - echo "Building React app..."
      - npm run build
      - echo "Build completed successfully"
  post_build:
    commands:
      - echo "Build artifacts ready in frontend/dist"
artifacts:
  files:
    - '**/*'
  base-directory: frontend/dist
  name: react-build-$(date +%Y-%m-%d)
```

**Note:** This file will only exist in the `aws-deploy` branch, not in `main`.

---

## Step 3: Create S3 Bucket for Static Hosting

1. Go to **AWS S3 Console** → **Create bucket**
2. **Bucket name:** `structura-frontend-deploy` (or your preferred name)
3. **Region:** Choose closest to your users
4. **Uncheck** "Block all public access" (for static website hosting)
5. **Enable static website hosting:**
   - Go to **Properties** → **Static website hosting**
   - Enable it
   - Index document: `index.html`
   - Error document: `index.html` (for React Router)
6. **Bucket Policy** (for public read access):
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::structura-frontend-deploy/*"
       }
     ]
   }
   ```
7. **CORS Configuration** (if needed):
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "HEAD"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": []
     }
   ]
   ```

---

## Step 4: Create IAM Role for CodePipeline

1. Go to **IAM** → **Roles** → **Create Role**
2. **Trusted entity:** AWS service → **CodePipeline**
3. **Attach policies:**
   - `AmazonS3FullAccess`
   - `AWSCodeBuildAdminAccess`
   - `CloudWatchLogsFullAccess`
4. **Role name:** `CodePipelineServiceRole`
5. Click **Create Role**

---

## Step 5: Create CodeBuild Project

1. Go to **AWS CodeBuild** → **Create Build Project**
2. **Project name:** `structura-react-build`
3. **Source:**
   - Source provider: **GitHub**
   - Connect to GitHub (authorize if needed)
   - Repository: Select your repository
   - **Branch:** `aws-deploy` ⚠️ **Important: Use aws-deploy, not main**
4. **Environment:**
   - Managed image: **Ubuntu**
   - Runtime: **Standard**
   - Image: `aws/codebuild/standard:7.0`
   - Environment type: **Linux**
   - Compute: **1 GB memory, 1 vCPU**
5. **Buildspec:**
   - Buildspec name: `buildspec.yml`
6. **Artifacts:**
   - Type: **S3**
   - Bucket: Your S3 bucket name
   - Name: `build-artifacts`
   - Path: Leave empty
7. Click **Create Build Project**

---

## Step 6: Create CodePipeline

1. Go to **AWS CodePipeline** → **Create Pipeline**
2. **Pipeline name:** `structura-deployment-pipeline`
3. **Service role:** Select `CodePipelineServiceRole`
4. **Source stage:**
   - Source provider: **GitHub (Version 2)**
   - Connect to GitHub
   - Repository: Your repository
   - **Branch:** `aws-deploy` ⚠️ **Important: Use aws-deploy, not main**
   - Detection options: **GitHub webhooks**
5. **Build stage:**
   - Build provider: **AWS CodeBuild**
   - Project name: `structura-react-build`
6. **Deploy stage:**
   - Deploy provider: **Amazon S3**
   - Region: Your bucket region
   - Bucket: Your S3 bucket name
   - **Extract file before deploy:** ✅ Check this
   - **Object key:** Leave empty (deploys to root)
7. Click **Create Pipeline**

---

## Step 7: Sync aws-deploy Branch with Main (When Ready to Deploy)

When you want to deploy changes from `main`:

```bash
# Switch to aws-deploy branch
git checkout aws-deploy

# Merge latest changes from main
git merge main

# Push to trigger deployment
git push origin aws-deploy
```

**This triggers CodePipeline automatically!**

---

## Step 8: Workflow Summary

### Daily Development (Main Branch)
```bash
# Work on main branch normally
git checkout main
# ... make changes ...
git add .
git commit -m "New feature"
git push origin main
# ✅ Main branch is unaffected by AWS deployment
```

### When Ready to Deploy
```bash
# Sync aws-deploy with main
git checkout aws-deploy
git merge main
git push origin aws-deploy
# ✅ CodePipeline automatically builds and deploys
```

### View Deployment
- **S3 Static Website URL:** `http://structura-frontend-deploy.s3-website-<region>.amazonaws.com`
- **Or use CloudFront** for custom domain (optional)

---

## Step 9: Optional - Custom Domain with CloudFront

1. **Create CloudFront Distribution:**
   - Origin: Your S3 bucket static website endpoint
   - Viewer protocol: **Redirect HTTP to HTTPS**
   - Default root object: `index.html`
   - Error pages: Add custom error response for 403/404 → 200 → `/index.html`

2. **Add Custom Domain:**
   - Request SSL certificate in **AWS Certificate Manager**
   - Add alternate domain name in CloudFront
   - Update DNS records

---

## Step 10: Clean Up (If Needed)

To remove AWS resources without affecting your code:

```bash
# Delete the aws-deploy branch (optional)
git checkout main
git branch -D aws-deploy
git push origin --delete aws-deploy

# Delete AWS resources:
# - CodePipeline
# - CodeBuild project
# - S3 bucket
# - IAM roles
```

**Your main branch remains completely untouched!**

---

## Troubleshooting

### Build Fails
- Check **CodeBuild logs** in CloudWatch
- Verify `buildspec.yml` paths match your project structure
- Ensure Node.js version is correct in buildspec

### Deployment Not Triggering
- Verify branch is set to `aws-deploy` in CodePipeline
- Check GitHub webhook is connected
- Manually trigger pipeline: **Release change**

### S3 Website Not Loading
- Verify bucket policy allows public read
- Check static website hosting is enabled
- Ensure `index.html` exists in bucket root

---

## Benefits of This Approach

✅ **Main branch stays clean** - No deployment files in production code  
✅ **Safe experimentation** - Test AWS setup without affecting main  
✅ **Easy rollback** - Just delete `aws-deploy` branch  
✅ **Selective deployment** - Deploy only when you merge from main  
✅ **No conflicts** - Main branch developers never see AWS config  

---

## Next Steps

1. Create the `aws-deploy` branch
2. Add `buildspec.yml` to that branch only
3. Set up AWS resources following steps above
4. Test deployment by merging main → aws-deploy
5. Share your S3 URL and screenshots for the assignment!

