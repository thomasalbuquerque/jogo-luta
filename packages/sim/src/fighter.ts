import { px } from './constants';
import { axisX, axisY, Button, isHeld, isPressed, type InputMask } from './input';
import { approach, idiv, isqrt } from './math';
import { moveAndCollide, touchingWall, type Body, type Solid } from './physics';
import type { Spawn } from './stage';

/**
 * Números de movimento de um lutador, em subpx e ticks.
 * Na Etapa 3 vêm da ficha do personagem; por enquanto todos usam o padrão.
 */
export interface MovementStats {
  width: number;
  height: number;
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

export const DEFAULT_STATS: MovementStats = {
  width: px(48),
  height: px(96),
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
/** Ticks em que um aperto de pulo fica guardado esperando ser possível. */
export const JUMP_BUFFER_TICKS = 6;
/** Ticks ignorando plataformas depois de ↓ em cima de uma. */
export const DROP_THROUGH_TICKS = 10;

export type FighterState = 'idle' | 'run' | 'jump' | 'fall' | 'wallslide' | 'dash' | 'dodge';

export interface Fighter extends Body {
  id: number;
  stats: MovementStats;
  state: FighterState;
  /** Ticks no estado atual. */
  stateTicks: number;
  facing: -1 | 1;
  grounded: boolean;
  /** Tipo do chão em que está (para saber se pode descer da plataforma). */
  onPlatform: boolean;
  airJumpsLeft: number;
  wallJumpsUsed: number;
  airDodgeUsed: boolean;
  coyoteTicks: number;
  jumpBufferTicks: number;
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
  prevInput: InputMask;
}

export function jumpVelocity(gravity: number, height: number): number {
  return isqrt(2 * gravity * height);
}

export function createFighter(
  id: number,
  spawn: Spawn,
  stats: MovementStats = DEFAULT_STATS,
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
    facing: 1,
    grounded: false,
    onPlatform: false,
    airJumpsLeft: stats.airJumps,
    wallJumpsUsed: 0,
    airDodgeUsed: false,
    coyoteTicks: 0,
    jumpBufferTicks: 0,
    canCutJump: false,
    dropTicks: 0,
    dashCooldown: 0,
    fastFalling: false,
    wallDir: 0,
    invulnTicks: 0,
    dodgeDirX: 0,
    dodgeDirY: 0,
    prevInput: 0,
  };
  placeAtSpawn(f, spawn);
  return f;
}

/** Coloca o lutador parado com os pés no spawn. */
export function placeAtSpawn(f: Fighter, spawn: Spawn): void {
  f.x = spawn.x - idiv(f.w, 2);
  f.y = spawn.y - f.h;
  f.vx = 0;
  f.vy = 0;
  f.facing = spawn.x > 0 ? -1 : 1;
  f.airJumpsLeft = f.stats.airJumps;
  f.wallJumpsUsed = 0;
  f.airDodgeUsed = false;
  f.fastFalling = false;
  f.canCutJump = false;
  f.dropTicks = 0;
  f.dashCooldown = 0;
  f.invulnTicks = 0;
  setState(f, 'fall');
}

function setState(f: Fighter, state: FighterState): void {
  if (f.state !== state) {
    f.state = state;
    f.stateTicks = 0;
  }
}

function startDodge(f: Fighter, input: InputMask): void {
  const s = f.stats;
  if (f.grounded) {
    const dir = axisX(input);
    if (dir !== 0) f.facing = dir;
    f.vx = f.facing * s.dashSpeed;
    f.dashCooldown = s.dashCooldownTicks;
    setState(f, 'dash');
  } else {
    f.dodgeDirX = axisX(input);
    f.dodgeDirY = axisY(input);
    f.airDodgeUsed = true;
    f.fastFalling = false;
    f.canCutJump = false;
    f.invulnTicks = s.airDodgeInvulnTicks;
    setState(f, 'dodge');
  }
  f.stateTicks = 0;
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
  setState(f, 'jump');
  f.stateTicks = 0;
  return true;
}

/** Controle normal (fora de dash e dodge): andar, virar, pular, cair. */
function controlFree(f: Fighter, input: InputMask, prev: InputMask): void {
  const s = f.stats;
  const dir = axisX(input);

  if (f.grounded) {
    if (dir !== 0) {
      f.facing = dir;
      f.vx = approach(f.vx, dir * s.walkSpeed, s.groundAccel);
    } else {
      f.vx = approach(f.vx, 0, s.groundFriction);
    }
  } else if (dir !== 0) {
    // No ar, não freia quem já está mais rápido que airSpeed (ex.: saiu de um dash).
    const target = dir * s.airSpeed;
    if (dir * f.vx < s.airSpeed) f.vx = approach(f.vx, target, s.airAccel);
    f.facing = dir;
  } else {
    f.vx = approach(f.vx, 0, s.airFriction);
  }

  if (
    isPressed(input, prev, Button.DODGE) &&
    (f.grounded ? f.dashCooldown === 0 : !f.airDodgeUsed)
  ) {
    startDodge(f, input);
    return;
  }

  if (f.jumpBufferTicks > 0 && tryJump(f, input)) return;

  // Pulo curto: soltar o pulo subindo corta a velocidade pela metade.
  if (f.canCutJump && f.vy < 0 && !isHeld(input, Button.JUMP)) {
    f.vy = idiv(f.vy, 2);
    f.canCutJump = false;
  }

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

function applyGravity(f: Fighter, input: InputMask): void {
  const s = f.stats;
  f.vy += s.gravity;
  const wallSliding = !f.grounded && f.wallDir !== 0 && axisX(input) === f.wallDir && f.vy > 0;
  if (f.fastFalling) {
    f.vy = s.fastFallSpeed;
  } else if (wallSliding) {
    f.vy = Math.min(f.vy, s.wallSlideSpeed);
  } else {
    f.vy = Math.min(f.vy, s.maxFallSpeed);
  }
}

/** Avança um lutador um tick. */
export function stepFighter(f: Fighter, input: InputMask, solids: readonly Solid[]): void {
  const s = f.stats;
  const prev = f.prevInput;

  f.stateTicks++;
  if (f.dashCooldown > 0) f.dashCooldown--;
  if (f.dropTicks > 0) f.dropTicks--;
  if (f.invulnTicks > 0) f.invulnTicks--;
  if (f.coyoteTicks > 0) f.coyoteTicks--;
  if (f.jumpBufferTicks > 0) f.jumpBufferTicks--;
  if (isPressed(input, prev, Button.JUMP)) f.jumpBufferTicks = JUMP_BUFFER_TICKS;

  if (f.state === 'dash') {
    // Dash: velocidade fixa; pulo cancela e leva o embalo.
    if (f.jumpBufferTicks > 0 && tryJump(f, input)) {
      // segue como pulo
    } else if (f.stateTicks >= s.dashTicks || !f.grounded) {
      f.vx = f.facing * s.walkSpeed;
      setState(f, f.grounded ? 'run' : 'fall');
    } else {
      f.vx = f.facing * s.dashSpeed;
    }
  } else if (f.state === 'dodge') {
    // Dodge aéreo: sem gravidade, desacelera até parar; sem ação até acabar.
    const remaining = s.airDodgeTicks - f.stateTicks;
    const speed = idiv(s.airDodgeSpeed * Math.max(remaining, 0), s.airDodgeTicks);
    f.vx = f.dodgeDirX * speed;
    f.vy = f.dodgeDirY * speed;
    if (remaining <= 0) setState(f, 'fall');
  } else {
    controlFree(f, input, prev);
  }

  if (f.state !== 'dodge') applyGravity(f, input);

  const result = moveAndCollide(f, solids, f.dropTicks > 0);
  if (result.hitCeiling) f.canCutJump = false;

  f.grounded = result.landed;
  f.onPlatform = result.floorKind === 'platform';
  if (f.grounded) {
    f.airJumpsLeft = s.airJumps;
    f.wallJumpsUsed = 0;
    f.airDodgeUsed = false;
    f.fastFalling = false;
    f.canCutJump = false;
    f.coyoteTicks = COYOTE_TICKS;
    if (f.state === 'dodge') setState(f, 'idle');
  }
  // Ao sair da borda sem pular, coyoteTicks segue contando a partir do último tick no chão.

  f.wallDir = f.grounded ? 0 : touchingWall(f, solids);
  if (f.wallDir !== 0) f.fastFalling = false;

  updateState(f, input);
  f.prevInput = input;
}

/** Deriva o estado de movimento livre a partir da física. */
function updateState(f: Fighter, input: InputMask): void {
  if (f.state === 'dash' || f.state === 'dodge') return;
  if (f.grounded) {
    setState(f, axisX(input) !== 0 || f.vx !== 0 ? 'run' : 'idle');
  } else if (f.wallDir !== 0 && axisX(input) === f.wallDir && f.vy > 0) {
    setState(f, 'wallslide');
  } else {
    setState(f, f.vy < 0 ? 'jump' : 'fall');
  }
}
