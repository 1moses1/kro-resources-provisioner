/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      // You can extend the theme with custom colors or spacing if needed
    }
  },
  plugins: []
};
// This is a basic Tailwind CSS configuration file.
// It specifies the content paths where Tailwind should look for class names.
// You can extend the theme with custom colors, spacing, or other utilities as needed.