// ─── Monte Carlo Sampling ────────────────────────────────────────────────────
// Point generation and π estimation calculations.

import { CANVAS_SIZE } from '../../colors'
import { isInsideCircle } from '../base/canvas'
import { State, CIRCLE_RADIUS } from './types'

// ─── π Estimation ────────────────────────────────────────────────────────────

/**
 * Estimate π from the ratio of points inside the circle to total points.
 * Formula: π ≈ 4 × (inside / total)
 */
export function estimatePi(inside: number, total: number): number {
  return total === 0 ? 0 : (4 * inside) / total
}

// ─── Point Generation ────────────────────────────────────────────────────────

export interface PointResult {
  x: number
  y: number
  isInside: boolean
}

/**
 * Generate a random point and check if it's inside the circle.
 */
export function generatePoint(): PointResult {
  const x = Math.random() * CANVAS_SIZE
  const y = Math.random() * CANVAS_SIZE
  const isInside = isInsideCircle(x, y, CIRCLE_RADIUS, CIRCLE_RADIUS, CIRCLE_RADIUS)
  return { x, y, isInside }
}

/**
 * Generate multiple points and update state.
 * Returns the generated points for rendering.
 */
export function generatePoints(state: State, count: number): PointResult[] {
  const points: PointResult[] = []
  for (let i = 0; i < count; i++) {
    const point = generatePoint()
    points.push(point)
    if (point.isInside) state.inside++
    state.total++
  }
  return points
}
