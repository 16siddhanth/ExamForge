# Gemini Integration Deployment Script for Windows
# This script helps deploy the updated Supabase Edge Function with Gemini integration

Write-Host "🚀 ExamForge AI - Gemini Integration Deployment" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Check if Supabase CLI is installed
try {
    $null = Get-Command supabase -ErrorAction Stop
    Write-Host "✅ Supabase CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI is not installed. Please install it first:" -ForegroundColor Red
    Write-Host "   npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Check if we're in the correct directory
if (-not (Test-Path "supabase\functions\process-document\index.ts")) {
    Write-Host "❌ Error: process-document function not found." -ForegroundColor Red
    Write-Host "   Please run this script from the project root directory." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Project structure verified" -ForegroundColor Green

# Check if logged in to Supabase
try {
    $null = supabase projects list 2>$null
    Write-Host "✅ Supabase authentication verified" -ForegroundColor Green
} catch {
    Write-Host "❌ Not logged in to Supabase. Please run:" -ForegroundColor Red
    Write-Host "   supabase login" -ForegroundColor Yellow
    exit 1
}

# Deploy the function
Write-Host "📦 Deploying process-document function..." -ForegroundColor Blue
try {
    supabase functions deploy process-document
    Write-Host "✅ Function deployed successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Function deployment failed. Please check the logs above." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Set up your Gemini API key in Supabase:" -ForegroundColor White
Write-Host "   - Go to your Supabase project dashboard" -ForegroundColor Gray
Write-Host "   - Navigate to Settings > Edge Functions" -ForegroundColor Gray
Write-Host "   - Add environment variable: GEMINI_API_KEY" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Get your Gemini API key from:" -ForegroundColor White
Write-Host "   https://aistudio.google.com/app/apikey" -ForegroundColor Blue
Write-Host ""
Write-Host "3. Test the integration by uploading a document!" -ForegroundColor White
Write-Host ""
Write-Host "For detailed setup instructions, see: setup-gemini.md" -ForegroundColor Yellow
