import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { username, role, organizationId } = await request.json();

    console.log('[ADD MEMBER] Request received:', { username, role, organizationId });

    // Validate inputs
    if (!username || !role || !organizationId) {
      return NextResponse.json(
        { error: 'Username, role, and organization ID are required' },
        { status: 400 }
      );
    }

    // Create Supabase client for API route
    const supabase = createRouteHandlerClient({ cookies });

    console.log('[ADD MEMBER] Getting current session...');

    // Get current session (more reliable than getUser in API routes)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    console.log('[ADD MEMBER] Session result:', { 
      hasSession: !!session,
      user: session?.user ? { id: session.user.id, email: session.user.email } : null,
      error: sessionError 
    });

    if (sessionError || !session || !session.user) {
      console.error('[ADD MEMBER] Session error:', sessionError);
      return NextResponse.json(
        { error: 'Unauthorized - Please log in again' },
        { status: 401 }
      );
    }

    const user = session.user;
    console.log('[ADD MEMBER] Checking if user is organization member...');

    // Check if current user is a member of the organization
    const { data: currentMember, error: memberError } = await supabase
      .from('organization_members')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (memberError || !currentMember) {
      console.error('Member check error:', memberError);
      return NextResponse.json(
        { error: 'You are not a member of this organization' },
        { status: 403 }
      );
    }

    // Check if current user has permission to add members (owner or admin)
    if (currentMember.role !== 'owner' && currentMember.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only organization owners and admins can add members' },
        { status: 403 }
      );
    }

    // Find user by username from auth.users metadata
    // Note: Supabase doesn't allow direct querying of auth.users, so we need to:
    // 1. Get all organization members to check their usernames
    // 2. Or maintain a separate users table with username -> user_id mapping
    // For now, we'll use the RPC approach to search users
    
    // Call a Supabase RPC function to find user by username
    const { data: userInfo, error: userError } = await supabase.rpc('find_user_by_username', {
      search_username: username.toLowerCase().replace('@', '')
    });

    if (userError || !userInfo || userInfo.length === 0) {
      return NextResponse.json(
        { error: 'User not found. Please check the username.' },
        { status: 404 }
      );
    }

    const targetUserId = userInfo[0].user_id;
    const targetUserEmail = userInfo[0].email;

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('organization_members')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('user_id', targetUserId)
      .eq('status', 'active')
      .single();

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a member of this organization' },
        { status: 400 }
      );
    }

    // Add the member
    const { data: newMember, error: addError } = await supabase
      .from('organization_members')
      .insert([{
        organization_id: organizationId,
        user_id: targetUserId,
        user_email: targetUserEmail,
        role: role,
        invited_by: user.id,
        status: 'active',
        joined_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (addError) {
      console.error('Error adding member:', addError);
      return NextResponse.json(
        { error: 'Failed to add member to organization' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      member: newMember,
      message: `Successfully added ${username} to the organization`
    });

  } catch (error: any) {
    console.error('Error in add-member API:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
