import { createStore } from 'solid-js/store';
import { apiClient } from '@/lib/api/client';

// ✅ PROPER MULTI-TENANT AUTH TYPES (Per Guide)
export interface User {
  _id: string;
  name: { first: string; last: string };
  email: string;
  username: string;
  phoneNumber?: string;
  isActivated: boolean;
}

export interface Company {
  _id: string;
  name: string;
  email?: string;
  settings: {
    baseCurrency: string;
    fiscalYearStart: string;
    accountingMethod: string;
    timezone?: string;
  };
  logo?: string;
  website?: string;
  industry?: string;
  isActive: boolean;
}

export interface Membership {
  _id: string;
  companyId: string;
  role: 'owner' | 'admin' | 'accountant' | 'viewer';
  status: 'invited' | 'active' | 'removed';
  joinedAt: string;
  company: Company;
}

export interface AuthState {
  user: User | null;
  selectedCompany: Company | null;
  userRole: string | null;
  memberships: Membership[];
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
}

// ✅ PROPER AUTH STATE STRUCTURE
const [authState, setAuthState] = createStore<AuthState>({
  user: null,
  selectedCompany: null,
  userRole: null,
  memberships: [],
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
});

export { authState };

// ✅ PROPER MULTI-TENANT AUTH STORE (Following Guide Exactly)
export const authStore = {
  // Getters (per guide)
  get user() {
    return authState.user;
  },

  get selectedCompany() {
    return authState.selectedCompany;
  },

  get userRole() {
    return authState.userRole;
  },

  get memberships() {
    return authState.memberships;
  },

  get isAuthenticated() {
    return authState.isAuthenticated;
  },

  get hasCompany() {
    return !!authState.selectedCompany;
  },

  get isLoading() {
    return authState.isLoading;
  },

  // Actions (per guide)
  setUser(user: User) {
    setAuthState('user', user);
    setAuthState('isAuthenticated', true);
  },

  setMemberships(memberships: Membership[]) {
    setAuthState('memberships', memberships);
  },

  setSelectedCompany(company: Company, role: string) {
    setAuthState('selectedCompany', company);
    setAuthState('userRole', role);

    // Store in localStorage for persistence
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      window.localStorage.setItem(
        'selected_company',
        JSON.stringify({ company, role })
      );
    }
  },

  // ✅ PROPER LOGIN FLOW (Following Guide Exactly)
  async login(credentials: { account: string; password: string }): Promise<{
    success: boolean;
    needsCompanySelection?: boolean;
    error?: string;
  }> {
    setAuthState('isLoading', true);

    try {
      // 1. Login user (gets user data, NOT company data)
      const loginResponse = await apiClient.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      if (!loginResponse.success || !loginResponse.data) {
        throw new Error(loginResponse.error?.message || 'Login failed');
      }

      const userData = loginResponse.data as User;
      this.setUser(userData);

      // Store user session
      if (
        typeof window !== 'undefined' &&
        typeof localStorage !== 'undefined'
      ) {
        window.localStorage.setItem('auth_user', JSON.stringify(userData));
      }

      // 2. Fetch memberships (CRITICAL STEP per guide)
      const membershipsResponse = await apiClient.request(
        `/memberships/get/user/${userData._id}`
      );

      if (membershipsResponse.success && membershipsResponse.data) {
        const memberships = membershipsResponse.data as Membership[];
        this.setMemberships(memberships);

        // If user has memberships, they need to select a company
        return {
          success: true,
          needsCompanySelection: memberships.length > 0,
        };
      } else {
        // No memberships - user needs to create a company
        return {
          success: true,
          needsCompanySelection: false,
        };
      }
    } catch (error) {
      this.clearAuth();
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    } finally {
      setAuthState('isLoading', false);
    }
  },

  // ✅ CREATE COMPANY WITH MEMBERSHIP
  async createCompany(companyData: {
    // companyType removed - all companies are business entities
    name: string;
    email?: string;
    phoneNumber?: string;
    website?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
    settings?: {
      baseCurrency?: string;
      fiscalYearStart?: string;
      accountingMethod?: 'accrual' | 'cash';
    };
  }): Promise<{ success: boolean; company?: Company; error?: string }> {
    try {
      // ✅ Use enhanced company creation endpoint
      const response = await apiClient.request<{
        company: Company;
        membership: Membership;
      }>('/company/post', {
        method: 'POST',
        body: JSON.stringify(companyData),
      });

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to create company');
      }

      const { company, membership } = response.data;

      // Add to memberships
      const newMembership: Membership = {
        _id: membership._id,
        companyId: company._id,
        role: membership.role,
        status: membership.status,
        joinedAt: membership.joinedAt,
        company: company,
      };

      setAuthState('memberships', [...authState.memberships, newMembership]);

      // Auto-select the new company
      this.setSelectedCompany(company, membership.role);

      return { success: true, company };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to create company',
      };
    }
  },

  // ✅ GET ALL USER COMPANIES for company selector
  async getAllUserCompanies(): Promise<Company[]> {
    try {
      const companies = await apiClient.getAllUserCompanies();
      return companies;
    } catch (error) {
      console.error('Failed to fetch user companies:', error);
      return [];
    }
  },

  // ✅ SET DEFAULT COMPANY (new backend feature)
  async setDefaultCompany(companyId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      setAuthState('isLoading', true);

      // First, call the API to set the default company
      await apiClient.setDefaultCompany(companyId);

      // After successfully setting the default company, refresh the user's memberships
      // because setting a default company might create a new membership or update existing ones
      if (authState.user) {
        const membershipsResponse = await apiClient.request(
          `/memberships/get/user/${authState.user._id}`
        );

        if (membershipsResponse.success && membershipsResponse.data) {
          const memberships = membershipsResponse.data as Membership[];
          this.setMemberships(memberships);

          // Find the membership for the newly selected company
          const membership = memberships.find((m) => m.companyId === companyId);
          if (membership) {
            this.setSelectedCompany(membership.company, membership.role);
          }
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to set default company:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      setAuthState('isLoading', false);
    }
  },

  // ✅ SELECT COMPANY (CRITICAL for multi-tenant)
  selectCompany(membership: Membership) {
    this.setSelectedCompany(membership.company, membership.role);
  },

  // ✅ CLEAR AUTH STATE
  clearAuth() {
    setAuthState({
      user: null,
      selectedCompany: null,
      userRole: null,
      memberships: [],
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,
    });

    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      window.localStorage.removeItem('auth_user');
      window.localStorage.removeItem('selected_company');
    }
  },

  // ✅ LOGOUT
  async logout() {
    try {
      await apiClient.request('/auth/logout', { method: 'POST' });
    } catch (error) {
      // Ignore logout errors, just clear local state
    } finally {
      this.clearAuth();
    }
  },

  // ✅ INITIALIZE AUTH (Check for stored session)
  async initializeAuth() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined')
      return;

    // Prevent multiple concurrent initialization calls
    if (this.isLoading || authState.isInitialized) {
      return;
    }

    setAuthState('isLoading', true);

    try {
      const storedUser = window.localStorage.getItem('auth_user');
      const storedCompany = window.localStorage.getItem('selected_company');

      if (storedUser) {
        const user = JSON.parse(storedUser) as User;
        this.setUser(user);

        try {
          // Fetch fresh memberships
          const membershipsResponse = await apiClient.request(
            `/memberships/get/user/${user._id}`
          );

          if (membershipsResponse.success && membershipsResponse.data) {
            const memberships = membershipsResponse.data as Membership[];
            this.setMemberships(memberships);

            // Restore selected company if available and still valid
            if (storedCompany) {
              const { company: storedCompanyData } = JSON.parse(storedCompany);

              // Find the matching membership with fresh company data
              const matchingMembership = memberships.find(
                (m) => m.companyId === storedCompanyData._id
              );

              if (matchingMembership) {
                // Use fresh company data from membership, not stale localStorage data
                setAuthState('selectedCompany', matchingMembership.company);
                setAuthState('userRole', matchingMembership.role);

                // Update localStorage with fresh data
                window.localStorage.setItem(
                  'selected_company',
                  JSON.stringify({
                    company: matchingMembership.company,
                    role: matchingMembership.role,
                  })
                );
              } else {
                // Stored company no longer accessible, clear it
                window.localStorage.removeItem('selected_company');
              }
            } else if (memberships.length > 0) {
              // No stored company, auto-select the first one
              const firstMembership = memberships[0];
              setAuthState('selectedCompany', firstMembership.company);
              setAuthState('userRole', firstMembership.role);

              // Store the auto-selected company
              window.localStorage.setItem(
                'selected_company',
                JSON.stringify({
                  company: firstMembership.company,
                  role: firstMembership.role,
                })
              );
            }
          } else {
            this.setMemberships([]);
          }
        } catch (apiError) {
          // If API call fails (e.g., token expired), clear auth and don't throw
          console.warn(
            'AuthStore - Failed to fetch memberships, clearing auth:',
            apiError
          );
          this.clearAuth();
        }
      }
    } catch (error) {
      console.error('AuthStore - Error in initializeAuth:', error);
      // Clear invalid stored data
      this.clearAuth();
    } finally {
      setAuthState('isLoading', false);
      setAuthState('isInitialized', true);
    }
  },
};

// Initialize auth on app start
if (typeof window !== 'undefined') {
  authStore.initializeAuth();
}

// Export utilities for external use
export default authStore;
