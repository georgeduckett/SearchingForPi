// ─── Monte Carlo Controller ───────────────────────────────────────────────────
// Animation control logic for the Monte Carlo method.
// Extracted from page.ts for better separation of concerns.

import type { MethodPageContext } from '../base/page/types'
import { createFrameController, type AnimationController } from '../base/controller'
import { fmt } from '../../utils'
import { State, DOTS_PER_TICK, MAX_DOTS } from './types'
import { estimatePi, generatePoint } from './sampling'
import { drawBackground, drawPoint } from './rendering'

// ─── Stats Management ─────────────────────────────────────────────────────────

/**
 * Stats element references for Monte Carlo method.
 */
export interface StatsElements {
  estimate: HTMLElement
  total: HTMLElement
  error: HTMLElement
  progress: HTMLElement
}

/**
 * Creates a stats updater function for Monte Carlo.
 */
export function createStatsUpdater(elements: StatsElements, state: State): () => void {
  return function updateStats(): void {
    const pi = estimatePi(state.inside, state.total)
    elements.estimate.textContent = fmt(pi)
    elements.total.textContent = state.total.toLocaleString()
    const error = Math.abs(pi - Math.PI)
    elements.error.textContent = `Error: ${fmt(error)}`
    elements.error.className = 'stat-error ' + (error < 0.01 ? 'improving' : 'neutral')
    const pct = Math.min((state.total / MAX_DOTS) * 100, 100)
    elements.progress.style.width = `${pct}%`
  }
}

// ─── Animation Logic ──────────────────────────────────────────────────────────

/**
 * Creates the update function for frame-based animation.
 */
export function createUpdateFunction(
  state: State,
  ctx2d: CanvasRenderingContext2D
): (state: State, dt: number) => void {
  return function update(_state: State, _dt: number): void {
    if (state.total >= MAX_DOTS) {
      state.running = false
      return
    }
    addDots(state, ctx2d, Math.min(DOTS_PER_TICK, MAX_DOTS - state.total))
  }
}

/**
 * Add dots to the canvas and update state.
 */
export function addDots(state: State, ctx2d: CanvasRenderingContext2D, count: number): void {
  for (let i = 0; i < count; i++) {
    const point = generatePoint()
    if (point.isInside) state.inside++
    state.total++
    drawPoint(ctx2d, point.x, point.y, point.isInside)
  }
}

// ─── Controller Factory ───────────────────────────────────────────────────────

/**
 * Creates the full animation controller for Monte Carlo method.
 * This wires up all buttons and manages the animation lifecycle.
 */
export function createMonteCarloController(
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

  // Draw initial background
  drawBackground(ctx2d)

  // Create the frame controller
  const controller = createFrameController({
    ctx,
    buttons: { btnStart, btnStep, btnReset },
    update: createUpdateFunction(state, ctx2d),
    draw: () => updateStats(),
    isComplete: state => state.total >= MAX_DOTS,
    onComplete: () => {
      btnStart.textContent = 'Restart'
      btnStart.disabled = false
    },
    onReset: () => {
      state.inside = 0
      state.total = 0
      drawBackground(ctx2d)
      updateStats()
    },
    onStep: () => {
      addDots(state, ctx2d, 10)
      updateStats()
      btnReset.disabled = false
    },
  })

  return controller
}
