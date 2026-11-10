import { px } from './constants';
import { axisX, axisY, Button, isHeld, isPressed, type InputMask } from './input';
import { approach, idiv, isqrt } from './math';
import { getCharacter, BASE_CHARACTER_ID } from './characters';
import type { Character } from './character';
import {
  isActiveFrame,
  selectAttack,
  selectSpecial,
  totalFrames,
  type MoveDef,
  type MoveId,
} from './moves';
import { moveAndCollide, touchingWall, type Body, type Solid } from './physics';
import { spawnProjectile, type Projectile } from './projectile';
import type { Spawn } from './stage';
import type { FighterStats } from './stats';

export { DEFAULT_STATS, type FighterStats } from './stats';

/** Ticks de tolerância para pular logo depois de sair da borda. */
export const COYOTE_TICKS = 5;
/** Ticks em que um aperto de pulo, ataque ou especial fica guardado esperando ser possível. */
export const JUMP_BUFFER_TICKS = 6;
export const ACTION_BUFFER_TICKS = 6;
/** Ticks ignorando plataformas depois de ↓ em cima de uma. */
export const DROP_THROUGH_TICKS = 10;

/** Borda: distância horizontal da quina em que o lutador agarra. */
export const LEDGE_GRAB_X = px(20);
/** Borda: tolerância vertical em volta da posição pendurada. */
export const LEDGE_GRAB_Y = px(28);
/** Pendurado, o topo do corpo fica esta altura acima da quina (as mãos em cima). */
export const LEDGE_HANG_Y = px(14);
/** Ticks pendurado antes de aceitar subir, pular ou soltar (evita sair sem querer). */
export const LEDGE_MIN_TICKS = 6;
/** Ticks sem poder agarrar de novo depois de soltar ou pular da borda. */
export const LEDGE_REGRAB_TICKS = 30;

/** Quanto o knockback perde por tick, ao longo da direção do arremesso (subpx/tick). */
export const KNOCKBACK_DECAY = px(0.38);
/** Freio horizontal mínimo do knockback deslizando no chão. */
export const KNOCKBACK_GROUND_DECAY = px(1.5);

/**
 * Estados do lutador. Os "livres" (idle, run, jump, fall, wallslide) saem da
 * física; os outros têm regras próprias e duração.
 */
export type FighterState =
  | 'idle'
  | 'run'
  | 'jump'
  | 'fall'
  | 'wallslide'
  | 'dash'
  | 'dodge'
  | 'attack'
  | 'landing'
  | 'ledge'
  | 'hitstun'
  | 'grabbed'
  | 'taunt'
  | 'ko';

export interface Fighter extends Body {
  id: number;
  /** Id da ficha do personagem: golpes e especial vêm dela (`getCharacter`). */
  character: string;
  /** Copiados da ficha ao criar o lutador. */
  stats: FighterStats;
  /** Dano acumulado, em %. Quanto maior, mais longe voa. */
  damage: number;
  /** Vidas restantes. Com 0 e em KO, está fora da luta. */
  stocks: number;
  /** Ticks em KO até reaparecer. */
  respawnTicks: number;
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
  /** Velocidade do arremesso (knockback), somada à do lutador; freia `kbDecay` por tick. */
  kbx: number;
  kby: number;
  kbDecayX: number;
  kbDecayY: number;
  /** Quina agarrada (estado `ledge`), em subpx. */
  ledgeX: number;
  ledgeY: number;
  ledgeCooldown: number;
  /** Ticks congelado pelo impacto de um golpe (hitstop). */
  hitstop: number;
  /** Ticks até poder usar o especial de novo. */
  specialCooldown: number;
  /** Especial "1 vez por ar" já usado neste ar. */
  specialUsed: boolean;
  /** Buff temporário (bloco `buff`): ticks restantes e percentuais (100 = normal). */
  buffTicks: number;
  buffDamage: number;
  buffSpeed: number;
  buffWeight: number;
  /** Agarrado: id de quem segura (-1 = ninguém). */
  grabbedBy: number;
  /** Segurando alguém (bloco `grab`): ticks até arremessar. */
  grabTicks: number;
  prevInput: InputMask;
}

export function jumpVelocity(gravity: number, height: number): number {
  return isqrt(2 * gravity * height);
}

export function createFighter(
  id: number,
  spawn: Spawn,
  character: string = BASE_CHARACTER_ID,
): Fighter {
  const stats = getCharacter(character).stats;
  const f: Fighter = {
    id,
    character,
    stats,
    damage: 0,
    stocks: 1,
    respawnTicks: 0,
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
    kbx: 0,
    kby: 0,
    kbDecayX: 0,
    kbDecayY: 0,
    ledgeX: 0,
    ledgeY: 0,
    ledgeCooldown: 0,
    hitstop: 0,
    specialCooldown: 0,
    specialUsed: false,
    buffTicks: 0,
    buffDamage: 100,
    buffSpeed: 100,
    buffWeight: 100,
    grabbedBy: -1,
    grabTicks: 0,
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
  f.kbx = 0;
  f.kby = 0;
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
  f.ledgeCooldown = 0;
  f.hitstop = 0;
  f.specialCooldown = 0;
  clearBuff(f);
  f.grabbedBy = -1;
  f.grabTicks = 0;
  setState(f, 'fall');
}

/** Devolve pulos aéreos, wall jumps, dodge aéreo e recuperação. */
function refreshAirOptions(f: Fighter): void {
  f.airJumpsLeft = f.stats.airJumps;
  f.wallJumpsUsed = 0;
  f.airDodgeUsed = false;
  f.recoveryUsed = false;
  f.specialUsed = false;
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

/** Ficha do personagem do lutador. */
export function characterOf(f: Pick<Fighter, 'character'>): Character {
  return getCharacter(f.character);
}

/** Um golpe do lutador: o do moveset base ajustado pela ficha, ou o especial. */
export function moveDef(f: Pick<Fighter, 'character'>, id: MoveId): MoveDef {
  const c = characterOf(f);
  if (id !== 'special') return c.moves[id];
  if (!c.special) throw new Error(`${c.id} não tem especial`);
  return c.special.move;
}

/** Golpe em andamento, se houver. */
export function currentMove(f: Fighter): MoveDef | null {
  return f.move ? moveDef(f, f.move) : null;
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
  const move = moveDef(f, id);
  f.move = id;
  f.moveHits = 0;
  f.attackBufferTicks = 0;
  f.specialBufferTicks = 0;
  if (move.turns) {
    const dir = axisX(input);
    if (dir !== 0) f.facing = dir;
  }
  if (id === 'recovery') f.recoveryUsed = true;
  if (id === 'special') {
    const special = characterOf(f).special;
    f.specialCooldown = special?.cooldownTicks ?? 0;
    if (special?.oncePerAir && !f.grounded) f.specialUsed = true;
  }
  enterState(f, 'attack');
  moveFrameEffects(f);
}

/** O especial do personagem pode sair agora (existe, recarregou e, no ar, não foi usado). */
export function canUseSpecial(f: Fighter): boolean {
  const special = characterOf(f).special;
  if (!special || f.specialCooldown > 0) return false;
  return !(special.oncePerAir && f.specialUsed && !f.grounded);
}

/** Tenta gastar o ataque ou especial guardado. */
function tryAttack(f: Fighter, input: InputMask): boolean {
  if (f.attackBufferTicks > 0) {
    startMove(f, selectAttack(f.grounded, input, !f.recoveryUsed), input);
    return true;
  }
  if (f.specialBufferTicks > 0) {
    const special = selectSpecial(f.grounded, input, canUseSpecial(f));
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
  const walkSpeed = idiv(s.walkSpeed * f.buffSpeed, 100);
  const airSpeed = idiv(s.airSpeed * f.buffSpeed, 100);
  if (f.grounded) {
    if (dir !== 0) {
      if (turn) f.facing = dir;
      f.vx = approach(f.vx, dir * walkSpeed, s.groundAccel);
    } else {
      f.vx = approach(f.vx, 0, s.groundFriction);
    }
  } else if (dir !== 0) {
    // No ar, não freia quem já está mais rápido que airSpeed (ex.: saiu de um dash).
    const target = dir * airSpeed;
    if (dir * f.vx < airSpeed) f.vx = approach(f.vx, target, s.airAccel);
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
  if (f.grounded && isPressed(input, prev, Button.TAUNT)) {
    enterState(f, 'taunt', characterOf(f).taunt.durationTicks);
    return;
  }

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
function stepAttack(f: Fighter, input: InputMask, prev: InputMask, world: World): void {
  const move = currentMove(f);
  if (f.grabTicks > 0) {
    // Segurando: o golpe fica parado neste frame; ←/→ escolhe para onde arremessar.
    f.stateTicks--;
    f.vx = 0;
    f.vy = 0;
    const dir = axisX(input);
    if (dir !== 0) f.facing = dir;
    return;
  }
  if (!move || moveFrame(f) > totalFrames(move)) {
    finishAction(f, input, prev);
    return;
  }
  // No ar dá para mirar; no chão só anda se o golpe permitir (`canWalk`). Nunca vira.
  moveHorizontally(f, f.grounded && !move.canWalk ? 0 : axisX(input), false);
  cutJump(f, input);
  moveFrameEffects(f);
  if (moveFrame(f) === move.startup + 1) fireBlocks(f, move, input, world);
}

/**
 * Blocos instantâneos do especial, no 1º frame ativo. Roda 1 vez por golpe: o
 * frame só avança fora do hitstop.
 */
function fireBlocks(f: Fighter, move: MoveDef, input: InputMask, world: World): void {
  if (move.teleport) teleport(f, move.teleport, input, world.solids);
  if (move.buff) {
    f.buffTicks = move.buff.durationTicks;
    f.buffDamage = move.buff.damagePercent;
    f.buffSpeed = move.buff.speedPercent;
    f.buffWeight = move.buff.weightPercent;
  }
  if (move.projectile) {
    const p = spawnProjectile(f, move.projectile);
    p.hit.damage = dealtDamage(f, p.hit.damage);
    world.projectiles?.push(p);
  }
}

/**
 * Teleporte: some e reaparece a `distance` na direção apertada (8 direções; sem
 * direção, para a frente). Não atravessa blocos sólidos: para encostado neles.
 */
function teleport(
  f: Fighter,
  def: NonNullable<MoveDef['teleport']>,
  input: InputMask,
  solids: readonly Solid[],
): void {
  let dx: number = axisX(input);
  const dy = axisY(input);
  if (dx === 0 && dy === 0) dx = f.facing;
  // Na diagonal, cada eixo anda distância × cos 45°.
  const dist = dx !== 0 && dy !== 0 ? idiv(def.distance * 707, 1000) : def.distance;
  f.vx = dx * dist;
  f.vy = dy * dist;
  moveAndCollide(f, solids, dy > 0);
  f.vx = 0;
  f.vy = 0;
  f.fastFalling = false;
  if (dx !== 0) f.facing = dx > 0 ? 1 : -1;
  f.invulnTicks = Math.max(f.invulnTicks, def.invulnTicks);
}

function clearBuff(f: Fighter): void {
  f.buffTicks = 0;
  f.buffDamage = 100;
  f.buffSpeed = 100;
  f.buffWeight = 100;
}

/** Dano que o lutador causa, com o buff ativo. */
export function dealtDamage(f: Fighter, damage: number): number {
  return idiv(damage * f.buffDamage, 100);
}

/** Peso que vale no knockback, com o buff ativo. */
export function effectiveWeight(f: Fighter): number {
  return idiv(f.stats.weight * f.buffWeight, 100);
}

/** Efeitos de movimento do frame atual do golpe (impulso, ground pound, investida). */
function moveFrameEffects(f: Fighter): void {
  if (!f.move) return;
  const move = moveDef(f, f.move);
  const frame = moveFrame(f);
  if (move.dash && isActiveFrame(move, frame)) {
    // Investida: reta, na velocidade da ficha; no ar não cai (e é mais curta).
    f.vx = f.facing * (f.grounded ? move.dash.speed : move.dash.airSpeed);
    if (!f.grounded) {
      f.vy = 0;
      f.fastFalling = false;
    }
  } else if (move.dash && frame === move.startup + move.active + 1) {
    // Fim da investida: freia para a velocidade normal (não escorrega para fora do palco).
    const max = f.grounded ? f.stats.walkSpeed : f.stats.airSpeed;
    f.vx = Math.max(-max, Math.min(max, f.vx));
  }
  if (move.impulse?.frame === frame) {
    if (move.impulse.x !== undefined) f.vx = f.facing * move.impulse.x;
    if (move.impulse.y !== undefined) {
      f.vy = move.impulse.y;
      f.fastFalling = false;
      f.canCutJump = false;
    }
  }
  if (move.hoverStartup && !f.grounded && frame <= move.startup) {
    f.vx = 0;
    f.vy = 0;
    f.fastFalling = false;
  } else if (move.fallSpeed !== undefined && frame <= move.startup + move.active) {
    f.vx = 0;
    f.vy = move.fallSpeed;
  }
}

/** Saiu da blast zone: perde 1 stock e sai de cena até reaparecer (se ainda tiver stock). */
export function knockOut(f: Fighter, respawnDelay: number): void {
  f.stocks = Math.max(0, f.stocks - 1);
  f.damage = 0;
  f.vx = 0;
  f.vy = 0;
  f.kbx = 0;
  f.kby = 0;
  f.hitstop = 0;
  f.move = null;
  f.respawnTicks = respawnDelay;
  f.grabbedBy = -1;
  f.grabTicks = 0;
  enterState(f, 'ko');
}

/** Reaparece no ponto dado, com 0% e invencível por `invulnTicks`. */
export function respawn(f: Fighter, point: Spawn, invulnTicks: number): void {
  placeAtSpawn(f, point);
  f.damage = 0;
  f.respawnTicks = 0;
  f.invulnTicks = invulnTicks;
}

/**
 * Levou um golpe: perde o golpe em andamento e fica sem agir por `ticks`.
 * Ser acertado devolve pulo aéreo, dodge e recuperação, para dar chance de voltar.
 */
export function enterHitstun(f: Fighter, ticks: number): void {
  f.move = null;
  f.fastFalling = false;
  f.canCutJump = false;
  refreshAirOptions(f);
  f.grabbedBy = -1;
  f.grabTicks = 0;
  enterState(f, 'hitstun', ticks);
}

/** Foi agarrado por `holder`: perde o golpe em andamento e para onde está. */
export function enterGrabbed(f: Fighter, holder: number): void {
  f.move = null;
  f.vx = 0;
  f.vy = 0;
  f.kbx = 0;
  f.kby = 0;
  f.fastFalling = false;
  f.canCutJump = false;
  f.grabTicks = 0;
  f.grabbedBy = holder;
  enterState(f, 'grabbed');
}

/** Quem segurava largou (levou golpe, saiu de cena): volta a cair, livre. */
export function releaseGrabbed(f: Fighter): void {
  f.grabbedBy = -1;
  enterState(f, 'fall');
}

/** Encerra a janela ativa já (agarrão, contra-ataque): o frame atual vira o 1º do recovery. */
export function skipToRecovery(f: Fighter): void {
  const move = f.state === 'attack' ? currentMove(f) : null;
  if (move) f.stateTicks = Math.max(f.stateTicks, move.startup + move.active);
}

/** Hitstun: sem controle; o corpo só freia e cai até o tempo acabar. */
function stepHitstun(f: Fighter, input: InputMask, prev: InputMask): void {
  if (f.stateTicks >= f.stateDuration) {
    finishAction(f, input, prev);
    return;
  }
  moveHorizontally(f, 0, false);
}

/**
 * Provocação: parado até a animação acabar (só desfaz levando golpe ou saindo do
 * chão). Sem efeito de jogo: o resto é animação e áudio.
 */
function stepTaunt(f: Fighter, input: InputMask, prev: InputMask): void {
  if (f.stateTicks >= f.stateDuration || !f.grounded) {
    finishAction(f, input, prev);
    return;
  }
  moveHorizontally(f, 0, false);
}

/** Pouso no meio de um aéreo: parado alguns ticks. */
function stepLanding(f: Fighter, input: InputMask, prev: InputMask): void {
  if (f.stateTicks >= f.stateDuration) {
    finishAction(f, input, prev);
    return;
  }
  moveHorizontally(f, 0, false);
}

/** Pendurado na borda: ↑ ou na direção do palco sobe, pulo pula, ↓ ou para fora solta. */
function stepLedge(f: Fighter, input: InputMask): void {
  f.vx = 0;
  f.vy = 0;
  if (f.stateTicks < LEDGE_MIN_TICKS) return;
  const dirX = axisX(input);
  const dirY = axisY(input);
  if (f.jumpBufferTicks > 0) {
    f.vy = -jumpVelocity(f.stats.gravity, f.stats.jumpHeight);
    f.canCutJump = true;
    f.jumpBufferTicks = 0;
    f.ledgeCooldown = LEDGE_REGRAB_TICKS;
    enterState(f, 'jump');
  } else if (dirY < 0 || dirX === f.facing) {
    f.x = f.facing === 1 ? f.ledgeX : f.ledgeX - f.w;
    f.y = f.ledgeY - f.h;
    f.grounded = true;
    enterState(f, 'idle');
  } else if (dirY > 0 || dirX === -f.facing) {
    f.ledgeCooldown = LEDGE_REGRAB_TICKS;
    enterState(f, 'fall');
  }
}

/**
 * Agarra a quina de cima de um bloco sólido quando cai do lado dela, com as mãos
 * na altura certa. Segurar ↓ não agarra.
 */
function tryGrabLedge(f: Fighter, input: InputMask, solids: readonly Solid[]): void {
  if (!isFree(f) || f.grounded || f.ledgeCooldown > 0 || f.vy + f.kby < 0) return;
  if (isHeld(input, Button.DOWN)) return;
  for (const s of solids) {
    if (s.kind !== 'solid') continue;
    if (Math.abs(f.y - (s.y - LEDGE_HANG_Y)) > LEDGE_GRAB_Y) continue;
    const right = f.x + f.w;
    if (right <= s.x && right >= s.x - LEDGE_GRAB_X) {
      grabLedge(f, s.x, s.y, 1);
      return;
    }
    if (f.x >= s.x + s.w && f.x <= s.x + s.w + LEDGE_GRAB_X) {
      grabLedge(f, s.x + s.w, s.y, -1);
      return;
    }
  }
}

function grabLedge(f: Fighter, cornerX: number, cornerY: number, facing: -1 | 1): void {
  f.x = facing === 1 ? cornerX - f.w : cornerX;
  f.y = cornerY - LEDGE_HANG_Y;
  f.vx = 0;
  f.vy = 0;
  f.facing = facing;
  f.ledgeX = cornerX;
  f.ledgeY = cornerY;
  f.fastFalling = false;
  f.canCutJump = false;
  refreshAirOptions(f);
  enterState(f, 'ledge');
}

/** Golpe que controla a própria velocidade vertical neste frame (sem gravidade). */
function moveOverridesGravity(f: Fighter): boolean {
  if (f.state !== 'attack' || !f.move) return false;
  if (f.grabTicks > 0) return true;
  const move = moveDef(f, f.move);
  const frame = moveFrame(f);
  // Parado no ar no startup (só no ar: no chão, sem gravidade, ele "sairia" do chão).
  if (move.hoverStartup && !f.grounded && frame <= move.startup) return true;
  if (move.dash && !f.grounded && isActiveFrame(move, frame)) return true;
  return move.fallSpeed !== undefined && isActiveFrame(move, frame);
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
  const move = moveDef(f, f.move);
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

/** O que o lutador enxerga do resto da luta num tick. */
interface World {
  solids: readonly Solid[];
  /** Onde entram os projéteis soltos (sem isso, não solta). */
  projectiles: Projectile[] | undefined;
}

/**
 * Avança um lutador um tick. `projectiles` é a lista da luta, onde entram os
 * projéteis que ele soltar.
 */
export function stepFighter(
  f: Fighter,
  input: InputMask,
  solids: readonly Solid[],
  projectiles?: Projectile[],
): void {
  const world: World = { solids, projectiles };
  // Hitstop: congelado no impacto. O input anterior não muda, então um botão
  // apertado durante o congelamento vale como aperto quando ele acaba.
  if (f.hitstop > 0) {
    f.hitstop--;
    return;
  }
  // Em KO o lutador está fora de cena; quem conta o respawn é o jogo.
  if (f.state === 'ko') {
    f.prevInput = input;
    return;
  }
  const prev = f.prevInput;

  f.stateTicks++;
  if (f.dashCooldown > 0) f.dashCooldown--;
  if (f.dropTicks > 0) f.dropTicks--;
  if (f.invulnTicks > 0) f.invulnTicks--;
  if (f.coyoteTicks > 0) f.coyoteTicks--;
  if (f.jumpBufferTicks > 0) f.jumpBufferTicks--;
  if (f.attackBufferTicks > 0) f.attackBufferTicks--;
  if (f.specialBufferTicks > 0) f.specialBufferTicks--;
  if (f.specialCooldown > 0) f.specialCooldown--;
  if (f.buffTicks > 0 && --f.buffTicks === 0) clearBuff(f);
  if (f.ledgeCooldown > 0) f.ledgeCooldown--;
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
      stepAttack(f, input, prev, world);
      break;
    case 'landing':
      stepLanding(f, input, prev);
      break;
    case 'taunt':
      stepTaunt(f, input, prev);
      break;
    case 'ledge':
      stepLedge(f, input);
      break;
    case 'grabbed':
      // Preso: quem segura (combat.stepGrabs) decide onde fica e quando solta.
      break;
    case 'hitstun':
      stepHitstun(f, input, prev);
      break;
    default:
      controlFree(f, input, prev);
  }

  // Pendurado ou agarrado não tem física: fica preso na quina ou em quem segura.
  if (f.state !== 'ledge' && f.state !== 'grabbed') {
    integrate(f, input, solids);
    tryGrabLedge(f, input, solids);
    updateState(f, input);
  }
  f.prevInput = input;
}

/** Gravidade, movimento com colisão e o que muda ao tocar chão e parede. */
function integrate(f: Fighter, input: InputMask, solids: readonly Solid[]): void {
  const wasGrounded = f.grounded;
  if (f.state !== 'dodge' && !moveOverridesGravity(f)) applyGravity(f, input);
  decayKnockback(f, wasGrounded);

  // O knockback soma com a velocidade do próprio lutador, mas é freado à parte:
  // pular ou dar dodge depois do hitstun não cancela o arremesso.
  const ownVx = f.vx;
  const ownVy = f.vy;
  f.vx += f.kbx;
  f.vy += f.kby;
  const result = moveAndCollide(f, solids, f.dropTicks > 0);
  f.vx = ownVx;
  f.vy = ownVy;
  if (result.hitWall !== 0) {
    f.vx = 0;
    f.kbx = 0;
  }
  if (result.landed || result.hitCeiling) {
    f.vy = 0;
    f.kby = 0;
  }
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
    setState(f, f.vy + f.kby < 0 ? 'jump' : 'fall');
  }
}

/** Freia o knockback; no chão ele morre mais rápido (atrito). */
function decayKnockback(f: Fighter, grounded: boolean): void {
  if (f.kbx !== 0) {
    const decay = grounded ? Math.max(f.kbDecayX, KNOCKBACK_GROUND_DECAY) : f.kbDecayX;
    f.kbx = approach(f.kbx, 0, decay);
  }
  if (f.kby !== 0) f.kby = approach(f.kby, 0, f.kbDecayY);
}
