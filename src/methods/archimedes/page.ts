// ─── Archimedes Page ─────────────────────────────────────────────────────────
// Main page factory for the Archimedes polygons method.

import { fmt } from '../../utils'
import { CANVAS_SIZE } from '../../colors'
import { createMethodPageFactory, statCard, legend, explanation } from '../base/page'
import {
  State,
  MAX_ITERATIONS,
  INITIAL_SIDES,
  createInitialState,
  calculateBounds,
  estimatePi,
  calculateGap,
} from './types'
import { draw, C_POLYGON_INNER, C_POLYGON_OUTER, C_CIRCLE } from './rendering'

// ─── Page Factory ────────────────────────────────────────────────────────────
export const createArchimedesPage = createMethodPageFactory<State>(
  {
    title: "Archimedes' Polygons",
    subtitle: 'Squeeze π between inscribed and circumscribed regular polygons.',
    index: '06',
    canvasWidth: CANVAS_SIZE,
    canvasHeight: CANVAS_SIZE,
    controls: `
      <button class="btn primary" id="btn-step">Double Sides</button>
      <button class="btn" id="btn-play">Auto Play</button>
      <button class="btn" id="btn-reset">Reset</button>
      <select id="select-iter" class="control-select">
        <option value="0">6 sides</option>
        <option value="1">12 sides</option>
        <option value="2">24 sides</option>
        <option value="3">48 sides</option>
        <option value="4">96 sides</option>
        <option value="5">192 sides</option>
        <option value="6">384 sides</option>
        <option value="7">768 sides</option>
        <option value="8">1536 sides</option>
        <option value="9">3072 sides</option>
      </select>
    `,
    statsPanel: `
      ${statCard('π estimate (average)', 'estimate', { valueClass: 'stat-value large', errorId: 'error' })}
      <div class="stat-card">
        <div class="stat-label">Upper bound (circumscribed)</div>
        <div class="stat-value" id="upper" style="color:${C_POLYGON_OUTER}">0.0000000000</div>
        <div class="stat-sub" id="gap">Gap: —</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Lower bound (inscribed)</div>
        <div class="stat-value" id="lower" style="color:${C_POLYGON_INNER}">0.0000000000</div>
      </div>
      ${statCard('Polygon sides', 'sides')}
      ${legend([
        { color: C_POLYGON_OUTER, text: 'Circumscribed polygon (π ≤ this)' },
        { color: C_POLYGON_INNER, text: 'Inscribed polygon (π ≥ this)' },
        { color: C_CIRCLE, text: 'Unit circle (π = this)' },
      ])}
      ${explanation(
        'How it works',
        [
          'Archimedes (≈250 BCE) approximated π by drawing regular polygons inside and outside a unit circle.',
          'Starting with a hexagon (6 sides), each iteration doubles the number of sides. The polygons increasingly approximate the circle, squeezing π into an ever-narrower range.',
          'With just 96 sides, Archimedes bounded π between 3.1408 and 3.1429 — an accuracy that stood for centuries.',
        ],
        'n·sin(π/n) ≤ π ≤ n·tan(π/n)'
      )}
    `,
  },
  createInitialState(),
  {
    init(ctx) {
      const { ctx: ctx2d, state, $id } = ctx

      // Get button references
      const btnStep = $id('btn-step', HTMLButtonElement)
      const btnPlay = $id('btn-play', HTMLButtonElement)
      const btnReset = $id('btn-reset', HTMLButtonElement)
      const selectIter = $id('select-iter', HTMLSelectElement)
      const elSides = $id('sides', HTMLElement)
      const elLower = $id('lower', HTMLElement)
      const elUpper = $id('upper', HTMLElement)
      const elGap = $id('gap', HTMLElement)
      const elEstimate = $id('estimate', HTMLElement)
      const elError = $id('error', HTMLElement)

      function updateStats(): void {
        const currentBounds = calculateBounds(state.sides)
        state.lower = currentBounds.lower
        state.upper = currentBounds.upper

        const est = estimatePi(state.lower, state.upper)
        const error = Math.abs(est - Math.PI)
        const gap = calculateGap(state.lower, state.upper)
        const digits = Math.min(12, 4 + state.iteration)

        elEstimate.textContent = fmt(est)
        elError.textContent = `Error: ${fmt(error)}`
        elError.className = 'stat-error ' + (error < 0.01 ? 'improving' : 'neutral')
        elSides.textContent = `${state.sides.toLocaleString()} sides`
        elLower.textContent = fmt(state.lower, digits)
        elUpper.textContent = fmt(state.upper, digits)
        elGap.textContent = `Gap: ${fmt(gap, digits)}`
        elGap.style.color = gap < 0.001 ? '#4ecb71' : 'var(--text-muted)'
      }

      function animateTransition(): void {
        if (state.progress >= 1) {
          state.progress = 0
          state.animating = false
          state.sides = state.targetSides
          updateStats()
          draw(ctx2d, state.sides, state.lower, state.upper)
          btnStep.disabled = false
          btnReset.disabled = false
          btnPlay.disabled = state.iteration >= MAX_ITERATIONS
          selectIter.disabled = false
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

      function stepTo(sides: number): void {
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

        btnStep.disabled = true
        btnReset.disabled = true
        selectIter.disabled = true

        animateTransition()
      }

      function step(): void {
        const nextSides = state.sides * 2
        if (nextSides > INITIAL_SIDES * Math.pow(2, MAX_ITERATIONS)) return
        stepTo(nextSides)
      }

      function reset(): void {
        if (state.animationId !== null) cancelAnimationFrame(state.animationId)
        state.sides = INITIAL_SIDES
        state.iteration = 0
        state.animating = false
        state.targetSides = INITIAL_SIDES
        state.progress = 0
        state.animationId = null
        updateStats()
        draw(ctx2d, INITIAL_SIDES, state.lower, state.upper)
        selectIter.value = '0'
        btnPlay.disabled = false
        btnStep.disabled = false
      }

      function play(): void {
        if (state.animating) return

        const playSequence = () => {
          const nextSides = state.sides * 2
          if (
            nextSides > INITIAL_SIDES * Math.pow(2, MAX_ITERATIONS) ||
            state.iteration >= MAX_ITERATIONS
          ) {
            btnPlay.disabled = true
            return
          }
          stepTo(nextSides)
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

      // Initial draw
      updateStats()
      draw(ctx2d, INITIAL_SIDES, state.lower, state.upper)

      // Wire up buttons
      btnStep.addEventListener('click', step)
      btnPlay.addEventListener('click', play)
      btnReset.addEventListener('click', reset)
      selectIter.addEventListener('change', e => {
        const iter = parseInt((e.target as HTMLSelectElement).value)
        const sides = INITIAL_SIDES * Math.pow(2, iter)
        stepTo(sides)
      })
    },

    cleanup(ctx) {
      if (ctx.state.animationId !== null) {
        cancelAnimationFrame(ctx.state.animationId)
        ctx.state.animationId = null
      }
      ctx.state.animating = false
    },
  }
)
