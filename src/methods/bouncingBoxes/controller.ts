// ─── Bouncing Boxes Controller ────────────────────────────────────────────────
// Animation control logic for the bouncing boxes method.
// Handles physics simulation, sound, and canvas resizing.

import type { MethodPageContext } from '../base/page/types'
import {
  State,
  BASE_CANVAS_W,
  BASE_CANVAS_H,
  BASE_INITIAL_X1,
  BASE_INITIAL_X2,
  V0,
  MOBILE_BREAKPOINT,
} from './types'
import { updatePhysics, isSimulationComplete, calculatePiApprox } from './physics'
import { createSoundManager } from './sound'
import { draw, calculateCanvasSize } from './rendering'

// ─── Stats Management ─────────────────────────────────────────────────────────

/**
 * Stats element references for Bouncing Boxes method.
 */
export interface StatsElements {
  hits: HTMLElement
  piApprox: HTMLElement
}

/**
 * Creates a stats updater function for Bouncing Boxes.
 */
export function createStatsUpdater(elements: StatsElements, state: State): () => void {
  return function updateStats(): void {
    elements.hits.textContent = state.collisions.toString()
    const piApprox = calculatePiApprox(state.collisions, state.k)
    elements.piApprox.textContent = piApprox.toFixed(state.k)
  }
}

// ─── Controller ───────────────────────────────────────────────────────────────

/**
 * Controller for Bouncing Boxes animation.
 * Manages the simulation loop, sound, and canvas sizing.
 */
export interface BouncingBoxesController {
  /** Start the simulation */
  start(): void
  /** Stop the simulation */
  stop(): void
  /** Reset to initial state */
  reset(): void
  /** Update canvas size (call on resize) */
  updateCanvasSize(): void
  /** Cleanup resources */
  cleanup(): void
}

/**
 * Creates the controller for Bouncing Boxes method.
 */
export function createBouncingBoxesController(
  ctx: MethodPageContext<State>,
  elements: StatsElements & { elK: HTMLSelectElement }
): BouncingBoxesController {
  const { ctx: ctx2d, state, canvas } = ctx
  const { hits, piApprox, elK } = elements

  // Sound manager
  const soundManager = createSoundManager()

  // Render helper
  function render(): void {
    draw(ctx2d, state, canvas.width, canvas.height)
  }

  // Canvas sizing
  function updateCanvasSize(): void {
    const container = canvas.parentElement
    if (!container) return

    const { width, height, scale } = calculateCanvasSize(
      container.clientWidth,
      window.innerWidth,
      BASE_CANVAS_W,
      BASE_CANVAS_H,
      MOBILE_BREAKPOINT
    )

    canvas.width = width
    canvas.height = height
    state.scale = scale
    render()
  }

  // Stats update
  const updateStats = createStatsUpdater({ hits, piApprox }, state)

  // Animation tick
  function tick(timestamp: number): void {
    if (!state.running) return

    updatePhysics(state, timestamp, () => soundManager.playCollision())
    render()
    updateStats()

    // Check for completion
    if (isSimulationComplete(state)) {
      state.simulationComplete = true
      stop()
      return
    }

    if (state.running) {
      state.rafId = requestAnimationFrame(tick)
    }
  }

  function start(): void {
    if (state.running) return
    resetState()
    state.k = parseInt(elK.value)
    state.m2 = 100 ** state.k
    state.running = true
    elK.disabled = true
    state.rafId = requestAnimationFrame(tick)
  }

  function stop(): void {
    state.running = false
    elK.disabled = false
    if (state.rafId !== null) {
      cancelAnimationFrame(state.rafId)
      state.rafId = null
    }
  }

  function resetState(): void {
    state.k = 0
    state.m2 = 100 ** state.k
    state.smallBoxX = BASE_INITIAL_X1
    state.smallBoxV = 0
    state.largeBoxX = BASE_INITIAL_X2
    state.largeBoxV = -V0
    state.collisions = 0
    state.running = false
    state.rafId = null
    state.time = 0
    state.pendingCollisions = 0
    state.simulationComplete = false
    state.vibrationOffset = 0
  }

  function reset(): void {
    stop()
    resetState()
    render()
    hits.textContent = '0'
    piApprox.textContent = '0'
  }

  function cleanup(): void {
    stop()
    soundManager.cleanup()
  }

  // Set up resize handling
  state.resizeObserver = new ResizeObserver(() => {
    updateCanvasSize()
  })
  state.resizeObserver.observe(canvas.parentElement!)

  // Initial size
  updateCanvasSize()

  return { start, stop, reset, updateCanvasSize, cleanup }
}
