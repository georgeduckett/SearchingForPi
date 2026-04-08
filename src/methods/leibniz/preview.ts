// ─── Leibniz Series Preview ──────────────────────────────────────────────────
// Preview renderer for the home page card.

import { getInsideColor, getOutsideColor, getAmberColor, PREVIEW_SIZE } from '../../colors'
import { clearCanvas, drawLine } from '../base/canvas'

/**
 * Draw the preview animation for the Leibniz series method.
 * Shows alternating positive/negative terms as bars.
 */
export function drawPreview(ctx: CanvasRenderingContext2D, time: number): void {
  const s = PREVIEW_SIZE
  const insideColor = getInsideColor()
  const outsideColor = getOutsideColor()
  const amberColor = getAmberColor()

  clearCanvas(ctx, s, s)

  const terms = 10
  const barW = (s - 20) / terms
  for (let i = 0; i < terms; i++) {
    const sign = i % 2 === 0 ? 1 : -1
    const term = sign / (2 * i + 1)
    const h = Math.abs(term) * (s - 30) * 2
    ctx.fillStyle = i % 2 === 0 ? insideColor : outsideColor
    ctx.globalAlpha = 0.7 + 0.15 * Math.sin(time * 0.5 + i * 0.3)
    // Alternate bars above/below the center line
    if (sign > 0) {
      ctx.fillRect(10 + i * barW, s / 2 - h, barW - 2, h)
    } else {
      ctx.fillRect(10 + i * barW, s / 2, barW - 2, h)
    }
  }
  ctx.globalAlpha = 1

  drawLine(ctx, 10, s / 2, s - 10, s / 2, amberColor, 2)
}
