import type { Page } from '../router'

// ─── Constants ───────────────────────────────────────────────────────────────
const CANVAS_W      = 560
const CANVAS_H      = 420
const LINE_SPACING  = 60          // d  — distance between parallel lines (px)
const NEEDLE_LENGTH = 60          // l  — needle length (px). l === d → short needle case
const NEEDLES_PER_TICK = 8        // how many needles to drop per animation frame
const MAX_NEEDLES   = 5_000

// ─── Colours ─────────────────────────────────────────────────────────────────
const C_BG        = '#13161f'
const C_LINE      = '#2a2f42'
const C_LINE_LBL  = '#3d4460'
const C_CROSS     = '#c8922a'     // needle crosses a line  → amber
const C_NO_CROSS  = '#4a5068'     // needle does not cross  → muted
const C_CROSS_DOT = '#e8ac42'     // centre dot of crossing needle

// ─── Types ───────────────────────────────────────────────────────────────────
interface Needle {
  cx: number      // centre x
  cy: number      // centre y
  angle: number   // radians
  crosses: boolean
}

interface State {
  needles:  Needle[]
  crosses:  number
  total:    number
  running:  boolean
  rafId:    number | null
}

// ─── Maths ───────────────────────────────────────────────────────────────────
// For the short-needle case (l ≤ d):
//   P(cross) = 2l / (dπ)   →   π = 2l / (d × P)
function estimatePi(crosses: number, total: number): number {
  if (crosses === 0) return 0
  return (2 * NEEDLE_LENGTH * total) / (LINE_SPACING * crosses)
}

function doesCross(cy: number, angle: number): boolean {
  // Distance from needle centre to nearest line
  const distToLine = cy % LINE_SPACING           // cy in [0, LINE_SPACING)
  const nearest    = Math.min(distToLine, LINE_SPACING - distToLine)
  // Half the projected length of the needle perpendicular to the lines
  const halfProj   = (NEEDLE_LENGTH / 2) * Math.abs(Math.sin(angle))
  return halfProj >= nearest
}

// ─── Page Factory ─────────────────────────────────────────────────────────────
export function createBuffonPage(): Page {
  const state: State = { needles: [], crosses: 0, total: 0, running: false, rafId: null }

  let canvas:     HTMLCanvasElement
  let ctx:        CanvasRenderingContext2D
  let btnStart:   HTMLButtonElement
  let btnReset:   HTMLButtonElement
  let btnStep:    HTMLButtonElement
  let elEstimate: HTMLElement
  let elTotal:    HTMLElement
  let elCrosses:  HTMLElement
  let elError:    HTMLElement
  let elBar:      HTMLElement

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
    const dx = (NEEDLE_LENGTH / 2) * Math.cos(n.angle)
    const dy = (NEEDLE_LENGTH / 2) * Math.sin(n.angle)

    ctx.strokeStyle = n.crosses ? C_CROSS : C_NO_CROSS
    ctx.lineWidth   = n.crosses ? 1.8 : 1
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
      ctx.arc(n.cx, n.cy, 2, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.globalAlpha = 1
  }

  function drawBackground_and_needles(): void {
    drawBackground()
    for (const n of state.needles) drawNeedle(n)
  }

  // ── Drop a single needle ──────────────────────────────────────────────────
  function dropNeedle(): void {
    const cx    = Math.random() * CANVAS_W
    const cy    = Math.random() * CANVAS_H
    const angle = Math.random() * Math.PI      // [0, π) — full rotation covered by symmetry
    const crosses = doesCross(cy, angle)

    const needle: Needle = { cx, cy, angle, crosses }
    state.needles.push(needle)
    state.total++
    if (crosses) state.crosses++

    drawNeedle(needle)
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  function updateStats(): void {
    const pi  = estimatePi(state.crosses, state.total)
    const err = state.total === 0 ? null : Math.abs(pi - Math.PI)

    elEstimate.textContent = state.total === 0 ? '—' : pi.toFixed(6)
    elTotal.textContent    = state.total.toLocaleString()
    elCrosses.textContent  = state.crosses.toLocaleString()
    elError.textContent    = err === null ? '—' : err.toFixed(6)
    elError.className      = 'stat-error ' + (err !== null && err < 0.05 ? 'improving' : 'neutral')
    elBar.style.width      = `${Math.min((state.total / MAX_NEEDLES) * 100, 100)}%`
  }

  // ── Animation loop ────────────────────────────────────────────────────────
  function tick(): void {
    if (!state.running) return
    if (state.total >= MAX_NEEDLES) {
      stop()
      btnStart.textContent = 'Done'
      btnStart.disabled    = true
      return
    }
    const batch = Math.min(NEEDLES_PER_TICK, MAX_NEEDLES - state.total)
    for (let i = 0; i < batch; i++) dropNeedle()
    updateStats()
    state.rafId = requestAnimationFrame(tick)
  }

  function start(): void {
    state.running     = true
    btnStart.disabled = true
    btnStart.textContent = 'Running…'
    btnReset.disabled = false
    btnStep.disabled  = false
    state.rafId = requestAnimationFrame(tick)
  }

  function stop(): void {
    state.running = false
    if (state.rafId !== null) { cancelAnimationFrame(state.rafId); state.rafId = null }
    btnStart.disabled    = false
    btnStart.textContent = 'Resume'
  }

  function reset(): void {
    state.running = false
    if (state.rafId !== null) { cancelAnimationFrame(state.rafId); state.rafId = null }
    state.needles = []
    state.crosses = 0
    state.total   = 0
    drawBackground_and_needles()
    updateStats()
    btnStart.textContent = 'Start'
    btnStart.disabled    = false
    btnStep.disabled     = true
    btnReset.disabled    = true
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
            <button id="bf-step"  class="btn" disabled>Drop one</button>
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

          <div class="legend">
            <div class="legend-item">
              <div class="legend-dot" style="background:${C_CROSS}"></div>
              Crosses a line
            </div>
            <div class="legend-item">
              <div class="legend-dot" style="background:${C_NO_CROSS}"></div>
              Does not cross
            </div>
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

    canvas     = page.querySelector<HTMLCanvasElement>('#bf-canvas')!
    btnStart   = page.querySelector<HTMLButtonElement>('#bf-start')!
    btnStep    = page.querySelector<HTMLButtonElement>('#bf-step')!
    btnReset   = page.querySelector<HTMLButtonElement>('#bf-reset')!
    elEstimate = page.querySelector('#bf-estimate')!
    elTotal    = page.querySelector('#bf-total')!
    elCrosses  = page.querySelector('#bf-crosses')!
    elError    = page.querySelector('#bf-error')!
    elBar      = page.querySelector<HTMLElement>('#bf-bar')!

    ctx = canvas.getContext('2d')!
    drawBackground()

    btnStart.addEventListener('click', () => {
      if (state.total >= MAX_NEEDLES) return
      state.running ? stop() : start()
    })

    btnStep.addEventListener('click', () => {
      if (!state.running && state.total < MAX_NEEDLES) {
        dropNeedle()
        updateStats()
        btnReset.disabled = false
        btnStep.disabled  = false
      }
    })

    btnReset.addEventListener('click', reset)

    return page
  }

  function cleanup(): void {
    state.running = false
    if (state.rafId !== null) cancelAnimationFrame(state.rafId)
  }

  return { render, cleanup }
}