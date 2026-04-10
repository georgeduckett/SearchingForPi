// ─── Animation Module Barrel Export ───────────────────────────────────────────
// Re-exports all animation-related types and functions.

// Frame-based animation
export { createFrameAnimation, type FrameAnimationOptions, type FrameAnimationLoop } from './frame'

// Interval-based animation
export {
  createIntervalAnimation,
  type IntervalAnimationOptions,
  type IntervalAnimationLoop,
} from './interval'

// Eased animation
export {
  Easing,
  createEasedAnimation,
  type EasedAnimationOptions,
  type EasedAnimationLoop,
} from './easing'

// State helpers
export { type AnimationState, cancelAnimations } from './state'
