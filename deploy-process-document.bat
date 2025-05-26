@echo off
echo ================================
echo 🚀 DEPLOYING OPTIMIZED PROCESS-DOCUMENT
echo ================================
echo.

echo 📋 This script will deploy the optimized process-document function
echo 🔧 Changes: Updated process-document function for direct and storage processing
echo 🎯 Goal: Process 650KB files directly without storage upload/download
echo.

echo ⚠️  Make sure you have:
echo    - Supabase CLI installed and logged in
echo    - GEMINI_API_KEY set in your Supabase secrets
echo    - Current directory is your project root
echo.

set /p confirm="Continue with deployment? (y/n): "
if /i "%confirm%" neq "y" (
    echo ❌ Deployment cancelled.
    pause
    exit /b
)

echo.
echo 🔄 Deploying process-document function...
echo.

npx supabase functions deploy process-document

if %errorlevel% equ 0 (
    echo.
    echo ✅ SUCCESS: Direct processing function deployed!
    echo.    echo 📋 CHANGES DEPLOYED:
    echo    ✅ Updated process-document Edge Function
    echo    ✅ Accepts multipart form data for direct file processing
    echo    ✅ Processes files under 5MB directly (no storage)
    echo    ✅ Falls back to storage for larger files
    echo    ✅ Optimized for 650KB average file size
    echo.
    echo 🧪 TESTING RECOMMENDATIONS:
    echo    1. Upload a small PDF (under 5MB) through the optimized UI
    echo    2. Check the logs for 'DIRECT' processing mode
    echo    3. Verify faster processing times
    echo    4. Test larger files to confirm storage fallback
    echo.
    echo 📊 Expected Results:
    echo    - 50%% faster processing for small files
    echo    - Reduced network transfers
    echo    - Direct processing indicator in UI
    echo    - Same question generation quality
    echo.
) else (
    echo.
    echo ❌ DEPLOYMENT FAILED!
    echo.
    echo 🔧 Troubleshooting:
    echo    1. Check if you're logged into Supabase CLI
    echo    2. Verify you're in the correct project directory
    echo    3. Ensure your Supabase project is properly configured
    echo    4. Check if GEMINI_API_KEY is set in secrets
    echo.
    echo Run 'npx supabase status' to check your connection.
)

echo.
pause