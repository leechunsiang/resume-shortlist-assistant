import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

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
 * Extract candidate information from resume text using Gemini AI
 */
export async function extractCandidateInfo(resumeText: string): Promise<ExtractedCandidateInfo> {
  try {
    // Check if API key is configured
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      throw new Error('GOOGLE_GEMINI_API_KEY is not configured');
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    const prompt = `You are an expert at extracting structured information from resumes. Extract the following information from this resume and return it as JSON.

RESUME TEXT:
${resumeText.substring(0, 10000)} 

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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('AI Response:', text.substring(0, 200)); // Log first 200 chars for debugging
    
    // Try to extract JSON from response
    let jsonText = text.trim();
    
    // Remove all markdown code blocks - handle both ``` and ```json
    jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    jsonText = jsonText.trim();
    
    // Find the first { and last } to extract just the JSON
    const firstBrace = jsonText.indexOf('{');
    const lastBrace = jsonText.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
      console.error('Could not find valid JSON braces in response:', text);
      throw new Error('AI response does not contain valid JSON');
    }
    
    const jsonOnly = jsonText.substring(firstBrace, lastBrace + 1);
    
    console.log('Extracted JSON:', jsonOnly.substring(0, 200));
    
    let parsed = JSON.parse(jsonOnly);
    
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
    
    return extracted;
  } catch (error: any) {
    console.error('Error extracting candidate info with Gemini:', error);
    console.error('Error details:', error?.message);
    
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
 * Analyze a candidate's resume against job requirements using Gemini AI
 */
export async function analyzeResumeMatch(
  candidate: CandidateResume,
  job: JobRequirements
): Promise<ResumeAnalysis> {
  try {
    // Check if API key is configured
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      throw new Error('GOOGLE_GEMINI_API_KEY is not configured');
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    const prompt = `You are an expert HR recruiter and resume analyzer. Analyze the following candidate's resume against the job requirements and provide a detailed assessment.

JOB DETAILS:
Title: ${job.title}
Department: ${job.department || 'Not specified'}
Employment Type: ${job.employmentType || 'Not specified'}

JOB DESCRIPTION:
${job.description}

JOB REQUIREMENTS:
${job.requirements}

CANDIDATE INFORMATION:
Name: ${candidate.firstName} ${candidate.lastName}
Email: ${candidate.email}
Current Position: ${candidate.currentPosition || 'Not specified'}
Years of Experience: ${candidate.yearsOfExperience || 'Not specified'}
Skills: ${candidate.skills?.join(', ') || 'Not specified'}

RESUME TEXT:
${candidate.resumeText.substring(0, 8000)}

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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('AI Analysis Response:', text.substring(0, 200)); // Log first 200 chars for debugging
    
    // Try to extract JSON from response
    let jsonText = text.trim();
    
    // Remove all markdown code blocks - handle both ``` and ```json
    jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    jsonText = jsonText.trim();
    
    // Find the first { and last } to extract just the JSON
    const firstBrace = jsonText.indexOf('{');
    const lastBrace = jsonText.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
      console.error('Could not find valid JSON braces in analysis response:', text);
      throw new Error('AI response does not contain valid JSON');
    }
    
    const jsonOnly = jsonText.substring(firstBrace, lastBrace + 1);
    
    console.log('Extracted Analysis JSON:', jsonOnly.substring(0, 200));
    
    const analysis: ResumeAnalysis = JSON.parse(jsonOnly);
    
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
    
    return analysis;
  } catch (error: any) {
    console.error('Error analyzing resume with Gemini:', error);
    console.error('Error details:', error?.message);
    
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
  onProgress?: (completed: number, total: number) => void
): Promise<Map<string, ResumeAnalysis>> {
  const results = new Map<string, ResumeAnalysis>();
  const total = candidates.length;
  
  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    try {
      const analysis = await analyzeResumeMatch(candidate, job);
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
