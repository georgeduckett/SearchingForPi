// ─── Buffon's Needle Physics ─────────────────────────────────────────────────
// Needle drop calculations and π estimation.

import { LINE_SPACING, NEEDLE_LENGTH } from './types'

// ─── π Estimation ────────────────────────────────────────────────────────────

/**
 * Estimate π from the number of crossings and total needles dropped.
 * Formula: π = 2l / (d × P) where P = crosses/total
 */
export function estimatePi(crosses: number, total: number): number {
  if (crosses === 0) return 0
  return (2 * NEEDLE_LENGTH * total) / (LINE_SPACING * crosses)
}

// ─── Crossing Detection ──────────────────────────────────────────────────────

/**
 * Check if a needle at given position and angle crosses a line.
 * A needle crosses when its perpendicular projection reaches a ruled line.
 */
export function doesCross(cy: number, angle: number): boolean {
  const distToLine = cy % LINE_SPACING
  const nearest = Math.min(distToLine, LINE_SPACING - distToLine)
  const halfProj = (NEEDLE_LENGTH / 2) * Math.abs(Math.sin(angle))
  return halfProj >= nearest
}

// ─── Needle Generation ───────────────────────────────────────────────────────

export interface NeedleParams {
  cx: number
  cy: number
  angle: number
}

/**
 * Generate random needle parameters within canvas bounds.
 */
export function generateRandomNeedle(canvasWidth: number, canvasHeight: number): NeedleParams {
  return {
    cx: Math.random() * canvasWidth,
    cy: Math.random() * canvasHeight,
    angle: Math.random() * Math.PI,
  }
}
