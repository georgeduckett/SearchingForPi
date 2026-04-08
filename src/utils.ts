/**
 * Format a number to a fixed number of decimal places.
 * @param n - The number to format
 * @param digits - Number of decimal places (default: 6)
 */
export function fmt(n: number, digits = 6): string {
  return n.toFixed(digits)
}

/**
 * Calculate the Euclidean distance between two points.
 */
export function distance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2)
}

/**
 * Get canvas-relative coordinates from a mouse or touch event.
 */
export function getCanvasCoords(
  canvas: HTMLCanvasElement,
  e: MouseEvent | TouchEvent
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height

  // Handle both mouse events and touch events
  const clientX = 'touches' in e ? (e.touches[0]?.clientX ?? 0) : e.clientX
  const clientY = 'touches' in e ? (e.touches[0]?.clientY ?? 0) : e.clientY

  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  }
}

/**
 * Safely query for an element, throwing a descriptive error if not found.
 */
export function queryRequired<T extends Element>(
  parent: Element | Document,
  selector: string,
  elementType?: new () => T
): T {
  const el = parent.querySelector(selector)
  if (!el) {
    throw new Error(`Required element not found: ${selector}`)
  }
  if (elementType && !(el instanceof elementType)) {
    throw new Error(`Element ${selector} is not of expected type`)
  }
  return el as T
}

// ─── Math Utilities ─────────────────────────────────────────────────────────

/**
 * Calculate the greatest common divisor of two numbers.
 */
export function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a))
  b = Math.abs(Math.round(b))
  while (b !== 0) {
    const t = b
    b = a % b
    a = t
  }
  return a
}

/**
 * Check if two numbers are coprime (GCD == 1).
 */
export function isCoprime(a: number, b: number): boolean {
  return gcd(a, b) === 1
}

/**
 * Get the 2D rendering context from a canvas, throwing a descriptive error if unavailable.
 */
export function getCanvasContext2D(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Could not get 2D rendering context from canvas')
  }
  return ctx
}
