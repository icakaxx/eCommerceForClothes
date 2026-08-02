import { supabase } from './supabase';
import { logger } from './logger';

/**
 * Get current admin session
 */
export async function getAdminSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      logger.error('Failed to get admin session');
      return null;
    }

    if (!session) {
      return null;
    }

    const canAccess = session.user.user_metadata?.can_access || ['admin'];

    if (!canAccess.includes('admin')) {
      logger.warn('Admin session rejected: insufficient access');
      return null;
    }

    return session;
  } catch {
    logger.error('Failed to get admin session');
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
    const { error } = await supabase.auth.signOut();
    if (error) {
      logger.error('Admin sign-out failed');
      return { success: false, error: { message: 'Sign out failed' } };
    }
    return { success: true };
  } catch {
    logger.error('Admin sign-out failed');
    return { success: false, error: { message: 'Sign out failed' } };
  }
}

/**
 * Refresh session token
 */
export async function refreshSession() {
  try {
    const { data: { session }, error } = await supabase.auth.refreshSession();

    if (error) {
      logger.error('Session refresh failed');
      return null;
    }

    return session;
  } catch {
    logger.error('Session refresh failed');
    return null;
  }
}
