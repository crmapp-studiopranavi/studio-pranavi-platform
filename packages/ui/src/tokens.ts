// Design tokens for the Glass & Lighting platform.
// These are the authoritative color, typography, and spacing values.
// Both apps import from here and reference via Tailwind CSS variables.

export const colors = {
  brand: {
    // Primary warm palette — used on the public website
    charcoal: '#2C2C2C',
    ivory: '#F9F5EF',
    amber: '#C8973A',
    brass: '#9E7529',
    teal: '#2D6A6A',
    // Warm gray scale
    'warm-50': '#FDFCF8',
    'warm-100': '#F9F5EF',
    'warm-200': '#F0E8D9',
    'warm-300': '#E0CFBA',
    'warm-400': '#C8AF94',
    'warm-500': '#A88F72',
    'warm-600': '#8A7056',
    'warm-700': '#6B5340',
    'warm-800': '#4A3828',
    'warm-900': '#2C2018',
  },
} as const;

export const typography = {
  fontDisplay: ['Playfair Display', 'Georgia', 'serif'],
  fontSans: ['Inter', 'system-ui', 'sans-serif'],
  fontMono: ['JetBrains Mono', 'monospace'],
} as const;

// Website CSS variable values (warm ivory base)
export const websiteCssVars = `
  --background: 40 30% 97%;
  --foreground: 20 10% 15%;
  --card: 40 30% 98%;
  --card-foreground: 20 10% 15%;
  --popover: 40 30% 98%;
  --popover-foreground: 20 10% 15%;
  --primary: 38 55% 50%;
  --primary-foreground: 40 30% 97%;
  --secondary: 40 20% 92%;
  --secondary-foreground: 20 10% 15%;
  --muted: 40 15% 90%;
  --muted-foreground: 20 10% 45%;
  --accent: 180 40% 30%;
  --accent-foreground: 40 30% 97%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 98%;
  --border: 40 15% 85%;
  --input: 40 15% 85%;
  --ring: 38 55% 50%;
  --radius: 0.5rem;
`;

// CRM CSS variable values (clean neutral base for operational clarity)
export const crmCssVars = `
  --background: 0 0% 98%;
  --foreground: 224 71.4% 4.1%;
  --card: 0 0% 100%;
  --card-foreground: 224 71.4% 4.1%;
  --popover: 0 0% 100%;
  --popover-foreground: 224 71.4% 4.1%;
  --primary: 38 55% 45%;
  --primary-foreground: 0 0% 98%;
  --secondary: 220 14.3% 95.9%;
  --secondary-foreground: 220.9 39.3% 11%;
  --muted: 220 14.3% 95.9%;
  --muted-foreground: 220 8.9% 46.1%;
  --accent: 220 14.3% 95.9%;
  --accent-foreground: 220.9 39.3% 11%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 98%;
  --border: 220 13% 91%;
  --input: 220 13% 91%;
  --ring: 38 55% 45%;
  --radius: 0.5rem;
  --sidebar-background: 224 71.4% 4.1%;
  --sidebar-foreground: 220 14.3% 95.9%;
  --sidebar-muted: 220 8.9% 26.1%;
  --sidebar-border: 220 8.9% 16.1%;
`;
