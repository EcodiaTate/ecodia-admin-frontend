import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#F7F6F3',
          dim: '#EEEDE8',
          'container-low': '#F0EFEB',
          container: '#E6E5E0',
          'container-high': '#DDDCD6',
          'container-lowest': '#FCFBF9',
        },
        'on-surface': {
          DEFAULT: '#151716',
          variant: '#2D3130',
          muted: '#5A6360',
        },
        primary: {
          DEFAULT: '#0D7C5A',
          container: '#14B882',
          light: '#34D399',
          dim: '#065F46',
        },
        secondary: {
          DEFAULT: '#0891B2',
          container: '#22D3EE',
          light: '#67E8F9',
        },
        tertiary: {
          DEFAULT: '#D97706',
          container: '#FBBF24',
          light: '#FDE68A',
        },
        error: {
          DEFAULT: '#DC2626',
          container: '#FCA5A5',
        },
        outline: {
          variant: '#B0B5A8',
        },
        gold: {
          DEFAULT: '#D97706',
          bright: '#F59E0B',
          muted: '#B45309',
          glow: '#FBBF24',
        },
        // Chromatic accents for data viz and ambient effects
        violet: {
          DEFAULT: '#7C3AED',
          light: '#A78BFA',
          glow: '#C4B5FD',
        },
        rose: {
          DEFAULT: '#E11D48',
          light: '#FB7185',
          glow: '#FECDD3',
        },
        sky: {
          DEFAULT: '#0284C7',
          light: '#38BDF8',
          glow: '#BAE6FD',
        },
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'display-lg': ['3.5rem', { lineHeight: '1.1', letterSpacing: '0.02em' }],
        'display-md': ['2.5rem', { lineHeight: '1.15', letterSpacing: '0.02em' }],
        'headline-md': ['1.75rem', { lineHeight: '1.3' }],
        'label-md': ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.05em' }],
        'label-sm': ['0.6875rem', { lineHeight: '1.4', letterSpacing: '0.05em' }],
      },
      borderRadius: {
        '2xl': '1.5rem',
        '3xl': '1.75rem',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '28': '7rem',
      },
      boxShadow: {
        glass: '0 20px 50px -12px rgba(13, 124, 90, 0.05), 0 8px 20px -8px rgba(8, 145, 178, 0.03)',
        'glass-elevated': '0 32px 64px -16px rgba(13, 124, 90, 0.07), 0 12px 28px -8px rgba(8, 145, 178, 0.04)',
        'glass-hover': '0 28px 60px -14px rgba(13, 124, 90, 0.08), 0 10px 24px -8px rgba(124, 58, 237, 0.03)',
        'glass-floating': '0 40px 80px -20px rgba(13, 124, 90, 0.09), 0 16px 36px -10px rgba(8, 145, 178, 0.05)',
        'glow-primary': '0 0 24px rgba(20, 184, 130, 0.18), 0 0 48px rgba(20, 184, 130, 0.06)',
        'glow-active': '0 0 30px rgba(20, 184, 130, 0.25), 0 0 60px rgba(34, 211, 238, 0.10)',
        'glow-gold': '0 0 24px rgba(217, 119, 6, 0.18), 0 0 48px rgba(251, 191, 36, 0.06)',
        'glow-gold-active': '0 0 30px rgba(217, 119, 6, 0.25), 0 0 60px rgba(251, 191, 36, 0.10)',
        'glow-violet': '0 0 24px rgba(124, 58, 237, 0.15), 0 0 48px rgba(167, 139, 250, 0.06)',
        'glow-cyan': '0 0 24px rgba(8, 145, 178, 0.18), 0 0 48px rgba(34, 211, 238, 0.06)',
      },
      /* backdropBlur removed — no blur effects in the app */
      keyframes: {
        'aurora-breathe': {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.06)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.15)' },
        },
        'float-drift': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'nav-breathe': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.5' },
          '50%': { transform: 'scale(1.2)', opacity: '1' },
        },
      },
      animation: {
        'aurora-breathe': 'aurora-breathe 8s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'float-drift': 'float-drift 7s ease-in-out infinite',
        'nav-breathe': 'nav-breathe 3s ease-in-out infinite',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
} satisfies Config
