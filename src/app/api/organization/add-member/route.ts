import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { email, role, organizationId } = await request.json();

    console.log('[ADD MEMBER] Request received:', { email, role, organizationId });

    // Validate inputs
    if (!email || !role || !organizationId) {
      return NextResponse.json(
        { error: 'Email, role, and organization ID are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    console.log('[ADD MEMBER] Getting auth token from Authorization header...');

    // Get the Authorization header from the request
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[ADD MEMBER] No Authorization header found');
      return NextResponse.json(
        { error: 'Unauthorized - No authentication token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('[ADD MEMBER] Token found, creating Supabase client...');

    // Create Supabase client with the access token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    console.log('[ADD MEMBER] Getting current user...');

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    console.log('[ADD MEMBER] User result:', { 
      user: user ? { id: user.id, email: user.email } : null,
      error: authError 
    });

    if (authError || !user) {
      console.error('[ADD MEMBER] Auth error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized - Invalid or expired token' },
        { status: 401 }
      );
    }

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

    console.log('[ADD MEMBER] Looking up user by email...');

    // Use Supabase service role to query users by email
    // First, try to find if user already exists in our org members table
    const { data: existingByEmail } = await supabase
      .from('organization_members')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('user_email', email.toLowerCase())
      .single();

    if (existingByEmail) {
      return NextResponse.json(
        { error: 'This email is already a member of this organization' },
        { status: 400 }
      );
    }

    // Since we can't easily query auth.users from client, we'll create the member
    // with the email and let them be "pending" until they sign up
    // Or if they already have an account, they need to use the exact email
    
    console.log('[ADD MEMBER] Creating member record with email...');

    // Add the member (user_id will be empty for invited users)
    const { data: newMember, error: addError } = await supabase
      .from('organization_members')
      .insert([{
        organization_id: organizationId,
        user_id: '', // Will be filled when user signs up/logs in
        user_email: email.toLowerCase(),
        role: role,
        invited_by: user.id,
        status: 'pending', // Set as pending until user accepts
        invited_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (addError) {
      console.error('[ADD MEMBER] Error adding member:', addError);
      return NextResponse.json(
        { error: 'Failed to add member to organization' },
        { status: 500 }
      );
    }

    console.log('[ADD MEMBER] Member added successfully:', newMember);

    return NextResponse.json({
      success: true,
      member: newMember,
      message: `Successfully invited ${email} to the organization`
    });

  } catch (error: any) {
    console.error('Error in add-member API:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
