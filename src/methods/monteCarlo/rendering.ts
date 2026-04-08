// ─── Monte Carlo Rendering ───────────────────────────────────────────────────
// Canvas drawing functions for the Monte Carlo visualization.

import { getInsideColor, getOutsideColor, getAmberColor, CANVAS_SIZE } from '../../colors'
import { clearCanvas, drawGrid, drawCircle, fillCircle } from '../base/canvas'
import { DOT_ALPHA, DOT_RADIUS, CIRCLE_RADIUS } from './types'
import { PointResult } from './sampling'

// ─── Drawing Functions ───────────────────────────────────────────────────────

/**
 * Draw the initial background with grid and circle outline.
 */
export function drawBackground(ctx: CanvasRenderingContext2D): void {
  const s = CANVAS_SIZE
  clearCanvas(ctx, s, s)
  drawGrid(ctx, s, s)
  drawCircle(ctx, CIRCLE_RADIUS, CIRCLE_RADIUS, CIRCLE_RADIUS, getAmberColor(), 1.5)
}

/**
 * Draw points on the canvas.
 */
export function drawPoints(ctx: CanvasRenderingContext2D, points: PointResult[]): void {
  const insideColor = getInsideColor()
  const outsideColor = getOutsideColor()
  const amberColor = getAmberColor()

  ctx.globalAlpha = DOT_ALPHA
  for (const point of points) {
    fillCircle(ctx, point.x, point.y, DOT_RADIUS, point.isInside ? insideColor : outsideColor)
  }
  ctx.globalAlpha = 1
  // Re-draw circle on top so it stays crisp
  drawCircle(ctx, CIRCLE_RADIUS, CIRCLE_RADIUS, CIRCLE_RADIUS, amberColor, 1.5)
}

/**
 * Draw a single point immediately.
 */
export function drawPoint(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  isInside: boolean
): void {
  ctx.globalAlpha = DOT_ALPHA
  fillCircle(ctx, x, y, DOT_RADIUS, isInside ? getInsideColor() : getOutsideColor())
  ctx.globalAlpha = 1
}
