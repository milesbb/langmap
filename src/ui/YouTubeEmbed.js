export class YouTubeEmbed {
  /** @type {HTMLElement} */
  container;

  /** @param {HTMLElement} container */
  constructor(container) {
    this.container = container;
  }

  /**
   * @param {string | null} youtubeId
   * @param {number} startSeconds
   */
  render(youtubeId, startSeconds = 0) {
    if (!youtubeId) {
      this.container.innerHTML = `<div class="youtube-placeholder" aria-label="No video available for this language">No video available</div>`;
      return;
    }

    const src = `https://www.youtube-nocookie.com/embed/${youtubeId}?start=${startSeconds}&rel=0`;
    this.container.innerHTML = `
      <iframe
        class="youtube-embed"
        src="${src}"
        title="Language overview video"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
        loading="lazy"
      ></iframe>
    `;
  }
}
