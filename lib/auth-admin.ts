import 'server-only'
import { supabaseAdmin } from '@/lib/supabase/admin';
import { supabase as browserClient } from '@/lib/supabase-browser'

export interface AdminUser {
  id: string
  email: string
  role: 'admin' | 'customer'
  fullName?: string
}

// Server-side function to verify admin access
export async function verifyAdminAccess(userId: string): Promise<{ isAdmin: boolean; user?: AdminUser }> {
  try {
    const supabase = supabaseAdmin;

    // Check the profiles table for admin role
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, email, role')
      .eq('id', userId)
      .single()

    if (error || !profile) {
      console.error('Profile lookup error:', error)
      return { isAdmin: false }
    }

    const isAdmin = profile.role === 'admin'

    return {
      isAdmin,
      user: {
        id: profile.id,
        email: profile.email || '',
        role: profile.role,
        fullName: profile.email?.split('@')[0] // fallback
      }
    }
  } catch (error) {
    console.error('Admin verification error:', error)
    return { isAdmin: false }
  }
}

// Client-side function to get current admin session
export async function getAdminSession(): Promise<AdminUser | null> {
  try {
    const { data: { session }, error } = await browserClient.auth.getSession()

    if (error || !session?.user) {
      return null
    }

    // Verify admin access server-side
    const response = await fetch('/api/auth/verify-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: session.user.id })
    })

    const result = await response.json()

    if (!response.ok || !result.isAdmin) {
      return null
    }

    return result.user
  } catch (error) {
    console.error('Admin session error:', error)
    return null
  }
}

// Server-side function to check if current request has admin access
export async function requireAdmin(request: Request): Promise<AdminUser> {
  try {
    // Get session from request (server-side)
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      throw new Error('No authorization header')
    }

    const token = authHeader.substring(7)
    const supabase = supabaseAdmin;

    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      throw new Error('Invalid token')
    }

    const { isAdmin, user: adminUser } = await verifyAdminAccess(user.id)

    if (!isAdmin || !adminUser) {
      throw new Error('Admin access required')
    }

    return adminUser
  } catch (error) {
    throw new Error('Authentication failed')
  }
}






