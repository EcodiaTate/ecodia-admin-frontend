import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#F5F5F0',
          dim: '#ECECE4',
          'container-low': '#EDEDE6',
          container: '#E4E4DB',
          'container-high': '#DBDBD2',
          'container-lowest': '#FAFAF6',
        },
        'on-surface': {
          DEFAULT: '#1A1C18',
          variant: '#3B3F36',
          muted: '#5C6356',
        },
        primary: {
          DEFAULT: '#1B7A3D',
          container: '#2ECC71',
        },
        secondary: {
          DEFAULT: '#10B981',
          container: '#D1FAE5',
        },
        tertiary: {
          DEFAULT: '#C8910A',
          container: '#FEF3C7',
        },
        error: {
          DEFAULT: '#DC2626',
          container: '#FEE2E2',
        },
        outline: {
          variant: '#B0B5A8',
        },
        gold: {
          DEFAULT: '#C8910A',
          bright: '#E5A80D',
          muted: '#A37808',
          glow: '#F5C842',
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
        glass: '0 20px 50px -12px rgba(27, 122, 61, 0.04)',
        'glass-elevated': '0 32px 64px -16px rgba(27, 122, 61, 0.06)',
        'glass-hover': '0 24px 56px -14px rgba(27, 122, 61, 0.06)',
        'glass-floating': '0 40px 80px -20px rgba(27, 122, 61, 0.07)',
        'glow-primary': '0 0 20px rgba(46, 204, 113, 0.15)',
        'glow-active': '0 0 30px rgba(46, 204, 113, 0.2), 0 0 60px rgba(46, 204, 113, 0.08)',
        'glow-gold': '0 0 20px rgba(200, 145, 10, 0.15)',
        'glow-gold-active': '0 0 30px rgba(200, 145, 10, 0.2), 0 0 60px rgba(200, 145, 10, 0.08)',
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
