import { useAuth } from './useAuth';

/**
 * Hook to check user permissions
 * @returns {Object} Permission checking utilities
 */
export function usePermission() {
  const { user } = useAuth();

  /**
   * Check if user has a specific permission
   * @param {string} permission - Permission name (e.g., 'users.view')
   * @returns {boolean}
   */
  const can = (permission) => {
    if (!user) return false;
    
    // Super Admin has all permissions
    if (user.permissions?.includes('*')) {
      return true;
    }
    
    return user.permissions?.includes(permission) ?? false;
  };

  /**
   * Check if user has any of the given permissions
   * @param {string[]} permissions - Array of permission names
   * @returns {boolean}
   */
  const canAny = (permissions) => {
    return permissions.some(permission => can(permission));
  };

  /**
   * Check if user has all of the given permissions
   * @param {string[]} permissions - Array of permission names
   * @returns {boolean}
   */
  const canAll = (permissions) => {
    return permissions.every(permission => can(permission));
  };

  return { can, canAny, canAll };
}
