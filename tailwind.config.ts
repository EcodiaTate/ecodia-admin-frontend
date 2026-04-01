import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#F9F9F9',
          dim: '#F0F4F7',
          'container-low': '#F0F4F7',
          container: '#E8EDF1',
          'container-high': '#E1E9EE',
          'container-lowest': '#FFFFFF',
        },
        'on-surface': {
          DEFAULT: '#1A1C1C',
          variant: '#3D494C',
          muted: '#64748B',
        },
        primary: {
          DEFAULT: '#00687A',
          container: '#06B6D4',
        },
        secondary: {
          DEFAULT: '#10B981',
          container: '#D1FAE5',
        },
        tertiary: {
          DEFAULT: '#F59E0B',
          container: '#FEF3C7',
        },
        error: {
          DEFAULT: '#DC2626',
          container: '#FEE2E2',
        },
        outline: {
          variant: '#A9B4B9',
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
        glass: '0 20px 50px -12px rgba(0, 104, 122, 0.04)',
        'glass-elevated': '0 32px 64px -16px rgba(0, 104, 122, 0.06)',
        'glass-hover': '0 24px 56px -14px rgba(0, 104, 122, 0.06)',
        'glass-floating': '0 40px 80px -20px rgba(0, 104, 122, 0.07)',
        'glow-primary': '0 0 20px rgba(6, 182, 212, 0.15)',
        'glow-active': '0 0 30px rgba(6, 182, 212, 0.2), 0 0 60px rgba(6, 182, 212, 0.08)',
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
