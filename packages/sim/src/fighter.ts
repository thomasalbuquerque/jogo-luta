import { px } from './constants';
import { axisX, axisY, Button, isHeld, isPressed, type InputMask } from './input';
import { approach, idiv, isqrt } from './math';
import { MOVES, selectAttack, selectSpecial, totalFrames, type MoveId } from './moves';
import { moveAndCollide, touchingWall, type Body, type Solid } from './physics';
import type { Spawn } from './stage';

/**
 * Números de um lutador, em subpx e ticks.
 * Na Etapa 3 vêm da ficha do personagem; por enquanto todos usam o padrão.
 */
export interface FighterStats {
  width: number;
  height: number;
  /** 100 = médio; maior = voa menos. */
  weight: number;
  walkSpeed: number;
  groundAccel: number;
  groundFriction: number;
  airSpeed: number;
  airAccel: number;
  airFriction: number;
  gravity: number;
  maxFallSpeed: number;
  fastFallSpeed: number;
  /** Altura do pulo do chão (subpx). */
  jumpHeight: number;
  airJumpHeight: number;
  airJumps: number;
  wallSlideSpeed: number;
  wallJumpSpeedX: number;
  wallJumpHeight: number;
  /** Wall jumps por vez no ar (zera ao tocar o chão). */
  maxWallJumps: number;
  dashSpeed: number;
  dashTicks: number;
  dashCooldownTicks: number;
  airDodgeSpeed: number;
  airDodgeTicks: number;
  airDodgeInvulnTicks: number;
}

export const DEFAULT_STATS: FighterStats = {
  width: px(48),
  height: px(96),
  weight: 100,
  walkSpeed: px(6.5),
  groundAccel: px(1.1),
  groundFriction: px(1.4),
  airSpeed: px(5.5),
  airAccel: px(0.6),
  airFriction: px(0.12),
  gravity: px(0.65),
  maxFallSpeed: px(11),
  fastFallSpeed: px(17),
  jumpHeight: px(175),
  airJumpHeight: px(140),
  airJumps: 1,
  wallSlideSpeed: px(3.5),
  wallJumpSpeedX: px(7),
  wallJumpHeight: px(115),
  maxWallJumps: 3,
  dashSpeed: px(13),
  dashTicks: 9,
  dashCooldownTicks: 18,
  airDodgeSpeed: px(10),
  airDodgeTicks: 18,
  airDodgeInvulnTicks: 12,
};

/** Ticks de tolerância para pular logo depois de sair da borda. */
export const COYOTE_TICKS = 5;
/** Ticks em que um aperto de pulo, ataque ou especial fica guardado esperando ser possível. */
export const JUMP_BUFFER_TICKS = 6;
export const ACTION_BUFFER_TICKS = 6;
/** Ticks ignorando plataformas depois de ↓ em cima de uma. */
export const DROP_THROUGH_TICKS = 10;

/**
 * Estados do lutador. Os "livres" (idle, run, jump, fall, wallslide) saem da
 * física; os outros têm regras próprias e duração.
 */
export type FighterState =
  'idle' | 'run' | 'jump' | 'fall' | 'wallslide' | 'dash' | 'dodge' | 'attack' | 'landing';

export interface Fighter extends Body {
  id: number;
  stats: FighterStats;
  state: FighterState;
  /** Ticks no estado atual (0 no tick em que entrou). */
  stateTicks: number;
  /** Duração do estado atual, quando ela é fixa (landing). */
  stateDuration: number;
  facing: -1 | 1;
  grounded: boolean;
  /** Tipo do chão em que está (para saber se pode descer da plataforma). */
  onPlatform: boolean;
  airJumpsLeft: number;
  wallJumpsUsed: number;
  airDodgeUsed: boolean;
  /** Golpe de recuperação já usado neste ar. */
  recoveryUsed: boolean;
  coyoteTicks: number;
  jumpBufferTicks: number;
  attackBufferTicks: number;
  specialBufferTicks: number;
  /** Pode cortar o pulo soltando o botão (pulo curto). */
  canCutJump: boolean;
  dropTicks: number;
  dashCooldown: number;
  fastFalling: boolean;
  /** Parede encostada: -1 esquerda, 1 direita, 0 nenhuma. */
  wallDir: -1 | 0 | 1;
  invulnTicks: number;
  dodgeDirX: -1 | 0 | 1;
  dodgeDirY: -1 | 0 | 1;
  /** Golpe em andamento (estado `attack`). */
  move: MoveId | null;
  /** Bitmask dos ids já acertados pelo golpe atual: cada golpe acerta cada alvo 1 vez. */
  moveHits: number;
  prevInput: InputMask;
}

export function jumpVelocity(gravity: number, height: number): number {
  return isqrt(2 * gravity * height);
}

export function createFighter(
  id: number,
  spawn: Spawn,
  stats: FighterStats = DEFAULT_STATS,
): Fighter {
  const f: Fighter = {
    id,
    stats,
    x: 0,
    y: 0,
    w: stats.width,
    h: stats.height,
    vx: 0,
    vy: 0,
    state: 'fall',
    stateTicks: 0,
    stateDuration: 0,
    facing: 1,
    grounded: false,
    onPlatform: false,
    airJumpsLeft: stats.airJumps,
    wallJumpsUsed: 0,
    airDodgeUsed: false,
    recoveryUsed: false,
    coyoteTicks: 0,
    jumpBufferTicks: 0,
    attackBufferTicks: 0,
    specialBufferTicks: 0,
    canCutJump: false,
    dropTicks: 0,
    dashCooldown: 0,
    fastFalling: false,
    wallDir: 0,
    invulnTicks: 0,
    dodgeDirX: 0,
    dodgeDirY: 0,
    move: null,
    moveHits: 0,
    prevInput: 0,
  };
  placeAtSpawn(f, spawn);
  return f;
}

/** Coloca o lutador parado, com os pés no spawn e o estado de movimento zerado. */
export function placeAtSpawn(f: Fighter, spawn: Spawn): void {
  f.x = spawn.x - idiv(f.w, 2);
  f.y = spawn.y - f.h;
  f.vx = 0;
  f.vy = 0;
  f.facing = spawn.x > 0 ? -1 : 1;
  f.grounded = false;
  f.onPlatform = false;
  refreshAirOptions(f);
  f.fastFalling = false;
  f.canCutJump = false;
  f.dropTicks = 0;
  f.dashCooldown = 0;
  f.invulnTicks = 0;
  f.jumpBufferTicks = 0;
  f.attackBufferTicks = 0;
  f.specialBufferTicks = 0;
  f.move = null;
  f.moveHits = 0;
  setState(f, 'fall');
}

/** Devolve pulos aéreos, wall jumps, dodge aéreo e recuperação. */
function refreshAirOptions(f: Fighter): void {
  f.airJumpsLeft = f.stats.airJumps;
  f.wallJumpsUsed = 0;
  f.airDodgeUsed = false;
  f.recoveryUsed = false;
}

function setState(f: Fighter, state: FighterState): void {
  if (f.state !== state) {
    f.state = state;
    f.stateTicks = 0;
  }
}

/** Entra num estado reiniciando a contagem, mesmo que já esteja nele. */
function enterState(f: Fighter, state: FighterState, duration = 0): void {
  f.state = state;
  f.stateTicks = 0;
  f.stateDuration = duration;
}

/** Frame atual do golpe (1 no tick em que começou). */
export function moveFrame(f: Fighter): number {
  return f.stateTicks + 1;
}

// ---------------------------------------------------------------------------
// Ações

function startDodge(f: Fighter, input: InputMask): void {
  const s = f.stats;
  if (f.grounded) {
    const dir = axisX(input);
    if (dir !== 0) f.facing = dir;
    f.vx = f.facing * s.dashSpeed;
    f.dashCooldown = s.dashCooldownTicks;
    enterState(f, 'dash');
  } else {
    f.dodgeDirX = axisX(input);
    f.dodgeDirY = axisY(input);
    f.airDodgeUsed = true;
    f.fastFalling = false;
    f.canCutJump = false;
    f.invulnTicks = s.airDodgeInvulnTicks;
    enterState(f, 'dodge');
  }
}

/** Tenta gastar o pulo guardado: do chão, da parede ou aéreo. */
function tryJump(f: Fighter, input: InputMask): boolean {
  const s = f.stats;
  const dir = axisX(input);
  if (f.grounded || f.coyoteTicks > 0) {
    f.vy = -jumpVelocity(s.gravity, s.jumpHeight);
    f.canCutJump = true;
  } else if (f.wallDir !== 0 && f.wallJumpsUsed < s.maxWallJumps) {
    f.vx = -f.wallDir * s.wallJumpSpeedX;
    f.vy = -jumpVelocity(s.gravity, s.wallJumpHeight);
    f.facing = f.wallDir === 1 ? -1 : 1;
    f.wallJumpsUsed++;
    f.airJumpsLeft = s.airJumps;
    f.canCutJump = false;
  } else if (f.airJumpsLeft > 0) {
    f.vy = -jumpVelocity(s.gravity, s.airJumpHeight);
    f.airJumpsLeft--;
    if (dir !== 0) {
      f.vx = dir * s.airSpeed;
      f.facing = dir;
    }
    f.canCutJump = false;
  } else {
    return false;
  }
  f.grounded = false;
  f.onPlatform = false;
  f.coyoteTicks = 0;
  f.jumpBufferTicks = 0;
  f.fastFalling = false;
  enterState(f, 'jump');
  return true;
}

/** Começa um golpe do moveset e já aplica o frame 1. */
export function startMove(f: Fighter, id: MoveId, input: InputMask): void {
  const move = MOVES[id];
  f.move = id;
  f.moveHits = 0;
  f.attackBufferTicks = 0;
  f.specialBufferTicks = 0;
  if (move.turns) {
    const dir = axisX(input);
    if (dir !== 0) f.facing = dir;
  }
  if (id === 'recovery') f.recoveryUsed = true;
  enterState(f, 'attack');
  moveFrameEffects(f);
}

/** Tenta gastar o ataque ou especial guardado. */
function tryAttack(f: Fighter, input: InputMask): boolean {
  if (f.attackBufferTicks > 0) {
    startMove(f, selectAttack(f.grounded, input, !f.recoveryUsed), input);
    return true;
  }
  if (f.specialBufferTicks > 0) {
    const special = selectSpecial(f.grounded, input);
    if (special) {
      startMove(f, special, input);
      return true;
    }
  }
  return false;
}

/** Fim de um estado com duração: volta ao controle livre já neste tick. */
function finishAction(f: Fighter, input: InputMask, prev: InputMask): void {
  f.move = null;
  enterState(f, f.grounded ? 'idle' : 'fall');
  controlFree(f, input, prev);
}

// ---------------------------------------------------------------------------
// Estados

/** Andar no chão / mirar no ar, sem ação. */
function moveHorizontally(f: Fighter, dir: -1 | 0 | 1, turn: boolean): void {
  const s = f.stats;
  if (f.grounded) {
    if (dir !== 0) {
      if (turn) f.facing = dir;
      f.vx = approach(f.vx, dir * s.walkSpeed, s.groundAccel);
    } else {
      f.vx = approach(f.vx, 0, s.groundFriction);
    }
  } else if (dir !== 0) {
    // No ar, não freia quem já está mais rápido que airSpeed (ex.: saiu de um dash).
    const target = dir * s.airSpeed;
    if (dir * f.vx < s.airSpeed) f.vx = approach(f.vx, target, s.airAccel);
    if (turn) f.facing = dir;
  } else {
    f.vx = approach(f.vx, 0, s.airFriction);
  }
}

/** Pulo curto: soltar o pulo subindo corta a velocidade pela metade. */
function cutJump(f: Fighter, input: InputMask): void {
  if (f.canCutJump && f.vy < 0 && !isHeld(input, Button.JUMP)) {
    f.vy = idiv(f.vy, 2);
    f.canCutJump = false;
  }
}

/** Controle livre (idle, run, jump, fall, wallslide): andar, virar, pular, atacar, cair. */
function controlFree(f: Fighter, input: InputMask, prev: InputMask): void {
  moveHorizontally(f, axisX(input), true);

  if (
    isPressed(input, prev, Button.DODGE) &&
    (f.grounded ? f.dashCooldown === 0 : !f.airDodgeUsed)
  ) {
    startDodge(f, input);
    return;
  }

  if (f.jumpBufferTicks > 0 && tryJump(f, input)) return;
  if (tryAttack(f, input)) return;

  cutJump(f, input);

  if (f.grounded && f.onPlatform && isPressed(input, prev, Button.DOWN)) {
    f.dropTicks = DROP_THROUGH_TICKS;
    f.grounded = false;
    f.onPlatform = false;
    f.coyoteTicks = 0;
  }

  if (!f.grounded && f.vy >= 0 && isHeld(input, Button.DOWN) && f.state !== 'wallslide') {
    f.fastFalling = true;
  }
}

/** Dash no chão: velocidade fixa; pulo cancela e leva o embalo, ataque sai do dash. */
function stepDash(f: Fighter, input: InputMask): void {
  const s = f.stats;
  if (f.jumpBufferTicks > 0 && tryJump(f, input)) return;
  if (f.grounded && tryAttack(f, input)) return;
  if (f.stateTicks >= s.dashTicks || !f.grounded) {
    f.vx = f.facing * s.walkSpeed;
    setState(f, f.grounded ? 'run' : 'fall');
  } else {
    f.vx = f.facing * s.dashSpeed;
  }
}

/** Dodge aéreo: sem gravidade, desacelera até parar; sem ação até acabar. */
function stepAirDodge(f: Fighter): void {
  const s = f.stats;
  const remaining = s.airDodgeTicks - f.stateTicks;
  const speed = idiv(s.airDodgeSpeed * Math.max(remaining, 0), s.airDodgeTicks);
  f.vx = f.dodgeDirX * speed;
  f.vy = f.dodgeDirY * speed;
  if (remaining <= 0) setState(f, 'fall');
}

/** Golpe: segue os frames do moveset; no ar dá para mirar, mas não virar. */
function stepAttack(f: Fighter, input: InputMask, prev: InputMask): void {
  const move = f.move ? MOVES[f.move] : null;
  if (!move || moveFrame(f) > totalFrames(move)) {
    finishAction(f, input, prev);
    return;
  }
  moveHorizontally(f, f.grounded ? 0 : axisX(input), false);
  cutJump(f, input);
  moveFrameEffects(f);
}

/** Efeitos de movimento do frame atual do golpe (impulso, ground pound). */
function moveFrameEffects(f: Fighter): void {
  if (!f.move) return;
  const move = MOVES[f.move];
  const frame = moveFrame(f);
  if (move.impulse?.frame === frame) {
    if (move.impulse.x !== undefined) f.vx = f.facing * move.impulse.x;
    if (move.impulse.y !== undefined) {
      f.vy = move.impulse.y;
      f.fastFalling = false;
      f.canCutJump = false;
    }
  }
  if (move.hoverStartup && frame <= move.startup) {
    f.vx = 0;
    f.vy = 0;
    f.fastFalling = false;
  } else if (move.fallSpeed !== undefined && frame <= move.startup + move.active) {
    f.vx = 0;
    f.vy = move.fallSpeed;
  }
}

/** Pouso no meio de um aéreo: parado alguns ticks. */
function stepLanding(f: Fighter, input: InputMask, prev: InputMask): void {
  if (f.stateTicks >= f.stateDuration) {
    finishAction(f, input, prev);
    return;
  }
  moveHorizontally(f, 0, false);
}

/** Golpe que controla a própria velocidade vertical neste frame (sem gravidade). */
function moveOverridesGravity(f: Fighter): boolean {
  if (f.state !== 'attack' || !f.move) return false;
  const move = MOVES[f.move];
  const frame = moveFrame(f);
  if (move.hoverStartup && frame <= move.startup) return true;
  return (
    move.fallSpeed !== undefined && frame > move.startup && frame <= move.startup + move.active
  );
}

function applyGravity(f: Fighter, input: InputMask): void {
  const s = f.stats;
  f.vy += s.gravity;
  const wallSliding =
    !f.grounded && f.wallDir !== 0 && axisX(input) === f.wallDir && f.vy > 0 && isFree(f);
  if (f.fastFalling) {
    f.vy = s.fastFallSpeed;
  } else if (wallSliding) {
    f.vy = Math.min(f.vy, s.wallSlideSpeed);
  } else {
    f.vy = Math.min(f.vy, s.maxFallSpeed);
  }
}

/** Pousou neste tick: aéreo vira landing lag (ou o golpe de pouso, no ground pound). */
function onLand(f: Fighter, input: InputMask): void {
  if (f.state !== 'attack' || !f.move) return;
  const move = MOVES[f.move];
  if (!move.aerial) return;
  if (move.landMove) {
    startMove(f, move.landMove, input);
  } else {
    f.move = null;
    f.vx = 0;
    enterState(f, 'landing', move.landingLag);
  }
}

const FREE_STATES: ReadonlySet<FighterState> = new Set([
  'idle',
  'run',
  'jump',
  'fall',
  'wallslide',
]);

export function isFree(f: Fighter): boolean {
  return FREE_STATES.has(f.state);
}

/** Avança um lutador um tick. */
export function stepFighter(f: Fighter, input: InputMask, solids: readonly Solid[]): void {
  const prev = f.prevInput;

  f.stateTicks++;
  if (f.dashCooldown > 0) f.dashCooldown--;
  if (f.dropTicks > 0) f.dropTicks--;
  if (f.invulnTicks > 0) f.invulnTicks--;
  if (f.coyoteTicks > 0) f.coyoteTicks--;
  if (f.jumpBufferTicks > 0) f.jumpBufferTicks--;
  if (f.attackBufferTicks > 0) f.attackBufferTicks--;
  if (f.specialBufferTicks > 0) f.specialBufferTicks--;
  if (isPressed(input, prev, Button.JUMP)) f.jumpBufferTicks = JUMP_BUFFER_TICKS;
  if (isPressed(input, prev, Button.ATTACK)) f.attackBufferTicks = ACTION_BUFFER_TICKS;
  if (isPressed(input, prev, Button.SPECIAL)) f.specialBufferTicks = ACTION_BUFFER_TICKS;

  switch (f.state) {
    case 'dash':
      stepDash(f, input);
      break;
    case 'dodge':
      stepAirDodge(f);
      break;
    case 'attack':
      stepAttack(f, input, prev);
      break;
    case 'landing':
      stepLanding(f, input, prev);
      break;
    default:
      controlFree(f, input, prev);
  }

  integrate(f, input, solids);
  updateState(f, input);
  f.prevInput = input;
}

/** Gravidade, movimento com colisão e o que muda ao tocar chão e parede. */
function integrate(f: Fighter, input: InputMask, solids: readonly Solid[]): void {
  const wasGrounded = f.grounded;
  if (f.state !== 'dodge' && !moveOverridesGravity(f)) applyGravity(f, input);

  const result = moveAndCollide(f, solids, f.dropTicks > 0);
  if (result.hitCeiling) f.canCutJump = false;

  f.grounded = result.landed;
  f.onPlatform = result.floorKind === 'platform';
  if (f.grounded) {
    refreshAirOptions(f);
    f.fastFalling = false;
    f.canCutJump = false;
    f.coyoteTicks = COYOTE_TICKS;
    if (f.state === 'dodge') setState(f, 'idle');
    if (!wasGrounded) onLand(f, input);
  }
  // Ao sair da borda sem pular, coyoteTicks segue contando a partir do último tick no chão.

  f.wallDir = f.grounded ? 0 : touchingWall(f, solids);
  if (f.wallDir !== 0) f.fastFalling = false;
}

/** Deriva o estado livre a partir da física. */
function updateState(f: Fighter, input: InputMask): void {
  if (!isFree(f)) return;
  if (f.grounded) {
    setState(f, axisX(input) !== 0 || f.vx !== 0 ? 'run' : 'idle');
  } else if (f.wallDir !== 0 && axisX(input) === f.wallDir && f.vy > 0) {
    setState(f, 'wallslide');
  } else {
    setState(f, f.vy < 0 ? 'jump' : 'fall');
  }
}
