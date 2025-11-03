import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function PATCH(request: NextRequest) {
  try {
    const { memberId, role, organizationId } = await request.json();

    console.log('[UPDATE MEMBER] Request received:', { memberId, role, organizationId });

    // Validate inputs
    if (!memberId || !role || !organizationId) {
      return NextResponse.json(
        { error: 'Member ID, role, and organization ID are required' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['owner', 'admin', 'member', 'viewer'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    console.log('[UPDATE MEMBER] Getting auth token...');

    // Get the Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No authentication token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Create Supabase client
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

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('[UPDATE MEMBER] Auth error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized - Invalid or expired token' },
        { status: 401 }
      );
    }

    console.log('[UPDATE MEMBER] User authenticated:', user.id);

    // Check if current user is a member with proper permissions
    const { data: currentMember, error: memberError } = await supabase
      .from('organization_members')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (memberError || !currentMember) {
      return NextResponse.json(
        { error: 'You are not a member of this organization' },
        { status: 403 }
      );
    }

    // Only owners and admins can update member roles
    if (currentMember.role !== 'owner' && currentMember.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only organization owners and admins can update member roles' },
        { status: 403 }
      );
    }

    // Get the member being updated
    const { data: targetMember, error: targetError } = await supabase
      .from('organization_members')
      .select('*')
      .eq('id', memberId)
      .eq('organization_id', organizationId)
      .single();

    if (targetError || !targetMember) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Prevent non-owners from changing owner roles
    if (targetMember.role === 'owner' && currentMember.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only owners can modify other owners' },
        { status: 403 }
      );
    }

    // Prevent non-owners from promoting to owner
    if (role === 'owner' && currentMember.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only owners can promote members to owner' },
        { status: 403 }
      );
    }

    // Prevent users from changing their own role
    if (targetMember.user_id === user.id) {
      return NextResponse.json(
        { error: 'You cannot change your own role' },
        { status: 403 }
      );
    }

    console.log('[UPDATE MEMBER] Updating role...');

    // Update the member role
    const { data: updatedMember, error: updateError } = await supabase
      .from('organization_members')
      .update({ 
        role: role,
        updated_at: new Date().toISOString()
      })
      .eq('id', memberId)
      .select()
      .single();

    if (updateError) {
      console.error('[UPDATE MEMBER] Error updating member:', updateError);
      return NextResponse.json(
        { error: 'Failed to update member role' },
        { status: 500 }
      );
    }

    console.log('[UPDATE MEMBER] Member updated successfully');

    return NextResponse.json({
      success: true,
      member: updatedMember,
      message: `Successfully updated role to ${role}`
    });

  } catch (error: any) {
    console.error('Error in update-member API:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
