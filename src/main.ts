import './style.css'
import { initRouter, registerPage } from './router'
import { createHomePage }       from './methods/home'
import { createMonteCarloPage } from './methods/monteCarlo'
import { createLeibnizPage }    from './methods/leibniz'
import { createBuffonPage }     from './methods/buffon'
import { createCoinTossPage }   from './methods/coinToss'
import { createBouncingBoxesPage } from './methods/bouncingBoxes'
import { createArchimedesPage } from './methods/archimedes'
import { createDrawCirclePage } from './methods/drawCircle'

// ─── Register pages ───────────────────────────────────────────────────────────
registerPage('home',        createHomePage)
registerPage('monte-carlo', createMonteCarloPage)
registerPage('leibniz',     createLeibnizPage)
registerPage('buffon',      createBuffonPage)
registerPage('coin-toss',   createCoinTossPage)
registerPage('bouncing-boxes', createBouncingBoxesPage)
registerPage('archimedes',  createArchimedesPage)
registerPage('draw-circle', createDrawCirclePage)

// ─── Mobile nav drawer ────────────────────────────────────────────────────────
const sidebar   = document.getElementById('sidebar')!
const hamburger = document.getElementById('hamburger')!
const overlay   = document.getElementById('nav-overlay')!

function openNav(): void {
  sidebar.classList.add('open')
  overlay.classList.add('visible')
  hamburger.classList.add('open')
  hamburger.setAttribute('aria-expanded', 'true')
  document.body.style.overflow = 'hidden'   // prevent background scroll
}

function closeNav(): void {
  sidebar.classList.remove('open')
  overlay.classList.remove('visible')
  hamburger.classList.remove('open')
  hamburger.setAttribute('aria-expanded', 'false')
  document.body.style.overflow = ''
}

hamburger.addEventListener('click', () => {
  sidebar.classList.contains('open') ? closeNav() : openNav()
})

// Close when tapping the overlay
overlay.addEventListener('click', closeNav)

// Close when a nav link is tapped (on mobile the page change makes drawer redundant)
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    // Small delay so the active style updates before the drawer closes
    setTimeout(closeNav, 120)
  })
})

// ─── Theme toggle (light/dark, persisted) ────────────────────────────────────
const themeToggle = document.getElementById('theme-toggle')
const THEME_KEY = 'theme-preference'

type Theme = 'dark' | 'light'

function applyTheme(theme: Theme): void {
  document.body.classList.toggle('theme-light', theme === 'light')
  document.body.classList.toggle('theme-dark', theme === 'dark')
  if (themeToggle) {
    themeToggle.textContent = theme === 'light' ? '☾ Dark Mode' : '☀️ Light Mode'
    themeToggle.setAttribute('aria-pressed', String(theme === 'light'))
  }
}

function getStoredTheme(): Theme | null {
  const stored = localStorage.getItem(THEME_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return null
}

function detectPreferredTheme(): Theme {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark'
}

const initialTheme = getStoredTheme() ?? detectPreferredTheme()
applyTheme(initialTheme)

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const nextTheme: Theme = document.body.classList.contains('theme-light') ? 'dark' : 'light'
    localStorage.setItem(THEME_KEY, nextTheme)
    applyTheme(nextTheme)
  })
}

// ─── Boot the router ──────────────────────────────────────────────────────────
initRouter()