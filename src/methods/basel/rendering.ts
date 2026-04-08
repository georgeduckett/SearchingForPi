// ─── Basel Problem Rendering ─────────────────────────────────────────────────
// Canvas drawing functions for the Basel problem visualization.

import { getBgColor, getAmberColor, getTextMutedColor, CANVAS_SIZE } from '../../colors'
import { State } from './types'
import { estimatePi, calculateConvergence } from './types'

/**
 * Draw the complete Basel visualization - stacked squares and π progress indicator.
 */
export function draw(ctx: CanvasRenderingContext2D, state: State): void {
  const W = CANVAS_SIZE
  const H = CANVAS_SIZE

  ctx.fillStyle = getBgColor()
  ctx.fillRect(0, 0, W, H)

  if (state.terms === 0) {
    drawEmptyState(ctx, W, H)
    return
  }

  // Calculate scale so all squares fit
  const maxSquareSize = Math.min(W, H) * 0.5
  const scaleFactor = maxSquareSize

  // Calculate total height of all squares shown
  let totalHeight = 0
  for (let n = 1; n <= state.terms; n++) {
    const term = 1 / (n * n)
    const size = Math.sqrt(term) * scaleFactor
    totalHeight += size
  }

  // Center vertically
  let y = (H - totalHeight) / 2

  // Draw each square from top to bottom
  for (let n = 1; n <= state.terms; n++) {
    const term = 1 / (n * n)
    const size = Math.sqrt(term) * scaleFactor
    const x = (W - size) / 2

    // Fade effect: older terms slightly faded
    const alpha = 0.9 - (n - 1) * 0.05

    // Color gradient: blue to cyan based on term number
    const hue = 200 + (n - 1) * 8
    ctx.fillStyle = `hsla(${hue}, 70%, 55%, ${alpha})`
    ctx.fillRect(x, y, size, size)

    y += size
  }

  // Draw π progress indicator
  const piEstimate = estimatePi(state.sum)
  const progress = calculateConvergence(piEstimate)
  drawProgressIndicator(ctx, W, H, progress)
}

/**
 * Draw the empty initial state.
 */
function drawEmptyState(ctx: CanvasRenderingContext2D, W: number, H: number): void {
  // Draw empty progress indicator
  drawProgressIndicator(ctx, W, H, 0)

  // Formula text at top
  ctx.fillStyle = getAmberColor()
  ctx.font = '12px "JetBrains Mono", monospace'
  ctx.textAlign = 'center'
  ctx.fillText('Σ 1/n² → π²/6', W / 2, 20)
}

/**
 * Draw the π progress indicator circle.
 */
function drawProgressIndicator(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  progress: number
): void {
  const cx = W - 40
  const cy = H / 2
  const radius = 28

  // Background circle
  ctx.strokeStyle = getTextMutedColor()
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.stroke()

  // Progress arc (fills as we approach π)
  if (progress > 0) {
    ctx.strokeStyle = getAmberColor()
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2)
    ctx.stroke()
  }

  // π symbol in center
  ctx.fillStyle = progress > 0 ? getAmberColor() : getTextMutedColor()
  ctx.font = 'bold 20px "JetBrains Mono", monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('π', cx, cy)
  ctx.textBaseline = 'alphabetic'

  // Formula text at top
  ctx.fillStyle = getAmberColor()
  ctx.font = '12px "JetBrains Mono", monospace'
  ctx.textAlign = 'center'
  ctx.fillText('Σ 1/n² → π²/6', W / 2, 20)
}
