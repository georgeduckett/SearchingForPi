// ─── Buffon's Needle Rendering ──────────────────────────────────────────────
// Canvas drawing functions for the Buffon's needle visualization.

import {
  getBgColor,
  getBorderColor,
  getTextMutedColor,
  getAmberColor,
  getAmberBrightColor,
} from '../../colors'
import { Needle, CANVAS_W, CANVAS_H, LINE_SPACING, NEEDLE_LENGTH } from './types'

// ─── Drawing Functions ───────────────────────────────────────────────────────

/**
 * Draw the background with parallel horizontal lines.
 */
export function drawBackground(ctx: CanvasRenderingContext2D): void {
  const bgColor = getBgColor()
  const borderColor = getBorderColor()
  const lineLblColor = '#3d4460'

  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

  // Parallel horizontal lines
  ctx.strokeStyle = borderColor
  ctx.lineWidth = 1
  for (let y = LINE_SPACING; y < CANVAS_H; y += LINE_SPACING) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(CANVAS_W, y)
    ctx.stroke()

    // Subtle distance label
    ctx.fillStyle = lineLblColor
    ctx.font = '10px "JetBrains Mono", monospace'
    ctx.fillText(`d=${LINE_SPACING}`, 6, y - 4)
  }
}

/**
 * Draw a single needle with appropriate styling based on crossing state.
 */
export function drawNeedle(
  ctx: CanvasRenderingContext2D,
  n: Needle,
  isAnimating: boolean = false
): void {
  const amberColor = getAmberColor()
  const textMutedColor = getTextMutedColor()
  const amberBrightColor = getAmberBrightColor()

  const scale = n.scale || 1
  const length = NEEDLE_LENGTH * scale
  const dx = (length / 2) * Math.cos(n.angle)
  const dy = (length / 2) * Math.sin(n.angle)

  const showCrossColor = !isAnimating && n.crosses
  ctx.strokeStyle = showCrossColor ? amberColor : textMutedColor
  ctx.lineWidth = showCrossColor ? 1.8 : 1
  ctx.globalAlpha = showCrossColor ? 0.85 : 0.45
  ctx.beginPath()
  ctx.moveTo(n.cx - dx, n.cy - dy)
  ctx.lineTo(n.cx + dx, n.cy + dy)
  ctx.stroke()

  if (showCrossColor) {
    ctx.globalAlpha = 1
    ctx.fillStyle = amberBrightColor
    ctx.beginPath()
    ctx.arc(n.cx, n.cy, 2 * scale, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

/**
 * Draw the complete scene - background and all needles.
 */
export function drawScene(
  ctx: CanvasRenderingContext2D,
  needles: Needle[],
  currentNeedle: Needle | null,
  animating: boolean
): void {
  drawBackground(ctx)
  for (const n of needles) {
    drawNeedle(ctx, n)
  }
  if (animating && currentNeedle) {
    drawNeedle(ctx, currentNeedle, true)
  }
}
