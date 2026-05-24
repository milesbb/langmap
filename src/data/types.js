/**
 * @typedef {'living' | 'extinct' | 'liturgical' | 'reconstructed'} LanguageStatus
 *
 * @typedef {{ lat: number, lng: number, zoom: number }} GeoBounds
 *
 * @typedef {{ original: string, romanisation: string, meaning: string }} SampleWord
 *
 * @typedef {{ original: string, romanisation: string, translation: string, note?: string }} SpeechBubble
 *
 * @typedef {Object} GraphNode
 * @property {string} id
 * @property {string[]} parent_ids
 * @property {string[]} children
 * @property {string} branch
 * @property {LanguageStatus} status
 * @property {string} date_range
 * @property {string} region_id
 * @property {GeoBounds} geo_bounds
 *
 * @typedef {Object} Language
 * @property {string} id
 * @property {string} name
 * @property {string | null} native_name
 * @property {string[]} parent_ids
 * @property {Record<string, string>} parent_influence
 * @property {string} date_range
 * @property {LanguageStatus} status
 * @property {string} region
 * @property {string} region_id
 * @property {GeoBounds} geo_bounds
 * @property {string} speakers_culture
 * @property {string} split_reason
 * @property {string} interesting_fact
 * @property {SampleWord[]} sample_words
 * @property {SpeechBubble[]} speech_bubbles
 * @property {string | null} youtube_id
 * @property {string | null} wikipedia_url
 * @property {string[]} groups
 * @property {string | null} glottolog_id
 * @property {string | null} iso_639_3
 * @property {string[]} sources
 */

export {};
