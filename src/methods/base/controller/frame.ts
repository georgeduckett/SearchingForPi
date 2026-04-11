// ─── Frame-Based Controller ───────────────────────────────────────────────────
// Creates a requestAnimationFrame-based animation controller with button wiring.

import { createFrameAnimation, type FrameAnimationLoop } from '../animation'
import type { AnimationStateBase, FrameControllerConfig, AnimationController } from './types'

/**
 * Creates a frame-based animation controller with standard button wiring.
 *
 * @example
 * ```ts
 * const controller = createFrameController({
 *   ctx,
 *   buttons: { btnStart, btnStep, btnReset },
 *   update: (state, dt) => { state.progress += dt },
 *   draw: (ctx) => { render(ctx) },
 *   onReset: () => { resetState() },
 *   onStep: () => { addSingleDot() },
 * })
 *
 * // Buttons are automatically wired up
 * // Just call cleanup() in the page's cleanup method
 * ```
 */
export function createFrameController<S extends AnimationStateBase>(
  config: FrameControllerConfig<S>
): AnimationController {
  const { ctx, buttons, update, draw, isComplete, onComplete, onReset, onStep, onStart, onStop } =
    config
  const {
    btnStart,
    btnStep,
    btnReset,
    startLabel = 'Start',
    runningLabel = 'Running…',
    resumeLabel = 'Resume',
    doneLabel = 'Done',
  } = buttons

  let animation: FrameAnimationLoop | null = null

  // Create the animation loop
  animation = createFrameAnimation(ctx, {
    update,
    draw,
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
    if ('rafId' in ctx.state) {
      ctx.state.rafId = animation?.getFrameId() ?? null
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
