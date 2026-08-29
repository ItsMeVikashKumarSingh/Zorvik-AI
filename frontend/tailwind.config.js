/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "#07070a",
        surface: {
          0: "#07070a",
          1: "#0d0d14",
          2: "#13131e",
          3: "#1a1a28",
          4: "#222234",
        },
        border: {
          subtle: "rgba(255, 255, 255, 0.06)",
          DEFAULT: "rgba(255, 255, 255, 0.09)",
          strong: "rgba(255, 255, 255, 0.16)",
        },
        'bone-white': "#f8fafc",
        'ash-gray': "#94a3b8",
        'silver-mist': "#cbd5e1",
        'electric-iris': {
          DEFAULT: "#6366f1",
          hover: "#4f46e5",
          glow: "rgba(99, 102, 241, 0.20)",
        },
        iris: {
          DEFAULT: "#6366f1",
          hover: "#4f46e5",
          glow: "rgba(99, 102, 241, 0.20)",
        },
        saffron: "#f59e0b",
        cyan: {
          DEFAULT: "#06b6d4",
          hover: "#0891b2",
        },
        crimson: {
          DEFAULT: "#f43f5e",
          hover: "#e11d48",
        },
        ash: "#94a3b8",
        silver: "#cbd5e1",
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

