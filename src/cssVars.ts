// ─── CSS Custom Property Reader ───────────────────────────────────────────────
// Utility for reading CSS custom properties at runtime.
// This ensures colors.ts stays in sync with style.css.

/**
 * Get a CSS custom property value from the root element.
 * @param name - The CSS variable name (with or without --)
 * @param fallback - Optional fallback value if the variable is not set
 * @returns The computed value as a string
 */
export function getCSSVar(name: string, fallback?: string): string {
  const varName = name.startsWith('--') ? name : `--${name}`
  const root = document.documentElement
  const value = getComputedStyle(root).getPropertyValue(varName).trim()
  return value || fallback || ''
}

/**
 * Get a CSS custom property value, caching the result for performance.
 * Useful for colors that don't change during runtime (except for theme changes).
 */
const cache = new Map<string, string>()

export function getCSSVarCached(name: string, fallback?: string): string {
  const varName = name.startsWith('--') ? name : `--${name}`

  // Check cache first
  const cached = cache.get(varName)
  if (cached !== undefined) {
    return cached
  }

  // Get and cache the value
  const value = getCSSVar(varName, fallback)
  if (value) {
    cache.set(varName, value)
  }
  return value
}

/**
 * Clear the CSS variable cache. Call this when the theme changes.
 */
export function clearCSSVarCache(): void {
  cache.clear()
}

/**
 * Initialize CSS variable cache by pre-loading all known theme variables.
 * Should be called once at app startup.
 */
export function initCSSVarCache(): void {
  // Pre-cache all theme variables used in the app
  const themeVars = [
    'bg-deep',
    'bg-surface',
    'bg-raised',
    'border',
    'border-bright',
    'text-primary',
    'text-secondary',
    'text-muted',
    'amber',
    'amber-bright',
    'amber-dim',
    'inside',
    'outside',
    'success',
  ]

  for (const varName of themeVars) {
    getCSSVarCached(varName)
  }
}
