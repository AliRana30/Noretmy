/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', 'class'],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        customGray: '#F7F9FA',
        light: {
          white: '#FFFFFF',
          cutomwhite: '#FBFBFB',
          customorange: '#e06825',
          background: '#EBEBEB',
          tags: '#F5F5F5',
        },
        dark: {
          secondary: '#4F4A45',
          nameclr: '#292929',
          ceoclr: '#666666',
          p4: '#3D3D3D',
          arrow: '#525252',
        },
        gray: {
          '200': '#E4E4E7',
        },
        orange: {
          primary: '#E46625',
          case: '#F24A0D',
          button: '#FF5E00',
        },
        red: {
          '50': '#FFDFDD',
          '100': '#FFBFBD',
          '200': '#FF8D8C',
          '300': '#FE7B7C',
          '400': '#FC686C',
          '500': '#F8535C',
          '600': '#D8474F',
          '700': '#9A3036',
          '800': '#451114',
          '900': '#2C080A',
        },
        green: {
          '50': '#DCF5E6',
          '100': '#B7EACD',
          '200': '#90DFB5',
          '300': '#64D39C',
          '400': '#47CD90',
          '500': '#16C784',
          '600': '#0D9360',
          '700': '#06623F',
          '800': '#034C2F',
          '900': '#023620',
          contractname: '#4EA6FF',
        },
        'main-green': {
          '50': '#F4FFE1',
          '100': '#E8FFC2',
          '200': '#DDFFA0',
          '300': '#D2FF78',
          '400': '#CCFF60',
          '500': '#C7FF41',
          '600': '#ADDE37',
          '700': '#93BE2E',
          '800': '#62801C',
          '900': '#4C6313',
          link: '#C6FF41',
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },
      fontFamily: {
        customFont: [
          'Segoe UI',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
          'Apple Color Emoji',
          'Segoe UI Emoji',
          'Segoe UI Symbol',
        ],
      },
      fontSize: {
        hh14: '66px',
        hh13: '52px',
        hh12: '48px',
        hh11: '44px',
        hh10: '40px',
        hh9: '36px',
        hh8: '32px',
        hh7: '28px',
        hh6: '24px',
        hh5: '20px',
        hh4: '16px',
        hh3: '12px',
        hh2: '8px',
        hh1: '4px',
        h1: '54px',
        p1: '16px',
        Heading: '36px',
        p2: '14px',
        p3: '18px',
        p4: '24px',
        h2: '32px',
        h3: '40px',
        h6: '20px',
        h5: '28px',
        h4: '32px',
        button: '16px',
        mainH: '48px',
        h7: '44px',
        s: '10px',
      },
      fontWeight: {
        h1: 700,
        p1: 500,
        p2: 400,
        p3: 400,
        Heading: 700,
        'h-bold': 600,
        button: 500,
      },
      lineHeight: {
        h1: '60px',
        p1: '24px',
        Heading: '43.57px',
        p2: '20px',
        p3: '28px',
        p4: '32px',
        h2: '40px',
        h3: '56px',
        h6: '28px',
        h5: '40px',
        h4: '46px',
        button: '24px',
      },
      letterSpacing: {
        s: '10px',
      },
      boxShadow: {
        custom: '0px 4px 4px 0px #00000040',
        globe: '0px 1px 6px 15px rgba(25, 33, 61, 0.08)',
        industry: '3px 6px 6.7px 3px #00000040',
        logos: '8px 24px 48px 2px rgba(22, 23, 24, 0.05)',
      },
      backgroundImage: {
        industry:
          'linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, #000000 91.36%)',
      },
      mixBlendMode: {
        luminosity: 'luminosity',
        normal: 'normal',
      },
      animation: {
        logos: 'logos 20s linear infinite',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
      },
      keyframes: {
        logos: {
          '0%': {
            transform: 'translateX(0)',
          },
          '100%': {
            transform: 'translateX(-100%)',
          },
        },
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
        'float': {
          '0%, 100%': {
            transform: 'translateY(0)',
          },
          '50%': {
            transform: 'translateY(-10px)',
          },
        },
        'fadeInUp': {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'scaleIn': {
          '0%': {
            opacity: '0',
            transform: 'scale(0.95)',
          },
          '100%': {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
