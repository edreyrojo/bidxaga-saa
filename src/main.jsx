import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    const habiaControlador = Boolean(navigator.serviceWorker.controller)

    try {
      await navigator.serviceWorker.register('/sw.js')
    } catch (error) {
      console.error('No se pudo registrar el service worker:', error)
      return
    }

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // No avisar en la primera instalación, solo cuando una versión nueva toma el control.
      if (!habiaControlador) return
      window.dispatchEvent(new CustomEvent('bidxaga:sw-actualizado'))
    })
  })
}
