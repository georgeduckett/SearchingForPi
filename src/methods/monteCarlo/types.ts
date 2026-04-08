// ─── Monte Carlo Types & Constants ───────────────────────────────────────────
// Type definitions and constants for the Monte Carlo method.

import { CANVAS_SIZE } from '../../colors'
import type { AnimationController } from '../base/controller'

// ─── Constants ───────────────────────────────────────────────────────────────
export const DOTS_PER_TICK = 30
export const MAX_DOTS = 20_000
export const DOT_RADIUS = 1.2
export const DOT_ALPHA = 0.7
export const PREVIEW_DOT_RADIUS = 1.5
export const CIRCLE_RADIUS_FACTOR = 0.5 // r = s * CIRCLE_RADIUS_FACTOR

// Derived constants
export const CIRCLE_RADIUS = CANVAS_SIZE * CIRCLE_RADIUS_FACTOR

// ─── Types ────────────────────────────────────────────────────────────────────
export interface State {
  inside: number
  total: number
  running: boolean
  rafId: number | null
  intervalId: ReturnType<typeof setInterval> | null // For AnimationState compatibility
  /** Controller instance for cleanup (set during init) */
  _controller?: AnimationController
}

// ─── Initial State Factory ───────────────────────────────────────────────────
export function createInitialState(): State {
  return {
    inside: 0,
    total: 0,
    running: false,
    rafId: null,
    intervalId: null,
  }
}
