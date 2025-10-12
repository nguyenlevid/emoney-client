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
}

// ✅ PROPER AUTH STATE STRUCTURE
const [authState, setAuthState] = createStore<AuthState>({
  user: null,
  selectedCompany: null,
  userRole: null,
  memberships: [],
  isAuthenticated: false,
  isLoading: false,
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
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(
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
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('auth_user', JSON.stringify(userData));
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
    companyType: 'personal' | 'company';
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
    });

    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('auth_user');
      localStorage.removeItem('selected_company');
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
    if (typeof localStorage === 'undefined') return;

    try {
      const storedUser = localStorage.getItem('auth_user');
      const storedCompany = localStorage.getItem('selected_company');

      if (storedUser) {
        const user = JSON.parse(storedUser) as User;
        this.setUser(user);

        // Fetch fresh memberships
        const membershipsResponse = await apiClient.request(
          `/memberships/get/user/${user._id}`
        );
        if (membershipsResponse.success && membershipsResponse.data) {
          this.setMemberships(membershipsResponse.data as Membership[]);
        }

        // Restore selected company if available
        if (storedCompany) {
          const { company, role } = JSON.parse(storedCompany);
          setAuthState('selectedCompany', company);
          setAuthState('userRole', role);
        }
      }
    } catch (error) {
      // Clear invalid stored data
      this.clearAuth();
    }
  },
};

// Initialize auth on app start
if (typeof window !== 'undefined') {
  authStore.initializeAuth();
}

export default authStore;
