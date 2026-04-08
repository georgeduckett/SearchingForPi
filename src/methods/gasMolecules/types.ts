// ─── Gas Molecules Types ─────────────────────────────────────────────────────
// Type definitions and constants for the gas molecules method.

import { getInsideColor, getAmberColor } from '../../colors'

// ─── Constants ───────────────────────────────────────────────────────────────
export const MAX_PARTICLES = 200
export const PARTICLE_RADIUS = 4
export const TICKS_PER_FRAME = 2
export const CONTAINER_PAD = 30

// Method-specific colors
export const C_PARTICLE = getInsideColor()
export const C_WALL = getAmberColor()

// ─── Types ───────────────────────────────────────────────────────────────────
export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
}

export interface State {
  particles: Particle[]
  temperature: number
  running: boolean
  rafId: number | null
  steps: number
}

// ─── State Factory ───────────────────────────────────────────────────────────
export function createInitialState(): State {
  return {
    particles: [],
    temperature: 1,
    running: false,
    rafId: null,
    steps: 0,
  }
}

// ─── Physics Helpers ─────────────────────────────────────────────────────────
/**
 * Gaussian random number using Box-Muller transform.
 */
export function gaussianRandom(): number {
  const u1 = Math.random()
  const u2 = Math.random()
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
}

/**
 * Estimate π from Maxwell-Boltzmann speed distribution.
 * For 2D Maxwell-Boltzmann: <v> = √(πT/2), so: π = 2<v>²/T
 */
export function estimatePi(particles: Particle[], temperature: number): number {
  if (particles.length < 10) return 0

  // Calculate mean speed
  let avgSpeed = 0
  for (const p of particles) {
    avgSpeed += Math.sqrt(p.vx * p.vx + p.vy * p.vy)
  }
  avgSpeed /= particles.length

  return (2 * avgSpeed * avgSpeed) / temperature
}

/**
 * Calculate average speed of particles.
 */
export function calculateAvgSpeed(particles: Particle[]): number {
  if (particles.length === 0) return 0
  let total = 0
  for (const p of particles) {
    total += Math.sqrt(p.vx * p.vx + p.vy * p.vy)
  }
  return total / particles.length
}
