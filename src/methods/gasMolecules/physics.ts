// ─── Gas Molecules Physics ───────────────────────────────────────────────────
// Physics simulation for gas molecules.

import { Particle, PARTICLE_RADIUS, CONTAINER_PAD } from './types'

/**
 * Physics simulation step - update positions and handle collisions.
 */
export function physicsStep(
  particles: Particle[],
  canvasWidth: number,
  canvasHeight: number,
  temperature: number,
  steps: number
): void {
  const minX = CONTAINER_PAD + PARTICLE_RADIUS
  const maxX = canvasWidth - CONTAINER_PAD - PARTICLE_RADIUS
  const minY = CONTAINER_PAD + PARTICLE_RADIUS
  const maxY = canvasHeight - CONTAINER_PAD - PARTICLE_RADIUS

  // Velocity scaling for thermalization
  const targetSigma = Math.sqrt(temperature)

  for (const p of particles) {
    // Update position
    p.x += p.vx
    p.y += p.vy

    // Wall collisions (elastic)
    if (p.x < minX) {
      p.x = minX
      p.vx = Math.abs(p.vx)
    }
    if (p.x > maxX) {
      p.x = maxX
      p.vx = -Math.abs(p.vx)
    }
    if (p.y < minY) {
      p.y = minY
      p.vy = Math.abs(p.vy)
    }
    if (p.y > maxY) {
      p.y = maxY
      p.vy = -Math.abs(p.vy)
    }

    // Gentle thermalization toward temperature
    if (steps % 10 === 0) {
      const currentSigma = Math.sqrt((p.vx * p.vx + p.vy * p.vy) / 2)
      const scale = 0.99 + 0.01 * (targetSigma / (currentSigma + 0.1))
      p.vx *= scale
      p.vy *= scale
    }
  }

  // Particle-particle collisions (simplified)
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const p1 = particles[i]
      const p2 = particles[j]
      const dx = p2.x - p1.x
      const dy = p2.y - p1.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < PARTICLE_RADIUS * 2 + 1) {
        // Elastic collision
        const dvx = p1.vx - p2.vx
        const dvy = p1.vy - p2.vy
        const dvDotDr = dvx * dx + dvy * dy

        if (dvDotDr > 0) {
          // Approaching
          const scale = dvDotDr / (dist * dist)
          p1.vx -= scale * dx
          p1.vy -= scale * dy
          p2.vx += scale * dx
          p2.vy += scale * dy
        }
      }
    }
  }
}
