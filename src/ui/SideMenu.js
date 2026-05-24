import { gsap } from 'gsap';

export class SideMenu {
  /** @type {HTMLElement | null} */
  el;
  /** @type {HTMLElement | null} */
  toggleBtn;
  /** @type {import('../data/types.js').Language[]} */
  nodes = [];
  /** @type {((id: string) => void) | null} */
  selectHandler = null;
  #isOpen = false;

  /**
   * @param {string} menuSelector
   * @param {string} toggleSelector
   */
  constructor(menuSelector, toggleSelector) {
    this.el = document.querySelector(menuSelector);
    this.toggleBtn = document.querySelector(toggleSelector);
    this.toggleBtn?.addEventListener('click', () => this.toggle());
    this.#renderShell();
  }

  /** @param {import('../data/types.js').Language[]} nodes */
  setNodes(nodes) {
    this.nodes = nodes;
    this.#renderContent();
  }

  /** @param {'select'} event @param {(id: string) => void} handler */
  on(event, handler) {
    if (event === 'select') this.selectHandler = handler;
  }

  toggle() {
    this.#isOpen ? this.close() : this.open();
  }

  open() {
    if (!this.el) return;
    this.#isOpen = true;
    this.el.setAttribute('aria-hidden', 'false');
    this.toggleBtn?.setAttribute('aria-expanded', 'true');
    gsap.to(this.el, { translateX: '0%', duration: 0.3, ease: 'power2.out' });
    this.el.querySelector('.side-menu-search')?.focus();
  }

  close() {
    if (!this.el) return;
    this.#isOpen = false;
    this.el.setAttribute('aria-hidden', 'true');
    this.toggleBtn?.setAttribute('aria-expanded', 'false');
    gsap.to(this.el, { translateX: '-100%', duration: 0.25, ease: 'power2.in' });
  }

  #renderShell() {
    if (!this.el) return;
    this.el.innerHTML = `
      <div class="side-menu-header">
        <input class="side-menu-search" type="search" placeholder="Search languages" aria-label="Search languages" />
        <button class="side-menu-close" aria-label="Close language browser">✕</button>
      </div>
      <div class="side-menu-results" role="list"></div>
    `;
    this.el.querySelector('.side-menu-close')?.addEventListener('click', () => this.close());
    this.el.querySelector('.side-menu-search')?.addEventListener('input', (e) => {
      this.#filter(/** @type {HTMLInputElement} */ (e.target).value);
    });
  }

  #renderContent() {
    this.#filter('');
  }

  /** @param {string} query */
  #filter(query) {
    const resultsEl = this.el?.querySelector('.side-menu-results');
    if (!resultsEl) return;
    const q = query.toLowerCase();
    const matches = q
      ? this.nodes.filter(
          (n) =>
            n.name.toLowerCase().includes(q) ||
            (n.native_name ?? '').toLowerCase().includes(q)
        )
      : this.nodes;

    resultsEl.innerHTML = matches
      .map(
        (n) =>
          `<div class="search-result" role="listitem" data-id="${n.id}" tabindex="0" aria-label="${n.name}">
            <span class="result-name">${n.name}${n.status === 'extinct' ? ' †' : ''}</span>
            ${n.native_name ? `<span class="result-native" lang="und">${n.native_name}</span>` : ''}
          </div>`
      )
      .join('');

    resultsEl.querySelectorAll('.search-result').forEach((el) => {
      const id = el.getAttribute('data-id');
      if (!id) return;
      el.addEventListener('click', () => {
        this.selectHandler?.(id);
        this.close();
      });
      el.addEventListener('keydown', (e) => {
        if (/** @type {KeyboardEvent} */ (e).key === 'Enter') {
          this.selectHandler?.(id);
          this.close();
        }
      });
    });
  }
}
