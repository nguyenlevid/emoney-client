import type { Component, JSX } from 'solid-js';

interface EmoneyBadgeProps {
  children: JSX.Element;
  variant?: 'success' | 'warning' | 'error' | 'accent' | 'default';
  size?: 'sm' | 'md' | 'lg';
  class?: string;
}

export const EmoneyBadge: Component<EmoneyBadgeProps> = (props) => {
  const variants = {
    success: 'badge-success',
    warning: 'badge-warning',
    error: 'badge-error',
    accent: 'badge-accent',
    default:
      'bg-surface/70 text-textSecondary border border-border/50 px-3 py-1 rounded-full text-xs font-medium',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-3 py-1',
    lg: 'text-sm px-4 py-1.5',
  };

  return (
    <span
      class={`${variants[props.variant || 'default']} ${props.size ? sizes[props.size] : ''} inline-flex items-center ${props.class || ''}`}
    >
      {props.children}
    </span>
  );
};

export default EmoneyBadge;
