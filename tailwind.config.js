import { COLOR } from "./src/constants/color";
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        main: {
          DEFAULT: COLOR.primary,
        },
        overlay: {
          DEFAULT: COLOR.overlay
        },
        // RacePulse mockup palette
        brand: {
          DEFAULT: "#003ec7",
          dark: "#0038b6",
          fixed: "#dde1ff",
          "on-fixed": "#001452",
        },
        surfacex: {
          DEFAULT: "#f9f9fc",
          high: "#e8e8ea",
          highest: "#e2e2e5",
        },
        inkx: {
          DEFAULT: "#1a1c1e",
          variant: "#434656",
        },
      },
      animation: {
        'spin-slow': 'spin 5s linear infinite',
        shake: 'shake 0.4s ease-in-out',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
      },
    },
    container: {
      screens: {
        xs: '480px',
        sm: '576px',
        md: '768px',
        lg: '992px',
        xl: '1200px',
        '2xl': '1600px',
      },
    },
    screens: {
      xs: '480px',
      sm: '576px',
      md: '768px',
      lg: '992px',
      xl: '1200px',
      '2xl': '1600px',
    },
  },
  blocklist: [
    'collapse'
  ],
  corePlugins: {
    preflight: false
  },
  plugins: [
    require('tailwind-scrollbar')],
}