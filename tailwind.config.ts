import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#1A064B",
          secondary: "#FAF5EA",
          accentBlue: "#0C1D98",
          accentLavender: "#DCD6F7",
          accentTaupe: "#AA988F",
          accentPeriwinkle: "#7884FF",
          accentOrange: "#FF4F01",
        },
      },
      fontFamily: {
        heading: ["Syne", "sans-serif"],
        body: ["Archivo", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
