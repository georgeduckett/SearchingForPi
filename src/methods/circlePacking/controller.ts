// ─── Circle Packing Controller ────────────────────────────────────────────────
// Animation control logic for the circle packing method.
// Extracted from page.ts for better separation of concerns.

import type { MethodPageContext } from '../base/page/types'
import { State, MAX_CIRCLES } from './types'
import { tryPlaceCircle, estimatePi, calculateCoverage } from './packing'
import { draw } from './rendering'

// ─── Stats Element References ──────────────────────────────────────────────────

export interface StatsElements {
  estimate: HTMLElement
  circles: HTMLElement
  covered: HTMLElement
  error: HTMLElement
}

// ─── Stats Management ──────────────────────────────────────────────────────────

/**
 * Creates a stats updater function for CirclePacking method.
 */
export function createStatsUpdater(
  elements: StatsElements,
  state: State,
  canvasWidth: number,
  canvasHeight: number
): () => void {
  return function updateStats(): void {
    const piEstimate = estimatePi(state.circles, canvasWidth, canvasHeight)
    const error = Math.abs(piEstimate - Math.PI)
    const coverage = calculateCoverage(state.circles, canvasWidth, canvasHeight)

    elements.estimate.textContent = state.circles.length < 5 ? '—' : piEstimate.toFixed(6)
    elements.circles.textContent = state.circles.length.toLocaleString()
    elements.covered.textContent = `${coverage.toFixed(1)}%`
    if (state.circles.length >= 5) {
      elements.error.textContent = `Error: ${error.toFixed(6)}`
      elements.error.className = 'stat-error ' + (error < 0.5 ? 'improving' : 'neutral')
    } else {
      elements.error.textContent = 'Error: —'
      elements.error.className = 'stat-error neutral'
    }
  }
}

// ─── Controller Actions ────────────────────────────────────────────────────────

/**
 * Add circles to the packing.
 */
export function addCircles(
  state: State,
  count: number,
  canvasWidth: number,
  canvasHeight: number,
  ctx2d: CanvasRenderingContext2D,
  updateStats: () => void
): void {
  for (let i = 0; i < count && state.circles.length < MAX_CIRCLES; i++) {
    const result = tryPlaceCircle(canvasWidth, canvasHeight, state.circles)
    if (result.placed && result.circle) {
      state.circles.push(result.circle)
    } else {
      state.rejected++
      // Stop if too many rejections (jamming limit)
      if (state.rejected > 10) break
    }
  }
  draw(ctx2d, state.circles, canvasWidth, canvasHeight)
  updateStats()
}

/**
 * Animation tick for frame-based animation.
 */
export function tick(
  state: State,
  canvasWidth: number,
  canvasHeight: number,
  ctx2d: CanvasRenderingContext2D,
  updateStats: () => void,
  buttons: { btnStart: HTMLButtonElement }
): void {
  if (!state.running) return
  if (state.circles.length >= MAX_CIRCLES || state.rejected > 50) {
    state.running = false
    buttons.btnStart.textContent = 'Done'
    buttons.btnStart.disabled = true
    return
  }
  addCircles(state, 3, canvasWidth, canvasHeight, ctx2d, updateStats)
  state.rafId = requestAnimationFrame(() =>
    tick(state, canvasWidth, canvasHeight, ctx2d, updateStats, buttons)
  )
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
  state.rejected = 0
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
  canvasWidth: number,
  canvasHeight: number,
  ctx2d: CanvasRenderingContext2D,
  buttons: { btnStart: HTMLButtonElement; btnReset: HTMLButtonElement },
  updateStats: () => void
): void {
  state.running = false
  if (state.rafId !== null) cancelAnimationFrame(state.rafId)
  state.circles = []
  state.rejected = 0
  draw(ctx2d, state.circles, canvasWidth, canvasHeight)
  updateStats()
  buttons.btnStart.disabled = false
  buttons.btnStart.textContent = 'Start'
  buttons.btnReset.disabled = true
}

// ─── Controller Factory ────────────────────────────────────────────────────────

/**
 * Creates the full animation controller for CirclePacking method.
 * This wires up all buttons and manages the animation lifecycle.
 */
export function createCirclePackingController(
  ctx: MethodPageContext<State>,
  elements: StatsElements
): {
  start: () => void
  reset: () => void
  addCircles: (count: number) => void
  cleanup: () => void
} {
  const { canvas, ctx: ctx2d, state } = ctx
  const $required = ctx.$required.bind(ctx)

  // Get button references
  const btnStart = $required('#cp-start') as HTMLButtonElement
  const btnStep = $required('#cp-step') as HTMLButtonElement
  const btnReset = $required('#cp-reset') as HTMLButtonElement

  const buttons = { btnStart, btnReset }

  // Create stats updater
  const updateStats = createStatsUpdater(elements, state, canvas.width, canvas.height)

  // Create bound tick function
  const boundTick = () => tick(state, canvas.width, canvas.height, ctx2d, updateStats, buttons)

  // Initial draw
  draw(ctx2d, state.circles, canvas.width, canvas.height)
  updateStats()

  // Wire up buttons
  btnStart.addEventListener('click', () => {
    if (!state.running && state.circles.length < MAX_CIRCLES) start(state, buttons, boundTick)
  })

  btnStep.addEventListener('click', () => {
    if (!state.running) {
      addCircles(state, 3, canvas.width, canvas.height, ctx2d, updateStats)
      btnReset.disabled = false
    }
  })

  btnReset.addEventListener('click', () => {
    reset(state, canvas.width, canvas.height, ctx2d, buttons, updateStats)
  })

  return {
    start: () => start(state, buttons, boundTick),
    reset: () => reset(state, canvas.width, canvas.height, ctx2d, buttons, updateStats),
    addCircles: (count: number) =>
      addCircles(state, count, canvas.width, canvas.height, ctx2d, updateStats),
    cleanup: () => {
      state.running = false
      if (state.rafId !== null) {
        cancelAnimationFrame(state.rafId)
        state.rafId = null
      }
    },
  }
}
