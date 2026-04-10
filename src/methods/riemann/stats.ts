// ─── Riemann Integral Stats Management ─────────────────────────────────────────
// Stats update logic for the Riemann integral method.

import { fmt } from '../../utils'
import { State } from './state'
import { computeSum } from './math'

// ─── Stats Element References ──────────────────────────────────────────────────

export interface StatsElements {
  estimate: HTMLElement
  rects: HTMLElement
  error: HTMLElement
}

// ─── Stats Management ──────────────────────────────────────────────────────────

/**
 * Creates a stats updater function for Riemann method.
 */
export function createStatsUpdater(elements: StatsElements, state: State): () => void {
  return function updateStats(): void {
    const estimate = computeSum(state.rects)
    const error = Math.abs(estimate - Math.PI)

    elements.estimate.textContent = fmt(estimate)
    elements.rects.textContent = state.rects.toLocaleString()
    elements.error.textContent = `Error: ${fmt(error)}`
    elements.error.className = 'stat-error ' + (error < 0.01 ? 'improving' : 'neutral')
  }
}
