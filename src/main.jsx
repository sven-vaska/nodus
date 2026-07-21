import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
// Dark mode is paused during the redesign — always run light and clear any
// stale theme class a previous version may have set.
document.documentElement.classList.remove('dark')

// Keep --vvh equal to the real viewport height. iOS PWAs report a stale 100dvh
// after resuming from the background, which shrank the app shell and left a
// dead strip under the bottom bar until a full relaunch.
function syncViewportHeight() {
  document.documentElement.style.setProperty('--vvh', `${window.innerHeight}px`)
}
syncViewportHeight()
window.addEventListener('resize', syncViewportHeight)
window.addEventListener('orientationchange', syncViewportHeight)
window.addEventListener('pageshow', syncViewportHeight)
document.addEventListener('visibilitychange', () => {
  // Height can settle a moment after wake — sync now and once more shortly after
  if (document.visibilityState === 'visible') {
    syncViewportHeight()
    setTimeout(syncViewportHeight, 250)
  }
})

// Cold launches (a new tab or a PWA relaunch) should start on Home rather than
// restoring the last-visited route (e.g. iOS PWAs reopen on the last URL).
// A warm refresh keeps its page because sessionStorage survives within a session.
// Auth callbacks (token in hash/query) are left untouched so login still works.
if (!sessionStorage.getItem('nodus_session')) {
  sessionStorage.setItem('nodus_session', '1')
  const { pathname, hash, search } = window.location
  // Invite links must keep their path through a cold launch
  if (pathname !== '/' && !pathname.startsWith('/invite/') && !hash && !search) {
    window.history.replaceState(null, '', '/')
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

// Show a brief "updated" toast on the first load after an auto-update.
// The flag is set on `controllerchange` (new service worker took over, right
// before the auto-reload) and read here, after the reload.
if (sessionStorage.getItem('nodus_updated')) {
  sessionStorage.removeItem('nodus_updated')
  const toast = document.createElement('div')
  toast.textContent = 'Tarkvara uuendatud ✓'
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'var(--app-text-primary)',
    color: 'var(--app-bg)',
    padding: '10px 18px',
    borderRadius: '50px',
    fontSize: '13px',
    fontWeight: '500',
    fontFamily: 'var(--font-sans)',
    boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
    zIndex: '9999',
    whiteSpace: 'nowrap',
    opacity: '0',
    transition: 'opacity 300ms ease',
    pointerEvents: 'none',
  })
  document.body.appendChild(toast)
  requestAnimationFrame(() => { toast.style.opacity = '1' })
  setTimeout(() => {
    toast.style.opacity = '0'
    setTimeout(() => toast.remove(), 350)
  }, 3000)
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    sessionStorage.setItem('nodus_updated', '1')
  })
  import('virtual:pwa-register').then(({ registerSW }) => {
    // autoUpdate: a new version activates and reloads on its own — no prompt.
    // iOS keeps the PWA alive in the background for days, so the browser's own
    // update check (which only runs on a full relaunch) rarely fires. Force a
    // check every time the app returns to the foreground, plus every 15 min.
    registerSW({
      immediate: true,
      onRegisteredSW(_url, registration) {
        if (!registration) return
        const check = () => registration.update().catch(() => {})
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') check()
        })
        setInterval(check, 15 * 60 * 1000)
      },
    })
  })
}
