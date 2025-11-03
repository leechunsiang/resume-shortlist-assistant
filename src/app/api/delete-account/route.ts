import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Validate environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('CRITICAL: SUPABASE_SERVICE_ROLE_KEY is not set. Delete account feature will not work.');
}

// Create a Supabase client with service role key for admin operations
const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY 
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  : null;

export async function POST(request: Request) {
  try {
    // Check if service role key is configured
    if (!supabaseAdmin) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not configured');
      return NextResponse.json(
        { 
          error: 'Delete account feature is not configured. Please contact administrator.',
          details: 'Service role key is missing'
        },
        { status: 503 }
      );
    }

    console.log('[DELETE ACCOUNT] Starting delete account process...');

    const { userId } = await request.json();

    if (!userId) {
      console.error('[DELETE ACCOUNT] No user ID provided');
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('[DELETE ACCOUNT] User ID:', userId);

    // Get user's organizations where they are the only owner
    const { data: memberships, error: membershipsError } = await supabaseAdmin
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', userId)
      .eq('role', 'owner');

    if (membershipsError) {
      console.error('[DELETE ACCOUNT] Error fetching memberships:', membershipsError);
      return NextResponse.json(
        { error: 'Failed to fetch user data', details: membershipsError.message },
        { status: 500 }
      );
    }

    console.log('[DELETE ACCOUNT] Found', memberships?.length || 0, 'owner memberships');

    console.log('[DELETE ACCOUNT] Found', memberships?.length || 0, 'owner memberships');

    // Delete organizations where user is the only owner
    if (memberships && memberships.length > 0) {
      for (const membership of memberships) {
        console.log('[DELETE ACCOUNT] Processing organization:', membership.organization_id);
        
        // Check if there are other owners
        const { data: otherOwners } = await supabaseAdmin
          .from('organization_members')
          .select('id')
          .eq('organization_id', membership.organization_id)
          .eq('role', 'owner')
          .neq('user_id', userId);

        // If no other owners, delete the organization (cascade will handle related data)
        if (!otherOwners || otherOwners.length === 0) {
          console.log('[DELETE ACCOUNT] Deleting organization (no other owners):', membership.organization_id);
          
          // Delete all candidates for this organization
          const { error: candidatesError } = await supabaseAdmin
            .from('candidates')
            .delete()
            .eq('organization_id', membership.organization_id);
          
          if (candidatesError) {
            console.error('[DELETE ACCOUNT] Error deleting candidates:', candidatesError);
          }

          // Delete all job applications for jobs in this organization
          const { data: jobs } = await supabaseAdmin
            .from('job_listings')
            .select('id')
            .eq('organization_id', membership.organization_id);

          if (jobs && jobs.length > 0) {
            for (const job of jobs) {
              const { error: appsError } = await supabaseAdmin
                .from('job_applications')
                .delete()
                .eq('job_id', job.id);
              
              if (appsError) {
                console.error('[DELETE ACCOUNT] Error deleting job applications:', appsError);
              }
            }
          }

          // Delete all job listings for this organization
          const { error: jobsError } = await supabaseAdmin
            .from('job_listings')
            .delete()
            .eq('organization_id', membership.organization_id);
          
          if (jobsError) {
            console.error('[DELETE ACCOUNT] Error deleting jobs:', jobsError);
          }

          // Delete all organization members
          const { error: membersError } = await supabaseAdmin
            .from('organization_members')
            .delete()
            .eq('organization_id', membership.organization_id);
          
          if (membersError) {
            console.error('[DELETE ACCOUNT] Error deleting members:', membersError);
          }

          // Finally delete the organization
          const { error: orgError } = await supabaseAdmin
            .from('organizations')
            .delete()
            .eq('id', membership.organization_id);
          
          if (orgError) {
            console.error('[DELETE ACCOUNT] Error deleting organization:', orgError);
          }
        } else {
          console.log('[DELETE ACCOUNT] Organization has other owners, just removing membership');
        }
      }
    }

    // Delete any remaining organization memberships for this user
    console.log('[DELETE ACCOUNT] Deleting remaining memberships...');
    const { error: finalMembershipsError } = await supabaseAdmin
      .from('organization_members')
      .delete()
      .eq('user_id', userId);
    
    if (finalMembershipsError) {
      console.error('[DELETE ACCOUNT] Error deleting final memberships:', finalMembershipsError);
    }

    // Delete the user's auth account using admin client
    console.log('[DELETE ACCOUNT] Deleting auth account...');
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
      userId
    );

    if (deleteError) {
      console.error('[DELETE ACCOUNT] Error deleting user from auth:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete user account', details: deleteError.message },
        { status: 500 }
      );
    }

    console.log('[DELETE ACCOUNT] Account deleted successfully!');
    return NextResponse.json(
      { message: 'Account deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in delete account API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
