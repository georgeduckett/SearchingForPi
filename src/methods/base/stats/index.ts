// ─── Stats Module Barrel Export ───────────────────────────────────────────────
// Re-exports all stats-related types and functions.

// Card helpers
export {
  statsRow,
  statsProgressBar,
  updateStat,
  updateProgress,
  statCard,
  type StatCardOptions,
} from './card'

// Legend and explanation helpers
export { legendItem, legend, explanation } from './legend'

// Builder
export { StatsPanelBuilder, buildStatsPanel } from './builder'
