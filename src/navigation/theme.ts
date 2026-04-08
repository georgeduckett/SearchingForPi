// ─── Theme Toggle ───────────────────────────────────────────────────────────
// Handles light/dark theme switching with localStorage persistence.

import { clearCSSVarCache } from '../cssVars'

const THEME_KEY = 'theme-preference'

export type Theme = 'dark' | 'light'

/**
 * Apply the specified theme to the document.
 */
export function applyTheme(theme: Theme): void {
  const themeToggle = document.getElementById('theme-toggle')

  document.body.classList.toggle('theme-light', theme === 'light')
  document.body.classList.toggle('theme-dark', theme === 'dark')

  // Clear cached CSS variable values so colors update for the new theme
  clearCSSVarCache()

  if (themeToggle) {
    themeToggle.textContent = theme === 'light' ? '☾ Dark Mode' : '☀️ Light Mode'
    themeToggle.setAttribute('aria-pressed', String(theme === 'light'))
  }
}

/**
 * Get the stored theme preference from localStorage.
 */
export function getStoredTheme(): Theme | null {
  const stored = localStorage.getItem(THEME_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return null
}

/**
 * Detect the user's preferred color scheme.
 */
export function detectPreferredTheme(): Theme {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark'
}

/**
 * Initialize theme toggle functionality.
 * Applies stored or detected theme and wires up the toggle button.
 */
export function initTheme(): void {
  const themeToggle = document.getElementById('theme-toggle')

  // Apply initial theme
  const initialTheme = getStoredTheme() ?? detectPreferredTheme()
  applyTheme(initialTheme)

  // Wire up toggle button
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const nextTheme: Theme = document.body.classList.contains('theme-light') ? 'dark' : 'light'
      localStorage.setItem(THEME_KEY, nextTheme)
      applyTheme(nextTheme)
    })
  }
}
