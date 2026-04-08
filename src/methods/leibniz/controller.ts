// ─── Leibniz Series Controller ────────────────────────────────────────────────
// Animation control logic for the Leibniz series method.
// Extracted from page.ts for better separation of concerns.

import type { MethodPageContext } from '../base/page/types'
import { createIntervalController, type AnimationController } from '../base/controller'
import { State, MAX_TERMS, MS_PER_TERM } from './types'
import { leibnizTerm, formatTerm } from './series'
import { draw } from './rendering'

// ─── Stats Management ─────────────────────────────────────────────────────────

/**
 * Stats element references for Leibniz method.
 */
export interface StatsElements {
  estimate: HTMLElement
  terms: HTMLElement
  currentTerm: HTMLElement
  error: HTMLElement
}

/**
 * Creates a stats updater function for Leibniz method.
 */
export function createStatsUpdater(elements: StatsElements, state: State): () => void {
  return function updateStats(): void {
    const n = state.terms.length
    if (n === 0) {
      elements.estimate.textContent = '—'
      elements.terms.textContent = '0'
      elements.currentTerm.textContent = '—'
      elements.error.textContent = '—'
      return
    }
    const pi = state.terms[n - 1]
    elements.estimate.textContent = pi.toFixed(8)
    elements.terms.textContent = n.toLocaleString()
    const idx = n - 1
    const formatted = formatTerm(idx)
    elements.currentTerm.textContent = `${formatted.sign}1/${formatted.denominator} = ${formatted.sign}${formatted.value.toFixed(6)}`
    elements.error.textContent = Math.abs(pi - Math.PI).toFixed(8)
  }
}

// ─── Animation Logic ──────────────────────────────────────────────────────────

/**
 * Add a term to the series and update visualization.
 */
export function addTerm(state: State, ctx2d: CanvasRenderingContext2D): void {
  const n = state.termIndex
  const prev = state.terms.length > 0 ? state.terms[state.terms.length - 1] : 0
  const newSum = prev + leibnizTerm(n) * 4
  state.terms.push(newSum)
  state.termIndex++
  draw(ctx2d, state)
}

// ─── Controller Factory ───────────────────────────────────────────────────────

/**
 * Creates the full animation controller for Leibniz method.
 * This wires up all buttons and manages the animation lifecycle.
 */
export function createLeibnizController(
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

  // Create the interval controller
  const controller = createIntervalController({
    ctx,
    buttons: { btnStart, btnStep, btnReset },
    intervalMs: MS_PER_TERM,
    tick: () => {
      addTerm(state, ctx2d)
      updateStats()
    },
    isComplete: state => state.termIndex >= MAX_TERMS,
    onComplete: () => {
      btnStart.disabled = false
      btnStart.textContent = state.termIndex >= MAX_TERMS ? 'Done' : 'Resume'
      if (state.termIndex >= MAX_TERMS) btnStart.disabled = true
    },
    onReset: () => {
      state.terms = []
      state.termIndex = 0
      draw(ctx2d, state)
      updateStats()
    },
    onStep: () => {
      // First step adds 2 terms (to show + and -), subsequent steps add 1
      const steps = state.termIndex === 0 ? 2 : 1
      for (let i = 0; i < steps; i++) {
        addTerm(state, ctx2d)
      }
      updateStats()
    },
  })

  return controller
}
