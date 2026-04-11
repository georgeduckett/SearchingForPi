// ─── Buffon's Needle Controller ───────────────────────────────────────────────
// Animation control logic for the Buffon's needle method.
// Extracted from page.ts for better separation of concerns.

import type { MethodPageContext } from '../base/page/types'
import { createFrameAnimation, createEasedAnimation, Easing, cancelAnimations } from '../base/page'
import { createStatsUpdater as buildStatsUpdater } from '../base/statsHelpers'
import { State, Needle, CANVAS_W, CANVAS_H, NEEDLES_PER_TICK, MAX_NEEDLES } from './types'
import { estimatePi, doesCross, generateRandomNeedle } from './physics'
import { drawBackground, drawNeedle, drawScene } from './rendering'

// ─── Stats Element References ──────────────────────────────────────────────────

export interface StatsElements {
  estimate: HTMLElement
  total: HTMLElement
  crosses: HTMLElement
  error: HTMLElement
  progress: HTMLElement
}

// ─── Stats Management ──────────────────────────────────────────────────────────

/**
 * Creates a stats updater function for Buffon method.
 */
export function createStatsUpdater(elements: StatsElements, state: State): () => void {
  return buildStatsUpdater()
    .custom(() => {
      // Handle empty state display
      if (state.total === 0) {
        elements.estimate.textContent = '—'
        elements.error.textContent = '—'
        elements.progress.style.width = '0%'
        return
      }
    })
    .piEstimate(elements.estimate, () => estimatePi(state.crosses, state.total), {
      improvingThreshold: 0.05,
      decimals: 6,
    })
    .counter(elements.total, () => state.total)
    .counter(elements.crosses, () => state.crosses)
    .error(elements.error, () => Math.abs(estimatePi(state.crosses, state.total) - Math.PI), {
      threshold: 0.05,
      decimals: 6,
    })
    .progress(elements.progress, () => state.total, MAX_NEEDLES)
    .build()
}

// ─── Controller Factory ────────────────────────────────────────────────────────

/**
 * Creates the full animation controller for Buffon method.
 * This wires up all buttons and manages the animation lifecycle.
 */
export function createBuffonController(
  ctx: MethodPageContext<State>,
  elements: StatsElements
): {
  start: () => void
  stop: () => void
  reset: () => void
  dropOne: () => void
  cleanup: () => void
} {
  const { ctx: ctx2d, state, $id } = ctx

  // Get button references
  const btnStart = $id('btn-start', HTMLButtonElement)
  const btnStep = $id('btn-step', HTMLButtonElement)
  const btnReset = $id('btn-reset', HTMLButtonElement)

  // Create stats updater
  const updateStats = createStatsUpdater(elements, state)

  // Drop a single needle
  function dropNeedle(): void {
    const params = generateRandomNeedle(CANVAS_W, CANVAS_H)
    const crosses = doesCross(params.cy, params.angle)

    const needle: Needle = { cx: params.cx, cy: params.cy, angle: params.angle, crosses }
    state.needles.push(needle)
    state.total++
    if (crosses) state.crosses++

    drawNeedle(ctx2d, needle)
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

  return {
    start,
    stop,
    reset,
    dropOne: () => {
      if (!state.running && !state.animating) {
        startNeedleAnimation()
        btnReset.disabled = false
      }
    },
    cleanup: () => {
      cancelAnimations(state)
      state.animating = false
    },
  }
}
