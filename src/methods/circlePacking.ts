import { fmt } from '../utils'
import { C_BG, C_INSIDE, C_TEXT_MUTED, CANVAS_SIZE, PREVIEW_SIZE } from '../colors'
import { clearCanvas } from './base/canvas'
import { createMethodPageFactory, statCard, explanation, legend } from './base/page'

// ─── Constants ───────────────────────────────────────────────────────────────
const MAX_CIRCLES = 500
const MIN_RADIUS = 8
const MAX_RADIUS = 25
const ATTEMPTS_PER_CIRCLE = 100

// ─── Preview Renderer ────────────────────────────────────────────────────────
let previewCircles: { x: number; y: number; r: number }[] = []
let previewCycleStart = -1

export function drawPreview(ctx: CanvasRenderingContext2D, time: number): void {
  const s = PREVIEW_SIZE
  clearCanvas(ctx, s, s)

  const padding = 8
  const minR = 4
  const maxR = 10
  const cycleDuration = 8 // seconds for full animation cycle
  const maxCircles = 20

  // Start new cycle every cycleDuration seconds
  const currentCycle = Math.floor(time / cycleDuration)
  if (currentCycle !== previewCycleStart) {
    previewCycleStart = currentCycle
    previewCircles = []

    // Pre-generate all circles for this cycle
    const tempCircles: { x: number; y: number; r: number }[] = []
    for (let attempt = 0; attempt < 200 && tempCircles.length < maxCircles; attempt++) {
      const r = minR + Math.random() * (maxR - minR)
      const x = padding + r + Math.random() * (s - 2 * padding - 2 * r)
      const y = padding + r + Math.random() * (s - 2 * padding - 2 * r)

      // Check for overlap
      let overlaps = false
      for (const c of tempCircles) {
        const dx = x - c.x
        const dy = y - c.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < r + c.r + 1) {
          overlaps = true
          break
        }
      }

      if (!overlaps) {
        tempCircles.push({ x, y, r })
      }
    }
    previewCircles = tempCircles
  }

  // Calculate how many circles to show based on time in cycle
  const timeInCycle = time % cycleDuration
  const circleAddInterval = cycleDuration / maxCircles
  const circlesToShow = Math.min(
    Math.floor(timeInCycle / circleAddInterval),
    previewCircles.length
  )

  // Draw background
  ctx.fillStyle = C_BG
  ctx.fillRect(0, 0, s, s)

  // Draw circles progressively
  for (let i = 0; i < circlesToShow; i++) {
    const circle = previewCircles[i]
    const timeSinceAdded = timeInCycle - (i + 1) * circleAddInterval
    const fadeInProgress = Math.min(1, timeSinceAdded * 4) // Quick fade over 0.25 seconds

    ctx.fillStyle = C_INSIDE
    ctx.globalAlpha = 0.2 + 0.1 * fadeInProgress
    ctx.beginPath()
    ctx.arc(circle.x, circle.y, circle.r, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = C_INSIDE
    ctx.lineWidth = 1
    ctx.globalAlpha = 0.5 + 0.3 * fadeInProgress
    ctx.stroke()
  }

  ctx.globalAlpha = 1
}

// ─── State ───────────────────────────────────────────────────────────────────
interface Circle {
  x: number
  y: number
  r: number
  color: string
}

interface State {
  circles: Circle[]
  rejected: number
  running: boolean
  rafId: number | null
}

// ─── Page Factory ─────────────────────────────────────────────────────────────
export const createCirclePackingPage = createMethodPageFactory<State>(
  {
    title: 'Circle Packing',
    subtitle: 'The area of circles relates to π through covered area.',
    index: '13',
    canvasWidth: CANVAS_SIZE,
    canvasHeight: CANVAS_SIZE,
    controls: `
      <button id="cp-start" class="btn primary">Start</button>
      <button id="cp-step" class="btn">+3 Circles</button>
      <button id="cp-reset" class="btn" disabled>Reset</button>
    `,
    statsPanel: `
      ${statCard('π estimate', 'cp-estimate', { valueClass: 'stat-value large', errorId: 'cp-error' })}
      ${statCard('Circles placed', 'cp-circles', { subtext: `of ${MAX_CIRCLES} max` })}
      ${statCard('Area coverage', 'cp-covered', { subtext: 'jamming limit ~55%' })}
      ${legend([{ color: C_INSIDE, text: 'Placed circles' }])}
      ${explanation('How it works', [
        'We place circles randomly without overlap (random sequential adsorption). The covered area equals π times the sum of squared radii (for non-overlapping circles).',
        'By measuring the actual covered area and dividing by Σr², we can estimate the value of π.',
        'The maximum packing density (jamming limit) for random circle placement is approximately 54.7%.'
      ], 'Area = π × Σr²')}
    `
  },
  {
    circles: [],
    rejected: 0,
    running: false,
    rafId: null
  },
  {
    init(ctx) {
      const { canvas, ctx: canvasCtx } = ctx
      const $required = ctx.$required.bind(ctx)

      const btnStart = $required('#cp-start') as HTMLButtonElement
      const btnStep = $required('#cp-step') as HTMLButtonElement
      const btnReset = $required('#cp-reset') as HTMLButtonElement
      const elEstimate = $required('#cp-estimate')
      const elCircles = $required('#cp-circles')
      const elCovered = $required('#cp-covered')
      const elError = $required('#cp-error')

      const padding = 20

      // ── Check if circle overlaps with existing circles ───────────────────────────
      function overlaps(x: number, y: number, r: number): boolean {
        for (const c of ctx.state.circles) {
          const dx = x - c.x
          const dy = y - c.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < r + c.r + 2) return true
        }
        return false
      }

      // ── Draw the circle packing ────────────────────────────────────────────────
      function draw(): void {
        const W = canvas.width
        const H = canvas.height

        canvasCtx.fillStyle = C_BG
        canvasCtx.fillRect(0, 0, W, H)

        // Draw bounding square
        canvasCtx.strokeStyle = C_TEXT_MUTED
        canvasCtx.lineWidth = 1
        canvasCtx.strokeRect(padding, padding, W - padding * 2, H - padding * 2)

        // Draw circles
        for (const circle of ctx.state.circles) {
          canvasCtx.fillStyle = circle.color
          canvasCtx.beginPath()
          canvasCtx.arc(circle.x, circle.y, circle.r, 0, Math.PI * 2)
          canvasCtx.fill()

          // Subtle outline
          canvasCtx.strokeStyle = 'rgba(255,255,255,0.2)'
          canvasCtx.lineWidth = 1
          canvasCtx.stroke()
        }
      }

      // ── Estimate π from circle areas ────────────────────────────────────────────
      function estimatePi(): number {
        if (ctx.state.circles.length === 0) return 0

        // Sum of r² for all circles
        const sumRSquared = ctx.state.circles.reduce((sum, c) => sum + c.r * c.r, 0)

        // Calculate actual covered area (accounting for overlap approximation)
        // For non-overlapping circles: covered_area = π × Σr²
        // So π ≈ covered_area / Σr²

        const W = canvas.width - padding * 2
        const H = canvas.height - padding * 2

        // Approximate covered area by counting pixels or using bounding box
        // For simplicity, use Monte Carlo within square
        let coveredPixels = 0
        const samples = 10000
        for (let i = 0; i < samples; i++) {
          const x = padding + Math.random() * W
          const y = padding + Math.random() * H
          for (const c of ctx.state.circles) {
            const dx = x - c.x
            const dy = y - c.y
            if (dx * dx + dy * dy <= c.r * c.r) {
              coveredPixels++
              break
            }
          }
        }

        const coveredFraction = coveredPixels / samples
        const coveredArea = coveredFraction * W * H

        // π = covered_area / Σr² (since covered_area = π × Σr² for non-overlapping)
        return coveredArea / sumRSquared
      }

      // ── Update stats display ────────────────────────────────────────────────────
      function updateStats(): void {
        const piEstimate = estimatePi()
        const error = Math.abs(piEstimate - Math.PI)

        const totalArea = (canvas.width - padding * 2) * (canvas.height - padding * 2)
        let circleArea = 0
        for (const c of ctx.state.circles) {
          circleArea += Math.PI * c.r * c.r
        }
        const coverage = (circleArea / totalArea) * 100

        elEstimate.textContent = ctx.state.circles.length < 5 ? '—' : fmt(piEstimate)
        elCircles.textContent = ctx.state.circles.length.toLocaleString()
        elCovered.textContent = `${coverage.toFixed(1)}%`
        if (ctx.state.circles.length >= 5) {
          elError.textContent = `Error: ${fmt(error)}`
          elError.className = 'stat-error ' + (error < 0.5 ? 'improving' : 'neutral')
        } else {
          elError.textContent = 'Error: —'
          elError.className = 'stat-error neutral'
        }
      }

      // ── Add a circle via random sequential adsorption ─────────────────────────────
      function addCircle(): boolean {
        const W = canvas.width - padding * 2
        const H = canvas.height - padding * 2

        for (let attempt = 0; attempt < ATTEMPTS_PER_CIRCLE; attempt++) {
          const r = MIN_RADIUS + Math.random() * (MAX_RADIUS - MIN_RADIUS)
          const x = padding + r + Math.random() * (W - 2 * r)
          const y = padding + r + Math.random() * (H - 2 * r)

          if (!overlaps(x, y, r)) {
            // Generate color based on radius
            const hue = 200 + ((r - MIN_RADIUS) / (MAX_RADIUS - MIN_RADIUS)) * 40
            ctx.state.circles.push({
              x, y, r,
              color: `hsl(${hue}, 65%, 55%)`
            })
            return true
          }
        }
        return false
      }

      // ── Add multiple circles ────────────────────────────────────────────────────
      function addCircles(count: number): void {
        for (let i = 0; i < count && ctx.state.circles.length < MAX_CIRCLES; i++) {
          if (!addCircle()) {
            ctx.state.rejected++
            // Stop if too many rejections (jamming limit)
            if (ctx.state.rejected > 10) break
          }
        }
        draw()
        updateStats()
      }

      function tick(): void {
        if (!ctx.state.running) return
        if (ctx.state.circles.length >= MAX_CIRCLES || ctx.state.rejected > 50) {
          ctx.state.running = false
          btnStart.textContent = 'Done'
          btnStart.disabled = true
          return
        }
        addCircles(3)
        ctx.state.rafId = requestAnimationFrame(tick)
      }

      function start(): void {
        ctx.state.running = true
        ctx.state.rejected = 0
        btnStart.disabled = true
        btnReset.disabled = false
        btnStart.textContent = 'Running…'
        ctx.state.rafId = requestAnimationFrame(tick)
      }

      function reset(): void {
        ctx.state.running = false
        if (ctx.state.rafId !== null) cancelAnimationFrame(ctx.state.rafId)
        ctx.state.circles = []
        ctx.state.rejected = 0
        draw()
        updateStats()
        btnStart.disabled = false
        btnStart.textContent = 'Start'
        btnReset.disabled = true
      }

      // Initial draw
      draw()
      updateStats()

      // Event handlers
      btnStart.addEventListener('click', () => {
        if (!ctx.state.running && ctx.state.circles.length < MAX_CIRCLES) start()
      })

      btnStep.addEventListener('click', () => {
        if (!ctx.state.running) {
          addCircles(3)
          btnReset.disabled = false
        }
      })

      btnReset.addEventListener('click', reset)
    },

    cleanup(ctx) {
      ctx.state.running = false
      if (ctx.state.rafId !== null) {
        cancelAnimationFrame(ctx.state.rafId)
        ctx.state.rafId = null
      }
    }
  }
)
