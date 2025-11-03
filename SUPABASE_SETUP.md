# Supabase Setup Instructions

Follow these steps to set up Supabase for your Resume Shortlist Assistant:

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in:
   - **Project Name**: Resume Shortlist Assistant
   - **Database Password**: Choose a strong password
   - **Region**: Select closest to your location
5. Click "Create new project" and wait for setup to complete

## 2. Get Your API Keys

1. In your Supabase project dashboard, click on the **Settings** icon (gear) in the sidebar
2. Go to **API** section
3. You'll find:
   - **Project URL**: Copy this value
   - **Project API keys** → **anon/public**: Copy this value

## 3. Configure Environment Variables

1. Open `.env.local` in your project root
2. Replace the placeholder values:

```env
NEXT_PUBLIC_SUPABASE_URL=your_actual_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key
```

**Example:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmno.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 4. Run the Database Schema

1. In your Supabase dashboard, click on **SQL Editor** in the sidebar
2. Click **New Query**
3. Open the file `supabase-schema.sql` in your project
4. Copy **ALL** the SQL code
5. Paste it into the Supabase SQL Editor
6. Click **Run** (or press Ctrl+Enter)
7. Wait for completion - you should see "Success. No rows returned"

## 5. Verify Database Setup

1. In Supabase dashboard, go to **Table Editor**
2. You should see these tables:
   - `job_listings` (with 3 sample jobs)
   - `candidates` (with 5 sample candidates)
   - `job_applications`
   - `filters`
   - `activity_log`

3. Click on `candidates` table to see sample data

## 6. Test the Connection

1. Restart your Next.js dev server:
   ```bash
   npm run dev
   ```

2. Open your browser to `http://localhost:3000`
3. Check the browser console for any errors

## Database Schema Overview

### Tables Created:

- **job_listings**: Store job postings
- **candidates**: Store candidate information and resumes
- **job_applications**: Link candidates to specific jobs with match scores
- **filters**: Save custom search/filter criteria
- **activity_log**: Track all actions in the system

### Sample Data Included:

✅ 3 Job listings (Senior Developer, Product Manager, UX Designer)
✅ 5 Candidates with scores and statuses
✅ Dashboard statistics view

## Next Steps

Once Supabase is connected, you can:

1. Fetch real data from the database
2. Display candidates dynamically on the dashboard
3. Add file upload functionality for resumes
4. Implement AI-powered resume analysis
5. Create filtering and search features

## Troubleshooting

### Error: "Missing Supabase environment variables"
- Make sure `.env.local` exists in project root
- Verify the keys are correctly copied (no extra spaces)
- Restart the dev server after updating `.env.local`

### Error: "Failed to fetch"
- Check that your Supabase project URL is correct
- Verify your anon key is the public/anon key (not service role)
- Check if Row Level Security policies are enabled

### Tables not showing up
- Make sure you ran the entire SQL script
- Check the SQL Editor for any error messages
- Try running the script in smaller sections

## Security Notes

⚠️ **Important:**
- Never commit `.env.local` to version control (it's in `.gitignore`)
- The anon/public key is safe to use in client-side code
- Keep your service role key secret (not used in this setup)
- Row Level Security is enabled but currently allows all operations
- Configure proper RLS policies before deploying to production

## Support

For issues with Supabase:
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord Community](https://discord.supabase.com)
