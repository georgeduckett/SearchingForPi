// ─── Bouncing Boxes Preview ──────────────────────────────────────────────────
// Preview renderer for the home page card.

import { C_TEXT_MUTED, C_INSIDE, C_AMBER, PREVIEW_SIZE } from '../../colors'
import { clearCanvas } from '../base/canvas'

/**
 * Draw the preview animation for the bouncing boxes method.
 * Shows two boxes bouncing with a wall on the left.
 */
export function drawPreview(ctx: CanvasRenderingContext2D, time: number): void {
  const s = PREVIEW_SIZE
  clearCanvas(ctx, s, s)

  // Wall
  ctx.strokeStyle = C_TEXT_MUTED
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(10, 0)
  ctx.lineTo(10, s)
  ctx.stroke()

  // Small box (Box 1) - bounces left and right
  const x1 = 10 + Math.abs(Math.sin(time * 0.8)) * 40
  ctx.fillStyle = C_INSIDE
  ctx.fillRect(x1, s / 2 - 10, 20, 20)

  // Large box (Box 2) - moves more slowly
  const x2 = 65 + Math.abs(Math.sin(time * 0.6)) * 30
  ctx.fillStyle = C_AMBER
  ctx.fillRect(x2, s / 2 - 10, 20, 20)
}
