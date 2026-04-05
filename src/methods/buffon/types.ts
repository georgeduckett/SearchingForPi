// ─── Buffon's Needle Types & Constants ───────────────────────────────────────
// Type definitions and constants for the Buffon's needle method.

// ─── Constants ───────────────────────────────────────────────────────────────
export const CANVAS_W = 560
export const CANVAS_H = 420
export const LINE_SPACING = 60 // d — distance between parallel lines (px)
export const NEEDLE_LENGTH = 60 // l — needle length (px). l === d → short needle case
export const NEEDLES_PER_TICK = 8
export const MAX_NEEDLES = 5_000

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Needle {
  cx: number
  cy: number
  angle: number
  crosses: boolean
  scale?: number
}

export interface State {
  needles: Needle[]
  crosses: number
  total: number
  running: boolean
  rafId: number | null
  intervalId: ReturnType<typeof setInterval> | null // For AnimationState compatibility
  animating: boolean
  currentNeedle: Needle | null
  animationStartY: number
  animationEndY: number
  initialAngle: number
  finalAngle: number
}

// ─── Initial State Factory ───────────────────────────────────────────────────
export function createInitialState(): State {
  return {
    needles: [],
    crosses: 0,
    total: 0,
    running: false,
    rafId: null,
    intervalId: null,
    animating: false,
    currentNeedle: null,
    animationStartY: 0,
    animationEndY: 0,
    initialAngle: 0,
    finalAngle: 0,
  }
}
