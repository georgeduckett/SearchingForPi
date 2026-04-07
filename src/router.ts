// ─── Router ────────────────────────────────────────────────────────────────
// A minimal hash-based router. Each page registers itself as a factory
// that returns { render: () => HTMLElement, cleanup: () => void }.

import { allPages } from './methods/definitions'

export interface Page {
  /** Called to build and return the page's DOM element. */
  render(): HTMLElement
  /** Called when the page is about to be replaced — cancel timers etc. */
  cleanup(): void
}

export type PageFactory = () => Page

const registry = new Map<string, PageFactory>()

/**
 * Register a page factory under a hash key.
 * Called during app initialization for each method page.
 * @param hash - The URL hash key (e.g., 'monte-carlo', 'leibniz')
 * @param factory - Factory function that creates a Page instance
 */
export function registerPage(hash: string, factory: PageFactory): void {
  registry.set(hash, factory)
}

// Track the active page so we can call cleanup() before switching.
let activePage: Page | null = null
// Track the current hash for navigation
let currentHash: string = 'home'

/**
 * Get the current page hash.
 * @returns The current URL hash without the '#' prefix (e.g., 'home', 'monte-carlo')
 */
export function getCurrentHash(): string {
  return currentHash
}

/**
 * Get the index of the current page in the allPages array.
 * Used for sequential navigation (prev/next).
 * @returns Zero-based index, or -1 if not found
 */
function getCurrentIndex(): number {
  return allPages.findIndex(p => p.hash === currentHash)
}

/**
 * Check if there's a previous page available for navigation.
 * @returns true if current page is not the first in the list
 */
export function hasPrevPage(): boolean {
  return getCurrentIndex() > 0
}

/**
 * Check if there's a next page available for navigation.
 * @returns true if current page is not the last in the list
 */
export function hasNextPage(): boolean {
  return getCurrentIndex() < allPages.length - 1
}

/**
 * Navigate to the previous page in the method list.
 * Does nothing if already on the first page.
 * Updates the URL hash, which triggers navigation via hashchange event.
 */
export function navigateToPrev(): void {
  const currentIndex = getCurrentIndex()
  if (currentIndex > 0) {
    const prevHash = allPages[currentIndex - 1].hash
    location.hash = prevHash
  }
}

/**
 * Navigate to the next page in the method list.
 * Does nothing if already on the last page.
 * Updates the URL hash, which triggers navigation via hashchange event.
 */
export function navigateToNext(): void {
  const currentIndex = getCurrentIndex()
  if (currentIndex < allPages.length - 1) {
    const nextHash = allPages[currentIndex + 1].hash
    location.hash = nextHash
  }
}

function navigate(hash: string): void {
  const container = document.getElementById('page-container')
  if (!container) return

  // Clean up the previous page (stop animations, clear intervals, etc.)
  if (activePage) {
    activePage.cleanup()
    activePage = null
  }

  const factory = registry.get(hash) ?? registry.get('home')
  if (!factory) return

  currentHash = hash
  activePage = factory()
  container.innerHTML = ''
  container.appendChild(activePage.render())

  // Reset scroll position on page change
  document.getElementById('main-content')?.scrollTo(0, 0)

  // Update active nav link
  document.querySelectorAll('.nav-link').forEach(el => {
    const link = el as HTMLAnchorElement
    link.classList.toggle('active', link.dataset['page'] === hash)
  })

  // Dispatch custom event for navigation state changes
  window.dispatchEvent(new CustomEvent('pagechange', { detail: { hash } }))
}

/**
 * Initialize the router and set up hash change listener.
 * Must be called once on app startup after all pages are registered.
 *
 * Sets up a hashchange event listener to handle browser navigation
 * (back/forward buttons) and navigates to the initial hash from the URL.
 *
 * @example
 * ```ts
 * // In main.ts, after registering pages
 * initRouter()
 * ```
 */
export function initRouter(): void {
  // Listen for hash changes (back/forward, clicking nav links)
  window.addEventListener('hashchange', () => {
    const hash = location.hash.replace('#', '') || 'home'
    navigate(hash)
  })

  // Navigate to the initial hash on load
  const initial = location.hash.replace('#', '') || 'home'
  navigate(initial)
}
