// ─── Bouncing Boxes Stats Management ───────────────────────────────────────────
// Stats update logic for the bouncing boxes method.

import { createStatsUpdater as buildStatsUpdater } from '../base/statsHelpers'
import { State } from './types'
import { calculatePiApprox } from './physics'

// ─── Stats Element References ──────────────────────────────────────────────────

export interface StatsElements {
  hits: HTMLElement
  piApprox: HTMLElement
}

// ─── Stats Management ──────────────────────────────────────────────────────────

/**
 * Creates a stats updater function for Bouncing Boxes.
 */
export function createStatsUpdater(elements: StatsElements, state: State): () => void {
  return buildStatsUpdater()
    .counter(
      elements.hits,
      () => state.collisions,
      n => n.toString()
    )
    .custom(() => {
      const piApprox = calculatePiApprox(state.collisions, state.k)
      elements.piApprox.textContent = piApprox.toFixed(state.k)
    })
    .build()
}
