import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Plus Jakarta Sans",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "Apple Color Emoji",
          "Segoe UI Emoji",
        ],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        card: "var(--ait-radius-card)",
        button: "var(--ait-radius-button)",
        panel: "var(--ait-radius-hero)",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar-background)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
        ait: {
          void: "var(--ait-void)",
          deep: "var(--ait-deep)",
          navy: "var(--ait-navy)",
          purple: "var(--ait-purple)",
          violet: "var(--ait-violet)",
          magenta: "var(--ait-magenta)",
          orange: "var(--ait-orange)",
          gold: "var(--ait-gold)",
          pink: "var(--ait-pink)",
          cyan: "var(--ait-cyan)",
          ocean: "var(--ait-ocean)",
          sunset: "var(--ait-sunset)",
          sand: "var(--ait-sand)",
          palm: "var(--ait-palm)",
          primary: "var(--ait-primary)",
          accent: "var(--ait-accent)",
        },
      },
      backgroundImage: {
        "ait-overlay": "var(--ait-overlay-gradient)",
        "ait-gradient-cta": "var(--ait-gradient-cta)",
        "ait-gradient-brand": "var(--ait-gradient-brand)",
      },
      boxShadow: {
        "ait-glow": "var(--ait-glow-cyan)",
        "ait-glow-strong": "var(--ait-glow-cyan-strong)",
        "ait-glow-purple": "var(--ait-glow-purple)",
        "ait-glow-sunset": "var(--ait-glow-sunset)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
