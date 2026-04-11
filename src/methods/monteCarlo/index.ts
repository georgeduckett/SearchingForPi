// ─── Monte Carlo Method Barrel Export ─────────────────────────────────────────
// Re-exports all monte carlo method components.

// Constants
export {
  DOTS_PER_TICK,
  MAX_DOTS,
  DOT_RADIUS,
  DOT_ALPHA,
  PREVIEW_DOT_RADIUS,
  CIRCLE_RADIUS_FACTOR,
  CIRCLE_RADIUS,
} from './constants'

// State
export type { State } from './state'
export { createInitialState } from './state'

// Controller
export {
  createMonteCarloController,
  createUpdateFunction,
  addDots,
  type StatsElements,
} from './controller'

// Page factory
export { createMonteCarloPage } from './page'

// Preview
export { drawPreview } from './preview'

// Rendering
export { drawBackground, drawPoint } from './rendering'

// Sampling
export { estimatePi, generatePoint } from './sampling'

// Stats
export { createStatsUpdater } from './stats'
