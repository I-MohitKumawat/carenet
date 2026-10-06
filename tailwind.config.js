/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,jsx,ts,tsx}',
    './src/components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#3A86FF',
          'primary-pressed': '#2563EB',
          teal: '#35A7A0',
          success: '#38A169',
          warning: '#E9A23B',
          emergency: '#D94A4A',
          background: '#FAFAF7',
          surface: '#FFFFFF',
          'surface-subtle': '#F4F7FC',
          divider: '#EAEAEA',
          border: '#E2E8F0',
          'text-primary': '#1F1F1F',
          'text-secondary': '#737373',
          'text-muted': '#9CA3AF',
          'badge-blue': '#EBF3FF',
          'badge-teal': '#E6F7F5',
          'badge-orange': '#FEF3E6',
        },
      },
    },
  },
  plugins: [],
};
