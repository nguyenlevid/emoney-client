import type { Component, JSX } from 'solid-js';

interface FuturisticCardProps {
  children: JSX.Element;
  class?: string;
  hover?: boolean;
  glow?: boolean;
}

export const FuturisticCard: Component<FuturisticCardProps> = (props) => {
  return (
    <div
      class={`card-futuristic ${props.hover !== false ? 'glass-hover' : ''} ${props.glow ? 'glow-border animate-glow-pulse' : ''} ${props.class || ''}`}
    >
      {props.children}
    </div>
  );
};

export default FuturisticCard;
