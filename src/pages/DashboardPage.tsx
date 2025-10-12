import { createSignal, onMount, Show, For } from 'solid-js';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { authStore } from '@/lib/auth/authStore';
import { formatCurrency } from '@/lib/utils';

interface DashboardMetric {
  label: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: string;
}

interface RecentTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  account: string;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = createSignal<DashboardMetric[]>([]);
  const [recentTransactions, setRecentTransactions] = createSignal<
    RecentTransaction[]
  >([]);
  const [isLoading, setIsLoading] = createSignal(true);

  onMount(async () => {
    try {
      // Simulate loading dashboard data
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setMetrics([
        {
          label: 'Total Revenue',
          value: formatCurrency(125430.0),
          change: '+12.5%',
          changeType: 'positive',
          icon: 'trending-up',
        },
        {
          label: 'Total Expenses',
          value: formatCurrency(87650.0),
          change: '+8.2%',
          changeType: 'negative',
          icon: 'trending-down',
        },
        {
          label: 'Net Profit',
          value: formatCurrency(37780.0),
          change: '+15.3%',
          changeType: 'positive',
          icon: 'dollar-sign',
        },
        {
          label: 'Cash Balance',
          value: formatCurrency(94320.0),
          change: '+2.1%',
          changeType: 'positive',
          icon: 'credit-card',
        },
      ]);

      setRecentTransactions([
        {
          id: '1',
          date: '2025-10-12',
          description: 'Office Supplies - Staples',
          amount: -245.67,
          type: 'expense',
          account: 'Office Expenses',
        },
        {
          id: '2',
          date: '2025-10-11',
          description: 'Client Payment - ABC Corp',
          amount: 5420.0,
          type: 'income',
          account: 'Accounts Receivable',
        },
        {
          id: '3',
          date: '2025-10-10',
          description: 'Internet Bill - Comcast',
          amount: -149.99,
          type: 'expense',
          account: 'Utilities',
        },
        {
          id: '4',
          date: '2025-10-09',
          description: 'Service Revenue - XYZ Ltd',
          amount: 2850.0,
          type: 'income',
          account: 'Service Revenue',
        },
        {
          id: '5',
          date: '2025-10-08',
          description: 'Rent Payment',
          amount: -2500.0,
          type: 'expense',
          account: 'Rent Expense',
        },
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  });

  const getMetricIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      'trending-up': (
        <svg
          class="h-6 w-6 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
      ),
      'trending-down': (
        <svg
          class="h-6 w-6 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
          />
        </svg>
      ),
      'dollar-sign': (
        <svg
          class="h-6 w-6 text-blue-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
          />
        </svg>
      ),
      'credit-card': (
        <svg
          class="h-6 w-6 text-purple-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      ),
    };
    return icons[iconName] || icons['dollar-sign'];
  };

  return (
    <MainLayout>
      <div class="px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div class="mb-6 border-b border-gray-200 pb-4">
          <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p class="mt-2 text-sm text-gray-600">
            Welcome back, {authStore.user?.name?.first}! Here's what's happening
            with your business.
          </p>
          <Show when={authStore.selectedCompany}>
            <p class="mt-1 text-xs text-gray-500">
              {authStore.selectedCompany?.name}
            </p>
          </Show>
        </div>

        <Show
          when={!isLoading()}
          fallback={
            <div class="py-12 text-center">
              <div class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
              <p class="text-gray-600">Loading dashboard...</p>
            </div>
          }
        >
          {/* Metrics Grid */}
          <div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <For each={metrics()}>
              {(metric) => (
                <div class="rounded-lg border bg-white p-6 shadow">
                  <div class="flex items-center justify-between">
                    <div class="flex-1">
                      <p class="text-sm font-medium text-gray-500">
                        {metric.label}
                      </p>
                      <p class="mt-1 text-2xl font-bold text-gray-900">
                        {metric.value}
                      </p>
                      <div class="mt-2 flex items-center">
                        <span
                          class={`text-sm font-medium ${
                            metric.changeType === 'positive'
                              ? 'text-green-600'
                              : metric.changeType === 'negative'
                                ? 'text-red-600'
                                : 'text-gray-600'
                          }`}
                        >
                          {metric.change} from last month
                        </span>
                      </div>
                    </div>
                    <div class="ml-4">{getMetricIcon(metric.icon)}</div>
                  </div>
                </div>
              )}
            </For>
          </div>

          {/* Main Content Grid */}
          <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Recent Transactions */}
            <div class="rounded-lg border bg-white shadow lg:col-span-2">
              <div class="border-b border-gray-200 px-6 py-4">
                <h2 class="text-lg font-semibold text-gray-900">
                  Recent Transactions
                </h2>
              </div>
              <div class="p-6">
                <div class="space-y-4">
                  <For each={recentTransactions()}>
                    {(transaction) => (
                      <div class="flex items-center justify-between border-b border-gray-100 py-3 last:border-b-0">
                        <div class="flex flex-1 items-center">
                          <div
                            class={`flex h-8 w-8 items-center justify-center rounded-full ${
                              transaction.type === 'income'
                                ? 'bg-green-100'
                                : 'bg-red-100'
                            }`}
                          >
                            {transaction.type === 'income' ? (
                              <svg
                                class="h-4 w-4 text-green-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  stroke-width="2"
                                  d="M12 6v12m6-6H6"
                                />
                              </svg>
                            ) : (
                              <svg
                                class="h-4 w-4 text-red-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  stroke-width="2"
                                  d="M18 12H6"
                                />
                              </svg>
                            )}
                          </div>
                          <div class="ml-4 flex-1">
                            <p class="text-sm font-medium text-gray-900">
                              {transaction.description}
                            </p>
                            <p class="text-xs text-gray-500">
                              {transaction.account} • {transaction.date}
                            </p>
                          </div>
                        </div>
                        <div class="text-right">
                          <p
                            class={`text-sm font-medium ${
                              transaction.amount >= 0
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {formatCurrency(Math.abs(transaction.amount))}
                          </p>
                        </div>
                      </div>
                    )}
                  </For>
                </div>
                <div class="mt-6 text-center">
                  <Button variant="outline" size="sm">
                    View All Transactions
                  </Button>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div class="space-y-6">
              <div class="rounded-lg border bg-white shadow">
                <div class="border-b border-gray-200 px-6 py-4">
                  <h2 class="text-lg font-semibold text-gray-900">
                    Quick Actions
                  </h2>
                </div>
                <div class="p-6">
                  <div class="space-y-3">
                    <Button class="w-full justify-start" variant="outline">
                      <svg
                        class="mr-2 h-4 w-4"
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
                      New Transaction
                    </Button>
                    <Button class="w-full justify-start" variant="outline">
                      <svg
                        class="mr-2 h-4 w-4"
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
                      Add Contact
                    </Button>
                    <Button class="w-full justify-start" variant="outline">
                      <svg
                        class="mr-2 h-4 w-4"
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
                      Generate Report
                    </Button>
                  </div>
                </div>
              </div>

              {/* Account Balances Summary */}
              <div class="rounded-lg border bg-white shadow">
                <div class="border-b border-gray-200 px-6 py-4">
                  <h2 class="text-lg font-semibold text-gray-900">
                    Account Balances
                  </h2>
                </div>
                <div class="p-6">
                  <div class="space-y-4">
                    <div class="flex items-center justify-between">
                      <span class="text-sm text-gray-600">
                        Checking Account
                      </span>
                      <span class="text-sm font-medium text-gray-900">
                        {formatCurrency(45230.0)}
                      </span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-sm text-gray-600">Savings Account</span>
                      <span class="text-sm font-medium text-gray-900">
                        {formatCurrency(49090.0)}
                      </span>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-sm text-gray-600">
                        Accounts Receivable
                      </span>
                      <span class="text-sm font-medium text-gray-900">
                        {formatCurrency(12450.0)}
                      </span>
                    </div>
                    <div class="flex items-center justify-between border-t border-gray-200 pt-4">
                      <span class="text-sm font-medium text-gray-900">
                        Total Assets
                      </span>
                      <span class="text-sm font-bold text-gray-900">
                        {formatCurrency(106770.0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Show>
      </div>
    </MainLayout>
  );
}
