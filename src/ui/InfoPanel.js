import { gsap } from 'gsap';

const STATUS_LABELS = {
  living: 'Living',
  extinct: 'Extinct',
  liturgical: 'Liturgical',
  reconstructed: 'Reconstructed',
};

export class InfoPanel {
  /** @type {HTMLElement | null} */
  el;

  /** @param {string} selector */
  constructor(selector) {
    this.el = document.querySelector(selector);
  }

  /** @param {import('../data/types.js').Language} language */
  show(language) {
    if (!this.el) return;
    this.el.setAttribute('aria-hidden', 'false');
    this.el.innerHTML = this.#render(language);
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    gsap.to(this.el, {
      [isMobile ? 'translateY' : 'translateX']: '0%',
      duration: 0.35,
      ease: 'power2.out',
    });
  }

  hide() {
    if (!this.el) return Promise.resolve();
    this.el.setAttribute('aria-hidden', 'true');
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    return new Promise((resolve) => {
      gsap.to(this.el, {
        [isMobile ? 'translateY' : 'translateX']: '100%',
        duration: 0.25,
        ease: 'power2.in',
        onComplete: resolve,
      });
    });
  }

  /** @param {import('../data/types.js').Language} lang */
  #render(lang) {
    const badge = `<span class="info-badge info-badge--${lang.status}">${STATUS_LABELS[lang.status]}</span>`;
    const parents =
      Object.keys(lang.parent_influence ?? {}).length > 0
        ? `<div class="info-section">
            <h3>Influences</h3>
            <ul class="info-influences">
              ${Object.entries(lang.parent_influence)
                .map(([id, desc]) => `<li><strong>${id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</strong>: ${desc}</li>`)
                .join('')}
            </ul>
          </div>`
        : '';

    const sampleWords =
      lang.sample_words?.length > 0
        ? `<div class="info-section">
            <h3>Sample words</h3>
            <ul class="info-sample-words">
              ${lang.sample_words
                .map(
                  (w) =>
                    `<li><span class="word" lang="und">${w.original}</span>${w.romanisation ? ` <span class="word-romanisation">${w.romanisation}</span>` : ''} — ${w.meaning}</li>`
                )
                .join('')}
            </ul>
          </div>`
        : '';

    const wiki = lang.wikipedia_url
      ? `<a class="info-wiki" href="${lang.wikipedia_url}" target="_blank" rel="noopener noreferrer">Wikipedia →</a>`
      : '';

    return `
      <div class="info-header">
        <h2 class="info-name">${lang.name}</h2>
        ${lang.native_name ? `<div class="info-native" lang="und">${lang.native_name}</div>` : ''}
        <div class="info-meta">
          ${badge}
          <span class="info-date">${lang.date_range}</span>
        </div>
        <div class="info-breadcrumb">${(lang.groups ?? []).join(' › ')}</div>
      </div>
      ${lang.split_reason ? `<div class="info-section"><p class="info-split">${lang.split_reason}</p></div>` : ''}
      ${parents}
      ${lang.interesting_fact ? `<div class="info-section info-fact"><p>${lang.interesting_fact}</p></div>` : ''}
      ${sampleWords}
      <div class="info-footer">${wiki}</div>
    `;
  }
}
