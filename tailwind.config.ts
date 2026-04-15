import type { Config } from 'tailwindcss'
import { fontFamily } from 'tailwindcss/defaultTheme'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brown: {
          DEFAULT: '#3D2B1F',
          light: '#5a3e2e',
        },
        cream: {
          DEFAULT: '#F2E9D8',
        },
        saddle: {
          DEFAULT: '#A0522D',
          light: '#b8632f',
          dark: '#8a4425',
        },
        gold: {
          DEFAULT: '#C4A882',
          light: '#d4be9e',
          dark: '#a88c62',
        },
        parchment: {
          DEFAULT: '#FDF8F0',
        },
      },
      fontFamily: {
        display: ['var(--font-playfair)', ...fontFamily.serif],
        body: ['var(--font-lora)', ...fontFamily.serif],
      },
      boxShadow: {
        warm: '0 2px 12px 0 rgba(61,43,31,0.15)',
        card: '0 4px 24px 0 rgba(61,43,31,0.12)',
        deep: '0 8px 32px 0 rgba(61,43,31,0.20)',
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
      },
    },
  },
  plugins: [],
}

export default config
