import { createSignal, For, Show, createMemo } from 'solid-js';
import { createQuery } from '@tanstack/solid-query';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { apiClient } from '@/lib/api/client';
import { authStore } from '@/lib/auth/authStore';
import type { Transaction, TransactionFilters } from '@/types';

export default function TransactionsPage() {
  const [filters, setFilters] = createSignal<Partial<TransactionFilters>>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0], // today
    accountId: undefined,
    contactId: undefined,
    sourceType: undefined,
    search: '',
    page: 1,
    limit: 50,
  });

  const [sortBy, setSortBy] = createSignal<'date' | 'amount' | 'description'>(
    'date'
  );
  const [sortOrder, setSortOrder] = createSignal<'asc' | 'desc'>('desc');
  const [selectedTransaction, setSelectedTransaction] =
    createSignal<Transaction | null>(null);
  const [showCreateModal, setShowCreateModal] = createSignal(false);
  const [modalType, setModalType] = createSignal<
    'journal' | 'expense' | 'revenue'
  >('journal');

  // Fetch transactions
  const transactionsQuery = createQuery(() => ({
    queryKey: ['transactions', authStore.selectedCompany?._id, filters()],
    queryFn: () => {
      if (!authStore.selectedCompany)
        return Promise.resolve({
          data: [],
          pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
        });
      const filterParams = {
        ...filters(),
        companyId: authStore.selectedCompany._id,
      };
      return apiClient.getTransactions(filterParams as TransactionFilters);
    },
    enabled: !!authStore.selectedCompany,
  }));

  // Fetch accounts for dropdown
  const accountsQuery = createQuery(() => ({
    queryKey: ['accounts', authStore.selectedCompany?._id],
    queryFn: () =>
      authStore.selectedCompany
        ? apiClient.getAccounts(authStore.selectedCompany._id)
        : Promise.resolve([]),
    enabled: !!authStore.selectedCompany,
  }));

  // Sorted transactions
  const sortedTransactions = createMemo(() => {
    const queryData = transactionsQuery.data;
    const transactions = queryData && 'data' in queryData ? queryData.data : [];
    return transactions.sort((a: Transaction, b: Transaction) => {
      const factor = sortOrder() === 'asc' ? 1 : -1;

      switch (sortBy()) {
        case 'date':
          return (
            factor * (new Date(a.date).getTime() - new Date(b.date).getTime())
          );
        case 'amount':
          return factor * (a.totalAmount - b.totalAmount);
        case 'description':
          return factor * a.description.localeCompare(b.description);
        default:
          return 0;
      }
    });
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'MANUAL':
        return 'Manual Entry';
      case 'INVOICE':
        return 'Invoice';
      case 'EXPENSE':
        return 'Expense';
      case 'PAYMENT':
        return 'Payment';
      default:
        return type;
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'EXPENSE':
        return 'bg-red-100 text-red-800';
      case 'INVOICE':
        return 'bg-green-100 text-green-800';
      case 'PAYMENT':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const updateFilters = (newFilters: Partial<TransactionFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleSort = (field: 'date' | 'amount' | 'description') => {
    if (sortBy() === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleCreateTransaction = (type: 'journal' | 'expense' | 'revenue') => {
    setModalType(type);
    setShowCreateModal(true);
  };

  const handleTransactionCreated = () => {
    setShowCreateModal(false);
    transactionsQuery.refetch();
  };

  return (
    <MainLayout>
      <div class="space-y-6">
        {/* Header */}
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Transactions</h1>
            <p class="mt-1 text-gray-600">
              View and manage all financial transactions
            </p>
          </div>
          <div class="flex space-x-2">
            <Button
              variant="secondary"
              onClick={() => handleCreateTransaction('expense')}
            >
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
                  d="M20 12H4"
                />
              </svg>
              Add Expense
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleCreateTransaction('revenue')}
            >
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
              Add Revenue
            </Button>
            <Button onClick={() => handleCreateTransaction('journal')}>
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
              Journal Entry
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div class="rounded-lg bg-white p-6 shadow">
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-700">
                From Date
              </label>
              <Input
                type="date"
                value={filters().startDate}
                onInput={(e) =>
                  updateFilters({ startDate: e.currentTarget.value })
                }
              />
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-700">
                To Date
              </label>
              <Input
                type="date"
                value={filters().endDate}
                onInput={(e) =>
                  updateFilters({ endDate: e.currentTarget.value })
                }
              />
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-700">
                Account
              </label>
              <select
                class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters().accountId || ''}
                onChange={(e) =>
                  updateFilters({
                    accountId: e.currentTarget.value || undefined,
                  })
                }
              >
                <option value="">All Accounts</option>
                <For each={accountsQuery.data || []}>
                  {(account) => (
                    <option value={account._id}>
                      {account.code} - {account.name}
                    </option>
                  )}
                </For>
              </select>
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-700">
                Type
              </label>
              <select
                class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters().sourceType || ''}
                onChange={(e) => {
                  const value = e.currentTarget.value;
                  updateFilters({
                    sourceType: value
                      ? (value as 'MANUAL' | 'INVOICE' | 'EXPENSE' | 'PAYMENT')
                      : undefined,
                  });
                }}
              >
                <option value="">All Types</option>
                <option value="MANUAL">Manual Entry</option>
                <option value="INVOICE">Invoice</option>
                <option value="EXPENSE">Expense</option>
                <option value="PAYMENT">Payment</option>
              </select>
            </div>
          </div>

          <div class="mt-4">
            <label class="mb-2 block text-sm font-medium text-gray-700">
              Search Description
            </label>
            <Input
              type="text"
              placeholder="Search transactions..."
              value={filters().search || ''}
              onInput={(e) => updateFilters({ search: e.currentTarget.value })}
            />
          </div>
        </div>

        {/* Transactions Table */}
        <div class="overflow-hidden rounded-lg bg-white shadow">
          <Show
            when={!transactionsQuery.isLoading}
            fallback={
              <div class="p-8 text-center">
                <div class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
                <p class="text-gray-600">Loading transactions...</p>
              </div>
            }
          >
            <Show
              when={sortedTransactions().length > 0}
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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 class="mb-2 text-lg font-medium text-gray-900">
                    No transactions found
                  </h3>
                  <p class="mb-4 text-gray-500">
                    Try adjusting your filters or create your first transaction.
                  </p>
                  <Button onClick={() => handleCreateTransaction('journal')}>
                    Create Transaction
                  </Button>
                </div>
              }
            >
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th
                        class="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
                        onClick={() => handleSort('date')}
                      >
                        Date
                        <Show when={sortBy() === 'date'}>
                          <span class="ml-1">
                            {sortOrder() === 'asc' ? '↑' : '↓'}
                          </span>
                        </Show>
                      </th>
                      <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Type
                      </th>
                      <th
                        class="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
                        onClick={() => handleSort('description')}
                      >
                        Description
                        <Show when={sortBy() === 'description'}>
                          <span class="ml-1">
                            {sortOrder() === 'asc' ? '↑' : '↓'}
                          </span>
                        </Show>
                      </th>
                      <th
                        class="cursor-pointer px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
                        onClick={() => handleSort('amount')}
                      >
                        Amount
                        <Show when={sortBy() === 'amount'}>
                          <span class="ml-1">
                            {sortOrder() === 'asc' ? '↑' : '↓'}
                          </span>
                        </Show>
                      </th>
                      <th class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200 bg-white">
                    <For each={sortedTransactions()}>
                      {(transaction) => (
                        <tr class="hover:bg-gray-50">
                          <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                            {formatDate(transaction.date)}
                          </td>
                          <td class="whitespace-nowrap px-6 py-4">
                            <span
                              class={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getTransactionTypeColor(transaction.sourceType)}`}
                            >
                              {getTransactionTypeLabel(transaction.sourceType)}
                            </span>
                          </td>
                          <td class="px-6 py-4 text-sm text-gray-900">
                            <div class="max-w-xs truncate">
                              {transaction.description}
                            </div>
                            <Show when={transaction.reference}>
                              <div class="text-xs text-gray-500">
                                Ref: {transaction.reference}
                              </div>
                            </Show>
                          </td>
                          <td class="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                            {formatCurrency(transaction.totalAmount)}
                          </td>
                          <td class="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                            <button
                              class="mr-4 text-blue-600 hover:text-blue-900"
                              onClick={() =>
                                setSelectedTransaction(transaction)
                              }
                            >
                              View
                            </button>
                            <button
                              class="text-green-600 hover:text-green-900"
                              onClick={() => {
                                /* TODO: Edit transaction */
                              }}
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
              </div>
            </Show>
          </Show>
        </div>
      </div>

      {/* Transaction Details Modal */}
      <Show when={selectedTransaction()}>
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white">
            <div class="p-6">
              <div class="mb-6 flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-900">
                  Transaction Details
                </h3>
                <button
                  onClick={() => setSelectedTransaction(null)}
                  class="text-gray-400 hover:text-gray-600"
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

              <Show when={selectedTransaction()}>
                {(transaction) => (
                  <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700">
                          Date
                        </label>
                        <p class="text-sm text-gray-900">
                          {formatDate(transaction().date)}
                        </p>
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700">
                          Type
                        </label>
                        <span
                          class={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getTransactionTypeColor(transaction().sourceType)}`}
                        >
                          {getTransactionTypeLabel(transaction().sourceType)}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <p class="text-sm text-gray-900">
                        {transaction().description}
                      </p>
                    </div>

                    <Show when={transaction().reference}>
                      <div>
                        <label class="block text-sm font-medium text-gray-700">
                          Reference
                        </label>
                        <p class="text-sm text-gray-900">
                          {transaction().reference}
                        </p>
                      </div>
                    </Show>

                    <div>
                      <label class="mb-2 block text-sm font-medium text-gray-700">
                        Journal Entries
                      </label>
                      <div class="overflow-hidden rounded-md border">
                        <table class="min-w-full divide-y divide-gray-200">
                          <thead class="bg-gray-50">
                            <tr>
                              <th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                                Account
                              </th>
                              <th class="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500">
                                Debit
                              </th>
                              <th class="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500">
                                Credit
                              </th>
                            </tr>
                          </thead>
                          <tbody class="divide-y divide-gray-200 bg-white">
                            <For each={transaction().entries || []}>
                              {(entry) => (
                                <tr>
                                  <td class="px-4 py-2 text-sm text-gray-900">
                                    {entry.accountName || entry.account}
                                  </td>
                                  <td class="px-4 py-2 text-right text-sm text-gray-900">
                                    {entry.debit > 0
                                      ? formatCurrency(entry.debit)
                                      : '—'}
                                  </td>
                                  <td class="px-4 py-2 text-right text-sm text-gray-900">
                                    {entry.credit > 0
                                      ? formatCurrency(entry.credit)
                                      : '—'}
                                  </td>
                                </tr>
                              )}
                            </For>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div class="border-t pt-4">
                      <div class="flex items-center justify-between">
                        <span class="text-sm font-medium text-gray-700">
                          Total Amount:
                        </span>
                        <span class="text-lg font-semibold text-gray-900">
                          {formatCurrency(transaction().totalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </Show>

              <div class="mt-6 flex justify-end border-t pt-4">
                <Button
                  variant="secondary"
                  onClick={() => setSelectedTransaction(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Show>

      {/* Create Transaction Modal - TODO: Implement based on modalType */}
      <Show when={showCreateModal()}>
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div class="w-full max-w-lg rounded-lg bg-white p-6">
            <h3 class="mb-4 text-lg font-medium text-gray-900">
              Create{' '}
              {modalType() === 'journal'
                ? 'Journal Entry'
                : modalType() === 'expense'
                  ? 'Expense'
                  : 'Revenue'}
            </h3>
            <p class="mb-4 text-gray-600">
              Transaction form will be implemented here.
            </p>
            <div class="flex justify-end space-x-3">
              <Button
                variant="secondary"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleTransactionCreated}>
                Create Transaction
              </Button>
            </div>
          </div>
        </div>
      </Show>
    </MainLayout>
  );
}
