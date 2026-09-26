/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        /* ────────────────────────────────────────────────────
           KodxCamp palette — Option 1
           ────────────────────────────────────────────────────
           Every brand/accent color consumes a CSS custom
           property, so `bg-brand-500` flips with theme
           automatically. No hardcoded brand hexes live here.

           Canonical token names (spec):
             --color-blue           → identity in dark theme
             --color-blue-primary   → primary action blue
             --color-blue-bright    → highlight blue
             --color-blue-deep      → deep brand navy
             --color-orange         → primary CTA
             --color-orange-hover   → CTA hover
             --color-orange-active  → CTA active

           Compatibility aliases (defined in index.css):
             --color-primary-500 / 700 / 900 / 300
             --color-accent-500 / 700 / 300
           ──────────────────────────────────────────────────── */

        /* Blue family — identity */
        brand: {
          900: 'var(--color-primary-900)',   /* deepest navy */
          700: 'var(--color-primary-700)',   /* dark brand blue */
          500: 'var(--color-blue-primary)',  /* primary action blue */
          300: 'var(--color-primary-300)',   /* highlight blue */
        },

        /* Canonical named families — new code should prefer these */
        blue: {
          DEFAULT: 'var(--color-blue)',
          primary: 'var(--color-blue-primary)',
          bright: 'var(--color-blue-bright)',
          deep: 'var(--color-blue-deep)',
        },

        /* Orange family — action */
        accent: {
          700: 'var(--color-orange-hover)',
          500: 'var(--color-orange)',
          300: 'var(--color-accent-300)',
        },

        orange: {
          DEFAULT: 'var(--color-orange)',
          hover: 'var(--color-orange-hover)',
          active: 'var(--color-orange-active)',
        },

        /* ─── Surfaces & text (token-driven) ─────────── */
        surface: {
          DEFAULT: 'var(--color-surface)',
          secondary: 'var(--color-surface-secondary)',
          tertiary: 'var(--color-surface-tertiary)',
          raised: 'var(--color-surface-raised)',
        },
        bg: {
          DEFAULT: 'var(--color-background)',
          deep: 'var(--color-background-deep)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          hover: 'var(--color-border-hover)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
          disabled: 'var(--color-text-disabled)',
        },

        /* ─── Semantic ────────────────────────────────── */
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        info: 'var(--color-info)',
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },

      /* ────────────────────────────────────────────────
         Named shadows — build brand-consistent depth
         without hardcoding hexes in components.
         ──────────────────────────────────────────────── */
      boxShadow: {
        card: '0 1px 2px var(--color-shadow-card), 0 4px 12px var(--color-shadow-card)',
        elevated:
          '0 4px 8px var(--color-shadow-elevated), 0 12px 24px var(--color-shadow-elevated)',
        navbar: '0 18px 50px var(--color-shadow-navbar)',
        'glow-orange': '0 18px 42px var(--color-glow-orange)',
        'glow-blue': '0 18px 42px var(--color-glow-blue)',
      },

      /* ────────────────────────────────────────────────
         Focus ring color tokens — used via `ring-brand-500`
         or explicit `ring-[color:var(--color-focus-ring)]`.
         ──────────────────────────────────────────────── */
      ringColor: {
        DEFAULT: 'var(--color-focus-ring)',
        brand: 'var(--color-focus-ring)',
      },
    },
  },
  plugins: [],
};