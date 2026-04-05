// ─── Riemann Preview ─────────────────────────────────────────────────────────
// Preview renderer for the home page.

import { C_INSIDE, C_AMBER, PREVIEW_SIZE } from '../../colors'
import { clearCanvas } from '../base/canvas'

/**
 * Draw Riemann integral preview for the home page.
 */
export function drawPreview(ctx: CanvasRenderingContext2D, _time: number): void {
  const s = PREVIEW_SIZE
  clearCanvas(ctx, s, s)

  ctx.strokeStyle = C_AMBER
  ctx.lineWidth = 1.5
  ctx.beginPath()
  for (let x = 0; x <= s - 10; x++) {
    const nx = x / (s - 10)
    const y = 4 / (1 + nx * nx)
    const py = s - 10 - (y / 4) * (s - 20)
    if (x === 0) ctx.moveTo(x + 10, py)
    else ctx.lineTo(x + 10, py)
  }
  ctx.stroke()

  ctx.fillStyle = C_INSIDE
  ctx.globalAlpha = 0.5
  const n = 8
  for (let i = 0; i < n; i++) {
    const x0 = 10 + (i / n) * (s - 20)
    const w = (s - 20) / n
    const nx = i / n
    const y = 4 / (1 + nx * nx)
    const h = (y / 4) * (s - 20)
    ctx.fillRect(x0, s - 10 - h, w - 1, h)
  }
  ctx.globalAlpha = 1
}
