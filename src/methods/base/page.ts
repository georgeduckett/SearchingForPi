// ─── Page Module Barrel Export ───────────────────────────────────────────────
// Re-exports all types and functions from the split page module files.
// This file maintains backward compatibility for existing imports.

// Re-export animation helpers
export {
// Frame-based animation
createFrameAnimation,
type FrameAnimationOptions,
type FrameAnimationLoop,
// Interval-based animation
createIntervalAnimation,
type IntervalAnimationOptions,
type IntervalAnimationLoop,
// Eased one-shot animation
createEasedAnimation,
type EasedAnimationOptions,
// Easing functions
Easing,
// State helpers
type AnimationState,
cancelAnimations,
} from './animation'

// Re-export stats helpers
export {
statCard,
statsRow,
statsProgressBar,
updateStat,
updateProgress,
legend,
legendItem,
explanation,
// Builder
StatsPanelBuilder,
buildStatsPanel,
} from './stats'

// Re-export everything from the page/ subdirectory
export {
  // Types
  type PageOptions,
  type PageContext,
  type PageMethods,
  type MethodPageOptions,
  type MethodPageContext,
  type MethodPageMethods,
  type ControllerState,
  // Factories
  createPageFactory,
  createMethodPageFactory,
  // Lifecycle helpers
  cleanupController,
} from './page/index'

// Re-export controller helpers
export {
// Types
type AnimationStateBase,
type StandardButtonsConfig,
type FrameControllerConfig,
type IntervalControllerConfig,
type AnimationController,
type SimpleButtonBinder,
// Controllers
createFrameController,
createIntervalController,
bindButtons,
} from './controller'

// Re-export stats helpers
export {
// Types
type PiEstimateStatsElements,
// Updaters
createPiEstimateUpdater,
createCounterUpdater,
combineUpdaters,
updateErrorDisplay,
updateProgressBar,
formatSeriesTerm,
} from './statsHelpers'
