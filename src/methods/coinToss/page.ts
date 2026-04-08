// ─── Coin Toss Page ──────────────────────────────────────────────────────────
// Main page factory for the coin toss method.

import { fmt } from '../../utils'
import { createMethodPageFactory, statCard, explanation } from '../base/page'
import {
  State,
  MAX_SEQUENCES,
  MAX_GRID_COLS,
  MAX_GRID_ROWS,
  createInitialState,
  createEmptySequence,
  advanceSequence,
  estimatePi,
} from './types'
import { draw } from './rendering'

// ─── Page Factory ─────────────────────────────────────────────────────────────
export const createCoinTossPage = createMethodPageFactory<State>(
  {
    title: 'Coin Toss Sequences',
    subtitle: 'Toss coins until heads exceed tails — the ratio reveals π/4.',
    index: '04',
    canvasWidth: 560,
    canvasHeight: 320,
    controls: `
      <button id="ct-start" class="btn primary">Start</button>
      <button id="ct-step" class="btn">Show</button>
      <button id="ct-reset" class="btn" disabled>Reset</button>
    `,
    statsPanel: `
      ${statCard('π estimate', 'ct-estimate', { valueClass: 'stat-value large', errorId: 'ct-error', progressId: 'ct-bar' })}
      ${statCard('Sequences completed', 'ct-sequences', { subtext: `of ${MAX_SEQUENCES.toLocaleString()} max` })}
      ${statCard('Average heads/total ratio', 'ct-avg-ratio')}
      ${explanation(
        'The Coin Toss Method',
        [
          'For each sequence: toss a coin repeatedly until the number of heads exceeds the number of tails. Record the ratio of heads to total tosses.',
          'Surprisingly, this ratio converges to π/4. The expected number of tosses until heads exceed tails is π²/8, but the ratio of heads to total flips approaches π/4.',
          'Press <em>Start</em> to watch sequences build step-by-step, or use <em>Show</em> to add individual sequences instantly.',
        ],
        'π/4 ≈ average(heads/total)'
      )}
    `,
  },
  createInitialState(),
  {
    init(ctx) {
      const canvasCtx = ctx.ctx
      const $required = ctx.$required.bind(ctx)

      const btnStart = $required('#ct-start') as HTMLButtonElement
      const btnStep = $required('#ct-step') as HTMLButtonElement
      const btnReset = $required('#ct-reset') as HTMLButtonElement
      const elEstimate = $required('#ct-estimate')
      const elSequences = $required('#ct-sequences')
      const elAvgRatio = $required('#ct-avg-ratio')
      const elError = $required('#ct-error')
      const elBar = $required('#ct-bar')

      const STEP_FRAME_DELAY = 80

      function updateStats(): void {
        const n = ctx.state.sequences.length
        const pi = estimatePi(ctx.state.sumRatios, n)
        const avgRatio = n > 0 ? ctx.state.sumRatios / n : 0

        elEstimate.textContent = fmt(pi)
        elSequences.textContent = n.toLocaleString()
        elAvgRatio.textContent = fmt(avgRatio)
        elError.textContent = Math.abs(pi - Math.PI).toFixed(6)
        elBar.style.width = `${Math.min((n / MAX_SEQUENCES) * 100, 100)}%`

        draw(canvasCtx, ctx.state)
      }

      function stopAutoAdd(): void {
        ctx.state.autoAdding = false
        if (ctx.state.autoRafId !== null) {
          clearTimeout(ctx.state.autoRafId)
          ctx.state.autoRafId = null
        }
        if (ctx.state.highlightTimeout !== null) {
          clearTimeout(ctx.state.highlightTimeout)
          ctx.state.highlightTimeout = null
        }
        ctx.state.newCoinIndex = null
        btnStep.disabled = false
        btnStep.textContent = 'Show'
        btnStart.disabled = false
        btnStart.textContent = 'Start'
      }

      function animateStep(): void {
        if (!ctx.state.autoAdding) {
          btnStep.disabled = false
          btnStart.disabled = false
          btnStart.textContent = 'Start'
          btnStep.textContent = 'Show'
          return
        }

        if (ctx.state.sequences.length >= MAX_SEQUENCES) {
          stopAutoAdd()
          btnStart.textContent = 'Done'
          btnStart.disabled = true
          return
        }

        if (!ctx.state.currentSequence) {
          ctx.state.currentSequence = createEmptySequence()
        }

        const complete = advanceSequence(ctx.state.currentSequence, MAX_GRID_COLS)
        draw(canvasCtx, ctx.state)

        if (complete) {
          const completed = ctx.state.currentSequence
          if (completed) {
            ctx.state.sequences.push(completed)
            ctx.state.sumRatios += completed.ratio
            ctx.state.sequenceBatch.push(completed)
            if (ctx.state.sequenceBatch.length > MAX_GRID_ROWS) {
              ctx.state.sequenceBatch.shift()
            }
          }
          ctx.state.currentSequence = null
          updateStats()
        }

        ctx.state.autoRafId = setTimeout(() => {
          requestAnimationFrame(animateStep)
        }, STEP_FRAME_DELAY)
      }

      function startShowing(): void {
        if (ctx.state.autoAdding) return
        ctx.state.autoAdding = true
        btnStart.textContent = 'Pause'
        btnStep.disabled = true
        btnReset.disabled = false
        if (!ctx.state.currentSequence) {
          ctx.state.currentSequence = createEmptySequence()
        }
        animateStep()
      }

      function reset(): void {
        stopAutoAdd()
        ctx.state.sequences = []
        ctx.state.sumRatios = 0
        ctx.state.sequenceBatch = []
        ctx.state.currentSequence = null
        ctx.state.autoAdding = false
        ctx.state.autoRafId = null
        ctx.state.newCoinIndex = null
        ctx.state.highlightTimeout = null
        draw(canvasCtx, ctx.state)
        updateStats()
        btnStart.textContent = 'Start'
        btnStart.disabled = false
        btnStep.disabled = false
        btnStep.textContent = 'Show'
        btnReset.disabled = true
      }

      // Initial draw
      draw(canvasCtx, ctx.state)

      // Event handlers
      btnStart.addEventListener('click', () => {
        if (ctx.state.autoAdding) {
          stopAutoAdd()
          return
        }

        if (ctx.state.sequences.length >= MAX_SEQUENCES) {
          reset()
          return
        }

        startShowing()
      })

      btnStep.addEventListener('click', () => {
        if (ctx.state.autoAdding) return

        if (ctx.state.sequences.length >= MAX_SEQUENCES) {
          reset()
          return
        }

        // If there's a pending highlight, finalize it immediately
        if (ctx.state.highlightTimeout) {
          clearTimeout(ctx.state.highlightTimeout)
          ctx.state.highlightTimeout = null
          if (ctx.state.highlightComplete && ctx.state.currentSequence) {
            ctx.state.sequenceBatch.push(ctx.state.currentSequence)
            if (ctx.state.sequenceBatch.length > MAX_GRID_ROWS) {
              ctx.state.sequenceBatch.shift()
            }
            ctx.state.currentSequence = null
          }
          ctx.state.newCoinIndex = null
          ctx.state.highlightComplete = false
          draw(canvasCtx, ctx.state)
        }

        if (!ctx.state.currentSequence) {
          ctx.state.currentSequence = createEmptySequence()
        }

        const prevLength = ctx.state.currentSequence.tosses.length
        const complete = advanceSequence(ctx.state.currentSequence, MAX_GRID_COLS)
        if (ctx.state.currentSequence.tosses.length > prevLength) {
          ctx.state.newCoinIndex = ctx.state.currentSequence.tosses.length - 1
        }
        draw(canvasCtx, ctx.state)

        if (complete) {
          const completed = ctx.state.currentSequence
          ctx.state.sequences.push(completed)
          ctx.state.sumRatios += completed.ratio
          updateStats()
          ctx.state.highlightComplete = true
          // Keep currentSequence for highlight, add to batch after delay
          ctx.state.highlightTimeout = setTimeout(() => {
            ctx.state.highlightTimeout = null
            ctx.state.highlightComplete = false
            ctx.state.newCoinIndex = null
            ctx.state.sequenceBatch.push(completed)
            if (ctx.state.sequenceBatch.length > MAX_GRID_ROWS) {
              ctx.state.sequenceBatch.shift()
            }
            ctx.state.currentSequence = null
            draw(canvasCtx, ctx.state)
          }, 300)
        } else {
          ctx.state.highlightComplete = false
          // Clear highlight after a brief delay
          ctx.state.highlightTimeout = setTimeout(() => {
            ctx.state.highlightTimeout = null
            ctx.state.newCoinIndex = null
            draw(canvasCtx, ctx.state)
          }, 300)
        }

        btnReset.disabled = false
      })

      btnReset.addEventListener('click', reset)
    },

    cleanup(ctx) {
      // Stop any running animations
      ctx.state.autoAdding = false
      if (ctx.state.autoRafId !== null) {
        clearTimeout(ctx.state.autoRafId)
        ctx.state.autoRafId = null
      }
      if (ctx.state.highlightTimeout !== null) {
        clearTimeout(ctx.state.highlightTimeout)
        ctx.state.highlightTimeout = null
      }
    },
  }
)
