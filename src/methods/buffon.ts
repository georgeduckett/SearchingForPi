import type { Page } from '../router'
import { queryRequired } from '../utils'
import { C_BG, C_BORDER, C_TEXT_MUTED, C_AMBER, C_AMBER_BRIGHT, PREVIEW_SIZE } from '../colors'

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

// ─── Preview Renderer ────────────────────────────────────────────────────────
export function drawPreview(ctx: CanvasRenderingContext2D, _time: number): void {
  const s = PREVIEW_SIZE
  ctx.fillStyle = C_BG
  ctx.fillRect(0, 0, s, s)

  ctx.strokeStyle = C_BORDER
  ctx.lineWidth = 1
  for (let y = 20; y < s; y += 25) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(s, y)
    ctx.stroke()
  }

  for (let i = 0; i < 12; i++) {
    const cx = (Math.sin(i * 2.1) * 0.5 + 0.5) * s
    const cy = 10 + (Math.cos(i * 1.7) * 0.5 + 0.5) * (s - 20)
    const angle = (Math.sin(i * 3.3) * 0.5 + 0.5) * Math.PI
    const len = 20
    const dx = (len / 2) * Math.cos(angle)
    const dy = (len / 2) * Math.sin(angle)
    const crosses = Math.floor((cy - 20) / 25) !== Math.floor((cy + dy - 20) / 25) || Math.floor((cy - 20) / 25) !== Math.floor((cy - dy - 20) / 25)
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
export function createBuffonPage(): Page {
  const state: State = {
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
    initialAngle: 0
  }

  let canvas: HTMLCanvasElement
  let ctx: CanvasRenderingContext2D
  let btnStart: HTMLButtonElement
  let btnReset: HTMLButtonElement
  let btnStep: HTMLButtonElement
  let elEstimate: HTMLElement
  let elTotal: HTMLElement
  let elCrosses: HTMLElement
  let elError: HTMLElement
  let elBar: HTMLElement

  // ── Draw ─────────────────────────────────────────────────────────────────
  function drawBackground(): void {
    ctx.fillStyle = C_BG
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

    // Parallel horizontal lines
    ctx.strokeStyle = C_LINE
    ctx.lineWidth = 1
    for (let y = LINE_SPACING; y < CANVAS_H; y += LINE_SPACING) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(CANVAS_W, y)
      ctx.stroke()

      // Subtle distance label
      ctx.fillStyle = C_LINE_LBL
      ctx.font = '10px "JetBrains Mono", monospace'
      ctx.fillText(`d=${LINE_SPACING}`, 6, y - 4)
    }
  }

  function drawNeedle(n: Needle): void {
    const scale = n.scale || 1
    const length = NEEDLE_LENGTH * scale
    const dx = (length / 2) * Math.cos(n.angle)
    const dy = (length / 2) * Math.sin(n.angle)

    ctx.strokeStyle = n.crosses ? C_CROSS : C_NO_CROSS
    ctx.lineWidth = n.crosses ? 1.8 : 1
    ctx.globalAlpha = n.crosses ? 0.85 : 0.45
    ctx.beginPath()
    ctx.moveTo(n.cx - dx, n.cy - dy)
    ctx.lineTo(n.cx + dx, n.cy + dy)
    ctx.stroke()

    // Small dot at centre for crossing needles
    if (n.crosses) {
      ctx.globalAlpha = 1
      ctx.fillStyle = C_CROSS_DOT
      ctx.beginPath()
      ctx.arc(n.cx, n.cy, 2 * scale, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.globalAlpha = 1
  }

  function drawBackground_and_needles(): void {
    drawBackground()
    for (const n of state.needles) drawNeedle(n)
    if (state.animating && state.currentNeedle) {
      drawNeedle(state.currentNeedle)
    }
  }

  // ── Drop a single needle ──────────────────────────────────────────────────
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

  // ── Animate dropping a single needle ──────────────────────────────────────
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
      updateStats()
      btnStep.disabled = false
    }
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  function updateStats(): void {
    const pi = estimatePi(state.crosses, state.total)
    const err = state.total === 0 ? null : Math.abs(pi - Math.PI)

    elEstimate.textContent = state.total === 0 ? '—' : pi.toFixed(6)
    elTotal.textContent = state.total.toLocaleString()
    elCrosses.textContent = state.crosses.toLocaleString()
    elError.textContent = err === null ? '—' : err.toFixed(6)
    elError.className = 'stat-error ' + (err !== null && err < 0.05 ? 'improving' : 'neutral')
    elBar.style.width = `${Math.min((state.total / MAX_NEEDLES) * 100, 100)}%`
  }

  // ── Animation loop ────────────────────────────────────────────────────────
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

  // ── Build DOM ─────────────────────────────────────────────────────────────
  function render(): HTMLElement {
    const page = document.createElement('div')
    page.className = 'page'

    page.innerHTML = `
      <header class="page-header">
        <span class="page-index">Method 03</span>
        <h2 class="page-title">Buffon's Needle</h2>
        <p class="page-subtitle">
          A 1777 probability puzzle whose answer is written in π.
        </p>
      </header>

      <div class="viz-layout">
        <!-- Canvas -->
        <div>
          <div class="canvas-wrapper">
            <canvas id="bf-canvas" width="${CANVAS_W}" height="${CANVAS_H}"></canvas>
          </div>
          <div style="margin-top:14px" class="controls">
            <button id="bf-start" class="btn primary">Start</button>
            <button id="bf-step" class="btn">Drop one</button>
            <button id="bf-reset" class="btn" disabled>Reset</button>
          </div>
        </div>

        <!-- Stats + info -->
        <div class="stats-panel">
          <div class="stat-card">
            <div class="stat-label">π estimate</div>
            <div class="stat-value large" id="bf-estimate">—</div>
            <div class="stat-error neutral" id="bf-error">—</div>
            <div class="progress-bar-wrap">
              <div class="progress-bar-fill" id="bf-bar" style="width:0%"></div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Needles dropped</div>
            <div class="stat-value" id="bf-total">0</div>
            <div class="stat-sub">of ${MAX_NEEDLES.toLocaleString()} total</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Crossings</div>
            <div class="stat-value" id="bf-crosses">0</div>
          </div>

          <div class="explanation">
            <h3>How it works</h3>
            <p>
              Drop a needle of length <em>l</em> at random onto a surface ruled
              with parallel lines spaced <em>d</em> apart (here both are
              ${NEEDLE_LENGTH}px). The probability it crosses a line is:
            </p>
            <div class="formula">P = 2l / (d × π)</div>
            <p>
              Rearranging: π = 2l / (d × P). We estimate P by counting
              crossings over many throws.
            </p>
            <p>
              A needle crosses when its perpendicular projection
              reaches a ruled line — i.e. when
              ½l·|sin θ| ≥ distance to nearest line.
            </p>
            <p>
              Use <em>Drop one</em> to watch individual needles fall,
              or <em>Start</em> to run the full simulation.
            </p>
          </div>
        </div>
      </div>
    `

    canvas = queryRequired(page, '#bf-canvas', HTMLCanvasElement)
    btnStart = queryRequired(page, '#bf-start', HTMLButtonElement)
    btnStep = queryRequired(page, '#bf-step', HTMLButtonElement)
    btnReset = queryRequired(page, '#bf-reset', HTMLButtonElement)
    elEstimate = queryRequired(page, '#bf-estimate')
    elTotal = queryRequired(page, '#bf-total')
    elCrosses = queryRequired(page, '#bf-crosses')
    elError = queryRequired(page, '#bf-error')
    elBar = queryRequired(page, '#bf-bar')

    ctx = canvas.getContext('2d')!
    drawBackground()

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

    return page
  }

  function cleanup(): void {
    state.running = false
    if (state.rafId !== null) cancelAnimationFrame(state.rafId)
    state.animating = false
  }

  return { render, cleanup }
}
