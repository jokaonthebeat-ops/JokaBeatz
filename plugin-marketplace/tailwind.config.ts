import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#070707',
        card: '#0f0f0f',
        secondary: '#181818',
        border: '#262626',
        primary: {
          DEFAULT: '#dc2626',
          foreground: '#ffffff',
        },
        foreground: '#f9fafb',
        muted: '#9ca3af',
      },
      fontFamily: {
        sans: ['Montserrat', 'system-ui', 'sans-serif'],
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'float-particle': 'floatParticle 6s ease-in-out infinite',
        'float-particle-delayed': 'floatParticle 8s ease-in-out 2s infinite',
        'float-particle-slow': 'floatParticle 10s ease-in-out 1s infinite',
        'pulse-glow': 'pulseGlow 4s ease-in-out infinite',
        ripple: 'ripple 4s linear infinite',
        'ripple-delayed': 'ripple 4s linear 1s infinite',
        'ripple-slow': 'ripple 4s linear 2s infinite',
        'light-streak': 'lightStreak 8s linear infinite',
        orbit: 'orbit 20s linear infinite',
        'orbit-reverse': 'orbitReverse 25s linear infinite',
        morph: 'morph 12s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        floatParticle: {
          '0%': { transform: 'translateY(0px) translateX(0px)', opacity: '0.4' },
          '33%': { transform: 'translateY(-15px) translateX(5px)', opacity: '0.8' },
          '66%': { transform: 'translateY(-5px) translateX(-5px)', opacity: '0.6' },
          '100%': { transform: 'translateY(0px) translateX(0px)', opacity: '0.4' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
        ripple: {
          '0%': { transform: 'scale(0.8)', opacity: '0.8' },
          '100%': { transform: 'scale(2.5)', opacity: '0' },
        },
        lightStreak: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
        orbit: {
          '0%': { transform: 'rotate(0deg) translateX(100px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(100px) rotate(-360deg)' },
        },
        orbitReverse: {
          '0%': { transform: 'rotate(0deg) translateX(120px) rotate(0deg)' },
          '100%': { transform: 'rotate(-360deg) translateX(120px) rotate(360deg)' },
        },
        morph: {
          '0%, 100%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' },
          '50%': { borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%' },
        },
      },
    },
  },
  plugins: [],
}

export default config
