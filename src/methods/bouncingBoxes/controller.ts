// ─── Bouncing Boxes Controller ────────────────────────────────────────────────
// Main controller factory for the bouncing boxes method.
// Wires up buttons, manages physics simulation, sound, and canvas sizing.

import type { MethodPageContext } from '../base/page/types'
import { State, BASE_INITIAL_X1, BASE_INITIAL_X2, V0 } from './types'
import { updatePhysics, isSimulationComplete } from './physics'
import { createSoundManager } from './sound'
import { draw } from './rendering'
import { createStatsUpdater, type StatsElements } from './stats'
import { calculateCanvasSize } from './canvasSizing'

// ─── Controller Interface ──────────────────────────────────────────────────────

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

// ─── Controller Factory ────────────────────────────────────────────────────────

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

    const { width, height, scale } = calculateCanvasSize(container.clientWidth, window.innerWidth)

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
  const parent = canvas.parentElement
  if (parent) {
    state.resizeObserver.observe(parent)
  }

  // Initial size
  updateCanvasSize()

  return { start, stop, reset, updateCanvasSize, cleanup }
}

// Re-export types for backward compatibility
export type { StatsElements } from './stats'
