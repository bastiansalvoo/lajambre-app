/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")], // <-- LÍNEA NUEVA OBLIGATORIA
  theme: {
    extend: {
      colors: {
        lajambre: {
          black: '#121212',
          white: '#F5F5F5',
        }
      }
    },
  },
}