import { C_BG, C_BORDER, C_TEXT_MUTED, C_AMBER, C_AMBER_BRIGHT, PREVIEW_SIZE } from '../colors'
import { clearCanvas, drawLine } from './base/canvas'
import { createMethodPageFactory, statCard, explanation } from './base/page'

// ─── Constants ───────────────────────────────────────────────────────────────
const CANVAS_W = 560
const CANVAS_H = 420
const LINE_SPACING = 60 // d — distance between parallel lines (px)
const NEEDLE_LENGTH = 60 // l — needle length (px). l === d → short needle case
const NEEDLES_PER_TICK = 8
const MAX_NEEDLES = 5_000

// ─── Colours (method-specific, using shared where applicable) ───────────────
const C_LINE = C_BORDER
const C_LINE_LBL = '#3d4460'
const C_CROSS = C_AMBER
const C_NO_CROSS = C_TEXT_MUTED
const C_CROSS_DOT = C_AMBER_BRIGHT

// ─── Preview Constants ────────────────────────────────────────────────────────
const PREV_LINE_SPACING = 25
const PREV_LINE_START = 20
const PREV_NEEDLE_COUNT = 12
const PREV_NEEDLE_LEN = 20

// ─── Preview Renderer ────────────────────────────────────────────────────────
export function drawPreview(ctx: CanvasRenderingContext2D, _time: number): void {
  const s = PREVIEW_SIZE
  clearCanvas(ctx, s, s)

  // Draw horizontal lines
  for (let y = PREV_LINE_START; y < s; y += PREV_LINE_SPACING) {
    drawLine(ctx, 0, y, s, y, C_BORDER, 1)
  }

  // Draw needles with pseudo-random positions
  for (let i = 0; i < PREV_NEEDLE_COUNT; i++) {
    const cx = (Math.sin(i * 2.1) * 0.5 + 0.5) * s
    const cy = 10 + (Math.cos(i * 1.7) * 0.5 + 0.5) * (s - PREV_LINE_START)
    const angle = (Math.sin(i * 3.3) * 0.5 + 0.5) * Math.PI
    const dx = (PREV_NEEDLE_LEN / 2) * Math.cos(angle)
    const dy = (PREV_NEEDLE_LEN / 2) * Math.sin(angle)
    const crosses = Math.floor((cy - PREV_LINE_START) / PREV_LINE_SPACING) !== Math.floor((cy + dy - PREV_LINE_START) / PREV_LINE_SPACING) || Math.floor((cy - PREV_LINE_START) / PREV_LINE_SPACING) !== Math.floor((cy - dy - PREV_LINE_START) / PREV_LINE_SPACING)
    ctx.strokeStyle = crosses ? C_AMBER : C_TEXT_MUTED
    ctx.lineWidth = crosses ? 1.5 : 1
    ctx.globalAlpha = crosses ? 1 : 0.5
    ctx.beginPath()
    ctx.moveTo(cx - dx, cy - dy)
    ctx.lineTo(cx + dx, cy + dy)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface Needle {
  cx: number
  cy: number
  angle: number
  crosses: boolean
  scale?: number
}

interface State {
  needles: Needle[]
  crosses: number
  total: number
  running: boolean
  rafId: number | null
  animating: boolean
  currentNeedle: Needle | null
  animationStartY: number
  animationEndY: number
  animationStartTime: number
  initialAngle: number
}

// ─── Maths ───────────────────────────────────────────────────────────────────
function estimatePi(crosses: number, total: number): number {
  if (crosses === 0) return 0
  return (2 * NEEDLE_LENGTH * total) / (LINE_SPACING * crosses)
}

function doesCross(cy: number, angle: number): boolean {
  const distToLine = cy % LINE_SPACING
  const nearest = Math.min(distToLine, LINE_SPACING - distToLine)
  const halfProj = (NEEDLE_LENGTH / 2) * Math.abs(Math.sin(angle))
  return halfProj >= nearest
}

// ─── Page Factory ─────────────────────────────────────────────────────────────
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
      ${explanation('How it works', [
        `Drop a needle of length <em>l</em> at random onto a surface ruled with parallel lines spaced <em>d</em> apart (here both are ${NEEDLE_LENGTH}px). The probability it crosses a line is:`,
        'Rearranging: π = 2l / (d × P). We estimate P by counting crossings over many throws.',
        'A needle crosses when its perpendicular projection reaches a ruled line — i.e. when ½l·|sin θ| ≥ distance to nearest line.',
        'Use <em>Drop one</em> to watch individual needles fall, or <em>Start</em> to run the full simulation.',
      ], 'P = 2l / (d × π)')}
    `,
  },
  {
    needles: [],
    crosses: 0,
    total: 0,
    running: false,
    rafId: null,
    animating: false,
    currentNeedle: null,
    animationStartY: 0,
    animationEndY: 0,
    animationStartTime: 0,
    initialAngle: 0,
  },
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

      // Draw functions
      function drawBackground(): void {
        ctx2d.fillStyle = C_BG
        ctx2d.fillRect(0, 0, CANVAS_W, CANVAS_H)

        // Parallel horizontal lines
        ctx2d.strokeStyle = C_LINE
        ctx2d.lineWidth = 1
        for (let y = LINE_SPACING; y < CANVAS_H; y += LINE_SPACING) {
          ctx2d.beginPath()
          ctx2d.moveTo(0, y)
          ctx2d.lineTo(CANVAS_W, y)
          ctx2d.stroke()

          // Subtle distance label
          ctx2d.fillStyle = C_LINE_LBL
          ctx2d.font = '10px "JetBrains Mono", monospace'
          ctx2d.fillText(`d=${LINE_SPACING}`, 6, y - 4)
        }
      }

      function drawNeedle(n: Needle, isAnimating: boolean = false): void {
        const scale = n.scale || 1
        const length = NEEDLE_LENGTH * scale
        const dx = (length / 2) * Math.cos(n.angle)
        const dy = (length / 2) * Math.sin(n.angle)

        const showCrossColor = !isAnimating && n.crosses
        ctx2d.strokeStyle = showCrossColor ? C_CROSS : C_NO_CROSS
        ctx2d.lineWidth = showCrossColor ? 1.8 : 1
        ctx2d.globalAlpha = showCrossColor ? 0.85 : 0.45
        ctx2d.beginPath()
        ctx2d.moveTo(n.cx - dx, n.cy - dy)
        ctx2d.lineTo(n.cx + dx, n.cy + dy)
        ctx2d.stroke()

        if (showCrossColor) {
          ctx2d.globalAlpha = 1
          ctx2d.fillStyle = C_CROSS_DOT
          ctx2d.beginPath()
          ctx2d.arc(n.cx, n.cy, 2 * scale, 0, Math.PI * 2)
          ctx2d.fill()
        }

        ctx2d.globalAlpha = 1
      }

      function drawBackground_and_needles(): void {
        drawBackground()
        for (const n of state.needles) drawNeedle(n)
        if (state.animating && state.currentNeedle) {
          drawNeedle(state.currentNeedle, true)
        }
      }

      function dropNeedle(): void {
        const cx = Math.random() * CANVAS_W
        const cy = Math.random() * CANVAS_H
        const angle = Math.random() * Math.PI
        const crosses = doesCross(cy, angle)

        const needle: Needle = { cx, cy, angle, crosses }
        state.needles.push(needle)
        state.total++
        if (crosses) state.crosses++

        drawNeedle(needle)
      }

      function startNeedleAnimation(): void {
        if (state.animating) return
        const cx = Math.random() * CANVAS_W
        const finalCy = Math.random() * CANVAS_H
        const finalAngle = Math.random() * Math.PI
        const crosses = doesCross(finalCy, finalAngle)
        const initialAngle = Math.random() * Math.PI * 2
        state.currentNeedle = { cx, cy: finalCy - 80, angle: initialAngle, crosses, scale: 3.0 }
        state.animationStartY = finalCy - 80
        state.animationEndY = finalCy
        state.animationStartTime = performance.now()
        state.initialAngle = initialAngle
        state.animating = true
        animateNeedle(finalAngle)
      }

      function animateNeedle(finalAngle: number): void {
        if (!state.animating || !state.currentNeedle) return

        const elapsed = performance.now() - state.animationStartTime
        const duration = 1000
        const progress = Math.min(elapsed / duration, 1)
        const easeProgress = Math.pow(progress, 3)

        state.currentNeedle.cy = state.animationStartY + (state.animationEndY - state.animationStartY) * easeProgress
        state.currentNeedle.scale = 2.0 - (2.0 - 1.0) * easeProgress

        const angleDiff = ((finalAngle - state.initialAngle + Math.PI * 3) % (Math.PI * 2)) - Math.PI
        state.currentNeedle.angle = state.initialAngle + angleDiff * easeProgress

        drawBackground_and_needles()

        if (progress < 1) {
          requestAnimationFrame(() => animateNeedle(finalAngle))
        } else {
          state.currentNeedle.angle = finalAngle
          state.currentNeedle.scale = 1.0
          state.needles.push(state.currentNeedle)
          state.total++
          if (state.currentNeedle.crosses) state.crosses++
          state.animating = false
          state.currentNeedle = null
          drawBackground_and_needles()
          updateStats()
          btnStep.disabled = false
        }
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

      function tick(): void {
        if (!state.running) return
        if (state.total >= MAX_NEEDLES) {
          stop()
          btnStart.textContent = 'Done'
          btnStart.disabled = true
          return
        }
        const batch = Math.min(NEEDLES_PER_TICK, MAX_NEEDLES - state.total)
        for (let i = 0; i < batch; i++) dropNeedle()
        updateStats()
        state.rafId = requestAnimationFrame(tick)
      }

      function start(): void {
        state.running = true
        btnStart.disabled = true
        btnStart.textContent = 'Running…'
        btnReset.disabled = false
        btnStep.disabled = false
        state.rafId = requestAnimationFrame(tick)
      }

      function stop(): void {
        state.running = false
        if (state.rafId !== null) { cancelAnimationFrame(state.rafId); state.rafId = null }
        btnStart.disabled = false
        btnStart.textContent = 'Resume'
      }

      function reset(): void {
        state.running = false
        if (state.rafId !== null) { cancelAnimationFrame(state.rafId); state.rafId = null }
        state.animating = false
        state.currentNeedle = null
        state.needles = []
        state.crosses = 0
        state.total = 0
        drawBackground_and_needles()
        updateStats()
        btnStart.textContent = 'Start'
        btnStart.disabled = false
        btnStep.disabled = false
        btnReset.disabled = true
      }

      // Initial draw
      drawBackground()

      // Wire up buttons
      btnStart.addEventListener('click', () => {
        if (state.total >= MAX_NEEDLES) return
        state.running ? stop() : start()
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
      ctx.state.running = false
      ctx.state.animating = false
      if (ctx.state.rafId !== null) {
        cancelAnimationFrame(ctx.state.rafId)
        ctx.state.rafId = null
      }
    },
  }
)
