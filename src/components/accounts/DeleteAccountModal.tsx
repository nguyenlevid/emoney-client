import { createSignal, Show } from 'solid-js';
import { Button } from '@/components/ui/Button';
import type { Account } from '@/types';
import { apiClient } from '@/lib/api/client';
import { authStore } from '@/lib/auth/authStore';

interface DeleteAccountModalProps {
  isOpen: boolean;
  account: Account | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteAccountModal(props: DeleteAccountModalProps) {
  const [isDeleting, setIsDeleting] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [showForceConfirmation, setShowForceConfirmation] = createSignal(false);
  const [transactionMessage, setTransactionMessage] = createSignal<string>('');

  const handleInitialDelete = async () => {
    if (!props.account || !authStore.selectedCompany) return;

    setIsDeleting(true);
    setError(null);

    try {
      // First attempt - try normal delete (force: false)
      await apiClient.deleteAccount(props.account._id, {
        companyId: authStore.selectedCompany._id,
        force: false,
      });

      // Success - account was hard deleted
      props.onSuccess();
      props.onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete account';

      if (errorMessage.includes('transaction(s)')) {
        // Show force delete confirmation
        setTransactionMessage(errorMessage);
        setShowForceConfirmation(true);
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleForceDelete = async () => {
    if (!props.account || !authStore.selectedCompany) return;

    setIsDeleting(true);
    setError(null);

    try {
      await apiClient.deleteAccount(props.account._id, {
        companyId: authStore.selectedCompany._id,
        force: true,
      });

      props.onSuccess();
      props.onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete account';
      setError(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setError(null);
    props.onClose();
  };

  return (
    <Show when={props.isOpen && props.account}>
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div class="w-full max-w-md rounded-lg bg-white p-6">
          {/* Step 1: Initial Delete Confirmation */}
          <Show when={!showForceConfirmation()}>
            <div class="mb-4 flex items-center">
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
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-lg font-medium text-gray-900">
                  Delete Account
                </h3>
              </div>
            </div>

            <div class="mb-4">
              <p class="text-sm text-gray-600">
                Are you sure you want to delete the account "
                {props.account?.code} - {props.account?.name}"?
              </p>

              {/* System Account Warning */}
              <Show when={props.account?.isSystem}>
                <div class="mt-3 rounded-md border border-red-200 bg-red-50 p-3">
                  <div class="flex">
                    <div class="flex-shrink-0">
                      <svg
                        class="h-5 w-5 text-red-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    </div>
                    <div class="ml-3">
                      <p class="text-sm text-red-800">
                        <strong>System Account:</strong> This account is
                        required for business operations and cannot be deleted.
                      </p>
                    </div>
                  </div>
                </div>
              </Show>

              {/* Balance Warning */}
              <Show when={props.account?.balance !== 0}>
                <div class="mt-3 rounded-md border border-yellow-200 bg-yellow-50 p-3">
                  <div class="flex">
                    <div class="flex-shrink-0">
                      <svg
                        class="h-5 w-5 text-yellow-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    </div>
                    <div class="ml-3">
                      <p class="text-sm text-yellow-800">
                        This account has a non-zero balance of{' '}
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                        }).format(props.account?.balance || 0)}
                        .
                      </p>
                    </div>
                  </div>
                </div>
              </Show>
            </div>

            <Show when={error()}>
              <div class="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error()}
              </div>
            </Show>

            <div class="flex space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
                disabled={isDeleting()}
                class="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleInitialDelete}
                disabled={isDeleting() || props.account?.isSystem}
                class="flex-1 bg-red-600 hover:bg-red-700 focus:ring-red-500"
              >
                <Show when={isDeleting()}>
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
                Delete Account
              </Button>
            </div>
          </Show>

          {/* Step 2: Force Delete Confirmation */}
          <Show when={showForceConfirmation()}>
            <div class="mb-4 flex items-center">
              <div class="flex-shrink-0">
                <svg
                  class="h-6 w-6 text-yellow-600"
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
              </div>
              <div class="ml-3">
                <h3 class="text-lg font-medium text-gray-900">
                  Account Has Transaction History
                </h3>
              </div>
            </div>

            <div class="mb-4">
              <div class="rounded-md border border-yellow-200 bg-yellow-50 p-4">
                <p class="mb-3 text-sm text-yellow-800">
                  {transactionMessage()}
                </p>
                <p class="mb-3 text-sm text-yellow-800">
                  <strong>Options:</strong>
                </p>
                <ul class="list-inside list-disc space-y-1 text-sm text-yellow-800">
                  <li>
                    <strong>Deactivate:</strong> Account will be hidden from new
                    transactions but remain in reports
                  </li>
                  <li>
                    <strong>Cancel:</strong> Keep the account active and return
                    to the previous screen
                  </li>
                </ul>
              </div>
            </div>

            <Show when={error()}>
              <div class="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error()}
              </div>
            </Show>

            <div class="flex space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowForceConfirmation(false);
                  setTransactionMessage('');
                  setError(null);
                }}
                disabled={isDeleting()}
                class="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleForceDelete}
                disabled={isDeleting()}
                class="flex-1 bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500"
              >
                <Show when={isDeleting()}>
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
                Deactivate Account
              </Button>
            </div>
          </Show>
        </div>
      </div>
    </Show>
  );
}
