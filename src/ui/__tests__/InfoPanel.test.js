import { describe, it, expect, beforeEach } from 'vitest';
import { axe } from 'vitest-axe';
import { InfoPanel } from '../InfoPanel.js';

/** @returns {import('../../data/types.js').Language} */
function makeLanguage(overrides = {}) {
  return {
    id: 'old-english',
    name: 'Old English',
    native_name: 'Englisc',
    parent_ids: ['proto-west-germanic'],
    parent_influence: {
      'proto-west-germanic': 'grammatical structure, core vocabulary',
    },
    date_range: '450–1100 CE',
    status: 'extinct',
    region: 'England',
    region_id: 'region-old-english',
    geo_bounds: { lat: 52.5, lng: -1.5, zoom: 6 },
    speakers_culture: 'Anglo-Saxons',
    split_reason: 'Settled in Britain after the Romans withdrew.',
    interesting_fact: 'Beowulf is one of the oldest surviving epic poems.',
    sample_words: [
      { original: 'ƿater', romanisation: 'wæter', meaning: 'water' },
      { original: 'hūs', romanisation: 'hūs', meaning: 'house' },
    ],
    speech_bubbles: [],
    youtube_id: null,
    wikipedia_url: 'https://en.wikipedia.org/wiki/Old_English',
    groups: ['Indo-European', 'Germanic', 'West Germanic'],
    glottolog_id: 'olde1238',
    iso_639_3: 'ang',
    sources: ['Glottolog'],
    ...overrides,
  };
}

describe('InfoPanel', () => {
  let panel;

  beforeEach(() => {
    // Wrap in <main> so axe's landmark rule is satisfied
    document.body.innerHTML = '<main><div id="info-panel"></div></main>';
    panel = new InfoPanel('#info-panel');
  });

  it('has no accessibility violations', async () => {
    panel.show(makeLanguage());
    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });

  it('renders the language name', () => {
    panel.show(makeLanguage());
    expect(document.querySelector('.info-name').textContent).toBe('Old English');
  });

  it('renders the native name', () => {
    panel.show(makeLanguage());
    expect(document.querySelector('.info-native').textContent).toBe('Englisc');
  });

  it('renders the date range', () => {
    panel.show(makeLanguage());
    expect(document.querySelector('.info-date').textContent).toBe('450–1100 CE');
  });

  it('renders the extinct status badge', () => {
    panel.show(makeLanguage({ status: 'extinct' }));
    const badge = document.querySelector('.info-badge--extinct');
    expect(badge).not.toBeNull();
    expect(badge.textContent).toMatch(/extinct/i);
  });

  it('renders the reconstructed status badge', () => {
    panel.show(makeLanguage({ status: 'reconstructed' }));
    const badge = document.querySelector('.info-badge--reconstructed');
    expect(badge).not.toBeNull();
  });

  it('renders split_reason', () => {
    panel.show(makeLanguage());
    expect(document.body.textContent).toContain('Settled in Britain');
  });

  it('renders interesting_fact', () => {
    panel.show(makeLanguage());
    expect(document.body.textContent).toContain('Beowulf');
  });

  it('renders sample words using original + romanisation fields', () => {
    panel.show(makeLanguage());
    const words = document.querySelectorAll('.word');
    expect(words.length).toBe(2);
    expect(words[0].textContent).toBe('ƿater');
    const romanisations = document.querySelectorAll('.word-romanisation');
    expect(romanisations.length).toBeGreaterThan(0);
    expect(romanisations[0].textContent).toBe('wæter');
  });

  it('renders Wikipedia link when wikipedia_url is present', () => {
    panel.show(makeLanguage());
    const link = document.querySelector('.info-wiki');
    expect(link).not.toBeNull();
    expect(link.getAttribute('href')).toContain('wikipedia');
  });

  it('does not render Wikipedia link when wikipedia_url is null', () => {
    panel.show(makeLanguage({ wikipedia_url: null }));
    expect(document.querySelector('.info-wiki')).toBeNull();
  });

  it('omits native_name section when native_name is null', () => {
    panel.show(makeLanguage({ native_name: null }));
    expect(document.querySelector('.info-native')).toBeNull();
  });

  it('renders parent influences', () => {
    panel.show(makeLanguage());
    expect(document.body.textContent).toContain('Proto West Germanic');
    expect(document.body.textContent).toContain('grammatical structure');
  });

  it('renders breadcrumb from groups', () => {
    panel.show(makeLanguage());
    const breadcrumb = document.querySelector('.info-breadcrumb');
    expect(breadcrumb.textContent).toContain('Germanic');
  });
});
