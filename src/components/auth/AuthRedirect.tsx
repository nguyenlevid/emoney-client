import { createEffect } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { authStore } from '@/lib/auth/authStore';

export function AuthRedirect() {
  const navigate = useNavigate();

  // React to changes in auth state instead of calling initializeAuth directly
  createEffect(() => {
    // Wait for auth initialization to complete
    if (authStore.isLoading) {
      console.log('AuthRedirect - Auth loading...');
      return;
    }

    console.log('AuthRedirect - Auth state changed:', {
      isAuthenticated: authStore.isAuthenticated,
      user: authStore.user,
      selectedCompany: authStore.selectedCompany,
      memberships: authStore.memberships,
      membershipsLength: authStore.memberships.length,
    });

    // If user is already authenticated, redirect them appropriately
    if (authStore.isAuthenticated) {
      if (authStore.selectedCompany) {
        // User has selected company, go to dashboard
        console.log(
          'AuthRedirect - Redirecting to dashboard (has selected company)'
        );
        navigate('/dashboard', { replace: true });
      } else if (authStore.memberships.length > 0) {
        // Auto-select first company and go to dashboard
        const firstMembership = authStore.memberships[0];
        if (firstMembership?.company) {
          console.log(
            'AuthRedirect - Auto-selecting first company and redirecting to dashboard'
          );
          authStore.selectCompany(firstMembership);
          navigate('/dashboard', { replace: true });
        } else {
          console.log(
            'AuthRedirect - First membership has no company, redirecting to create-company'
          );
          navigate('/create-company', { replace: true });
        }
      } else {
        // User has no companies, needs to create one
        console.log(
          'AuthRedirect - User has no memberships, redirecting to create-company'
        );
        navigate('/create-company', { replace: true });
      }
    } else {
      // Not authenticated, go to login
      console.log(
        'AuthRedirect - User not authenticated, redirecting to login'
      );
      navigate('/login', { replace: true });
    }
  });

  return (
    <div class="flex min-h-screen items-center justify-center bg-gray-50">
      <div class="text-center">
        <div class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
        <p class="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
