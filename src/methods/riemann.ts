import type { Page } from '../router'
import { fmt, queryRequired } from '../utils'
import { C_BG, C_GRID, C_INSIDE, C_AMBER, C_TEXT_MUTED, CANVAS_SIZE } from '../colors'

// ─── Constants ───────────────────────────────────────────────────────────────
const MAX_RECTS = 200

// ─── The function: f(x) = 4/(1+x²), integral from 0 to 1 = π ─────────────────
function f(x: number): number {
  return 4 / (1 + x * x)
}

// ─── State ───────────────────────────────────────────────────────────────────
interface State {
  rects: number
  running: boolean
  intervalId: ReturnType<typeof setInterval> | null
}

// ─── Page Factory ─────────────────────────────────────────────────────────────
export function createRiemannPage(): Page {
  const state: State = { rects: 0, running: false, intervalId: null }
  let canvas: HTMLCanvasElement
  let ctx: CanvasRenderingContext2D
  let btnStart: HTMLButtonElement
  let btnStep: HTMLButtonElement
  let btnReset: HTMLButtonElement
  let elEstimate: HTMLElement
  let elRects: HTMLElement
  let elError: HTMLElement

  // ── Draw the curve and rectangles ──────────────────────────────────────────
  function draw(): void {
    const W = canvas.width
    const H = canvas.height
    const pad = 40
    const plotW = W - pad * 2
    const plotH = H - pad * 2

    ctx.fillStyle = C_BG
    ctx.fillRect(0, 0, W, H)

    // Grid
    ctx.strokeStyle = C_GRID
    ctx.lineWidth = 1
    for (let i = 0; i <= 10; i++) {
      const x = pad + (plotW * i) / 10
      const y = pad + (plotH * i) / 10
      ctx.beginPath(); ctx.moveTo(x, pad); ctx.lineTo(x, H - pad); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - pad, y); ctx.stroke()
    }

    // Draw rectangles (Riemann sum)
    if (state.rects > 0) {
      const n = state.rects
      const dx = 1 / n
      ctx.fillStyle = C_INSIDE
      ctx.globalAlpha = 0.6

      for (let i = 0; i < n; i++) {
        const x0 = i * dx
                const y = f(x0) // left endpoint
        const screenX = pad + (x0 * plotW)
        const screenW = (dx * plotW)
        const screenH = (y / 4) * plotH
        ctx.fillRect(screenX, H - pad - screenH, screenW, screenH)
      }
      ctx.globalAlpha = 1
    }

    // Draw the curve
    ctx.strokeStyle = C_AMBER
    ctx.lineWidth = 2.5
    ctx.beginPath()
    for (let i = 0; i <= plotW; i++) {
      const x = i / plotW
      const y = f(x)
      const screenX = pad + i
      const screenY = H - pad - (y / 4) * plotH
      if (i === 0) ctx.moveTo(screenX, screenY)
      else ctx.lineTo(screenX, screenY)
    }
    ctx.stroke()

    // Axes
    ctx.strokeStyle = C_TEXT_MUTED
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(pad, pad); ctx.lineTo(pad, H - pad); ctx.lineTo(W - pad, H - pad); ctx.stroke()

    // Labels
    ctx.fillStyle = C_TEXT_MUTED
    ctx.font = '12px "JetBrains Mono", monospace'
    ctx.fillText('0', pad - 12, H - pad + 15)
    ctx.fillText('1', W - pad - 5, H - pad + 15)
    ctx.fillText('4', pad - 20, pad + 5)
    ctx.fillText('y = 4/(1+x²)', W - pad - 95, pad + 20)
  }

  // ── Compute Riemann sum ────────────────────────────────────────────────────
  function computeSum(): number {
    if (state.rects === 0) return 0
    const n = state.rects
    const dx = 1 / n
    let sum = 0
    for (let i = 0; i < n; i++) {
      sum += f(i * dx) * dx
    }
    return sum
  }

  // ── Update stats display ────────────────────────────────────────────────────
  function updateStats(): void {
    const estimate = computeSum()
    const error = Math.abs(estimate - Math.PI)

    elEstimate.textContent = fmt(estimate)
    elRects.textContent = state.rects.toLocaleString()
    elError.textContent = `Error: ${fmt(error)}`
    elError.className = 'stat-error ' + (error < 0.01 ? 'improving' : 'neutral')
  }

  function addRects(count: number): void {
    state.rects = Math.min(state.rects + count, MAX_RECTS)
    draw()
    updateStats()
    if (state.rects >= MAX_RECTS) {
      stop()
    }
  }

  function start(): void {
    state.running = true
    btnStart.disabled = true
    btnReset.disabled = false
    btnStart.textContent = 'Running…'
    state.intervalId = setInterval(() => addRects(5), 100)
  }

  function stop(): void {
    state.running = false
    if (state.intervalId !== null) {
      clearInterval(state.intervalId)
      state.intervalId = null
    }
    btnStart.disabled = state.rects >= MAX_RECTS
    btnStart.textContent = state.rects >= MAX_RECTS ? 'Done' : 'Start'
  }

  function reset(): void {
    stop()
    state.rects = 0
    draw()
    updateStats()
    btnStart.disabled = false
    btnStart.textContent = 'Start'
    btnReset.disabled = true
  }

  // ── Build DOM ─────────────────────────────────────────────────────────────
  function render(): HTMLElement {
    const page = document.createElement('div')
    page.className = 'page'

    page.innerHTML = `
      <header class="page-header">
        <span class="page-index">Method 08</span>
        <h2 class="page-title">Riemann Integral</h2>
        <p class="page-subtitle">
          The area under 4/(1+x²) from 0 to 1 equals π.
        </p>
      </header>

      <div class="viz-layout">
        <div>
          <div class="canvas-wrapper">
            <canvas id="ri-canvas" width="${CANVAS_SIZE}" height="${CANVAS_SIZE}"></canvas>
          </div>
          <div style="margin-top:14px" class="controls">
            <button id="ri-start" class="btn primary">Start</button>
            <button id="ri-step" class="btn">+5 Rectangles</button>
            <button id="ri-reset" class="btn" disabled>Reset</button>
          </div>
        </div>

        <div class="stats-panel">
          <div class="stat-card">
            <div class="stat-label">π estimate (integral)</div>
            <div class="stat-value large" id="ri-estimate">—</div>
            <div class="stat-error neutral" id="ri-error">Error: —</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Rectangles</div>
            <div class="stat-value" id="ri-rects">0</div>
            <div class="stat-sub">of ${MAX_RECTS.toLocaleString()} max</div>
          </div>

          <div class="legend">
            <div class="legend-item">
              <div class="legend-dot" style="background:${C_INSIDE}"></div>
              Riemann rectangles
            </div>
            <div class="legend-item">
              <div class="legend-dot" style="background:${C_AMBER}"></div>
              Curve y = 4/(1+x²)
            </div>
          </div>

          <div class="explanation">
            <h3>How it works</h3>
            <div class="formula">∫₀¹ 4/(1+x²) dx = π</div>
            <p>
              The integral of 4/(1+x²) from 0 to 1 equals exactly π.
              This is because the antiderivative is 4·arctan(x), and
              arctan(1) - arctan(0) = π/4.
            </p>
            <p>
              Riemann sums approximate this integral by dividing the
              area into rectangles. As the number of rectangles increases,
              the sum converges to π.
            </p>
          </div>
        </div>
      </div>
    `

    canvas = queryRequired(page, '#ri-canvas', HTMLCanvasElement)
    btnStart = queryRequired(page, '#ri-start', HTMLButtonElement)
    btnStep = queryRequired(page, '#ri-step', HTMLButtonElement)
    btnReset = queryRequired(page, '#ri-reset', HTMLButtonElement)
    elEstimate = queryRequired(page, '#ri-estimate')
    elRects = queryRequired(page, '#ri-rects')
    elError = queryRequired(page, '#ri-error')

    ctx = canvas.getContext('2d')!
    draw()
    updateStats()

    btnStart.addEventListener('click', () => {
      if (!state.running) start()
    })
    btnStep.addEventListener('click', () => {
      if (!state.running) {
        addRects(5)
        btnReset.disabled = false
      }
    })
    btnReset.addEventListener('click', reset)

    return page
  }

  function cleanup(): void {
    if (state.intervalId !== null) clearInterval(state.intervalId)
    state.running = false
  }

  return { render, cleanup }
}
