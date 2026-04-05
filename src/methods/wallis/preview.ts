// ─── Wallis Product Preview ───────────────────────────────────────────────────
// Preview renderer for the home page card.

import { C_INSIDE, C_AMBER, PREVIEW_SIZE } from '../../colors'
import { clearCanvas } from '../base/canvas'

/**
 * Draw the preview animation for the Wallis product method.
 * Shows alternating factors as bars.
 */
export function drawPreview(ctx: CanvasRenderingContext2D, time: number): void {
  const s = PREVIEW_SIZE
  clearCanvas(ctx, s, s)

  const terms = 6
  const barW = (s - 20) / terms
  for (let i = 0; i < terms; i++) {
    const n = i + 1
    const val = ((2 * n) / (2 * n - 1)) * ((2 * n) / (2 * n + 1))
    const h = val * 20 + Math.sin(time * 0.6 + i * 0.5) * 5
    ctx.fillStyle = i % 2 === 0 ? C_INSIDE : C_AMBER
    ctx.globalAlpha = 0.7
    ctx.fillRect(10 + i * barW, s / 2 - h, barW - 3, h * 2)
  }
  ctx.globalAlpha = 1

  ctx.fillStyle = C_AMBER
  ctx.font = '11px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('→ π/2', s / 2, 15)
}
