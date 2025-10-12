import { createSignal, For, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { authStore, type Membership } from '@/lib/auth/authStore';

// ✅ COMPANY SELECTOR COMPONENT (Per Guide)
const CompanySelector = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = createSignal(false);

  const selectCompany = async (membership: Membership) => {
    setIsLoading(true);

    try {
      // Store selected company in global state (per guide)
      authStore.selectCompany(membership);

      // Navigate to dashboard (per guide)
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to select company:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewCompany = () => {
    navigate('/company/create');
  };

  // ✅ PROPER UI DESIGN (Following Guide Exactly)
  return (
    <div class="flex min-h-screen items-center justify-center bg-gray-50">
      <div class="w-full max-w-md rounded-lg bg-white p-6 shadow-md">
        <h2 class="mb-6 text-center text-2xl font-semibold">
          Select Your Workspace
        </h2>

        {/* Show message when no memberships */}
        <Show when={authStore.memberships.length === 0}>
          <div class="py-8 text-center">
            <p class="mb-4 text-gray-600">
              You don't belong to any companies yet.
            </p>
            <button
              class="rounded-md bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700"
              onClick={createNewCompany}
              disabled={isLoading()}
            >
              Create Your First Company
            </button>
          </div>
        </Show>

        {/* Company selection list */}
        <For each={authStore.memberships}>
          {(membership) => (
            <div
              class="mb-3 cursor-pointer rounded-md border p-4 transition-colors hover:border-blue-500 disabled:opacity-50"
              classList={{
                'opacity-50 cursor-not-allowed': isLoading(),
                'hover:border-blue-500': !isLoading(),
              }}
              onClick={() => !isLoading() && selectCompany(membership)}
            >
              <h3 class="text-lg font-medium">{membership.company.name}</h3>
              <p class="mt-1 text-sm text-gray-600">
                Role: <span class="capitalize">{membership.role}</span>
              </p>
              <p class="text-sm text-gray-600">
                Currency: {membership.company.settings.baseCurrency}
              </p>
              <p class="text-sm text-gray-600">
                Accounting:{' '}
                <span class="capitalize">
                  {membership.company.settings.accountingMethod}
                </span>
              </p>
              {membership.company.industry && (
                <p class="text-sm text-gray-500">
                  Industry: {membership.company.industry}
                </p>
              )}
            </div>
          )}
        </For>

        {/* Option to create new company (if user has existing companies) */}
        <Show when={authStore.memberships.length > 0}>
          <div class="mt-6 border-t pt-6">
            <button
              class="w-full rounded-md border-2 border-dashed border-gray-300 bg-gray-100 px-6 py-3 text-gray-700 transition-colors hover:bg-gray-200"
              onClick={createNewCompany}
              disabled={isLoading()}
            >
              + Create New Company
            </button>
          </div>
        </Show>

        {/* Loading state */}
        <Show when={isLoading()}>
          <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-25">
            <div class="rounded-lg bg-white p-6 text-center">
              <div class="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
              <p class="text-gray-600">Setting up workspace...</p>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
};

export default CompanySelector;
