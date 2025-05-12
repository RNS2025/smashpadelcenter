import forms from "@tailwindcss/forms";
import typography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // Custom colors used in the component
      colors: {
        // Adding custom slate shades to fit between default ones if needed
        // Tailwind v3.3+ includes slate-950 (#020617), so we add 750 and 850 as examples.
        "slate-750": "#283549", // Example value between slate-700 and slate-800
        "slate-850": "#172133", // Example value between slate-800 and slate-900
        "slate-950": "#020617", // Standard slate-950 from Tailwind v3.3+

        // Brand colors used for accents, gradients, etc.
        "brand-primary": "#06b6d4", // Example vibrant primary color (Green-Teal)
        "brand-secondary": "#0077FF", // Example secondary color (Blue)
        "brand-accent": "#A64CEB", // Example accent color (Purple)
      },

      // Custom font family (already present, keeping)
      fontFamily: {
        sans: ['"Varela Round"', "sans-serif"],
      },

      // Custom breakpoints (already present, keeping)
      screens: {
        xs: "640px", // Note: This overrides the default 'sm' if defined first,
        // but here it's just adding 'xs'. The default 'sm' will still be 640px unless you redefine it.
        // Consider if 'xs' is necessary or if you just need 'sm'.
        desktop: "1024px", // Note: This aliases the default 'lg' breakpoint. Using 'lg' is generally preferred.
      },

      // Custom font size (already present, keeping)
      fontSize: {
        xxs: "0.625rem", // 10px
      },

      // Custom animations used in the component
      animation: {
        fadeIn: "fadeIn 0.5s ease-out",
        fadeInDown: "fadeInDown 0.6s ease-out",
        pulseSlow: "pulseSlow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite", // Slower pulse
        // spin animation is built-in
      },

      // Keyframes for custom animations
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        fadeInDown: {
          from: { opacity: "0", transform: "translateY(-10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pulseSlow: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: ".5" },
        },
        // spin keyframes are built-in
      },
    },
  },
  plugins: [
    forms,
    typography,
    // If using backdrop-filter utilities like backdrop-blur, ensure it's enabled.
    // It's often enabled by default in newer Tailwind versions or via a plugin if needed.
    // require('@tailwindcss/aspect-ratio'), // Add other plugins if needed
  ],
};
