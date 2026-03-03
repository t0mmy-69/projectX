/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                primary: {
                    DEFAULT: "#814AC8",
                    light: "#A87FF1",
                    dark: "#5A2E9F",
                },
                accent: {
                    purple: "#814AC8",
                },
                muted: "#A1A1A1",
            },
            fontFamily: {
                sans: ["Figtree", "Inter", "system-ui", "sans-serif"],
            },
            borderRadius: {
                '6xl': '1.5rem',
            }
        },
    },
    plugins: [],
};
