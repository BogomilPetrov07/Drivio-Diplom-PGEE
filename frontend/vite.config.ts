import {defineConfig, loadEnv} from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from 'vite-plugin-pwa'

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
            allowedHosts: hosts,
            proxy: {
                '/api': {
                    target: 'http://api.localhost',
                    changeOrigin: true,
                    secure: false
                }
            }
        },
        plugins: [
            react(),
            tailwindcss(),
            VitePWA({
                registerType: 'autoUpdate',
                devOptions: {
                    enabled: false,
                },
                manifest: {
                    id: '/',
                    name: 'Drivio - Driving School Platform',
                    short_name: 'Drivio',
                    description: 'The modern web platform for driving school management',
                    theme_color: '#3d2a85',
                    background_color: '#ffffff',
                    start_url: '/',
                    scope: '/',
                    display: 'standalone',
                    icons: [
                        {
                            src: 'icons/icon-192.png',
                            sizes: '192x192',
                            type: 'image/png',
                            purpose: 'any maskable'
                        },
                        {
                            src: 'icons/icon-512.png',
                            sizes: '512x512',
                            type: 'image/png',
                            purpose: 'any maskable'
                        }
                    ]
                }
            })
        ],
    }
})
