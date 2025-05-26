#!/bin/bash

# Gemini Integration Deployment Script
# This script helps deploy the updated Supabase Edge Function with Gemini integration

echo "🚀 ExamForge AI - Gemini Integration Deployment"
echo "================================================"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI found"

# Check if we're in the correct directory
if [ ! -f "supabase/functions/process-document/index.ts" ]; then
    echo "❌ Error: process-document function not found."
    echo "   Please run this script from the project root directory."
    exit 1
fi

echo "✅ Project structure verified"

# Check if logged in to Supabase
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase. Please run:"
    echo "   supabase login"
    exit 1
fi

echo "✅ Supabase authentication verified"

# Deploy the function
echo "📦 Deploying process-document function..."
if supabase functions deploy process-document; then
    echo "✅ Function deployed successfully!"
else
    echo "❌ Function deployment failed. Please check the logs above."
    exit 1
fi

echo ""
echo "🎉 Deployment Complete!"
echo ""
echo "Next Steps:"
echo "1. Set up your Gemini API key in Supabase:"
echo "   - Go to your Supabase project dashboard"
echo "   - Navigate to Settings > Edge Functions"
echo "   - Add environment variable: GEMINI_API_KEY"
echo ""
echo "2. Get your Gemini API key from:"
echo "   https://aistudio.google.com/app/apikey"
echo ""
echo "3. Test the integration by uploading a document!"
echo ""
echo "For detailed setup instructions, see: setup-gemini.md"
