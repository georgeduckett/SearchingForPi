// ─── Basel Problem Types & Constants ─────────────────────────────────────────
// Type definitions and constants for the Basel problem method.

// ─── Constants ───────────────────────────────────────────────────────────────
export const MAX_TERMS = 50

// ─── Types ────────────────────────────────────────────────────────────────────
export interface State {
  terms: number
  sum: number
  running: boolean
  intervalId: ReturnType<typeof setInterval> | null
}

// ─── Initial State Factory ───────────────────────────────────────────────────
export function createInitialState(): State {
  return {
    terms: 0,
    sum: 0,
    running: false,
    intervalId: null,
  }
}

// ─── Mathematics ─────────────────────────────────────────────────────────────

/**
 * Calculate the nth term of the Basel series: 1/n²
 */
export function baselTerm(n: number): number {
  return 1 / (n * n)
}

/**
 * Estimate π from the partial sum.
 * Formula: π = √(6 × sum)
 */
export function estimatePi(sum: number): number {
  return Math.sqrt(6 * sum)
}

/**
 * Calculate the convergence progress toward π.
 * Returns a value between 0 and 1.
 */
export function calculateConvergence(piEstimate: number): number {
  const initialEstimate = Math.sqrt(6) // n=1
  const maxError = Math.abs(initialEstimate - Math.PI)
  const currentError = Math.abs(piEstimate - Math.PI)
  return Math.max(0, Math.min(1, 1 - currentError / maxError))
}
