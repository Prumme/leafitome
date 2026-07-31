import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { App } from '@/app/App'
import './index.css'

registerSW({ immediate: true })

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Élément #root introuvable')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
