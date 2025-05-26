@echo off
echo.
echo 🚀 ExamForge AI - Gemini Integration Deployment
echo ================================================
echo.

REM Check if Supabase CLI is available
npx supabase --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Supabase CLI is not available. Installing...
    npm install -g supabase
    if %errorlevel% neq 0 (
        echo ❌ Failed to install Supabase CLI. Please install manually.
        echo    Run: npm install -g supabase
        pause
        exit /b 1
    )
)

echo ✅ Supabase CLI found

REM Check if we're in the correct directory
if not exist "supabase\functions\process-document\index.ts" (
    echo ❌ Error: process-document function not found.
    echo    Please run this script from the project root directory.
    pause
    exit /b 1
)

echo ✅ Project structure verified

REM Deploy the function
echo.
echo 📦 Deploying process-document function with Gemini-2.0-Flash integration...
echo.
npx supabase functions deploy process-document
if %errorlevel% neq 0 (
    echo.
    echo ❌ Function deployment failed. 
    echo.
    echo Possible issues:
    echo 1. Not logged into Supabase - Run: npx supabase login
    echo 2. No internet connection
    echo 3. Project not linked - Run: npx supabase link
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ Function deployed successfully!
echo.
echo 🎉 Deployment Complete!
echo.
echo Next Steps:
echo 1. Set up your Gemini API key in Supabase:
echo    - Go to your Supabase project dashboard
echo    - Navigate to Settings ^> Edge Functions
echo    - Add environment variable: GEMINI_API_KEY
echo.
echo 2. Get your Gemini API key from:
echo    https://aistudio.google.com/app/apikey
echo.
echo 3. Test the integration by uploading a document!
echo.
echo For detailed setup instructions, see: API-KEY-SETUP.md
echo.
pause
