# Deploying to Bolt.new - Setup Guide

## Issue
Build error: `Module not found: Can't resolve 'openai'`

## Solution

### Step 1: Install Dependencies
After importing the project to bolt.new, run:
```bash
npm install
```

This will install all required packages including:
- `openai` (v6.8.1) - OpenAI API client
- `@supabase/supabase-js` - Supabase client
- All other dependencies from package.json

### Step 2: Configure Environment Variables
In bolt.new, set up these environment variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://yfljhsgwbclprbsteqox.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
```

### Step 3: Build the Project
```bash
npm run build
```

### Step 4: Start the Server
```bash
npm start
```

## Common Issues

### 1. Module not found: 'openai'
**Cause:** Dependencies not installed
**Fix:** Run `npm install`

### 2. Unauthorized errors
**Cause:** Missing environment variables
**Fix:** Add all env vars listed above

### 3. Database functions missing
**Cause:** Supabase migration not applied
**Fix:** 
1. Go to Supabase Dashboard → SQL Editor
2. Run migration: `supabase/migrations/20251107120000_create_api_usage_logs.sql`

### 4. PDF parsing errors
**Cause:** Optional - pdf-parse may fail in some environments
**Effect:** AI shortlist still works, just logs warnings

## Verification Steps

After setup, verify these work:
1. ✅ App loads at the URL
2. ✅ Login/signup works
3. ✅ Can view job listings
4. ✅ Can upload candidates
5. ✅ AI Shortlist button works
6. ✅ API usage tracking shows data

## Production Considerations

For production deployment:
- Use production-ready Supabase instance
- Rotate API keys regularly
- Set up proper error monitoring
- Enable HTTPS
- Configure CORS if needed

## Files Changed
- ✅ Removed `@google/generative-ai` dependency
- ✅ Renamed `gemini.ts` to `openai.ts`
- ✅ Updated all imports
- ✅ Cleaned up documentation files
