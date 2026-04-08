// ─── Coprimality Types ───────────────────────────────────────────────────────
// Type definitions and constants for the coprimality method.

import { getInsideColor, getOutsideColor } from '../../colors'

// ─── Constants ───────────────────────────────────────────────────────────────
export const MAX_PAIRS = 5000
export const PAIRS_PER_TICK = 20
export const GRID_SIZE = 50

// Method-specific colors
export const C_COPRIME = getInsideColor()
export const C_NOT_COPRIME = getOutsideColor()

// ─── Types ───────────────────────────────────────────────────────────────────
export interface Pair {
  a: number
  b: number
  coprime: boolean
}

export interface State {
  pairs: Pair[]
  coprimeCount: number
  totalPairs: number
  running: boolean
  rafId: number | null
}

// ─── State Factory ───────────────────────────────────────────────────────────
export function createInitialState(): State {
  return {
    pairs: [],
    coprimeCount: 0,
    totalPairs: 0,
    running: false,
    rafId: null,
  }
}

// ─── Estimation ──────────────────────────────────────────────────────────────
/**
 * Estimate π from coprime probability.
 * P(coprime) = 6/π², so π = √(6/P)
 */
export function estimatePi(coprimeCount: number, totalPairs: number): number {
  if (totalPairs === 0) return 0
  const prob = coprimeCount / totalPairs
  return Math.sqrt(6 / prob)
}
