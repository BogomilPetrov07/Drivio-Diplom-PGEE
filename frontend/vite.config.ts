import {defineConfig, loadEnv} from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({mode}) => {
    // Load env file based on `mode` in the current working directory.
    // Set the third parameter to '' to load all envs regardless of the VITE_ prefix.
    const env = loadEnv(mode, process.cwd(), '');

    const hosts = env.ALLOWED_HOSTS
        ? env.ALLOWED_HOSTS.split(',') : ["localhost", "app.localhost"]

    return {
        server: {
            host: true,
            allowedHosts: hosts
        },
        plugins: [
            react(),
            tailwindcss(),
        ],
    }
})
