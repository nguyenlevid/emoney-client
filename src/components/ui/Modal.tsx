import { Show, type JSX } from 'solid-js';
import { Portal } from 'solid-js/web';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: JSX.Element;
  maxWidth?:
    | 'sm'
    | 'md'
    | 'lg'
    | 'xl'
    | '2xl'
    | '3xl'
    | '4xl'
    | '5xl'
    | '6xl'
    | '7xl';
  closeOnOutsideClick?: boolean;
}

export const Modal = (props: ModalProps) => {
  const maxWidthClass = () => {
    switch (props.maxWidth || 'md') {
      case 'sm':
        return 'max-w-sm';
      case 'md':
        return 'max-w-md';
      case 'lg':
        return 'max-w-lg';
      case 'xl':
        return 'max-w-xl';
      case '2xl':
        return 'max-w-2xl';
      case '3xl':
        return 'max-w-3xl';
      case '4xl':
        return 'max-w-4xl';
      case '5xl':
        return 'max-w-5xl';
      case '6xl':
        return 'max-w-6xl';
      case '7xl':
        return 'max-w-7xl';
      default:
        return 'max-w-md';
    }
  };

  const handleBackdropClick = (e: MouseEvent) => {
    if (props.closeOnOutsideClick !== false && e.target === e.currentTarget) {
      props.onClose();
    }
  };

  return (
    <Show when={props.isOpen}>
      <Portal>
        {/* Backdrop with blur */}
        <div
          class="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
          onClick={handleBackdropClick}
        >
          {/* Modal Container with glass morphism */}
          <div
            class={`w-full ${maxWidthClass()} flex max-h-[90vh] animate-scale-in flex-col rounded-2xl border border-white/20 bg-white/95 shadow-2xl backdrop-blur-xl`}
          >
            {/* Header - Fixed */}
            <div class="flex items-center justify-between border-b border-gray-200/50 bg-white/50 px-6 py-4 backdrop-blur-xl">
              <h2 class="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-xl font-semibold text-transparent">
                {props.title}
              </h2>
              <button
                onClick={() => props.onClose()}
                class="group rounded-lg p-1.5 text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close"
              >
                <svg
                  class="h-5 w-5 transition-transform group-hover:rotate-90"
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

            {/* Content - Scrollable */}
            <div class="custom-scrollbar overflow-y-auto px-6 py-4">
              {props.children}
            </div>
          </div>
        </div>
      </Portal>
    </Show>
  );
};
