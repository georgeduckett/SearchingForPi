// ─── Coprimality Controller ───────────────────────────────────────────────────
// Animation control logic for the coprimality method.
// Extracted from page.ts for better separation of concerns.

import { fmt, isCoprime } from '../../utils'
import type { MethodPageContext } from '../base/page/types'
import { State, MAX_PAIRS, PAIRS_PER_TICK, estimatePi } from './types'
import { draw } from './rendering'

// ─── Stats Element References ──────────────────────────────────────────────────

export interface StatsElements {
  estimate: HTMLElement
  pairs: HTMLElement
  coprime: HTMLElement
  error: HTMLElement
}

// ─── Stats Management ──────────────────────────────────────────────────────────

/**
 * Creates a stats updater function for Coprimality method.
 */
export function createStatsUpdater(elements: StatsElements, state: State): () => void {
  return function updateStats(): void {
    const piEstimate = estimatePi(state.coprimeCount, state.totalPairs)
    const error = Math.abs(piEstimate - Math.PI)

    elements.estimate.textContent = state.totalPairs === 0 ? '—' : fmt(piEstimate)
    elements.pairs.textContent = state.totalPairs.toLocaleString()
    elements.coprime.textContent = state.coprimeCount.toLocaleString()
    elements.error.textContent = state.totalPairs === 0 ? 'Error: —' : `Error: ${fmt(error)}`
    elements.error.className =
      'stat-error ' +
      (error < 0.1 || state.totalPairs < 100 ? 'neutral' : error < 0.5 ? 'improving' : 'neutral')
  }
}

// ─── Controller Actions ────────────────────────────────────────────────────────

/**
 * Generate random pairs and add them to the state.
 */
export function generatePairs(
  state: State,
  count: number,
  ctx2d: CanvasRenderingContext2D,
  updateStats: () => void
): void {
  for (let i = 0; i < count && state.totalPairs < MAX_PAIRS; i++) {
    const a = Math.floor(Math.random() * 10000) + 1
    const b = Math.floor(Math.random() * 10000) + 1
    const coprime = isCoprime(a, b)
    state.pairs.push({ a, b, coprime })
    if (coprime) state.coprimeCount++
    state.totalPairs++
  }
  draw(ctx2d, state)
  updateStats()
}

/**
 * Animation tick for frame-based animation.
 */
export function tick(
  state: State,
  ctx2d: CanvasRenderingContext2D,
  updateStats: () => void,
  buttons: { btnStart: HTMLButtonElement }
): void {
  if (!state.running) return
  if (state.totalPairs >= MAX_PAIRS) {
    state.running = false
    buttons.btnStart.textContent = 'Done'
    buttons.btnStart.disabled = true
    return
  }
  generatePairs(state, PAIRS_PER_TICK, ctx2d, updateStats)
  state.rafId = requestAnimationFrame(() => tick(state, ctx2d, updateStats, buttons))
}

/**
 * Start the automatic animation.
 */
export function start(
  state: State,
  buttons: { btnStart: HTMLButtonElement; btnReset: HTMLButtonElement },
  tickFn: () => void
): void {
  state.running = true
  buttons.btnStart.disabled = true
  buttons.btnReset.disabled = false
  buttons.btnStart.textContent = 'Running…'
  state.rafId = requestAnimationFrame(tickFn)
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
  state.running = false
  if (state.rafId !== null) cancelAnimationFrame(state.rafId)
  state.pairs = []
  state.coprimeCount = 0
  state.totalPairs = 0
  draw(ctx2d, state)
  updateStats()
  buttons.btnStart.disabled = false
  buttons.btnStart.textContent = 'Start'
  buttons.btnReset.disabled = true
}

// ─── Controller Factory ────────────────────────────────────────────────────────

/**
 * Creates the full animation controller for Coprimality method.
 * This wires up all buttons and manages the animation lifecycle.
 */
export function createCoprimalityController(
  ctx: MethodPageContext<State>,
  elements: StatsElements
): {
  start: () => void
  reset: () => void
  generatePairs: (count: number) => void
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

  // Create bound tick function
  const boundTick = () => tick(state, ctx2d, updateStats, buttons)

  // Initial draw
  draw(ctx2d, state)
  updateStats()

  // Wire up buttons
  btnStart.addEventListener('click', () => {
    if (!state.running && state.totalPairs < MAX_PAIRS) start(state, buttons, boundTick)
  })

  btnStep.addEventListener('click', () => {
    if (!state.running) {
      generatePairs(state, PAIRS_PER_TICK, ctx2d, updateStats)
      btnReset.disabled = false
    }
  })

  btnReset.addEventListener('click', () => {
    reset(state, ctx2d, buttons, updateStats)
  })

  return {
    start: () => start(state, buttons, boundTick),
    reset: () => reset(state, ctx2d, buttons, updateStats),
    generatePairs: (count: number) => generatePairs(state, count, ctx2d, updateStats),
    cleanup: () => {
      state.running = false
      if (state.rafId !== null) {
        cancelAnimationFrame(state.rafId)
        state.rafId = null
      }
    },
  }
}
