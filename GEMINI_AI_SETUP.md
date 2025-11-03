# Google Gemini AI Integration Setup

This guide will help you set up Google Gemini AI for automatic resume shortlisting.

## Prerequisites

- Google Cloud account
- Resume Shortlist Assistant project set up
- Candidates and Job listings in your database

## Step 1: Get Your Google Gemini API Key

1. **Go to Google AI Studio**
   - Visit: [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
   - Or: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

2. **Sign in with your Google Account**
   - Use your existing Google account or create a new one

3. **Create API Key**
   - Click "Create API Key"
   - Select an existing Google Cloud project or create a new one
   - Copy the generated API key (starts with `AIza...`)
   
   ⚠️ **Important**: Keep this key secret! Never commit it to version control.

## Step 2: Add API Key to Environment Variables

1. **Open `.env.local` file** in your project root

2. **Add your API key**:
   ```env
   GOOGLE_GEMINI_API_KEY=AIzaSyC_your_actual_api_key_here
   ```

3. **Save the file**

## Step 3: Restart Your Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart it
npm run dev
```

## Step 4: Test the AI Shortlisting

### A. Add Test Data (if you haven't already)

1. **Add Candidates**:
   - Go to the Candidates page
   - Add a few test candidates with resume text
   - Include skills, experience, and other relevant information

2. **Create a Job Listing**:
   - Go to Job Listings page
   - Create a job with:
     - Title (e.g., "Senior Full Stack Developer")
     - Description
     - Requirements (list required skills)
     - Set status to "Active"

### B. Run AI Shortlisting

1. **Navigate to Job Listings** page
2. **Find the job** you want to shortlist candidates for
3. **Click "AI Shortlist"** button on the job card
4. **Wait for analysis** - The AI will:
   - Analyze each candidate's resume
   - Match skills and experience with job requirements
   - Generate match scores (0-100)
   - Provide recommendations
   - Automatically shortlist top candidates

5. **View Results**:
   - Check the Candidates page
   - Candidates will be marked as "shortlisted" if they scored well
   - Each application will have AI analysis data

## How It Works

### AI Analysis Process

1. **Resume Parsing**: Extracts key information from candidate resumes
2. **Requirement Matching**: Compares candidate skills with job requirements
3. **Scoring**: Generates a match score (0-100) based on:
   - Skills alignment
   - Experience level
   - Education background
   - Overall fit

4. **Recommendations**: Provides one of:
   - `strongly_recommended`: Top candidates (auto-shortlisted)
   - `recommended`: Good fit (auto-shortlisted)
   - `maybe`: Potential fit (review needed)
   - `not_recommended`: Poor match

### Analysis Output

For each candidate, the AI provides:
- **Match Score**: 0-100 percentage
- **Strengths**: 3-5 key strengths relevant to the job
- **Weaknesses**: 2-4 areas where candidate falls short
- **Key Skills Match**: List of matching skills
- **Summary**: 2-3 sentence overall assessment
- **Experience Match**: How experience aligns with requirements
- **Education Match**: How education aligns with requirements

## API Rate Limits

- **Free Tier**: 60 requests per minute
- **Paid Tier**: Higher limits available

If you have many candidates, the system automatically:
- Processes candidates sequentially
- Adds 1-second delay between requests
- Shows progress indicator

## Troubleshooting

### Error: "API key not valid"
- Check that you copied the full API key
- Make sure there are no extra spaces in `.env.local`
- Verify the key is active in Google AI Studio

### Error: "Failed to analyze candidates"
- Ensure candidates have resume text
- Check that job has description and requirements
- Verify your internet connection

### Error: "Rate limit exceeded"
- Wait a few minutes and try again
- Process fewer candidates at once
- Consider upgrading your Google Cloud plan

### No results showing
- Check browser console for errors
- Verify API key in `.env.local`
- Ensure Supabase connection is working
- Check that job_applications table exists

## Database Schema

The AI analysis results are stored in the `job_applications` table:

```sql
- match_score: INTEGER (0-100)
- ai_analysis: JSONB (full analysis object)
- status: VARCHAR ('shortlisted' for top candidates)
- reviewed_at: TIMESTAMP (when AI analyzed)
```

## Cost Estimation

Google Gemini Pro pricing (as of 2024):
- **Input**: $0.00025 / 1K characters
- **Output**: $0.0005 / 1K characters

Example: Analyzing 100 candidates with average 2000-character resumes:
- Cost: ~$0.05 - $0.10 per batch
- Free tier includes generous quota

## Best Practices

1. **Candidate Data Quality**:
   - Ensure resumes have detailed text
   - Include skills, experience, education
   - Use consistent formatting

2. **Job Requirements**:
   - Write clear, detailed job descriptions
   - List specific required skills
   - Include must-have vs nice-to-have requirements

3. **Batch Processing**:
   - Process candidates in reasonable batches
   - Don't analyze same candidates multiple times unnecessarily
   - Review AI recommendations before finalizing decisions

4. **Human Review**:
   - AI is a tool to assist, not replace human judgment
   - Review shortlisted candidates personally
   - Consider factors AI might miss (culture fit, etc.)

## Next Steps

After shortlisting:
1. Review shortlisted candidates in the Candidates page
2. Schedule interviews with top matches
3. Update candidate status as you progress
4. Use AI analysis insights during interviews

## Support

For issues or questions:
- Check the error messages in browser console
- Review Google AI Studio documentation
- Verify all environment variables are set correctly
- Ensure database schema is up to date
