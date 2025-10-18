import type {
  ApiResponse,
  PaginatedResponse,
  LoginRequest,
  AuthSession,
  Company,
  CreateCompanyRequest,
  UpdateCompanyRequest,
  Account,
  AccountListResponse,
  BackendResponse,
  CreateAccountRequest,
  UpdateAccountRequest,
  Transaction,
  TransactionListResponse,
  CreateTransactionRequest,
  CreateManualTransactionRequest,
  CreateExpenseTransactionRequest,
  TransactionFilters,
  Contact,
  CreateContactRequest,
  UpdateContactRequest,
  ContactFilters,
  InviteUserRequest,
  ReportFilters,
  TrialBalance,
  IncomeStatement,
  BalanceSheet,
  GeneralLedger,
  CashFlow,
  Membership,
  CreateCompanyWithMembershipRequest,
} from '@/types';

class ApiClient {
  private baseURL: string;
  private timeout: number;

  constructor(baseURL: string = '/api', timeout: number = 30000) {
    this.baseURL = baseURL;
    this.timeout = timeout;
  }

  public async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    // Skip token expiration check for authentication endpoints
    const isAuthEndpoint =
      endpoint.startsWith('/auth/login') ||
      endpoint.startsWith('/auth/register') ||
      endpoint.startsWith('/auth/activate') ||
      endpoint.startsWith('/auth/reset-password') ||
      endpoint.startsWith('/auth/forgot-password') ||
      endpoint.startsWith('/auth/logout') ||
      endpoint.startsWith('/auth/request-new-password');

    // Check token expiration before making the request (client-side check)
    // Skip for auth endpoints where user is trying to log in/out
    if (!isAuthEndpoint) {
      const { isCurrentTokenExpired } = await import('@/lib/auth/tokenUtils');
      if (isCurrentTokenExpired()) {
        console.warn('Token expired (client-side check), triggering logout');
        this.handleAuthenticationFailure();
        throw new Error('Session expired. Please log in again.');
      }
    }

    const url = `${this.baseURL}${endpoint}`;

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), this.timeout);

    try {
      // Get CSRF token from cookies for unsafe methods
      const csrfToken = this.getCSRFToken();

      // For web clients, we rely on cookies (accessToken cookie) for authentication
      // No need to send Authorization header for web clients
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        credentials: 'include', // Include cookies (accessToken, csrfToken)
        headers: {
          'Content-Type': 'application/json',
          // Add CSRF token for unsafe methods (POST, PATCH, PUT, DELETE)
          ...(csrfToken &&
            ['POST', 'PATCH', 'PUT', 'DELETE'].includes(
              options.method || 'GET'
            ) && {
              'x-csrf-token': csrfToken,
            }),
          ...options.headers,
        },
      });

      window.clearTimeout(timeoutId);

      // Check for authentication/authorization errors
      if (response.status === 401) {
        const errorData = await response.json().catch(() => ({}));
        console.warn(
          'Authentication failed - token expired or invalid:',
          errorData
        );

        // Trigger logout on authentication failure
        this.handleAuthenticationFailure();

        throw new Error('Session expired. Please log in again.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Request failed:', {
          url,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          errorData,
          requestHeaders: {
            'Content-Type': 'application/json',
            ...(csrfToken &&
              ['POST', 'PATCH', 'PUT', 'DELETE'].includes(
                options.method || 'GET'
              ) && {
                'x-csrf-token': csrfToken,
              }),
            ...options.headers,
          },
        });
        throw new Error(
          errorData.error?.message ||
            `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();

      // Handle backend response format: {isOk: boolean, data: any}
      // Convert to frontend expected format: {success: boolean, data: any}
      if ('isOk' in data) {
        // Check for token expiration using error codes
        if (!data.isOk && data.data?.rcode) {
          const errorCode = data.data.rcode;

          // Token expired/invalid - trigger automatic logout
          if (errorCode === 4101 || errorCode === 4404) {
            // INVALID_ACCESS_TOKEN or USER_NOT_ACTIVATED
            console.warn(
              'Authentication failed - token expired or user deactivated:',
              errorCode
            );
            this.handleAuthenticationFailure();
            throw new Error('Session expired. Please log in again.');
          }
        }

        return {
          success: data.isOk,
          data: data.data,
          error: !data.isOk
            ? { code: 'API_ERROR', message: 'Request failed' }
            : undefined,
        } as ApiResponse<T>;
      }

      return data as ApiResponse<T>;
    } catch (error) {
      window.clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        throw error;
      }

      throw new Error('An unexpected error occurred');
    }
  }

  private getCSRFToken(): string | null {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'csrfToken') {
        return decodeURIComponent(value);
      }
    }
    return null;
  }

  // Authentication methods
  async login(credentials: LoginRequest): Promise<AuthSession> {
    const response = await this.request<{
      _id: string;
      email: string;
      username: string;
      name?: { first: string; last: string; middle?: string };
      phoneNumber?: string;
      birthDate?: string;
      appRole?: string;
      isActivated?: boolean;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Login failed');
    }

    const userData = response.data;

    // Check if user has proper appRole - this is critical for backend access
    if (!userData.appRole) {
      // Try to update user to have member role - this might be needed for first-time users
      try {
        await this.request(`/users/${userData._id}`, {
          method: 'PATCH',
          body: JSON.stringify({ appRole: 'member' }),
        });
        userData.appRole = 'member';
      } catch (error) {
        console.error('Failed to set user appRole:', error);
        throw new Error(
          'User account not properly activated. Please contact support.'
        );
      }
    }

    // Get user's companies - try to fetch companies they have access to
    let companies: AuthSession['companies'] = [];

    try {
      // Get companies list - this should return companies the user has access to
      const companiesResponse = await this.getCompanies(1, 50);

      if (companiesResponse.data && companiesResponse.data.length > 0) {
        companies = companiesResponse.data.map((company: Company) => ({
          role: 'owner' as const, // Default role - backend should determine actual role
          company: company._id,
          companyName: company.name,
          status: 'active' as const,
        }));
      } else {
        // No companies found, create a default one
        const defaultCompany = await this.createCompany({
          name: `${userData.name?.first || userData.username}'s Company`,
          email: userData.email,
          settings: {
            fiscalYearStart: '01-01',
            baseCurrency: 'USD',
            accountingMethod: 'accrual' as const,
            timezone: 'UTC',
          },
        });

        companies = [
          {
            role: 'owner',
            company: defaultCompany._id,
            companyName: defaultCompany.name,
            status: 'active',
          },
        ];
      }
    } catch (error) {
      console.error('Failed to set up user companies:', error);
      throw new Error('Failed to set up user account. Please contact support.');
    }

    const authSession: AuthSession = {
      user: {
        _id: userData._id,
        email: userData.email,
        firstName: userData.name?.first || userData.username || 'User',
        lastName: userData.name?.last || '',
        displayName: userData.name
          ? `${userData.name.first} ${userData.name.last}`.trim()
          : userData.username,
        isActive: userData.isActivated ?? true,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      },
      companies,
      permissions: [],
    };

    return authSession;
  }

  async logout(): Promise<void> {
    await this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async requestPasswordReset(email: string): Promise<void> {
    await this.request('/auth/request-new-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, password: string): Promise<void> {
    await this.request(`/auth/reset-password/${token}`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  }

  async inviteUser(request: InviteUserRequest): Promise<void> {
    await this.request('/auth/invite-user-to-activate-account', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Company methods
  async getCompanies(
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<Company>> {
    const response = await this.request<PaginatedResponse<Company>>(
      `/company/get?page=${page}&limit=${limit}`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch companies');
    }

    return response.data;
  }

  async getCompany(id: string): Promise<Company> {
    const response = await this.request<Company>(`/company/get/${id}`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch company');
    }

    return response.data;
  }

  // Get all companies for current user (for company selector)
  async getAllUserCompanies(): Promise<Company[]> {
    const response = await this.request<{
      data: Company[];
      pagination: { page: number; limit: number; total: number };
    }>('/company/get');

    if (!response.success || !response.data) {
      throw new Error(
        response.error?.message || 'Failed to fetch user companies'
      );
    }

    // Extract the companies array from the paginated response
    return response.data.data;
  }

  async createCompany(company: CreateCompanyRequest): Promise<Company> {
    const response = await this.request<Company>('/company/post', {
      method: 'POST',
      body: JSON.stringify(company),
    });

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create company');
    }

    return response.data;
  }

  async updateCompany(
    id: string,
    company: UpdateCompanyRequest
  ): Promise<Company> {
    const response = await this.request<Company>(`/company/patch/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(company),
    });

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update company');
    }

    return response.data;
  }

  // Set default company for the current user
  async setDefaultCompany(companyId: string): Promise<{
    message: string;
    defaultCompanyId: string;
  }> {
    const response = await this.request<{
      message: string;
      defaultCompanyId: string;
    }>(`/company/patch/set-default/${companyId}`, {
      method: 'PATCH',
    });

    if (!response.success || !response.data) {
      throw new Error(
        response.error?.message || 'Failed to set default company'
      );
    }

    return response.data;
  }

  // Account methods
  async getAccounts(companyId?: string): Promise<Account[]> {
    const queryParams = companyId ? `?companyId=${companyId}` : '';
    const response = await this.request<{
      accounts: Account[];
      hierarchy: Account[];
      meta: {
        total: number;
        active: number;
        inactive: number;
        system: number;
        withTransactions: number;
      };
    }>(`/accounts/get${queryParams}`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch accounts');
    }

    // Return just the accounts array for backward compatibility
    return response.data.accounts;
  }

  // Enhanced method to get accounts with hierarchy and metadata
  async getAccountsEnhanced(
    companyId?: string
  ): Promise<BackendResponse<AccountListResponse>> {
    const queryParams = companyId ? `?companyId=${companyId}` : '';
    const response = await this.request<BackendResponse<AccountListResponse>>(
      `/accounts/get${queryParams}`
    );

    if (!response.success || !response.data) {
      throw new Error(
        response.error?.message || 'Failed to fetch enhanced accounts'
      );
    }

    return response.data;
  }

  async getAccount(accountId: string, companyId?: string): Promise<Account> {
    const queryParams = companyId ? `?companyId=${companyId}` : '';
    const response = await this.request<Account>(
      `/accounts/get/${accountId}${queryParams}`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch account');
    }

    return response.data;
  }

  async createAccount(account: CreateAccountRequest): Promise<Account> {
    const response = await this.request<Account>('/accounts/post/create', {
      method: 'POST',
      body: JSON.stringify(account),
    });

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create account');
    }

    return response.data;
  }

  async updateAccount(
    accountId: string,
    account: UpdateAccountRequest
  ): Promise<Account> {
    const response = await this.request<Account>(
      `/accounts/patch/${accountId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(account),
      }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update account');
    }

    return response.data;
  }

  async deleteAccount(
    accountId: string,
    options: { companyId: string; force?: boolean } = {
      companyId: '',
      force: false,
    }
  ): Promise<{
    message: string;
    accountId: string;
    action: 'deleted' | 'deactivated';
    account?: Account;
  }> {
    const response = await this.request<{
      message: string;
      accountId: string;
      action: 'deleted' | 'deactivated';
      account?: Account;
    }>(`/accounts/delete/${accountId}`, {
      method: 'DELETE',
      body: JSON.stringify(options),
    });

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to delete account');
    }

    return response.data;
  }

  async seedChartOfAccounts(companyId: string): Promise<Account[]> {
    const response = await this.request<Account[]>(
      '/accounts/post/seed-chart',
      {
        method: 'POST',
        body: JSON.stringify({ companyId }),
      }
    );

    if (!response.success || !response.data) {
      throw new Error(
        response.error?.message || 'Failed to seed chart of accounts'
      );
    }

    return response.data;
  }

  // Personal account template methods removed - no longer supported
  // Migration note: All companies now use business chart of accounts only

  // Transaction methods
  async getTransactions(
    filters: TransactionFilters
  ): Promise<TransactionListResponse> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach((v) => params.append(key, v.toString()));
        } else {
          params.append(key, value.toString());
        }
      }
    });

    const response = await this.request<TransactionListResponse>(
      `/transactions/get?${params}`
    );

    if (!response.success || !response.data) {
      throw new Error(
        response.error?.message || 'Failed to fetch transactions'
      );
    }

    return response.data;
  }

  async getTransaction(
    transactionId: string,
    companyId?: string
  ): Promise<Transaction> {
    const queryParams = companyId ? `?companyId=${companyId}` : '';
    const response = await this.request<Transaction>(
      `/transactions/get/${transactionId}${queryParams}`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch transaction');
    }

    return response.data;
  }

  async createTransaction(
    transaction: CreateTransactionRequest
  ): Promise<Transaction> {
    const response = await this.request<Transaction>(
      '/transactions/post/create',
      {
        method: 'POST',
        body: JSON.stringify(transaction),
      }
    );

    if (!response.success || !response.data) {
      throw new Error(
        response.error?.message || 'Failed to create transaction'
      );
    }

    return response.data;
  }

  async createManualTransaction(
    transaction: CreateManualTransactionRequest
  ): Promise<Transaction> {
    const response = await this.request<Transaction>(
      '/transactions/post/manual',
      {
        method: 'POST',
        body: JSON.stringify(transaction),
      }
    );

    if (!response.success || !response.data) {
      throw new Error(
        response.error?.message || 'Failed to create manual transaction'
      );
    }

    return response.data;
  }

  async createExpenseTransaction(
    transaction: CreateExpenseTransactionRequest
  ): Promise<Transaction> {
    const response = await this.request<Transaction>(
      '/transactions/post/expense',
      {
        method: 'POST',
        body: JSON.stringify(transaction),
      }
    );

    if (!response.success || !response.data) {
      throw new Error(
        response.error?.message || 'Failed to create expense transaction'
      );
    }

    return response.data;
  }

  async updateTransaction(
    transactionId: string,
    transaction: Partial<CreateTransactionRequest>,
    companyId?: string
  ): Promise<Transaction> {
    const queryParams = companyId ? `?companyId=${companyId}` : '';
    const response = await this.request<Transaction>(
      `/transactions/patch/${transactionId}${queryParams}`,
      {
        method: 'PATCH',
        body: JSON.stringify(transaction),
      }
    );

    if (!response.success || !response.data) {
      throw new Error(
        response.error?.message || 'Failed to update transaction'
      );
    }

    return response.data;
  }

  async deleteTransaction(
    transactionId: string,
    companyId?: string
  ): Promise<void> {
    const queryParams = companyId ? `?companyId=${companyId}` : '';
    const response = await this.request<void>(
      `/transactions/delete/${transactionId}${queryParams}`,
      {
        method: 'DELETE',
      }
    );

    if (!response.success) {
      throw new Error(
        response.error?.message || 'Failed to delete transaction'
      );
    }
  }

  async reconcileTransaction(
    transactionId: string,
    isReconciled: boolean,
    companyId?: string
  ): Promise<Transaction> {
    const queryParams = companyId ? `?companyId=${companyId}` : '';
    const response = await this.request<Transaction>(
      `/transactions/post/reconcile/${transactionId}${queryParams}`,
      {
        method: 'POST',
        body: JSON.stringify({ isReconciled }),
      }
    );

    if (!response.success || !response.data) {
      throw new Error(
        response.error?.message || 'Failed to reconcile transaction'
      );
    }

    return response.data;
  }

  // Contact methods
  async getContacts(
    filters: ContactFilters
  ): Promise<PaginatedResponse<Contact>> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await this.request<PaginatedResponse<Contact>>(
      `/contacts/get?${params}`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch contacts');
    }

    return response.data;
  }

  async getContact(contactId: string): Promise<Contact> {
    const response = await this.request<Contact>(`/contacts/get/${contactId}`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch contact');
    }

    return response.data;
  }

  async createContact(contact: CreateContactRequest): Promise<Contact> {
    const response = await this.request<Contact>('/contacts/post/create', {
      method: 'POST',
      body: JSON.stringify(contact),
    });

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create contact');
    }

    return response.data;
  }

  async updateContact(
    contactId: string,
    contact: UpdateContactRequest
  ): Promise<Contact> {
    const response = await this.request<Contact>(
      `/contacts/patch/${contactId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(contact),
      }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update contact');
    }

    return response.data;
  }

  // Report methods
  async getTrialBalance(filters: ReportFilters): Promise<TrialBalance> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach((v) => params.append(key, v.toString()));
        } else {
          params.append(key, value.toString());
        }
      }
    });

    const response = await this.request<TrialBalance>(
      `/reporting/get/trial-balance?${params}`
    );

    if (!response.success || !response.data) {
      throw new Error(
        response.error?.message || 'Failed to fetch trial balance'
      );
    }

    return response.data;
  }

  async getIncomeStatement(filters: ReportFilters): Promise<IncomeStatement> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach((v) => params.append(key, v.toString()));
        } else {
          params.append(key, value.toString());
        }
      }
    });

    const response = await this.request<IncomeStatement>(
      `/reporting/get/income-statement?${params}`
    );

    if (!response.success || !response.data) {
      throw new Error(
        response.error?.message || 'Failed to fetch income statement'
      );
    }

    return response.data;
  }

  async getBalanceSheet(filters: ReportFilters): Promise<BalanceSheet> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach((v) => params.append(key, v.toString()));
        } else {
          params.append(key, value.toString());
        }
      }
    });

    const response = await this.request<BalanceSheet>(
      `/reporting/get/balance-sheet?${params}`
    );

    if (!response.success || !response.data) {
      throw new Error(
        response.error?.message || 'Failed to fetch balance sheet'
      );
    }

    return response.data;
  }

  async getGeneralLedger(filters: ReportFilters): Promise<GeneralLedger> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach((v) => params.append(key, v.toString()));
        } else {
          params.append(key, value.toString());
        }
      }
    });

    const response = await this.request<GeneralLedger>(
      `/reporting/get/general-ledger?${params}`
    );

    if (!response.success || !response.data) {
      throw new Error(
        response.error?.message || 'Failed to fetch general ledger'
      );
    }

    return response.data;
  }

  async getCashFlow(filters: ReportFilters): Promise<CashFlow> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach((v) => params.append(key, v.toString()));
        } else {
          params.append(key, value.toString());
        }
      }
    });

    const response = await this.request<CashFlow>(
      `/reporting/get/cash-flow?${params}`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch cash flow');
    }

    return response.data;
  }

  // Membership methods
  async getUserMemberships(userId: string): Promise<Membership[]> {
    const response = await this.request<Membership[]>(
      `/memberships/get/user/${userId}`
    );

    if (!response.success || !response.data) {
      throw new Error(
        response.error?.message || 'Failed to fetch user memberships'
      );
    }

    return response.data;
  }

  async createCompanyWithMembership(
    request: CreateCompanyWithMembershipRequest
  ): Promise<{
    company: Company;
    membership: Membership;
  }> {
    const response = await this.request<{
      company: Company;
      membership: Membership;
    }>('/memberships/post/create-company', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    if (!response.success || !response.data) {
      throw new Error(
        response.error?.message || 'Failed to create company with membership'
      );
    }

    return response.data;
  }
  private handleAuthenticationFailure(): void {
    // Import authStore dynamically to avoid circular dependency
    import('@/lib/auth/authStore').then(({ authStore }) => {
      console.log('Handling authentication failure - logging out user');

      // Only show notification if user was actually logged in
      const wasLoggedIn = authStore.isAuthenticated;

      // Show user-friendly notification only if user was logged in
      if (wasLoggedIn && typeof window !== 'undefined') {
        // Create a temporary notification
        const notification = document.createElement('div');
        notification.innerHTML = `
          <div class="fixed top-4 right-4 z-50 max-w-sm rounded-lg bg-red-50 p-4 shadow-lg border border-red-200">
            <div class="flex items-center">
              <div class="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                <svg class="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h4 class="text-sm font-semibold text-red-800">Session Expired</h4>
                <p class="text-xs text-red-700">Redirecting to login...</p>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(notification);

        // Remove notification after 3 seconds
        window.setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 3000);
      }

      // Clear auth and redirect only if was logged in
      if (wasLoggedIn) {
        authStore.clearAuth();

        // Redirect to login page after a short delay
        window.setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }, 1500);
      }
    });
  }
}

// Create singleton instance
export const apiClient = new ApiClient();
export default apiClient;
