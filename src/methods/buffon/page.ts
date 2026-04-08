// ─── Buffon's Needle Page ────────────────────────────────────────────────────
// Main page factory for the Buffon's needle method.

import {
  createMethodPageFactory,
  createFrameAnimation,
  createEasedAnimation,
  Easing,
  cancelAnimations,
  statCard,
  explanation,
} from '../base/page'
import {
  State,
  Needle,
  CANVAS_W,
  CANVAS_H,
  NEEDLE_LENGTH,
  NEEDLES_PER_TICK,
  MAX_NEEDLES,
  createInitialState,
} from './types'
import { estimatePi, doesCross, generateRandomNeedle } from './physics'
import { drawBackground, drawNeedle, drawScene } from './rendering'

// ─── Page Factory ────────────────────────────────────────────────────────────
export const createBuffonPage = createMethodPageFactory<State>(
  {
    title: "Buffon's Needle",
    subtitle: 'A 1777 probability puzzle whose answer is written in π.',
    index: '03',
    canvasWidth: CANVAS_W,
    canvasHeight: CANVAS_H,
    controls: `
      <button class="btn primary" id="btn-start">Start</button>
      <button class="btn" id="btn-step">Drop one</button>
      <button class="btn" id="btn-reset" disabled>Reset</button>
    `,
    statsPanel: `
      ${statCard('π estimate', 'estimate', { valueClass: 'stat-value large', errorId: 'error', progressId: 'progress' })}
      ${statCard('Needles dropped', 'total', { subtext: `of ${MAX_NEEDLES.toLocaleString()} total` })}
      ${statCard('Crossings', 'crosses')}
      ${explanation(
        'How it works',
        [
          `Drop a needle of length <em>l</em> at random onto a surface ruled with parallel lines spaced <em>d</em> apart (here both are ${NEEDLE_LENGTH}px). The probability it crosses a line is:`,
          'Rearranging: π = 2l / (d × P). We estimate P by counting crossings over many throws.',
          'A needle crosses when its perpendicular projection reaches a ruled line — i.e. when ½l·|sin θ| ≥ distance to nearest line.',
          'Use <em>Drop one</em> to watch individual needles fall, or <em>Start</em> to run the full simulation.',
        ],
        'P = 2l / (d × π)'
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
      const elTotal = $id('total', HTMLElement)
      const elCrosses = $id('crosses', HTMLElement)
      const elError = $id('error', HTMLElement)
      const elProgress = $id('progress', HTMLElement)

      function dropNeedle(): void {
        const params = generateRandomNeedle(CANVAS_W, CANVAS_H)
        const crosses = doesCross(params.cy, params.angle)

        const needle: Needle = { cx: params.cx, cy: params.cy, angle: params.angle, crosses }
        state.needles.push(needle)
        state.total++
        if (crosses) state.crosses++

        drawNeedle(ctx2d, needle)
      }

      function updateStats(): void {
        const pi = estimatePi(state.crosses, state.total)
        const err = state.total === 0 ? null : Math.abs(pi - Math.PI)

        elEstimate.textContent = state.total === 0 ? '—' : pi.toFixed(6)
        elTotal.textContent = state.total.toLocaleString()
        elCrosses.textContent = state.crosses.toLocaleString()
        elError.textContent = err === null ? '—' : err.toFixed(6)
        elError.className = 'stat-error ' + (err !== null && err < 0.05 ? 'improving' : 'neutral')
        elProgress.style.width = `${Math.min((state.total / MAX_NEEDLES) * 100, 100)}%`
      }

      // Frame-based animation for continuous dropping
      const continuousAnimation = createFrameAnimation(ctx, {
        update(state, _dt) {
          if (state.total >= MAX_NEEDLES) {
            state.running = false
            return
          }
          const batch = Math.min(NEEDLES_PER_TICK, MAX_NEEDLES - state.total)
          for (let i = 0; i < batch; i++) dropNeedle()
        },
        draw(_ctx) {
          updateStats()
        },
        isRunning: state => state.running,
        onComplete() {
          btnStart.textContent = 'Done'
          btnStart.disabled = true
        },
      })

      // Eased animation for single needle drop
      let dropAnimation: ReturnType<typeof createEasedAnimation> | null = null

      function startNeedleAnimation(): void {
        if (state.animating) return
        const params = generateRandomNeedle(CANVAS_W, CANVAS_H)
        const crosses = doesCross(params.cy, params.angle)
        const initialAngle = Math.random() * Math.PI * 2

        state.currentNeedle = {
          cx: params.cx,
          cy: params.cy - 80,
          angle: initialAngle,
          crosses,
          scale: 3.0,
        }
        state.animationStartY = params.cy - 80
        state.animationEndY = params.cy
        state.initialAngle = initialAngle
        state.finalAngle = params.angle
        state.animating = true

        dropAnimation = createEasedAnimation(ctx, {
          durationMs: 1000,
          easing: Easing.easeInCubic,
          update(state, progress) {
            if (state.currentNeedle) {
              state.currentNeedle.cy =
                state.animationStartY + (state.animationEndY - state.animationStartY) * progress
              state.currentNeedle.scale = 2.0 - (2.0 - 1.0) * progress

              const angleDiff =
                ((state.finalAngle - state.initialAngle + Math.PI * 3) % (Math.PI * 2)) - Math.PI
              state.currentNeedle.angle = state.initialAngle + angleDiff * progress
            }
          },
          draw(_ctx) {
            drawScene(ctx2d, state.needles, state.currentNeedle, state.animating)
          },
          onComplete() {
            if (state.currentNeedle) {
              state.currentNeedle.angle = state.finalAngle
              state.currentNeedle.scale = 1.0
              state.needles.push(state.currentNeedle)
              state.total++
              if (state.currentNeedle.crosses) state.crosses++
            }
            state.animating = false
            state.currentNeedle = null
            drawScene(ctx2d, state.needles, null, false)
            updateStats()
            btnStep.disabled = false
          },
        })
        dropAnimation.start()
      }

      function start(): void {
        state.running = true
        btnStart.disabled = true
        btnStart.textContent = 'Running…'
        btnReset.disabled = false
        btnStep.disabled = false
        continuousAnimation.start()
        state.rafId = continuousAnimation.getFrameId()
      }

      function stop(): void {
        state.running = false
        continuousAnimation.stop()
        state.rafId = null
        btnStart.disabled = false
        btnStart.textContent = 'Resume'
      }

      function reset(): void {
        continuousAnimation.stop()
        dropAnimation?.stop()
        state.running = false
        state.animating = false
        state.rafId = null
        state.currentNeedle = null
        state.needles = []
        state.crosses = 0
        state.total = 0
        drawBackground(ctx2d)
        updateStats()
        btnStart.textContent = 'Start'
        btnStart.disabled = false
        btnStep.disabled = false
        btnReset.disabled = true
      }

      // Initial draw
      drawBackground(ctx2d)

      // Wire up buttons
      btnStart.addEventListener('click', () => {
        if (state.total >= MAX_NEEDLES) return
        if (state.running) {
          stop()
        } else {
          start()
        }
      })

      btnStep.addEventListener('click', () => {
        if (!state.running && !state.animating) {
          startNeedleAnimation()
          btnReset.disabled = false
          btnStep.disabled = true
        }
      })

      btnReset.addEventListener('click', reset)
    },

    cleanup(ctx) {
      cancelAnimations(ctx.state)
      ctx.state.animating = false
    },
  }
)
