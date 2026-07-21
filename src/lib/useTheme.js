import { useState, useEffect } from 'react'

const LIGHT = '#FFFEFB'
const DARK = '#1a1a1a'

function systemDark() {
  return matchMedia('(prefers-color-scheme: dark)').matches
}

function getInitial() {
  const stored = localStorage.getItem('theme')
  if (stored === 'dark' || stored === 'light') return stored
  return systemDark() ? 'dark' : 'light'
}

function apply(t) {
  const root = document.documentElement
  root.classList.toggle('dark', t === 'dark')
  // Keep the browser/PWA chrome (iOS status bar area) in sync with the theme.
  const meta = document.querySelector('meta[name=theme-color]')
  if (meta) meta.content = t === 'dark' ? DARK : LIGHT
}

// App-level init: apply the current theme and follow system changes live while
// the user hasn't picked an explicit theme. Without this the theme-color meta
// was only corrected on the Profile page, so the status bar strip could stay
// the wrong shade elsewhere.
export function initTheme() {
  apply(getInitial())
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (!localStorage.getItem('theme')) apply(systemDark() ? 'dark' : 'light')
  })
}

export function useTheme() {
  const [theme, setThemeState] = useState(getInitial)

  useEffect(() => {
    apply(theme)
  }, [theme])

  function setTheme(t) {
    localStorage.setItem('theme', t)
    setThemeState(t)
  }

  return { theme, setTheme }
}
