import animate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
	darkMode: ['class'],
	content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
	theme: {
		screens: {
			xs: '480px',
			sm: '640px',
			md: '768px',
			lg: '1024px',
			xl: '1280px',
			'2xl': '1440px',
			'3xl': '1600px',
			'4xl': '1920px',
			'5xl': '2560px',
			'6xl': '3840px',
		},
		extend: {
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
			},
			colors: {
				background: 'var(--background)',
				foreground: 'var(--foreground)',
				card: 'var(--card)',
				'card-foreground': 'var(--card-foreground)',
				popover: 'var(--popover)',
				'popover-foreground': 'var(--popover-foreground)',
				primary: 'var(--primary)',
				'primary-foreground': 'var(--primary-foreground)',
				secondary: 'var(--secondary)',
				'secondary-foreground': 'var(--secondary-foreground)',
				muted: 'var(--muted)',
				'muted-foreground': 'var(--muted-foreground)',
				accent: 'var(--accent)',
				'accent-foreground': 'var(--accent-foreground)',
				destructive: 'var(--destructive)',
				'destructive-foreground': 'var(--destructive-foreground)',
				border: 'var(--border)',
				input: 'var(--input)',
				ring: 'var(--ring)',
				chart: {
					1: 'var(--chart-1)',
					2: 'var(--chart-2)',
					3: 'var(--chart-3)',
					4: 'var(--chart-4)',
					5: 'var(--chart-5)',
				},
				sidebar: 'var(--sidebar)',
				'sidebar-foreground': 'var(--sidebar-foreground)',
				'sidebar-primary': 'var(--sidebar-primary)',
				'sidebar-primary-foreground': 'var(--sidebar-primary-foreground)',
				'sidebar-accent': 'var(--sidebar-accent)',
				'sidebar-accent-foreground': 'var(--sidebar-accent-foreground)',
				'sidebar-border': 'var(--sidebar-border)',
				'sidebar-ring': 'var(--sidebar-ring)',
				'hex-gold': 'var(--hex-gold)',
				'hex-gold-dark': 'var(--hex-gold-dark)',
				'hex-blue': 'var(--hex-blue)',
				'hex-blue-glow': 'var(--hex-blue-glow)',
				'hex-bg-deep': 'var(--hex-bg-deep)',
			},
			boxShadow: {
				hex: 'var(--shadow-hex)',
				gold: 'var(--shadow-gold)',
			},
			fontFamily: {
				sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
				// display: ['"Playfair Display"', 'serif'],
				display: ['"Beaufort"', 'serif'],
				nav: ['Tahoma', 'Geneva', 'Verdana', 'sans-serif'],
			},
			maxWidth: {
				'8xl': '100rem',
				'9xl': '120rem',
				'10xl': '160rem',
				container: '1440px',
			},
		},
	},
	plugins: [
		animate,
		function ({ addVariant }) {
			// addVariant('light', '@media (prefers-color-scheme: light)');
			addVariant('light', 'html:not(.dark) &');
		},
	],
};
