// ─── Wallis Product Stats Management ───────────────────────────────────────────
// Stats update logic for the Wallis product method.

import { fmt } from '../../utils'
import { State } from './state'
import { estimatePi } from './math'

// ─── Stats Element References ──────────────────────────────────────────────────

export interface StatsElements {
  estimate: HTMLElement
  factors: HTMLElement
  product: HTMLElement
  error: HTMLElement
}

// ─── Stats Management ──────────────────────────────────────────────────────────

/**
 * Creates a stats updater function for Wallis method.
 */
export function createStatsUpdater(elements: StatsElements, state: State): () => void {
  return function updateStats(): void {
    const piEstimate = estimatePi(state.product)
    const error = Math.abs(piEstimate - Math.PI)

    elements.estimate.textContent = fmt(piEstimate)
    elements.factors.textContent = state.factors.toLocaleString()
    elements.product.textContent = fmt(state.product)
    elements.error.textContent = `Error: ${fmt(error)}`
    elements.error.className = 'stat-error ' + (error < 0.1 ? 'improving' : 'neutral')
  }
}
