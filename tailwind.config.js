/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Admin Layout System Tokens
      maxWidth: {
        'admin-container': '1400px', // Consistent max width for admin pages
      },
      spacing: {
        'admin-section': '1.5rem', // 24px - standard section gap
        'admin-section-lg': '2rem', // 32px - larger section gap
        'admin-card-padding': '1.5rem', // 24px - standard card padding
        'admin-card-padding-lg': '2rem', // 32px - larger card padding
      },
      borderRadius: {
        'admin-card': '0.75rem', // 12px - standard card radius
        'admin-card-lg': '1rem', // 16px - larger card radius
      },
      boxShadow: {
        'admin-card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'admin-card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      },
      fontSize: {
        'admin-h1': ['1.875rem', { lineHeight: '2.25rem', fontWeight: '600', letterSpacing: '-0.025em' }], // text-3xl font-semibold tracking-tight
        'admin-h2': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }], // text-xl font-semibold
        'admin-subtitle': ['0.875rem', { lineHeight: '1.25rem' }], // text-sm
      },
      // Color System - Semantic Tokens
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        surface: {
          DEFAULT: 'hsl(var(--surface))',
          '2': 'hsl(var(--surface-2))',
        },
        border: 'hsl(var(--border))',
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          hover: 'hsl(var(--primary-hover))',
          active: 'hsl(var(--primary-active))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
          bg: 'hsl(var(--success-bg))',
          text: 'hsl(var(--success-text))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
          bg: 'hsl(var(--warning-bg))',
          text: 'hsl(var(--warning-text))',
        },
        danger: {
          DEFAULT: 'hsl(var(--danger))',
          foreground: 'hsl(var(--danger-foreground))',
          bg: 'hsl(var(--danger-bg))',
          text: 'hsl(var(--danger-text))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))',
          bg: 'hsl(var(--info-bg))',
          text: 'hsl(var(--info-text))',
        },
        text: {
          DEFAULT: 'hsl(var(--text))',
          secondary: 'hsl(var(--text-secondary))',
        },
      },
    },
  },
  plugins: [],
}

