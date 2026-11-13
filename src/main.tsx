import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { loadRemote } from './lib/remote'
import './hub.css'
import './overrides.css'

// Admin edits are fetched before the content modules evaluate, so every page
// reads one merged, synchronous data set (built-in content if Cloud is unreachable).
// After a new deploy, an already-open tab may ask for page code files that no
// longer exist. Reload once to pick up the fresh version instead of a blank screen.
const RELOAD_KEY = 'hub-chunk-reload'
function reloadOnce() {
  if (sessionStorage.getItem(RELOAD_KEY)) return false
  sessionStorage.setItem(RELOAD_KEY, '1')
  window.location.reload()
  return true
}
window.addEventListener('vite:preloadError', (e) => {
  if (reloadOnce()) e.preventDefault()
})

loadRemote().then(async () => {
  let App: React.ComponentType
  try {
    App = (await import('./App')).default
  } catch (err) {
    if (reloadOnce()) return
    throw err
  }
  window.setTimeout(() => sessionStorage.removeItem(RELOAD_KEY), 10000)
  createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>,
  )
})
