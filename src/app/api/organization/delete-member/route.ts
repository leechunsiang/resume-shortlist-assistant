import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function DELETE(request: NextRequest) {
  try {
    const { memberId, organizationId } = await request.json();

    console.log('[DELETE MEMBER] Request received:', { memberId, organizationId });

    // Validate inputs
    if (!memberId || !organizationId) {
      return NextResponse.json(
        { error: 'Member ID and organization ID are required' },
        { status: 400 }
      );
    }

    console.log('[DELETE MEMBER] Getting auth token...');

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
      console.error('[DELETE MEMBER] Auth error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized - Invalid or expired token' },
        { status: 401 }
      );
    }

    console.log('[DELETE MEMBER] User authenticated:', user.id);

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

    // Only owners and admins can remove members
    if (currentMember.role !== 'owner' && currentMember.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only organization owners and admins can remove members' },
        { status: 403 }
      );
    }

    // Get the member being deleted
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

    // Prevent non-owners from removing owners
    if (targetMember.role === 'owner' && currentMember.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only owners can remove other owners' },
        { status: 403 }
      );
    }

    // Prevent users from removing themselves
    if (targetMember.user_id === user.id) {
      return NextResponse.json(
        { error: 'You cannot remove yourself from the organization' },
        { status: 403 }
      );
    }

    // Check if this is the last owner
    if (targetMember.role === 'owner') {
      const { data: ownerCount, error: countError } = await supabase
        .from('organization_members')
        .select('id', { count: 'exact' })
        .eq('organization_id', organizationId)
        .eq('role', 'owner')
        .eq('status', 'active');

      if (countError || !ownerCount || ownerCount.length <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove the last owner of the organization' },
          { status: 403 }
        );
      }
    }

    console.log('[DELETE MEMBER] Removing member...');

    // Delete the member
    const { error: deleteError } = await supabase
      .from('organization_members')
      .delete()
      .eq('id', memberId);

    if (deleteError) {
      console.error('[DELETE MEMBER] Error deleting member:', deleteError);
      return NextResponse.json(
        { error: 'Failed to remove member' },
        { status: 500 }
      );
    }

    console.log('[DELETE MEMBER] Member removed successfully');

    return NextResponse.json({
      success: true,
      message: 'Member removed successfully'
    });

  } catch (error: any) {
    console.error('Error in delete-member API:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
