/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        montserrat: ['Montserrat', 'sans-serif', 'semi-bold'],
      },
      customPurple: '#30024e',
      spacing: {
        '26': '104px', // 26 * 4px
        '28': '112px',
      },
    },
    screens: {
      xs: '480px',  // Breakpoint personalizado para pantallas pequeñas
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
  },
  plugins: [],
};
