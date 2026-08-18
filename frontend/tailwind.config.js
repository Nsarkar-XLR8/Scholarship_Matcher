/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        porcelain: {
          DEFAULT: '#F8FAFC',
          pure: '#FFFFFF',
          slate: '#F1F5F9',
          border: 'rgba(226, 232, 240, 0.8)',
        },
        royal: {
          DEFAULT: '#2563EB',
          dark: '#1D4ED8',
          deep: '#1E40AF',
          light: '#3B82F6',
          soft: 'rgba(37, 99, 235, 0.08)',
        },
        sky: {
          glow: '#0EA5E9',
        },
        slate: {
          navy: '#0F172A',
        },
        amber: {
          gold: '#D97706',
        },
        emerald: {
          verified: '#059669',
        },
      },
      fontFamily: {
        outfit: ['var(--font-outfit)', 'sans-serif'],
        jakarta: ['var(--font-jakarta)', 'sans-serif'],
      },
      backgroundImage: {
        'radial-royal': 'radial-gradient(circle at 50% 0%, rgba(37, 99, 235, 0.08), transparent 70%)',
        'radial-sky': 'radial-gradient(circle at 100% 50%, rgba(14, 165, 233, 0.06), transparent 60%)',
        'light-glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.7) 100%)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 4s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: 0.4 },
          '50%': { opacity: 0.8 },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};
