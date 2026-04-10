// ─── Sidebar Navigation ─────────────────────────────────────────────────────
// Handles building the sidebar nav list and mobile drawer functionality.

import { allPages } from '../methods/definitions'

/**
 * Build the sidebar navigation list from page metadata.
 */
export function buildSidebarNav(): void {
  const navList = document.getElementById('nav-list')
  if (!navList) return
  for (const page of allPages) {
    const li = document.createElement('li')
    li.innerHTML = `
      <a href="#${page.hash}" class="nav-link" data-page="${page.hash}">
        <span class="nav-label">${page.title}</span>
      </a>
    `
    navList.appendChild(li)
  }
}

/**
 * Initialize the mobile navigation drawer (hamburger menu).
 */
export function initMobileNav(): void {
  const sidebar = document.getElementById('sidebar')
  const hamburger = document.getElementById('hamburger')
  const overlay = document.getElementById('nav-overlay')
  if (!sidebar || !hamburger || !overlay) return

  // Type assertions after null check - these elements are guaranteed to exist
  const sidebarEl = sidebar as HTMLElement
  const hamburgerEl = hamburger as HTMLElement
  const overlayEl = overlay as HTMLElement

  function openNav(): void {
    sidebarEl.classList.add('open')
    overlayEl.classList.add('visible')
    hamburgerEl.classList.add('open')
    hamburgerEl.setAttribute('aria-expanded', 'true')
    document.body.style.overflow = 'hidden' // prevent background scroll
  }

  function closeNav(): void {
    sidebarEl.classList.remove('open')
    overlayEl.classList.remove('visible')
    hamburgerEl.classList.remove('open')
    hamburgerEl.setAttribute('aria-expanded', 'false')
    document.body.style.overflow = ''
  }

  hamburgerEl.addEventListener('click', () => {
    if (sidebarEl.classList.contains('open')) {
      closeNav()
    } else {
      openNav()
    }
  })

  // Close when tapping the overlay
  overlayEl.addEventListener('click', closeNav)

  // Close when a nav link is tapped (on mobile the page change makes drawer redundant)
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      // Small delay so the active style updates before the drawer closes
      setTimeout(closeNav, 120)
    })
  })
}
