import type { Vec } from '../rig/skeleton';

/**
 * Boneco de treino: o esqueleto padrão com peças cinza desenhadas em código (sem
 * arte de nenhum amigo). É a skin do personagem `base` do sim, usada no tutorial
 * como o adversário genérico. Os pontos de junta seguem o formato do atlas do
 * `pnpm art` (`anchors` em cada frame), então o `FighterView` desenha igual.
 */

export interface MannequinPiece {
  name: string;
  w: number;
  h: number;
  pivot: Vec;
  tip: Vec;
  sockets?: Record<string, Vec>;
  draw: (ctx: CanvasRenderingContext2D) => void;
}

const FILL = '#a9afb6';
const SHADE = '#8a9097';
const LINE = '#3a4047';
const MARK = '#2b3036';
const OUTLINE = 5;
const PAD = 4;

/** Membro em cápsula, do pivô (em cima) até a ponta (embaixo). */
function capsule(name: string, length: number, thickness: number, fill = FILL): MannequinPiece {
  const w = thickness + 2 * (OUTLINE + PAD);
  const top = OUTLINE + PAD + thickness / 2;
  const pivot: Vec = [w / 2, top];
  const tip: Vec = [w / 2, top + length];
  return {
    name,
    w,
    h: length + thickness + 2 * (OUTLINE + PAD),
    pivot,
    tip,
    draw: (ctx) => {
      ctx.lineCap = 'round';
      ctx.strokeStyle = LINE;
      ctx.lineWidth = thickness + 2 * OUTLINE;
      line(ctx, pivot, tip);
      ctx.strokeStyle = fill;
      ctx.lineWidth = thickness;
      line(ctx, pivot, tip);
    },
  };
}

function line(ctx: CanvasRenderingContext2D, a: Vec, b: Vec): void {
  ctx.beginPath();
  ctx.moveTo(a[0], a[1]);
  ctx.lineTo(b[0], b[1]);
  ctx.stroke();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill = FILL,
): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = OUTLINE;
  ctx.strokeStyle = LINE;
  ctx.stroke();
}

/** Olhos e boca do boneco (o rosto fica do lado de +x, a frente). */
function face(ctx: CanvasRenderingContext2D, kind: 'normal' | 'hurt' | 'taunt' | 'ko'): void {
  ctx.strokeStyle = MARK;
  ctx.fillStyle = MARK;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  const eyes: Vec[] = [
    [98, 78],
    [122, 78],
  ];
  for (const [x, y] of eyes) {
    if (kind === 'ko') {
      line(ctx, [x - 7, y - 7], [x + 7, y + 7]);
      line(ctx, [x - 7, y + 7], [x + 7, y - 7]);
    } else if (kind === 'hurt') {
      line(ctx, [x - 7, y - 5], [x + 6, y]);
      line(ctx, [x - 7, y + 5], [x + 6, y]);
    } else {
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.beginPath();
  if (kind === 'taunt') ctx.arc(110, 104, 14, 0.15 * Math.PI, 0.85 * Math.PI);
  else if (kind === 'hurt' || kind === 'ko') ctx.arc(110, 116, 10, 1.15 * Math.PI, 1.85 * Math.PI);
  else {
    ctx.moveTo(100, 108);
    ctx.lineTo(120, 108);
  }
  ctx.stroke();
}

function head(kind: 'normal' | 'hurt' | 'taunt' | 'ko'): MannequinPiece {
  return {
    name: `head_${kind}`,
    w: 160,
    h: 190,
    pivot: [62, 180],
    tip: [62, 112],
    draw: (ctx) => {
      // pescoço
      roundRect(ctx, 48, 136, 30, 48, 10, SHADE);
      ctx.beginPath();
      ctx.ellipse(80, 84, 70, 76, 0, 0, Math.PI * 2);
      ctx.fillStyle = FILL;
      ctx.fill();
      ctx.lineWidth = OUTLINE;
      ctx.strokeStyle = LINE;
      ctx.stroke();
      // costura do boneco de treino
      ctx.strokeStyle = SHADE;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(30, 40);
      ctx.quadraticCurveTo(40, 90, 26, 130);
      ctx.stroke();
      face(ctx, kind);
    },
  };
}

function portrait(name: string, w: number, h: number): MannequinPiece {
  return {
    name,
    w,
    h,
    pivot: [w / 2, h],
    tip: [w / 2, 0],
    draw: (ctx) => {
      const s = w / 100;
      ctx.save();
      ctx.scale(s, s);
      roundRect(ctx, 14, 78, 72, 50, 22);
      roundRect(ctx, 41, 62, 18, 22, 6, SHADE);
      ctx.beginPath();
      ctx.ellipse(50, 42, 27, 31, 0, 0, Math.PI * 2);
      ctx.fillStyle = FILL;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = LINE;
      ctx.stroke();
      ctx.restore();
    },
  };
}

/** As peças do boneco, com os nomes que o esqueleto procura (`frameFor`). */
export const MANNEQUIN_PIECES: readonly MannequinPiece[] = [
  {
    name: 'torso',
    w: 124,
    h: 184,
    pivot: [62, 172],
    tip: [62, 112],
    sockets: { neck: [62, 16], shoulderNear: [22, 42], shoulderFar: [102, 42] },
    draw: (ctx) => {
      roundRect(ctx, 10, 8, 104, 170, 34);
      ctx.strokeStyle = SHADE;
      ctx.lineWidth = 4;
      line(ctx, [62, 30], [62, 160]);
    },
  },
  {
    name: 'hips',
    w: 124,
    h: 82,
    pivot: [62, 14],
    tip: [62, -30],
    sockets: { legNear: [38, 66], legFar: [86, 66] },
    draw: (ctx) => {
      roundRect(ctx, 10, 6, 104, 70, 24, SHADE);
    },
  },
  capsule('upperArm', 92, 42),
  capsule('forearm', 84, 36),
  capsule('hand_fist', 30, 40, SHADE),
  capsule('hand_open', 56, 34, SHADE),
  capsule('hand_taunt', 48, 36, SHADE),
  capsule('thigh', 112, 52),
  capsule('shin', 120, 44),
  capsule('foot', 70, 36, SHADE),
  head('normal'),
  head('hurt'),
  head('taunt'),
  head('ko'),
  portrait('portrait', 300, 300),
  portrait('portrait_small', 96, 96),
];

/** Lado da textura (potência de 2: mipmaps lisos, como os atlas). */
export const SHEET = 1024;

/** Onde cada peça fica na folha: prateleiras da esquerda para a direita. */
export function packPieces(
  pieces: readonly MannequinPiece[],
  sheet = SHEET,
): { piece: MannequinPiece; x: number; y: number }[] {
  const out: { piece: MannequinPiece; x: number; y: number }[] = [];
  let x = 0;
  let y = 0;
  let row = 0;
  for (const piece of pieces) {
    if (x + piece.w > sheet) {
      x = 0;
      y += row + 2;
      row = 0;
    }
    if (y + piece.h > sheet) throw new Error('Peças do boneco não cabem na folha');
    out.push({ piece, x, y });
    x += piece.w + 2;
    row = Math.max(row, piece.h);
  }
  return out;
}
