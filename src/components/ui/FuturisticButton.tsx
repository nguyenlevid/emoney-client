import type { Component, JSX } from 'solid-js';

interface FuturisticButtonProps {
  children: JSX.Element;
  class?: string;
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export const FuturisticButton: Component<FuturisticButtonProps> = (props) => {
  const variants = {
    primary: `btn-futuristic`,
    secondary: `px-6 py-3 bg-surface/80 border border-border/50 rounded-glass text-textPrimary font-medium
               hover:bg-surfaceHover/80 hover:border-borderGlow hover:shadow-glow 
               active:scale-95 transition-all duration-300`,
    accent: `px-6 py-3 bg-gradient-to-r from-accent to-accentAlt text-background font-medium rounded-glass
             hover:from-accent/90 hover:to-accentAlt/90 hover:shadow-glow-lg 
             active:scale-95 transition-all duration-300 shadow-glow`,
    ghost: `px-6 py-3 text-textPrimary font-medium rounded-glass border border-transparent
            hover:bg-surface/50 hover:border-border/30 
            active:scale-95 transition-all duration-300`,
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <button
      type={props.type || 'button'}
      disabled={props.disabled || props.loading}
      onClick={() => props.onClick?.()}
      class={`${variants[props.variant || 'primary']} ${props.size ? sizes[props.size].replace('px-6 py-3 text-base', '') : ''} ${props.disabled || props.loading ? 'cursor-not-allowed opacity-50' : ''} focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 focus:ring-offset-background ${props.class || ''}`}
    >
      {props.loading ? (
        <div class="flex items-center gap-2">
          <div class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span>Loading...</span>
        </div>
      ) : (
        props.children
      )}
    </button>
  );
};

export default FuturisticButton;
