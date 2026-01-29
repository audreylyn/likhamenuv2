/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bakery: {
          dark: 'var(--bakery-dark, #5D4037)', // Dark warm brown
          primary: 'var(--bakery-primary, #8B4513)', // Saddle Brown
          accent: 'var(--bakery-accent, #D2691E)', // Chocolate
          cream: 'var(--bakery-cream, #FFF8E7)', // Cosmic Latte
          beige: 'var(--bakery-beige, #F5F5DC)', // Beige
          sand: 'var(--bakery-sand, #E6DCC3)',
          light: 'var(--bakery-light, #FFFFFF)',
          text: 'var(--bakery-text, #333333)',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['"Lato"', 'sans-serif'],
      }
    }
  },
  plugins: [],
}

