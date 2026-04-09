// ─── Basel Problem Types Barrel Export ────────────────────────────────────────
// Re-exports all types, constants, and functions for backward compatibility.

// Constants
export { MAX_TERMS } from './constants'

// State
export type { State } from './state'
export { createInitialState } from './state'

// Mathematics
export { baselTerm, estimatePi, calculateConvergence } from './math'
