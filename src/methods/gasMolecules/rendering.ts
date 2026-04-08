// ─── Gas Molecules Rendering ─────────────────────────────────────────────────
// Canvas drawing functions for the gas molecules visualization.

import { getBgColor, CANVAS_SIZE } from '../../colors'
import { State, PARTICLE_RADIUS, CONTAINER_PAD, C_PARTICLE, C_WALL } from './types'

/**
 * Draw the complete gas molecules visualization.
 */
export function draw(ctx: CanvasRenderingContext2D, state: State): void {
  const W = CANVAS_SIZE
  const H = CANVAS_SIZE

  ctx.fillStyle = getBgColor()
  ctx.fillRect(0, 0, W, H)

  // Draw container
  ctx.strokeStyle = C_WALL
  ctx.lineWidth = 3
  ctx.strokeRect(CONTAINER_PAD, CONTAINER_PAD, W - CONTAINER_PAD * 2, H - CONTAINER_PAD * 2)

  // Draw particles with velocity-based color
  for (const p of state.particles) {
    const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
    const maxSpeed = 5 * Math.sqrt(state.temperature)
    const normalizedSpeed = Math.min(speed / maxSpeed, 1)

    // Color from cool (slow) to hot (fast)
    const hue = 200 - normalizedSpeed * 60 // Blue to purple/red
    ctx.fillStyle = `hsl(${hue}, 70%, 55%)`

    ctx.beginPath()
    ctx.arc(p.x, p.y, PARTICLE_RADIUS, 0, Math.PI * 2)
    ctx.fill()
  }

  // Draw histogram of speeds
  drawHistogram(ctx, state)
}

/**
 * Draw speed histogram with Maxwell-Boltzmann reference curve.
 */
function drawHistogram(ctx: CanvasRenderingContext2D, state: State): void {
  if (state.particles.length < 5) return

  const W = CANVAS_SIZE
  const histH = 60
  const histY = CANVAS_SIZE - 70
  const histX = CONTAINER_PAD

  // Calculate speeds
  const speeds = state.particles.map(p => Math.sqrt(p.vx * p.vx + p.vy * p.vy))

  // Create histogram bins
  const maxSpeed = Math.max(...speeds, 5)
  const numBins = 20
  const binWidth = maxSpeed / numBins
  const bins = Array(numBins).fill(0)

  for (const s of speeds) {
    const bin = Math.min(Math.floor(s / binWidth), numBins - 1)
    bins[bin]++
  }

  const maxBin = Math.max(...bins, 1)
  const barWidth = (W - CONTAINER_PAD * 2) / numBins

  // Draw histogram bars
  ctx.fillStyle = C_PARTICLE
  ctx.globalAlpha = 0.5
  for (let i = 0; i < numBins; i++) {
    const h = (bins[i] / maxBin) * histH
    ctx.fillRect(histX + i * barWidth, histY + histH - h, barWidth - 1, h)
  }
  ctx.globalAlpha = 1

  // Draw Maxwell-Boltzmann reference
  ctx.strokeStyle = C_WALL
  ctx.lineWidth = 2
  ctx.beginPath()

  for (let i = 0; i <= numBins; i++) {
    const v = (i / numBins) * maxSpeed
    // 2D Maxwell-Boltzmann: f(v) = (v/T) * exp(-v²/(2T)) for normalized distribution
    const fv = (v / state.temperature) * Math.exp((-v * v) / (2 * state.temperature))
    const maxFv = 1 / (state.temperature * Math.sqrt(Math.E)) // Peak value
    const normalizedFv = fv / maxFv
    const y = histY + histH - normalizedFv * histH
    const x = histX + i * barWidth

    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()
}
