// Neon Vice Cover Studio — editor wiring: photos, per-panel crop, undo/redo,
// export. The cover itself is drawn by src/cover.js.

import {
  LAYOUTS, GRADES, SAMPLE_PHOTOS, defaultState, defaultPanels,
  panelRects, hitPanel, renderCover, exportCover,
} from './cover.js';
import { applyShot } from './shots.js';

const HISTORY_LIMIT = 60;
const EXPORT_SIZES = [
  { w: 1080, h: 1080, label: 'square' },
  { w: 1080, h: 1350, label: 'portrait' },
  { w: 1920, h: 1080, label: 'wide' },
];

let state = defaultState();
let selectedPanel = 0;
let exportSize = EXPORT_SIZES[0];
const images = new Map();
const undoStack = [];
const redoStack = [];
let dragging = null;

const preview = document.getElementById('preview');
const pctx = preview.getContext('2d');

function snapshot() {
  return JSON.stringify(state);
}

function pushHistory() {
  undoStack.push(snapshot());
  if (undoStack.length > HISTORY_LIMIT) undoStack.shift();
  redoStack.length = 0;
  refreshHistoryButtons();
}

function restore(json) {
  state = JSON.parse(json);
  selectedPanel = Math.min(selectedPanel, state.panels.length - 1);
  syncControls();
  renderPreview();
}

function undo() {
  if (!undoStack.length) return;
  redoStack.push(snapshot());
  restore(undoStack.pop());
  refreshHistoryButtons();
}

function redo() {
  if (!redoStack.length) return;
  undoStack.push(snapshot());
  restore(redoStack.pop());
  refreshHistoryButtons();
}

function refreshHistoryButtons() {
  document.getElementById('undoBtn').disabled = undoStack.length === 0;
  document.getElementById('redoBtn').disabled = redoStack.length === 0;
}

function loadImage(src) {
  if (images.has(src)) return Promise.resolve(images.get(src));
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      images.set(src, img);
      resolve(img);
    };
    img.onerror = () => reject(new Error(`could not load ${src}`));
    img.src = src;
  });
}

async function loadAllPhotos() {
  const srcs = new Set();
  state.panels.forEach((p) => srcs.add(p.src));
  SAMPLE_PHOTOS.forEach((s) => srcs.add(s));
  await Promise.all([...srcs].map((s) => loadImage(s).catch(() => null)));
}

function previewSize() {
  return { w: exportSize.w, h: exportSize.h };
}

function renderPreview() {
  const { w, h } = previewSize();
  preview.width = w;
  preview.height = h;
  renderCover(pctx, state, w, h, images);
  drawSelection();
}

function drawSelection() {
  const { w, h } = previewSize();
  const { rects } = panelRects(state.layout, w, h);
  const rect = rects[selectedPanel];
  if (!rect) return;
  pctx.save();
  pctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
  pctx.rotate(rect.rot);
  pctx.translate(-rect.w / 2, -rect.h / 2);
  pctx.strokeStyle = '#00e5ff';
  pctx.lineWidth = Math.max(3, w * 0.006);
  pctx.setLineDash([Math.round(w * 0.02), Math.round(w * 0.012)]);
  pctx.strokeRect(0, 0, rect.w, rect.h);
  pctx.restore();
}

function syncControls() {
  document.getElementById('titleInput').value = state.title;
  document.getElementById('subtitleInput').value = state.subtitle;
  document.getElementById('badgeInput').value = state.badge;
  document.querySelectorAll('#layouts button').forEach((b) => {
    b.classList.toggle('active', b.dataset.layout === state.layout);
  });
  document.querySelectorAll('#grades .swatch').forEach((b) => {
    b.classList.toggle('active', b.dataset.grade === state.grade);
  });
  document.querySelectorAll('.size-btn').forEach((b) => {
    const active = Number(b.dataset.w) === exportSize.w && Number(b.dataset.h) === exportSize.h;
    b.classList.toggle('active', active);
  });
  const panel = state.panels[selectedPanel];
  if (panel) document.getElementById('zoomSlider').value = String(panel.zoom);
  document.querySelectorAll('#samples img').forEach((img) => {
    img.classList.toggle('selected', panel && img.dataset.src === panel.src);
  });
}

function buildControls() {
  const layoutBox = document.getElementById('layouts');
  Object.entries(LAYOUTS).forEach(([key, def]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = def.name;
    b.dataset.layout = key;
    b.addEventListener('click', () => {
      if (state.layout === key) return;
      pushHistory();
      const pool = [
        ...new Set(state.panels.map((p) => p.src)),
        ...SAMPLE_PHOTOS,
      ];
      state.layout = key;
      state.panels = defaultPanels(key).map((p, i) => ({
        ...p,
        src: pool[i % pool.length],
      }));
      selectedPanel = 0;
      syncControls();
      renderPreview();
    });
    layoutBox.appendChild(b);
  });

  const gradeBox = document.getElementById('grades');
  Object.entries(GRADES).forEach(([key, def]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'swatch';
    b.title = def.name;
    b.dataset.grade = key;
    b.style.background = `linear-gradient(135deg, ${def.top}, ${def.bottom})`;
    b.addEventListener('click', () => {
      if (state.grade === key) return;
      pushHistory();
      state.grade = key;
      syncControls();
      renderPreview();
    });
    gradeBox.appendChild(b);
  });

  const sampleBox = document.getElementById('samples');
  SAMPLE_PHOTOS.forEach((src) => {
    const img = document.createElement('img');
    img.src = src;
    img.alt = src.split('/').pop();
    img.dataset.src = src;
    img.addEventListener('click', () => {
      pushHistory();
      state.panels[selectedPanel].src = src;
      state.panels[selectedPanel].zoom = 1;
      state.panels[selectedPanel].ox = 0;
      state.panels[selectedPanel].oy = 0;
      loadImage(src).then(renderPreview);
      syncControls();
      renderPreview();
    });
    sampleBox.appendChild(img);
  });

  document.getElementById('titleInput').addEventListener('input', (e) => {
    state.title = e.target.value;
    renderPreview();
  });
  document.getElementById('subtitleInput').addEventListener('input', (e) => {
    state.subtitle = e.target.value;
    renderPreview();
  });
  document.getElementById('badgeInput').addEventListener('input', (e) => {
    state.badge = e.target.value;
    renderPreview();
  });
  document.getElementById('titleInput').addEventListener('change', pushHistory);
  document.getElementById('subtitleInput').addEventListener('change', pushHistory);
  document.getElementById('badgeInput').addEventListener('change', pushHistory);

  document.getElementById('zoomSlider').addEventListener('input', (e) => {
    const panel = state.panels[selectedPanel];
    if (!panel) return;
    panel.zoom = Number(e.target.value);
    renderPreview();
  });
  document.getElementById('zoomSlider').addEventListener('change', pushHistory);

  document.getElementById('undoBtn').addEventListener('click', undo);
  document.getElementById('redoBtn').addEventListener('click', redo);
  document.getElementById('fillAll').addEventListener('click', () => {
    pushHistory();
    const src = state.panels[selectedPanel].src;
    state.panels.forEach((p) => {
      p.src = src;
      p.zoom = 1;
      p.ox = 0;
      p.oy = 0;
    });
    renderPreview();
  });

  document.querySelectorAll('.size-btn').forEach((b) => {
    b.addEventListener('click', () => {
      exportSize = { w: Number(b.dataset.w), h: Number(b.dataset.h) };
      syncControls();
      renderPreview();
    });
  });

  document.getElementById('exportBtn').addEventListener('click', exportPng);
  document.getElementById('fileInput').addEventListener('change', onFileChosen);
  bindPointer();
}

function canvasPoint(e) {
  const r = preview.getBoundingClientRect();
  const scaleX = preview.width / r.width;
  const scaleY = preview.height / r.height;
  return { x: (e.clientX - r.left) * scaleX, y: (e.clientY - r.top) * scaleY };
}

function panelAt(x, y) {
  const { w, h } = previewSize();
  const { rects } = panelRects(state.layout, w, h);
  for (let i = rects.length - 1; i >= 0; i -= 1) {
    if (hitPanel(rects[i], x, y)) return i;
  }
  return -1;
}

function bindPointer() {
  preview.addEventListener('pointerdown', (e) => {
    const { x, y } = canvasPoint(e);
    const idx = panelAt(x, y);
    if (idx < 0) return;
    selectedPanel = idx;
    syncControls();
    const panel = state.panels[idx];
    dragging = { x, y, ox: panel.ox, oy: panel.oy, moved: false };
    preview.classList.add('dragging');
    preview.setPointerCapture(e.pointerId);
    renderPreview();
  });
  preview.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const { w, h } = previewSize();
    const { rects } = panelRects(state.layout, w, h);
    const rect = rects[selectedPanel];
    if (!rect) return;
    const { x, y } = canvasPoint(e);
    const dx = (x - dragging.x) / rect.w;
    const dy = (y - dragging.y) / rect.h;
    if (Math.abs(dx) > 0.005 || Math.abs(dy) > 0.005) dragging.moved = true;
    const panel = state.panels[selectedPanel];
    panel.ox = Math.max(-0.5, Math.min(0.5, dragging.ox + dx));
    panel.oy = Math.max(-0.5, Math.min(0.5, dragging.oy + dy));
    renderPreview();
  });
  const endDrag = () => {
    if (dragging && dragging.moved) pushHistory();
    dragging = null;
    preview.classList.remove('dragging');
  };
  preview.addEventListener('pointerup', endDrag);
  preview.addEventListener('pointercancel', endDrag);
  preview.addEventListener('wheel', (e) => {
    e.preventDefault();
    const panel = state.panels[selectedPanel];
    if (!panel) return;
    panel.zoom = Math.max(1, Math.min(3, panel.zoom * (e.deltaY < 0 ? 1.08 : 0.93)));
    document.getElementById('zoomSlider').value = String(panel.zoom);
    renderPreview();
  }, { passive: false });
  preview.addEventListener('dblclick', () => {
    document.getElementById('fileInput').click();
  });
}

function onFileChosen(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    pushHistory();
    const src = String(reader.result);
    state.panels[selectedPanel].src = src;
    state.panels[selectedPanel].zoom = 1;
    state.panels[selectedPanel].ox = 0;
    state.panels[selectedPanel].oy = 0;
    loadImage(src).then(renderPreview);
    syncControls();
    renderPreview();
  };
  reader.readAsDataURL(file);
  e.target.value = '';
}

function exportDataURL(w, h) {
  const canvas = exportCover(state, images, w, h);
  return canvas.toDataURL('image/png');
}

function exportPng() {
  const a = document.createElement('a');
  a.href = exportDataURL(exportSize.w, exportSize.h);
  a.download = `neon-vice-cover-${exportSize.w}x${exportSize.h}.png`;
  a.click();
}

// Test hook the maker's screenshot script uses: render and export without
// a click, and read back the live state.
window.__cover = {
  get state() { return state; },
  setState(next) {
    pushHistory();
    state = next;
    selectedPanel = 0;
    syncControls();
    return loadAllPhotos().then(renderPreview);
  },
  setExportSize(w, h) {
    exportSize = { w, h };
    syncControls();
    renderPreview();
  },
  exportDataURL,
  renderPreview,
  loadAllPhotos,
};

async function init() {
  buildControls();
  syncControls();
  refreshHistoryButtons();
  try {
    await document.fonts.load('16px Anton');
    await document.fonts.load('16px Pacifico');
    await document.fonts.ready;
  } catch (err) {
    // Fonts fall back to system sans-serif; the cover still renders.
  }
  await loadAllPhotos();
  renderPreview();
  const params = new URLSearchParams(window.location.search);
  if (params.has('shot')) {
    await applyShot(params, {
      state: () => state,
      setState: (next) => window.__cover.setState(next),
      exportDataURL,
      loadAllPhotos,
      renderPreview,
    });
  }
}

init();
