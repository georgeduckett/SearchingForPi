// ─── Circle Packing Physics ──────────────────────────────────────────────────
// Circle placement and overlap detection algorithms.

import { Circle, MIN_RADIUS, MAX_RADIUS, ATTEMPTS_PER_CIRCLE, PADDING } from './types'

// ─── Overlap Detection ───────────────────────────────────────────────────────

/**
 * Check if a circle at given position and radius overlaps with existing circles.
 */
export function overlaps(x: number, y: number, r: number, circles: Circle[]): boolean {
  for (const c of circles) {
    const dx = x - c.x
    const dy = y - c.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < r + c.r + 2) return true
  }
  return false
}

// ─── Circle Placement ────────────────────────────────────────────────────────

export interface PlacementResult {
  placed: boolean
  circle?: Circle
}

/**
 * Attempt to place a new circle using random sequential adsorption.
 * Returns the placed circle or null if placement failed.
 */
export function tryPlaceCircle(
  canvasWidth: number,
  canvasHeight: number,
  circles: Circle[]
): PlacementResult {
  const W = canvasWidth - PADDING * 2
  const H = canvasHeight - PADDING * 2

  for (let attempt = 0; attempt < ATTEMPTS_PER_CIRCLE; attempt++) {
    const r = MIN_RADIUS + Math.random() * (MAX_RADIUS - MIN_RADIUS)
    const x = PADDING + r + Math.random() * (W - 2 * r)
    const y = PADDING + r + Math.random() * (H - 2 * r)

    if (!overlaps(x, y, r, circles)) {
      // Generate color based on radius (blue to cyan gradient)
      const hue = 200 + ((r - MIN_RADIUS) / (MAX_RADIUS - MIN_RADIUS)) * 40
      const circle: Circle = {
        x,
        y,
        r,
        color: `hsl(${hue}, 65%, 55%)`,
      }
      return { placed: true, circle }
    }
  }
  return { placed: false }
}

// ─── π Estimation ────────────────────────────────────────────────────────────

/**
 * Estimate π from the circle packing using Monte Carlo sampling.
 * For non-overlapping circles: covered_area = π × Σr²
 * So π ≈ covered_area / Σr²
 */
export function estimatePi(circles: Circle[], canvasWidth: number, canvasHeight: number): number {
  if (circles.length === 0) return 0

  // Sum of r² for all circles
  const sumRSquared = circles.reduce((sum, c) => sum + c.r * c.r, 0)

  const W = canvasWidth - PADDING * 2
  const H = canvasHeight - PADDING * 2

  // Monte Carlo sampling to estimate covered area
  let coveredPixels = 0
  const samples = 10000
  for (let i = 0; i < samples; i++) {
    const x = PADDING + Math.random() * W
    const y = PADDING + Math.random() * H
    for (const c of circles) {
      const dx = x - c.x
      const dy = y - c.y
      if (dx * dx + dy * dy <= c.r * c.r) {
        coveredPixels++
        break
      }
    }
  }

  const coveredFraction = coveredPixels / samples
  const coveredArea = coveredFraction * W * H

  return coveredArea / sumRSquared
}

/**
 * Calculate the area coverage percentage.
 */
export function calculateCoverage(
  circles: Circle[],
  canvasWidth: number,
  canvasHeight: number
): number {
  const totalArea = (canvasWidth - PADDING * 2) * (canvasHeight - PADDING * 2)
  let circleArea = 0
  for (const c of circles) {
    circleArea += Math.PI * c.r * c.r
  }
  return (circleArea / totalArea) * 100
}
