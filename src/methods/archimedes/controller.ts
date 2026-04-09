// ─── Archimedes Controller ────────────────────────────────────────────────────
// Main controller factory for the Archimedes polygons method.
// Wires up buttons and manages the animation lifecycle.

import type { MethodPageContext } from '../base/page/types'
import { State, INITIAL_SIDES } from './types'
import { draw } from './rendering'
import { createStatsUpdater, type StatsElements } from './stats'
import {
  createAnimateTransition,
  stepTo,
  step,
  play,
  reset,
  type ArchimedesButtons,
} from './animation'

// ─── Controller Factory ────────────────────────────────────────────────────────

/**
 * Creates the full animation controller for Archimedes method.
 * This wires up all buttons and manages the animation lifecycle.
 */
export function createArchimedesController(
  ctx: MethodPageContext<State>,
  elements: StatsElements
): {
  start: () => void
  reset: () => void
  step: () => void
  stepTo: (sides: number) => void
  cleanup: () => void
} {
  const { ctx: ctx2d, state, $id } = ctx

  // Get button references
  const btnStep = $id('btn-step', HTMLButtonElement)
  const btnPlay = $id('btn-play', HTMLButtonElement)
  const btnReset = $id('btn-reset', HTMLButtonElement)
  const selectIter = $id('select-iter', HTMLSelectElement)

  const buttons: ArchimedesButtons = { btnStep, btnPlay, btnReset, selectIter }

  // Create stats updater
  const updateStats = createStatsUpdater(elements, state)

  // Create animation function
  const animateTransition = createAnimateTransition(ctx2d, state, buttons, updateStats)

  // Create stepTo bound to this context
  const boundStepTo = (sides: number) => {
    stepTo(sides, state, ctx2d, animateTransition, buttons)
  }

  // Initial draw
  updateStats()
  draw(ctx2d, INITIAL_SIDES, state.lower, state.upper)

  // Wire up buttons
  btnStep.addEventListener('click', () => step(state, buttons, boundStepTo))
  btnPlay.addEventListener('click', () => play(state, buttons, boundStepTo))
  btnReset.addEventListener('click', () => reset(state, ctx2d, buttons, updateStats))
  selectIter.addEventListener('change', e => {
    const iter = parseInt((e.target as HTMLSelectElement).value)
    const sides = INITIAL_SIDES * Math.pow(2, iter)
    boundStepTo(sides)
  })

  return {
    start: () => play(state, buttons, boundStepTo),
    reset: () => reset(state, ctx2d, buttons, updateStats),
    step: () => step(state, buttons, boundStepTo),
    stepTo: boundStepTo,
    cleanup: () => {
      if (state.animationId !== null) {
        cancelAnimationFrame(state.animationId)
        state.animationId = null
      }
      state.animating = false
    },
  }
}

// Re-export types for backward compatibility
export type { StatsElements } from './stats'
