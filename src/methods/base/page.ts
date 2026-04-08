// Barrel export for page module - re-exports from split files for backward compatibility.

export {
  createFrameAnimation,
  createIntervalAnimation,
  createEasedAnimation,
  cancelAnimations,
  Easing,
  type FrameAnimationOptions,
  type FrameAnimationLoop,
  type IntervalAnimationOptions,
  type IntervalAnimationLoop,
  type EasedAnimationOptions,
  type AnimationState,
} from './animation'

export {
  statCard,
  statsRow,
  statsProgressBar,
  updateStat,
  updateProgress,
  legend,
  legendItem,
  explanation,
  StatsPanelBuilder,
  buildStatsPanel,
} from './stats'

export {
  createPageFactory,
  createMethodPageFactory,
  cleanupController,
  type PageOptions,
  type PageContext,
  type PageMethods,
  type MethodPageOptions,
  type MethodPageContext,
  type MethodPageMethods,
  type ControllerState,
} from './page/index'

export {
  createFrameController,
  createIntervalController,
  bindButtons,
  type AnimationStateBase,
  type StandardButtonsConfig,
  type FrameControllerConfig,
  type IntervalControllerConfig,
  type AnimationController,
  type SimpleButtonBinder,
} from './controller'

export {
  createPiEstimateUpdater,
  createCounterUpdater,
  combineUpdaters,
  updateErrorDisplay,
  updateProgressBar,
  formatSeriesTerm,
  type PiEstimateStatsElements,
} from './statsHelpers'
