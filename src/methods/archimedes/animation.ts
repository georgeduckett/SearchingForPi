// ─── Archimedes Animation Logic ────────────────────────────────────────────────
// Animation transition functions for the Archimedes polygons method.

import { State, INITIAL_SIDES, MAX_ITERATIONS, calculateBounds } from './types'
import { draw } from './rendering'

// ─── Button Types ──────────────────────────────────────────────────────────────

export interface ArchimedesButtons {
  btnStep: HTMLButtonElement
  btnReset: HTMLButtonElement
  btnPlay: HTMLButtonElement
  selectIter: HTMLSelectElement
}

// ─── Animation Transition ──────────────────────────────────────────────────────

/**
 * Creates the animation transition function.
 */
export function createAnimateTransition(
  ctx2d: CanvasRenderingContext2D,
  state: State,
  buttons: ArchimedesButtons,
  updateStats: () => void
): () => void {
  function animateTransition(): void {
    if (state.progress >= 1) {
      state.progress = 0
      state.animating = false
      state.sides = state.targetSides
      updateStats()
      draw(ctx2d, state.sides, state.lower, state.upper)
      buttons.btnStep.disabled = false
      buttons.btnReset.disabled = false
      buttons.btnPlay.disabled = state.iteration >= MAX_ITERATIONS
      buttons.selectIter.disabled = false
      state.animationId = null
      return
    }

    state.progress += 0.04

    const currentLower = state.startLower + (state.endLower - state.startLower) * state.progress
    const currentUpper = state.startUpper + (state.endUpper - state.startUpper) * state.progress
    const currentSides =
      state.startSides + (state.targetSides - state.startSides) * state.progress

    draw(ctx2d, currentSides, currentLower, currentUpper)

    state.animationId = requestAnimationFrame(animateTransition)
  }

  return animateTransition
}

// ─── Animation Actions ─────────────────────────────────────────────────────────

/**
 * Step to a specific number of sides with animation.
 */
export function stepTo(
  sides: number,
  state: State,
  _ctx2d: CanvasRenderingContext2D,
  animateTransition: () => void,
  buttons: Pick<ArchimedesButtons, 'btnStep' | 'btnReset' | 'selectIter'>
): void {
  if (state.animating) return

  state.startSides = state.sides
  state.startLower = state.lower
  state.startUpper = state.upper

  const newBounds = calculateBounds(sides)
  state.targetSides = sides
  state.endLower = newBounds.lower
  state.endUpper = newBounds.upper

  state.iteration = Math.log2(sides / INITIAL_SIDES)
  state.animating = true
  state.progress = 0

  buttons.btnStep.disabled = true
  buttons.btnReset.disabled = true
  buttons.selectIter.disabled = true

  animateTransition()
}

/**
 * Perform a single step (double the sides).
 */
export function step(
  state: State,
  _buttons: Pick<ArchimedesButtons, 'btnStep' | 'btnReset' | 'selectIter'>,
  stepToFn: (sides: number) => void
): void {
  const nextSides = state.sides * 2
  if (nextSides > INITIAL_SIDES * Math.pow(2, MAX_ITERATIONS)) return
  stepToFn(nextSides)
}

/**
 * Auto-play sequence - double sides repeatedly.
 */
export function play(
  state: State,
  buttons: Pick<ArchimedesButtons, 'btnPlay'>,
  stepToFn: (sides: number) => void
): void {
  if (state.animating) return

  const playSequence = () => {
    const nextSides = state.sides * 2
    if (
      nextSides > INITIAL_SIDES * Math.pow(2, MAX_ITERATIONS) ||
      state.iteration >= MAX_ITERATIONS
    ) {
      buttons.btnPlay.disabled = true
      return
    }
    stepToFn(nextSides)
    setTimeout(() => {
      if (!state.animating && state.iteration < MAX_ITERATIONS) {
        playSequence()
      } else if (state.animating) {
        setTimeout(playSequence, 100)
      }
    }, 600)
  }
  playSequence()
}

/**
 * Reset to initial state.
 */
export function reset(
  state: State,
  ctx2d: CanvasRenderingContext2D,
  buttons: Pick<ArchimedesButtons, 'btnStep' | 'btnPlay' | 'selectIter'>,
  updateStats: () => void
): void {
  if (state.animationId !== null) cancelAnimationFrame(state.animationId)
  state.sides = INITIAL_SIDES
  state.iteration = 0
  state.animating = false
  state.targetSides = INITIAL_SIDES
  state.progress = 0
  state.animationId = null
  updateStats()
  draw(ctx2d, INITIAL_SIDES, state.lower, state.upper)
  buttons.selectIter.value = '0'
  buttons.btnPlay.disabled = false
  buttons.btnStep.disabled = false
}
