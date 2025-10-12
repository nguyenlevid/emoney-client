import { Show, createSignal } from 'solid-js';
import type { JSX } from 'solid-js';
import { A, useNavigate } from '@solidjs/router';
import { authStore } from '@/lib/auth/authStore';

interface LayoutProps {
  children: JSX.Element;
}

export function MainLayout(props: LayoutProps) {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = createSignal(false);

  const handleLogout = () => {
    authStore.logout();
    navigate('/login');
  };

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
    { name: 'Accounts', href: '/accounts', icon: 'accounts' },
    { name: 'Transactions', href: '/transactions', icon: 'transactions' },
    { name: 'Contacts', href: '/contacts', icon: 'contacts' },
    { name: 'Reports', href: '/reports', icon: 'reports' },
    { name: 'Settings', href: '/settings', icon: 'settings' },
  ];

  const getIcon = (iconName: string) => {
    const icons: Record<string, JSX.Element> = {
      dashboard: (
        <svg
          class="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
          />
        </svg>
      ),
      accounts: (
        <svg
          class="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      ),
      transactions: (
        <svg
          class="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      ),
      contacts: (
        <svg
          class="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      reports: (
        <svg
          class="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      settings: (
        <svg
          class="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
    };
    return icons[iconName] || icons.dashboard;
  };

  return (
    <div class="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        class={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white shadow-lg transition-transform duration-300 ease-in-out ${isSidebarOpen() ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} `}
      >
        <div class="flex h-16 items-center justify-between border-b border-gray-200 px-4">
          <div class="flex items-center">
            <h1 class="text-xl font-bold text-gray-900">E-Money</h1>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            class="rounded-md p-1 text-gray-400 hover:text-gray-500 lg:hidden"
          >
            <svg
              class="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <nav class="mt-5 px-2">
          <div class="space-y-1">
            {navigationItems.map((item) => (
              <A
                href={item.href}
                class="group flex items-center rounded-md px-2 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                activeClass="bg-blue-50 border-r-4 border-blue-600 text-blue-700"
              >
                {getIcon(item.icon)}
                <span class="ml-3">{item.name}</span>
              </A>
            ))}
          </div>
        </nav>

        {/* Company Info & User Menu */}
        <div class="absolute bottom-0 left-0 right-0 border-t border-gray-200 p-4">
          <Show when={authStore.selectedCompany}>
            <div class="mb-3 rounded-md bg-gray-50 p-2">
              <p class="text-xs font-medium text-gray-500">Current Company</p>
              <p class="text-sm font-semibold text-gray-900">
                {authStore.selectedCompany?.name}
              </p>
              <p class="text-xs text-gray-500">Role: {authStore.userRole}</p>
            </div>
          </Show>

          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <div class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600">
                <span class="text-sm font-medium text-white">
                  {authStore.user?.name?.first?.charAt(0) || 'U'}
                </span>
              </div>
              <div class="ml-2">
                <p class="text-sm font-medium text-gray-700">
                  {authStore.user?.name?.first} {authStore.user?.name?.last}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              class="p-1 text-gray-400 hover:text-gray-500"
              title="Sign out"
            >
              <svg
                class="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      <Show when={isSidebarOpen()}>
        <div
          class="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      </Show>

      {/* Main content */}
      <div class="lg:pl-64">
        {/* Top navigation */}
        <div class="sticky top-0 z-40 flex h-16 border-b border-gray-200 bg-white lg:hidden">
          <button
            onClick={() => setIsSidebarOpen(true)}
            class="border-r border-gray-200 px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
          >
            <svg
              class="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <div class="flex flex-1 justify-between px-4">
            <div class="flex flex-1">
              <div class="flex w-full md:ml-0">
                <div class="relative w-full text-gray-400 focus-within:text-gray-600">
                  <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center">
                    <svg
                      class="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </div>
                  <input
                    class="block h-full w-full border-transparent py-2 pl-8 pr-3 text-gray-900 placeholder-gray-500 focus:border-transparent focus:placeholder-gray-400 focus:outline-none focus:ring-0 sm:text-sm"
                    placeholder="Search transactions, accounts..."
                    type="search"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main class="flex-1">{props.children}</main>
      </div>
    </div>
  );
}

export default MainLayout;
