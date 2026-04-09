// ─── Bouncing Boxes Method Barrel Export ───────────────────────────────────────
// Re-exports all bouncing boxes method components.

// Types and constants
export type { State } from './types'
export {
  BASE_CANVAS_W,
  BASE_CANVAS_H,
  BASE_INITIAL_X1,
  BASE_INITIAL_X2,
  V0,
  MOBILE_BREAKPOINT,
  BASE_BOX_SIZE,
  BASE_WALL_X,
} from './types'

// Controller
export {
  createBouncingBoxesController,
  type BouncingBoxesController,
  type StatsElements,
} from './controller'

// Page factory
export { createBouncingBoxesPage } from './page'

// Preview
export { drawPreview } from './preview'

// Rendering
export { draw } from './rendering'

// Physics
export { updatePhysics, isSimulationComplete, calculatePiApprox, getBox2Size } from './physics'

// Sound
export { createSoundManager } from './sound'

// Canvas sizing
export { calculateCanvasSize, type CanvasSize } from './canvasSizing'

// Stats
export { createStatsUpdater } from './stats'
