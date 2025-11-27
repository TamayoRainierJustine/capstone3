# PowerShell script to set up AWS deployment branch without affecting main
# Usage: .\setup-aws-deploy-branch.ps1

Write-Host "🚀 Setting up AWS deployment branch..." -ForegroundColor Cyan

# Check if we're in a git repository
if (-not (Test-Path .git)) {
    Write-Host "❌ Error: Not a git repository" -ForegroundColor Red
    exit 1
}

# Check current branch
$currentBranch = git branch --show-current
Write-Host "📍 Current branch: $currentBranch" -ForegroundColor Yellow

# Make sure we're on main and it's up to date
if ($currentBranch -ne "main") {
    Write-Host "⚠️  Warning: Not on main branch. Switching to main..." -ForegroundColor Yellow
    git checkout main
}

Write-Host "📥 Pulling latest changes from main..." -ForegroundColor Cyan
git pull origin main

# Check if aws-deploy branch already exists
$branchExists = git show-ref --verify --quiet refs/heads/aws-deploy
if ($LASTEXITCODE -eq 0) {
    Write-Host "⚠️  aws-deploy branch already exists. Switching to it..." -ForegroundColor Yellow
    git checkout aws-deploy
    Write-Host "🔄 Merging latest changes from main..." -ForegroundColor Cyan
    git merge main -m "Merge latest changes from main"
} else {
    Write-Host "✨ Creating new aws-deploy branch..." -ForegroundColor Green
    git checkout -b aws-deploy
}

# Check if buildspec.yml exists
if (-not (Test-Path buildspec.yml)) {
    Write-Host "📝 buildspec.yml not found. Creating it..." -ForegroundColor Cyan
    $buildspecContent = @"
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
      - ls -la dist/
artifacts:
  files:
    - '**/*'
  base-directory: frontend/dist
  name: react-build-`$(date +%Y-%m-%d)
"@
    $buildspecContent | Out-File -FilePath buildspec.yml -Encoding UTF8
    git add buildspec.yml
    git commit -m "Add buildspec.yml for AWS CodeBuild"
}

Write-Host "📤 Pushing aws-deploy branch to GitHub..." -ForegroundColor Cyan
git push -u origin aws-deploy

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Go to AWS CodePipeline and create a new pipeline"
Write-Host "   2. Set the source branch to 'aws-deploy' (NOT main)"
Write-Host "   3. Follow the guide in AWS_CI_CD_SETUP.md"
Write-Host ""
Write-Host "💡 To deploy changes in the future:" -ForegroundColor Yellow
Write-Host "   git checkout aws-deploy"
Write-Host "   git merge main"
Write-Host "   git push origin aws-deploy"
Write-Host ""

