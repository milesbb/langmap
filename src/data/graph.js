/**
 * @param {import('./types.js').GraphNode[]} graph
 * @returns {{ childrenOf: Map<string, string[]>, parentsOf: Map<string, string[]> }}
 */
export function buildAdjacencyList(graph) {
  /** @type {Map<string, string[]>} */
  const childrenOf = new Map();
  /** @type {Map<string, string[]>} */
  const parentsOf = new Map();

  for (const node of graph) {
    if (!parentsOf.has(node.id)) parentsOf.set(node.id, []);
    if (!childrenOf.has(node.id)) childrenOf.set(node.id, []);

    for (const parentId of node.parent_ids) {
      parentsOf.get(node.id).push(parentId);
      if (!childrenOf.has(parentId)) childrenOf.set(parentId, []);
      childrenOf.get(parentId).push(node.id);
    }
  }

  return { childrenOf, parentsOf };
}

/**
 * @param {string} id
 * @param {Map<string, string[]>} parentsOf
 * @returns {string[]}
 */
export function findAncestors(id, parentsOf) {
  const visited = new Set();
  const queue = [id];

  while (queue.length > 0) {
    const current = queue.shift();
    const parents = parentsOf.get(current) ?? [];
    for (const p of parents) {
      if (!visited.has(p)) {
        visited.add(p);
        queue.push(p);
      }
    }
  }

  return [...visited];
}

/**
 * @param {string} id
 * @param {Map<string, string[]>} childrenOf
 * @returns {string[]}
 */
export function findChildren(id, childrenOf) {
  return childrenOf.get(id) ?? [];
}

/**
 * Returns shortest path from `fromId` to `toId`, or null if unreachable.
 * @param {string} fromId
 * @param {string} toId
 * @param {Map<string, string[]>} childrenOf
 * @returns {string[] | null}
 */
export function findPath(fromId, toId, childrenOf) {
  if (fromId === toId) return [fromId];

  /** @type {Map<string, string>} */
  const prev = new Map();
  const queue = [fromId];
  prev.set(fromId, '');

  while (queue.length > 0) {
    const current = queue.shift();
    for (const child of childrenOf.get(current) ?? []) {
      if (prev.has(child)) continue;
      prev.set(child, current);
      if (child === toId) return buildPath(prev, fromId, toId);
      queue.push(child);
    }
  }

  return null;
}

/**
 * @param {Map<string, string>} prev
 * @param {string} fromId
 * @param {string} toId
 * @returns {string[]}
 */
function buildPath(prev, fromId, toId) {
  const path = [];
  let current = toId;
  while (current !== '') {
    path.unshift(current);
    current = prev.get(current) ?? '';
  }
  return path[0] === fromId ? path : null;
}
