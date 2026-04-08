// ─── Bouncing Boxes Types & Constants ────────────────────────────────────────
// Type definitions and constants for the bouncing boxes method.

// Controller type is defined in controller.ts to avoid circular dependency
// The _controller property uses BouncingBoxesController interface

// ─── Constants ───────────────────────────────────────────────────────────────
export const BASE_CANVAS_W = 810
export const BASE_CANVAS_H = 240
export const BASE_BOX_SIZE = 20
export const BASE_BOX2_MIN_SIZE = 20
export const BASE_BOX2_MAX_SIZE = 60
export const BASE_WALL_X = 50
export const BASE_INITIAL_X1 = BASE_WALL_X + BASE_CANVAS_W / 3
export const BASE_INITIAL_X2 = (BASE_CANVAS_W / 3) * 2
export const V0 = 80
export const M1 = 1
export const MOBILE_BREAKPOINT = 700
export const MAX_COLLISIONS_PER_FRAME = 461

// ─── State ────────────────────────────────────────────────────────────────────
export interface State {
  k: number
  m2: number
  smallBoxX: number
  smallBoxV: number
  largeBoxX: number
  largeBoxV: number
  collisions: number
  running: boolean
  rafId: number | null
  time: number
  scale: number
  pendingCollisions: number
  simulationComplete: boolean
  vibrationOffset: number
  audioContext: AudioContext | null
  currentOsc: OscillatorNode | null
  soundTimeout: ReturnType<typeof setTimeout> | null
  resizeObserver: ResizeObserver | null
  /** Controller instance for cleanup (set during init) */
  _controller?: { cleanup(): void }
}

// ─── Initial State Factory ───────────────────────────────────────────────────
export function createInitialState(): State {
  return {
    k: 0,
    m2: 100 ** 0,
    smallBoxX: BASE_INITIAL_X1,
    smallBoxV: 0,
    largeBoxX: BASE_INITIAL_X2,
    largeBoxV: -V0,
    collisions: 0,
    running: false,
    rafId: null,
    time: 0,
    scale: 1,
    pendingCollisions: 0,
    simulationComplete: false,
    vibrationOffset: 0,
    audioContext: null,
    currentOsc: null,
    soundTimeout: null,
    resizeObserver: null,
  }
}
