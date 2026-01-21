import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { PWAUpdatePrompt, PWAInstallPrompt } from './components/pwa/PWAPrompts.tsx'
import { OfflineBanner } from './components/pwa/OfflineBanner.tsx'
import { PWAManager } from './components/pwa/PWAManager.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <OfflineBanner />
    <App />
    <PWAManager />
    <PWAUpdatePrompt />
    <PWAInstallPrompt />
  </React.StrictMode>,
)
