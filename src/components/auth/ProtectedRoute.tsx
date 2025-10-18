import { Show, createEffect, createSignal } from 'solid-js';
import type { JSX } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { authStore } from '@/lib/auth/authStore';

interface ProtectedRouteProps {
  children: JSX.Element;
  requireCompany?: boolean;
}

export function ProtectedRoute(props: ProtectedRouteProps) {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = createSignal(true);

  // React to auth state changes instead of calling initializeAuth
  createEffect(() => {
    // Wait for auth initialization to complete
    if (authStore.isLoading) {
      return;
    }

    try {
      // Check authentication
      if (!authStore.isAuthenticated) {
        navigate('/login', { replace: true });
        setIsChecking(false);
        return;
      }

      // Check if company selection is required
      if (props.requireCompany && !authStore.selectedCompany) {
        // Auto-select first company if available
        if (authStore.memberships.length > 0) {
          const firstMembership = authStore.memberships[0];
          if (firstMembership?.company) {
            authStore.selectCompany(firstMembership);
          } else {
            navigate('/create-company', { replace: true });
            setIsChecking(false);
            return;
          }
        } else {
          navigate('/create-company', { replace: true });
          setIsChecking(false);
          return;
        }
      }

      setIsChecking(false);
    } catch (error) {
      console.error('Auth check failed:', error);
      navigate('/login', { replace: true });
      setIsChecking(false);
    }
  });

  return (
    <Show
      when={!isChecking()}
      fallback={
        <div class="flex min-h-screen items-center justify-center bg-gray-50">
          <div class="text-center">
            <div class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
            <p class="text-gray-600">Checking authentication...</p>
          </div>
        </div>
      }
    >
      <Show
        when={
          authStore.isAuthenticated &&
          (!props.requireCompany || authStore.selectedCompany)
        }
        fallback={null}
      >
        {props.children}
      </Show>
    </Show>
  );
}
