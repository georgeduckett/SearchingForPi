// ─── Basel Problem Mathematics ────────────────────────────────────────────────
// Mathematical functions for the Basel problem method.

// ─── Series Calculations ──────────────────────────────────────────────────────

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
