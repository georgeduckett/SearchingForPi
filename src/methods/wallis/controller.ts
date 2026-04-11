// ─── Wallis Product Controller ────────────────────────────────────────────────
// Main controller factory for the Wallis product method.
// Uses the base interval controller for animation management.

import type { MethodPageContext } from '../base/page/types'
import { createIntervalController, type AnimationController } from '../base/controller'
import { State, MAX_FACTORS } from './types'
import { getFactor } from './math'
import { draw } from './rendering'
import { createStatsUpdater, type StatsElements } from './stats'

// ─── Animation Logic ──────────────────────────────────────────────────────────

/**
 * Add a single factor to the product.
 */
export function addFactor(state: State, ctx2d: CanvasRenderingContext2D): void {
  state.factors++
  state.product *= getFactor(state.factors)
  draw(ctx2d, state)
}

// ─── Controller Factory ────────────────────────────────────────────────────────

/**
 * Creates the full animation controller for Wallis method.
 * This wires up all buttons and manages the animation lifecycle.
 */
export function createWallisController(
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
    intervalMs: 50,
    tick: () => {
      addFactor(state, ctx2d)
      updateStats()
    },
    isComplete: state => state.factors >= MAX_FACTORS,
    onComplete: () => {
      btnStart.textContent = 'Done'
      btnStart.disabled = true
    },
    onReset: () => {
      state.factors = 0
      state.product = 1
      draw(ctx2d, state)
      updateStats()
    },
    onStep: () => {
      addFactor(state, ctx2d)
      updateStats()
      btnReset.disabled = false
    },
  })

  return controller
}

// Re-export types for backward compatibility
export type { StatsElements } from './stats'
