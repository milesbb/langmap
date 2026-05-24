import { Howl } from 'howler';

const BRANCH_TRACKS = {
  'proto-indo-european': '/audio/pie-steppe.mp3',
  anatolian: '/audio/anatolian.mp3',
  'indo-iranian': '/audio/indo-iranian.mp3',
  hellenic: '/audio/hellenic.mp3',
  italic: '/audio/italic.mp3',
  celtic: '/audio/celtic.mp3',
  germanic: '/audio/germanic.mp3',
  'balto-slavic': '/audio/balto-slavic.mp3',
  armenian: '/audio/armenian.mp3',
  albanian: '/audio/albanian.mp3',
  tocharian: '/audio/tocharian.mp3',
};

export class AudioManager {
  /** @type {Howl | null} */
  #current = null;
  /** @type {string | null} */
  #currentBranch = null;
  #muted = false;
  #mobileOptedIn = false;
  #isMobile = window.matchMedia('(max-width: 768px)').matches;

  /** @param {string} branch */
  play(branch) {
    if (this.#isMobile && !this.#mobileOptedIn) return;
    if (this.#muted) return;
    if (branch === this.#currentBranch) return;

    const src = BRANCH_TRACKS[branch];
    if (!src) return;

    this.#current?.fade(this.#current.volume(), 0, 600);
    setTimeout(() => this.#current?.stop(), 600);

    this.#current = new Howl({ src: [src], loop: true, volume: 0 });
    this.#current.play();
    this.#current.fade(0, 0.4, 800);
    this.#currentBranch = branch;
  }

  stop() {
    this.#current?.fade(this.#current.volume(), 0, 400);
    setTimeout(() => this.#current?.stop(), 400);
    this.#current = null;
    this.#currentBranch = null;
  }

  /** @param {boolean} muted */
  setMuted(muted) {
    this.#muted = muted;
    if (muted) this.stop();
  }

  mobileOptIn() {
    this.#mobileOptedIn = true;
  }
}
