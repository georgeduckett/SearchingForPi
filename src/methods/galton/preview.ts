// ─── Galton Board Preview ───────────────────────────────────────────────────
// Preview renderer for the home page card.

import { C_INSIDE, C_AMBER, C_TEXT_MUTED, PREVIEW_SIZE } from '../../colors'
import { clearCanvas } from '../base/canvas'

/**
 * Draw the preview animation for the Galton board method.
 * Shows pegs, bins with balls, and a Gaussian curve overlay.
 */
export function drawPreview(ctx: CanvasRenderingContext2D, _time: number): void {
  const s = PREVIEW_SIZE
  clearCanvas(ctx, s, s)

  // Draw pegs
  ctx.fillStyle = C_TEXT_MUTED
  const rows = 5
  for (let row = 0; row < rows; row++) {
    for (let peg = 0; peg <= row; peg++) {
      const x = s / 2 + (peg - row / 2) * 16
      const y = 20 + row * 18
      ctx.beginPath()
      ctx.arc(x, y, 3, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Draw bins with sample distribution
  ctx.fillStyle = C_INSIDE
  const bins = [2, 4, 6, 4, 2]
  const maxH = 30
  for (let i = 0; i < 5; i++) {
    const h = (bins[i] / 6) * maxH
    ctx.fillRect(s / 2 + (i - 2) * 16 - 6, s - 15 - h, 12, h)
  }

  // Draw Gaussian curve overlay
  ctx.strokeStyle = C_AMBER
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(s / 2 - 40, s - 15)
  ctx.quadraticCurveTo(s / 2, s - 55, s / 2 + 40, s - 15)
  ctx.stroke()
}
