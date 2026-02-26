/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: '#09090B', // Deep black
        surface: '#111114',    // Dark grey
        border: '#1F1F23',     // UI border
        muted: '#3F3F46',      // Muted text/icons
        primary: {
          DEFAULT: '#0066FF',  // Electric Blue
          hover: '#0052CC',
        },
        danger: '#FF3B30',
        warning: '#FFCC00',
        success: '#34C759',
      },
      borderRadius: {
        'none': '0',
        'sm': '2px',
        'DEFAULT': '4px',
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        headline: ['"Outfit"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'sharp': '0 0 0 1px rgba(0, 0, 0, 1)',
        'glow': '0 0 15px rgba(0, 102, 255, 0.2)',
      },
      animation: {
        'blink': 'blink 1.5s step-end infinite',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0 },
        },
      },
    },
  },
  plugins: [],
};
