import { createSignal, Show, createMemo, For } from 'solid-js';
import { Modal } from '@/components/ui/Modal';
import { KobalteButton } from '@/components/ui/KobalteButton';
import { apiClient } from '@/lib/api/client';
import { authStore } from '@/lib/auth/authStore';
import { toastStore } from '@/lib/stores/toastStore';
import type { Transaction } from '@/types';

interface DeleteTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  transaction: Transaction;
}

export const DeleteTransactionModal = (props: DeleteTransactionModalProps) => {
  const [isSubmitting, setIsSubmitting] = createSignal(false);

  // Check if transaction is reconciled
  const isReconciled = createMemo(() => !!props.transaction?.reconciledAt);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDelete = async () => {
    if (isReconciled()) {
      toastStore.error('Cannot delete reconciled transactions');
      return;
    }

    setIsSubmitting(true);

    try {
      await apiClient.deleteTransaction(
        props.transaction._id,
        authStore.selectedCompany?._id
      );

      toastStore.success('Transaction deleted successfully');
      props.onSuccess();
      handleClose();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete transaction';
      console.error('Failed to delete transaction:', error);
      toastStore.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting()) {
      props.onClose();
    }
  };

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={handleClose}
      title="Delete Transaction"
      maxWidth="md"
    >
      <div class="space-y-4">
        {/* Reconciliation Warning */}
        <Show when={isReconciled()}>
          <div class="rounded-lg border-2 border-red-200 bg-red-50 p-4">
            <div class="flex items-start">
              <div class="flex-shrink-0">
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
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div class="ml-3 flex-1">
                <h3 class="text-sm font-medium text-red-800">
                  Cannot Delete Reconciled Transaction
                </h3>
                <p class="mt-1 text-sm text-red-700">
                  This transaction is reconciled and cannot be deleted. Please
                  unreconcile it first if you need to remove it.
                </p>
                <Show when={props.transaction.reconciledBy}>
                  <p class="mt-2 text-xs text-red-600">
                    Reconciled by: {props.transaction.reconciledBy} on{' '}
                    {new Date(props.transaction.reconciledAt!).toLocaleString()}
                  </p>
                </Show>
              </div>
            </div>
          </div>
        </Show>

        {/* Warning Message */}
        <Show when={!isReconciled()}>
          <div class="rounded-lg border-2 border-amber-200 bg-amber-50 p-4">
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <svg
                  class="h-6 w-6 text-amber-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div class="ml-3 flex-1">
                <h3 class="text-sm font-medium text-amber-800">
                  This action cannot be undone
                </h3>
                <p class="mt-1 text-sm text-amber-700">
                  Deleting this transaction will permanently remove it from your
                  records and reverse its effect on account balances.
                </p>
              </div>
            </div>
          </div>
        </Show>

        {/* Transaction Details */}
        <div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h4 class="mb-3 text-sm font-semibold text-gray-700">
            Transaction Details
          </h4>
          <dl class="space-y-2">
            <div class="flex justify-between text-sm">
              <dt class="font-medium text-gray-600">Date:</dt>
              <dd class="text-gray-900">
                {formatDate(props.transaction.date)}
              </dd>
            </div>
            <div class="flex justify-between text-sm">
              <dt class="font-medium text-gray-600">Description:</dt>
              <dd class="text-right text-gray-900">
                {props.transaction.description}
              </dd>
            </div>
            <Show when={props.transaction.reference}>
              <div class="flex justify-between text-sm">
                <dt class="font-medium text-gray-600">Reference:</dt>
                <dd class="text-gray-900">{props.transaction.reference}</dd>
              </div>
            </Show>
            <div class="flex justify-between border-t border-gray-300 pt-2 text-sm font-semibold">
              <dt class="text-gray-700">Amount:</dt>
              <dd class="text-gray-900">
                {formatCurrency(props.transaction.totalAmount)}
              </dd>
            </div>
          </dl>
        </div>

        {/* Account Impact */}
        <div class="rounded-lg border border-gray-200 bg-white p-4">
          <h4 class="mb-3 text-sm font-semibold text-gray-700">
            Account Impact
          </h4>
          <div class="space-y-2">
            <For each={props.transaction.entries}>
              {(entry) => {
                const accountName =
                  typeof entry.account === 'string'
                    ? entry.accountName || entry.account
                    : (entry.account as { name?: string })?.name || 'Unknown';

                return (
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-gray-600">{accountName}</span>
                    <div class="flex space-x-4">
                      <Show when={entry.debit > 0}>
                        <span class="font-medium text-red-600">
                          -{formatCurrency(entry.debit)}
                        </span>
                      </Show>
                      <Show when={entry.credit > 0}>
                        <span class="font-medium text-green-600">
                          +{formatCurrency(entry.credit)}
                        </span>
                      </Show>
                    </div>
                  </div>
                );
              }}
            </For>
          </div>
          <p class="mt-3 text-xs text-gray-500">
            These account balances will be reversed when the transaction is
            deleted.
          </p>
        </div>

        {/* Audit Info */}
        <Show when={props.transaction.createdBy}>
          <div class="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <p class="text-xs text-gray-600">
              <span class="font-medium">Created by:</span>{' '}
              {props.transaction.createdBy}
              <Show when={props.transaction.createdAt}>
                {' '}
                on {new Date(props.transaction.createdAt).toLocaleString()}
              </Show>
            </p>
          </div>
        </Show>

        {/* Actions */}
        <div class="flex justify-end space-x-3 border-t border-gray-200 pt-4">
          <KobalteButton
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting()}
          >
            Cancel
          </KobalteButton>
          <KobalteButton
            type="button"
            variant="danger"
            onClick={handleDelete}
            disabled={isSubmitting() || isReconciled()}
          >
            <Show when={!isSubmitting()} fallback="Deleting...">
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Delete Transaction
            </Show>
          </KobalteButton>
        </div>
      </div>
    </Modal>
  );
};
