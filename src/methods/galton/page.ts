// ─── Galton Board Page ───────────────────────────────────────────────────────
// Main page factory for the Galton board method.

import { fmt } from '../../utils'
import { getInsideColor, getAmberColor, CANVAS_SIZE } from '../../colors'
import { createMethodPageFactory, statCard, legend, explanation } from '../base/page'
import { State, NUM_BINS, MAX_BALLS, createInitialState } from './types'
import { createBall, updateBall, estimatePi } from './physics'
import { draw } from './rendering'

// ─── Colors for UI ───────────────────────────────────────────────────────────
const C_BALL = getInsideColor()

// ─── Page Factory ────────────────────────────────────────────────────────────
export const createGaltonPage = createMethodPageFactory<State>(
  {
    title: 'Galton Board',
    subtitle: "The normal distribution connects to π through Stirling's formula.",
    index: '12',
    canvasWidth: CANVAS_SIZE,
    canvasHeight: CANVAS_SIZE,
    controls: `
      <button class="btn primary" id="btn-start">Auto Drop</button>
      <button class="btn" id="btn-drop">Drop One</button>
      <button class="btn" id="btn-reset" disabled>Reset</button>
    `,
    statsPanel: `
      ${statCard('π estimate', 'estimate', { valueClass: 'stat-value large', errorId: 'error' })}
      ${statCard('Balls dropped', 'dropped', { subtext: `of ${MAX_BALLS} max` })}
      ${statCard('Peak bin count', 'peak')}
      ${legend([
        { color: C_BALL, text: 'Dropped balls' },
        { color: getAmberColor(), text: 'Gaussian reference' },
      ])}
      ${explanation(
        'How it works',
        [
          'The Galton board demonstrates the central limit theorem: balls falling through pegs form a binomial distribution that approaches a Gaussian (normal) distribution.',
          "Stirling's approximation shows factorials relate to π. We estimate π by comparing the peak height to the theoretical Gaussian: peak × √(2πσ²) ≈ total.",
        ],
        'n! ≈ √(2πn)(n/e)ⁿ'
      )}
    `,
  },
  createInitialState(),
  {
    init(ctx) {
      const { ctx: ctx2d, state, $id } = ctx

      // Get element references
      const btnStart = $id('btn-start', HTMLButtonElement)
      const btnDrop = $id('btn-drop', HTMLButtonElement)
      const btnReset = $id('btn-reset', HTMLButtonElement)
      const elEstimate = $id('estimate', HTMLElement)
      const elDropped = $id('dropped', HTMLElement)
      const elPeak = $id('peak', HTMLElement)
      const elError = $id('error', HTMLElement)

      const centerX = CANVAS_SIZE / 2

      // Update stats display
      function updateStats(): void {
        const piEstimate = estimatePi(state)
        const peak = Math.max(...state.bins)
        const error = Math.abs(piEstimate - Math.PI)

        elEstimate.textContent = state.dropped < 10 ? '—' : fmt(piEstimate)
        elDropped.textContent = state.dropped.toLocaleString()
        elPeak.textContent = peak.toLocaleString()
        if (state.dropped >= 10) {
          elError.textContent = `Error: ${fmt(error)}`
          elError.className = 'stat-error ' + (error < 1 ? 'improving' : 'neutral')
        } else {
          elError.textContent = 'Error: —'
          elError.className = 'stat-error neutral'
        }
      }

      // Drop a new ball
      function dropBall(): void {
        state.balls.push(createBall(centerX))
      }

      // Animation tick
      function tick(): void {
        let activeBalls = false

        // Update all active balls
        for (const ball of state.balls) {
          const landedBin = updateBall(ball, CANVAS_SIZE, CANVAS_SIZE)
          if (landedBin !== null) {
            state.bins[landedBin]++
          }
          if (ball.active) {
            activeBalls = true
          }
        }

        // Draw current state
        draw(ctx2d, state)
        updateStats()

        // Auto-drop more balls if running
        if (state.dropping && state.dropped < MAX_BALLS) {
          if (Math.random() < 0.1) {
            dropBall()
            state.dropped++
          }
        }

        // Continue animation or stop
        if (activeBalls || state.dropping) {
          state.rafId = requestAnimationFrame(tick)
        } else {
          state.running = false
          btnStart.textContent = 'Start'
          btnStart.disabled = state.dropped >= MAX_BALLS
        }
      }

      function start(): void {
        state.running = true
        state.dropping = true
        btnStart.disabled = true
        btnReset.disabled = false
        btnStart.textContent = 'Running…'
        state.rafId = requestAnimationFrame(tick)
      }

      function dropOne(): void {
        if (state.dropped >= MAX_BALLS) return
        dropBall()
        state.dropped++
        if (!state.running) {
          state.running = true
          state.dropping = false
          state.rafId = requestAnimationFrame(tick)
        }
        btnReset.disabled = false
      }

      function reset(): void {
        state.running = false
        state.dropping = false
        if (state.rafId !== null) cancelAnimationFrame(state.rafId)
        state.balls = []
        state.bins = Array(NUM_BINS).fill(0)
        state.dropped = 0
        draw(ctx2d, state)
        updateStats()
        btnStart.disabled = false
        btnStart.textContent = 'Start'
        btnReset.disabled = true
      }

      // Initial draw
      draw(ctx2d, state)
      updateStats()

      // Wire up buttons
      btnStart.addEventListener('click', () => {
        if (!state.running && state.dropped < MAX_BALLS) start()
      })
      btnDrop.addEventListener('click', dropOne)
      btnReset.addEventListener('click', reset)
    },

    cleanup(ctx) {
      ctx.state.running = false
      ctx.state.dropping = false
      if (ctx.state.rafId !== null) {
        cancelAnimationFrame(ctx.state.rafId)
        ctx.state.rafId = null
      }
    },
  }
)
