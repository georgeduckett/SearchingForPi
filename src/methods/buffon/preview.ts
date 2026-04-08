// ─── Buffon's Needle Preview ────────────────────────────────────────────────
// Preview renderer for the home page card.

import { getBorderColor, getTextMutedColor, getAmberColor, PREVIEW_SIZE } from '../../colors'
import { clearCanvas, drawLine } from '../base/canvas'

// ─── Preview Constants ───────────────────────────────────────────────────────
const PREV_LINE_SPACING = 25
const PREV_LINE_START = 20
const PREV_NEEDLE_COUNT = 12
const PREV_NEEDLE_LEN = 20

/**
 * Draw the preview animation for the Buffon's needle method.
 * Shows parallel lines with needles at various angles.
 */
export function drawPreview(ctx: CanvasRenderingContext2D, _time: number): void {
  const s = PREVIEW_SIZE
  const borderColor = getBorderColor()
  const textMutedColor = getTextMutedColor()
  const amberColor = getAmberColor()

  clearCanvas(ctx, s, s)

  // Draw horizontal lines
  for (let y = PREV_LINE_START; y < s; y += PREV_LINE_SPACING) {
    drawLine(ctx, 0, y, s, y, borderColor, 1)
  }

  // Draw needles with pseudo-random positions
  for (let i = 0; i < PREV_NEEDLE_COUNT; i++) {
    const cx = (Math.sin(i * 2.1) * 0.5 + 0.5) * s
    const cy = 10 + (Math.cos(i * 1.7) * 0.5 + 0.5) * (s - PREV_LINE_START)
    const angle = (Math.sin(i * 3.3) * 0.5 + 0.5) * Math.PI
    const dx = (PREV_NEEDLE_LEN / 2) * Math.cos(angle)
    const dy = (PREV_NEEDLE_LEN / 2) * Math.sin(angle)
    const crosses =
      Math.floor((cy - PREV_LINE_START) / PREV_LINE_SPACING) !==
        Math.floor((cy + dy - PREV_LINE_START) / PREV_LINE_SPACING) ||
      Math.floor((cy - PREV_LINE_START) / PREV_LINE_SPACING) !==
        Math.floor((cy - dy - PREV_LINE_START) / PREV_LINE_SPACING)
    ctx.strokeStyle = crosses ? amberColor : textMutedColor
    ctx.lineWidth = crosses ? 1.5 : 1
    ctx.globalAlpha = crosses ? 1 : 0.5
    ctx.beginPath()
    ctx.moveTo(cx - dx, cy - dy)
    ctx.lineTo(cx + dx, cy + dy)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}
