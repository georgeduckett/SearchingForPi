// ─── Archimedes Method Barrel Export ──────────────────────────────────────────
// Re-exports all archimedes method components.

// Types and constants
export type { State } from './types'
export {
  INITIAL_SIDES,
  MAX_ITERATIONS,
  createInitialState,
  calculateBounds,
  estimatePi,
  calculateGap,
} from './types'

// Controller
export { createArchimedesController, type StatsElements } from './controller'

// Page factory
export { createArchimedesPage } from './page'

// Preview
export { drawPreview } from './preview'

// Rendering
export { draw } from './rendering'

// Animation actions (for advanced use)
export { stepTo, step, play, reset, type ArchimedesButtons } from './animation'
