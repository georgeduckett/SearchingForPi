// ─── Geometry Types and Math Helpers ─────────────────────────────────────────
// Basic geometry types and mathematical utility functions.

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Point {
  x: number
  y: number
}

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

// ─── Geometry Helpers ─────────────────────────────────────────────────────────

/**
 * Checks if a point is inside a circle.
 */
export function isInsideCircle(
  x: number,
  y: number,
  cx: number,
  cy: number,
  radius: number
): boolean {
  const dx = x - cx
  const dy = y - cy
  return dx * dx + dy * dy <= radius * radius
}

/**
 * Generates a random point in a rectangle.
 */
export function randomPoint(width: number, height: number): Point {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
  }
}

/**
 * Generates a random point in a circle.
 */
export function randomPointInCircle(cx: number, cy: number, radius: number): Point {
  const angle = Math.random() * Math.PI * 2
  const r = Math.sqrt(Math.random()) * radius
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  }
}

// ─── Math Helpers ────────────────────────────────────────────────────────────

/**
 * Linear interpolation between two values.
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/**
 * Clamps a value between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Maps a value from one range to another.
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin)
}
