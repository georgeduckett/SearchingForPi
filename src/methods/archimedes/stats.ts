// ─── Archimedes Stats Management ───────────────────────────────────────────────
// Stats update logic for the Archimedes polygons method.

import { fmt } from '../../utils'
import { createStatsUpdater as buildStatsUpdater } from '../base/statsHelpers'
import { State, calculateBounds, estimatePi, calculateGap } from './types'

// ─── Stats Element References ──────────────────────────────────────────────────

export interface StatsElements {
  estimate: HTMLElement
  error: HTMLElement
  sides: HTMLElement
  lower: HTMLElement
  upper: HTMLElement
  gap: HTMLElement
}

// ─── Stats Management ──────────────────────────────────────────────────────────

/**
 * Creates a stats updater function for Archimedes method.
 */
export function createStatsUpdater(
  elements: StatsElements,
  state: State
): () => void {
  return buildStatsUpdater()
    .custom(() => {
      const currentBounds = calculateBounds(state.sides)
      state.lower = currentBounds.lower
      state.upper = currentBounds.upper

      const est = estimatePi(state.lower, state.upper)
      const error = Math.abs(est - Math.PI)
      const gap = calculateGap(state.lower, state.upper)
      const digits = Math.min(12, 4 + state.iteration)

      elements.estimate.textContent = fmt(est)
      elements.error.textContent = `Error: ${fmt(error)}`
      elements.error.className = 'stat-error ' + (error < 0.01 ? 'improving' : 'neutral')
      elements.sides.textContent = `${state.sides.toLocaleString()} sides`
      elements.lower.textContent = fmt(state.lower, digits)
      elements.upper.textContent = fmt(state.upper, digits)
      elements.gap.textContent = `Gap: ${fmt(gap, digits)}`
      elements.gap.style.color = gap < 0.001 ? '#4ecb71' : 'var(--text-muted)'
    })
    .build()
}
