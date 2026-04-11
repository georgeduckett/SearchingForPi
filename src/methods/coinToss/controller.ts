// ─── Coin Toss Controller ──────────────────────────────────────────────────────
// Animation control logic for the coin toss method.
// Extracted from page.ts for better separation of concerns.

import { fmt } from '../../utils'
import type { MethodPageContext } from '../base/page/types'
import {
  State,
  MAX_SEQUENCES,
  MAX_GRID_ROWS,
  createEmptySequence,
  advanceSequence,
  estimatePi,
} from './types'
import { draw } from './rendering'

// ─── Constants ─────────────────────────────────────────────────────────────────

const STEP_FRAME_DELAY = 80

// ─── Stats Element References ──────────────────────────────────────────────────

export interface StatsElements {
  estimate: HTMLElement
  sequences: HTMLElement
  avgRatio: HTMLElement
  error: HTMLElement
  bar: HTMLElement
}

// ─── Stats Management ──────────────────────────────────────────────────────────

/**
 * Creates a stats updater function for CoinToss method.
 */
export function createStatsUpdater(elements: StatsElements, state: State): () => void {
  return function updateStats(): void {
    const n = state.sequences.length
    const pi = estimatePi(state.sumRatios, n)
    const avgRatio = n > 0 ? state.sumRatios / n : 0

    elements.estimate.textContent = fmt(pi)
    elements.sequences.textContent = n.toLocaleString()
    elements.avgRatio.textContent = fmt(avgRatio)
    elements.error.textContent = Math.abs(pi - Math.PI).toFixed(6)
    elements.bar.style.width = `${Math.min((n / MAX_SEQUENCES) * 100, 100)}%`
  }
}

// ─── Controller Actions ────────────────────────────────────────────────────────

/**
 * Stop the auto-add process.
 */
export function stopAutoAdd(
  state: State,
  buttons: { btnStep: HTMLButtonElement; btnStart: HTMLButtonElement }
): void {
  state.autoAdding = false
  if (state.autoRafId !== null) {
    clearTimeout(state.autoRafId)
    state.autoRafId = null
  }
  if (state.highlightTimeout !== null) {
    clearTimeout(state.highlightTimeout)
    state.highlightTimeout = null
  }
  state.newCoinIndex = null
  buttons.btnStep.disabled = false
  buttons.btnStep.textContent = 'Show'
  buttons.btnStart.disabled = false
  buttons.btnStart.textContent = 'Start'
}

/**
 * Animation step for adding coins.
 */
export function animateStep(
  ctx: MethodPageContext<State>,
  updateStats: () => void,
  buttons: { btnStep: HTMLButtonElement; btnStart: HTMLButtonElement }
): void {
  const state = ctx.state
  const canvasCtx = ctx.ctx

  if (!state.autoAdding) {
    buttons.btnStep.disabled = false
    buttons.btnStart.disabled = false
    buttons.btnStart.textContent = 'Start'
    buttons.btnStep.textContent = 'Show'
    return
  }

  if (state.sequences.length >= MAX_SEQUENCES) {
    stopAutoAdd(state, buttons)
    buttons.btnStart.textContent = 'Done'
    buttons.btnStart.disabled = true
    return
  }

  if (!state.currentSequence) {
    state.currentSequence = createEmptySequence()
  }

  const complete = advanceSequence(state.currentSequence, MAX_GRID_ROWS)
  draw(canvasCtx, state)

  if (complete) {
    const completed = state.currentSequence
    if (completed) {
      state.sequences.push(completed)
      state.sumRatios += completed.ratio
      state.sequenceBatch.push(completed)
      if (state.sequenceBatch.length > MAX_GRID_ROWS) {
        state.sequenceBatch.shift()
      }
    }
    state.currentSequence = null
    updateStats()
  }

  state.autoRafId = setTimeout(() => {
    requestAnimationFrame(() => animateStep(ctx, updateStats, buttons))
  }, STEP_FRAME_DELAY)
}

/**
 * Start showing sequences.
 */
export function startShowing(
  state: State,
  buttons: { btnStep: HTMLButtonElement; btnStart: HTMLButtonElement },
  animateStepFn: () => void
): void {
  if (state.autoAdding) return
  state.autoAdding = true
  buttons.btnStart.textContent = 'Pause'
  buttons.btnStep.disabled = true
  if (!state.currentSequence) {
    state.currentSequence = createEmptySequence()
  }
  animateStepFn()
}

/**
 * Reset to initial state.
 */
export function reset(
  state: State,
  ctx2d: CanvasRenderingContext2D,
  buttons: { btnStep: HTMLButtonElement; btnStart: HTMLButtonElement; btnReset: HTMLButtonElement },
  updateStats: () => void
): void {
  stopAutoAdd(state, buttons)
  state.sequences = []
  state.sumRatios = 0
  state.sequenceBatch = []
  state.currentSequence = null
  draw(ctx2d, state)
  updateStats()
  buttons.btnReset.disabled = true
}

// ─── Controller Factory ────────────────────────────────────────────────────────

/**
 * Creates the full animation controller for CoinToss method.
 * This wires up all buttons and manages the animation lifecycle.
 */
export function createCoinTossController(
  ctx: MethodPageContext<State>,
  elements: StatsElements
): {
  start: () => void
  stop: () => void
  reset: () => void
  cleanup: () => void
} {
  const { ctx: ctx2d, state } = ctx
  const $required = ctx.$required.bind(ctx)

  // Get button references
  const btnStart = $required('#ct-start') as HTMLButtonElement
  const btnStep = $required('#ct-step') as HTMLButtonElement
  const btnReset = $required('#ct-reset') as HTMLButtonElement

  const buttons = { btnStart, btnStep, btnReset }

  // Create stats updater
  const updateStats = createStatsUpdater(elements, state)

  // Create bound animate step function
  const boundAnimateStep = () => animateStep(ctx, updateStats, buttons)

  // Initial draw
  draw(ctx2d, state)
  updateStats()

  // Wire up buttons
  btnStart.addEventListener('click', () => {
    if (state.autoAdding) {
      stopAutoAdd(state, buttons)
    } else {
      startShowing(state, buttons, boundAnimateStep)
      btnReset.disabled = false
    }
  })

  btnStep.addEventListener('click', () => {
    if (!state.autoAdding) {
      startShowing(state, buttons, boundAnimateStep)
      btnReset.disabled = false
    }
  })

  btnReset.addEventListener('click', () => {
    reset(state, ctx2d, buttons, updateStats)
  })

  return {
    start: () => {
      startShowing(state, buttons, boundAnimateStep)
      btnReset.disabled = false
    },
    stop: () => stopAutoAdd(state, buttons),
    reset: () => reset(state, ctx2d, buttons, updateStats),
    cleanup: () => {
      stopAutoAdd(state, buttons)
    },
  }
}
