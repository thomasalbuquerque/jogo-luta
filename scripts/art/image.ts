/**
 * Operações de imagem do pipeline de arte, em RGBA cru (sem dependências).
 * Coordenadas em px, origem no canto de cima à esquerda.
 */

export interface Image {
  w: number;
  h: number;
  /** RGBA, 4 bytes por pixel. */
  data: Uint8ClampedArray;
}

export type Point = readonly [number, number];
export type Polygon = readonly Point[];
export type Rect = readonly [x: number, y: number, w: number, h: number];

export function createImage(w: number, h: number): Image {
  return { w, h, data: new Uint8ClampedArray(w * h * 4) };
}

/** '#rrggbb' → [r, g, b]. */
export function parseHex(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * Tira o fundo magenta (#FF00FF). O quanto um pixel é "magenta" é min(R, B) - G:
 * 255 no fundo, perto de 0 nas cores do desenho (até o violeta das sombras). Na
 * borda, o pixel é uma mistura do desenho com o fundo: a mistura vira alfa e a
 * cor é "desmisturada" para não ficar uma franja rosa.
 */
export function chromaKey(img: Image, opaqueBelow = 50, clearAbove = 215): Image {
  const out = createImage(img.w, img.h);
  const d = img.data;
  const o = out.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i] ?? 0;
    const g = d[i + 1] ?? 0;
    const b = d[i + 2] ?? 0;
    const a0 = d[i + 3] ?? 0;
    const m = Math.min(r, b) - g;
    let a = 1 - (m - opaqueBelow) / (clearAbove - opaqueBelow);
    a = Math.min(1, Math.max(0, a));
    if (a <= 0 || a0 === 0) continue;
    // C = a·F + (1 - a)·magenta  →  F = (C - (1 - a)·magenta) / a
    const k = 1 - a;
    o[i] = (r - k * 255) / a;
    o[i + 1] = g / a;
    o[i + 2] = (b - k * 255) / a;
    o[i + 3] = Math.round(a * a0);
  }
  return out;
}

export function crop(img: Image, [x, y, w, h]: Rect): Image {
  const out = createImage(w, h);
  for (let row = 0; row < h; row++) {
    const sy = y + row;
    if (sy < 0 || sy >= img.h) continue;
    for (let col = 0; col < w; col++) {
      const sx = x + col;
      if (sx < 0 || sx >= img.w) continue;
      const si = (sy * img.w + sx) * 4;
      const di = (row * w + col) * 4;
      out.data.set(img.data.subarray(si, si + 4), di);
    }
  }
  return out;
}

/** Ponto dentro do polígono (regra par-ímpar). */
export function insidePolygon(x: number, y: number, poly: Polygon): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i] ?? [0, 0];
    const [xj, yj] = poly[j] ?? [0, 0];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Apaga (alfa 0) os pixels dentro (`erase`) ou fora (`keep`) do polígono. */
export function clipPolygon(img: Image, poly: Polygon, mode: 'erase' | 'keep'): void {
  for (let y = 0; y < img.h; y++) {
    for (let x = 0; x < img.w; x++) {
      const inside = insidePolygon(x + 0.5, y + 0.5, poly);
      if (inside === (mode === 'erase')) img.data[(y * img.w + x) * 4 + 3] = 0;
    }
  }
}

/** Mediana da cor visível numa faixa de `ring` px em volta do polígono (por fora). */
export function colorAround(img: Image, poly: Polygon, ring = 4): [number, number, number] {
  const xs = poly.map((p) => p[0]);
  const ys = poly.map((p) => p[1]);
  const x0 = Math.max(0, Math.floor(Math.min(...xs) - ring));
  const x1 = Math.min(img.w - 1, Math.ceil(Math.max(...xs) + ring));
  const y0 = Math.max(0, Math.floor(Math.min(...ys) - ring));
  const y1 = Math.min(img.h - 1, Math.ceil(Math.max(...ys) + ring));
  const channels: number[][] = [[], [], []];
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const i = (y * img.w + x) * 4;
      if ((img.data[i + 3] ?? 0) < 255 || insidePolygon(x + 0.5, y + 0.5, poly)) continue;
      for (let k = 0; k < 3; k++) channels[k]?.push(img.data[i + k] ?? 0);
    }
  }
  const median = (v: number[] | undefined) => {
    const s = [...(v ?? [])].sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)] ?? 0;
  };
  return [median(channels[0]), median(channels[1]), median(channels[2])];
}

/**
 * Pinta de uma cor só os pixels visíveis dentro do polígono (para cobrir texto,
 * por exemplo). `auto`: a cor que está em volta do polígono.
 */
export function paintPolygon(img: Image, poly: Polygon, hex: string): void {
  const [r, g, b] = hex === 'auto' ? colorAround(img, poly) : parseHex(hex);
  for (let y = 0; y < img.h; y++) {
    for (let x = 0; x < img.w; x++) {
      const i = (y * img.w + x) * 4;
      if ((img.data[i + 3] ?? 0) === 0 || !insidePolygon(x + 0.5, y + 0.5, poly)) continue;
      img.data[i] = r;
      img.data[i + 1] = g;
      img.data[i + 2] = b;
    }
  }
}

/**
 * Põe uma cor por trás do que está dentro do polígono: o pixel fica opaco, com o
 * desenho por cima da cor na proporção do alfa. Serve para vidro que veio da cor
 * do fundo (a lente dos óculos), sem perder o brilho desenhado.
 */
export function fillBehind(img: Image, poly: Polygon, hex: string): void {
  const [r, g, b] = parseHex(hex);
  for (let y = 0; y < img.h; y++) {
    for (let x = 0; x < img.w; x++) {
      if (!insidePolygon(x + 0.5, y + 0.5, poly)) continue;
      const i = (y * img.w + x) * 4;
      const a = (img.data[i + 3] ?? 0) / 255;
      img.data[i] = (img.data[i] ?? 0) * a + r * (1 - a);
      img.data[i + 1] = (img.data[i + 1] ?? 0) * a + g * (1 - a);
      img.data[i + 2] = (img.data[i + 2] ?? 0) * a + b * (1 - a);
      img.data[i + 3] = 255;
    }
  }
}

function distToSegment(px: number, py: number, a: Point, b: Point): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / len2));
  return Math.hypot(px - (a[0] + t * dx), py - (a[1] + t * dy));
}

/**
 * Contorno ao longo de um corte: pinta a linha com a cor do traço, só onde a peça
 * tinha desenho antes do corte (`mask`), para não riscar o fundo.
 */
export function strokePolyline(
  img: Image,
  line: Polygon,
  width: number,
  hex: string,
  mask: Image,
): void {
  const [r, g, b] = parseHex(hex);
  const half = width / 2;
  for (let y = 0; y < img.h; y++) {
    for (let x = 0; x < img.w; x++) {
      let dist = Infinity;
      for (let s = 0; s + 1 < line.length; s++) {
        const a = line[s];
        const c = line[s + 1];
        if (a && c) dist = Math.min(dist, distToSegment(x + 0.5, y + 0.5, a, c));
      }
      const cover = Math.min(1, Math.max(0, half + 0.5 - dist));
      const i = (y * img.w + x) * 4;
      const limit = mask.data[i + 3] ?? 0;
      if (cover <= 0 || limit === 0) continue;
      const a0 = (img.data[i + 3] ?? 0) / 255;
      const a1 = Math.min(limit / 255, cover + a0 * (1 - cover));
      if (a1 <= 0) continue;
      // traço por cima do que já existe
      for (const [k, v] of [r, g, b].entries()) {
        const old = img.data[i + k] ?? 0;
        img.data[i + k] = (v * cover + old * a0 * (1 - cover)) / (cover + a0 * (1 - cover));
      }
      img.data[i + 3] = Math.round(a1 * 255);
    }
  }
}

/**
 * Apaga as manchas soltas (grupos de pixels visíveis menores que `minArea`), que
 * o fundo deixa perto das peças e que aumentariam a caixa da peça à toa.
 */
export function removeSpecks(img: Image, minArea: number, minAlpha = 24): void {
  const n = img.w * img.h;
  const seen = new Uint8Array(n);
  const stack: number[] = [];
  const group: number[] = [];
  for (let start = 0; start < n; start++) {
    if (seen[start] || (img.data[start * 4 + 3] ?? 0) < minAlpha) continue;
    group.length = 0;
    stack.push(start);
    seen[start] = 1;
    while (stack.length > 0) {
      const p = stack.pop() ?? 0;
      group.push(p);
      const x = p % img.w;
      const y = (p - x) / img.w;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= img.w || ny >= img.h) continue;
          const q = ny * img.w + nx;
          if (seen[q] || (img.data[q * 4 + 3] ?? 0) < minAlpha) continue;
          seen[q] = 1;
          stack.push(q);
        }
      }
    }
    if (group.length < minArea) for (const p of group) img.data[p * 4 + 3] = 0;
  }
  // o que sobrou de alfa baixo longe de tudo também sai
  for (let p = 0; p < n; p++) if (!seen[p]) img.data[p * 4 + 3] = 0;
}

/** Menor retângulo com pixels visíveis. Imagem vazia → null. */
export function opaqueBounds(img: Image, minAlpha = 8): Rect | null {
  let minX = img.w;
  let minY = img.h;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < img.h; y++) {
    for (let x = 0; x < img.w; x++) {
      if ((img.data[(y * img.w + x) * 4 + 3] ?? 0) < minAlpha) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  return maxX < 0 ? null : [minX, minY, maxX - minX + 1, maxY - minY + 1];
}

/** Copia `src` para dentro de `dst` na posição (x, y). */
export function blit(dst: Image, src: Image, x: number, y: number): void {
  for (let row = 0; row < src.h; row++) {
    const si = row * src.w * 4;
    dst.data.set(src.data.subarray(si, si + src.w * 4), ((y + row) * dst.w + x) * 4);
  }
}

export interface PackedRect {
  x: number;
  y: number;
}

/**
 * Empacota retângulos numa folha (atlas) por prateleiras, do mais alto ao mais
 * baixo. Devolve a posição de cada um (na ordem de entrada) e o tamanho da folha.
 */
export function packShelves(
  sizes: readonly { w: number; h: number }[],
  maxWidth: number,
  gap = 2,
): { positions: PackedRect[]; w: number; h: number } {
  const order = sizes.map((_, i) => i).sort((a, b) => (sizes[b]?.h ?? 0) - (sizes[a]?.h ?? 0));
  const positions: PackedRect[] = sizes.map(() => ({ x: 0, y: 0 }));
  let x = gap;
  let y = gap;
  let shelfH = 0;
  let width = 0;
  for (const i of order) {
    const s = sizes[i];
    if (!s) continue;
    if (s.w + gap * 2 > maxWidth) throw new Error(`peça mais larga que o atlas (${String(s.w)}px)`);
    if (x + s.w + gap > maxWidth) {
      x = gap;
      y += shelfH + gap;
      shelfH = 0;
    }
    positions[i] = { x, y };
    x += s.w + gap;
    width = Math.max(width, x);
    shelfH = Math.max(shelfH, s.h);
  }
  return { positions, w: width, h: y + shelfH + gap };
}
