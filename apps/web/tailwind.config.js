/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
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
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
  // Ensure all Tailwind utilities are available
  safelist: [
    // Background colors
    'bg-red-500', 'bg-emerald-500', 'bg-amber-500', 'bg-blue-500', 'bg-purple-500',
    'bg-white', 'bg-gray-50', 'bg-gray-100', 'bg-gray-900',
    // Text colors
    'text-white', 'text-gray-900', 'text-gray-600', 'text-gray-500',
    'text-emerald-600', 'text-amber-600', 'text-red-600', 'text-blue-600',
    // Padding and margins
    'p-4', 'p-6', 'p-8', 'px-4', 'py-2', 'px-6', 'py-3',
    'm-4', 'mb-4', 'mb-8', 'mb-12', 'mt-2', 'mt-4',
    // Flexbox and grid
    'flex', 'grid', 'items-center', 'justify-between', 'space-x-4',
    // Sizing
    'w-full', 'h-full', 'min-h-screen', 'max-w-7xl',
    // Border radius
    'rounded-lg', 'rounded-xl', 'rounded-2xl', 'rounded-full',
    // Shadows
    'shadow-lg', 'shadow-xl', 'shadow-2xl',
    // Transitions
    'transition-all', 'duration-300', 'hover:shadow-xl', 'hover:scale-105',
    // Gradients
    'bg-gradient-to-br', 'from-emerald-50', 'via-teal-50', 'to-cyan-50',
    'bg-gradient-to-r', 'from-emerald-500', 'to-teal-600',
  ],
};
