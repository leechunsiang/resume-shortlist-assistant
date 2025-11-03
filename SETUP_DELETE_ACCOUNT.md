# Quick Setup: Delete Account Feature

## Error: "Failed to delete user account"

This error occurs because the `SUPABASE_SERVICE_ROLE_KEY` environment variable is not configured.

## How to Fix (5 minutes):

### Step 1: Get Your Service Role Key

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **Settings** (gear icon in sidebar)
4. Click **API** 
5. Scroll down to **Project API keys**
6. Find the **`service_role`** key (NOT the anon key)
7. Click the eye icon to reveal it
8. Copy the entire key

### Step 2: Add to Environment File

1. In your project root, create or open `.env.local`
2. Add this line (replace with your actual key):

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your_actual_key_here
```

### Step 3: Restart Dev Server

1. Stop the dev server (Ctrl+C in terminal)
2. Restart it:

```bash
npm run dev
```

### Step 4: Test

1. Go to Settings page
2. Try to delete account again
3. It should work now!

## Security Notes

⚠️ **NEVER** commit the service role key to Git!
- Make sure `.env.local` is in your `.gitignore`
- The service role key has full admin access
- Only use it server-side (never in client code)

## Troubleshooting

### Still getting errors?

1. **Check spelling**: Make sure the variable name is exactly `SUPABASE_SERVICE_ROLE_KEY`
2. **Check quotes**: No quotes around the value in `.env.local`
3. **Check restart**: Must restart dev server after adding env vars
4. **Check file location**: `.env.local` must be in the project root (same folder as `package.json`)

### Get the wrong key?

Make sure you copied the **service_role** key, not:
- ❌ anon key (public key)
- ❌ JWT secret
- ✅ service_role key (should start with `eyJ...`)

## Alternative: Disable Delete Account Feature

If you don't want to set up the service role key right now, you can temporarily disable the delete account button:

In `src/app/settings/page.tsx`, comment out the delete button section (lines ~154-163).
