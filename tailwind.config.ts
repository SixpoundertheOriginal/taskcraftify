import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        backgroundImage: {
          'dark-gradient': 'var(--gradient-dark)',
          'dark-glass-gradient': 'var(--gradient-dark-glass)',
          'dark-gradient-overlay': 'var(--gradient-overlay)',
        },
        status: {
          todo: 'hsl(var(--status-todo))',
          'in-progress': 'hsl(var(--status-in-progress))',
          done: 'hsl(var(--status-done))',
          archived: 'hsl(var(--status-archived))',
          backlog: 'hsl(var(--status-backlog))'
        },
        priority: {
          low: 'hsl(var(--priority-low))',
          medium: 'hsl(var(--priority-medium))',
          high: 'hsl(var(--priority-high))',
          urgent: 'hsl(var(--priority-urgent))'
        }
      },
      fontFamily: {
        sans: ['Inter var', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
      },
      spacing: {
        section: '2.5rem',
        card: '1.75rem',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' }
        },
        'fade-out': {
          from: { opacity: '1' },
          to: { opacity: '0' }
        },
        'slide-up': {
          from: { transform: 'translateY(10px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' }
        },
        'slide-down': {
          from: { transform: 'translateY(-10px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' }
        },
        'pulse-ring': {
          from: { opacity: '0.8', transform: 'scale(0.8)' },
          to: { opacity: '0', transform: 'scale(1.5)' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'fade-out': 'fade-out 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        'pulse-ring': 'pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite'
      },
      boxShadow: {
        'sidebar': '0 0 15px rgba(0, 0, 0, 0.05), 0 0 4px rgba(0, 0, 0, 0.1)',
        'sidebar-dark': '0 0 10px rgba(0, 0, 0, 0.3)'
      },
      textColor: {
        'muted-foreground': 'hsl(var(--muted-foreground) / <alpha-value>)',
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
