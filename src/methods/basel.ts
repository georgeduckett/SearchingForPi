import { fmt } from '../utils'
import { C_BG, C_INSIDE, C_AMBER, C_TEXT_MUTED, CANVAS_SIZE, PREVIEW_SIZE } from '../colors'
import { clearCanvas } from './base/canvas'
import { createMethodPageFactory, statCard, legend, explanation } from './base/page'

// ─── Constants ───────────────────────────────────────────────────────────────
const MAX_TERMS = 50

// ─── Preview Renderer ────────────────────────────────────────────────────────
export function drawPreview(ctx: CanvasRenderingContext2D, time: number): void {
  const s = PREVIEW_SIZE
  clearCanvas(ctx, s, s)

  const cycleDuration = 6 // seconds for full animation
  const timeInCycle = time % cycleDuration
  const progress = timeInCycle / cycleDuration

  // Number of terms to show (1 to 8)
  const maxTerms = 8
  const termsShown = Math.min(maxTerms, Math.floor(progress * maxTerms) + 1)
  const termProgress = (progress * maxTerms) % 1

  // Calculate scale so all squares fit
  const maxSquareSize = s * 0.5
  const scaleFactor = maxSquareSize / Math.sqrt(1) // 1/1² = 1

  // Animate squares appearing
  let totalHeight = 0
  for (let n = 1; n <= termsShown; n++) {
    const term = 1 / (n * n)
    const size = Math.sqrt(term) * scaleFactor
    totalHeight += size
  }

  // Center vertically
  let y = (s - totalHeight) / 2

  // Draw each square with animation
  for (let n = 1; n <= termsShown; n++) {
    const term = 1 / (n * n)
    const size = Math.sqrt(term) * scaleFactor
    const x = (s - size) / 2

    // Fade in animation for newly added square
    const isNew = n === termsShown
    const alpha = isNew ? Math.min(1, termProgress * 3) : 0.9 - n * 0.05

    // Color gradient: blue to cyan
    const hue = 200 + (n - 1) * 8
    ctx.fillStyle = `hsla(${hue}, 70%, 55%, ${alpha})`

    // Draw the square
    if (isNew && termProgress < 0.3) {
      // Scale in animation for new square
      const scaleIn = Math.min(1, termProgress / 0.3)
      const scaledSize = size * scaleIn
      ctx.fillRect(s / 2 - scaledSize / 2, y + (size - scaledSize), scaledSize, scaledSize)
    } else {
      ctx.fillRect(x, y, size, size)
    }

    y += size
  }

  // Calculate current pi estimate and convergence progress
  let currentSum = 0
  for (let n = 1; n <= termsShown; n++) {
    currentSum += 1 / (n * n)
  }
  const piEstimate = Math.sqrt(6 * currentSum)
  // Progress: how close are we to π? (starts around 2.45 with n=1, converges to π)
  const initialEstimate = Math.sqrt(6) // n=1
  const maxError = Math.abs(initialEstimate - Math.PI)
  const currentError = Math.abs(piEstimate - Math.PI)
  const convergence = Math.max(0, Math.min(1, 1 - currentError / maxError))

  // Draw π progress indicator on the right side
  const cx = s - 22
  const cy = s / 2
  const radius = 16

  // Background circle
  ctx.strokeStyle = C_TEXT_MUTED
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.stroke()

  // Progress arc (fills as we approach π)
  if (termsShown > 0) {
    ctx.strokeStyle = C_AMBER
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + convergence * Math.PI * 2)
    ctx.stroke()
  }

  // π symbol in center
  ctx.fillStyle = termsShown > 0 ? C_AMBER : C_TEXT_MUTED
  ctx.font = 'bold 12px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('π', cx, cy)
  ctx.textBaseline = 'alphabetic'

  // Formula text at top
  ctx.fillStyle = C_AMBER
  ctx.font = '10px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('Σ 1/n² → π²/6', s / 2, 14)

  // Show n=value indicator
  ctx.fillStyle = C_TEXT_MUTED
  ctx.font = '9px monospace'
  ctx.fillText(`n=${termsShown}`, s / 2, s - 6)
}

// ─── State ───────────────────────────────────────────────────────────────────
interface State {
  terms: number
  sum: number
  running: boolean
  intervalId: ReturnType<typeof setInterval> | null
}

// ─── Page Factory ─────────────────────────────────────────────────────────────
export const createBaselPage = createMethodPageFactory<State>(
  {
    title: 'Basel Problem',
    subtitle: 'The sum of reciprocal squares converges to π²/6.',
    index: '09',
    canvasWidth: CANVAS_SIZE,
    canvasHeight: CANVAS_SIZE,
    controls: `
      <button class="btn primary" id="btn-start">Start</button>
      <button class="btn" id="btn-step">Add Term</button>
      <button class="btn" id="btn-reset" disabled>Reset</button>
    `,
    statsPanel: `
      ${statCard('π estimate √(6×sum)', 'estimate', { valueClass: 'stat-value large', errorId: 'error' })}
      ${statCard('Current sum ∑1/n²', 'sum', { subtext: '→ π²/6 ≈ 1.6449' })}
      ${statCard('Terms added', 'terms', { subtext: `of ${MAX_TERMS} max` })}
      ${legend([
        { color: C_INSIDE, text: 'Cumulative sum' },
        { color: C_AMBER, text: 'Limit π²/6' },
      ])}
      ${explanation('How it works', [
        'Euler proved in 1734 that the sum of reciprocal squares equals π²/6. This was a famous open problem known as the Basel Problem.',
        'Each term 1/n² is visualized as a rectangle. The total height of all rectangles approaches π²/6 ≈ 1.6449. Therefore π ≈ √(6 × sum).',
      ], '∑₁^∞ 1/n² = π²/6')}
    `,
  },
  {
    terms: 0,
    sum: 0,
    running: false,
    intervalId: null,
  },
  {
    init(ctx) {
      const { ctx: ctx2d, state, $id } = ctx

      // Get button references
      const btnStart = $id('btn-start', HTMLButtonElement)
      const btnStep = $id('btn-step', HTMLButtonElement)
      const btnReset = $id('btn-reset', HTMLButtonElement)
      const elEstimate = $id('estimate', HTMLElement)
      const elTerms = $id('terms', HTMLElement)
      const elSum = $id('sum', HTMLElement)
      const elError = $id('error', HTMLElement)

      // Draw function
      function draw(): void {
        const W = CANVAS_SIZE
        const H = CANVAS_SIZE

        ctx2d.fillStyle = C_BG
        ctx2d.fillRect(0, 0, W, H)

        // Calculate scale so all squares fit
        const maxSquareSize = Math.min(W, H) * 0.5
        const scaleFactor = maxSquareSize

        // Calculate total height of all squares shown
        let totalHeight = 0
        for (let n = 1; n <= state.terms; n++) {
          const term = 1 / (n * n)
          const size = Math.sqrt(term) * scaleFactor
          totalHeight += size
        }

        // Center vertically
        let y = (H - totalHeight) / 2

        // Draw each square from top to bottom
        for (let n = 1; n <= state.terms; n++) {
          const term = 1 / (n * n)
          const size = Math.sqrt(term) * scaleFactor
          const x = (W - size) / 2

          // Fade effect: older terms slightly faded
          const alpha = 0.9 - (n - 1) * 0.05

          // Color gradient: blue to cyan based on term number
          const hue = 200 + (n - 1) * 8
          ctx2d.fillStyle = `hsla(${hue}, 70%, 55%, ${alpha})`
          ctx2d.fillRect(x, y, size, size)

          y += size
        }

        // Calculate current pi estimate and convergence progress
        const piEstimate = state.terms > 0 ? Math.sqrt(6 * state.sum) : 0
        const initialEstimate = Math.sqrt(6) // n=1
        const maxError = Math.abs(initialEstimate - Math.PI)
        const currentError = state.terms > 0 ? Math.abs(piEstimate - Math.PI) : maxError
        const progress = state.terms > 0 ? Math.max(0, Math.min(1, 1 - currentError / maxError)) : 0

        // Draw π progress indicator on the right side
        const cx = W - 40
        const cy = H / 2
        const radius = 28

        // Background circle
        ctx2d.strokeStyle = C_TEXT_MUTED
        ctx2d.lineWidth = 2
        ctx2d.beginPath()
        ctx2d.arc(cx, cy, radius, 0, Math.PI * 2)
        ctx2d.stroke()

        // Progress arc (fills as we approach π)
        if (state.terms > 0) {
          ctx2d.strokeStyle = C_AMBER
          ctx2d.lineWidth = 4
          ctx2d.beginPath()
          ctx2d.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2)
          ctx2d.stroke()
        }

        // π symbol in center
        ctx2d.fillStyle = state.terms > 0 ? C_AMBER : C_TEXT_MUTED
        ctx2d.font = 'bold 20px "JetBrains Mono", monospace'
        ctx2d.textAlign = 'center'
        ctx2d.textBaseline = 'middle'
        ctx2d.fillText('π', cx, cy)
        ctx2d.textBaseline = 'alphabetic'

        // Formula text at top
        ctx2d.fillStyle = C_AMBER
        ctx2d.font = '12px "JetBrains Mono", monospace'
        ctx2d.textAlign = 'center'
        ctx2d.fillText('Σ 1/n² → π²/6', W / 2, 20)

        // Show n=value indicator at bottom
        if (state.terms > 0) {
          ctx2d.fillStyle = C_TEXT_MUTED
          ctx2d.font = '11px "JetBrains Mono", monospace'
          ctx2d.fillText(`n=${state.terms}`, W / 2, H - 10)
        }
      }

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

      // Initial draw
      draw()
      updateStats()

      // Wire up buttons
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
    },

    cleanup(ctx) {
      if (ctx.state.intervalId !== null) {
        clearInterval(ctx.state.intervalId)
        ctx.state.intervalId = null
      }
      ctx.state.running = false
    },
  }
)
