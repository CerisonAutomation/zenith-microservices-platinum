#!/bin/bash

# ====================================
# ZENITH PLATFORM - QUICK INSTALL
# ====================================
# This script sets up everything you need in 5 minutes

set -e  # Exit on error

echo "🚀 ZENITH PLATFORM - QUICK INSTALL"
echo "===================================="
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+ first."
    echo "   Download from: https://nodejs.org"
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    echo "⚠️  pnpm not found. Installing pnpm..."
    npm install -g pnpm
fi

if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker not found (needed for local Supabase)"
    echo "   You can skip local database and use Supabase Cloud"
    echo "   Download Docker from: https://docker.com"
fi

echo "✅ Prerequisites OK"
echo ""

# Clone or navigate to repository
echo "📦 Setting up project..."

if [ ! -f "package.json" ]; then
    echo "⚠️  Not in project directory. Please run this from the zenith project folder."
    exit 1
fi

# Install dependencies
echo "📥 Installing dependencies..."
pnpm install

echo "✅ Dependencies installed"
echo ""

# Check for .env.local
if [ ! -f ".env.local" ]; then
    echo "⚙️  Creating .env.local from template..."
    if [ -f ".env.example" ]; then
        cp .env.example .env.local
        echo "✅ .env.local created"
        echo ""
        echo "⚠️  IMPORTANT: Edit .env.local and add your API keys!"
        echo "   See ENVIRONMENT_VARIABLES_UPDATE.md for instructions"
        echo ""
    else
        echo "❌ .env.example not found"
    fi
fi

# Ask about Supabase setup
echo "🗄️  Database Setup"
echo ""
read -p "Do you want to start local Supabase database? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v docker &> /dev/null; then
        echo "🐳 Starting Supabase..."
        pnpm db:start || echo "⚠️  Supabase start failed. You may need to install Supabase CLI first."

        echo "🔄 Running migrations..."
        pnpm db:migrate || echo "⚠️  Migration failed. Run 'pnpm db:migrate' later."
    else
        echo "❌ Docker not found. Please install Docker first."
    fi
else
    echo "⏭️  Skipping local database setup"
    echo "   You can use Supabase Cloud instead"
    echo "   Sign up at: https://supabase.com"
fi

echo ""
echo "✅ INSTALLATION COMPLETE!"
echo ""
echo "📚 Next Steps:"
echo ""
echo "1. Edit .env.local and add your API keys"
echo "   See: ENVIRONMENT_VARIABLES_UPDATE.md"
echo ""
echo "2. Get API keys from:"
echo "   • Supabase: https://supabase.com (FREE)"
echo "   • Stripe: https://stripe.com (FREE test mode)"
echo "   • Google Gemini: https://ai.google.dev (FREE)"
echo "   • Daily.co: https://daily.co (FREE 10K min/month)"
echo "   • Giphy: https://developers.giphy.com (FREE)"
echo ""
echo "3. Start development server:"
echo "   pnpm dev"
echo ""
echo "4. Open: http://localhost:3000"
echo ""
echo "📖 Documentation:"
echo "   • Quick Start: README.md"
echo "   • Complete Guide: ZENITH_COMPLETE_GUIDE.md"
echo "   • Quick Reference: QUICK_REFERENCE.md"
echo ""
echo "🎉 Happy building!"
