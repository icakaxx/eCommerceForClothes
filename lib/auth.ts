import { supabase } from './supabase';

/**
 * Get current admin session
 */
export async function getAdminSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Error getting session:', error);
      return null;
    }

    if (!session) {
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ No active session found');
      }
      return null;
    }

    // Check if user has admin access
    const userRole = session.user.user_metadata?.role || 'admin';
    const canAccess = session.user.user_metadata?.can_access || ['admin'];

    if (!canAccess.includes('admin')) {
      console.warn('⚠️ User does not have admin access:', {
        email: session.user.email,
        role: userRole,
        canAccess
      });
      return null;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Admin session active:', {
        email: session.user.email,
        expiresAt: new Date(session.expires_at! * 1000).toLocaleString(),
        role: userRole
      });
    }

    return session;
  } catch (error) {
    console.error('❌ Failed to get session:', error);
    return null;
  }
}

/**
 * Check if user is authenticated as admin
 */
export async function isAdminAuthenticated(): Promise<boolean> {
  const session = await getAdminSession();
  return session !== null;
}

/**
 * Sign out admin user
 */
export async function signOutAdmin() {
  try {
    console.log('🚪 Signing out admin...');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('❌ Error signing out:', error);
      return { success: false, error };
    }
    console.log('✅ Successfully signed out');
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to sign out:', error);
    return { success: false, error };
  }
}

/**
 * Refresh session token
 */
export async function refreshSession() {
  try {
    const { data: { session }, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('Error refreshing session:', error);
      return null;
    }

    return session;
  } catch (error) {
    console.error('Failed to refresh session:', error);
    return null;
  }
}

