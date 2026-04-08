// ─── Coin Toss Preview ───────────────────────────────────────────────────────
// Preview renderer for the home page.

import { getBgColor, getInsideColor, getOutsideColor, PREVIEW_SIZE } from '../../colors'
import { clearCanvas } from '../base/canvas'

/**
 * Draw animated coin toss sequences for the home page preview.
 */
export function drawPreview(ctx: CanvasRenderingContext2D, time: number): void {
  const s = PREVIEW_SIZE
  clearCanvas(ctx, s, s)

  // Generate all valid coin toss sequences up to 8 coins
  // A valid sequence ends when heads > tails, and at no point before did heads > tails
  const possibleCoinSequences: boolean[][] = []
  const maxTosses = 8

  function generateSequences(seq: boolean[], heads: number, tails: number): void {
    // If heads > tails, we have a winning sequence
    if (heads > tails && seq.length > 0) {
      possibleCoinSequences.push([...seq])
      return
    }
    // Stop if we've reached max length
    if (seq.length >= maxTosses) return

    // Add a tail (false) - we can always add tails when heads <= tails
    seq.push(false)
    generateSequences(seq, heads, tails + 1)
    seq.pop()

    // Add a head (true) - only if adding it wouldn't make us stop earlier
    seq.push(true)
    generateSequences(seq, heads + 1, tails)
    seq.pop()
  }

  generateSequences([], 0, 0)

  const coinSequences = 6
  // Animation timing
  const coinsPerSecond = 2
  const pauseDuration = 0.1

  // Calculate cycle duration based on worst case
  const maxTotalCoins =
    coinSequences * possibleCoinSequences.reduce((max, seq) => Math.max(max, seq.length), 0)
  const cycleDuration = maxTotalCoins / coinsPerSecond + pauseDuration

  // Use time to determine cycle - each cycle gets different random sequences
  const cycleIndex = Math.floor(time / cycleDuration)
  const cycleTime = time % cycleDuration

  // Seeded random for consistent picks per cycle
  const seed = (cycleIndex * 7919 + 104729) % 1000000
  const seededRandom = (idx: number) => Math.abs(Math.sin(seed * (idx + 1) * 0.001) * 10000) % 1

  // Pick coinSequences sequences randomly from the predefined list
  const sequences: boolean[][] = []
  for (let i = 0; i < coinSequences; i++) {
    const pickIndex = Math.floor(seededRandom(i) * possibleCoinSequences.length)
    sequences.push(possibleCoinSequences[pickIndex])
  }

  const totalCoins = sequences.reduce((sum, seq) => sum + seq.length, 0)
  const animationDuration = totalCoins / coinsPerSecond

  // During pause, show all coins; then restart
  let visibleCoins: number
  if (cycleTime < animationDuration) {
    // Animating - show coins one by one
    visibleCoins = Math.floor(cycleTime * coinsPerSecond)
  } else {
    // Pause or between cycles - keep showing all coins
    visibleCoins = totalCoins
  }
  visibleCoins = Math.min(visibleCoins, totalCoins)

  const coinRadius = 7
  const coinSpacing = 16
  const rowHeight = 22
  const startY = 14

  let coinIndex = 0
  for (let row = 0; row < sequences.length; row++) {
    const seq = sequences[row]
    const y = startY + row * rowHeight

    for (let col = 0; col < seq.length; col++) {
      if (coinIndex >= visibleCoins) break

      const x = 12 + col * coinSpacing
      const isHead = seq[col]
      ctx.fillStyle = isHead ? getInsideColor() : getOutsideColor()
      ctx.beginPath()
      ctx.arc(x, y, coinRadius, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = getBgColor()
      ctx.font = 'bold 8px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(isHead ? 'H' : 'T', x, y + 3)

      coinIndex++
    }
  }
}
