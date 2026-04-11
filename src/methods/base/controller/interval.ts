// ─── Interval-Based Controller ────────────────────────────────────────────────
// Creates a setInterval-based animation controller with button wiring.

import { createIntervalAnimation, type IntervalAnimationLoop } from '../animation'
import type { AnimationStateBase, IntervalControllerConfig, AnimationController } from './types'

/**
 * Creates an interval-based animation controller with standard button wiring.
 *
 * @example
 * ```ts
 * const controller = createIntervalController({
 *   ctx,
 *   buttons: { btnStart, btnStep, btnReset },
 *   intervalMs: 40,
 *   tick: (ctx) => { addTerm(ctx.state) },
 *   onReset: () => { resetState() },
 *   onStep: () => { addSingleTerm() },
 * })
 * ```
 */
export function createIntervalController<S extends AnimationStateBase>(
  config: IntervalControllerConfig<S>
): AnimationController {
  const {
    ctx,
    buttons,
    intervalMs,
    tick,
    isComplete,
    onComplete,
    onReset,
    onStep,
    onStart,
    onStop,
  } = config
  const {
    btnStart,
    btnStep,
    btnReset,
    startLabel = 'Start',
    runningLabel = 'Running…',
    resumeLabel = 'Resume',
    doneLabel = 'Done',
  } = buttons

  let animation: IntervalAnimationLoop | null = null

  // Create the animation loop
  animation = createIntervalAnimation(ctx, {
    intervalMs,
    tick,
    isRunning: state => state.running && !isComplete?.(state),
    onComplete: () => {
      btnStart.textContent = doneLabel
      btnStart.disabled = true
      onComplete?.()
    },
  })

  function start(): void {
    if (ctx.state.running) return
    ctx.state.running = true
    btnStart.textContent = runningLabel
    btnStart.disabled = true
    btnReset.disabled = false
    animation?.start()
    if ('intervalId' in ctx.state) {
      ctx.state.intervalId = animation?.getIntervalId() ?? null
    }
    onStart?.()
  }

  function stop(): void {
    if (!ctx.state.running) return
    ctx.state.running = false
    animation?.stop()
    btnStart.textContent = resumeLabel
    btnStart.disabled = false
    onStop?.()
  }

  function toggle(): void {
    if (ctx.state.running) {
      stop()
    } else {
      start()
    }
  }

  function reset(): void {
    animation?.stop()
    ctx.state.running = false
    onReset()
    btnStart.textContent = startLabel
    btnStart.disabled = false
    btnReset.disabled = true
  }

  function step(): void {
    if (ctx.state.running) return
    onStep?.()
  }

  function cleanup(): void {
    animation?.stop()
  }

  // Wire up buttons
  btnStart.addEventListener('click', () => {
    if (isComplete?.(ctx.state)) {
      reset()
      start()
    } else {
      toggle()
    }
  })

  if (btnStep) {
    btnStep.addEventListener('click', () => {
      step()
    })
  }

  btnReset.addEventListener('click', reset)

  return { start, stop, toggle, reset, step, isRunning: () => ctx.state.running, cleanup }
}
