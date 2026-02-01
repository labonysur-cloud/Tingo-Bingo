import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#FF6B35", // Vibrant Orange
                secondary: "#4ADE80", // Logo Green
                accent: "#F9DB6D", // Playful Yellow
                background: "#F7F7F7",
                surface: "#FFFFFF",
                black: "#1A1A1A",
            },
            boxShadow: {
                'neubrutalism': '4px 4px 0px 0px rgba(0,0,0,1)',
                'neubrutalism-sm': '2px 2px 0px 0px rgba(0,0,0,1)',
            },
            borderRadius: {
                'base': '12px',
            }
        },
    },
    plugins: [],
};
export default config;
