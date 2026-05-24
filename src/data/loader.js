/** @returns {Promise<import('./types.js').GraphNode[]>} */
export async function loadGraph() {
  const res = await fetch('/data/graph.json');
  if (!res.ok) throw new Error(`Failed to load graph.json: ${res.status}`);
  return res.json();
}

/** @returns {Promise<import('./types.js').Language[]>} */
export async function loadLanguages() {
  const res = await fetch('/data/languages.json');
  if (!res.ok) throw new Error(`Failed to load languages.json: ${res.status}`);
  return res.json();
}
