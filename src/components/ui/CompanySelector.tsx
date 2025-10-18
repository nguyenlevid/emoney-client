import {
  createSignal,
  For,
  Show,
  createResource,
  createEffect,
} from 'solid-js';
import type { Component } from 'solid-js';
import { authStore } from '@/lib/auth/authStore';
import type { Company } from '@/lib/auth/authStore';
import { useNavigate } from '@solidjs/router';
import { toastStore } from '@/lib/stores/toastStore';

interface CompanySelectorProps {
  class?: string;
}

export const CompanySelector: Component<CompanySelectorProps> = (props) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = createSignal(false);
  const [isLoading, setIsLoading] = createSignal(false);
  const [dropdownPosition, setDropdownPosition] = createSignal<
    'bottom' | 'top'
  >('bottom');

  // Fetch all user companies for the dropdown
  const [companies] = createResource(
    () => authStore.isAuthenticated && !authStore.isLoading,
    async (isReady) => {
      if (!isReady) return [];
      return await authStore.getAllUserCompanies();
    }
  );

  const handleCompanySelect = async (company: Company) => {
    setIsLoading(true);
    setIsOpen(false);

    try {
      const result = await authStore.setDefaultCompany(company._id);

      if (!result.success) {
        console.error('Failed to set default company:', result.error);
        toastStore.error(result.error || 'Failed to switch company');
        return;
      }

      toastStore.success(`Switched to ${company.name}`);
    } catch (error) {
      console.error('Error setting default company:', error);
      toastStore.error(
        error instanceof Error ? error.message : 'Failed to switch company'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Memoized computed values to prevent reactive loops
  const currentCompany = () => authStore.selectedCompany;

  const availableCompanies = () => companies() || [];

  // Filter out the currently selected company from the dropdown
  const otherCompanies = () => {
    const all = availableCompanies();
    const current = currentCompany();
    return all.filter((company) => company._id !== current?._id);
  };

  // Close dropdown when clicking outside and calculate position
  let dropdownRef: HTMLDivElement | undefined;
  let buttonRef: HTMLButtonElement | undefined;

  const calculateDropdownPosition = () => {
    if (!buttonRef) return;

    const rect = buttonRef.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    // If there's less than 200px below but more than 200px above, position on top
    if (spaceBelow < 200 && spaceAbove > 200) {
      setDropdownPosition('top');
    } else {
      setDropdownPosition('bottom');
    }
  };

  // Set up click outside handler
  createEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen()) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  });

  // Watch for changes in selected company and close dropdown
  let previousCompanyId: string | undefined;
  createEffect(() => {
    const selected = authStore.selectedCompany;
    const currentId = selected?._id;

    // Only close if company actually changed (not just dropdown opened)
    if (previousCompanyId && currentId !== previousCompanyId && isOpen()) {
      setIsOpen(false);
    }

    previousCompanyId = currentId;
  });

  return (
    <Show when={authStore.isAuthenticated}>
      <div class={`relative ${props.class || ''}`} ref={dropdownRef}>
        {/* Current Company Button - Futuristic Glass Design */}
        <button
          ref={buttonRef}
          onClick={() => {
            if (!isOpen()) {
              calculateDropdownPosition();
            }
            setIsOpen(!isOpen());
          }}
          disabled={isLoading() || companies.loading}
          class="card-futuristic group flex w-full max-w-full items-center gap-2 px-3 py-2.5 text-sm transition-all duration-300 ease-out hover:scale-[1.01] hover:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Show
            when={currentCompany()}
            fallback={
              <>
                {/* No Company Selected - Placeholder Icon */}
                <div class="relative flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full">
                  <div class="absolute inset-0 bg-gradient-to-br from-textSecondary/20 via-textSecondary/10 to-transparent" />
                  <div class="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent" />
                  <svg
                    class="relative z-10 h-4 w-4 text-textSecondary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>

                {/* Placeholder Text */}
                <div class="flex-1 text-left">
                  <div class="truncate text-base font-semibold text-textSecondary transition-colors duration-300 group-hover:text-accent">
                    Select Company
                  </div>
                  <div class="mt-0.5 text-xs text-textSecondary/70">
                    Choose an organization
                  </div>
                </div>
              </>
            }
          >
            {/* Company Icon */}
            <div class="relative flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-accent/20 bg-accent/10">
              <span class="relative z-10 text-sm font-bold text-textPrimary">
                {currentCompany()?.name.charAt(0).toUpperCase()}
              </span>
            </div>

            {/* Company Name with Gradient Text */}
            <div class="min-w-0 flex-1 text-left">
              <div class="truncate text-sm font-semibold text-textPrimary transition-colors duration-300 group-hover:text-accent">
                {currentCompany()?.name}
              </div>
              <div class="mt-0.5 truncate text-xs text-textSecondary">
                Active Organization
              </div>
            </div>
          </Show>

          {/* Loading Spinner or Chevron with Glow */}
          <div class="flex items-center">
            <Show
              when={isLoading() || companies.loading}
              fallback={
                <svg
                  class={`h-5 w-5 text-textSecondary transition-all duration-300 group-hover:text-accent ${isOpen() ? 'rotate-180 text-accent' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              }
            >
              <div class="h-5 w-5 animate-spin rounded-full border-2 border-textSecondary border-t-accent" />
            </Show>
          </div>
        </button>

        {/* Dropdown Menu - Futuristic Glass Panel */}
        <Show when={isOpen() && !isLoading() && !companies.loading}>
          <div
            class={`absolute left-0 right-0 z-50 ${
              dropdownPosition() === 'top'
                ? 'animate-slide-down bottom-full mb-3'
                : 'top-full mt-3 animate-slide-up'
            }`}
          >
            {/* Dropdown Container */}
            <div class="relative">
              {/* Main Dropdown Container */}
              <div class="glass relative max-h-80 overflow-hidden overflow-y-auto rounded-glass border border-border shadow-lg backdrop-blur-glass">
                {/* Inner Gradient Overlay */}
                <div class="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-accent/5" />

                {/* Companies List - Always show only OTHER companies (not current) */}
                <div class="py-2">
                  <Show
                    when={otherCompanies().length > 0}
                    fallback={
                      <div class="relative px-4 py-6 text-center">
                        <div class="absolute inset-0 rounded-lg bg-gradient-to-br from-accent/5 via-transparent to-accentAlt/5 opacity-50" />
                        <div class="relative">
                          <div class="mx-auto mb-3 flex h-8 w-8 items-center justify-center rounded-full border border-textSecondary/20 bg-gradient-to-br from-textSecondary/20 to-textSecondary/10">
                            <svg
                              class="h-4 w-4 text-textSecondary"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                              />
                            </svg>
                          </div>
                          <div class="text-sm font-medium text-textSecondary">
                            No other organizations available
                          </div>
                          <div class="mt-1 text-xs text-textSecondary/70">
                            You only have access to one organization
                          </div>
                        </div>
                      </div>
                    }
                  >
                    <For each={otherCompanies()}>
                      {(company) => (
                        <button
                          onClick={() => handleCompanySelect(company)}
                          class="group relative flex w-full items-center gap-3 border-l-2 border-transparent px-4 py-3 text-sm transition-all duration-200 hover:border-l-accent hover:bg-surface/50 focus:bg-surface/50 focus:outline-none active:scale-[0.98]"
                        >
                          {/* Hover Glow Effect */}
                          <div class="absolute inset-0 rounded-r-lg bg-gradient-to-r from-accent/5 via-transparent to-accentAlt/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                          <div class="relative flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border border-border bg-surface transition-all duration-200 group-hover:border-accent/50 group-hover:bg-accent/5">
                            <span class="relative z-10 text-xs font-semibold text-textSecondary transition-colors duration-200 group-hover:text-accent">
                              {company.name.charAt(0).toUpperCase()}
                            </span>
                          </div>

                          <div class="relative flex-1 text-left">
                            <div class="truncate font-medium text-textPrimary transition-colors duration-300 group-hover:text-accent">
                              {company.name}
                            </div>
                          </div>

                          <svg
                            class="relative z-10 h-4 w-4 transform text-textSecondary opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:text-accent group-hover:opacity-100"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </button>
                      )}
                    </For>
                  </Show>

                  {/* Divider */}
                  <Show when={otherCompanies().length > 0}>
                    <div class="mx-4 my-2 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                  </Show>

                  {/* Create New Company Action */}
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      // TODO: Navigate to create company page or open modal
                      navigate('/create-company');
                    }}
                    class="group relative flex w-full items-center gap-3 border-l-2 border-transparent px-4 py-3 text-sm transition-all duration-200 hover:border-l-accent hover:bg-accent/5 focus:outline-none active:scale-[0.98]"
                  >
                    {/* Special Create Button Glow */}
                    <div class="absolute inset-0 rounded-r-lg bg-gradient-to-r from-accent/10 via-accentAlt/5 to-accent/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                    <div class="relative flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border border-accent/30 bg-accent/10 transition-all duration-200 group-hover:border-accent/60">
                      <svg
                        class="relative z-10 h-3.5 w-3.5 text-accent"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                    </div>

                    <div class="relative flex-1 text-left">
                      <div class="font-medium text-accent transition-colors duration-300 group-hover:text-accent/90">
                        Create New Organization
                      </div>
                      <div class="text-xs text-textSecondary transition-colors duration-300 group-hover:text-accent/60">
                        Set up a new business entity
                      </div>
                    </div>

                    <svg
                      class="relative z-10 h-4 w-4 transform text-accent opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Show>
      </div>
    </Show>
  );
};

export default CompanySelector;
