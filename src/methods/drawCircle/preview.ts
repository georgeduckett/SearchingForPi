// ─── Draw Circle Preview ─────────────────────────────────────────────────────
// Preview renderer for the home page.

import {
  getAmberColor,
  getAmberBrightColor,
  getInsideColor,
  getTextMutedColor,
  PREVIEW_SIZE,
} from '../../colors'
import { clearCanvas } from '../base/canvas'

// Method-specific colors
const C_DRAWN = getInsideColor()

/**
 * Draw animated circle drawing preview for the home page.
 */
export function drawPreview(ctx: CanvasRenderingContext2D, time: number): void {
  const s = PREVIEW_SIZE
  clearCanvas(ctx, s, s)

  const progress = (time * 0.3) % 1
  const cx = s / 2
  const cy = s / 2
  const r = s / 2 - 15

  const totalSegments = 12
  const completedSegments = Math.floor(progress * totalSegments)
  const segmentProgress = (progress * totalSegments) % 1

  ctx.strokeStyle = getAmberColor()
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()

  for (let i = 0; i < completedSegments; i++) {
    const startAngle = (i / totalSegments) * Math.PI * 2
    const endAngle = ((i + 1) / totalSegments) * Math.PI * 2
    const x1 = cx + r * Math.cos(startAngle)
    const y1 = cy + r * Math.sin(startAngle)
    const x2 = cx + r * Math.cos(endAngle)
    const y2 = cy + r * Math.sin(endAngle)

    if (i === 0) {
      ctx.moveTo(x1, y1)
    }
    ctx.lineTo(x2, y2)
  }

  ctx.stroke()

  if (completedSegments < totalSegments) {
    const lastCompletedAngle = (completedSegments / totalSegments) * Math.PI * 2
    const lastX = cx + r * Math.cos(lastCompletedAngle)
    const lastY = cy + r * Math.sin(lastCompletedAngle)
    const currentSegmentEnd = ((completedSegments + 1) / totalSegments) * Math.PI * 2
    const pointAngle =
      lastCompletedAngle + (currentSegmentEnd - lastCompletedAngle) * segmentProgress
    const dotX = cx + r * Math.cos(pointAngle)
    const dotY = cy + r * Math.sin(pointAngle)

    ctx.strokeStyle = getAmberColor()
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(lastX, lastY)
    ctx.lineTo(dotX, dotY)
    ctx.stroke()
  }

  const currentSegmentStart = (completedSegments / totalSegments) * Math.PI * 2
  const currentSegmentEnd = ((completedSegments + 1) / totalSegments) * Math.PI * 2
  const pointAngle =
    currentSegmentStart + (currentSegmentEnd - currentSegmentStart) * segmentProgress

  ctx.fillStyle = getAmberBrightColor()
  ctx.beginPath()
  ctx.arc(cx + r * Math.cos(pointAngle), cy + r * Math.sin(pointAngle), 4, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = C_DRAWN
  for (let i = 0; i <= completedSegments && i < totalSegments; i++) {
    const angle = (i / totalSegments) * Math.PI * 2
    ctx.beginPath()
    ctx.arc(cx + r * Math.cos(angle), cy + r * Math.sin(angle), 2.5, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.fillStyle = getTextMutedColor()
  ctx.font = '12px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('π = C/d', s / 2, (3 * s) / 4)
}
