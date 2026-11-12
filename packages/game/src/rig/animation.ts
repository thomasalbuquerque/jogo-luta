import { REST_POSE, type BoneId, type Expression, type HandPose, type Pose } from './skeleton';

/**
 * Animações como dados: uma lista de poses-chave no tempo, interpoladas.
 *
 * Tempo de cada tipo de clipe:
 * - `loop`: em ticks, repete a cada `length` ticks (a última chave volta para a primeira);
 * - `once`: em ticks, para na última chave;
 * - `move`: nas fases do golpe do sim. 0→1 = startup, 1→2 = active, 2→3 = recovery.
 *   A chave em `t = 1` aparece exatamente no 1º frame ativo (quando a hitbox liga),
 *   então o quadro visual do golpe sempre bate com a hitbox, mesmo quando a ficha
 *   muda os frames do golpe.
 */

export type Rot = Partial<Record<BoneId, number>>;
export type Ease = 'linear' | 'in' | 'out' | 'inOut';

export interface Key {
  t: number;
  rot: Rot;
  /** Deslocamento do corpo, em % da altura do personagem. */
  x?: number;
  y?: number;
  expression?: Expression;
  handNear?: HandPose;
  handFar?: HandPose;
  /** Peça na mão da frente a partir desta chave (null guarda). */
  prop?: string | null;
  /** Curva do trecho que termina nesta chave. */
  ease?: Ease;
}

export interface Clip {
  timing: 'loop' | 'once' | 'move';
  /** Duração em ticks (loop e once). */
  length?: number;
  /** Animação feita para o chão (o visualizador encosta os pés no chão). */
  ground?: boolean;
  keys: readonly Key[];
}

function eased(u: number, ease: Ease | undefined): number {
  switch (ease) {
    case 'in':
      return u * u;
    case 'out':
      return 1 - (1 - u) * (1 - u);
    case 'inOut':
      return u < 0.5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u);
    default:
      return u;
  }
}

/** Valor "em degrau" (expressão, mão, peça): o da última chave que definiu, até `t`. */
function stepValue<K extends 'expression' | 'handNear' | 'handFar' | 'prop'>(
  keys: readonly Key[],
  index: number,
  prop: K,
): Key[K] | undefined {
  for (let i = index; i >= 0; i--) {
    const v = keys[i]?.[prop];
    if (v !== undefined) return v;
  }
  return undefined;
}

/**
 * Tempo do clipe `move` a partir do frame do golpe no sim (1 = primeiro tick do golpe).
 * startup: frames 1..S → (0, 1); active: S+1..S+A → 1..2; recovery: → 2..3.
 */
export function movePhaseTime(
  frame: number,
  startup: number,
  active: number,
  recovery: number,
): number {
  if (frame <= startup) return frame / (startup + 1);
  if (frame <= startup + active) return 1 + (frame - startup - 1) / Math.max(1, active - 1);
  return Math.min(3, 2 + (frame - startup - active) / Math.max(1, recovery));
}

/** Pose do clipe no tempo `t` (na unidade do clipe). */
export function sampleClip(clip: Clip, t: number): Pose {
  const keys = clip.keys;
  const first = keys[0];
  if (!first) return REST_POSE;
  let time = t;
  if (clip.timing === 'loop' && clip.length) time = ((t % clip.length) + clip.length) % clip.length;

  // chave de antes (a) e de depois (b)
  let ia = 0;
  for (let i = 0; i < keys.length; i++) if ((keys[i]?.t ?? 0) <= time) ia = i;
  const a = keys[ia] ?? first;
  let b: Key | undefined = keys[ia + 1];
  let tb = b?.t ?? 0;
  if (!b && clip.timing === 'loop' && clip.length) {
    b = first;
    tb = clip.length + first.t;
  }

  let u = 0;
  if (b && tb > a.t) u = eased(Math.min(1, Math.max(0, (time - a.t) / (tb - a.t))), b.ease);
  if (time < a.t) u = 0;

  const rot: Rot = {};
  const bones = new Set([...Object.keys(a.rot), ...Object.keys(b?.rot ?? {})]) as Set<BoneId>;
  for (const bone of bones) {
    const ra = a.rot[bone] ?? 0;
    const rb = b ? (b.rot[bone] ?? 0) : ra;
    rot[bone] = ra + (rb - ra) * u;
  }
  // sem valor na chave = 0 (como as rotações)
  const lerp = (prop: 'x' | 'y') => {
    const va = a[prop] ?? 0;
    const vb = b ? (b[prop] ?? 0) : va;
    return va + (vb - va) * u;
  };
  return {
    rot,
    x: lerp('x'),
    y: lerp('y'),
    expression: stepValue(keys, ia, 'expression') ?? 'normal',
    handNear: stepValue(keys, ia, 'handNear') ?? 'fist',
    handFar: stepValue(keys, ia, 'handFar') ?? 'fist',
    prop: stepValue(keys, ia, 'prop') ?? null,
  };
}
