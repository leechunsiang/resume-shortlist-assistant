# AI Shortlist Feature

## Overview
The AI Shortlist feature uses Google Gemini AI (gemini-2.0-flash-exp) to automatically analyze candidate resumes, extract information, and score candidates against job requirements.

## How It Works

### 1. Upload Resumes
- Click on any job listing to open the side panel
- Click the "AI Shortlist Candidates" button
- Upload one or multiple resume files (PDF or TXT format)
- Maximum 10MB per file

### 2. AI Processing
The AI performs two main tasks:

#### A. Information Extraction
The AI extracts the following from each resume:
- **Personal Information**: First name, last name, email, phone
- **Professional Details**: Current position, years of experience
- **Skills**: Technical and soft skills
- **Education**: Highest degree and institution
- **Location**: City and country
- **LinkedIn**: Profile URL if mentioned

#### B. Resume Analysis
For each candidate, the AI:
- Analyzes qualifications against job requirements
- Generates a match score (0-100)
- Identifies strengths and weaknesses
- Matches skills with job requirements
- Provides a recommendation (strongly_recommended, recommended, maybe, not_recommended)
- Generates a summary of overall fit

### 3. Automatic Candidate Creation
- Each analyzed resume is automatically added to your candidate database
- Candidates are linked to the job via job_applications table
- Top candidates (strongly_recommended, recommended) are automatically shortlisted
- Match scores and AI analysis are stored for review

## Usage

### From Job Listings Page:
1. Navigate to Job Listings
2. Click on a job card to open details
3. Change job status (Draft/Active/Inactive) if needed
4. Click "AI Shortlist Candidates" button
5. Upload resume files (PDF/TXT)
6. Click "Analyze X Resumes"
7. Wait for AI processing to complete

### What Gets Created:
- **Candidate Record**: Full profile with extracted information
- **Job Application**: Links candidate to the job with match score
- **AI Analysis**: Detailed assessment stored in database

## AI Model
- **Model**: gemini-2.0-flash-exp
- **Provider**: Google Gemini AI
- **Capabilities**:
  - Natural language understanding
  - Information extraction
  - Resume parsing
  - Qualification assessment
  - Scoring and recommendations

## Job Status Options
- **Draft**: Job is being prepared, not visible to candidates
- **Active**: Job is live and accepting applications
- **Inactive**: Job is paused, not currently accepting applications

## Database Structure
- **candidates**: Stores candidate profiles
- **job_listings**: Stores job postings with status
- **job_applications**: Links candidates to jobs with AI analysis

## Benefits
- ✅ Automatic candidate information extraction
- ✅ Consistent scoring across all candidates
- ✅ Detailed analysis of each candidate
- ✅ Time-saving bulk resume processing
- ✅ AI-powered shortlist recommendations
- ✅ Complete audit trail with stored analysis

## Tips
- Upload multiple resumes at once for batch processing
- Ensure job descriptions and requirements are detailed for better AI analysis
- Review AI recommendations - they're suggestions, not final decisions
- Check the match scores and detailed analysis for each candidate
