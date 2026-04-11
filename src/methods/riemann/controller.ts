// ─── Riemann Integral Controller ──────────────────────────────────────────────
// Main controller factory for the Riemann integral method.
// Uses the base interval controller for animation management.

import type { MethodPageContext } from '../base/page/types'
import { createIntervalController, type AnimationController } from '../base/controller'
import { State, MAX_RECTS } from './types'
import { draw } from './rendering'
import { createStatsUpdater, type StatsElements } from './stats'

// ─── Animation Logic ──────────────────────────────────────────────────────────

/**
 * Add rectangles to the visualization.
 */
export function addRects(state: State, count: number, ctx2d: CanvasRenderingContext2D): void {
  state.rects = Math.min(state.rects + count, MAX_RECTS)
  draw(ctx2d, state)
}

// ─── Controller Factory ────────────────────────────────────────────────────────

/**
 * Creates the full animation controller for Riemann method.
 * This wires up all buttons and manages the animation lifecycle.
 */
export function createRiemannController(
  ctx: MethodPageContext<State>,
  elements: StatsElements
): AnimationController {
  const { ctx: ctx2d, state, $id } = ctx

  // Get button references
  const btnStart = $id('btn-start', HTMLButtonElement)
  const btnStep = $id('btn-step', HTMLButtonElement)
  const btnReset = $id('btn-reset', HTMLButtonElement)

  // Create stats updater
  const updateStats = createStatsUpdater(elements, state)

  // Initial draw
  draw(ctx2d, state)
  updateStats()

  // Create the interval controller
  const controller = createIntervalController({
    ctx,
    buttons: { btnStart, btnStep, btnReset },
    intervalMs: 100,
    tick: () => {
      addRects(state, 5, ctx2d)
      updateStats()
    },
    isComplete: state => state.rects >= MAX_RECTS,
    onComplete: () => {
      btnStart.textContent = 'Done'
      btnStart.disabled = true
    },
    onReset: () => {
      state.rects = 0
      draw(ctx2d, state)
      updateStats()
    },
    onStep: () => {
      addRects(state, 5, ctx2d)
      updateStats()
      btnReset.disabled = false
    },
  })

  return controller
}

// Re-export types for backward compatibility
export type { StatsElements } from './stats'
