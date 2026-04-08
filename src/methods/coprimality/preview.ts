// ─── Coprimality Preview ─────────────────────────────────────────────────────
// Preview renderer for the home page.

import { getInsideColor, getTextMutedColor, getAmberColor, PREVIEW_SIZE } from '../../colors'
import { clearCanvas } from '../base/canvas'

/**
 * Draw coprimality grid preview for the home page.
 */
export function drawPreview(ctx: CanvasRenderingContext2D, _time: number): void {
  const s = PREVIEW_SIZE
  clearCanvas(ctx, s, s)

  const n = 10
  const cell = (s - 20) / n
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= n; j++) {
      const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
      const isCoprime = gcd(i, j) === 1
      ctx.fillStyle = isCoprime ? getInsideColor() : getTextMutedColor()
      ctx.globalAlpha = isCoprime ? 0.8 : 0.2
      ctx.fillRect(10 + (i - 1) * cell, 10 + (j - 1) * cell, cell - 1, cell - 1)
    }
  }
  ctx.globalAlpha = 1

  ctx.fillStyle = getAmberColor()
  ctx.font = '10px monospace'
  ctx.textAlign = 'right'
  ctx.fillText('P = 6/π²', s - 10, s - 5)
}
