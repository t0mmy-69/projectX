// Admin authentication and authorization utilities

export const ADMIN_USER_IDS = [
  process.env.ADMIN_USER_ID || 'admin_default',
  'admin',
  'test-user-123',
  ...(process.env.EXTRA_ADMIN_IDS ? process.env.EXTRA_ADMIN_IDS.split(',') : []),
];

/**
 * Check if user is an admin
 */
export function isAdmin(userId?: string): boolean {
  return !!userId && ADMIN_USER_IDS.includes(userId);
}

/**
 * Verify admin access (throws if not admin)
 */
export function requireAdmin(userId?: string): void {
  if (!isAdmin(userId)) {
    throw new Error('Admin access required');
  }
}

/**
 * Get admin status info
 */
export function getAdminStatus() {
  return {
    admins_count: ADMIN_USER_IDS.length,
    admin_user_ids: ADMIN_USER_IDS.filter(id => id !== 'admin_default'),
  };
}
