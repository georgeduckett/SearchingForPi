// ─── Page Module Barrel Export ───────────────────────────────────────────────
// Re-exports all types and functions from the page module.

// ─── Types ────────────────────────────────────────────────────────────────────
export type {
  PageOptions,
  PageContext,
  PageMethods,
  MethodPageOptions,
  MethodPageContext,
  MethodPageMethods,
} from './types'

// ─── Factories ────────────────────────────────────────────────────────────────
export { createPageFactory } from './createPageFactory'
export { createMethodPageFactory } from './createMethodPageFactory'

// ─── Templates ────────────────────────────────────────────────────────────────
export {
  buildPageHeader,
  buildCanvas,
  buildCanvasWithWrapper,
  buildControlButtons,
  buildControlsContainer,
  buildStatsPanel,
  buildSimplePageLayout,
  buildVizLayout,
  type ControlButtonsOptions,
} from './templates'

// ─── Lifecycle ────────────────────────────────────────────────────────────────
export {
  createAnimationLifecycle,
  cancelAnimation,
  startAnimationLoop,
  cloneState,
  deferInit,
  createCleanupFunction,
  cleanupController,
  type AnimationLifecycle,
  type ControllerState,
} from './lifecycle'

// ─── DOM Helpers ──────────────────────────────────────────────────────────────
export {
  getCanvasContext,
  getButton,
  getRequiredButton,
  getElement,
  getRequiredElement,
  getElementById,
  getRequiredElementById,
  create$Helper,
  create$RequiredHelper,
  create$IdHelper,
  getStatsPanel,
  wireStartPauseButton,
  wireStepButton,
  wireResetButton,
  type StartPauseHandlers,
} from './dom'
