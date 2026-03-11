/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./**/*.{js,ts,jsx,tsx}",
        "!./node_modules/**",
        "!./dist/**"
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Tajawal', 'Cairo', 'sans-serif'],
                cairo: ['Cairo', 'sans-serif'],
            },
            colors: {
                // Existing colors
                emerald: {
                    700: '#047857',
                    800: '#065f46',
                    850: '#064e3b',
                    900: '#022c22',
                },
                teal: {
                    800: '#115e59',
                    900: '#134e4a',
                },
                gold: {
                    300: '#fcd34d',
                    400: '#fbbf24',
                    500: '#f59e0b',
                    600: '#d97706',
                    700: '#b45309',
                },
                // Landing Page Colors
                'islamic-green': '#14463a',
                'islamic-green-light': '#3b7a66',
                'accent-gold': '#d4a045',
                'accent-gold-dark': '#b0812e',
                'glass-white': 'rgba(255, 255, 255, 0.1)',
                'glass-border': 'rgba(255, 255, 255, 0.2)',
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out',
                'pulse-slow': 'pulse 5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'spin-slow': 'spin 120s linear infinite',
                'float': 'float 6s ease-in-out infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-20px)' },
                }
            }
        }
    },
    plugins: [],
}
