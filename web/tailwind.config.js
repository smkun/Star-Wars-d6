/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Star Wars theme colors
        charcoal: {
          50: '#f6f6f6',
          100: '#e7e7e7',
          200: '#d1d1d1',
          300: '#b0b0b0',
          400: '#888888',
          500: '#6d6d6d',
          600: '#5d5d5d',
          700: '#4f4f4f',
          800: '#454545',
          900: '#3d3d3d',
          950: '#1a1a1a', // Main background
        },
        accent: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15', // Main yellow accent
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
          950: '#422006',
        },
      },
      fontFamily: {
        heading: ['"Pathway Gothic One"', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderWidth: {
        energy: '1px',
      },
      boxShadow: {
        energy: '0 0 8px rgba(250, 204, 21, 0.3)',
        'energy-strong': '0 0 12px rgba(250, 204, 21, 0.5)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 8px rgba(250, 204, 21, 0.3)' },
          '50%': { boxShadow: '0 0 16px rgba(250, 204, 21, 0.5)' },
        },
      },
    },
  },
  plugins: [],
};
