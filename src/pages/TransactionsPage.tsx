import {
  createSignal,
  For,
  Show,
  createMemo,
  createEffect,
  onCleanup,
} from 'solid-js';
import {
  createQuery,
  createMutation,
  useQueryClient,
} from '@tanstack/solid-query';
import MainLayout from '@/components/layout/MainLayout';
import { KobalteButton } from '@/components/ui/KobalteButton';
import { EmoneyInput } from '@/components/ui/EmoneyInput';
import { EmoneySelect } from '@/components/ui/EmoneySelect';
import { CreateExpenseModal } from '@/components/transactions/CreateExpenseModal';
import { CreateRevenueModal } from '@/components/transactions/CreateRevenueModal';
import { CreateJournalEntryModal } from '@/components/transactions/CreateJournalEntryModal';
import { EditTransactionModal } from '@/components/transactions/EditTransactionModal';
import { DeleteTransactionModal } from '@/components/transactions/DeleteTransactionModal';
import { apiClient } from '@/lib/api/client';
import { authStore } from '@/lib/auth/authStore';
import { toastStore } from '@/lib/stores/toastStore';
import type { Transaction, TransactionFilters } from '@/types';

export default function TransactionsPage() {
  const [filters, setFilters] = createSignal<Partial<TransactionFilters>>({
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0], // 90 days ago (extended to catch more transactions)
    endDate: new Date().toISOString().split('T')[0], // today
    accountId: undefined,
    contactId: undefined,
    sourceType: undefined,
    isReconciled: undefined,
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

  // Edit/Delete modals
  const [showEditModal, setShowEditModal] = createSignal(false);
  const [showDeleteModal, setShowDeleteModal] = createSignal(false);
  const [transactionToEdit, setTransactionToEdit] =
    createSignal<Transaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] =
    createSignal<Transaction | null>(null);

  // Query client for mutations
  const queryClient = useQueryClient();

  // Debounced search input
  const [searchInput, setSearchInput] = createSignal('');

  // Debounced search effect
  createEffect(() => {
    const search = searchInput();
    let timeoutId: number;

    if (typeof window !== 'undefined') {
      timeoutId = window.setTimeout(() => {
        setFilters((prev) => ({ ...prev, search }));
      }, 500); // 500ms debounce

      onCleanup(() => {
        if (timeoutId) window.clearTimeout(timeoutId);
      });
    }
  });

  // Fetch transactions
  const transactionsQuery = createQuery(() => ({
    queryKey: [
      'transactions',
      authStore.selectedCompany?._id,
      filters(),
    ] as const,
    queryFn: async () => {
      if (!authStore.selectedCompany) {
        return {
          transactions: [],
          pagination: { page: 1, limit: 50, total: 0, pages: 0 },
        };
      }

      const filterParams = {
        ...filters(),
        companyId: authStore.selectedCompany._id,
      };

      return await apiClient.getTransactions(
        filterParams as TransactionFilters
      );
    },
    enabled: !!authStore.selectedCompany,
  }));

  // Fetch accounts for dropdown
  const accountsQuery = createQuery(() => ({
    queryKey: ['accounts', authStore.selectedCompany?._id] as const,
    queryFn: async () => {
      if (!authStore.selectedCompany) return [];
      return apiClient.getAccounts(authStore.selectedCompany._id);
    },
    enabled: !!authStore.selectedCompany,
  }));

  // Sorted transactions
  const sortedTransactions = createMemo(() => {
    const queryData = transactionsQuery.data;
    const transactions = queryData?.transactions || [];

    return transactions.sort((a: Transaction, b: Transaction) => {
      const factor = sortOrder() === 'asc' ? 1 : -1;

      switch (sortBy()) {
        case 'date':
          return (
            factor * (new Date(a.date).getTime() - new Date(b.date).getTime())
          );
        case 'amount':
          return factor * (getTransactionAmount(a) - getTransactionAmount(b));
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
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Helper to safely get account name from entry
  const getAccountName = (entry: Transaction['entries'][0]): string => {
    if (entry.accountName) return entry.accountName;

    // Handle case where account is populated as an object
    if (typeof entry.account !== 'string') {
      const accountObj = entry.account as {
        name?: string;
        code?: string;
        _id?: string;
      };
      return accountObj.name || accountObj.code || accountObj._id || 'Unknown';
    }

    return entry.account;
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

  // Get the actual transaction amount (not doubled)
  // In double-entry accounting, debit total = credit total
  // So we take the max of either side to get the actual amount
  const getTransactionAmount = (transaction: Transaction) => {
    const totalDebit = transaction.entries.reduce(
      (sum, entry) => sum + (entry.debit || 0),
      0
    );
    const totalCredit = transaction.entries.reduce(
      (sum, entry) => sum + (entry.credit || 0),
      0
    );
    // Use the max since they should be equal in a balanced transaction
    return Math.max(totalDebit, totalCredit);
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

  // Reconciliation mutation
  const reconcileMutation = createMutation(() => ({
    mutationFn: async ({
      transactionId,
      isReconciled,
    }: {
      transactionId: string;
      isReconciled: boolean;
    }) => {
      return apiClient.reconcileTransaction(
        transactionId,
        isReconciled,
        authStore.selectedCompany?._id
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toastStore.success('Transaction reconciliation updated');
    },
    onError: (error) => {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to update reconciliation';
      toastStore.error(errorMessage);
    },
  }));

  // Edit transaction
  const handleEditTransaction = (transaction: Transaction) => {
    if (transaction.reconciledAt) {
      toastStore.error(
        'Cannot edit reconciled transactions. Please unreconcile first.'
      );
      return;
    }
    setTransactionToEdit(transaction);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setTransactionToEdit(null);
    transactionsQuery.refetch();
  };

  // Delete transaction
  const handleDeleteTransaction = (transaction: Transaction) => {
    if (transaction.reconciledAt) {
      toastStore.error(
        'Cannot delete reconciled transactions. Please unreconcile first.'
      );
      return;
    }
    setTransactionToDelete(transaction);
    setShowDeleteModal(true);
  };

  const handleDeleteSuccess = () => {
    setShowDeleteModal(false);
    setTransactionToDelete(null);
    transactionsQuery.refetch();
  };

  // Toggle reconciliation
  const handleToggleReconcile = async (transaction: Transaction) => {
    const newReconciledState = !transaction.isReconciled;
    reconcileMutation.mutate({
      transactionId: transaction._id,
      isReconciled: newReconciledState,
    });
  };

  return (
    <MainLayout>
      <div class="px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div class="mb-6 border-b border-gray-200 pb-4">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-3xl font-bold text-gray-900">Transactions</h1>
              <p class="mt-2 text-sm text-gray-600">
                View and manage all financial transactions
              </p>
            </div>
            <div class="flex space-x-2">
              <KobalteButton
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
              </KobalteButton>
              <KobalteButton
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
              </KobalteButton>
              <KobalteButton onClick={() => handleCreateTransaction('journal')}>
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
              </KobalteButton>
            </div>
          </div>
        </div>

        {/* Filters - Always visible */}
        <div class="mb-8 rounded-lg bg-white p-6 shadow">
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div>
              <EmoneyInput
                label="From Date"
                type="date"
                value={filters().startDate}
                onInput={(value: string) => updateFilters({ startDate: value })}
              />
            </div>
            <div>
              <EmoneyInput
                label="To Date"
                type="date"
                value={filters().endDate}
                onInput={(value: string) => updateFilters({ endDate: value })}
              />
            </div>
            <div>
              <EmoneySelect
                label="Account"
                placeholder="All Accounts"
                value={filters().accountId || ''}
                options={[
                  { value: '', label: 'All Accounts' },
                  ...(accountsQuery.data || []).map((account) => ({
                    value: account._id,
                    label: `${account.code} - ${account.name}`,
                  })),
                ]}
                onChange={(value) =>
                  updateFilters({
                    accountId: value || undefined,
                  })
                }
              />
            </div>
            <div>
              <EmoneySelect
                label="Type"
                placeholder="All Types"
                value={filters().sourceType || ''}
                options={[
                  { value: '', label: 'All Types' },
                  { value: 'MANUAL', label: 'Manual Entry' },
                  { value: 'INVOICE', label: 'Invoice' },
                  { value: 'EXPENSE', label: 'Expense' },
                  { value: 'PAYMENT', label: 'Payment' },
                ]}
                onChange={(value) => {
                  updateFilters({
                    sourceType: value
                      ? (value as 'MANUAL' | 'INVOICE' | 'EXPENSE' | 'PAYMENT')
                      : undefined,
                  });
                }}
              />
            </div>
            <div>
              <EmoneySelect
                label="Reconciled"
                placeholder="All Transactions"
                value={
                  filters().isReconciled === undefined
                    ? ''
                    : filters().isReconciled
                      ? 'true'
                      : 'false'
                }
                options={[
                  { value: '', label: 'All Transactions' },
                  { value: 'true', label: 'Reconciled' },
                  { value: 'false', label: 'Unreconciled' },
                ]}
                onChange={(value) => {
                  updateFilters({
                    isReconciled: value === '' ? undefined : value === 'true',
                  });
                }}
              />
            </div>
          </div>

          <div class="mt-4">
            <EmoneyInput
              label="Search Description"
              type="search"
              placeholder="Search transactions..."
              value={searchInput()}
              onInput={setSearchInput}
            />
          </div>
        </div>

        {/* Transactions Table */}
        <div class="relative overflow-hidden rounded-lg bg-white shadow">
          {/* Loading overlay for table only */}
          <Show when={transactionsQuery.isFetching}>
            <div class="absolute inset-0 z-10 flex items-center justify-center bg-white bg-opacity-75">
              <div class="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
            </div>
          </Show>

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
                <KobalteButton
                  onClick={() => handleCreateTransaction('journal')}
                >
                  Create Transaction
                </KobalteButton>
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
                    <th class="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                      Reconciled
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
                          {formatCurrency(getTransactionAmount(transaction))}
                        </td>
                        <td class="whitespace-nowrap px-6 py-4 text-center">
                          <label class="inline-flex cursor-pointer items-center">
                            <input
                              type="checkbox"
                              class="form-checkbox h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                              checked={transaction.isReconciled}
                              onChange={() =>
                                handleToggleReconcile(transaction)
                              }
                              disabled={reconcileMutation.isPending}
                              title={
                                transaction.isReconciled
                                  ? 'Unreconcile transaction'
                                  : 'Reconcile transaction'
                              }
                            />
                            <Show when={transaction.isReconciled}>
                              <svg
                                class="ml-1 h-4 w-4 text-green-600"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fill-rule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clip-rule="evenodd"
                                />
                              </svg>
                            </Show>
                          </label>
                        </td>
                        <td class="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                          <div class="flex items-center justify-end space-x-2">
                            <button
                              class="rounded px-2 py-1 text-blue-600 hover:bg-blue-50 hover:text-blue-900"
                              onClick={() =>
                                setSelectedTransaction(transaction)
                              }
                              title="View details"
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
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  stroke-width="2"
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            </button>
                            <button
                              class="rounded px-2 py-1 text-green-600 hover:bg-green-50 hover:text-green-900 disabled:cursor-not-allowed disabled:opacity-50"
                              onClick={() => handleEditTransaction(transaction)}
                              disabled={!!transaction.reconciledAt}
                              title={
                                transaction.reconciledAt
                                  ? 'Cannot edit reconciled transaction'
                                  : 'Edit transaction'
                              }
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
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                            <button
                              class="rounded px-2 py-1 text-red-600 hover:bg-red-50 hover:text-red-900 disabled:cursor-not-allowed disabled:opacity-50"
                              onClick={() =>
                                handleDeleteTransaction(transaction)
                              }
                              disabled={!!transaction.reconciledAt}
                              title={
                                transaction.reconciledAt
                                  ? 'Cannot delete reconciled transaction'
                                  : 'Delete transaction'
                              }
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
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </div>
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
                                    {getAccountName(entry)}
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
                <KobalteButton
                  variant="secondary"
                  onClick={() => setSelectedTransaction(null)}
                >
                  Close
                </KobalteButton>
              </div>
            </div>
          </div>
        </div>
      </Show>

      {/* Create Journal Entry Modal */}
      <CreateJournalEntryModal
        isOpen={showCreateModal() && modalType() === 'journal'}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleTransactionCreated}
      />

      {/* Create Expense Modal */}
      <CreateExpenseModal
        isOpen={showCreateModal() && modalType() === 'expense'}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleTransactionCreated}
      />

      {/* Create Revenue Modal */}
      <CreateRevenueModal
        isOpen={showCreateModal() && modalType() === 'revenue'}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleTransactionCreated}
      />

      {/* Edit Transaction Modal */}
      <Show when={transactionToEdit()}>
        {(transaction) => (
          <EditTransactionModal
            isOpen={showEditModal()}
            onClose={() => setShowEditModal(false)}
            onSuccess={handleEditSuccess}
            transaction={transaction()}
          />
        )}
      </Show>

      {/* Delete Transaction Modal */}
      <Show when={transactionToDelete()}>
        {(transaction) => (
          <DeleteTransactionModal
            isOpen={showDeleteModal()}
            onClose={() => setShowDeleteModal(false)}
            onSuccess={handleDeleteSuccess}
            transaction={transaction()}
          />
        )}
      </Show>
    </MainLayout>
  );
}
