// ─── Circle Packing Page ─────────────────────────────────────────────────────
// Main page factory for the circle packing method.

import { fmt } from '../../utils'
import { getInsideColor, CANVAS_SIZE } from '../../colors'
import { createMethodPageFactory, statCard, explanation, legend } from '../base/page'
import { State, MAX_CIRCLES, createInitialState } from './types'
import { tryPlaceCircle, estimatePi, calculateCoverage } from './packing'
import { draw } from './rendering'

// ─── Page Factory ────────────────────────────────────────────────────────────
export const createCirclePackingPage = createMethodPageFactory<State>(
  {
    title: 'Circle Packing',
    subtitle: 'The area of circles relates to π through covered area.',
    index: '13',
    canvasWidth: CANVAS_SIZE,
    canvasHeight: CANVAS_SIZE,
    controls: `
      <button id="cp-start" class="btn primary">Start</button>
      <button id="cp-step" class="btn">+3 Circles</button>
      <button id="cp-reset" class="btn" disabled>Reset</button>
    `,
    statsPanel: `
      ${statCard('π estimate', 'cp-estimate', { valueClass: 'stat-value large', errorId: 'cp-error' })}
      ${statCard('Circles placed', 'cp-circles', { subtext: `of ${MAX_CIRCLES} max` })}
      ${statCard('Area coverage', 'cp-covered', { subtext: 'jamming limit ~55%' })}
      ${legend([{ color: getInsideColor(), text: 'Placed circles' }])}
      ${explanation(
        'How it works',
        [
          'We place circles randomly without overlap (random sequential adsorption). The covered area equals π times the sum of squared radii (for non-overlapping circles).',
          'By measuring the actual covered area and dividing by Σr², we can estimate the value of π.',
          'The maximum packing density (jamming limit) for random circle placement is approximately 54.7%.',
        ],
        'Area = π × Σr²'
      )}
    `,
  },
  createInitialState(),
  {
    init(ctx) {
      const { canvas, ctx: canvasCtx, state } = ctx
      const $required = ctx.$required.bind(ctx)

      const btnStart = $required('#cp-start') as HTMLButtonElement
      const btnStep = $required('#cp-step') as HTMLButtonElement
      const btnReset = $required('#cp-reset') as HTMLButtonElement
      const elEstimate = $required('#cp-estimate')
      const elCircles = $required('#cp-circles')
      const elCovered = $required('#cp-covered')
      const elError = $required('#cp-error')

      function updateStats(): void {
        const piEstimate = estimatePi(state.circles, canvas.width, canvas.height)
        const error = Math.abs(piEstimate - Math.PI)
        const coverage = calculateCoverage(state.circles, canvas.width, canvas.height)

        elEstimate.textContent = state.circles.length < 5 ? '—' : fmt(piEstimate)
        elCircles.textContent = state.circles.length.toLocaleString()
        elCovered.textContent = `${coverage.toFixed(1)}%`
        if (state.circles.length >= 5) {
          elError.textContent = `Error: ${fmt(error)}`
          elError.className = 'stat-error ' + (error < 0.5 ? 'improving' : 'neutral')
        } else {
          elError.textContent = 'Error: —'
          elError.className = 'stat-error neutral'
        }
      }

      function render(): void {
        draw(canvasCtx, state.circles, canvas.width, canvas.height)
      }

      function addCircles(count: number): void {
        for (let i = 0; i < count && state.circles.length < MAX_CIRCLES; i++) {
          const result = tryPlaceCircle(canvas.width, canvas.height, state.circles)
          if (result.placed && result.circle) {
            state.circles.push(result.circle)
          } else {
            state.rejected++
            // Stop if too many rejections (jamming limit)
            if (state.rejected > 10) break
          }
        }
        render()
        updateStats()
      }

      function tick(): void {
        if (!state.running) return
        if (state.circles.length >= MAX_CIRCLES || state.rejected > 50) {
          state.running = false
          btnStart.textContent = 'Done'
          btnStart.disabled = true
          return
        }
        addCircles(3)
        state.rafId = requestAnimationFrame(tick)
      }

      function start(): void {
        state.running = true
        state.rejected = 0
        btnStart.disabled = true
        btnReset.disabled = false
        btnStart.textContent = 'Running…'
        state.rafId = requestAnimationFrame(tick)
      }

      function reset(): void {
        state.running = false
        if (state.rafId !== null) cancelAnimationFrame(state.rafId)
        state.circles = []
        state.rejected = 0
        render()
        updateStats()
        btnStart.disabled = false
        btnStart.textContent = 'Start'
        btnReset.disabled = true
      }

      // Initial draw
      render()
      updateStats()

      // Event handlers
      btnStart.addEventListener('click', () => {
        if (!state.running && state.circles.length < MAX_CIRCLES) start()
      })

      btnStep.addEventListener('click', () => {
        if (!state.running) {
          addCircles(3)
          btnReset.disabled = false
        }
      })

      btnReset.addEventListener('click', reset)
    },

    cleanup(ctx) {
      ctx.state.running = false
      if (ctx.state.rafId !== null) {
        cancelAnimationFrame(ctx.state.rafId)
        ctx.state.rafId = null
      }
    },
  }
)
