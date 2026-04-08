// ─── Leibniz Series Types & Constants ────────────────────────────────────────
// Type definitions and constants for the Leibniz series method.

import type { AnimationController } from '../base/controller'

// ─── Constants ───────────────────────────────────────────────────────────────
export const CANVAS_W = 560
export const CANVAS_H = 320
export const MAX_TERMS = 500
export const MS_PER_TERM = 40

// ─── Types ────────────────────────────────────────────────────────────────────
export interface State {
  terms: number[]
  running: boolean
  termIndex: number
  intervalId: ReturnType<typeof setInterval> | null
  rafId: number | null // For AnimationState compatibility
  /** Controller instance for cleanup (set during init) */
  _controller?: AnimationController
}

// ─── Initial State Factory ───────────────────────────────────────────────────
export function createInitialState(): State {
  return {
    terms: [],
    running: false,
    termIndex: 0,
    intervalId: null,
    rafId: null,
  }
}
