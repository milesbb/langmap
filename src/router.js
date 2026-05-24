/** @type {((id: string) => void) | null} */
let onNavigate = null;

/** @returns {string | null} */
export function getCurrentId() {
  const hash = window.location.hash;
  const match = hash.match(/^#\/language\/(.+)$/);
  return match ? match[1] : null;
}

/**
 * @param {string} id
 */
export function navigateTo(id) {
  const newHash = `#/language/${id}`;
  if (window.location.hash !== newHash) {
    window.location.hash = newHash;
  } else {
    // Same hash — trigger manually (e.g. on initial load)
    onNavigate?.(id);
  }
}

/**
 * @param {(id: string) => void} handler
 */
export function initRouter(handler) {
  onNavigate = handler;

  window.addEventListener('hashchange', () => {
    const id = getCurrentId();
    if (id) handler(id);
  });

  // Handle direct load
  const id = getCurrentId();
  if (id) handler(id);
}
