import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get access token from cookie or header
    const accessToken = request.cookies.get('sb-access-token')?.value || 
                       request.headers.get('authorization')?.replace('Bearer ', '');

    if (!accessToken) {
      return NextResponse.json(
        { authenticated: false, error: 'No access token' },
        { status: 401 }
      );
    }

    // Verify token with Supabase
    const supabase = createServerClient();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return NextResponse.json(
        { authenticated: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Check if user has admin access
    const userRole = user.user_metadata?.role || 'admin';
    const canAccess = user.user_metadata?.can_access || ['admin'];

    if (!canAccess.includes('admin')) {
      return NextResponse.json(
        { authenticated: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.user_metadata?.full_name,
        role: userRole
      }
    });

  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { authenticated: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

