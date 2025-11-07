import { NextRequest, NextResponse } from 'next/server';
import { analyzeResumeMatch, batchAnalyzeCandidates, extractCandidateInfo } from '@/lib/openai';
import { supabase } from '@/lib/supabase';
import { extractTextFromBase64PDF } from '@/lib/pdf-parser';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Helper function to sanitize integer values
function sanitizeInteger(value: any): number {
  if (typeof value === 'number') return Math.floor(value);
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : Math.floor(parsed);
  }
  return 0;
}

// Helper function to sanitize array values
function sanitizeArray(value: any): string[] {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return [value];
  return [];
}

export async function POST(request: NextRequest) {
  try {
    // Get current user from session cookie
    const cookieStore = await cookies();
    const authToken = cookieStore.get('sb-access-token') || cookieStore.get('sb-yfljhsgwbclprbsteqox-auth-token');
    
    let userId: string | undefined;
    
    // Try to get user from session
    if (authToken) {
      const supabaseClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      const { data: { user } } = await supabaseClient.auth.getUser();
      userId = user?.id;
    }
    
    // If no user, continue anyway (for backwards compatibility)
    // The usage logging will just not include user tracking
    console.log('[API] User ID:', userId || 'anonymous');

    const { 
      jobId, 
      organizationId, 
      resumes, 
      mode = 'batch',
      customExtractPrompt,
      customAnalysisPrompt 
    } = await request.json();

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Fetch job details
    const { data: job, error: jobError } = await supabase
      .from('job_listings')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Handle upload mode - extract candidate info and analyze
    if (mode === 'upload' && resumes && resumes.length > 0) {
      const jobRequirements = {
        title: job.title,
        description: job.description || '',
        requirements: job.requirements || '',
        department: job.department,
        employmentType: job.employment_type,
      };

      const results = [];

      for (const resume of resumes) {
        try {
          // Extract text from PDF if needed
          let resumeText = resume.text;
          
          if (resume.type === 'pdf' && resumeText.startsWith('data:application/pdf;base64,')) {
            try {
              console.log(`Extracting text from PDF: ${resume.fileName}`);
              resumeText = await extractTextFromBase64PDF(resumeText);
              console.log(`Successfully extracted ${resumeText.length} characters from PDF`);
            } catch (pdfError) {
              console.error('PDF extraction failed:', pdfError);
              results.push({
                fileName: resume.fileName,
                success: false,
                error: 'Failed to extract text from PDF. Please convert to TXT format.'
              });
              continue;
            }
          }
          
          // Strip NULL bytes and other problematic unicode characters
          resumeText = resumeText.replace(/\0/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
          
          // Extract candidate information from resume using AI
          const candidateInfo = await extractCandidateInfo(
            resumeText, 
            customExtractPrompt,
            userId,
            organizationId
          );
          
          // Analyze resume against job requirements
          const analysis = await analyzeResumeMatch(
            {
              firstName: candidateInfo.firstName,
              lastName: candidateInfo.lastName,
              email: candidateInfo.email,
              resumeText: resumeText,
              currentPosition: candidateInfo.currentPosition,
              yearsOfExperience: candidateInfo.yearsOfExperience,
              skills: candidateInfo.skills,
            },
            jobRequirements,
            customAnalysisPrompt,
            userId,
            organizationId,
            jobId,
            undefined // candidateId not yet created
          );

          // Create candidate in database
          // Determine status: shortlisted if score >= 50, rejected if score < 50
          const matchScore = Math.floor(analysis.matchScore);
          const candidateStatus = matchScore >= 50 ? 'shortlisted' : 'rejected';
          
          const { data: candidate, error: candidateError } = await supabase
            .from('candidates')
            .insert({
              organization_id: organizationId,
              first_name: candidateInfo.firstName || 'Unknown',
              last_name: candidateInfo.lastName || 'Candidate',
              email: candidateInfo.email,
              phone: candidateInfo.phone || null,
              resume_text: resumeText.replace(/\0/g, ''),
              current_position: candidateInfo.currentPosition || null,
              years_of_experience: sanitizeInteger(candidateInfo.yearsOfExperience),
              skills: sanitizeArray(candidateInfo.skills),
              education: candidateInfo.education || null,
              score: matchScore,
              status: candidateStatus,
            })
            .select()
            .single();

          if (candidateError) {
            console.error('Error creating candidate:', candidateError);
            continue;
          }

          // Create job application
          await supabase
            .from('job_applications')
            .insert({
              job_id: jobId,
              candidate_id: candidate.id,
              match_score: matchScore,
              ai_analysis: analysis,
              status: candidateStatus,
              applied_at: new Date().toISOString(),
              reviewed_at: new Date().toISOString(),
            });

          results.push({
            fileName: resume.fileName,
            candidateId: candidate.id,
            candidateName: `${candidateInfo.firstName} ${candidateInfo.lastName}`,
            matchScore: analysis.matchScore,
            recommendation: analysis.recommendation,
          });
        } catch (error) {
          console.error(`Error processing resume ${resume.fileName}:`, error);
          results.push({
            fileName: resume.fileName,
            error: 'Failed to process resume',
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: `Analyzed ${results.length} resumes`,
        results,
        jobTitle: job.title,
      });
    }

    // Original batch mode for existing candidates
    const { data: candidates, error: candidatesError } = await supabase
      .from('candidates')
      .select('*')
      .eq('organization_id', organizationId);

    if (candidatesError || !candidates || candidates.length === 0) {
      return NextResponse.json(
        { error: 'No candidates found' },
        { status: 404 }
      );
    }

    // Filter out candidates who already have applications for this job
    const { data: existingApplications } = await supabase
      .from('job_applications')
      .select('candidate_id')
      .eq('job_id', jobId);

    const existingCandidateIds = new Set(
      existingApplications?.map(app => app.candidate_id) || []
    );

    const candidatesToAnalyze = candidates
      .filter(c => !existingCandidateIds.has(c.id))
      .map(c => ({
        id: c.id,
        firstName: c.first_name,
        lastName: c.last_name,
        email: c.email,
        resumeText: c.resume_text || '',
        currentPosition: c.current_position,
        yearsOfExperience: c.years_of_experience,
        skills: c.skills,
      }));

    if (candidatesToAnalyze.length === 0) {
      return NextResponse.json(
        { error: 'All candidates have already applied to this job' },
        { status: 400 }
      );
    }

    // Prepare job requirements
    const jobRequirements = {
      title: job.title,
      description: job.description || '',
      requirements: job.requirements || '',
      department: job.department,
      employmentType: job.employment_type,
    };

    // Analyze candidates
    const analyses = await batchAnalyzeCandidates(
      candidatesToAnalyze, 
      jobRequirements, 
      undefined, 
      customAnalysisPrompt,
      userId,
      organizationId,
      jobId
    );

    // Save results to job_applications table
    const applicationUpdates = [];
    for (const candidate of candidatesToAnalyze) {
      const analysis = analyses.get(candidate.email);
      if (analysis) {
        // Determine status: shortlisted if score >= 50, rejected if score < 50
        const matchScore = Math.floor(analysis.matchScore);
        const applicationStatus = matchScore >= 50 ? 'shortlisted' : 'rejected';
        
        const appData = {
          job_id: jobId,
          candidate_id: candidate.id,
          match_score: matchScore,
          ai_analysis: analysis,
          status: applicationStatus,
          applied_at: new Date().toISOString(),
          reviewed_at: new Date().toISOString(),
        };

        // Create new application (no need to check for existing since we filtered them out)
        await supabase
          .from('job_applications')
          .insert(appData);

        applicationUpdates.push({
          candidateId: candidate.id,
          candidateName: `${candidate.firstName} ${candidate.lastName}`,
          matchScore: analysis.matchScore,
          recommendation: analysis.recommendation,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Analyzed ${analyses.size} candidates`,
      results: applicationUpdates,
      jobTitle: job.title,
    });

  } catch (error: any) {
    console.error('Error in AI shortlist API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze candidates' },
      { status: 500 }
    );
  }
}
