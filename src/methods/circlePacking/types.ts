// ─── Circle Packing Types & Constants ────────────────────────────────────────
// Type definitions and constants for the circle packing method.

// ─── Constants ───────────────────────────────────────────────────────────────
export const MAX_CIRCLES = 500
export const MIN_RADIUS = 8
export const MAX_RADIUS = 25
export const ATTEMPTS_PER_CIRCLE = 100
export const PADDING = 20

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Circle {
  x: number
  y: number
  r: number
  color: string
}

export interface State {
  circles: Circle[]
  rejected: number
  running: boolean
  rafId: number | null
}

// ─── Initial State Factory ───────────────────────────────────────────────────
export function createInitialState(): State {
  return {
    circles: [],
    rejected: 0,
    running: false,
    rafId: null,
  }
}
