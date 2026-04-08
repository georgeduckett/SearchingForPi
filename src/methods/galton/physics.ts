// ─── Galton Board Physics ────────────────────────────────────────────────────
// Ball physics and π estimation calculations.

import {
  Ball,
  State,
  ROWS,
  NUM_BINS,
  BALL_RADIUS,
  PEG_RADIUS,
  GRAVITY,
  RESTITUTION,
  FRICTION,
  PEG_DAMPING,
  PEG_START_Y,
  PEG_SPACING_Y,
  PEG_SPACING_X,
} from './types'

// ─── Ball Creation ───────────────────────────────────────────────────────────

/**
 * Create a new ball at the top of the board with slight randomization.
 */
export function createBall(centerX: number): Ball {
  return {
    x: centerX + (Math.random() - 0.5) * 8,
    y: 15 + Math.random() * 10,
    vx: (Math.random() - 0.5) * 0.3,
    vy: Math.random() * 0.5,
    active: true,
    bin: null,
  }
}

// ─── Physics Update ──────────────────────────────────────────────────────────

/**
 * Update ball physics and check for collisions.
 * Returns the bin number if the ball landed, or null otherwise.
 */
export function updateBall(ball: Ball, canvasWidth: number, canvasHeight: number): number | null {
  if (!ball.active) return null

  // Apply gravity and friction
  ball.vy += GRAVITY
  ball.vx *= FRICTION
  ball.vy *= FRICTION
  ball.x += ball.vx
  ball.y += ball.vy

  const centerX = canvasWidth / 2

  // Check peg collisions
  for (let row = 0; row < ROWS; row++) {
    const pegsInRow = row + 1
    const pegY = PEG_START_Y + row * PEG_SPACING_Y
    const rowStartX = centerX - (pegsInRow / 2) * PEG_SPACING_X

    for (let peg = 0; peg < pegsInRow; peg++) {
      const pegX = rowStartX + (peg + 0.5) * PEG_SPACING_X
      const dx = ball.x - pegX
      const dy = ball.y - pegY
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < BALL_RADIUS + PEG_RADIUS && dist > 0) {
        // Collision response
        const nx = dx / dist
        const ny = dy / dist
        ball.x = pegX + nx * (BALL_RADIUS + PEG_RADIUS + 1)
        ball.y = pegY + ny * (BALL_RADIUS + PEG_RADIUS + 1)
        const dotProduct = ball.vx * nx + ball.vy * ny
        ball.vx = (ball.vx - 2 * dotProduct * nx) * RESTITUTION * PEG_DAMPING
        ball.vy = (ball.vy - 2 * dotProduct * ny) * RESTITUTION * PEG_DAMPING
        ball.vy = Math.max(ball.vy, GRAVITY * 0.5)
      }
    }
  }

  // Check if ball has reached the bins
  const binY = PEG_START_Y + ROWS * PEG_SPACING_Y
  if (ball.y > binY && ball.y < canvasHeight - 20) {
    const binStartX = centerX - (NUM_BINS / 2) * PEG_SPACING_X
    const bin = Math.floor((ball.x - binStartX) / PEG_SPACING_X)
    if (bin >= 0 && bin < NUM_BINS) {
      ball.active = false
      ball.bin = bin
      return bin
    }
  }

  // Check if ball is out of bounds
  if (ball.y > canvasHeight || ball.x < 0 || ball.x > canvasWidth) {
    ball.active = false
  }

  return null
}

// ─── π Estimation ────────────────────────────────────────────────────────────

/**
 * Estimate π using Stirling's approximation.
 * Uses the relationship between the binomial distribution and Gaussian.
 */
export function estimatePi(state: State): number {
  if (state.dropped < 10) return 0

  const total = state.bins.reduce((a, b) => a + b, 0)
  if (total === 0) return 0

  const peakBin = state.bins[Math.floor(NUM_BINS / 2)] || 0
  if (peakBin === 0) return 0

  // Calculate mean and variance
  let mean = 0
  for (let i = 0; i < NUM_BINS; i++) {
    mean += i * state.bins[i]
  }
  mean /= total

  let variance = 0
  for (let i = 0; i < NUM_BINS; i++) {
    variance += state.bins[i] * (i - mean) ** 2
  }
  variance /= total

  // π estimate from Stirling's approximation
  const piEstimate = total ** 2 / (2 * variance * peakBin ** 2)
  return piEstimate
}
