/**
 * Esqueleto humanoide único (Etapa 4). Todos os personagens usam os mesmos ossos
 * e as mesmas animações; cada um só troca as peças (a skin, gerada por
 * `pnpm art` a partir de `art/<personagem>/recortes.json`).
 *
 * Vista: 3/4 virado para a direita (o jogo espelha para a esquerda). "Near" é o
 * lado mais perto da câmera (desenhado na frente), "far" o de trás.
 *
 * Ângulos em graus, sentido horário na tela (y para baixo): 0 = direita,
 * 90 = baixo, -90 = cima. Girar um braço para trás (+) ou para a frente (−);
 * inclinar o tronco para a frente (+) ou para trás (−).
 *
 * Sem Phaser aqui: só a matemática, para dar para testar.
 */

export type Vec = readonly [number, number];

export const BONE_IDS = [
  'hips',
  'torso',
  'head',
  'upperArmNear',
  'forearmNear',
  'handNear',
  'upperArmFar',
  'forearmFar',
  'handFar',
  'thighNear',
  'shinNear',
  'footNear',
  'thighFar',
  'shinFar',
  'footFar',
] as const;

export type BoneId = (typeof BONE_IDS)[number];

export interface BoneDef {
  parent: BoneId | null;
  /** Onde encaixa no pai: `tip` (fim do osso pai), `pivot` (mesmo ponto) ou um socket da peça. */
  socket: string;
  /** Direção do osso em repouso (graus). */
  rest: number;
}

export const BONES: Readonly<Record<BoneId, BoneDef>> = {
  hips: { parent: null, socket: 'pivot', rest: -90 },
  torso: { parent: 'hips', socket: 'pivot', rest: -90 },
  head: { parent: 'torso', socket: 'neck', rest: -90 },
  upperArmNear: { parent: 'torso', socket: 'shoulderNear', rest: 90 },
  forearmNear: { parent: 'upperArmNear', socket: 'tip', rest: 90 },
  handNear: { parent: 'forearmNear', socket: 'tip', rest: 90 },
  upperArmFar: { parent: 'torso', socket: 'shoulderFar', rest: 90 },
  forearmFar: { parent: 'upperArmFar', socket: 'tip', rest: 90 },
  handFar: { parent: 'forearmFar', socket: 'tip', rest: 90 },
  thighNear: { parent: 'hips', socket: 'legNear', rest: 90 },
  shinNear: { parent: 'thighNear', socket: 'tip', rest: 90 },
  footNear: { parent: 'shinNear', socket: 'tip', rest: 0 },
  thighFar: { parent: 'hips', socket: 'legFar', rest: 90 },
  shinFar: { parent: 'thighFar', socket: 'tip', rest: 90 },
  footFar: { parent: 'shinFar', socket: 'tip', rest: 0 },
};

/**
 * Ordem de desenho, de trás para a frente. Em cada membro o pedaço de cima fica na
 * frente do de baixo (a manga cobre o toco do antebraço, o short cobre a coxa) e a
 * mão e o pé ficam na frente de tudo do membro. Com o cotovelo dobrado, o antebraço
 * vai para a frente do braço: ver `drawOrder`.
 */
export const DRAW_ORDER: readonly BoneId[] = [
  'forearmFar',
  'upperArmFar',
  'handFar',
  'shinFar',
  'thighFar',
  'footFar',
  'shinNear',
  'thighNear',
  'footNear',
  'hips',
  'torso',
  'head',
  'forearmNear',
  'upperArmNear',
  'handNear',
];

/**
 * A partir de quanto o antebraço dobrado para a frente (graus, em relação ao braço)
 * passa a ser desenhado na frente do braço. Esticado, a manga cobre o começo do
 * antebraço; dobrado (guarda, volante, corrida), o antebraço cruza na frente da
 * manga, senão a barra da manga fica por cima dele.
 */
export const FOREARM_FOLD = 85;

/**
 * Ordem de desenho da pose: a `DRAW_ORDER`, mas com o antebraço logo depois do
 * braço (na frente dele, atrás da mão) quando o cotovelo está dobrado para a frente.
 */
export function drawOrder(pose: Pose): BoneId[] {
  const order = [...DRAW_ORDER];
  for (const side of ['Near', 'Far'] as const) {
    if ((pose.rot[`forearm${side}`] ?? 0) > -FOREARM_FOLD) continue;
    const forearm: BoneId = `forearm${side}`;
    order.splice(order.indexOf(forearm), 1);
    order.splice(order.indexOf(`upperArm${side}`) + 1, 0, forearm);
  }
  return order;
}

export type Expression = 'normal' | 'hurt' | 'taunt' | 'ko';
export type HandPose = 'fist' | 'open' | 'taunt';

/** Pontos de uma peça no atlas, em px da textura (gerados pelo `pnpm art`). */
export interface FrameAnchors {
  w: number;
  h: number;
  pivot: Vec;
  tip: Vec;
  sockets: Readonly<Record<string, Vec>>;
}

/** Peças de um personagem, pelo nome da frame no atlas. */
export type Skin = ReadonlyMap<string, FrameAnchors>;

/** Pose: rotação de cada osso em relação ao repouso, mais deslocamento e trocas de peça. */
export interface Pose {
  rot: Readonly<Partial<Record<BoneId, number>>>;
  /** Deslocamento do corpo todo, em % da altura do personagem (x para a frente, y para baixo). */
  x: number;
  y: number;
  expression: Expression;
  handNear: HandPose;
  handFar: HandPose;
}

export const REST_POSE: Pose = {
  rot: {},
  x: 0,
  y: 0,
  expression: 'normal',
  handNear: 'fist',
  handFar: 'fist',
};

/** Onde e como desenhar a peça de um osso (px da textura, origem nos pés). */
export interface PlacedBone {
  bone: BoneId;
  frame: string;
  /** Posição do pivô da peça. */
  x: number;
  y: number;
  /** Rotação da imagem, em radianos. */
  rotation: number;
  /** Origem da imagem (0..1), no pivô da peça. */
  originX: number;
  originY: number;
}

const DEG = Math.PI / 180;

function rotate([x, y]: Vec, deg: number): Vec {
  const c = Math.cos(deg * DEG);
  const s = Math.sin(deg * DEG);
  return [x * c - y * s, x * s + y * c];
}

/** Direção da peça desenhada (do pivô para a ponta), em graus. */
export function artAngle(a: FrameAnchors): number {
  return Math.atan2(a.tip[1] - a.pivot[1], a.tip[0] - a.pivot[0]) / DEG;
}

/** Nome da frame de um osso: as peças "2" são a variação do lado de trás, se existirem. */
export function frameFor(skin: Skin, bone: BoneId, pose: Pose): string {
  let base: string;
  switch (bone) {
    case 'head':
      return `head_${pose.expression}`;
    case 'hips':
    case 'torso':
      return bone;
    case 'handNear':
      return `hand_${pose.handNear}`;
    case 'handFar':
      base = `hand_${pose.handFar}`;
      break;
    default:
      base = bone.replace(/(Near|Far)$/, '');
      if (bone.endsWith('Near')) return base;
  }
  return skin.has(`${base}2`) ? `${base}2` : base;
}

function socketOf(a: FrameAnchors, socket: string): Vec {
  if (socket === 'pivot') return a.pivot;
  if (socket === 'tip') return a.tip;
  const s = a.sockets[socket];
  if (!s) throw new Error(`peça sem o ponto "${socket}"`);
  return s;
}

/**
 * Cinemática direta: posição e rotação de cada peça para uma pose. A origem é o
 * pivô do quadril; use `fitRig` para saber onde ficam os pés.
 */
export function solvePose(skin: Skin, pose: Pose): PlacedBone[] {
  const placed = new Map<BoneId, { x: number; y: number; delta: number; frame: string }>();
  const out: PlacedBone[] = [];
  for (const bone of BONE_IDS) {
    const def = BONES[bone];
    const frame = frameFor(skin, bone, pose);
    const anchors = skin.get(frame);
    if (!anchors) throw new Error(`skin sem a peça "${frame}"`);
    let x = 0;
    let y = 0;
    let parentDelta = 0;
    if (def.parent) {
      const parent = placed.get(def.parent);
      const parentAnchors = parent && skin.get(parent.frame);
      if (!parent || !parentAnchors) throw new Error(`osso ${bone} antes do pai`);
      const parentRest = BONES[def.parent].rest - artAngle(parentAnchors);
      const s = socketOf(parentAnchors, def.socket);
      const local: Vec = [s[0] - parentAnchors.pivot[0], s[1] - parentAnchors.pivot[1]];
      const [ox, oy] = rotate(local, parentRest + parent.delta);
      x = parent.x + ox;
      y = parent.y + oy;
      parentDelta = parent.delta;
    }
    const delta = parentDelta + (pose.rot[bone] ?? 0);
    placed.set(bone, { x, y, delta, frame });
    out.push({
      bone,
      frame,
      x,
      y,
      rotation: (def.rest - artAngle(anchors) + delta) * DEG,
      originX: anchors.pivot[0] / anchors.w,
      originY: anchors.pivot[1] / anchors.h,
    });
  }
  return out;
}

/** Caixa (em px da textura) que contém as peças posicionadas. */
export function poseBounds(
  skin: Skin,
  placed: readonly PlacedBone[],
): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of placed) {
    const a = skin.get(p.frame);
    if (!a) continue;
    const deg = p.rotation / DEG;
    for (const [cx, cy] of [
      [0, 0],
      [a.w, 0],
      [0, a.h],
      [a.w, a.h],
    ] as const) {
      const [rx, ry] = rotate([cx - a.pivot[0], cy - a.pivot[1]], deg);
      minX = Math.min(minX, p.x + rx);
      maxX = Math.max(maxX, p.x + rx);
      minY = Math.min(minY, p.y + ry);
      maxY = Math.max(maxY, p.y + ry);
    }
  }
  return { minX, minY, maxX, maxY };
}

/** Medidas do boneco em repouso: altura e onde fica o chão (px da textura, a partir do quadril). */
export interface RigFit {
  /** Do chão ao alto da cabeça. */
  height: number;
  /** Y do chão (sola do pé mais baixo), com o quadril em 0. */
  groundY: number;
}

export function fitRig(skin: Skin): RigFit {
  const placed = solvePose(skin, REST_POSE);
  let groundY = -Infinity;
  for (const p of placed) {
    if (p.bone !== 'footNear' && p.bone !== 'footFar') continue;
    groundY = Math.max(groundY, poseBounds(skin, [p]).maxY);
  }
  const { minY } = poseBounds(skin, placed);
  return { height: groundY - minY, groundY };
}

/** Lê os pontos de junta do JSON do atlas (`frames[nome].anchors`). */
export function skinFromAtlas(frames: Readonly<Record<string, unknown>>): Skin {
  const skin = new Map<string, FrameAnchors>();
  for (const [name, raw] of Object.entries(frames)) {
    const f = raw as {
      frame: { w: number; h: number };
      anchors?: { pivot?: Vec; tip?: Vec; sockets?: Record<string, Vec> };
    };
    const pivot = f.anchors?.pivot;
    if (!pivot) continue;
    skin.set(name, {
      w: f.frame.w,
      h: f.frame.h,
      pivot,
      tip: f.anchors?.tip ?? [pivot[0], pivot[1] - 1],
      sockets: f.anchors?.sockets ?? {},
    });
  }
  return skin;
}
