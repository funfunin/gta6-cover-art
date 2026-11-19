// Neon Vice Cover Studio — fixed ?shot= scenes for screenshots.
//   ?shot=cover&photo=friends-neon&caption=Sunset%20Heist
//     a cover filling the viewport (the export itself is the screenshot source)
//   ?shot=editor&photo=man-rooftop&caption=Rooftop%20Royale&layout=hero3
//     the editor with a photo loaded
//   ?shot=cover-portrait&photo=woman-sunset&caption=Golden%20Hour
//     a portrait cover filling the viewport
//   ?shot=editor-panels&grade=neon
//     the editor with the nine-panel grid and the Neon Night grade

import {
  LAYOUTS, GRADES, SAMPLE_PHOTOS, defaultState, defaultPanels, renderCover,
} from './cover.js';

const shotImages = new Map();

function loadShotImage(src) {
  if (shotImages.has(src)) return Promise.resolve(shotImages.get(src));
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      shotImages.set(src, img);
      resolve(img);
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function photoSrc(name) {
  if (!name) return SAMPLE_PHOTOS[0];
  if (name.includes('/')) return name;
  return `samples/${name}.jpg`;
}

export async function applyShot(params, api) {
  const shot = params.get('shot');
  const caption = params.get('caption') || 'Sunset Heist';
  const layout = params.get('layout');
  const grade = params.get('grade');
  const chosen = photoSrc(params.get('photo'));

  const next = defaultState();
  next.title = caption;
  if (layout && LAYOUTS[layout]) next.layout = layout;
  if (grade && GRADES[grade]) next.grade = grade;
  next.panels = defaultPanels(next.layout).map((p, i) => ({
    ...p,
    src: i === 0 ? chosen : SAMPLE_PHOTOS[i % SAMPLE_PHOTOS.length],
  }));
  if (shot === 'editor-panels') {
    next.layout = 'grid9';
    next.grade = 'neon';
    next.title = 'NEON NIGHTS';
    next.subtitle = 'nine lives, one city';
    next.panels = defaultPanels('grid9');
  }
  await api.setState(next);
  await Promise.all(next.panels.map((p) => loadShotImage(p.src)));

  if (shot === 'cover' || shot === 'cover-portrait') {
    document.body.classList.add('shot-cover');
    const canvas = document.getElementById('shotCanvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    renderCover(ctx, api.state(), canvas.width, canvas.height, shotImages);
  }
}
