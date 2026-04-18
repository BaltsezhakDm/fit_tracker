/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tg: {
          bg: 'var(--tg-theme-bg-color, #f8fafc)',
          text: 'var(--tg-theme-text-color, #0f172a)',
          hint: 'var(--tg-theme-hint-color, #64748b)',
          link: 'var(--tg-theme-link-color, #3b82f6)',
          button: 'var(--tg-theme-button-color, #3b82f6)',
          buttonText: 'var(--tg-theme-button-text-color, #ffffff)',
          secondaryBg: 'var(--tg-theme-secondary-bg-color, #ffffff)',
        }
      }
    },
  },
  plugins: [],
}
