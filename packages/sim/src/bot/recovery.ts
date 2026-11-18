import { px } from '../constants';
import { canUseSpecial, characterOf, isFree, stepFighter, type Fighter } from '../fighter';
import { Button, NO_INPUT, type InputMask } from '../input';
import { overlaps } from '../physics';
import { cloneFighter } from './lookahead';
import { centerX, feetY, nearestEdge, type Edge, type Terrain } from './terrain';

/**
 * Volta ao palco. O bot segue uma regra simples (ir para a borda e, caindo abaixo
 * dela, gastar o pulo aéreo e depois o golpe de recuperação), mas antes confere,
 * simulando uma cópia do próprio lutador, se a regra dá conta. Se não der, gasta
 * algo antes: pulo, especial (investida ou teleporte), esquiva ou recuperação. O
 * que for mais barato e ainda funcionar.
 */

/** O que fazer agora fora do palco: esperar (seguir a regra) ou gastar algo já. */
export type RecoveryAction = 'wait' | 'jump' | 'special' | 'dodge' | 'recovery';

/** Ordem do mais barato para o mais caro (depois de esperar). */
export const RECOVERY_ACTIONS: readonly Exclude<RecoveryAction, 'wait'>[] = [
  'jump',
  'special',
  'dodge',
  'recovery',
];

/** Ticks simulados à frente para saber se volta. */
export const RECOVERY_HORIZON = 150;

/** Os pés passaram desta altura acima da borda: hora de gastar o pulo. */
const BELOW_EDGE = px(20);

/**
 * Para qual borda voltar: a do lado de fora em que o lutador está; embaixo do palco,
 * a mais perto.
 */
export function recoveryEdge(t: Terrain, f: Fighter): Edge | null {
  const cx = centerX(f);
  const side: -1 | 0 | 1 = cx < t.left ? -1 : cx > t.right ? 1 : 0;
  let best: Edge | null = null;
  for (const e of t.edges) {
    if (side !== 0 && e.side !== side) continue;
    if (!best || Math.abs(e.x - cx) < Math.abs(best.x - cx)) best = e;
  }
  return best ?? nearestEdge(t, cx);
}

function dirBits(dir: -1 | 0 | 1): InputMask {
  return dir < 0 ? Button.LEFT : dir > 0 ? Button.RIGHT : NO_INPUT;
}

/**
 * Direção para voltar: acima da borda, para dentro do palco; abaixo dela, do lado
 * de fora, para a parede (desliza e agarra a borda); embaixo do palco, para fora.
 */
export function recoveryDir(f: Fighter, edge: Edge): -1 | 1 {
  const below = feetY(f) > edge.y - BELOW_EDGE;
  const outside = (centerX(f) - edge.x) * edge.side > 0;
  return below && !outside ? edge.side : edge.side === 1 ? -1 : 1;
}

/** Aperta o botão só se ele não estava apertado no tick anterior (senão não conta). */
function pulse(bits: InputMask, prev: InputMask): InputMask {
  return (prev & bits) === bits ? NO_INPUT : bits;
}

/** Pode gastar o pulo agora (aéreo, ou da parede). */
function canJump(f: Fighter): boolean {
  return f.airJumpsLeft > 0 || (f.wallDir !== 0 && f.wallJumpsUsed < f.stats.maxWallJumps);
}

/** O especial ajuda a voltar: investida ou teleporte, e pode sair agora. */
export function specialRecovers(f: Fighter): boolean {
  const move = characterOf(f).special?.move;
  if (!move || !canUseSpecial(f)) return false;
  return move.dash !== undefined || move.teleport !== undefined;
}

/** A ação está disponível agora (o lutador livre e com o recurso). */
export function canRecover(f: Fighter, action: RecoveryAction): boolean {
  if (action === 'wait') return true;
  if (!isFree(f)) return false;
  switch (action) {
    case 'jump':
      return canJump(f);
    case 'special':
      return specialRecovers(f);
    case 'dodge':
      return !f.airDodgeUsed;
    case 'recovery':
      return !f.recoveryUsed;
  }
}

/**
 * A regra de voltar, tick a tick: segura a direção certa e, caindo com os pés
 * abaixo da borda, gasta o pulo (aéreo ou da parede) e depois a recuperação.
 * Nunca aperta ↓ (queda rápida ou ground pound fora do palco é morte).
 */
export function recoveryInput(f: Fighter, edge: Edge, prev: InputMask): InputMask {
  const dir = recoveryDir(f, edge);
  let mask = dirBits(dir);
  if (!isFree(f)) return mask;
  const falling = f.vy + f.kby >= 0;
  const below = feetY(f) > edge.y - BELOW_EDGE;
  if (falling && below) {
    if (canJump(f)) mask |= pulse(Button.JUMP, prev);
    else if (!f.recoveryUsed) mask |= pulse(Button.UP | Button.ATTACK, prev);
  }
  return mask;
}

/** Input de gastar `action` agora, indo para a borda. */
export function recoveryActionInput(
  f: Fighter,
  edge: Edge,
  action: RecoveryAction,
  prev: InputMask,
): InputMask {
  const toward = dirBits(recoveryDir(f, edge));
  switch (action) {
    case 'wait':
      return recoveryInput(f, edge, prev);
    case 'jump':
      return toward | pulse(Button.JUMP, prev);
    case 'special': {
      // teleporte que pula na direção apertada: para cima e para a borda
      const up = characterOf(f).special?.move.teleport ? Button.UP : NO_INPUT;
      return toward | up | pulse(Button.SPECIAL, prev);
    }
    case 'dodge':
      return toward | Button.UP | pulse(Button.DODGE, prev);
    case 'recovery':
      return toward | Button.UP | pulse(Button.ATTACK, prev);
  }
}

export interface RecoverySim {
  /** Voltou (no chão ou pendurado na borda). */
  ok: boolean;
  /** Ticks até voltar (ou até desistir). */
  ticks: number;
  /** Menor distância (subpx, soma dos eixos) entre a mão e a borda: quanto faltou. */
  miss: number;
}

/**
 * Simula a volta: espera `delay` ticks só segurando a direção, gasta `action` e
 * depois segue a regra. Nenhum adversário atrapalha.
 */
export function simulateRecovery(
  f: Fighter,
  t: Terrain,
  edge: Edge,
  action: RecoveryAction,
  delay: number,
  prevInput: InputMask,
  horizon = RECOVERY_HORIZON,
): RecoverySim {
  const c = cloneFighter(f);
  let prev = prevInput;
  let miss = Number.MAX_SAFE_INTEGER;
  let acted = action === 'wait';
  for (let tick = 0; tick < horizon; tick++) {
    let input: InputMask;
    if (tick < delay) input = dirBits(recoveryDir(c, edge));
    else if (!acted) {
      input = recoveryActionInput(c, edge, action, prev);
      // só gasta quando o aperto conta (o botão estava solto antes)
      if (input & (Button.JUMP | Button.SPECIAL | Button.DODGE | Button.ATTACK)) acted = true;
    } else input = recoveryInput(c, edge, prev);
    stepFighter(c, input, t.solids);
    prev = input;
    if (c.grounded || c.state === 'ledge') return { ok: true, ticks: tick + 1, miss: 0 };
    if (!overlaps(c, t.stage.blastZone)) return { ok: false, ticks: tick + 1, miss };
    const hand = c.x + (edge.side < 0 ? c.w : 0);
    miss = Math.min(miss, Math.abs(hand - edge.x) + Math.max(0, c.y - edge.y));
  }
  return { ok: false, ticks: horizon, miss };
}

/**
 * Escolhe o que fazer agora fora do palco. Se dá para esperar `margin` ticks e
 * ainda voltar só com a regra, espera. Senão, gasta o mais barato que funciona.
 * Se nada funciona, o que chega mais perto.
 */
export function chooseRecovery(
  f: Fighter,
  t: Terrain,
  edge: Edge,
  margin: number,
  prevInput: InputMask,
): RecoveryAction {
  if (simulateRecovery(f, t, edge, 'wait', margin, prevInput).ok) return 'wait';
  let best: RecoveryAction = 'wait';
  let bestMiss = Number.MAX_SAFE_INTEGER;
  for (const action of RECOVERY_ACTIONS) {
    if (!canRecover(f, action)) continue;
    const sim = simulateRecovery(f, t, edge, action, 0, prevInput);
    if (sim.ok) return action;
    if (sim.miss < bestMiss) {
      best = action;
      bestMiss = sim.miss;
    }
  }
  const now = simulateRecovery(f, t, edge, 'wait', 0, prevInput);
  return now.ok || now.miss <= bestMiss ? 'wait' : best;
}
