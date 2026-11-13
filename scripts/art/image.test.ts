import { describe, expect, it } from 'vitest';
import {
  chromaKey,
  clipPolygon,
  colorAround,
  createImage,
  fadeAlong,
  fillBehind,
  opaqueBounds,
  packShelves,
  removeSpecks,
  type Image,
} from './image.ts';

function fill(img: Image, rgba: readonly number[], x0 = 0, y0 = 0, w = img.w, h = img.h): void {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) img.data.set(rgba, (y * img.w + x) * 4);
  }
}

function pixel(img: Image, x: number, y: number): number[] {
  const i = (y * img.w + x) * 4;
  return Array.from(img.data.subarray(i, i + 4));
}

describe('chromaKey', () => {
  it('apaga o magenta e mantém as cores do desenho', () => {
    const img = createImage(3, 1);
    img.data.set([255, 0, 255, 255, 214, 40, 57, 255, 43, 26, 34, 255]);
    const out = chromaKey(img);
    expect(pixel(out, 0, 0)[3]).toBe(0);
    expect(pixel(out, 1, 0)).toEqual([214, 40, 57, 255]);
    expect(pixel(out, 2, 0)).toEqual([43, 26, 34, 255]);
  });

  it('na borda vira alfa parcial e tira o rosa da cor', () => {
    // metade contorno (#2b1a22), metade magenta
    const img = createImage(1, 1);
    img.data.set([149, 13, 145, 255]);
    const [r, g, b, a] = pixel(chromaKey(img), 0, 0);
    expect(a).toBeGreaterThan(60);
    expect(a).toBeLessThan(200);
    expect(r).toBeLessThan(110);
    expect(b).toBeLessThan(110);
    expect(g).toBeLessThan(60);
  });
});

describe('clipPolygon', () => {
  it('apaga dentro ou fora do polígono', () => {
    const img = createImage(4, 4);
    fill(img, [10, 10, 10, 255]);
    clipPolygon(
      img,
      [
        [0, 0],
        [2, 0],
        [2, 4],
        [0, 4],
      ],
      'erase',
    );
    expect(opaqueBounds(img)).toEqual([2, 0, 2, 4]);
    clipPolygon(
      img,
      [
        [0, 0],
        [4, 0],
        [4, 1],
        [0, 1],
      ],
      'keep',
    );
    expect(opaqueBounds(img)).toEqual([2, 0, 2, 1]);
  });
});

describe('fillBehind', () => {
  it('deixa opaco, com o desenho por cima da cor na proporção do alfa', () => {
    const img = createImage(3, 1);
    // meio transparente fora do polígono, meio transparente e vazio dentro
    img.data.set([200, 200, 200, 128, 200, 200, 200, 128, 0, 0, 0, 0]);
    const lens = [
      [1, 0],
      [3, 0],
      [3, 1],
      [1, 1],
    ] as const;
    fillBehind(img, lens, '#000000');
    expect(pixel(img, 0, 0)).toEqual([200, 200, 200, 128]);
    expect(pixel(img, 1, 0)).toEqual([100, 100, 100, 255]);
    expect(pixel(img, 2, 0)).toEqual([0, 0, 0, 255]);
  });
});

describe('fadeAlong', () => {
  it('mantém o alfa antes de `from`, some em rampa até `to` e zera depois', () => {
    const img = createImage(6, 1);
    fill(img, [10, 20, 30, 200]);
    fadeAlong(img, [2, 0], [4, 0]);
    expect(pixel(img, 0, 0)).toEqual([10, 20, 30, 200]);
    expect(pixel(img, 1, 0)).toEqual([10, 20, 30, 200]);
    expect(pixel(img, 2, 0)).toEqual([10, 20, 30, 150]);
    expect(pixel(img, 3, 0)).toEqual([10, 20, 30, 50]);
    expect(pixel(img, 4, 0)[3]).toBe(0);
    expect(pixel(img, 5, 0)[3]).toBe(0);
  });
});

describe('removeSpecks', () => {
  it('tira manchas pequenas e deixa a peça', () => {
    const img = createImage(20, 10);
    fill(img, [10, 10, 10, 255], 0, 0, 8, 8);
    fill(img, [10, 10, 10, 255], 15, 2, 2, 2);
    removeSpecks(img, 10);
    expect(opaqueBounds(img)).toEqual([0, 0, 8, 8]);
  });
});

describe('colorAround', () => {
  it('pega a cor em volta do polígono', () => {
    const img = createImage(10, 10);
    fill(img, [240, 230, 210, 255]);
    fill(img, [60, 40, 30, 255], 3, 3, 4, 4);
    expect(
      colorAround(img, [
        [3, 3],
        [7, 3],
        [7, 7],
        [3, 7],
      ]),
    ).toEqual([240, 230, 210]);
  });
});

describe('packShelves', () => {
  it('não sobrepõe as peças e respeita a largura', () => {
    const sizes = [
      { w: 50, h: 40 },
      { w: 60, h: 20 },
      { w: 30, h: 35 },
      { w: 70, h: 10 },
    ];
    const pack = packShelves(sizes, 128);
    expect(pack.w).toBeLessThanOrEqual(128);
    const rects = sizes.map((s, i) => ({ ...s, ...(pack.positions[i] ?? { x: 0, y: 0 }) }));
    for (const a of rects) {
      expect(a.x + a.w).toBeLessThanOrEqual(pack.w);
      expect(a.y + a.h).toBeLessThanOrEqual(pack.h);
      for (const b of rects) {
        if (a === b) continue;
        const overlap = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
        expect(overlap).toBe(false);
      }
    }
  });
});
