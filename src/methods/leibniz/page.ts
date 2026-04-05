// ─── Leibniz Series Page ─────────────────────────────────────────────────────
// Main page factory for the Leibniz series method.

import { C_INSIDE, C_OUTSIDE, C_AMBER } from '../../colors'
import { createMethodPageFactory, createIntervalAnimation, cancelAnimations, statCard, legend, explanation } from '../base/page'
import { State, CANVAS_W, CANVAS_H, MAX_TERMS, MS_PER_TERM, createInitialState } from './types'
import { leibnizTerm, formatTerm } from './series'
import { draw } from './rendering'

// Method-specific colors for UI
const C_PLUS = C_INSIDE
const C_MINUS = C_OUTSIDE

// ─── Page Factory ────────────────────────────────────────────────────────────
export const createLeibnizPage = createMethodPageFactory<State>(
  {
    title: 'Leibniz Series',
    subtitle: 'An infinite alternating series with an unexpectedly beautiful limit.',
    index: '02',
    canvasWidth: CANVAS_W,
    canvasHeight: CANVAS_H,
    controls: `
      <button class="btn primary" id="btn-start">Start</button>
      <button class="btn" id="btn-step">Step</button>
      <button class="btn" id="btn-reset" disabled>Reset</button>
    `,
    statsPanel: `
      ${statCard('π estimate', 'estimate', { valueClass: 'stat-value large' })}
      <div class="stat-card">
        <div class="stat-label">Error vs true π</div>
        <div class="stat-value" style="font-size:1.4rem" id="error">—</div>
      </div>
      ${statCard('Terms computed', 'terms', { subtext: `of ${MAX_TERMS.toLocaleString()} max` })}
      <div class="stat-card">
        <div class="stat-label">Current term value</div>
        <div class="stat-value" style="font-size:1.1rem; color: var(--text-secondary)" id="current-term">—</div>
      </div>
      ${legend([
        { color: C_PLUS, text: 'Positive term (+1/(2n+1))' },
        { color: C_MINUS, text: 'Negative term (−1/(2n+1))' },
        { color: C_AMBER, text: 'Running π estimate' },
      ])}
      ${explanation('The Leibniz Formula', [
        'Discovered by Leibniz in 1676 (and by Madhava two centuries earlier), each term alternately overshoots and undershoots π/4. The series converges — but slowly. After 500 terms the error is still around 0.002.',
        'Use <em>Step</em> to add one term at a time, or <em>Start</em> to run automatically.',
      ], 'π/4 = 1 − 1/3 + 1/5 − 1/7 + …')}
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
      const elTerms = $id('terms', HTMLElement)
      const elCurrentTerm = $id('current-term', HTMLElement)
      const elError = $id('error', HTMLElement)

      // Create interval animation using the helper
      const animation = createIntervalAnimation(ctx, {
        intervalMs: MS_PER_TERM,
        tick(_ctx) {
          addTerm()
        },
        isRunning: (state) => state.running,
        onComplete() {
          btnStart.disabled = false
          btnStart.textContent = state.termIndex >= MAX_TERMS ? 'Done' : 'Resume'
          if (state.termIndex >= MAX_TERMS) btnStart.disabled = true
        },
      })

      function updateStats(): void {
        const n = state.terms.length
        if (n === 0) {
          elEstimate.textContent = '—'
          elTerms.textContent = '0'
          elCurrentTerm.textContent = '—'
          elError.textContent = '—'
          return
        }
        const pi = state.terms[n - 1]
        elEstimate.textContent = pi.toFixed(8)
        elTerms.textContent = n.toLocaleString()
        const idx = n - 1
        const formatted = formatTerm(idx)
        elCurrentTerm.textContent = `${formatted.sign}1/${formatted.denominator} = ${formatted.sign}${formatted.value.toFixed(6)}`
        elError.textContent = Math.abs(pi - Math.PI).toFixed(8)
      }

      function addTerm(): void {
        const n = state.termIndex
        const prev = state.terms.length > 0 ? state.terms[state.terms.length - 1] : 0
        const newSum = prev + leibnizTerm(n) * 4
        state.terms.push(newSum)
        state.termIndex++
        updateStats()
        draw(ctx2d, state)

        if (state.termIndex >= MAX_TERMS) {
          stop()
        }
      }

      function start(): void {
        state.running = true
        btnStart.disabled = true
        btnStep.disabled = false
        btnReset.disabled = false
        btnStart.textContent = 'Running…'
        animation.start()
        state.intervalId = animation.getIntervalId()
      }

      function stop(): void {
        state.running = false
        animation.stop()
        state.intervalId = null
        btnStart.disabled = false
        btnStart.textContent = state.termIndex >= MAX_TERMS ? 'Done' : 'Resume'
        if (state.termIndex >= MAX_TERMS) btnStart.disabled = true
      }

      function reset(): void {
        stop()
        state.terms = []
        state.termIndex = 0
        draw(ctx2d, state)
        updateStats()
        btnStart.textContent = 'Start'
        btnStart.disabled = false
        btnStep.disabled = false
        btnReset.disabled = true
      }

      // Initial draw
      draw(ctx2d, state)

      // Wire up buttons
      btnStart.addEventListener('click', () => {
        if (!state.running) start()
      })

      btnStep.addEventListener('click', () => {
        if (!state.running) {
          const steps = state.termIndex === 0 ? 2 : 1
          for (let i = 0; i < steps; i++) {
            addTerm()
          }
          btnReset.disabled = false
        }
      })

      btnReset.addEventListener('click', reset)
    },

    cleanup(ctx) {
      cancelAnimations(ctx.state)
    },
  }
)
