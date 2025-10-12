import { For, Show } from 'solid-js';
import type { AccountTreeNode } from '@/types';

interface AccountTreeViewProps {
  nodes: AccountTreeNode[];
  onEditAccount?: (account: AccountTreeNode) => void;
  onDeleteAccount?: (account: AccountTreeNode) => void;
  canManage?: boolean;
  level?: number;
}

export function AccountTreeView(props: AccountTreeViewProps) {
  const level = () => props.level || 0;

  return (
    <div>
      <For each={props.nodes}>
        {(node) => (
          <div class="border-l-2 border-gray-200">
            <div
              class={`flex items-center justify-between px-4 py-2 hover:bg-gray-50 ${
                level() > 0 ? 'ml-' + level() * 4 : ''
              }`}
              style={{
                'padding-left': `${level() * 20 + 16}px`,
              }}
            >
              <div class="flex items-center space-x-3">
                {/* Hierarchy Indicator */}
                <Show when={level() > 0}>
                  <div class="flex h-4 w-4 items-center justify-center">
                    <div class="h-2 w-2 rounded-full bg-gray-300" />
                  </div>
                </Show>

                {/* Account Info */}
                <div class="flex items-center space-x-2">
                  <span class="font-mono text-sm text-gray-600">
                    {node.code}
                  </span>
                  <span class="font-medium text-gray-900">{node.name}</span>

                  {/* System Badge */}
                  <Show when={node.isSystem}>
                    <span class="inline-flex items-center rounded bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
                      System
                    </span>
                  </Show>

                  {/* Status Badge */}
                  <Show when={node.isActive === false}>
                    <span class="inline-flex items-center rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                      Inactive
                    </span>
                  </Show>

                  {/* Transaction Count */}
                  <Show
                    when={node.transactionCount && node.transactionCount > 0}
                  >
                    <span class="inline-flex items-center rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                      {node.transactionCount} txns
                    </span>
                  </Show>
                </div>
              </div>

              {/* Account Type & Actions */}
              <div class="flex items-center space-x-4">
                <span class="text-sm uppercase tracking-wide text-gray-500">
                  {node.accountType}
                </span>

                <Show when={props.canManage}>
                  <div class="flex space-x-2">
                    <button
                      class="text-sm text-blue-600 hover:text-blue-900"
                      onClick={() => props.onEditAccount?.(node)}
                    >
                      Edit
                    </button>
                    <Show when={!node.isSystem}>
                      <button
                        class="text-sm text-red-600 hover:text-red-900"
                        onClick={() => props.onDeleteAccount?.(node)}
                      >
                        Delete
                      </button>
                    </Show>
                    <Show when={node.isSystem}>
                      <span class="text-sm text-gray-400">Protected</span>
                    </Show>
                  </div>
                </Show>
              </div>
            </div>

            {/* Render children recursively */}
            <Show when={node.children && node.children.length > 0}>
              <AccountTreeView
                nodes={node.children}
                onEditAccount={props.onEditAccount}
                onDeleteAccount={props.onDeleteAccount}
                canManage={props.canManage}
                level={level() + 1}
              />
            </Show>
          </div>
        )}
      </For>
    </div>
  );
}
