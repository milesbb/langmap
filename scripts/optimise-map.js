#!/usr/bin/env node
// Runs SVGO on public/map.svg, preserving all named IDs and the viewBox.
// Skips if map.svg does not exist (e.g. on first build before generate-map runs).
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { optimize } from 'svgo';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const mapPath = resolve(root, 'public/map.svg');

if (!existsSync(mapPath)) {
  console.log('map.svg not found — skipping SVGO (run generate-map.js first)');
  process.exit(0);
}

const input = readFileSync(mapPath, 'utf-8');
const beforeBytes = Buffer.byteLength(input, 'utf-8');

const result = optimize(input, {
  path: mapPath,
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          // Preserve all id attributes — RegionManager selects by ID
          cleanupIds: false,
          // Keep viewBox
          removeViewBox: false,
          // Keep inline styles (region display:none is functional, not decorative)
          inlineStyles: false,
          // Keep display:none region elements — toggled by RegionManager at runtime
          removeHiddenElems: false,
          // Keep empty groups — node-markers and migration-arrows are populated at runtime
          removeEmptyContainers: false,
          // Keep data-* attributes (data-node used for debugging)
          removeUnknownsAndDefaults: { keepDataAttrs: true },
          // Don't collapse groups — regions are functional group containers
          collapseGroups: false,
        },
      },
    },
  ],
});

writeFileSync(mapPath, result.data);

const afterBytes = Buffer.byteLength(result.data, 'utf-8');
const saving = (((beforeBytes - afterBytes) / beforeBytes) * 100).toFixed(1);
console.log(`✓ map.svg optimised — ${(beforeBytes / 1024).toFixed(0)}KB → ${(afterBytes / 1024).toFixed(0)}KB (${saving}% smaller)`);
