/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "#000000",
        'bone-white': "#ffffff",
        'ash-gray': "#9a9a9a",
        'silver-mist': "#bdbdbd",
        'electric-iris': {
          DEFAULT: "#8052ff",
          hover: "#9268ff",
          glow: "rgba(128, 82, 255, 0.25)",
        },
        'saffron-spark': "#ffb829",
        'deep-verdant': "#15846e",
        // Legacy fallbacks
        iris: {
          DEFAULT: "#8052ff",
          hover: "#9268ff",
          glow: "rgba(128, 82, 255, 0.25)",
        },
        saffron: "#ffb829",
        cyan: "#22d3ee",
        ash: "#9a9a9a",
        silver: "#bdbdbd",
      },
      fontFamily: {
        sans: ['PPNeueMontreal', 'Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['PPNeueMontreal', 'Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        body: ['PPNeueMontreal', 'Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      letterSpacing: {
        'display': '-4.52px',
        'heading-lg': '-3.12px',
        'heading-sm': '-1.68px',
        'heading-2xs': '-0.48px',
        'nav-label': '0.025em',
        'monumental': '-0.04em',
        'tightest': '-0.03em',
        'kicker': '0.08em',
      },
      borderRadius: {
        'pill': '9999px',
        'button': '22.5px',
        'card': '24px',
      },
      spacing: {
        '6': '6px',
        '12': '12px',
        '18': '18px',
        '24': '24px',
        '30': '30px',
        '36': '36px',
        '60': '60px',
        '96': '96px',
        '120': '120px',
      },
    },
  },
  plugins: [],
}

