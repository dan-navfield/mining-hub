#!/bin/bash

# Mining Hub - Local Build Test Script
# This script tests the build process locally before deployment

set -e

echo "🚀 Mining Hub - Testing Build Process"
echo "======================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
npm run clean
rm -rf apps/web/.next
rm -rf apps/api/dist

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Lint the code
echo "🔍 Linting code..."
npm run lint

# Type check
echo "🔧 Type checking..."
cd apps/web && npm run type-check && cd ../..

# Build the applications
echo "🏗️  Building applications..."
npm run build

# Check if builds were successful
if [ -d "apps/web/.next" ]; then
    echo "✅ Web app build successful"
else
    echo "❌ Web app build failed"
    exit 1
fi

if [ -d "apps/api/dist" ]; then
    echo "✅ API build successful"
else
    echo "❌ API build failed"
    exit 1
fi

echo ""
echo "🎉 Build test completed successfully!"
echo ""
echo "Next steps:"
echo "1. Commit and push your changes to GitHub"
echo "2. Import the repository to Vercel"
echo "3. Configure environment variables in Vercel dashboard"
echo "4. Deploy to production"
echo ""
echo "📚 See DEPLOYMENT.md for detailed instructions"
