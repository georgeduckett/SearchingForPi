// ─── Archimedes Preview ──────────────────────────────────────────────────────
// Preview renderer for the home page card.

import { C_INSIDE, C_OUTSIDE, C_AMBER, PREVIEW_SIZE } from '../../colors'
import { clearCanvas, drawCircle, drawRegularPolygon } from '../base/canvas'

/**
 * Draw the preview animation for the Archimedes method.
 * Shows polygons with increasing number of sides.
 */
export function drawPreview(ctx: CanvasRenderingContext2D, time: number): void {
  const s = PREVIEW_SIZE
  const cx = s / 2
  const cy = s / 2
  const r = s / 2 - 10

  clearCanvas(ctx, s, s)

  const sides = 6 + (Math.floor(time * 0.2) % 4) * 2
  drawRegularPolygon(ctx, cx, cy, r, sides, C_INSIDE, 1.5)

  const r2 = r / Math.cos(Math.PI / sides)
  drawRegularPolygon(ctx, cx, cy, r2, sides, C_OUTSIDE, 1.5)

  drawCircle(ctx, cx, cy, r, C_AMBER, 1)
}
