/**
 * Pipeline de arte (Etapa 4): lê as folhas geradas por IA em `art/`, tira o fundo
 * magenta, recorta as peças descritas em `art/<pasta>/recortes.json`, reduz para o
 * tamanho do jogo e grava um atlas (PNG + JSON no formato do Phaser) em
 * `packages/game/public/assets/`. Os pontos de junta de cada peça vão junto no JSON.
 *
 * Uso: pnpm art [pasta...] [--debug <pasta de saída>]
 *   sem pasta: processa todas as pastas de `art/` que têm `recortes.json`.
 *   --debug: grava também o atlas com os pontos de junta desenhados.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import sharp, { type Sharp } from 'sharp';
import {
  blit,
  chromaKey,
  clipPolygon,
  createImage,
  crop,
  opaqueBounds,
  packShelves,
  paintPolygon,
  removeSpecks,
  strokePolyline,
  type Image,
  type Point,
  type Polygon,
  type Rect,
} from './image.ts';

const ROOT = resolve(import.meta.dirname, '../..');
const ART = join(ROOT, 'art');
const OUT = join(ROOT, 'packages/game/public/assets');
const ATLAS_MAX_WIDTH = 1024;
/** Borda transparente em volta de cada peça antes de reduzir (o filtro não corta a borda). */
const PAD = 3;
/** Manchas menores que isso (px² da folha) são sujeira do fundo e saem. */
const SPECK_AREA = 120;

interface SheetDef {
  file: string;
  /** Multiplica a escala do manifesto (folhas desenhadas em outro tamanho, como as cabeças). */
  scale?: number;
  /** false: a folha já não tem fundo magenta. */
  key?: boolean;
}

interface PartDef {
  sheet: string;
  rect: Rect;
  /** Junta com o pai (onde a peça gira). */
  pivot?: Point;
  /** Fim do osso: junta com o filho, ou só a direção da peça. */
  tip?: Point;
  /** Outros pontos de encaixe (ombros no tronco, pernas no quadril...). */
  sockets?: Record<string, Point>;
  /** Polígonos apagados (manga colada no tronco, toco de junta que ficaria na frente). */
  erase?: Polygon[];
  /** Só o que está dentro fica (separar peças que vieram grudadas). */
  keep?: Polygon[];
  /** Polígonos pintados de uma cor só (tirar texto). */
  paint?: { poly: Polygon; color: string }[];
  /** Traço de contorno ao longo de um corte. */
  outline?: Polygon[];
  /**
   * Estica ou encolhe a peça (multiplica a escala), na largura e na altura. Serve
   * para acertar a proporção com o conceito (ex.: canela mais curta).
   */
  stretch?: readonly [x: number, y: number];
}

interface LayerDef {
  file: string;
  key?: boolean;
  /** Largura final em px. */
  width: number;
  rect?: Rect;
}

interface Manifest {
  /** Pasta de saída dentro de assets/, sem extensão (ex.: characters/schummaki). */
  out: string;
  /** px da folha → px da textura. */
  scale: number;
  /** Cor e largura (em px da folha) do traço dos cortes. */
  outline?: { color: string; width: number };
  sheets: Record<string, SheetDef>;
  parts: Record<string, PartDef>;
  /** Imagens grandes gravadas separadas do atlas (camadas do fundo do cenário). */
  layers?: Record<string, LayerDef>;
}

interface Anchors {
  pivot?: Point;
  tip?: Point;
  sockets?: Record<string, Point>;
}

async function readImage(file: string): Promise<Image> {
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { w: info.width, h: info.height, data: new Uint8ClampedArray(data) };
}

function toSharp(img: Image): Sharp {
  return sharp(Buffer.from(img.data.buffer, img.data.byteOffset, img.data.byteLength), {
    raw: { width: img.w, height: img.h, channels: 4 },
  });
}

async function resize(img: Image, w: number, h: number): Promise<Image> {
  const { data, info } = await toSharp(img)
    .resize(w, h, { kernel: 'lanczos3', fit: 'fill' })
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { w: info.width, h: info.height, data: new Uint8ClampedArray(data) };
}

const round2 = (v: number) => Math.round(v * 100) / 100;

async function processPart(
  name: string,
  def: PartDef,
  sheet: Image,
  scale: number,
  outline: Manifest['outline'],
): Promise<{ img: Image; anchors: Anchors }> {
  const [rx, ry] = def.rect;
  const img = crop(sheet, def.rect);
  const before = crop(sheet, def.rect);
  const local = (poly: Polygon): Polygon => poly.map(([x, y]) => [x - rx, y - ry] as const);
  for (const poly of def.keep ?? []) clipPolygon(img, local(poly), 'keep');
  for (const poly of def.erase ?? []) clipPolygon(img, local(poly), 'erase');
  for (const p of def.paint ?? []) paintPolygon(img, local(p.poly), p.color);
  for (const line of def.outline ?? []) {
    if (!outline) throw new Error(`${name}: "outline" precisa de outline no manifesto`);
    strokePolyline(img, local(line), outline.width, outline.color, before);
  }

  removeSpecks(img, SPECK_AREA);
  const bounds = opaqueBounds(img);
  if (!bounds) throw new Error(`${name}: peça vazia (confira rect/keep/erase)`);
  const [bx, by, bw, bh] = bounds;
  const trimmed = crop(img, [bx - PAD, by - PAD, bw + PAD * 2, bh + PAD * 2]);
  const [stretchX, stretchY] = def.stretch ?? [1, 1];
  const w = Math.max(1, Math.round(trimmed.w * scale * stretchX));
  const h = Math.max(1, Math.round(trimmed.h * scale * stretchY));
  const out = await resize(trimmed, w, h);
  const sx = w / trimmed.w;
  const sy = h / trimmed.h;
  const map = ([x, y]: Point): Point => [
    round2((x - rx - bx + PAD) * sx),
    round2((y - ry - by + PAD) * sy),
  ];

  const anchors: Anchors = {};
  if (def.pivot) anchors.pivot = map(def.pivot);
  if (def.tip) anchors.tip = map(def.tip);
  if (def.sockets) {
    anchors.sockets = Object.fromEntries(
      Object.entries(def.sockets).map(([k, p]) => [k, map(p)] as const),
    );
  }
  return { img: out, anchors };
}

async function writeWebp(img: Image, file: string): Promise<void> {
  mkdirSync(dirname(file), { recursive: true });
  await toSharp(img).webp({ quality: 88, alphaQuality: 90, effort: 6 }).toFile(file);
}

async function processLayer(dir: string, name: string, def: LayerDef, outBase: string) {
  let img = await readImage(join(dir, def.file));
  if (def.key !== false) img = chromaKey(img);
  if (def.rect) img = crop(img, def.rect);
  const h = Math.round((img.h * def.width) / img.w);
  const out = await resize(img, def.width, h);
  const file = `${outBase}-${name}.webp`;
  await writeWebp(out, file);
  console.log(`  camada ${name}: ${String(out.w)}x${String(out.h)} → ${file}`);
}

function debugOverlay(frames: Record<string, { x: number; y: number; anchors: Anchors }>) {
  let svg = '';
  const dot = (p: Point | undefined, ox: number, oy: number, color: string) => {
    if (!p) return;
    svg += `<circle cx="${String(ox + p[0])}" cy="${String(oy + p[1])}" r="3" fill="${color}" stroke="#000" stroke-width="1"/>`;
  };
  for (const f of Object.values(frames)) {
    dot(f.anchors.pivot, f.x, f.y, '#ff2020');
    dot(f.anchors.tip, f.x, f.y, '#20a0ff');
    for (const p of Object.values(f.anchors.sockets ?? {})) dot(p, f.x, f.y, '#20ff20');
  }
  return svg;
}

async function build(folder: string, debugDir: string | null): Promise<void> {
  const dir = join(ART, folder);
  const manifest = JSON.parse(readFileSync(join(dir, 'recortes.json'), 'utf8')) as Manifest;
  console.log(`${folder}:`);
  const outBase = join(OUT, manifest.out);

  const sheets = new Map<string, Image>();
  for (const [key, s] of Object.entries(manifest.sheets)) {
    const raw = await readImage(join(dir, s.file));
    sheets.set(key, s.key === false ? raw : chromaKey(raw));
  }

  const names = Object.keys(manifest.parts);
  const parts: { img: Image; anchors: Anchors }[] = [];
  for (const name of names) {
    const def = manifest.parts[name];
    if (!def) continue;
    const sheet = sheets.get(def.sheet);
    const sheetDef = manifest.sheets[def.sheet];
    if (!sheet || !sheetDef) throw new Error(`${name}: folha desconhecida "${def.sheet}"`);
    const scale = manifest.scale * (sheetDef.scale ?? 1);
    parts.push(await processPart(name, def, sheet, scale, manifest.outline));
  }

  const pack = packShelves(
    parts.map((p) => p.img),
    ATLAS_MAX_WIDTH,
  );
  const atlas = createImage(pack.w, pack.h);
  const frames: Record<string, unknown> = {};
  const debugFrames: Record<string, { x: number; y: number; anchors: Anchors }> = {};
  names.forEach((name, i) => {
    const part = parts[i];
    const pos = pack.positions[i];
    if (!part || !pos) return;
    blit(atlas, part.img, pos.x, pos.y);
    const { w, h } = part.img;
    frames[name] = {
      frame: { x: pos.x, y: pos.y, w, h },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w, h },
      sourceSize: { w, h },
      anchors: part.anchors,
    };
    debugFrames[name] = { x: pos.x, y: pos.y, anchors: part.anchors };
  });

  mkdirSync(dirname(outBase), { recursive: true });
  const png = `${outBase}.png`;
  await toSharp(atlas).png({ compressionLevel: 9, palette: false }).toFile(png);
  const json = {
    frames,
    meta: {
      app: 'scripts/art/build.ts',
      image: `${manifest.out.split('/').at(-1) ?? ''}.png`,
      format: 'RGBA8888',
      size: { w: pack.w, h: pack.h },
      scale: '1',
    },
  };
  writeFileSync(`${outBase}.json`, `${JSON.stringify(json, null, 1)}\n`);
  console.log(
    `  atlas: ${String(names.length)} peças, ${String(pack.w)}x${String(pack.h)} → ${png}`,
  );

  for (const [name, def] of Object.entries(manifest.layers ?? {})) {
    await processLayer(dir, name, def, outBase);
  }

  if (debugDir) {
    mkdirSync(debugDir, { recursive: true });
    const svg = `<svg width="${String(pack.w)}" height="${String(pack.h)}" xmlns="http://www.w3.org/2000/svg">${debugOverlay(debugFrames)}</svg>`;
    const file = join(debugDir, `${folder}.png`);
    await toSharp(atlas)
      .flatten({ background: '#3a3f4b' })
      .composite([{ input: Buffer.from(svg) }])
      .png()
      .toFile(file);
    console.log(`  debug: ${file}`);
  }
}

const args = process.argv.slice(2);
const debugAt = args.indexOf('--debug');
const debugDir = debugAt >= 0 ? resolve(args[debugAt + 1] ?? '.art-debug') : null;
const folders = args.filter((a, i) => !a.startsWith('--') && (debugAt < 0 || i !== debugAt + 1));
const all = readdirSync(ART).filter((f) => existsSync(join(ART, f, 'recortes.json')));
for (const folder of folders.length > 0 ? folders : all) await build(folder, debugDir);
