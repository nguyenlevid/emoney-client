import { createSignal, For, Show, createMemo } from 'solid-js';
import { createQuery } from '@tanstack/solid-query';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CreateAccountModal } from '@/components/accounts/CreateAccountModal';
import { EditAccountModal } from '@/components/accounts/EditAccountModal';
import { DeleteAccountModal } from '@/components/accounts/DeleteAccountModal';
import { apiClient } from '@/lib/api/client';
import { authStore } from '@/lib/auth/authStore';
import { canManageAccounts } from '@/lib/auth/permissions';
import type { Account, AccountType } from '@/types';

export default function AccountsPage() {
  const [searchTerm, setSearchTerm] = createSignal('');
  const [selectedType, setSelectedType] = createSignal<AccountType | 'ALL'>(
    'ALL'
  );
  const [showCreateModal, setShowCreateModal] = createSignal(false);
  const [showEditModal, setShowEditModal] = createSignal(false);
  const [showDeleteModal, setShowDeleteModal] = createSignal(false);
  const [selectedAccount, setSelectedAccount] = createSignal<Account | null>(
    null
  );

  // Permission checking
  const userPermissions = createMemo(() => {
    const role = authStore.userRole as
      | 'owner'
      | 'admin'
      | 'accountant'
      | 'viewer'
      | null;
    return {
      canManage: canManageAccounts(role),
    };
  });

  // Safe helper to get accounts array
  const getAccountsArray = (): Account[] => {
    const accounts = accountsQuery.data;
    return Array.isArray(accounts) ? accounts : [];
  };

  const accountsQuery = createQuery(() => ({
    queryKey: ['accounts', authStore.selectedCompany?._id],
    queryFn: () =>
      authStore.selectedCompany
        ? apiClient.getAccounts(authStore.selectedCompany._id)
        : Promise.resolve([]),
    enabled: !!authStore.selectedCompany,
  }));

  const handleAccountCreated = () => {
    setShowCreateModal(false);
    accountsQuery.refetch();
  };

  const handleEditAccount = (account: Account) => {
    setSelectedAccount(account);
    setShowEditModal(true);
  };

  const handleDeleteAccount = (account: Account) => {
    setSelectedAccount(account);
    setShowDeleteModal(true);
  };

  const handleAccountUpdated = () => {
    setShowEditModal(false);
    setSelectedAccount(null);
    accountsQuery.refetch();
  };

  const handleAccountDeleted = () => {
    setShowDeleteModal(false);
    setSelectedAccount(null);
    accountsQuery.refetch();
  };

  const [isSeedingAccounts, setIsSeedingAccounts] = createSignal(false);

  const handleSeedAccounts = async () => {
    if (!authStore.selectedCompany) return;

    setIsSeedingAccounts(true);
    try {
      await apiClient.seedChartOfAccounts(authStore.selectedCompany._id);
      accountsQuery.refetch();
    } catch {
      // Handle error silently or show user notification
      // Error: Failed to seed accounts
    } finally {
      setIsSeedingAccounts(false);
    }
  };

  // Filter and organize accounts
  const filteredAccounts = () => {
    const accounts = getAccountsArray();
    return accounts
      .filter((account) => {
        const matchesSearch =
          !searchTerm() ||
          account.name.toLowerCase().includes(searchTerm().toLowerCase()) ||
          account.code.includes(searchTerm());
        const matchesType =
          selectedType() === 'ALL' || account.accountType === selectedType();
        return matchesSearch && matchesType;
      })
      .sort((a, b) => a.code.localeCompare(b.code));
  };

  // Group accounts by type for hierarchical display
  const groupedAccounts = () => {
    return groupAccountsByType(filteredAccounts());
  };

  const groupAccountsByType = (accounts: Account[]) => {
    const groups: Record<AccountType, Account[]> = {
      ASSET: [],
      LIABILITY: [],
      EQUITY: [],
      REVENUE: [],
      EXPENSE: [],
    };

    accounts.forEach((account) => {
      groups[account.accountType].push(account);
    });

    return groups;
  };

  const accountTypeLabels: Record<AccountType, string> = {
    ASSET: 'Assets',
    LIABILITY: 'Liabilities',
    EQUITY: 'Equity',
    REVENUE: 'Revenue',
    EXPENSE: 'Expenses',
  };

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(balance);
  };

  const getBalanceColor = (account: Account) => {
    const isDebitNormal = ['ASSET', 'EXPENSE'].includes(account.accountType);
    const isPositive = account.balance >= 0;

    if (isDebitNormal) {
      return isPositive ? 'text-green-600' : 'text-red-600';
    } else {
      return isPositive ? 'text-blue-600' : 'text-red-600';
    }
  };

  return (
    <MainLayout>
      <div class="space-y-6">
        {/* Header */}
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Chart of Accounts</h1>
            <p class="mt-1 text-gray-600">Manage your accounting structure</p>
          </div>
          <div class="flex space-x-3">
            <Show
              when={
                userPermissions().canManage && filteredAccounts().length > 0
              }
            >
              <Button
                variant="secondary"
                onClick={handleSeedAccounts}
                disabled={isSeedingAccounts()}
              >
                <Show when={isSeedingAccounts()}>
                  <svg
                    class="-ml-1 mr-2 h-5 w-5 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    />
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                </Show>
                Seed Default Accounts
              </Button>
            </Show>
            <Show when={userPermissions().canManage}>
              <Button onClick={() => setShowCreateModal(true)}>
                <svg
                  class="mr-2 h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Account
              </Button>
            </Show>
          </div>
        </div>

        {/* Filters */}
        <div class="rounded-lg bg-white p-6 shadow">
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-700">
                Search Accounts
              </label>
              <Input
                type="text"
                placeholder="Search by name or account code..."
                value={searchTerm()}
                onInput={(e) => setSearchTerm(e.currentTarget.value)}
              />
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-700">
                Account Type
              </label>
              <select
                class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedType()}
                onChange={(e) =>
                  setSelectedType(e.currentTarget.value as AccountType | 'ALL')
                }
              >
                <option value="ALL">All Types</option>
                <option value="ASSET">Assets</option>
                <option value="LIABILITY">Liabilities</option>
                <option value="EQUITY">Equity</option>
                <option value="REVENUE">Revenue</option>
                <option value="EXPENSE">Expenses</option>
              </select>
            </div>
          </div>
        </div>

        {/* Account Statistics */}
        <Show when={getAccountsArray().length > 0}>
          <div class="rounded-lg bg-white p-6 shadow">
            <h2 class="mb-4 text-lg font-medium text-gray-900">
              Account Overview
            </h2>
            <div class="grid grid-cols-2 gap-4 md:grid-cols-5">
              <div class="text-center">
                <div class="text-2xl font-bold text-blue-600">
                  {getAccountsArray().length}
                </div>
                <div class="text-sm text-gray-600">Total Accounts</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-green-600">
                  {getAccountsArray().filter((a) => a.isActive).length}
                </div>
                <div class="text-sm text-gray-600">Active</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-red-600">
                  {getAccountsArray().filter((a) => !a.isActive).length}
                </div>
                <div class="text-sm text-gray-600">Inactive</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-purple-600">
                  {getAccountsArray().filter((a) => a.isSystem).length}
                </div>
                <div class="text-sm text-gray-600">System</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-orange-600">
                  {
                    getAccountsArray().filter(
                      (a) => a.transactionCount && a.transactionCount > 0
                    ).length
                  }
                </div>
                <div class="text-sm text-gray-600">With Transactions</div>
              </div>
            </div>
          </div>
        </Show>

        {/* Accounts List */}
        <Show
          when={!accountsQuery.isLoading}
          fallback={
            <div class="rounded-lg bg-white p-8 text-center shadow">
              <div class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
              <p class="text-gray-600">Loading accounts...</p>
            </div>
          }
        >
          <div class="overflow-hidden rounded-lg bg-white shadow">
            <Show
              when={filteredAccounts().length > 0}
              fallback={
                <div class="p-8 text-center">
                  <svg
                    class="mx-auto mb-4 h-12 w-12 text-gray-400"
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
                  <h3 class="mb-2 text-lg font-medium text-gray-900">
                    No accounts found
                  </h3>
                  <p class="mb-4 text-gray-500">
                    {searchTerm() || selectedType() !== 'ALL'
                      ? 'Try adjusting your filters or search term.'
                      : 'Get started by creating your first account or setting up a standard chart of accounts.'}
                  </p>
                  <Show
                    when={!searchTerm() && selectedType() === 'ALL'}
                    fallback={
                      <Button onClick={() => setShowCreateModal(true)}>
                        Create Account
                      </Button>
                    }
                  >
                    <div class="space-y-3">
                      <Button
                        onClick={handleSeedAccounts}
                        disabled={isSeedingAccounts()}
                        class="bg-green-600 hover:bg-green-700 focus:ring-green-500"
                      >
                        <Show when={isSeedingAccounts()}>
                          <svg
                            class="-ml-1 mr-3 h-5 w-5 animate-spin text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              class="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              stroke-width="4"
                            />
                            <path
                              class="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                        </Show>
                        Set Up Standard Accounts
                      </Button>
                      <div class="text-gray-400">or</div>
                      <Button
                        onClick={() => setShowCreateModal(true)}
                        variant="secondary"
                      >
                        Create Account Manually
                      </Button>
                    </div>
                  </Show>
                </div>
              }
            >
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Account
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Type
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Balance
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Status
                      </th>
                      <th class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200 bg-white">
                    <For
                      each={
                        Object.entries(groupedAccounts()) as [
                          AccountType,
                          Account[],
                        ][]
                      }
                    >
                      {([type, accounts]) => (
                        <Show when={accounts.length > 0}>
                          {/* Type Header */}
                          <tr class="bg-gray-50">
                            <td colspan="5" class="px-6 py-3">
                              <h3 class="text-sm font-semibold text-gray-900">
                                {accountTypeLabels[type]}
                              </h3>
                            </td>
                          </tr>
                          {/* Accounts in this type */}
                          <For each={accounts}>
                            {(account) => (
                              <tr class="hover:bg-gray-50">
                                <td class="px-6 py-4">
                                  <div>
                                    <div class="flex items-center gap-2 text-sm font-medium text-gray-900">
                                      <span
                                        class={
                                          !account.isActive
                                            ? 'text-gray-500 line-through'
                                            : ''
                                        }
                                      >
                                        {account.code} - {account.name}
                                      </span>
                                      <Show when={account.isSystem}>
                                        <span class="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                                          System
                                        </span>
                                      </Show>
                                    </div>
                                    <Show when={account.description}>
                                      <div class="mt-1 text-sm text-gray-500">
                                        {account.description}
                                      </div>
                                    </Show>
                                  </div>
                                </td>
                                <td class="whitespace-nowrap px-6 py-4">
                                  <span class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                                    {account.accountType}
                                  </span>
                                </td>
                                <td class="whitespace-nowrap px-6 py-4">
                                  <span
                                    class={`text-sm font-medium ${getBalanceColor(account)}`}
                                  >
                                    {formatBalance(account.balance)}
                                  </span>
                                </td>
                                <td class="whitespace-nowrap px-6 py-4">
                                  <span
                                    class={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                      account.isActive
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {account.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                </td>
                                <td class="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                  <Show when={userPermissions().canManage}>
                                    <button
                                      class="mr-4 text-blue-600 hover:text-blue-900"
                                      onClick={() => handleEditAccount(account)}
                                    >
                                      Edit
                                    </button>
                                    <Show when={!account.isSystem}>
                                      <button
                                        class="text-red-600 hover:text-red-900"
                                        onClick={() =>
                                          handleDeleteAccount(account)
                                        }
                                      >
                                        Delete
                                      </button>
                                    </Show>
                                    <Show when={account.isSystem}>
                                      <span class="text-sm text-gray-400">
                                        Protected
                                      </span>
                                    </Show>
                                  </Show>
                                  <Show when={!userPermissions().canManage}>
                                    <span class="text-sm text-gray-400">
                                      View Only
                                    </span>
                                  </Show>
                                </td>
                              </tr>
                            )}
                          </For>
                        </Show>
                      )}
                    </For>
                  </tbody>
                </table>
              </div>
            </Show>
          </div>
        </Show>
      </div>

      {/* Create Account Modal */}
      <CreateAccountModal
        isOpen={showCreateModal()}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleAccountCreated}
      />

      {/* Edit Account Modal */}
      <EditAccountModal
        isOpen={showEditModal()}
        account={selectedAccount()}
        onClose={() => {
          setShowEditModal(false);
          setSelectedAccount(null);
        }}
        onSuccess={handleAccountUpdated}
      />

      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={showDeleteModal()}
        account={selectedAccount()}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedAccount(null);
        }}
        onSuccess={handleAccountDeleted}
      />
    </MainLayout>
  );
}
