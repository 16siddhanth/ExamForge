# 🔑 GEMINI API KEY SETUP GUIDE

## 📍 WHERE TO PUT YOUR GEMINI API KEY

### Option 1: Supabase Dashboard (RECOMMENDED)

This is the easiest and most secure method:

1. **Go to your Supabase Project Dashboard**
   - Visit: https://supabase.com/dashboard/projects
   - Select your ExamForge project

2. **Navigate to Edge Functions Settings**
   - Click on "Settings" in the left sidebar
   - Click on "Edge Functions"
   - Or go directly to: `https://supabase.com/dashboard/project/[your-project-id]/settings/functions`

3. **Add Environment Variable**
   - Look for "Environment Variables" section
   - Click "Add new variable" or "Create a new secret"
   - **Key**: `GEMINI_API_KEY`
   - **Value**: `[paste your actual API key here]`
   - Click "Save"

4. **Redeploy the Function** (if already deployed)
   ```bash
   npx supabase functions deploy process-document
   ```

### Option 2: Local Development (.env file)

For local testing only (NOT for production):

1. **Create a `.env.local` file** in your project root:
   ```bash
   cd "C:\Users\91702\Desktop\6th sem projects\Devops+Weblab\Examforge-ai-prep"
   echo GEMINI_API_KEY=your_actual_api_key_here > .env.local
   ```

2. **Add to .gitignore** (make sure this line exists):
   ```
   .env.local
   .env
   ```

### Option 3: Supabase CLI (For advanced users)

```bash
npx supabase secrets set GEMINI_API_KEY=your_actual_api_key_here
```

## 🔧 UPDATED INTEGRATION DETAILS

### ✅ Model Updated
- **OLD**: `gemini-2.0-flash-exp`
- **NEW**: `gemini-2.0-flash` (as you requested)

### ✅ Question Generation Strategy
The system now:
1. **Generates various question types** internally (MCQ, short answer, essay)
2. **Converts all to MCQ format** for the quiz system
3. **Maintains educational quality** across different cognitive levels
4. **Ensures quiz compatibility** by standardizing to multiple-choice

### ✅ API Endpoint
The integration uses the correct Google Generative AI library which handles the endpoint:
- Base URL: `https://generativelanguage.googleapis.com/v1beta/models/`
- Model: `gemini-2.0-flash`
- The library automatically constructs the full endpoint

## 🚀 STEP-BY-STEP SETUP

### Step 1: Get Your API Key
If you don't have one yet:
1. Go to: https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key (starts with `AIza...`)

### Step 2: Add to Supabase
1. Supabase Dashboard → Your Project → Settings → Edge Functions
2. Add variable: `GEMINI_API_KEY` = `your_key_here`
3. Save

### Step 3: Deploy Function
```bash
cd "C:\Users\91702\Desktop\6th sem projects\Devops+Weblab\Examforge-ai-prep"
npx supabase functions deploy process-document
```

### Step 4: Test
1. Upload a document in your app
2. Check if questions are generated
3. Verify they appear in the subject detail page

## 🔍 VERIFICATION

### Check if API Key is Set:
1. Go to Supabase Dashboard
2. Settings → Edge Functions
3. Look for `GEMINI_API_KEY` in environment variables

### Test the Integration:
1. Upload a PDF/document
2. Wait for processing
3. Check generated questions in subject detail
4. Verify questions have:
   - ✅ 4 multiple choice options
   - ✅ Correct answer marked
   - ✅ Detailed explanations
   - ✅ Difficulty levels

## 🚨 SECURITY NOTES

### ✅ DO:
- Store API key in Supabase environment variables
- Use the Supabase dashboard method
- Keep your API key secret

### ❌ DON'T:
- Put API key in your code files
- Commit API key to Git
- Share your API key publicly
- Store in client-side code

## 🔧 TROUBLESHOOTING

### If Questions Aren't Generated:
1. **Check API Key**: Verify it's set in Supabase
2. **Check Logs**: Go to Supabase Dashboard → Edge Functions → Logs
3. **Verify Quota**: Check your Google AI Studio quota
4. **Test API Key**: Try it at https://aistudio.google.com/

### Common Error Messages:
- `"GEMINI_API_KEY not found"` → API key not set in Supabase
- `"Invalid API key"` → Wrong or expired API key
- `"Quota exceeded"` → Need to increase Google AI quota

## 📞 NEXT STEPS

1. **Add your API key** to Supabase Dashboard
2. **Deploy the updated function**:
   ```bash
   npx supabase functions deploy process-document
   ```
3. **Test with a document upload**
4. **Verify questions are generated with MCQ format**

Your API key should be added to **Supabase Dashboard → Settings → Edge Functions → Environment Variables** with the key name `GEMINI_API_KEY`. This is the most secure and recommended method! 🔐
