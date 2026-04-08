// ─── Canvas Drawing Primitives ───────────────────────────────────────────────
// Low-level canvas drawing functions for shapes, text, and backgrounds.

import { getBgColor, getGridColor, getAmberColor } from '../../../colors'
import type { Point } from './geometry'

// ─── Background Drawing ──────────────────────────────────────────────────────

/**
 * Fills the canvas with the background color.
 */
export function clearCanvas(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.fillStyle = getBgColor()
  ctx.fillRect(0, 0, width, height)
}

/**
 * Draws a standard grid pattern on the canvas.
 */
export function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  divisions = 8
): void {
  ctx.strokeStyle = getGridColor()
  ctx.lineWidth = 1

  for (let x = 0; x <= width; x += width / divisions) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }

  for (let y = 0; y <= height; y += height / divisions) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }
}

/**
 * Clears the canvas and draws a grid background (common pattern).
 */
export function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  divisions = 8
): void {
  clearCanvas(ctx, width, height)
  drawGrid(ctx, width, height, divisions)
}

// ─── Shape Drawing ───────────────────────────────────────────────────────────

/**
 * Draws a circle outline.
 */
export function drawCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  strokeStyle?: string,
  lineWidth = 1.5
): void {
  ctx.strokeStyle = strokeStyle ?? getAmberColor()
  ctx.lineWidth = lineWidth
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.stroke()
}

/**
 * Draws a filled circle.
 */
export function fillCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  fillStyle: string
): void {
  ctx.fillStyle = fillStyle
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.fill()
}

/**
 * Draws a line between two points.
 */
export function drawLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  strokeStyle?: string,
  lineWidth = 1
): void {
  ctx.strokeStyle = strokeStyle ?? getAmberColor()
  ctx.lineWidth = lineWidth
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
}

/**
 * Draws a dashed line.
 */
export function drawDashedLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  lineWidth = 1,
  dashPattern: number[] = [5, 5]
): void {
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  ctx.setLineDash(dashPattern)
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
  ctx.setLineDash([])
}

/**
 * Draws a polygon from an array of points.
 */
export function drawPolygon(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  strokeStyle: string,
  lineWidth = 1.5,
  dashed = false
): void {
  if (points.length < 2) return

  ctx.strokeStyle = strokeStyle
  ctx.lineWidth = lineWidth
  if (dashed) ctx.setLineDash([5, 5])
  else ctx.setLineDash([])

  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y)
  }
  ctx.closePath()
  ctx.stroke()
  ctx.setLineDash([])
}

/**
 * Draws a regular polygon centered at (cx, cy).
 */
export function drawRegularPolygon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  sides: number,
  strokeStyle: string,
  lineWidth = 1.5,
  startAngle = -Math.PI / 2
): void {
  const points: Point[] = []
  for (let i = 0; i < sides; i++) {
    const angle = startAngle + (i / sides) * Math.PI * 2
    points.push({
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    })
  }
  drawPolygon(ctx, points, strokeStyle, lineWidth)
}

// ─── Text Drawing ────────────────────────────────────────────────────────────

/**
 * Draws text at a position with optional alignment.
 */
export function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fillStyle: string,
  font = '12px "JetBrains Mono", monospace',
  align: CanvasTextAlign = 'left',
  baseline: CanvasTextBaseline = 'middle'
): void {
  ctx.fillStyle = fillStyle
  ctx.font = font
  ctx.textAlign = align
  ctx.textBaseline = baseline
  ctx.fillText(text, x, y)
}

/**
 * Draws a label with a background box.
 */
export function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fillStyle: string,
  bgStyle: string,
  padding = 4
): void {
  ctx.font = '11px "JetBrains Mono", monospace'
  const metrics = ctx.measureText(text)
  const width = metrics.width + padding * 2
  const height = 14 + padding * 2

  ctx.fillStyle = bgStyle
  ctx.fillRect(x - padding, y - height / 2 - padding, width, height)

  ctx.fillStyle = fillStyle
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x, y)
}
