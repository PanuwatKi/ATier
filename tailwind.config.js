/** @type {import('tailwindcss').Config} */
export default {
  // เพิ่มบรรทัดนี้ครับ
  darkMode: 'class', 
  
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}