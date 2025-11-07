import OpenAI from 'openai';
import { logApiUsage, calculateCost } from './api-usage';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export interface ResumeAnalysis {
  matchScore: number; // 0-100
  strengths: string[];
  weaknesses: string[];
  keySkillsMatch: string[];
  recommendation: 'strongly_recommended' | 'recommended' | 'maybe' | 'not_recommended';
  summary: string;
  experienceMatch: string;
  educationMatch: string;
}

export interface JobRequirements {
  title: string;
  description: string;
  requirements: string;
  department?: string;
  employmentType?: string;
}

export interface CandidateResume {
  firstName: string;
  lastName: string;
  email: string;
  resumeText: string;
  currentPosition?: string;
  yearsOfExperience?: number;
  skills?: string[];
}

export interface ExtractedCandidateInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  currentPosition?: string;
  yearsOfExperience?: number;
  skills: string[];
  education?: string;
  location?: string;
  linkedIn?: string;
}

/**
 * Extract candidate information from resume text using OpenAI GPT-4.1-nano
 */
export async function extractCandidateInfo(
  resumeText: string, 
  customPrompt?: string,
  userId?: string,
  organizationId?: string
): Promise<ExtractedCandidateInfo> {
  const startTime = Date.now();
  let success = false;
  let errorMessage: string | undefined;
  let inputTokens = 0;
  let outputTokens = 0;

  try {
    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Use custom prompt if provided, otherwise use default
    const defaultPrompt = `You are an expert at extracting structured information from resumes. Extract the following information from this resume and return it as JSON.

RESUME TEXT:
{RESUME_TEXT}

Extract and return a SINGLE JSON object (not an array) with this exact structure:
{
  "firstName": "<candidate's first name>",
  "lastName": "<candidate's last name>",
  "email": "<email address>",
  "phone": "<phone number if available>",
  "currentPosition": "<most recent job title>",
  "yearsOfExperience": <total years of professional experience as a NUMBER (use decimals like 0.5 for 6 months, 1.5 for 1.5 years)>,
  "skills": [<array of technical and professional skills>],
  "education": "<highest degree and institution>",
  "location": "<city and country if mentioned>",
  "linkedIn": "<LinkedIn profile URL if mentioned>"
}

Important:
- Return ONLY ONE JSON object for the candidate, NOT an array
- If any field is not found, use an empty string "" for text fields, null for optional fields, 0 for yearsOfExperience, or [] for arrays
- Extract as many skills as you can find (technical skills, tools, frameworks, soft skills)
- Calculate yearsOfExperience as a decimal number (e.g., 0.5 for 6 months, 2.5 for 2.5 years)
- For firstName and lastName, if only full name is provided, split it appropriately

Provide ONLY the JSON response, no additional text or explanation.`;

    const promptTemplate = customPrompt || defaultPrompt;
    const prompt = promptTemplate.replace('{RESUME_TEXT}', resumeText.substring(0, 10000));

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-nano',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    // Extract token usage
    inputTokens = completion.usage?.prompt_tokens || 0;
    outputTokens = completion.usage?.completion_tokens || 0;
    const totalTokens = completion.usage?.total_tokens || 0;

    const text = completion.choices[0].message.content || '{}';
    
    console.log('AI Response:', text.substring(0, 200)); // Log first 200 chars for debugging
    
    // Parse the JSON response
    let parsed = JSON.parse(text);
    
    // If AI returned an array, take the first element
    if (Array.isArray(parsed)) {
      if (parsed.length === 0) {
        throw new Error('AI returned empty array');
      }
      parsed = parsed[0];
    }
    
    const extracted: ExtractedCandidateInfo = parsed;
    
    // Validate and provide defaults for required fields
    if (!extracted.firstName || !extracted.lastName) {
      extracted.firstName = extracted.firstName || 'Unknown';
      extracted.lastName = extracted.lastName || 'Candidate';
    }
    
    if (!extracted.email) {
      // Generate a placeholder email
      extracted.email = `candidate_${Date.now()}@placeholder.com`;
    }
    
    if (!extracted.skills || !Array.isArray(extracted.skills)) {
      extracted.skills = [];
    }
    
    if (!extracted.yearsOfExperience || isNaN(extracted.yearsOfExperience)) {
      extracted.yearsOfExperience = 0;
    }
    
    success = true;

    // Log API usage to Supabase
    if (userId && organizationId) {
      const responseTime = Date.now() - startTime;
      const costs = calculateCost('gpt-4.1-nano', inputTokens, outputTokens);
      
      await logApiUsage({
        userId,
        organizationId,
        endpoint: 'extract_candidate_info',
        model: 'gpt-4.1-nano',
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        ...costs,
        requestType: 'single',
        success: true,
        responseTimeMs: responseTime,
      });
    }
    
    return extracted;
  } catch (error: any) {
    errorMessage = error?.message || 'Unknown error';
    console.error('Error extracting candidate info with OpenAI:', error);
    console.error('Error details:', error?.message);

    // Log failed API usage
    if (userId && organizationId) {
      const responseTime = Date.now() - startTime;
      const costs = calculateCost('gpt-4.1-nano', inputTokens, outputTokens);
      
      await logApiUsage({
        userId,
        organizationId,
        endpoint: 'extract_candidate_info',
        model: 'gpt-4.1-nano',
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        ...costs,
        requestType: 'single',
        success: false,
        errorMessage,
        responseTimeMs: responseTime,
      });
    }
    
    // Return default values instead of throwing
    return {
      firstName: 'Unknown',
      lastName: 'Candidate',
      email: `candidate_${Date.now()}@placeholder.com`,
      phone: '',
      currentPosition: '',
      yearsOfExperience: 0,
      skills: [],
      education: '',
      location: '',
      linkedIn: '',
    };
  }
}

/**
 * Analyze a candidate's resume against job requirements using OpenAI GPT-4.1-nano
 */
export async function analyzeResumeMatch(
  candidate: CandidateResume,
  job: JobRequirements,
  customPrompt?: string,
  userId?: string,
  organizationId?: string,
  jobId?: string,
  candidateId?: string
): Promise<ResumeAnalysis> {
  const startTime = Date.now();
  let success = false;
  let errorMessage: string | undefined;
  let inputTokens = 0;
  let outputTokens = 0;

  try {
    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Use custom prompt if provided, otherwise use default
    const defaultPrompt = `You are an expert HR recruiter and resume analyzer. Analyze the following candidate's resume against the job requirements and provide a detailed assessment.

JOB DETAILS:
Title: {JOB_TITLE}
Department: {JOB_DEPARTMENT}
Employment Type: {JOB_EMPLOYMENT_TYPE}

JOB DESCRIPTION:
{JOB_DESCRIPTION}

JOB REQUIREMENTS:
{JOB_REQUIREMENTS}

CANDIDATE INFORMATION:
Name: {CANDIDATE_NAME}
Email: {CANDIDATE_EMAIL}
Current Position: {CANDIDATE_POSITION}
Years of Experience: {CANDIDATE_EXPERIENCE}
Skills: {CANDIDATE_SKILLS}

RESUME TEXT:
{RESUME_TEXT}

Please analyze this candidate and provide a JSON response with the following structure:
{
  "matchScore": <number 0-100>,
  "strengths": [<array of 3-5 key strengths relevant to the job>],
  "weaknesses": [<array of 2-4 areas where candidate falls short>],
  "keySkillsMatch": [<array of skills from resume that match job requirements>],
  "recommendation": "<one of: strongly_recommended, recommended, maybe, not_recommended>",
  "summary": "<2-3 sentence summary of overall fit>",
  "experienceMatch": "<assessment of how their experience aligns with job requirements>",
  "educationMatch": "<assessment of how their education aligns with job requirements>"
}

Provide ONLY the JSON response, no additional text.`;

    const promptTemplate = customPrompt || defaultPrompt;
    
    // Replace placeholders with actual values
    const prompt = promptTemplate
      .replace('{JOB_TITLE}', job.title)
      .replace('{JOB_DEPARTMENT}', job.department || 'Not specified')
      .replace('{JOB_EMPLOYMENT_TYPE}', job.employmentType || 'Not specified')
      .replace('{JOB_DESCRIPTION}', job.description)
      .replace('{JOB_REQUIREMENTS}', job.requirements)
      .replace('{CANDIDATE_NAME}', `${candidate.firstName} ${candidate.lastName}`)
      .replace('{CANDIDATE_EMAIL}', candidate.email)
      .replace('{CANDIDATE_POSITION}', candidate.currentPosition || 'Not specified')
      .replace('{CANDIDATE_EXPERIENCE}', candidate.yearsOfExperience?.toString() || 'Not specified')
      .replace('{CANDIDATE_SKILLS}', candidate.skills?.join(', ') || 'Not specified')
      .replace('{RESUME_TEXT}', candidate.resumeText.substring(0, 8000));

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-nano',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    // Extract token usage
    inputTokens = completion.usage?.prompt_tokens || 0;
    outputTokens = completion.usage?.completion_tokens || 0;
    const totalTokens = completion.usage?.total_tokens || 0;

    const text = completion.choices[0].message.content || '{}';
    
    console.log('AI Analysis Response:', text.substring(0, 200)); // Log first 200 chars for debugging
    
    // Parse the JSON response
    const analysis: ResumeAnalysis = JSON.parse(text);
    
    // Validate and set defaults
    analysis.matchScore = Math.max(0, Math.min(100, analysis.matchScore || 0));
    analysis.strengths = Array.isArray(analysis.strengths) ? analysis.strengths : [];
    analysis.weaknesses = Array.isArray(analysis.weaknesses) ? analysis.weaknesses : [];
    analysis.keySkillsMatch = Array.isArray(analysis.keySkillsMatch) ? analysis.keySkillsMatch : [];
    
    if (!analysis.recommendation) {
      analysis.recommendation = analysis.matchScore >= 70 ? 'recommended' : 'maybe';
    }
    
    if (!analysis.summary) {
      analysis.summary = `Candidate scored ${analysis.matchScore}% match for this position.`;
    }
    
    success = true;

    // Log API usage to Supabase
    if (userId && organizationId) {
      const responseTime = Date.now() - startTime;
      const costs = calculateCost('gpt-4.1-nano', inputTokens, outputTokens);
      
      await logApiUsage({
        userId,
        organizationId,
        endpoint: 'analyze_resume_match',
        model: 'gpt-4.1-nano',
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        ...costs,
        requestType: 'single',
        candidateId,
        jobId,
        success: true,
        responseTimeMs: responseTime,
      });
    }
    
    return analysis;
  } catch (error: any) {
    errorMessage = error?.message || 'Unknown error';
    console.error('Error analyzing resume with OpenAI:', error);
    console.error('Error details:', error?.message);

    // Log failed API usage
    if (userId && organizationId) {
      const responseTime = Date.now() - startTime;
      const costs = calculateCost('gpt-4.1-nano', inputTokens, outputTokens);
      
      await logApiUsage({
        userId,
        organizationId,
        endpoint: 'analyze_resume_match',
        model: 'gpt-4.1-nano',
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        ...costs,
        requestType: 'single',
        candidateId,
        jobId,
        success: false,
        errorMessage,
        responseTimeMs: responseTime,
      });
    }
    
    // Return default analysis instead of throwing
    return {
      matchScore: 50,
      strengths: ['Unable to analyze - please review manually'],
      weaknesses: ['Analysis failed'],
      keySkillsMatch: [],
      recommendation: 'maybe',
      summary: 'AI analysis failed. Please review this candidate manually.',
      experienceMatch: 'Unable to assess',
      educationMatch: 'Unable to assess',
    };
  }
}

/**
 * Batch analyze multiple candidates for a job
 */
export async function batchAnalyzeCandidates(
  candidates: CandidateResume[],
  job: JobRequirements,
  onProgress?: (completed: number, total: number) => void,
  customPrompt?: string,
  userId?: string,
  organizationId?: string,
  jobId?: string
): Promise<Map<string, ResumeAnalysis>> {
  const results = new Map<string, ResumeAnalysis>();
  const total = candidates.length;
  
  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    try {
      const analysis = await analyzeResumeMatch(
        candidate, 
        job, 
        customPrompt,
        userId,
        organizationId,
        jobId,
        undefined // candidateId not available in batch
      );
      results.set(candidate.email, analysis);
      
      if (onProgress) {
        onProgress(i + 1, total);
      }
      
      // Add small delay to avoid rate limiting
      if (i < candidates.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`Error analyzing candidate ${candidate.email}:`, error);
      // Continue with next candidate
    }
  }
  
  return results;
}

/**
 * Get shortlist recommendations from analyzed candidates
 */
export function getShortlistRecommendations(
  analyses: Map<string, ResumeAnalysis>,
  minScore: number = 70
): string[] {
  const shortlist: string[] = [];
  
  analyses.forEach((analysis, email) => {
    if (
      analysis.matchScore >= minScore &&
      (analysis.recommendation === 'strongly_recommended' || analysis.recommendation === 'recommended')
    ) {
      shortlist.push(email);
    }
  });
  
  // Sort by match score descending
  return shortlist.sort((a, b) => {
    const scoreA = analyses.get(a)?.matchScore || 0;
    const scoreB = analyses.get(b)?.matchScore || 0;
    return scoreB - scoreA;
  });
}
