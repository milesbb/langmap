#!/usr/bin/env node
// Derives public/data/graph.json from public/data/languages.json.
// Run automatically as part of `npm run build`.
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const languages = JSON.parse(
  readFileSync(resolve(root, 'public/data/languages.json'), 'utf-8')
);

// Build children map by inverting parent_ids
/** @type {Map<string, string[]>} */
const childrenOf = new Map(languages.map(n => [n.id, []]));
for (const node of languages) {
  for (const pid of node.parent_ids) {
    childrenOf.get(pid)?.push(node.id);
  }
}

const graph = languages.map(node => ({
  id: node.id,
  parent_ids: node.parent_ids,
  children: childrenOf.get(node.id) ?? [],
  branch: node.groups[1] ?? node.groups[0] ?? 'Unknown',
  status: node.status,
  date_range: node.date_range,
  region_id: node.region_id,
  geo_bounds: node.geo_bounds,
}));

writeFileSync(
  resolve(root, 'public/data/graph.json'),
  JSON.stringify(graph, null, 2)
);

console.log(`✓ graph.json written — ${graph.length} nodes`);
