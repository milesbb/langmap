import { gsap } from 'gsap';

export class TimelineBar {
  /** @type {HTMLElement | null} */
  el;

  /** @param {string} selector */
  constructor(selector) {
    this.el = document.querySelector(selector);
  }

  /** @param {string} dateRange */
  update(dateRange) {
    if (!this.el) return;
    gsap.to(this.el, {
      opacity: 0,
      duration: 0.15,
      onComplete: () => {
        if (this.el) {
          this.el.textContent = dateRange;
          gsap.to(this.el, { opacity: 1, duration: 0.15 });
        }
      },
    });
  }
}
