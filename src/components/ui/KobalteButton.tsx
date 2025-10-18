import type { Component, JSX } from 'solid-js';
import { splitProps } from 'solid-js';
import { Button as KButton } from '@kobalte/core/button';

interface KobalteButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  class?: string;
  children: JSX.Element;
  onClick?: () => void;
}

export const KobalteButton: Component<KobalteButtonProps> = (props) => {
  const [local, others] = splitProps(props, [
    'variant',
    'size',
    'disabled',
    'type',
    'class',
    'children',
    'onClick',
  ]);

  const getVariantClasses = () => {
    switch (local.variant) {
      case 'primary':
        return `bg-blue-600 text-white shadow-sm hover:bg-blue-700 focus:ring-blue-500
                disabled:bg-blue-400`;
      case 'secondary':
        return `bg-gray-600 text-white shadow-sm hover:bg-gray-700 focus:ring-gray-500
                disabled:bg-gray-400`;
      case 'outline':
        return `bg-white text-gray-700 border border-gray-300 shadow-sm hover:bg-gray-50 focus:ring-blue-500
                disabled:bg-gray-50 disabled:text-gray-400`;
      case 'ghost':
        return `bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500
                disabled:text-gray-400 disabled:hover:bg-transparent`;
      case 'danger':
        return `bg-red-600 text-white shadow-sm hover:bg-red-700 focus:ring-red-500
                disabled:bg-red-400`;
      default:
        return `bg-blue-600 text-white shadow-sm hover:bg-blue-700 focus:ring-blue-500
                disabled:bg-blue-400`;
    }
  };

  const getSizeClasses = () => {
    switch (local.size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'lg':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2 text-sm';
    }
  };

  return (
    <KButton
      disabled={local.disabled}
      onClick={local.onClick}
      type={local.type}
      class={`inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 ${getVariantClasses()} ${getSizeClasses()} ${local.class || ''}`}
      {...others}
    >
      {local.children}
    </KButton>
  );
};

export default KobalteButton;
