import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { loadRemote } from './lib/remote'
import './hub.css'
import './overrides.css'

// Admin edits are fetched before the content modules evaluate, so every page
// reads one merged, synchronous data set (built-in content if Cloud is unreachable).
loadRemote().then(async () => {
  const { default: App } = await import('./App')
  createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>,
  )
})
