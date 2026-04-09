// ─── Bouncing Boxes Canvas Sizing ──────────────────────────────────────────────
// Canvas sizing and scaling logic for the bouncing boxes method.

import { BASE_CANVAS_W, BASE_CANVAS_H, MOBILE_BREAKPOINT } from './types'

// ─── Canvas Size Calculation ───────────────────────────────────────────────────

export interface CanvasSize {
  width: number
  height: number
  scale: number
}

/**
 * Calculate the appropriate canvas size based on container and screen dimensions.
 */
export function calculateCanvasSize(
  containerWidth: number,
  windowWidth: number,
  baseWidth: number = BASE_CANVAS_W,
  baseHeight: number = BASE_CANVAS_H,
  mobileBreakpoint: number = MOBILE_BREAKPOINT
): CanvasSize {
  const isMobile = windowWidth < mobileBreakpoint
  const scale = isMobile ? 0.6 : 1
  const width = baseWidth * scale
  const height = baseHeight * scale

  // If container is smaller, scale down further
  if (containerWidth < width) {
    const containerScale = containerWidth / width
    return {
      width: width * containerScale,
      height: height * containerScale,
      scale: scale * containerScale,
    }
  }

  return { width, height, scale }
}
