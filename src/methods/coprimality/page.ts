// ─── Coprimality Page ────────────────────────────────────────────────────────
// Main page factory for the coprimality method.

import { fmt, isCoprime } from '../../utils'
import { CANVAS_SIZE } from '../../colors'
import { createMethodPageFactory, statCard, legend, explanation } from '../base/page'
import {
  State,
  MAX_PAIRS,
  PAIRS_PER_TICK,
  C_COPRIME,
  C_NOT_COPRIME,
  createInitialState,
  estimatePi,
} from './types'
import { draw } from './rendering'

// ─── Page Factory ─────────────────────────────────────────────────────────────
export const createCoprimalityPage = createMethodPageFactory<State>(
  {
    title: 'Coprimality',
    subtitle: 'Two random numbers are coprime with probability 6/π².',
    index: '11',
    canvasWidth: CANVAS_SIZE,
    canvasHeight: CANVAS_SIZE,
    controls: `
      <button class="btn primary" id="btn-start">Start</button>
      <button class="btn" id="btn-step">+20 Pairs</button>
      <button class="btn" id="btn-reset" disabled>Reset</button>
    `,
    statsPanel: `
      ${statCard('π estimate √(6/P)', 'estimate', { valueClass: 'stat-value large', errorId: 'error' })}
      ${statCard('Pairs tested', 'pairs', { subtext: `of ${MAX_PAIRS.toLocaleString()} max` })}
      ${statCard('Coprime pairs', 'coprime', { subtext: '→ ~60.8% expected' })}
      ${legend([
        { color: C_COPRIME, text: 'Coprime (GCD = 1)' },
        { color: C_NOT_COPRIME, text: 'Not coprime (GCD > 1)' },
      ])}
      ${explanation(
        'How it works',
        [
          'Two random positive integers are coprime (share no common factors other than 1) with probability 6/π².',
          'By generating many random pairs and counting coprimes, we can estimate π: π ≈ √(6 / P(coprime)).',
          "The grid visualizes pairs by their values modulo 50, coloring each by whether they're coprime.",
        ],
        'P(coprime) = 6/π² ≈ 0.6079'
      )}
    `,
  },
  createInitialState(),
  {
    init(ctx) {
      const { ctx: ctx2d, state, $id } = ctx

      // Get button references
      const btnStart = $id('btn-start', HTMLButtonElement)
      const btnStep = $id('btn-step', HTMLButtonElement)
      const btnReset = $id('btn-reset', HTMLButtonElement)
      const elEstimate = $id('estimate', HTMLElement)
      const elPairs = $id('pairs', HTMLElement)
      const elCoprime = $id('coprime', HTMLElement)
      const elError = $id('error', HTMLElement)

      function updateStats(): void {
        const piEstimate = estimatePi(state.coprimeCount, state.totalPairs)
        const error = Math.abs(piEstimate - Math.PI)

        elEstimate.textContent = state.totalPairs === 0 ? '—' : fmt(piEstimate)
        elPairs.textContent = state.totalPairs.toLocaleString()
        elCoprime.textContent = state.coprimeCount.toLocaleString()
        elError.textContent = state.totalPairs === 0 ? 'Error: —' : `Error: ${fmt(error)}`
        elError.className =
          'stat-error ' +
          (error < 0.1 || state.totalPairs < 100
            ? 'neutral'
            : error < 0.5
              ? 'improving'
              : 'neutral')
      }

      // Generate random pairs
      function generatePairs(count: number): void {
        for (let i = 0; i < count && state.totalPairs < MAX_PAIRS; i++) {
          const a = Math.floor(Math.random() * 10000) + 1
          const b = Math.floor(Math.random() * 10000) + 1
          const coprime = isCoprime(a, b)
          state.pairs.push({ a, b, coprime })
          if (coprime) state.coprimeCount++
          state.totalPairs++
        }
        draw(ctx2d, state)
        updateStats()
      }

      function tick(): void {
        if (!state.running) return
        if (state.totalPairs >= MAX_PAIRS) {
          state.running = false
          btnStart.textContent = 'Done'
          btnStart.disabled = true
          return
        }
        generatePairs(PAIRS_PER_TICK)
        state.rafId = requestAnimationFrame(tick)
      }

      function start(): void {
        state.running = true
        btnStart.disabled = true
        btnReset.disabled = false
        btnStart.textContent = 'Running…'
        state.rafId = requestAnimationFrame(tick)
      }

      function reset(): void {
        state.running = false
        if (state.rafId !== null) cancelAnimationFrame(state.rafId)
        state.pairs = []
        state.coprimeCount = 0
        state.totalPairs = 0
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
        if (!state.running && state.totalPairs < MAX_PAIRS) start()
      })

      btnStep.addEventListener('click', () => {
        if (!state.running) {
          generatePairs(PAIRS_PER_TICK)
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
