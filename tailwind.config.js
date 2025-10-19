/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'selector',
  theme: {
    extend: {
      colors: {
        // Next-generation finance theme - Light mode
        background: '#F8FAFC', // light background
        surface: '#FFFFFF', // white surfaces for cards
        surfaceHover: '#F1F5F9', // hover state for surfaces
        accent: '#3B82F6', // modern blue
        accentAlt: '#059669', // emerald accent
        accentHover: '#1D4ED8', // hover state for accent
        textPrimary: '#1E293B', // dark text
        textSecondary: '#64748B', // slate gray
        textMuted: '#94A3B8', // muted text
        success: '#22C55E',
        warning: '#FACC15',
        error: '#EF4444',
        border: '#E2E8F0', // subtle borders
        borderGlow: 'rgba(59, 130, 246, 0.3)', // glowing borders
      },
      fontFamily: {
        sans: ['Inter', 'Space Grotesk', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '1.5rem',
        glass: '1rem',
      },
      boxShadow: {
        glow: '0 0 20px rgba(0, 209, 255, 0.3)',
        'glow-lg': '0 0 40px rgba(0, 209, 255, 0.4)',
        'glow-purple': '0 0 20px rgba(107, 33, 168, 0.3)',
        glass: '0 8px 32px rgba(0, 0, 0, 0.3)',
        'glass-hover': '0 12px 48px rgba(0, 0, 0, 0.4)',
      },
      backdropBlur: {
        glass: '16px',
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite alternate',
        float: 'float 3s ease-in-out infinite',
        'scale-in': 'scale-in 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
      },
      keyframes: {
        'glow-pulse': {
          '0%': {
            boxShadow: '0 0 20px rgba(0, 209, 255, 0.3)',
            borderColor: 'rgba(0, 209, 255, 0.5)',
          },
          '100%': {
            boxShadow: '0 0 40px rgba(0, 209, 255, 0.6)',
            borderColor: 'rgba(0, 209, 255, 0.8)',
          },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'glass-gradient':
          'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
      },
    },
  },
  plugins: [],
};
