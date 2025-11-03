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

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user's organizations where they are the only owner
    const { data: memberships } = await supabaseAdmin
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', userId)
      .eq('role', 'owner');

    // Delete organizations where user is the only owner
    if (memberships && memberships.length > 0) {
      for (const membership of memberships) {
        // Check if there are other owners
        const { data: otherOwners } = await supabaseAdmin
          .from('organization_members')
          .select('id')
          .eq('organization_id', membership.organization_id)
          .eq('role', 'owner')
          .neq('user_id', userId);

        // If no other owners, delete the organization (cascade will handle related data)
        if (!otherOwners || otherOwners.length === 0) {
          // Delete all candidates for this organization
          await supabaseAdmin
            .from('candidates')
            .delete()
            .eq('organization_id', membership.organization_id);

          // Delete all job applications for jobs in this organization
          const { data: jobs } = await supabaseAdmin
            .from('job_listings')
            .select('id')
            .eq('organization_id', membership.organization_id);

          if (jobs && jobs.length > 0) {
            for (const job of jobs) {
              await supabaseAdmin
                .from('job_applications')
                .delete()
                .eq('job_id', job.id);
            }
          }

          // Delete all job listings for this organization
          await supabaseAdmin
            .from('job_listings')
            .delete()
            .eq('organization_id', membership.organization_id);

          // Delete all organization members
          await supabaseAdmin
            .from('organization_members')
            .delete()
            .eq('organization_id', membership.organization_id);

          // Finally delete the organization
          await supabaseAdmin
            .from('organizations')
            .delete()
            .eq('id', membership.organization_id);
        }
      }
    }

    // Delete any remaining organization memberships for this user
    await supabaseAdmin
      .from('organization_members')
      .delete()
      .eq('user_id', userId);

    // Delete the user's auth account using admin client
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
      userId
    );

    if (deleteError) {
      console.error('Error deleting user from auth:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete user account', details: deleteError.message },
        { status: 500 }
      );
    }

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
