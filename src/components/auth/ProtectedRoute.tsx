import { Show, onMount, createSignal } from 'solid-js';
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

  onMount(async () => {
    try {
      // Initialize auth if not already done
      if (!authStore.isAuthenticated && !authStore.isLoading) {
        await authStore.initializeAuth();
      }

      // Check authentication
      if (!authStore.isAuthenticated) {
        navigate('/login');
        return;
      }

      // Check if company selection is required
      if (props.requireCompany && !authStore.selectedCompany) {
        navigate('/company-selector');
        return;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      navigate('/login');
    } finally {
      setIsChecking(false);
    }
  });

  return (
    <Show
      when={!isChecking()}
      fallback={
        <div class="flex min-h-screen items-center justify-center bg-gray-50">
          <div class="text-center">
            <div class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
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
