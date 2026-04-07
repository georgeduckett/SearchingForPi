// ─── Archimedes Rendering ────────────────────────────────────────────────────
// Canvas drawing functions for the Archimedes polygons visualization.

import { getInsideColor, getAmberColor, CANVAS_SIZE } from '../../colors'
import { clearCanvas, drawGrid } from '../base/canvas'

// Method-specific colors
const C_POLYGON_INNER = getInsideColor()
const C_POLYGON_OUTER = '#ff9f69'
const C_CIRCLE = getAmberColor()

/**
 * Draw the complete Archimedes visualization - circle and both polygons.
 */
export function draw(
  ctx: CanvasRenderingContext2D,
  currentSides: number,
  currentLower: number,
  currentUpper: number
): void {
  const s = CANVAS_SIZE
  const centerX = s / 2
  const centerY = s / 2
  const radius = Math.min(centerX, centerY) - 40

  clearCanvas(ctx, s, s)
  drawGrid(ctx, s, s)

  // Draw unit circle
  ctx.strokeStyle = C_CIRCLE
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
  ctx.stroke()

  // Draw inscribed polygon (lower bound)
  const innerScale = radius * (currentLower / Math.PI)
  ctx.strokeStyle = C_POLYGON_INNER
  ctx.lineWidth = 2
  ctx.beginPath()
  for (let i = 0; i <= currentSides; i++) {
    const angle = (i * 2 * Math.PI) / currentSides - Math.PI / 2
    const x = centerX + innerScale * Math.cos(angle)
    const y = centerY + innerScale * Math.sin(angle)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()

  // Draw circumscribed polygon (upper bound)
  const outerScale = radius * (currentUpper / Math.PI)
  ctx.strokeStyle = C_POLYGON_OUTER
  ctx.lineWidth = 2
  ctx.setLineDash([5, 5])
  ctx.beginPath()
  for (let i = 0; i <= currentSides; i++) {
    const angle = (i * 2 * Math.PI) / currentSides - Math.PI / 2
    const x = centerX + outerScale * Math.cos(angle)
    const y = centerY + outerScale * Math.sin(angle)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()
  ctx.setLineDash([])

  // Draw vertices
  ctx.fillStyle = C_POLYGON_INNER
  for (let i = 0; i < currentSides; i++) {
    const angle = (i * 2 * Math.PI) / currentSides - Math.PI / 2
    const x = centerX + innerScale * Math.cos(angle)
    const y = centerY + innerScale * Math.sin(angle)
    ctx.beginPath()
    ctx.arc(x, y, 3, 0, Math.PI * 2)
    ctx.fill()
  }
}

// Export colors for use in stats panel
export { C_POLYGON_INNER, C_POLYGON_OUTER, C_CIRCLE }
