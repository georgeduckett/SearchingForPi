import './style.css'
import { initRouter, registerPage } from './router'
import { createHomePage }       from './methods/home'
import { createMonteCarloPage } from './methods/monteCarlo'
import { createLeibnizPage }    from './methods/leibniz'
import { createBuffonPage }     from './methods/buffon'
import { createCoinTossPage }   from './methods/coinToss'
import { createBouncingBoxesPage } from './methods/bouncingBoxes'

// ─── Register pages ───────────────────────────────────────────────────────────
registerPage('home',        createHomePage)
registerPage('monte-carlo', createMonteCarloPage)
registerPage('leibniz',     createLeibnizPage)
registerPage('buffon',      createBuffonPage)
registerPage('coin-toss',   createCoinTossPage)
registerPage('bouncing-boxes', createBouncingBoxesPage)

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

// ─── Boot the router ──────────────────────────────────────────────────────────
initRouter()