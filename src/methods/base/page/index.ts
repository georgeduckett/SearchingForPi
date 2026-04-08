// Barrel export for page submodule.

export type {
  PageOptions,
  PageContext,
  PageMethods,
  MethodPageOptions,
  MethodPageContext,
  MethodPageMethods,
} from './types'

export { createPageFactory } from './createPageFactory'
export { createMethodPageFactory } from './createMethodPageFactory'

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
