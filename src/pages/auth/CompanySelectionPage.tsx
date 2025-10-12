import { createSignal, For, Show, onMount } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { authStore, type Membership } from '@/lib/auth/authStore';
import { Button } from '@/components/ui/Button';

export default function CompanySelectionPage() {
  const navigate = useNavigate();
  const [companies, setCompanies] = createSignal<Membership[]>([]);
  const [isLoading, setIsLoading] = createSignal(true);
  const [selectedCompany, setSelectedCompany] = createSignal<Membership | null>(
    null
  );
  const [isSelecting, setIsSelecting] = createSignal(false);

  onMount(async () => {
    try {
      // Get memberships from auth store
      const userMemberships = authStore.memberships;
      setCompanies(userMemberships);

      // If only one company, auto-select it
      if (userMemberships.length === 1) {
        setSelectedCompany(userMemberships[0]);
      }
    } catch (error) {
      console.error('Failed to load companies:', error);
    } finally {
      setIsLoading(false);
    }
  });

  const handleCompanySelect = async () => {
    const selected = selectedCompany();
    if (!selected) return;

    setIsSelecting(true);
    try {
      authStore.selectCompany(selected);
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to select company:', error);
    } finally {
      setIsSelecting(false);
    }
  };

  const handleLogout = () => {
    authStore.logout();
    navigate('/login');
  };

  return (
    <div class="flex min-h-screen items-center justify-center bg-gray-50">
      <div class="w-full max-w-md space-y-8 p-8">
        <div class="text-center">
          <h1 class="mb-2 text-3xl font-bold text-gray-900">Select Company</h1>
          <p class="text-gray-600">
            Choose the company you'd like to work with
          </p>
          <Show when={authStore.user?.name?.first}>
            <p class="mt-2 text-sm text-gray-500">
              Welcome, {authStore.user!.name.first} {authStore.user!.name.last}
            </p>
          </Show>
        </div>

        <Show
          when={!isLoading()}
          fallback={
            <div class="text-center">
              <div class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
              <p class="text-gray-600">Loading companies...</p>
            </div>
          }
        >
          <Show
            when={companies().length > 0}
            fallback={
              <div class="rounded-md border border-yellow-200 bg-yellow-50 p-6 text-center">
                <svg
                  class="mx-auto mb-4 h-12 w-12 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <h3 class="mb-2 text-lg font-medium text-yellow-900">
                  No companies found
                </h3>
                <p class="mb-4 text-sm text-yellow-700">
                  You don't have access to any companies yet.
                </p>
                <p class="text-sm text-yellow-600">
                  Please contact your administrator to get access.
                </p>
              </div>
            }
          >
            <div class="space-y-4">
              <div class="space-y-3">
                <For each={companies()}>
                  {(membership) => (
                    <label class="block">
                      <div
                        class={`relative cursor-pointer rounded-lg border-2 p-4 transition-all ${
                          selectedCompany()?._id === membership._id
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        } `}
                      >
                        <input
                          type="radio"
                          name="company"
                          value={membership._id}
                          checked={selectedCompany()?._id === membership._id}
                          onChange={() => setSelectedCompany(membership)}
                          class="sr-only"
                        />
                        <div class="flex items-center">
                          <div class="flex-1">
                            <h3 class="font-semibold text-gray-900">
                              {membership.company.name}
                            </h3>
                            <p class="mt-1 text-sm text-gray-600">
                              Role: {membership.role}
                            </p>
                          </div>
                          <div
                            class={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                              selectedCompany()?._id === membership._id
                                ? 'border-blue-600 bg-blue-600'
                                : 'border-gray-300'
                            } `}
                          >
                            <Show
                              when={selectedCompany()?._id === membership._id}
                            >
                              <div class="h-2 w-2 rounded-full bg-white" />
                            </Show>
                          </div>
                        </div>
                        <div class="mt-2 text-xs text-gray-500">
                          Status: {membership.status}
                        </div>
                      </div>
                    </label>
                  )}
                </For>
              </div>

              <Button
                onClick={handleCompanySelect}
                disabled={!selectedCompany() || isSelecting()}
                loading={isSelecting()}
                class="w-full"
              >
                <Show when={isSelecting()} fallback="Continue">
                  Accessing company...
                </Show>
              </Button>
            </div>
          </Show>
        </Show>

        <div class="text-center">
          <button
            onClick={handleLogout}
            class="text-sm text-gray-600 underline hover:text-gray-900"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
