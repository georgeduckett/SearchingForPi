// ─── Easing Functions ────────────────────────────────────────────────────────
// Animation easing functions for smooth transitions.

/**
 * Easing function: ease in out quad.
 */
export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

/**
 * Easing function: ease out elastic.
 */
export function easeOutElastic(t: number): number {
  const c4 = (2 * Math.PI) / 3
  return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
}

/**
 * Creates a smooth pulse between 0 and 1.
 */
export function pulse(time: number, speed = 1): number {
  return (Math.sin(time * speed) + 1) / 2
}
