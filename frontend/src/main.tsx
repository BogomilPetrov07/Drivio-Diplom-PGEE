import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.tsx'
import { registerSW } from 'virtual:pwa-register'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'

if (import.meta.env.PROD) {
    registerSW({ immediate: true })
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
        <Analytics />
        <SpeedInsights />
    </StrictMode>,
)
