import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#05080c',
        panel: '#0b1220',
        'panel-2': '#0f172a',
        border: '#1e293b',
        'border-2': '#293548',
        txt: '#e2e8f0',
        'txt-dim': '#94a3b8',
        brand: {
          cyan: '#12a0d4',
          'cyan-strong': '#0077b0',
          green: '#00a080',
          'green-strong': '#008a6c',
          blue: '#0060a0',
          amber: '#f6b81a',
          orange: '#fb923c',
          rose: '#f43f5e',
          violet: '#a78bfa',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['ui-monospace', 'SF Mono', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        cyan: '0 0 0 1px rgba(34,211,238,.35), 0 10px 30px -10px rgba(34,211,238,.25)',
      },
    },
  },
  plugins: [],
};
export default config;
