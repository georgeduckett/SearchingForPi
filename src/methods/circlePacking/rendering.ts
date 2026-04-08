// ─── Circle Packing Rendering ────────────────────────────────────────────────
// Canvas drawing functions for the circle packing visualization.

import { getBgColor, getTextMutedColor } from '../../colors'
import { Circle, PADDING } from './types'

// ─── Drawing Functions ───────────────────────────────────────────────────────

/**
 * Draw the complete scene - bounding square and all circles.
 */
export function draw(
  ctx: CanvasRenderingContext2D,
  circles: Circle[],
  canvasWidth: number,
  canvasHeight: number
): void {
  // Background
  ctx.fillStyle = getBgColor()
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  // Draw bounding square
  ctx.strokeStyle = getTextMutedColor()
  ctx.lineWidth = 1
  ctx.strokeRect(PADDING, PADDING, canvasWidth - PADDING * 2, canvasHeight - PADDING * 2)

  // Draw circles
  for (const circle of circles) {
    ctx.fillStyle = circle.color
    ctx.beginPath()
    ctx.arc(circle.x, circle.y, circle.r, 0, Math.PI * 2)
    ctx.fill()

    // Subtle outline
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'
    ctx.lineWidth = 1
    ctx.stroke()
  }
}
