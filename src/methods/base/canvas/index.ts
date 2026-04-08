// ─── Canvas Module Barrel Export ─────────────────────────────────────────────
// Re-exports all canvas-related types and functions.
// This file maintains backward compatibility with the original canvas.ts.

// Types
export type { Point, Rect } from './geometry'

// Geometry helpers
export {
  isInsideCircle,
  randomPoint,
  randomPointInCircle,
  lerp,
  clamp,
  mapRange,
} from './geometry'

// Color utilities
export { rgba, lerpColor } from './color'

// Easing functions
export { easeInOutQuad, easeOutElastic, pulse } from './easing'

// Drawing primitives
export {
  clearCanvas,
  drawGrid,
  drawBackground,
  drawCircle,
  fillCircle,
  drawLine,
  drawDashedLine,
  drawPolygon,
  drawRegularPolygon,
  drawText,
  drawLabel,
} from './drawing'
