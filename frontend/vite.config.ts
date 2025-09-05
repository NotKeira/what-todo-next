import { defineConfig } from "vite";

export default defineConfig(async () => ({
    clearScreen: false,
    server: {
        port: 5173,
        strictPort: true,
        host: 'localhost',
        watch: {
            ignored: ["**/backend/**"],
        },
    },
}));