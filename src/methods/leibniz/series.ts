// ─── Leibniz Series Mathematics ──────────────────────────────────────────────
// Term calculation and π estimation for the Leibniz series.

// ─── Term Calculation ────────────────────────────────────────────────────────

/**
 * Calculate the nth term of the Leibniz series.
 * Formula: (-1)^n / (2n + 1)
 */
export function leibnizTerm(n: number): number {
  return (n % 2 === 0 ? 1 : -1) / (2 * n + 1)
}

/**
 * Calculate π estimate from partial sum.
 * The Leibniz series converges to π/4, so multiply by 4.
 */
export function estimatePi(partialSum: number): number {
  return partialSum * 4
}

/**
 * Add the next term to the running sum.
 * Returns the new partial sum (before multiplying by 4).
 */
export function addTermToSum(previousSum: number, n: number): number {
  return previousSum + leibnizTerm(n)
}

/**
 * Get a formatted string representation of a term.
 */
export function formatTerm(n: number): { sign: string; denominator: number; value: number } {
  const term = leibnizTerm(n)
  return {
    sign: term > 0 ? '+' : '-',
    denominator: 2 * n + 1,
    value: Math.abs(term),
  }
}
