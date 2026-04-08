// ─── Monte Carlo Preview ─────────────────────────────────────────────────────
// Preview renderer for the home page card.

import { getInsideColor, getOutsideColor, getAmberColor, PREVIEW_SIZE } from '../../colors'
import { clearCanvas, drawCircle, isInsideCircle, fillCircle } from '../base/canvas'
import { DOT_ALPHA, PREVIEW_DOT_RADIUS } from './types'

/**
 * Draw the preview animation for the Monte Carlo method.
 * Shows a circle with scattered points inside and outside.
 */
export function drawPreview(ctx: CanvasRenderingContext2D, _time: number): void {
  const s = PREVIEW_SIZE
  const insideColor = getInsideColor()
  const outsideColor = getOutsideColor()
  const amberColor = getAmberColor()

  clearCanvas(ctx, s, s)

  // Circle outline
  drawCircle(ctx, s / 2, s / 2, s / 2 - 4, amberColor, 1)

  // Dots with stable pseudo-random positions
  ctx.globalAlpha = DOT_ALPHA
  for (let i = 0; i < 60; i++) {
    const x = 4 + (Math.sin(i * 1.1) * 0.5 + 0.5) * (s - 8)
    const y = 4 + (Math.cos(i * 1.3) * 0.5 + 0.5) * (s - 8)
    const inside = isInsideCircle(x, y, s / 2, s / 2, s / 2 - 4)
    fillCircle(ctx, x, y, PREVIEW_DOT_RADIUS, inside ? insideColor : outsideColor)
  }
  ctx.globalAlpha = 1
}
