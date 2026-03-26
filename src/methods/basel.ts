import type { Page } from '../router'
import { fmt, queryRequired } from '../utils'
import { C_BG, C_INSIDE, C_AMBER, C_TEXT_MUTED, CANVAS_SIZE, PREVIEW_SIZE } from '../colors'

// ─── Constants ───────────────────────────────────────────────────────────────
const MAX_TERMS = 50

// ─── Preview Renderer ────────────────────────────────────────────────────────
export function drawPreview(ctx: CanvasRenderingContext2D, _time: number): void {
  const s = PREVIEW_SIZE
  ctx.fillStyle = C_BG
  ctx.fillRect(0, 0, s, s)

  let y = s - 10
  ctx.fillStyle = C_INSIDE
  for (let n = 1; n <= 6; n++) {
    const size = Math.sqrt(1 / (n * n)) * (s - 20)
    const x = (s - size) / 2
    ctx.globalAlpha = 1 - n * 0.1
    ctx.fillRect(x, y - size, size, size)
    y -= size + 2
  }
  ctx.globalAlpha = 1

  ctx.fillStyle = C_AMBER
  ctx.font = '11px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('Σ 1/n² = π²/6', s / 2, 15)
}

// ─── State ───────────────────────────────────────────────────────────────────
interface State {
  terms: number
  sum: number
  running: boolean
  intervalId: ReturnType<typeof setInterval> | null
}

// ─── Page Factory ─────────────────────────────────────────────────────────────
export function createBaselPage(): Page {
  const state: State = { terms: 0, sum: 0, running: false, intervalId: null }
  let canvas: HTMLCanvasElement
  let ctx: CanvasRenderingContext2D
  let btnStart: HTMLButtonElement
  let btnStep: HTMLButtonElement
  let btnReset: HTMLButtonElement
  let elEstimate: HTMLElement
  let elTerms: HTMLElement
  let elSum: HTMLElement
  let elError: HTMLElement

  // ── Draw the stacked squares ───────────────────────────────────────────────
  function draw(): void {
    const W = canvas.width
    const H = canvas.height

    ctx.fillStyle = C_BG
    ctx.fillRect(0, 0, W, H)

    // π²/6 reference line (the limit)
    const limit = Math.PI * Math.PI / 6
    const scale = (H - 80) / limit
    const baseY = H - 40

    // Draw reference line at π²/6
    const limitY = baseY - limit * scale
    ctx.strokeStyle = C_AMBER
    ctx.lineWidth = 1
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.moveTo(40, limitY)
    ctx.lineTo(W - 20, limitY)
    ctx.stroke()
    ctx.setLineDash([])

    // Label
    ctx.fillStyle = C_TEXT_MUTED
    ctx.font = '11px "JetBrains Mono", monospace'
    ctx.fillText('π²/6 ≈ 1.6449', W - 110, limitY - 5)

    // Draw stacked squares
    let currentY = baseY
    const barWidth = Math.min(40, (W - 100) / Math.min(state.terms, 20))

    for (let n = 1; n <= state.terms; n++) {
      const term = 1 / (n * n)
      const height = term * scale

      // Color gradient based on term number
      const hue = 200 + (n * 3) % 60
      ctx.fillStyle = `hsl(${hue}, 70%, 55%)`

      // Center the stack
      const stackWidth = Math.min(state.terms, 20) * barWidth
      const startX = (W - stackWidth) / 2
      const x = startX + ((n - 1) % 20) * barWidth

      // Draw the square/rectangle
      ctx.fillRect(x + 1, currentY - height, barWidth - 2, height)

      // If we've filled 20 terms, start new column
      if (n % 20 === 0 && n < state.terms) {
        currentY = baseY
      }
    }

    // Draw cumulative sum as a bar on the right
    if (state.terms > 0) {
      const sumHeight = state.sum * scale
      ctx.fillStyle = C_INSIDE
      ctx.globalAlpha = 0.7
      ctx.fillRect(W - 35, baseY - sumHeight, 20, sumHeight)
      ctx.globalAlpha = 1

      // Outline
      ctx.strokeStyle = C_INSIDE
      ctx.lineWidth = 2
      ctx.strokeRect(W - 35, baseY - sumHeight, 20, sumHeight)
    }

    // Axis
    ctx.strokeStyle = C_TEXT_MUTED
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(40, baseY)
    ctx.lineTo(W - 20, baseY)
    ctx.stroke()

    // Label
    ctx.fillStyle = C_TEXT_MUTED
    ctx.fillText('Terms: 1/n² stacked', 40, baseY + 20)
  }

  // ── Update stats display ────────────────────────────────────────────────────
  function updateStats(): void {
    const piEstimate = Math.sqrt(6 * state.sum)
    const error = Math.abs(piEstimate - Math.PI)

    elEstimate.textContent = fmt(piEstimate)
    elTerms.textContent = state.terms.toLocaleString()
    elSum.textContent = fmt(state.sum)
    elError.textContent = `Error: ${fmt(error)}`
    elError.className = 'stat-error ' + (error < 0.1 ? 'improving' : 'neutral')
  }

  function addTerm(): void {
    state.terms++
    state.sum += 1 / (state.terms * state.terms)
    draw()
    updateStats()
    if (state.terms >= MAX_TERMS) {
      stop()
    }
  }

  function start(): void {
    state.running = true
    btnStart.disabled = true
    btnReset.disabled = false
    btnStart.textContent = 'Running…'
    state.intervalId = setInterval(addTerm, 150)
  }

  function stop(): void {
    state.running = false
    if (state.intervalId !== null) {
      clearInterval(state.intervalId)
      state.intervalId = null
    }
    btnStart.disabled = state.terms >= MAX_TERMS
    btnStart.textContent = state.terms >= MAX_TERMS ? 'Done' : 'Start'
  }

  function reset(): void {
    stop()
    state.terms = 0
    state.sum = 0
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
        <span class="page-index">Method 09</span>
        <h2 class="page-title">Basel Problem</h2>
        <p class="page-subtitle">
          The sum of reciprocal squares converges to π²/6.
        </p>
      </header>

      <div class="viz-layout">
        <div>
          <div class="canvas-wrapper">
            <canvas id="ba-canvas" width="${CANVAS_SIZE}" height="${CANVAS_SIZE}"></canvas>
          </div>
          <div style="margin-top:14px" class="controls">
            <button id="ba-start" class="btn primary">Start</button>
            <button id="ba-step" class="btn">Add Term</button>
            <button id="ba-reset" class="btn" disabled>Reset</button>
          </div>
        </div>

        <div class="stats-panel">
          <div class="stat-card">
            <div class="stat-label">π estimate √(6×sum)</div>
            <div class="stat-value large" id="ba-estimate">—</div>
            <div class="stat-error neutral" id="ba-error">Error: —</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Current sum ∑1/n²</div>
            <div class="stat-value" id="ba-sum">0</div>
            <div class="stat-sub">→ π²/6 ≈ 1.6449</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Terms added</div>
            <div class="stat-value" id="ba-terms">0</div>
            <div class="stat-sub">of ${MAX_TERMS} max</div>
          </div>

          <div class="legend">
            <div class="legend-item">
              <div class="legend-dot" style="background:${C_INSIDE}"></div>
              Cumulative sum
            </div>
            <div class="legend-item">
              <div class="legend-dot" style="background:${C_AMBER}"></div>
              Limit π²/6
            </div>
          </div>

          <div class="explanation">
            <h3>How it works</h3>
            <div class="formula">∑₁^∞ 1/n² = π²/6</div>
            <p>
              Euler proved in 1734 that the sum of reciprocal squares
              equals π²/6. This was a famous open problem known as
              the Basel Problem.
            </p>
            <p>
              Each term 1/n² is visualized as a rectangle. The total
              height of all rectangles approaches π²/6 ≈ 1.6449.
              Therefore π ≈ √(6 × sum).
            </p>
          </div>
        </div>
      </div>
    `

    canvas = queryRequired(page, '#ba-canvas', HTMLCanvasElement)
    btnStart = queryRequired(page, '#ba-start', HTMLButtonElement)
    btnStep = queryRequired(page, '#ba-step', HTMLButtonElement)
    btnReset = queryRequired(page, '#ba-reset', HTMLButtonElement)
    elEstimate = queryRequired(page, '#ba-estimate')
    elTerms = queryRequired(page, '#ba-terms')
    elSum = queryRequired(page, '#ba-sum')
    elError = queryRequired(page, '#ba-error')

    ctx = canvas.getContext('2d')!
    draw()
    updateStats()

    btnStart.addEventListener('click', () => {
      if (!state.running) start()
    })
    btnStep.addEventListener('click', () => {
      if (!state.running) {
        addTerm()
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
