/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Design System Colors
        "page-bg": "var(--page-bg)",
        "card-bg": "var(--card-bg)",
        "elevated-bg": "var(--elevated-bg)",
        "placeholder-bg": "var(--placeholder-bg)",

        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-on-accent": "var(--text-on-accent)",

        "accent-orange": "var(--accent-orange)",
        "accent-teal": "var(--accent-teal)",

        error: "var(--error)",
        warning: "var(--warning)",
        success: "var(--success)",

        // HTTP Method Colors
        "get-method": "var(--get-method)",
        "post-method": "var(--post-method)",
        "put-method": "var(--put-method)",
        "delete-method": "var(--delete-method)",

        // Legacy shadcn colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      spacing: {
        "gap-xs": "var(--gap-xs)",
        "gap-sm": "var(--gap-sm)",
        "gap-md": "var(--gap-md)",
        "gap-lg": "var(--gap-lg)",
        "gap-xl": "var(--gap-xl)",
        "gap-2xl": "var(--gap-2xl)",
        "sidebar-w": "var(--sidebar-width)",
        "activity-bar-w": "var(--activity-bar-width)",
      },
      borderRadius: {
        radius: "var(--radius)",
      },
      fontFamily: {
        display: ["Oswald", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      width: {
        sidebar: "var(--sidebar-width)",
        "activity-bar": "var(--activity-bar-width)",
      },
    },
  },
  plugins: [],
};