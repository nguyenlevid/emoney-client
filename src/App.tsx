import { Router, Route } from '@solidjs/router';
import { Suspense, onMount } from 'solid-js';
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query';
import LoginPage from '@/pages/auth/LoginPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import CreateCompanyPage from '@/pages/auth/CreateCompanyPage';
import DashboardPage from '@/pages/DashboardPage';
import AccountsPage from '@/pages/AccountsPage';
import TransactionsPage from '@/pages/TransactionsPage';
import FuturisticDemo from '@/pages/FuturisticDemo';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AuthRedirect } from '@/components/auth/AuthRedirect';
import MainLayout from '@/components/layout/MainLayout';
import { authStore } from '@/lib/auth/authStore';
import { TokenExpirationNotifier } from '@/components/auth/TokenExpirationNotifier';
import { ToastContainer } from '@/components/ui/ToastContainer';
import './index.css';

function App() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
      },
    },
  });

  // Initialize auth store when app loads
  onMount(() => {
    authStore.initializeAuth();
  });

  return (
    <QueryClientProvider client={queryClient}>
      <TokenExpirationNotifier />
      <ToastContainer />
      <Router>
        <Suspense
          fallback={
            <div class="flex min-h-screen items-center justify-center bg-background">
              <div class="text-center">
                <div class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-border border-t-accent shadow-glow" />
                <p class="font-medium text-textSecondary">
                  Initializing quantum systems...
                </p>
              </div>
            </div>
          }
        >
          <Route path="/" component={AuthRedirect} />
          <Route path="/login" component={LoginPage} />
          <Route path="/forgot-password" component={ForgotPasswordPage} />

          <Route
            path="/create-company"
            component={() => (
              <ProtectedRoute>
                <CreateCompanyPage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/dashboard"
            component={() => (
              <ProtectedRoute requireCompany>
                <DashboardPage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/accounts"
            component={() => (
              <ProtectedRoute requireCompany>
                <MainLayout>
                  <AccountsPage />
                </MainLayout>
              </ProtectedRoute>
            )}
          />
          <Route
            path="/transactions"
            component={() => (
              <ProtectedRoute requireCompany>
                <MainLayout>
                  <TransactionsPage />
                </MainLayout>
              </ProtectedRoute>
            )}
          />
          <Route
            path="/contacts"
            component={() => (
              <ProtectedRoute requireCompany>
                <MainLayout>
                  <div class="px-4 py-6 sm:px-6 lg:px-8">
                    <h1 class="text-3xl font-bold text-textPrimary">
                      Contacts
                    </h1>
                    <p class="mt-4 text-textSecondary">
                      Contact management coming soon...
                    </p>
                  </div>
                </MainLayout>
              </ProtectedRoute>
            )}
          />
          <Route
            path="/reports"
            component={() => (
              <ProtectedRoute requireCompany>
                <MainLayout>
                  <div class="px-4 py-6 sm:px-6 lg:px-8">
                    <h1 class="text-3xl font-bold text-textPrimary">Reports</h1>
                    <p class="mt-4 text-textSecondary">
                      Financial reports coming soon...
                    </p>
                  </div>
                </MainLayout>
              </ProtectedRoute>
            )}
          />
          <Route
            path="/settings"
            component={() => (
              <ProtectedRoute requireCompany>
                <MainLayout>
                  <div class="px-4 py-6 sm:px-6 lg:px-8">
                    <h1 class="text-3xl font-bold text-textPrimary">
                      Settings
                    </h1>
                    <p class="mt-4 text-textSecondary">
                      Settings configuration coming soon...
                    </p>
                  </div>
                </MainLayout>
              </ProtectedRoute>
            )}
          />
          <Route path="/demo" component={FuturisticDemo} />
        </Suspense>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
