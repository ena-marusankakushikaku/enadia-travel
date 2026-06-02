import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './constants/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        enadia: {
          ink: '#18212f',
          muted: '#657184',
          line: '#dbe1ea',
          canvas: '#f4f7fb',
          surface: '#ffffff',
          primary: '#0f8b8d',
          primaryDark: '#0a5f62',
          accent: '#e7b547',
          danger: '#d64545',
          pro: '#4263eb',
          premium: '#8a4fff'
        }
      },
      boxShadow: {
        mobile: '0 18px 48px rgba(24, 33, 47, 0.14)',
        sheet: '0 -18px 48px rgba(24, 33, 47, 0.18)'
      }
    }
  },
  plugins: []
};

export default config;
