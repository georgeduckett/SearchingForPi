import { fmt } from '../utils'
import { C_BG, C_INSIDE, C_AMBER, C_BORDER, CANVAS_SIZE, PREVIEW_SIZE } from '../colors'
import { createMethodPageFactory, statCard, explanation, legend } from './base/page'

// ─── Constants ───────────────────────────────────────────────────────────────
const MAX_PARTICLES = 200
const PARTICLE_RADIUS = 4
const TICKS_PER_FRAME = 2

// ─── Colors ──────────────────────────────────────────────────────────────────
const C_PARTICLE = C_INSIDE
const C_WALL = C_AMBER

// ─── Preview State ────────────────────────────────────────────────────────────
interface PreviewParticle {
  x: number
  y: number
  vx: number
  vy: number
}

const previewParticles: PreviewParticle[] = []
let previewInitialized = false

function initPreviewParticles(): void {
  if (previewInitialized) return
  previewInitialized = true

  const s = PREVIEW_SIZE
  const margin = 15
  const radius = 4

  for (let i = 0; i < 12; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 1 + Math.random() * 1.5
    previewParticles.push({
      x: margin + radius + Math.random() * (s - margin * 2 - radius * 2),
      y: margin + radius + Math.random() * (s - margin * 2 - radius * 2),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed
    })
  }
}

// ─── Preview Renderer ────────────────────────────────────────────────────────
export function drawPreview(ctx: CanvasRenderingContext2D, _time: number): void {
  initPreviewParticles()

  const s = PREVIEW_SIZE
  const margin = 5
  const radius = 4
  const innerMargin = margin + radius

  ctx.fillStyle = C_BG
  ctx.fillRect(0, 0, s, s)

  ctx.strokeStyle = C_BORDER
  ctx.lineWidth = 1
  ctx.strokeRect(margin, margin, s - margin * 2, s - margin * 2)

  // Update and draw particles with physics
  for (const p of previewParticles) {
    // Update position
    p.x += p.vx
    p.y += p.vy

    // Bounce off walls (elastic collision)
    if (p.x < innerMargin) {
      p.x = innerMargin
      p.vx = Math.abs(p.vx)
    } else if (p.x > s - innerMargin) {
      p.x = s - innerMargin
      p.vx = -Math.abs(p.vx)
    }
    if (p.y < innerMargin) {
      p.y = innerMargin
      p.vy = Math.abs(p.vy)
    } else if (p.y > s - innerMargin) {
      p.y = s - innerMargin
      p.vy = -Math.abs(p.vy)
    }

    // Draw particle with velocity-based coloring (same as main simulation)
    const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
    const maxSpeed = 3
    const normalizedSpeed = Math.min(speed / maxSpeed, 1)
    const hue = 200 - normalizedSpeed * 60
    ctx.fillStyle = `hsl(${hue}, 70%, 55%)`

    ctx.beginPath()
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2)
    ctx.fill()
  }
}

// ─── State ───────────────────────────────────────────────────────────────────
interface Particle {
  x: number
  y: number
  vx: number
  vy: number
}

interface State {
  particles: Particle[]
  temperature: number
  running: boolean
  rafId: number | null
  steps: number
}

// ─── Page Factory ─────────────────────────────────────────────────────────────
export const createGasMoleculesPage = createMethodPageFactory<State>(
  {
    title: 'Gas Molecules',
    subtitle: 'Maxwell-Boltzmann speed distribution relates to π.',
    index: '14',
    canvasWidth: CANVAS_SIZE,
    canvasHeight: CANVAS_SIZE,
    controls: `
      <button id="gm-start" class="btn primary">Start</button>
      <button id="gm-add" class="btn">+10 Particles</button>
      <button id="gm-reset" class="btn" disabled>Reset</button>
      <label style="margin-left:10px; color:var(--text-secondary)">
        Temp:
        <input type="range" id="gm-temp" min="0.2" max="3" step="0.1" value="1" style="width:80px; vertical-align:middle">
        <span id="gm-temp-val">1.0</span>
      </label>
    `,
    statsPanel: `
      ${statCard('π estimate 2<v>²/T', 'gm-estimate', { valueClass: 'stat-value large', errorId: 'gm-error' })}
      ${statCard('Particles', 'gm-particles', { subtext: `of ${MAX_PARTICLES} max` })}
      ${statCard('Average speed <v>', 'gm-avg-speed')}
      ${legend([
        { color: C_PARTICLE, text: 'Gas particles' },
        { color: C_AMBER, text: 'Maxwell-Boltzmann curve' }
      ])}
      ${explanation('How it works', [
        'In an ideal gas, the Maxwell-Boltzmann speed distribution gives the mean speed as √(πT/2) in normalized units.',
        'By simulating particles and measuring their average speed, we can estimate π: π = 2<v>²/T, where T is temperature.',
        'The histogram shows the actual speed distribution compared to the theoretical Maxwell-Boltzmann curve.'
      ], '<v> = √(πT/2)')}
    `
  },
  {
    particles: [],
    temperature: 1,
    running: false,
    rafId: null,
    steps: 0
  },
  {
    init(ctx) {
      const { canvas, ctx: canvasCtx } = ctx
      const $required = ctx.$required.bind(ctx)

      const btnStart = $required('#gm-start') as HTMLButtonElement
      const btnAdd = $required('#gm-add') as HTMLButtonElement
      const btnReset = $required('#gm-reset') as HTMLButtonElement
      const tempSlider = $required('#gm-temp') as HTMLInputElement
      const elEstimate = $required('#gm-estimate')
      const elParticles = $required('#gm-particles')
      const elAvgSpeed = $required('#gm-avg-speed')
      const elError = $required('#gm-error')
      const tempVal = $required('#gm-temp-val')

      const containerPad = 30

      // ─── Gaussian random number using Box-Muller transform ───────────────────────
      function gaussianRandom(): number {
        const u1 = Math.random()
        const u2 = Math.random()
        return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
      }

      // ── Draw the container and particles ────────────────────────────────────────
      function draw(): void {
        const W = canvas.width
        const H = canvas.height

        canvasCtx.fillStyle = C_BG
        canvasCtx.fillRect(0, 0, W, H)

        // Draw container
        canvasCtx.strokeStyle = C_WALL
        canvasCtx.lineWidth = 3
        canvasCtx.strokeRect(containerPad, containerPad, W - containerPad * 2, H - containerPad * 2)

        // Draw particles with velocity-based color
        for (const p of ctx.state.particles) {
          const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
          const maxSpeed = 5 * Math.sqrt(ctx.state.temperature)
          const normalizedSpeed = Math.min(speed / maxSpeed, 1)

          // Color from cool (slow) to hot (fast)
          const hue = 200 - normalizedSpeed * 60 // Blue to purple/red
          canvasCtx.fillStyle = `hsl(${hue}, 70%, 55%)`

          canvasCtx.beginPath()
          canvasCtx.arc(p.x, p.y, PARTICLE_RADIUS, 0, Math.PI * 2)
          canvasCtx.fill()
        }

        // Draw histogram of speeds
        drawHistogram()
      }

      // ── Draw speed histogram ────────────────────────────────────────────────────
      function drawHistogram(): void {
        if (ctx.state.particles.length < 5) return

        const W = canvas.width
        const histH = 60
        const histY = canvas.height - 70
        const histX = containerPad

        // Calculate speeds
        const speeds = ctx.state.particles.map(p =>
          Math.sqrt(p.vx * p.vx + p.vy * p.vy)
        )

        // Create histogram bins
        const maxSpeed = Math.max(...speeds, 5)
        const numBins = 20
        const binWidth = maxSpeed / numBins
        const bins = Array(numBins).fill(0)

        for (const s of speeds) {
          const bin = Math.min(Math.floor(s / binWidth), numBins - 1)
          bins[bin]++
        }

        const maxBin = Math.max(...bins, 1)
        const barWidth = (W - containerPad * 2) / numBins

        // Draw histogram bars
        canvasCtx.fillStyle = C_PARTICLE
        canvasCtx.globalAlpha = 0.5
        for (let i = 0; i < numBins; i++) {
          const h = (bins[i] / maxBin) * histH
          canvasCtx.fillRect(histX + i * barWidth, histY + histH - h, barWidth - 1, h)
        }
        canvasCtx.globalAlpha = 1

        // Draw Maxwell-Boltzmann reference
        canvasCtx.strokeStyle = C_AMBER
        canvasCtx.lineWidth = 2
        canvasCtx.beginPath()

        for (let i = 0; i <= numBins; i++) {
          const v = (i / numBins) * maxSpeed
          // 2D Maxwell-Boltzmann: f(v) = (v/T) * exp(-v²/(2T)) for normalized distribution
          const fv = (v / ctx.state.temperature) * Math.exp(-v * v / (2 * ctx.state.temperature))
          const maxFv = 1 / (ctx.state.temperature * Math.sqrt(Math.E)) // Peak value
          const normalizedFv = fv / maxFv
          const y = histY + histH - normalizedFv * histH
          const x = histX + i * barWidth

          if (i === 0) canvasCtx.moveTo(x, y)
          else canvasCtx.lineTo(x, y)
        }
        canvasCtx.stroke()
      }

      // ── Estimate π from Maxwell-Boltzmann speed distribution ─────────────────────
      function estimatePi(): number {
        if (ctx.state.particles.length < 10) return 0

        // Calculate mean speed
        let avgSpeed = 0
        for (const p of ctx.state.particles) {
          avgSpeed += Math.sqrt(p.vx * p.vx + p.vy * p.vy)
        }
        avgSpeed /= ctx.state.particles.length

        // For 2D Maxwell-Boltzmann: <v> = √(πT/2)
        // So: π = 2<v>²/T
        const piEstimate = (2 * avgSpeed * avgSpeed) / ctx.state.temperature

        return piEstimate
      }

      // ── Update stats display ────────────────────────────────────────────────────
      function updateStats(): void {
        const piEstimate = estimatePi()
        const error = Math.abs(piEstimate - Math.PI)

        let avgSpeed = 0
        for (const p of ctx.state.particles) {
          avgSpeed += Math.sqrt(p.vx * p.vx + p.vy * p.vy)
        }
        avgSpeed /= ctx.state.particles.length || 1

        elEstimate.textContent = ctx.state.particles.length < 10 ? '—' : fmt(piEstimate)
        elParticles.textContent = ctx.state.particles.length.toLocaleString()
        elAvgSpeed.textContent = avgSpeed.toFixed(2)

        if (ctx.state.particles.length >= 10) {
          elError.textContent = `Error: ${fmt(error)}`
          elError.className = 'stat-error ' + (error < 0.5 ? 'improving' : 'neutral')
        } else {
          elError.textContent = 'Error: —'
          elError.className = 'stat-error neutral'
        }
      }

      // ── Add a particle with random velocity based on temperature ──────────────────
      function addParticle(): void {
        const W = canvas.width - containerPad * 2 - PARTICLE_RADIUS * 2
        const H = canvas.height - containerPad * 2 - PARTICLE_RADIUS * 2

        // Maxwell-Boltzmann uses Gaussian velocity components
        const sigma = Math.sqrt(ctx.state.temperature)
        const vx = gaussianRandom() * sigma
        const vy = gaussianRandom() * sigma

        ctx.state.particles.push({
          x: containerPad + PARTICLE_RADIUS + Math.random() * W,
          y: containerPad + PARTICLE_RADIUS + Math.random() * H,
          vx, vy
        })
      }

      // ── Physics simulation step ─────────────────────────────────────────────────
      function physicsStep(): void {
        const minX = containerPad + PARTICLE_RADIUS
        const maxX = canvas.width - containerPad - PARTICLE_RADIUS
        const minY = containerPad + PARTICLE_RADIUS
        const maxY = canvas.height - containerPad - PARTICLE_RADIUS

        // Velocity scaling for thermalization
        const targetSigma = Math.sqrt(ctx.state.temperature)

        for (const p of ctx.state.particles) {
          // Update position
          p.x += p.vx
          p.y += p.vy

          // Wall collisions (elastic)
          if (p.x < minX) { p.x = minX; p.vx = Math.abs(p.vx) }
          if (p.x > maxX) { p.x = maxX; p.vx = -Math.abs(p.vx) }
          if (p.y < minY) { p.y = minY; p.vy = Math.abs(p.vy) }
          if (p.y > maxY) { p.y = maxY; p.vy = -Math.abs(p.vy) }

          // Gentle thermalization toward temperature
          if (ctx.state.steps % 10 === 0) {
            const currentSigma = Math.sqrt((p.vx * p.vx + p.vy * p.vy) / 2)
            const scale = 0.99 + 0.01 * (targetSigma / (currentSigma + 0.1))
            p.vx *= scale
            p.vy *= scale
          }
        }

        // Particle-particle collisions (simplified)
        for (let i = 0; i < ctx.state.particles.length; i++) {
          for (let j = i + 1; j < ctx.state.particles.length; j++) {
            const p1 = ctx.state.particles[i]
            const p2 = ctx.state.particles[j]
            const dx = p2.x - p1.x
            const dy = p2.y - p1.y
            const dist = Math.sqrt(dx * dx + dy * dy)

            if (dist < PARTICLE_RADIUS * 2 + 1) {
              // Elastic collision
              const dvx = p1.vx - p2.vx
              const dvy = p1.vy - p2.vy
              const dvDotDr = dvx * dx + dvy * dy

              if (dvDotDr > 0) { // Approaching
                const scale = dvDotDr / (dist * dist)
                p1.vx -= scale * dx
                p1.vy -= scale * dy
                p2.vx += scale * dx
                p2.vy += scale * dy
              }
            }
          }
        }

        ctx.state.steps++
      }

      // ── Animation tick ───────────────────────────────────────────────────────────
      function tick(): void {
        if (!ctx.state.running) return

        for (let i = 0; i < TICKS_PER_FRAME; i++) {
          physicsStep()
        }

        draw()
        updateStats()
        ctx.state.rafId = requestAnimationFrame(tick)
      }

      function start(): void {
        if (ctx.state.particles.length === 0) {
          addParticles(50)
        }
        ctx.state.running = true
        btnStart.disabled = true
        btnReset.disabled = false
        btnStart.textContent = 'Running…'
        ctx.state.rafId = requestAnimationFrame(tick)
      }

      function addParticles(count: number): void {
        for (let i = 0; i < count && ctx.state.particles.length < MAX_PARTICLES; i++) {
          addParticle()
        }
        draw()
        updateStats()
      }

      function reset(): void {
        ctx.state.running = false
        if (ctx.state.rafId !== null) cancelAnimationFrame(ctx.state.rafId)
        ctx.state.particles = []
        ctx.state.steps = 0
        draw()
        updateStats()
        btnStart.disabled = false
        btnStart.textContent = 'Start'
        btnReset.disabled = true
      }

      function updateTemperature(): void {
        ctx.state.temperature = parseFloat(tempSlider.value) || 1
        updateStats()
      }

      // Initial draw
      draw()
      updateStats()

      // Event handlers
      btnStart.addEventListener('click', () => {
        if (!ctx.state.running) start()
      })

      btnAdd.addEventListener('click', () => {
        addParticles(10)
        btnReset.disabled = false
      })

      btnReset.addEventListener('click', reset)

      tempSlider.addEventListener('input', () => {
        tempVal.textContent = tempSlider.value
        updateTemperature()
      })
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
