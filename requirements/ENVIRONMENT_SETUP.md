# Environment Setup Guide

This guide explains how to set up environment variables for the Resume Shortlist Assistant project.

## Environment Variables Required

### 1. Create `.env.local` File

Create a file named `.env.local` in the project root directory:

```bash
# Navigate to project root
cd resume-shortlist-assistant

# Create .env.local file
# Windows PowerShell:
New-Item -Path .env.local -ItemType File

# Or manually create the file in your editor
```

### 2. Add Required Variables

Copy and paste the following into your `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Gemini AI
GOOGLE_GEMINI_API_KEY=your_gemini_api_key
```

## Getting Your API Keys

### Supabase Configuration

1. **Sign up for Supabase**
   - Visit: https://supabase.com
   - Create a free account
   - Create a new project

2. **Get Your Credentials**
   - Go to Project Settings → API
   - Copy the following:
     - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
     - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Example Values:**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Google Gemini AI API Key

1. **Get API Key**
   - Visit: https://ai.google.dev/
   - Click "Get API Key in Google AI Studio"
   - Sign in with your Google account
   - Click "Create API Key"
   - Copy the generated key

2. **Example Value:**
   ```env
   GOOGLE_GEMINI_API_KEY=AIzaSyB1234567890abcdefghijklmnopqrstuv
   ```

## Environment Variable Details

### NEXT_PUBLIC_SUPABASE_URL
- **Type:** Public
- **Purpose:** Supabase project URL for client-side requests
- **Format:** `https://<project-id>.supabase.co`

### NEXT_PUBLIC_SUPABASE_ANON_KEY
- **Type:** Public (safe for client-side)
- **Purpose:** Anonymous key for Supabase authentication
- **Format:** JWT token (long string)
- **Note:** This key is safe to expose on the client side

### GOOGLE_GEMINI_API_KEY
- **Type:** Private (server-side only)
- **Purpose:** Google Gemini AI API authentication
- **Format:** `AIzaSy...` (string starting with AIzaSy)
- **Security:** Never expose in client-side code

## Verifying Your Setup

### 1. Check if `.env.local` exists

```powershell
# Windows PowerShell
Test-Path .env.local
# Should return: True
```

### 2. Verify Environment Variables Load

Create a test file `test-env.js` in the root:

```javascript
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Supabase Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
console.log('Gemini Key exists:', !!process.env.GOOGLE_GEMINI_API_KEY);
```

Run:
```bash
node test-env.js
```

### 3. Start Development Server

```bash
npm run dev
```

If no errors appear, your environment is configured correctly.

## Security Best Practices

### ✅ DO:
- Keep `.env.local` in `.gitignore` (already configured)
- Use different API keys for development and production
- Rotate API keys periodically
- Use environment variables for all sensitive data

### ❌ DON'T:
- Commit `.env.local` to version control
- Share API keys in public repositories
- Hardcode API keys in source code
- Use production keys in development

## Environment Files Hierarchy

Next.js supports multiple environment files:

- `.env` - Default for all environments
- `.env.local` - Local overrides (gitignored)
- `.env.development` - Development only
- `.env.production` - Production only

**Priority:** `.env.local` > `.env.development` > `.env`

## Troubleshooting

### Issue: Environment variables not loading

**Solution:**
1. Restart the development server
2. Verify file is named exactly `.env.local`
3. Check for typos in variable names
4. Ensure no quotes around values (unless value contains spaces)

### Issue: NEXT_PUBLIC variables undefined in client

**Solution:**
- Restart dev server after adding NEXT_PUBLIC_ variables
- Verify variable names start with `NEXT_PUBLIC_`

### Issue: API key invalid

**Solution:**
- Regenerate API keys from respective platforms
- Check for extra spaces or newlines in `.env.local`
- Ensure keys are copied completely

## Additional Configuration (Optional)

### Database Connection String (if using direct Postgres)

```env
DATABASE_URL=postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres
```

### Deployment Environment Variables

For production deployments (Vercel, Netlify, etc.):

1. Add environment variables in deployment platform UI
2. Use the same variable names
3. Use production API keys (not development keys)

## Next Steps

After setting up environment variables:

1. **Setup Database** - Run migrations from `supabase-schema.sql`
2. **Configure Authentication** - See `AUTH_SETUP.md`
3. **Test AI Integration** - See `GEMINI_AI_SETUP.md`
4. **Run Application** - `npm run dev`

## Support

If you encounter issues:
- Check `SUPABASE_SETUP.md` for Supabase-specific issues
- Check `GEMINI_AI_SETUP.md` for AI integration issues
- Refer to [Next.js Environment Variables Docs](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
