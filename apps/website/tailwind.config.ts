import type { Config } from 'tailwindcss';
import { fontFamily } from 'tailwindcss/defaultTheme';
import tailwindcssAnimate from 'tailwindcss-animate';

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        brand: {
          charcoal: '#2C2C2C',
          ivory: '#F9F5EF',
          stone: '#EDE8DF',
          amber: '#C8973A',
          brass: '#9E7529',
          teal: '#2D6A6A',
        },
      },
      fontFamily: {
        sans: ['Inter', ...fontFamily.sans],
        display: ['Playfair Display', ...fontFamily.serif],
      },
      fontSize: {
        'sp-display-xl': ['var(--sp-text-display-xl)', { lineHeight: 'var(--sp-leading-display)' }],
        'sp-display-lg': ['var(--sp-text-display-lg)', { lineHeight: 'var(--sp-leading-display)' }],
        'sp-display-md': ['var(--sp-text-display-md)', { lineHeight: 'var(--sp-leading-heading)' }],
        'sp-h1': ['var(--sp-text-h1)', { lineHeight: 'var(--sp-leading-heading)' }],
        'sp-h2': ['var(--sp-text-h2)', { lineHeight: 'var(--sp-leading-heading)' }],
        'sp-h3': ['var(--sp-text-h3)', { lineHeight: 'var(--sp-leading-heading)' }],
        'sp-body-lg': ['var(--sp-text-body-lg)', { lineHeight: 'var(--sp-leading-body)' }],
        'sp-body': ['var(--sp-text-body)', { lineHeight: 'var(--sp-leading-body)' }],
        'sp-body-sm': ['var(--sp-text-body-sm)', { lineHeight: 'var(--sp-leading-body)' }],
        'sp-caption': ['var(--sp-text-caption)', { lineHeight: '1.5' }],
        'sp-label': ['var(--sp-text-label)', { lineHeight: '1.4' }],
      },
      spacing: {
        'sp-xs': 'var(--sp-space-xs)',
        'sp-sm': 'var(--sp-space-sm)',
        'sp-md': 'var(--sp-space-md)',
        'sp-lg': 'var(--sp-space-lg)',
        'sp-xl': 'var(--sp-space-xl)',
        'sp-2xl': 'var(--sp-space-2xl)',
        'sp-3xl': 'var(--sp-space-3xl)',
        'sp-4xl': 'var(--sp-space-4xl)',
        'sp-5xl': 'var(--sp-space-5xl)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        img: 'var(--sp-radius-img)',
        ui: 'var(--sp-radius-ui)',
        badge: 'var(--sp-radius-badge)',
      },
      boxShadow: {
        card: 'var(--sp-shadow-card)',
        elevated: 'var(--sp-shadow-elevated)',
        overlay: 'var(--sp-shadow-overlay)',
      },
      transitionDuration: {
        fast: 'var(--sp-duration-fast)',
        ui: 'var(--sp-duration-ui)',
        reveal: 'var(--sp-duration-reveal)',
      },
      transitionTimingFunction: {
        'sp-out': 'var(--sp-ease-out)',
        'sp-in-out': 'var(--sp-ease-in-out)',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
