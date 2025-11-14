#!/bin/bash
# Run Zenith Legendary Framework - Complete Orchestration

set -e

echo "🌟 =============================================="
echo "🌟 ZENITH LEGENDARY FRAMEWORK"
echo "🌟 Complete orchestration and verification"
echo "🌟 =============================================="
echo ""

# Check Python version
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.8+"
    exit 1
fi

echo "📦 Installing Python dependencies..."
pip3 install --quiet pyyaml asyncio

echo "🔍 Running legendary verification..."
echo ""

# Run the framework
python3 scripts/zenith_legendary_framework.py

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ =============================================="
    echo "✅ LEGENDARY STATUS VERIFIED"
    echo "✅ =============================================="
    echo ""
    echo "📊 Report available at: zenith_legendary_report.json"
    echo ""

    # Display key metrics
    if command -v jq &> /dev/null; then
        echo "📈 Key Metrics:"
        jq -r '
            "  Tier: \(.tier)",
            "  Health: \(.health)",
            "  Verification: \(if .verification_passed then "✅ PASSED" else "❌ FAILED" end)",
            "  Healing Actions: \(.healing_actions)"
        ' zenith_legendary_report.json
    fi
else
    echo ""
    echo "⚠️  =============================================="
    echo "⚠️  VERIFICATION INCOMPLETE"
    echo "⚠️  =============================================="
    echo ""
    echo "Review report for details: zenith_legendary_report.json"
    exit 1
fi
