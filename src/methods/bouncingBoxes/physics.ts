// ─── Bouncing Boxes Physics ──────────────────────────────────────────────────
// Collision detection and elastic collision calculations.

import { State, BASE_BOX_SIZE, BASE_WALL_X, M1, MAX_COLLISIONS_PER_FRAME } from './types'

// ─── Box Size Calculation ────────────────────────────────────────────────────

/**
 * Calculate the visual size of box 2 based on its mass.
 * Uses logarithmic scaling for visual clarity across mass ranges.
 */
export function getBox2Size(m2: number): number {
  const minMass = 1
  const maxMass = 100_000_000
  const t = (Math.log10(m2) - Math.log10(minMass)) / (Math.log10(maxMass) - Math.log10(minMass))
  return 20 + t * (60 - 20) // BASE_BOX2_MIN_SIZE + t * (BASE_BOX2_MAX_SIZE - BASE_BOX2_MIN_SIZE)
}

// ─── Collision Detection ─────────────────────────────────────────────────────

export type CollisionType = 'box' | 'wall' | 'none'

export interface CollisionResult {
  type: CollisionType
  time: number
}

/**
 * Calculate time until the next collision.
 * Returns the type of collision (box-box or box-wall) and time until it occurs.
 */
export function getTimeToCollision(state: State): CollisionResult {
  const EPSILON = 1e-6
  const box2Size = getBox2Size(state.m2)

  // Time until box-box collision
  let timeToBoxCollision = Infinity
  if (state.smallBoxV > state.largeBoxV) {
    const relVelocity = state.smallBoxV - state.largeBoxV
    const gap = state.largeBoxX - box2Size / 2 - (state.smallBoxX + BASE_BOX_SIZE / 2)
    if (gap > -EPSILON) {
      timeToBoxCollision = gap / relVelocity
    }
  }

  // Time until box-wall collision
  let timeToWallCollision = Infinity
  if (state.smallBoxV < 0) {
    const distToWall = state.smallBoxX - BASE_BOX_SIZE / 2 - BASE_WALL_X
    if (distToWall > -EPSILON) {
      timeToWallCollision = distToWall / -state.smallBoxV
    }
  }

  // Return the sooner collision
  if (timeToBoxCollision < timeToWallCollision && timeToBoxCollision < Infinity) {
    return { type: 'box', time: timeToBoxCollision }
  } else if (timeToWallCollision < Infinity) {
    return { type: 'wall', time: timeToWallCollision }
  }
  return { type: 'none', time: Infinity }
}

// ─── Elastic Collision Physics ───────────────────────────────────────────────

/**
 * Apply elastic collision formulas for box-box collision.
 * Updates velocities in place.
 */
export function applyBoxCollision(state: State): void {
  const m1 = M1
  const m2 = state.m2
  const v1 = state.smallBoxV
  const v2 = state.largeBoxV

  // Elastic collision formulas
  const newV1 = ((m1 - m2) / (m1 + m2)) * v1 + ((2 * m2) / (m1 + m2)) * v2
  const newV2 = ((2 * m1) / (m1 + m2)) * v1 + ((m2 - m1) / (m1 + m2)) * v2

  state.smallBoxV = newV1
  state.largeBoxV = newV2
}

/**
 * Apply wall collision - reverse the small box's velocity.
 */
export function applyWallCollision(state: State): void {
  state.smallBoxV = -state.smallBoxV
}

// ─── Simulation State ────────────────────────────────────────────────────────

/**
 * Check if the simulation is complete.
 * True when boxes are separated and moving away from each other.
 */
export function isSimulationComplete(state: State): boolean {
  const box2Size = getBox2Size(state.m2)
  const boxesSeparated = state.largeBoxV > state.smallBoxV && state.smallBoxV >= 0
  const gapLargeEnough = state.largeBoxX - state.smallBoxX > 5 * Math.max(BASE_BOX_SIZE, box2Size)
  const smallBoxAwayFromWall = state.smallBoxX - BASE_BOX_SIZE / 2 > BASE_WALL_X + 5 * BASE_BOX_SIZE
  return boxesSeparated && gapLargeEnough && smallBoxAwayFromWall
}

/**
 * Update physics for one frame.
 * Handles multiple collisions per frame for high-k simulations.
 */
export function updatePhysics(state: State, timestamp: number, onCollision: () => void): void {
  const elapsedTimeMS = Math.min(timestamp - state.time, 100)
  state.time = timestamp
  let timeRemaining = elapsedTimeMS / 1000
  let collisionsThisFrame = 0

  while (timeRemaining > 1e-6 && collisionsThisFrame < MAX_COLLISIONS_PER_FRAME) {
    const collision = getTimeToCollision(state)

    if (collision.time >= timeRemaining) {
      // No more collisions this frame - just move boxes
      state.smallBoxX += state.smallBoxV * timeRemaining
      state.largeBoxX += state.largeBoxV * timeRemaining
      break
    }

    // Move boxes to collision point
    state.smallBoxX += state.smallBoxV * collision.time
    state.largeBoxX += state.largeBoxV * collision.time
    timeRemaining -= collision.time

    // Apply collision
    if (collision.type === 'box') {
      applyBoxCollision(state)
    } else if (collision.type === 'wall') {
      applyWallCollision(state)
    }

    state.collisions++
    collisionsThisFrame++
    onCollision()
  }

  // Apply vibration effect for high collision rates
  if (collisionsThisFrame > 10) {
    const intensity = Math.min(collisionsThisFrame / 100, 0.2)
    state.vibrationOffset = (Math.random() - 0.5) * intensity * BASE_BOX_SIZE * 0.3
  } else {
    state.vibrationOffset *= 0.5
  }
}

/**
 * Calculate π approximation from collision count.
 */
export function calculatePiApprox(collisions: number, k: number): number {
  return collisions / 10 ** k
}
