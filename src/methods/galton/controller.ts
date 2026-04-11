// ─── Galton Board Controller ──────────────────────────────────────────────────
// Animation control logic for the Galton board method.
// Extracted from page.ts for better separation of concerns.

import { fmt } from '../../utils'
import { CANVAS_SIZE } from '../../colors'
import type { MethodPageContext } from '../base/page/types'
import { State, NUM_BINS, MAX_BALLS } from './types'
import { createBall, updateBall, estimatePi } from './physics'
import { draw } from './rendering'

// ─── Stats Element References ──────────────────────────────────────────────────

export interface StatsElements {
  estimate: HTMLElement
  dropped: HTMLElement
  peak: HTMLElement
  error: HTMLElement
}

// ─── Stats Management ──────────────────────────────────────────────────────────

/**
 * Creates a stats updater function for Galton method.
 */
export function createStatsUpdater(elements: StatsElements, state: State): () => void {
  return function updateStats(): void {
    const piEstimate = estimatePi(state)
    const peak = Math.max(...state.bins)
    const error = Math.abs(piEstimate - Math.PI)

    elements.estimate.textContent = state.dropped < 10 ? '—' : fmt(piEstimate)
    elements.dropped.textContent = state.dropped.toLocaleString()
    elements.peak.textContent = peak.toLocaleString()
    if (state.dropped >= 10) {
      elements.error.textContent = `Error: ${fmt(error)}`
      elements.error.className = 'stat-error ' + (error < 1 ? 'improving' : 'neutral')
    } else {
      elements.error.textContent = 'Error: —'
      elements.error.className = 'stat-error neutral'
    }
  }
}

// ─── Controller Actions ────────────────────────────────────────────────────────

/**
 * Drop a new ball.
 */
export function dropBall(state: State, centerX: number): void {
  state.balls.push(createBall(centerX))
}

/**
 * Animation tick for frame-based animation.
 */
export function tick(
  state: State,
  canvasSize: number,
  ctx2d: CanvasRenderingContext2D,
  updateStats: () => void,
  buttons: { btnStart: HTMLButtonElement }
): void {
  let activeBalls = false

  // Update all active balls
  for (const ball of state.balls) {
    const landedBin = updateBall(ball, canvasSize, canvasSize)
    if (landedBin !== null) {
      state.bins[landedBin]++
    }
    if (ball.active) {
      activeBalls = true
    }
  }

  // Draw current state
  draw(ctx2d, state)
  updateStats()

  // Auto-drop more balls if running
  if (state.dropping && state.dropped < MAX_BALLS) {
    if (Math.random() < 0.1) {
      dropBall(state, canvasSize / 2)
      state.dropped++
    }
  }

  // Continue animation or stop
  if (activeBalls || state.dropping) {
    state.rafId = requestAnimationFrame(() => tick(state, canvasSize, ctx2d, updateStats, buttons))
  } else {
    state.running = false
    buttons.btnStart.textContent = 'Start'
    buttons.btnStart.disabled = state.dropped >= MAX_BALLS
  }
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
  state.dropping = true
  buttons.btnStart.disabled = true
  buttons.btnReset.disabled = false
  buttons.btnStart.textContent = 'Running…'
  state.rafId = requestAnimationFrame(tickFn)
}

/**
 * Drop a single ball.
 */
export function dropOne(
  state: State,
  canvasSize: number,
  tickFn: () => void,
  buttons: { btnReset: HTMLButtonElement }
): void {
  if (state.dropped >= MAX_BALLS) return
  dropBall(state, canvasSize / 2)
  state.dropped++
  if (!state.running) {
    state.running = true
    state.dropping = false
    state.rafId = requestAnimationFrame(tickFn)
  }
  buttons.btnReset.disabled = false
}

/**
 * Reset to initial state.
 */
export function reset(
  state: State,
  _canvasSize: number,
  ctx2d: CanvasRenderingContext2D,
  buttons: { btnStart: HTMLButtonElement; btnReset: HTMLButtonElement },
  updateStats: () => void
): void {
  state.running = false
  state.dropping = false
  if (state.rafId !== null) cancelAnimationFrame(state.rafId)
  state.balls = []
  state.bins = Array(NUM_BINS).fill(0)
  state.dropped = 0
  draw(ctx2d, state)
  updateStats()
  buttons.btnStart.disabled = false
  buttons.btnStart.textContent = 'Start'
  buttons.btnReset.disabled = true
}

// ─── Controller Factory ────────────────────────────────────────────────────────

/**
 * Creates the full animation controller for Galton method.
 * This wires up all buttons and manages the animation lifecycle.
 */
export function createGaltonController(
  ctx: MethodPageContext<State>,
  elements: StatsElements
): {
  start: () => void
  dropOne: () => void
  reset: () => void
  cleanup: () => void
} {
  const { ctx: ctx2d, state, $id } = ctx

  // Get button references
  const btnStart = $id('btn-start', HTMLButtonElement)
  const btnDrop = $id('btn-drop', HTMLButtonElement)
  const btnReset = $id('btn-reset', HTMLButtonElement)

  const buttons = { btnStart, btnReset }

  // Create stats updater
  const updateStats = createStatsUpdater(elements, state)

  // Create bound tick function
  const boundTick = () => tick(state, CANVAS_SIZE, ctx2d, updateStats, buttons)

  // Initial draw
  draw(ctx2d, state)
  updateStats()

  // Wire up buttons
  btnStart.addEventListener('click', () => {
    if (!state.running) start(state, buttons, boundTick)
  })

  btnDrop.addEventListener('click', () => {
    dropOne(state, CANVAS_SIZE, boundTick, buttons)
  })

  btnReset.addEventListener('click', () => {
    reset(state, CANVAS_SIZE, ctx2d, buttons, updateStats)
  })

  return {
    start: () => start(state, buttons, boundTick),
    dropOne: () => dropOne(state, CANVAS_SIZE, boundTick, buttons),
    reset: () => reset(state, CANVAS_SIZE, ctx2d, buttons, updateStats),
    cleanup: () => {
      state.running = false
      state.dropping = false
      if (state.rafId !== null) {
        cancelAnimationFrame(state.rafId)
        state.rafId = null
      }
    },
  }
}
