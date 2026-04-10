// ─── Basel Problem Controller ──────────────────────────────────────────────────
// Animation control logic for the Basel problem method.
// Extracted from page.ts for better separation of concerns.

import { fmt } from '../../utils'
import type { MethodPageContext } from '../base/page/types'
import { createStatsUpdater as buildStatsUpdater } from '../base/statsHelpers'
import { State, MAX_TERMS, baselTerm, estimatePi } from './types'
import { draw } from './rendering'

// ─── Stats Element References ──────────────────────────────────────────────────

export interface StatsElements {
  estimate: HTMLElement
  terms: HTMLElement
  sum: HTMLElement
  error: HTMLElement
}

// ─── Stats Management ──────────────────────────────────────────────────────────

/**
 * Creates a stats updater function for Basel method.
 */
export function createStatsUpdater(elements: StatsElements, state: State): () => void {
  return buildStatsUpdater()
    .piEstimate(elements.estimate, () => estimatePi(state.sum), {
      improvingThreshold: 0.1,
    })
    .counter(elements.terms, () => state.terms)
    .custom(() => {
      elements.sum.textContent = fmt(state.sum)
      const error = Math.abs(estimatePi(state.sum) - Math.PI)
      elements.error.textContent = `Error: ${fmt(error)}`
      elements.error.className = 'stat-error ' + (error < 0.1 ? 'improving' : 'neutral')
    })
    .build()
}

// ─── Controller Actions ────────────────────────────────────────────────────────

/**
 * Add a single term to the sum.
 */
export function addTerm(
  state: State,
  ctx2d: CanvasRenderingContext2D,
  updateStats: () => void,
  onStop: () => void
): void {
  state.terms++
  state.sum += baselTerm(state.terms)
  draw(ctx2d, state)
  updateStats()
  if (state.terms >= MAX_TERMS) {
    onStop()
  }
}

/**
 * Start the automatic animation.
 */
export function start(
  state: State,
  buttons: { btnStart: HTMLButtonElement; btnReset: HTMLButtonElement },
  addTermFn: () => void
): void {
  state.running = true
  buttons.btnStart.disabled = true
  buttons.btnReset.disabled = false
  buttons.btnStart.textContent = 'Running…'
  state.intervalId = setInterval(addTermFn, 150)
}

/**
 * Stop the automatic animation.
 */
export function stop(state: State, buttons: { btnStart: HTMLButtonElement }): void {
  state.running = false
  if (state.intervalId !== null) {
    clearInterval(state.intervalId)
    state.intervalId = null
  }
  buttons.btnStart.disabled = state.terms >= MAX_TERMS
  buttons.btnStart.textContent = state.terms >= MAX_TERMS ? 'Done' : 'Start'
}

/**
 * Reset to initial state.
 */
export function reset(
  state: State,
  ctx2d: CanvasRenderingContext2D,
  buttons: { btnStart: HTMLButtonElement; btnReset: HTMLButtonElement },
  updateStats: () => void
): void {
  state.terms = 0
  state.sum = 0
  draw(ctx2d, state)
  updateStats()
  buttons.btnStart.disabled = false
  buttons.btnStart.textContent = 'Start'
  buttons.btnReset.disabled = true
}

// ─── Controller Factory ────────────────────────────────────────────────────────

/**
 * Creates the full animation controller for Basel method.
 * This wires up all buttons and manages the animation lifecycle.
 */
export function createBaselController(
  ctx: MethodPageContext<State>,
  elements: StatsElements
): {
  start: () => void
  stop: () => void
  reset: () => void
  addTerm: () => void
  cleanup: () => void
} {
  const { ctx: ctx2d, state, $id } = ctx

  // Get button references
  const btnStart = $id('btn-start', HTMLButtonElement)
  const btnStep = $id('btn-step', HTMLButtonElement)
  const btnReset = $id('btn-reset', HTMLButtonElement)

  const buttons = { btnStart, btnReset }

  // Create stats updater
  const updateStats = createStatsUpdater(elements, state)

  // Create bound addTerm function
  const boundAddTerm = () => {
    addTerm(state, ctx2d, updateStats, () => stop(state, buttons))
  }

  // Initial draw
  draw(ctx2d, state)
  updateStats()

  // Wire up buttons
  btnStart.addEventListener('click', () => {
    if (!state.running) start(state, buttons, boundAddTerm)
  })

  btnStep.addEventListener('click', () => {
    if (!state.running) {
      boundAddTerm()
      btnReset.disabled = false
    }
  })

  btnReset.addEventListener('click', () => {
    stop(state, buttons)
    reset(state, ctx2d, buttons, updateStats)
  })

  return {
    start: () => start(state, buttons, boundAddTerm),
    stop: () => stop(state, buttons),
    reset: () => {
      stop(state, buttons)
      reset(state, ctx2d, buttons, updateStats)
    },
    addTerm: boundAddTerm,
    cleanup: () => {
      if (state.intervalId !== null) {
        clearInterval(state.intervalId)
        state.intervalId = null
      }
      state.running = false
    },
  }
}
