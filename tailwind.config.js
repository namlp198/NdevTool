/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', '"Cascadia Code"', 'Consolas', 'monospace'],
      },
      colors: {
        obsidian: '#06090e',
        panel: '#0b1017',
        border: '#192434',
        matrix: '#00ff9c',
        mystic: '#b77eff',
        cyber: '#00e5ff',
        amber: '#ffb84d',
      },
    },
  },
  plugins: [],
};
