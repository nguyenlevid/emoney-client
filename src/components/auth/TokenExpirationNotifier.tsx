import { createSignal, onMount, Show } from 'solid-js';
import { authStore } from '@/lib/auth/authStore';

interface TokenExpirationNotifierProps {
  onLogout?: () => void;
}

export function TokenExpirationNotifier(props: TokenExpirationNotifierProps) {
  const [showMessage, setShowMessage] = createSignal(false);
  const [timeLeft, setTimeLeft] = createSignal(0);

  // Check token expiration periodically
  let checkInterval: number;
  let countdownInterval: number;

  const checkTokenExpiration = async () => {
    if (!authStore.isAuthenticated) return;

    // TODO: Implement authStore.checkTokenValidity() method
    // For now, token validation is disabled
    return;

    // try {
    //   const isValid = await authStore.checkTokenValidity();
    //   if (!isValid) {
    //     // Token expired - show notification and logout
    //     setShowMessage(true);
    //     setTimeLeft(5); // 5 second countdown

    //     countdownInterval = window.setInterval(() => {
    //       setTimeLeft((prev) => {
    //         if (prev <= 1) {
    //           window.clearInterval(countdownInterval);
    //           handleLogout();
    //           return 0;
    //         }
    //         return prev - 1;
    //       });
    //     }, 1000);
    //   }
    // } catch (error) {
    //   console.warn('Token validation failed:', error);
    //   // On network error, don't auto-logout immediately
    // }
  };

  const handleLogout = () => {
    setShowMessage(false);
    authStore.clearAuth();
    props.onLogout?.();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const handleStayLoggedIn = () => {
    setShowMessage(false);
    if (countdownInterval) {
      window.clearInterval(countdownInterval);
    }
    // Redirect to login to get a fresh token
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  onMount(() => {
    // Check token every 30 seconds
    checkInterval = window.setInterval(checkTokenExpiration, 30000);

    // Cleanup on unmount
    return () => {
      if (checkInterval) window.clearInterval(checkInterval);
      if (countdownInterval) window.clearInterval(countdownInterval);
    };
  });

  return (
    <Show when={showMessage()}>
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div class="mx-4 max-w-md rounded-lg bg-white p-6 shadow-xl">
          <div class="mb-4 flex items-center">
            <div class="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
              <svg
                class="h-6 w-6 text-amber-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900">
                Session Expired
              </h3>
              <p class="text-sm text-gray-600">
                Your login session has expired for security reasons.
              </p>
            </div>
          </div>

          <p class="mb-6 text-sm text-gray-700">
            You will be automatically logged out in{' '}
            <span class="font-semibold text-red-600">{timeLeft()}</span>{' '}
            seconds.
          </p>

          <div class="flex gap-3">
            <button
              onClick={handleStayLoggedIn}
              class="flex-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Log In Again
            </button>
            <button
              onClick={handleLogout}
              class="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Log Out Now
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
}
