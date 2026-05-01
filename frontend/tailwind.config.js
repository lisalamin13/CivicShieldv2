/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        civicshield: {
          primary: '#1d4ed8',
          'primary-content': '#ffffff',
          secondary: '#0f766e',
          'secondary-content': '#ffffff',
          accent: '#7c3aed',
          neutral: '#1e293b',
          'base-100': '#0f172a',
          'base-200': '#1e293b',
          'base-300': '#334155',
          'base-content': '#e2e8f0',
          info: '#0ea5e9',
          success: '#22c55e',
          warning: '#f59e0b',
          error: '#ef4444',
        },
      },
      'light',
    ],
    defaultTheme: 'light',
  },
};
