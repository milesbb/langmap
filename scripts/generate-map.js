#!/usr/bin/env node
// Generates public/map.svg from Natural Earth 110m country GeoJSON.
// Produces a v1 equirectangular placeholder map — Miles will replace with an
// illustrated version at the same viewBox and region IDs (no code changes needed).
import { writeFileSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const VIEW_W = 10000;
const VIEW_H = 5000;

// Equirectangular projection (matches CLAUDE.md formula)
function lngLatToXY(lng, lat) {
  const x = (lng + 180) / 360 * VIEW_W;
  const y = (90 - lat) / 180 * VIEW_H;
  return [x, y];
}

// Convert GeoJSON ring (array of [lng, lat]) to SVG path data
function ringToPath(coords) {
  if (coords.length < 2) return '';
  const [sx, sy] = lngLatToXY(coords[0][0], coords[0][1]);
  const parts = [`M${sx.toFixed(1)},${sy.toFixed(1)}`];
  for (let i = 1; i < coords.length; i++) {
    const [x, y] = lngLatToXY(coords[i][0], coords[i][1]);
    parts.push(`L${x.toFixed(1)},${y.toFixed(1)}`);
  }
  parts.push('Z');
  return parts.join('');
}

// Convert a GeoJSON geometry to SVG path data string
function geometryToPath(geometry) {
  if (!geometry) return '';
  if (geometry.type === 'Polygon') {
    return geometry.coordinates.map(ringToPath).join('');
  }
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates
      .flatMap(poly => poly.map(ringToPath))
      .join('');
  }
  return '';
}

// Fetch Natural Earth 110m countries GeoJSON
async function fetchCountries() {
  const url = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson';
  console.log('Fetching Natural Earth 110m country data…');
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching country data`);
  return res.json();
}

// Build a rough bounding rect for a region around its centroid
function regionRect(lat, lng, zoom) {
  // Wider spread at low zoom, tighter at high zoom
  const spread = Math.max(2, 20 / zoom);
  const [cx, cy] = lngLatToXY(lng, lat);
  const dxDeg = spread;
  const dyDeg = spread * 0.6;
  const [x1] = lngLatToXY(lng - dxDeg, lat + dyDeg);
  const [x2] = lngLatToXY(lng + dxDeg, lat - dyDeg);
  const [, y1] = lngLatToXY(lng - dxDeg, lat + dyDeg);
  const [, y2] = lngLatToXY(lng + dxDeg, lat - dyDeg);
  const x = Math.min(x1, x2);
  const y = Math.min(y1, y2);
  const w = Math.abs(x2 - x1);
  const h = Math.abs(y2 - y1);
  return { x: x.toFixed(1), y: y.toFixed(1), w: w.toFixed(1), h: h.toFixed(1), cx: cx.toFixed(1), cy: cy.toFixed(1) };
}

async function main() {
  const languages = JSON.parse(
    readFileSync(resolve(root, 'public/data/languages.json'), 'utf-8')
  );

  let countryData;
  try {
    countryData = await fetchCountries();
  } catch (err) {
    console.error(`Failed to fetch country data: ${err.message}`);
    console.error('Generating minimal placeholder SVG without country shapes.');
    countryData = { features: [] };
  }

  // Generate country path elements
  const countryPaths = countryData.features.map(feature => {
    const d = geometryToPath(feature.geometry);
    if (!d) return '';
    const name = feature.properties?.NAME_EN ?? feature.properties?.NAME ?? '';
    return `    <path class="country" d="${d}" title="${escapeXml(name)}"/>`;
  }).filter(Boolean);

  // Generate region placeholder elements (hidden by default)
  const regionElements = languages.map(node => {
    const { lat, lng, zoom } = node.geo_bounds;
    const { x, y, w, h, cx, cy } = regionRect(lat, lng, zoom);
    return `    <g id="${node.region_id}" class="region" style="display:none" data-node="${node.id}">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" class="region__fill"/>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" class="region__outline" fill="none"/>
      <circle cx="${cx}" cy="${cy}" r="8" class="region__centroid"/>
    </g>`;
  });

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<!-- LangMap v1 placeholder map — generated from Natural Earth 110m data.
     Miles will replace this with an illustrated version at the same viewBox
     and region IDs. No code changes needed on replacement. -->
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 ${VIEW_W} ${VIEW_H}"
     preserveAspectRatio="xMidYMid meet"
     role="img"
     aria-label="World map showing Indo-European language regions">

  <defs>
    <style>
      .ocean { fill: #B8D4E8; }
      .country { fill: #E8E2D8; stroke: #C8C0B0; stroke-width: 4; }
      .region__fill { fill: currentColor; opacity: 0.15; }
      .region__outline {
        stroke: currentColor;
        stroke-width: 8;
        opacity: 0.8;
        stroke-dasharray: 40 20;
      }
      .region--active .region__fill { opacity: 0.25; }
      .region--active .region__outline {
        opacity: 1;
        stroke-dasharray: none;
      }
      .region__centroid { fill: currentColor; opacity: 0.6; }
    </style>
  </defs>

  <!-- Ocean background -->
  <rect class="ocean" width="${VIEW_W}" height="${VIEW_H}"/>

  <!-- Country shapes -->
  <g id="countries">
${countryPaths.join('\n')}
  </g>

  <!-- Language region highlights — display:none by default, toggled by RegionManager -->
  <g id="regions">
${regionElements.join('\n')}
  </g>

  <!-- Node markers injected by NodeMarkers.js at runtime -->
  <g id="node-markers"/>

  <!-- Migration arrows injected by MigrationArrows.js at runtime -->
  <g id="migration-arrows"/>

</svg>`;

  writeFileSync(resolve(root, 'public/map.svg'), svg);
  console.log(`✓ map.svg written — ${countryPaths.length} countries, ${regionElements.length} region placeholders`);
}

function escapeXml(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
