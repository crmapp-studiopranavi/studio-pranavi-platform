import type { Config } from 'tailwindcss';
import { fontFamily } from 'tailwindcss/defaultTheme';
import tailwindcssAnimate from 'tailwindcss-animate';

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#ffffff',
          bgalt: '#f7f7f7',
          text: '#231F20',
          muted: '#888888',
          dim: '#aaaaaa',
          border: '#e3e3e3',
        },
      },
      fontFamily: {
        sans: ['DM Sans', ...fontFamily.sans],
        display: ['Cormorant Garamond', ...fontFamily.serif],
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
