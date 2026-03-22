import type { Page } from '../router'

// ─── Data ───────────────────────────────────────────────────────────────────
const methods = [
  {
    index: '01',
    hash: 'monte-carlo',
    title: 'Monte Carlo',
    desc:
      'Scatter random points inside a square and count how many land inside its inscribed circle. ' +
      'The ratio reveals π with beautiful inevitability.',
  },
  {
    index: '02',
    hash: 'leibniz',
    title: 'Leibniz Series',
    desc:
      'The alternating series 1 - 1/3 + 1/5 - 1/7 + … converges to π/4. ' +
      'Simple, elegant, and agonisingly slow.',
  },
  {
    index: '03',
    hash: 'buffon',
    title: "Buffon's Needle",
    desc:
      'Drop a needle at random onto a lined surface. The probability it crosses a line is ' +
      'directly tied to π — a startling physical experiment.',
  },
]

// ─── Page ───────────────────────────────────────────────────────────────────
export function createHomePage(): Page {
  function render(): HTMLElement {
    const page = document.createElement('div')
    page.className = 'page'

    page.innerHTML = `
      <header class="page-header">
        <span class="page-index">π — The Constant</span>
        <h2 class="page-title">Many Roads to Pi</h2>
        <p class="page-subtitle">
          π is irrational, transcendental, and ubiquitous. Here are several ways
          to calculate it — each illuminating a different corner of mathematics.
          Choose a method to explore.
        </p>
      </header>

      <div class="home-grid">
        ${methods
          .map(
            m => `
          <a class="method-card" href="#${m.hash}" data-page="${m.hash}">
            <div class="method-card-index">${m.index}</div>
            <div class="method-card-title">${m.title}</div>
            <p class="method-card-desc">${m.desc}</p>
          </a>
        `
          )
          .join('')}
      </div>
    `

    return page
  }

  return { render, cleanup: () => {} }
}
