// ─── Galton Board Types & Constants ──────────────────────────────────────────
// Type definitions and constants for the Galton board method.

// ─── Constants ───────────────────────────────────────────────────────────────
export const ROWS = 12
export const NUM_BINS = ROWS + 1
export const MAX_BALLS = 500
export const BALL_RADIUS = 4
export const PEG_RADIUS = 3

// Physics constants
export const GRAVITY = 0.25
export const RESTITUTION = 0.6
export const FRICTION = 0.99
export const PEG_DAMPING = 0.65

// Layout constants
export const PEG_START_Y = 50
export const PEG_SPACING_Y = 30
export const PEG_SPACING_X = 32

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Ball {
  x: number
  y: number
  vx: number
  vy: number
  active: boolean
  bin: number | null
}

export interface State {
  balls: Ball[]
  bins: number[]
  dropped: number
  running: boolean
  dropping: boolean
  rafId: number | null
}

// ─── Initial State Factory ───────────────────────────────────────────────────
export function createInitialState(): State {
  return {
    balls: [],
    bins: Array(NUM_BINS).fill(0),
    dropped: 0,
    running: false,
    dropping: false,
    rafId: null,
  }
}
