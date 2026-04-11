// ─── Basel Method Barrel Export ────────────────────────────────────────────────
// Re-exports all basel method components.

// Constants
export { MAX_TERMS } from './constants'

// State
export type { State } from './state'
export { createInitialState } from './state'

// Mathematics
export { baselTerm, estimatePi, calculateConvergence } from './math'

// Types (backward compatibility - re-exports from above)
export type { State as State_ } from './types'
export {
  MAX_TERMS as MAX_TERMS_,
  createInitialState as createInitialState_,
  baselTerm as baselTerm_,
  estimatePi as estimatePi_,
  calculateConvergence as calculateConvergence_,
} from './types'

// Controller
export { createBaselController, type StatsElements } from './controller'

// Page factory
export { createBaselPage } from './page'

// Preview
export { drawPreview } from './preview'

// Rendering
export { draw } from './rendering'
