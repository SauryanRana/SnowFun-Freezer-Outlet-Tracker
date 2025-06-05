/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        poppins: ['var(--font-poppins)', 'sans-serif'],
      },
      colors: {
        // Snow Fun theme colors based on the logo
        'snow-green': {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',  // Primary green from logo
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        'snow-red': {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',  // Primary red from logo
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        'snow': {
          white: '#ffffff',
          'off-white': '#f8fafc',
        },
        'strawberry': {
          100: '#ffe5e5',
          200: '#ffcccc',
          300: '#ffb3b3',
          400: '#ff9999',
          500: '#ff8080',
          600: '#ff6666',
        },
        'vanilla': {
          100: '#fffbeb',
          200: '#fef3c7',
          300: '#fde68a',
          400: '#fcd34d',
          500: '#fbbf24',
        },
        'chocolate': {
          100: '#f5f0e6',
          200: '#e6d9c2',
          300: '#d4bc94',
          400: '#b89b6a',
          500: '#967a44',
          600: '#7c5e2e',
        },
      },
      boxShadow: {
        'ice-sm': '0 1px 2px 0 rgba(20, 83, 45, 0.05)',
        'ice-md': '0 4px 6px -1px rgba(20, 83, 45, 0.1), 0 2px 4px -1px rgba(20, 83, 45, 0.06)',
        'ice-lg': '0 10px 15px -3px rgba(20, 83, 45, 0.1), 0 4px 6px -2px rgba(20, 83, 45, 0.05)',
        'ice-xl': '0 20px 25px -5px rgba(20, 83, 45, 0.1), 0 10px 10px -5px rgba(20, 83, 45, 0.04)',
        'ice-inner': 'inset 0 2px 4px 0 rgba(20, 83, 45, 0.06)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'ice-cream-pattern': "url('/patterns/ice-cream-pattern.png')",
        'nepal-map': "url('/nepal-map-illustration.jpg')",
      },
      borderRadius: {
        'ice': '0.5rem',
        'ice-lg': '1rem',
        'ice-xl': '1.5rem',
        'scoop': '100% 100% 45% 45%',
      },
      animation: {
        'melt': 'melt 1s ease-in-out',
        'drip': 'drip 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        melt: {
          '0%, 100%': { transform: 'scaleY(1)' },
          '50%': { transform: 'scaleY(1.05)' },
        },
        drip: {
          '0%': { height: '0', opacity: '0' },
          '50%': { height: '10px', opacity: '0.7' },
          '100%': { height: '0', opacity: '0', transform: 'translateY(10px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      transitionDuration: {
        '2000': '2000ms',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
}
