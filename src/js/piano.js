const BLACK_CLASSES = new Set([1, 3, 6, 8, 10]);

export function createPiano(start, end, activeNotes, label) {
  const selected = new Set(activeNotes);
  const white = [];
  const black = [];
  let whiteCount = 0;

  for (let midi = start; midi <= end; midi += 1) {
    if (BLACK_CLASSES.has(midi % 12)) {
      black.push({ midi, afterWhite: whiteCount });
    } else {
      white.push(midi);
      whiteCount += 1;
    }
  }

  const piano = document.createElement('div');
  piano.className = 'piano';
  piano.setAttribute('role', 'img');
  piano.setAttribute('aria-label', label);

  const whiteRow = document.createElement('div');
  whiteRow.className = 'piano-whites';
  for (const midi of white) {
    const key = document.createElement('span');
    key.className = `piano-white${selected.has(midi) ? ' is-active' : ''}`;
    key.setAttribute('aria-hidden', 'true');
    whiteRow.append(key);
  }
  piano.append(whiteRow);

  for (const { midi, afterWhite } of black) {
    const key = document.createElement('span');
    key.className = `piano-black${selected.has(midi) ? ' is-active' : ''}`;
    key.style.left = `${afterWhite / whiteCount * 100}%`;
    key.style.width = `${0.62 / whiteCount * 100}%`;
    key.setAttribute('aria-hidden', 'true');
    piano.append(key);
  }
  return piano;
}
