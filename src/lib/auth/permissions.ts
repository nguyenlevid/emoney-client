// Permission utilities for role-based access control

export type UserRole = 'owner' | 'admin' | 'accountant' | 'viewer';

/**
 * Check if the user has permission to manage accounts
 * Based on the backend specification: owner and admin roles have CAN_MANAGE_ACCOUNTS permission
 */
export function canManageAccounts(role: UserRole | null | undefined): boolean {
  if (!role) return false;
  return role === 'owner' || role === 'admin';
}

/**
 * Check if the user can view accounts (all roles can view accounts)
 */
export function canViewAccounts(role: UserRole | null | undefined): boolean {
  if (!role) return false;
  return ['owner', 'admin', 'accountant', 'viewer'].includes(role);
}

/**
 * Check if the user can create transactions (accountant and above)
 */
export function canManageTransactions(
  role: UserRole | null | undefined
): boolean {
  if (!role) return false;
  return ['owner', 'admin', 'accountant'].includes(role);
}

/**
 * Check if the user can manage company settings (owner only)
 */
export function canManageCompany(role: UserRole | null | undefined): boolean {
  if (!role) return false;
  return role === 'owner';
}

/**
 * Get permission level description for UI display
 */
export function getPermissionDescription(
  role: UserRole | null | undefined
): string {
  switch (role) {
    case 'owner':
      return 'Full access to all company data and settings';
    case 'admin':
      return 'Can manage accounts and transactions, view reports';
    case 'accountant':
      return 'Can create/edit transactions, view accounts and reports';
    case 'viewer':
      return 'Read-only access to accounts and reports';
    default:
      return 'No access';
  }
}

/**
 * Get available actions based on role for UI elements
 */
export function getAvailableActions(role: UserRole | null | undefined) {
  return {
    canManageAccounts: canManageAccounts(role),
    canViewAccounts: canViewAccounts(role),
    canManageTransactions: canManageTransactions(role),
    canManageCompany: canManageCompany(role),
    canCreateAccounts: canManageAccounts(role),
    canEditAccounts: canManageAccounts(role),
    canDeleteAccounts: canManageAccounts(role),
    canViewReports: canViewAccounts(role), // All users who can view accounts can view reports
  };
}
