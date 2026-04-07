// ─── Basel Problem Preview ───────────────────────────────────────────────────
// Preview renderer for the home page card.

import { getAmberColor, getTextMutedColor, PREVIEW_SIZE } from '../../colors'
import { clearCanvas } from '../base/canvas'

/**
 * Draw the preview animation for the Basel problem method.
 * Shows stacked squares with π convergence indicator.
 */
export function drawPreview(ctx: CanvasRenderingContext2D, time: number): void {
  const s = PREVIEW_SIZE
  clearCanvas(ctx, s, s)

  const cycleDuration = 6 // seconds for full animation
  const timeInCycle = time % cycleDuration
  const progress = timeInCycle / cycleDuration

  // Number of terms to show (1 to 8)
  const maxTerms = 8
  const termsShown = Math.min(maxTerms, Math.floor(progress * maxTerms) + 1)
  const termProgress = (progress * maxTerms) % 1

  // Calculate scale so all squares fit
  const maxSquareSize = s * 0.5
  const scaleFactor = maxSquareSize / Math.sqrt(1) // 1/1² = 1

  // Animate squares appearing
  let totalHeight = 0
  for (let n = 1; n <= termsShown; n++) {
    const term = 1 / (n * n)
    const size = Math.sqrt(term) * scaleFactor
    totalHeight += size
  }

  // Center vertically
  let y = (s - totalHeight) / 2

  // Draw each square with animation
  for (let n = 1; n <= termsShown; n++) {
    const term = 1 / (n * n)
    const size = Math.sqrt(term) * scaleFactor
    const x = (s - size) / 2

    // Fade in animation for newly added square
    const isNew = n === termsShown
    const alpha = isNew ? Math.min(1, termProgress * 3) : 0.9 - n * 0.05

    // Color gradient: blue to cyan
    const hue = 200 + (n - 1) * 8
    ctx.fillStyle = `hsla(${hue}, 70%, 55%, ${alpha})`

    // Draw the square
    if (isNew && termProgress < 0.3) {
      // Scale in animation for new square
      const scaleIn = Math.min(1, termProgress / 0.3)
      const scaledSize = size * scaleIn
      ctx.fillRect(s / 2 - scaledSize / 2, y + (size - scaledSize), scaledSize, scaledSize)
    } else {
      ctx.fillRect(x, y, size, size)
    }

    y += size
  }

  // Calculate current pi estimate and convergence progress
  let currentSum = 0
  for (let n = 1; n <= termsShown; n++) {
    currentSum += 1 / (n * n)
  }
  const piEstimate = Math.sqrt(6 * currentSum)
  // Progress: how close are we to π?
  const initialEstimate = Math.sqrt(6) // n=1
  const maxError = Math.abs(initialEstimate - Math.PI)
  const currentError = Math.abs(piEstimate - Math.PI)
  const convergence = Math.max(0, Math.min(1, 1 - currentError / maxError))

  // Draw π progress indicator on the right side
  const cx = s - 22
  const cy = s / 2
  const radius = 16

  // Background circle
  ctx.strokeStyle = getTextMutedColor()
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.stroke()

  // Progress arc (fills as we approach π)
  if (termsShown > 0) {
    ctx.strokeStyle = getAmberColor()
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + convergence * Math.PI * 2)
    ctx.stroke()
  }

  // π symbol in center
  ctx.fillStyle = termsShown > 0 ? getAmberColor() : getTextMutedColor()
  ctx.font = 'bold 12px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('π', cx, cy)
  ctx.textBaseline = 'alphabetic'

  // Formula text at top
  ctx.fillStyle = getAmberColor()
  ctx.font = '10px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('Σ 1/n² → π²/6', s / 2, 14)

  // Show n=value indicator
  ctx.fillStyle = getTextMutedColor()
  ctx.font = '9px monospace'
  ctx.fillText(`n=${termsShown}`, s / 2, s - 6)
}
