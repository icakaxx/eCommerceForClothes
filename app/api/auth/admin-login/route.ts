import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client for server-side auth
const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Attempt to authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
      email: username, // username is actually email in our setup
      password: password,
    })

    if (authError || !authData.user) {
      console.error('Supabase auth error:', authError)
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Get user metadata to check role
    const userRole = authData.user.user_metadata?.role || 'admin'
    const canAccess = authData.user.user_metadata?.can_access || ['admin']

    // Check if user has permission to access admin area
    if (!canAccess.includes('admin')) {
      console.error('Access denied:', {
        userRole,
        canAccess,
      })
      return NextResponse.json(
        { 
          error: 'Access denied. Your account does not have permission to access this area.',
        },
        { status: 403 }
      )
    }

    // Set session cookie for the client
    const response = NextResponse.json({
      success: true,
      role: userRole,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        fullName: authData.user.user_metadata?.full_name,
        role: userRole
      },
      session: {
        access_token: authData.session?.access_token,
        refresh_token: authData.session?.refresh_token,
        expires_at: authData.session?.expires_at
      },
      message: 'Login successful'
    })

    // Set HTTP-only cookies for session (more secure than localStorage)
    if (authData.session) {
      response.cookies.set('sb-access-token', authData.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      })
      
      response.cookies.set('sb-refresh-token', authData.session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30 // 30 days
      })
    }

    return response

  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

