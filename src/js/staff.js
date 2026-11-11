import { spellMidiNote } from './theory.js';

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const SHARP_TREBLE = [56, 74, 50, 68, 86, 62, 80];
const SHARP_BASS = [188, 206, 182, 200, 218, 194, 212];
const FLAT_TREBLE = [80, 62, 86, 68, 92, 74, 104];
const FLAT_BASS = [212, 194, 218, 200, 224, 206, 236];
const SHARP_ORDER = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];
const FLAT_ORDER = ['B', 'E', 'A', 'D', 'G', 'C', 'F'];

function diatonicIndex(note) {
  return note.octave * 7 + LETTERS.indexOf(note.letter);
}

function position(note) {
  const index = diatonicIndex(note);
  return note.midi >= 60
    ? { y: 104 - (index - 30) * 6, staff: 'treble' }
    : { y: 224 - (index - 18) * 6, staff: 'bass' };
}

function signatureMarkup(key) {
  const count = Math.abs(key.signature);
  if (!count) return '';
  const sharp = key.signature > 0;
  const treble = sharp ? SHARP_TREBLE : FLAT_TREBLE;
  const bass = sharp ? SHARP_BASS : FLAT_BASS;
  const glyph = sharp ? '♯' : '♭';
  let result = '';
  for (let i = 0; i < count; i += 1) {
    const x = 91 + i * 17;
    result += `<text class="staff-accidental" x="${x}" y="${treble[i] + 6}">${glyph}</text>`;
    result += `<text class="staff-accidental" x="${x}" y="${bass[i] + 6}">${glyph}</text>`;
  }
  return result;
}

function signatureAccidental(letter, key) {
  const order = key.signature > 0 ? SHARP_ORDER : FLAT_ORDER;
  return order.slice(0, Math.abs(key.signature)).includes(letter)
    ? (key.signature > 0 ? '#' : 'b') : '';
}

function ledgerMarkup(y, staff, x) {
  const top = staff === 'treble' ? 56 : 176;
  const bottom = staff === 'treble' ? 104 : 224;
  let markup = '';
  for (let line = top - 12; line >= y; line -= 12) {
    markup += `<line class="staff-ledger" x1="${x - 16}" x2="${x + 16}" y1="${line}" y2="${line}" />`;
  }
  for (let line = bottom + 12; line <= y; line += 12) {
    markup += `<line class="staff-ledger" x1="${x - 16}" x2="${x + 16}" y1="${line}" y2="${line}" />`;
  }
  return markup;
}

export function staffSvg(midiNotes, key) {
  const notes = [...new Set(midiNotes)].sort((a, b) => a - b)
    .map((midi) => {
      const spelled = spellMidiNote(midi, key);
      return { ...spelled, ...position(spelled) };
    });
  const minY = Math.min(32, ...notes.map((note) => note.y - 24));
  const maxY = Math.max(250, ...notes.map((note) => note.y + 24));
  const viewHeight = maxY - minY;
  const lines = [56, 68, 80, 92, 104, 176, 188, 200, 212, 224]
    .map((y) => `<line class="staff-line" x1="18" x2="610" y1="${y}" y2="${y}" />`).join('');
  let noteMarkup = '';

  notes.forEach((note, index) => {
    const nearby = notes.slice(0, index).filter((other) => Math.abs(other.y - note.y) <= 7);
    const x = 338 + (nearby.length % 2 ? 18 : 0);
    const expected = signatureAccidental(note.letter, key);
    const glyph = note.accidental === expected ? '' :
      note.accidental === '#' ? '♯' : note.accidental === 'b' ? '♭' : '♮';
    noteMarkup += ledgerMarkup(note.y, note.staff, x);
    if (glyph) noteMarkup += `<text class="staff-note-accidental" x="${x - 31}" y="${note.y + 6}">${glyph}</text>`;
    noteMarkup += `<ellipse class="staff-notehead" cx="${x}" cy="${note.y}" rx="10" ry="6" transform="rotate(-18 ${x} ${note.y})" />`;
  });

  const empty = notes.length ? '' : '<text class="staff-empty" x="338" y="143" text-anchor="middle">Play notes to see them here</text>';
  const title = notes.length ? notes.map((note) => note.label).join(', ') : 'No notes';
  return `<svg class="staff-svg" viewBox="0 ${minY} 640 ${viewHeight}" role="img" aria-label="Grand staff: ${title}">
    <title>Grand staff: ${title}</title>
    ${lines}
    <line class="staff-line" x1="18" x2="18" y1="56" y2="224" />
    <text class="staff-clef staff-clef-treble" x="27" y="108">𝄞</text>
    <text class="staff-clef staff-clef-bass" x="30" y="216">𝄢</text>
    ${signatureMarkup(key)}
    ${noteMarkup}
    ${empty}
  </svg>`;
}
