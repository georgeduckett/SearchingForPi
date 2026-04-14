// ─── Archimedes Animation Logic ────────────────────────────────────────────────
// Animation transition functions for the Archimedes polygons method.

import { State, INITIAL_SIDES, calculateBounds } from './types'
import { draw } from './rendering'

// ─── Button Types ──────────────────────────────────────────────────────────────

export interface ArchimedesButtons {
  btnStep: HTMLButtonElement
  btnReset: HTMLButtonElement
  btnPlay: HTMLButtonElement
  selectIter: HTMLSelectElement
}

// ─── Animation Transition ──────────────────────────────────────────────────────

/** Flag to track if we're in an auto-play sequence */
let isPlayingSequence = false

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
      // Update dropdown to reflect current sides
      buttons.selectIter.value = String(state.sides)
      // Only re-enable buttons if we're not in a play sequence
      if (!isPlayingSequence) {
        buttons.btnStep.disabled = false
        buttons.btnReset.disabled = false
        // Check if there's a next option in the dropdown
        const options = Array.from(buttons.selectIter.options)
        const hasNextOption = options.some(opt => parseInt(opt.value) > state.sides)
        buttons.btnPlay.disabled = !hasNextOption
        buttons.selectIter.disabled = false
      }
      state.animationId = null
      return
    }

    state.progress += 0.04

    const currentLower = state.startLower + (state.endLower - state.startLower) * state.progress
    const currentUpper = state.startUpper + (state.endUpper - state.startUpper) * state.progress
    const currentSides = state.startSides + (state.targetSides - state.startSides) * state.progress

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
 * Perform a single step (move to next dropdown option).
 * Updates the dropdown which triggers the animation via its change handler.
 */
export function step(
  state: State,
  buttons: Pick<ArchimedesButtons, 'selectIter'>,
  _stepToFn: (sides: number) => void
): void {
  const select = buttons.selectIter
  const currentSides = state.sides

  // Find the next option with more sides than current
  const options = Array.from(select.options)
  const nextOption = options.find(opt => parseInt(opt.value) > currentSides)

  if (!nextOption) return

  // Update dropdown value
  select.value = nextOption.value

  // Dispatch change event to trigger the dropdown's change handler
  select.dispatchEvent(new Event('change', { bubbles: true }))
}

/**
 * Auto-play sequence - iterate through dropdown options.
 */
export function play(
  state: State,
  buttons: Pick<ArchimedesButtons, 'btnPlay' | 'btnStep' | 'btnReset' | 'selectIter'>,
  stepToFn: (sides: number) => void
): void {
  if (state.animating) return

  // Mark that we're in a play sequence so buttons stay disabled
  isPlayingSequence = true

  // Disable all buttons for the entire play sequence
  buttons.btnPlay.disabled = true
  buttons.btnStep.disabled = true
  buttons.btnReset.disabled = true
  buttons.selectIter.disabled = true

  const playSequence = () => {
    const select = buttons.selectIter
    const currentSides = state.sides
    const options = Array.from(select.options)
    const nextOption = options.find(opt => parseInt(opt.value) > currentSides)

    if (!nextOption) {
      // No more options - play sequence complete
      isPlayingSequence = false
      buttons.btnStep.disabled = false
      buttons.btnReset.disabled = false
      buttons.selectIter.disabled = false
      return
    }

    // Update dropdown and trigger animation
    select.value = nextOption.value
    const nextSides = parseInt(nextOption.value)
    stepToFn(nextSides)

    setTimeout(() => {
      // Check if there's a next option after this one
      const nextNextOption = options.find(opt => parseInt(opt.value) > nextSides)
      if (!nextNextOption) {
        // Last option just completed - re-enable buttons
        isPlayingSequence = false
        buttons.btnStep.disabled = false
        buttons.btnReset.disabled = false
        buttons.selectIter.disabled = false
      } else if (!state.animating) {
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
  buttons.selectIter.value = String(INITIAL_SIDES)
  buttons.btnPlay.disabled = false
  buttons.btnStep.disabled = false
}
