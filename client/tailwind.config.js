/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        blue: {
          600: '#185FA5',
          700: '#144f8a',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};
