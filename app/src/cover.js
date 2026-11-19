// Neon Vice Cover Studio — cover engine.
// Layouts, colour grades, panel photos, halftone title block, badge ribbon,
// film grain and vignette. Pure canvas drawing; no network, no libraries.

export const LAYOUTS = {
  hero2: { name: 'Hero + two panels', panels: 3 },
  hero3: { name: 'Hero + three panels', panels: 4 },
  grid4: { name: 'Four-panel grid', panels: 4 },
  grid9: { name: 'Nine-panel grid', panels: 9 },
  full: { name: 'Full-bleed single photo', panels: 1 },
  tilted: { name: 'Tilted snapshots', panels: 4 },
};

export const GRADES = {
  sunset: {
    name: 'Vice Sunset', top: '#ff7a18', bottom: '#ff2e88',
    tint: 'rgba(255, 110, 40, 0.20)', accent: '#ffd166', glow: '#ff2e88',
  },
  neon: {
    name: 'Neon Night', top: '#00e5ff', bottom: '#ff00e5',
    tint: 'rgba(0, 229, 255, 0.16)', accent: '#00e5ff', glow: '#ff00e5',
  },
  golden: {
    name: 'Golden Hour', top: '#ffb703', bottom: '#fb8500',
    tint: 'rgba(255, 183, 3, 0.22)', accent: '#fff3b0', glow: '#fb8500',
  },
  teal: {
    name: 'Teal Noir', top: '#2ec4b6', bottom: '#011627',
    tint: 'rgba(46, 196, 182, 0.16)', accent: '#90e0ef', glow: '#2ec4b6',
  },
  pink: {
    name: 'Hot Pink', top: '#ff5d8f', bottom: '#ff006e',
    tint: 'rgba(255, 0, 110, 0.20)', accent: '#ffc2d1', glow: '#ff006e',
  },
};

export const SAMPLE_PHOTOS = [
  'samples/friends-neon.jpg',
  'samples/man-rooftop.jpg',
  'samples/woman-sunset.jpg',
];

export function defaultPanels(layout) {
  const n = LAYOUTS[layout].panels;
  const panels = [];
  for (let i = 0; i < n; i += 1) {
    panels.push({ src: SAMPLE_PHOTOS[i % SAMPLE_PHOTOS.length], zoom: 1, ox: 0, oy: 0 });
  }
  return panels;
}

export function defaultState() {
  return {
    layout: 'hero3',
    grade: 'sunset',
    title: 'VICE CITY',
    subtitle: 'neon nights',
    badge: 'NEW',
    panels: defaultPanels('hero3'),
  };
}

// Panel rectangles in pixels for a cover of size W x H. The bottom band is
// reserved for the title block, except on the full-bleed layout where the
// title sits on a scrim over the photo.
export function panelRects(layout, W, H) {
  const titleH = layout === 'full' ? 0 : Math.round(H * 0.2);
  const artH = H - titleH;
  const gap = Math.max(4, Math.round(W * 0.012));
  const rects = [];
  if (layout === 'hero2') {
    const heroW = Math.round(W * 0.64);
    rects.push({ x: 0, y: 0, w: heroW, h: artH, rot: 0 });
    const sideX = heroW + gap;
    const sideW = W - sideX;
    const halfH = Math.round((artH - gap) / 2);
    rects.push({ x: sideX, y: 0, w: sideW, h: halfH, rot: 0 });
    rects.push({ x: sideX, y: halfH + gap, w: sideW, h: artH - halfH - gap, rot: 0 });
  } else if (layout === 'hero3') {
    const heroW = Math.round(W * 0.58);
    rects.push({ x: 0, y: 0, w: heroW, h: artH, rot: 0 });
    const sideX = heroW + gap;
    const sideW = W - sideX;
    const thirdH = Math.round((artH - 2 * gap) / 3);
    for (let i = 0; i < 3; i += 1) {
      const y = i * (thirdH + gap);
      const h = i === 2 ? artH - y : thirdH;
      rects.push({ x: sideX, y, w: sideW, h, rot: 0 });
    }
  } else if (layout === 'grid4') {
    const cellW = Math.round((W - gap) / 2);
    const cellH = Math.round((artH - gap) / 2);
    rects.push({ x: 0, y: 0, w: cellW, h: cellH, rot: 0 });
    rects.push({ x: cellW + gap, y: 0, w: W - cellW - gap, h: cellH, rot: 0 });
    rects.push({ x: 0, y: cellH + gap, w: cellW, h: artH - cellH - gap, rot: 0 });
    rects.push({ x: cellW + gap, y: cellH + gap, w: W - cellW - gap, h: artH - cellH - gap, rot: 0 });
  } else if (layout === 'grid9') {
    const cellW = Math.round((W - 2 * gap) / 3);
    const cellH = Math.round((artH - 2 * gap) / 3);
    for (let r = 0; r < 3; r += 1) {
      for (let c = 0; c < 3; c += 1) {
        const x = c * (cellW + gap);
        const y = r * (cellH + gap);
        rects.push({
          x, y,
          w: c === 2 ? W - x : cellW,
          h: r === 2 ? artH - y : cellH,
          rot: 0,
        });
      }
    }
  } else if (layout === 'full') {
    rects.push({ x: 0, y: 0, w: W, h: H, rot: 0 });
  } else if (layout === 'tilted') {
    const cellW = Math.round(W * 0.46);
    const cellH = Math.round(artH * 0.46);
    const rots = [-0.07, 0.06, 0.05, -0.06];
    const xs = [Math.round(W * 0.03), Math.round(W * 0.51), Math.round(W * 0.05), Math.round(W * 0.49)];
    const ys = [Math.round(artH * 0.03), Math.round(artH * 0.05), Math.round(artH * 0.51), Math.round(artH * 0.49)];
    for (let i = 0; i < 4; i += 1) {
      rects.push({ x: xs[i], y: ys[i], w: cellW, h: cellH, rot: rots[i] });
    }
  }
  return { rects, titleH };
}

// Draw one photo inside a panel rect with cover-fit, zoom and pan offsets.
// ox/oy are fractions of the panel size, -0.5..0.5.
export function drawPhoto(ctx, img, rect, photo) {
  if (!img || !img.naturalWidth) return;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const base = Math.max(rect.w / iw, rect.h / ih) * (photo.zoom || 1);
  const dw = iw * base;
  const dh = ih * base;
  const dx = rect.x + (rect.w - dw) / 2 + (photo.ox || 0) * rect.w;
  const dy = rect.y + (rect.h - dh) / 2 + (photo.oy || 0) * rect.h;
  ctx.drawImage(img, dx, dy, dw, dh);
}

// Hit-test a point against a possibly rotated panel rect. Returns true when
// the point lies inside the rect after un-rotating around its centre.
export function hitPanel(rect, px, py) {
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  const cos = Math.cos(-rect.rot);
  const sin = Math.sin(-rect.rot);
  const dx = px - cx;
  const dy = py - cy;
  const lx = dx * cos - dy * sin;
  const ly = dx * sin + dy * cos;
  return Math.abs(lx) <= rect.w / 2 && Math.abs(ly) <= rect.h / 2;
}

function applyGrade(ctx, grade, W, H) {
  const grad = ctx.createLinearGradient(0, 0, W * 0.25, H);
  grad.addColorStop(0, grade.top);
  grad.addColorStop(1, grade.bottom);
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = grade.tint;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function drawHalftone(ctx, x, y, w, h, color, spacing, maxR) {
  ctx.save();
  ctx.fillStyle = color;
  for (let py = y + spacing / 2; py < y + h; py += spacing) {
    const row = Math.floor((py - y) / spacing);
    for (let px = x + spacing / 2 + (row % 2 ? spacing / 2 : 0); px < x + w; px += spacing) {
      const t = (py - y) / h;
      const r = maxR * (0.4 + 0.6 * t);
      ctx.globalAlpha = 0.10 + 0.22 * t;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawStarburst(ctx, cx, cy, r, points, fill, text, textColor, font) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.21);
  ctx.beginPath();
  for (let i = 0; i < points * 2; i += 1) {
    const rad = i % 2 === 0 ? r : r * 0.76;
    const a = (i / (points * 2)) * Math.PI * 2;
    const px = Math.cos(a) * rad;
    const py = Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.shadowColor = fill;
  ctx.shadowBlur = r * 0.35;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.rotate(0.21);
  ctx.fillStyle = textColor;
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

let grainTile = null;
function getGrainTile() {
  if (grainTile) return grainTile;
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d');
  const data = g.createImageData(128, 128);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = Math.floor(Math.random() * 255);
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 255;
  }
  g.putImageData(data, 0, 0);
  grainTile = c;
  return c;
}

function drawTitleBlock(ctx, state, grade, W, H, titleH) {
  const bandY = H - titleH;
  const band = ctx.createLinearGradient(0, bandY, 0, H);
  band.addColorStop(0, '#120e26');
  band.addColorStop(1, '#0a0716');
  ctx.fillStyle = band;
  ctx.fillRect(0, bandY, W, titleH);
  ctx.fillStyle = grade.glow;
  ctx.globalAlpha = 0.9;
  ctx.fillRect(0, bandY, W, Math.max(3, Math.round(H * 0.006)));
  ctx.globalAlpha = 1;
  const spacing = Math.max(10, Math.round(W * 0.016));
  drawHalftone(ctx, 0, bandY + titleH * 0.55, W, titleH * 0.45, grade.accent, spacing, Math.max(1.5, spacing * 0.16));

  const pad = Math.round(W * 0.035);
  const titleSize = Math.min(titleH * 0.52, W * 0.11);
  ctx.save();
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.font = `${Math.round(titleSize)}px Anton, sans-serif`;
  ctx.shadowColor = grade.glow;
  ctx.shadowBlur = Math.round(titleSize * 0.25);
  ctx.fillStyle = '#ffffff';
  const titleY = bandY + titleH * 0.52;
  ctx.fillText(state.title || 'VICE CITY', pad, titleY);
  ctx.shadowBlur = 0;
  const subSize = Math.max(Math.round(titleH * 0.2), Math.round(W * 0.022));
  ctx.font = `${subSize}px Pacifico, cursive`;
  ctx.fillStyle = grade.accent;
  ctx.fillText(state.subtitle || '', pad, bandY + titleH * 0.86);
  ctx.restore();

  if (state.badge) {
    const r = Math.round(titleH * 0.34);
    const cx = W - pad - r;
    const cy = bandY + titleH * 0.42;
    drawStarburst(
      ctx, cx, cy, r, 12, grade.accent,
      state.badge, '#14091f',
      `bold ${Math.round(r * 0.42)}px Anton, sans-serif`,
    );
  }
}

function drawVignette(ctx, W, H) {
  const cx = W / 2;
  const cy = H / 2;
  const rad = Math.hypot(W, H) / 2;
  const g = ctx.createRadialGradient(cx, cy, rad * 0.45, cx, cy, rad);
  g.addColorStop(0, 'rgba(0, 0, 0, 0)');
  g.addColorStop(1, 'rgba(0, 0, 0, 0.42)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

// Render the whole cover into ctx at size W x H. images is a Map from photo
// src to a loaded HTMLImageElement (missing entries draw as a dark panel).
export function renderCover(ctx, state, W, H, images) {
  const grade = GRADES[state.grade] || GRADES.sunset;
  ctx.save();
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#0d0b1e';
  ctx.fillRect(0, 0, W, H);

  const { rects, titleH } = panelRects(state.layout, W, H);
  const border = Math.max(2, Math.round(W * 0.004));
  state.panels.forEach((photo, i) => {
    const rect = rects[i];
    if (!rect) return;
    ctx.save();
    ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
    ctx.rotate(rect.rot);
    ctx.translate(-rect.w / 2, -rect.h / 2);
    ctx.beginPath();
    ctx.rect(0, 0, rect.w, rect.h);
    ctx.clip();
    const img = images.get(photo.src);
    if (img) drawPhoto(ctx, img, { x: 0, y: 0, w: rect.w, h: rect.h }, photo);
    else {
      ctx.fillStyle = '#1b1740';
      ctx.fillRect(0, 0, rect.w, rect.h);
    }
    ctx.restore();
    // White frame with a neon drop shadow, drawn in the rect's own frame.
    ctx.save();
    ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
    ctx.rotate(rect.rot);
    ctx.translate(-rect.w / 2, -rect.h / 2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = border;
    ctx.shadowColor = grade.glow;
    ctx.shadowBlur = Math.round(W * 0.012);
    ctx.strokeRect(border / 2, border / 2, rect.w - border, rect.h - border);
    ctx.restore();
  });

  applyGrade(ctx, grade, W, H);

  if (state.layout === 'full') {
    const scrim = ctx.createLinearGradient(0, H * 0.55, 0, H);
    scrim.addColorStop(0, 'rgba(10, 7, 22, 0)');
    scrim.addColorStop(1, 'rgba(10, 7, 22, 0.92)');
    ctx.fillStyle = scrim;
    ctx.fillRect(0, H * 0.55, W, H * 0.45);
    const pad = Math.round(W * 0.035);
    const titleSize = Math.min(H * 0.11, W * 0.11);
    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = `${Math.round(titleSize)}px Anton, sans-serif`;
    ctx.shadowColor = grade.glow;
    ctx.shadowBlur = Math.round(titleSize * 0.25);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(state.title || 'VICE CITY', pad, H - H * 0.13);
    ctx.shadowBlur = 0;
    const subSize = Math.max(Math.round(H * 0.035), Math.round(W * 0.022));
    ctx.font = `${subSize}px Pacifico, cursive`;
    ctx.fillStyle = grade.accent;
    ctx.fillText(state.subtitle || '', pad, H - H * 0.05);
    ctx.restore();
    if (state.badge) {
      const r = Math.round(H * 0.07);
      drawStarburst(
        ctx, W - pad - r, H * 0.62, r, 12, grade.accent,
        state.badge, '#14091f',
        `bold ${Math.round(r * 0.42)}px Anton, sans-serif`,
      );
    }
  } else {
    drawTitleBlock(ctx, state, grade, W, H, titleH);
  }

  drawVignette(ctx, W, H);
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.globalCompositeOperation = 'overlay';
  const tile = getGrainTile();
  const pattern = ctx.createPattern(tile, 'repeat');
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  ctx.restore();
}

// Make a fresh canvas with the cover rendered at w x h.
export function exportCover(state, images, w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  renderCover(ctx, state, w, h, images);
  return canvas;
}
