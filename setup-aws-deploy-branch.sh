#!/bin/bash

# Script to set up AWS deployment branch without affecting main
# Usage: bash setup-aws-deploy-branch.sh

echo "🚀 Setting up AWS deployment branch..."

# Check if we're in a git repository
if [ ! -d .git ]; then
    echo "❌ Error: Not a git repository"
    exit 1
fi

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"

# Make sure we're on main and it's up to date
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "⚠️  Warning: Not on main branch. Switching to main..."
    git checkout main
fi

echo "📥 Pulling latest changes from main..."
git pull origin main

# Check if aws-deploy branch already exists
if git show-ref --verify --quiet refs/heads/aws-deploy; then
    echo "⚠️  aws-deploy branch already exists. Switching to it..."
    git checkout aws-deploy
    echo "🔄 Merging latest changes from main..."
    git merge main -m "Merge latest changes from main"
else
    echo "✨ Creating new aws-deploy branch..."
    git checkout -b aws-deploy
fi

# Check if buildspec.yml exists
if [ ! -f buildspec.yml ]; then
    echo "📝 buildspec.yml not found. Creating it..."
    # The buildspec.yml should already be created, but if not, create it
    cat > buildspec.yml << 'EOF'
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
  name: react-build-$(date +%Y-%m-%d)
EOF
    git add buildspec.yml
    git commit -m "Add buildspec.yml for AWS CodeBuild"
fi

echo "📤 Pushing aws-deploy branch to GitHub..."
git push -u origin aws-deploy

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Go to AWS CodePipeline and create a new pipeline"
echo "   2. Set the source branch to 'aws-deploy' (NOT main)"
echo "   3. Follow the guide in AWS_CI_CD_SETUP.md"
echo ""
echo "💡 To deploy changes in the future:"
echo "   git checkout aws-deploy"
echo "   git merge main"
echo "   git push origin aws-deploy"
echo ""

