// ─── Archimedes Types & Constants ────────────────────────────────────────────
// Type definitions and constants for the Archimedes polygons method.

// ─── Constants ───────────────────────────────────────────────────────────────
export const MAX_ITERATIONS = 9
export const INITIAL_SIDES = 6

// ─── Types ────────────────────────────────────────────────────────────────────
export interface State {
  sides: number
  iteration: number
  lower: number
  upper: number
  animating: boolean
  targetSides: number
  progress: number
  animationId: number | null
  startLower: number
  startUpper: number
  endLower: number
  endUpper: number
  startSides: number
}

// ─── Initial State Factory ───────────────────────────────────────────────────
export function createInitialState(): State {
  const initialBounds = calculateBounds(INITIAL_SIDES)
  return {
    sides: INITIAL_SIDES,
    iteration: 0,
    lower: initialBounds.lower,
    upper: initialBounds.upper,
    animating: false,
    targetSides: INITIAL_SIDES,
    progress: 0,
    animationId: null,
    startLower: 0,
    startUpper: 0,
    endLower: 0,
    endUpper: 0,
    startSides: INITIAL_SIDES,
  }
}

// ─── Bounds Calculation ──────────────────────────────────────────────────────

/**
 * Calculate the lower and upper bounds for π using polygon approximation.
 * Lower bound: n × sin(π/n) - inscribed polygon
 * Upper bound: n × tan(π/n) - circumscribed polygon
 */
export function calculateBounds(sides: number): { lower: number; upper: number } {
  const angle = Math.PI / sides
  return {
    lower: sides * Math.sin(angle),
    upper: sides * Math.tan(angle),
  }
}

/**
 * Calculate the average estimate of π from bounds.
 */
export function estimatePi(lower: number, upper: number): number {
  return (lower + upper) / 2
}

/**
 * Calculate the gap between bounds.
 */
export function calculateGap(lower: number, upper: number): number {
  return upper - lower
}
