import { bombOn, type Bomb } from '../bomb';
import { activeHitboxes, isCountering, knockback } from '../combat';
import { px } from '../constants';
import {
  canUseSpecial,
  characterOf,
  effectiveWeight,
  hasBuff,
  isFree,
  LEDGE_MIN_TICKS,
  moveDef,
  moveFrame,
  stepFighter,
  type Fighter,
} from '../fighter';
import { getStage, type GameState } from '../game';
import { axisX, Button, INPUT_BITS, NO_INPUT, type InputMask } from '../input';
import { idiv } from '../math';
import { totalFrames, type MoveDef, type MoveId } from '../moves';
import { overlaps, type Box } from '../physics';
import { stepProjectiles, type Projectile } from '../projectile';
import { rngChance, rngInt, seedRng, type RngHolder } from '../rng';
import { BOT_PROFILES, type BotLevel, type BotProfile } from './levels';
import { cloneFighter, predictFighter, predictPath, probeMove } from './lookahead';
import {
  chooseRecovery,
  recoveryActionInput,
  recoveryEdge,
  recoveryInput,
  type RecoveryAction,
} from './recovery';
import {
  centerX,
  edgeAhead,
  feetY,
  isOffstage,
  nearestEdge,
  terrainOf,
  type Terrain,
} from './terrain';

/**
 * Bot: um "controle" a mais. A cada tick lê o estado da luta e devolve a bitmask
 * de botões do lutador dele, como uma pessoa apertando um controle. O `sim` não
 * sabe quem é bot.
 *
 * Para parecer gente e não um robô perfeito:
 * - vê os adversários com atraso (tempo de reação) e só prevê parte do movimento;
 * - decide de tempos em tempos e segura o plano (aproximar, esperar, fugir…);
 * - aperta e solta os botões, hesita, erra a distância e o golpe às vezes;
 * - se defende só de parte dos golpes, e só dos que dá tempo de ver;
 * - provoca depois de tirar uma vida, se distrai, pressiona na borda.
 *
 * Nunca lê o input dos outros, só o que está na tela. Tem RNG próprio (com seed),
 * fora do estado da luta: a mesma luta com a mesma seed dá os mesmos inputs.
 */

export interface BotOptions {
  /** Id do lutador que o bot controla. */
  id: number;
  level: BotLevel;
  /** Seed do RNG do bot. */
  seed: number;
}

/** O que o bot está tentando fazer agora (o plano dura alguns ticks). */
export type BotPlanKind =
  | 'approach'
  | 'space'
  | 'retreat'
  | 'jumpIn'
  | 'edgeguard'
  | 'center'
  | 'idle'
  | 'chase'
  | 'zone'
  | 'avoid'
  | 'hunt';

/** Nome do plano no overlay de debug. */
const PLAN_LABELS: Readonly<Record<BotPlanKind, string>> = {
  approach: 'aproximar',
  space: 'esperar na distância',
  retreat: 'recuar',
  jumpIn: 'entrar pulando',
  edgeguard: 'pressionar na borda',
  center: 'voltar ao meio',
  idle: 'distraído',
  chase: 'seguir o combo',
  zone: 'atirar de longe',
  avoid: 'fugir da bomba',
  hunt: 'passar a bomba',
};

interface Plan {
  kind: BotPlanKind;
  /** Tick em que o plano acaba. */
  until: number;
  /** Distância que quer manter (esperar, atirar de longe). */
  spacing: number;
  /** Para onde anda quando está à toa (-1, 0, 1). */
  wander: -1 | 0 | 1;
  /** Já pulou (entrar pulando). */
  jumped: boolean;
}

/** O que o bot viu num tick (cópia: o estado da luta muda depois). */
interface Snapshot {
  tick: number;
  fighters: Fighter[];
  projectiles: Projectile[];
  bombs: Bomb[];
}

/** Um adversário como o bot enxerga: com atraso e com a parte prevista. */
interface Foe {
  /** Como estava `reaction` ticks atrás. */
  seen: Fighter;
  /** Onde o bot acha que ele está agora (o visto, avançado pelo quanto prevê). */
  now: Fighter;
  /** Caminho previsto do corpo a partir de agora (`path[k]` = daqui a k + 1 ticks). */
  path: Box[];
  /** Tick em que o bot o viu. */
  seenTick: number;
}

interface Recovering {
  since: number;
  nextCheck: number;
  /** Erro desta volta: gastar tudo de cara, ou demorar para reagir. */
  mistake: 'none' | 'panic' | 'late';
}

interface LedgeChoice {
  /** Tick em que agarrou (para saber que é a mesma borda). */
  since: number;
  wait: number;
  action: 'getup' | 'jump';
}

/** Golpe que o bot pode tentar: o que apertar e o que segurar depois. */
interface Candidate {
  move: MoveId;
  press: InputMask;
  hold: InputMask;
  maxTicks: number;
}

/** Ticks guardados do que o bot viu (o maior tempo de reação cabe aqui). */
const HISTORY = 48;
/** Ticks de caminho previsto do adversário (para os testes de golpe). */
const PATH_TICKS = 50;

function sign(n: number): -1 | 0 | 1 {
  return n > 0 ? 1 : n < 0 ? -1 : 0;
}

/** Lado contrário. */
function flip(dir: -1 | 1): -1 | 1 {
  return dir === 1 ? -1 : 1;
}

/** Direção de `n`, ou `fallback` quando é 0. */
function sideOf(n: number, fallback: -1 | 1): -1 | 1 {
  return n > 0 ? 1 : n < 0 ? -1 : fallback;
}

function dirBits(dir: number): InputMask {
  return dir < 0 ? Button.LEFT : dir > 0 ? Button.RIGHT : NO_INPUT;
}

function snapshot(state: GameState): Snapshot {
  return {
    tick: state.tick,
    fighters: state.fighters.map((f) => ({ ...f })),
    projectiles: state.projectiles.map((p) => ({ ...p, hit: { ...p.hit } })),
    bombs: state.bombs.map((b) => ({ ...b })),
  };
}

/** Lutador no fim de um golpe (recovery) ou parado no pouso: exposto. */
function inEndlag(f: Fighter): boolean {
  if (f.state === 'landing') return true;
  if (f.state !== 'attack' || !f.move) return false;
  const move = moveDef(f, f.move);
  return moveFrame(f) > move.startup + move.active;
}

/** Ainda tem ticks de golpe pela frente (startup ou active). */
function attacking(f: Fighter): boolean {
  if (f.state !== 'attack' || !f.move) return false;
  const move = moveDef(f, f.move);
  return moveFrame(f) <= move.startup + move.active;
}

/** O especial bate (tem hitbox ou projétil): serve para atacar. */
function specialStrikes(move: MoveDef | undefined): boolean {
  if (!move) return false;
  return move.projectile !== undefined || (move.hitboxes.length > 0 && move.counter === undefined);
}

export class Bot {
  readonly id: number;
  readonly level: BotLevel;
  readonly profile: BotProfile;
  private readonly rng: RngHolder;
  private history: Snapshot[] = [];
  private macro: InputMask[] = [];
  private plan: Plan = { kind: 'space', until: 0, spacing: px(200), wander: 0, jumped: false };
  private lastOut: InputMask = NO_INPUT;
  private reaction: number;
  private nextThink = 0;
  /** Próximo tick em que pode sortear um ataque (hesitação entre um e outro). */
  private attackAt = 0;
  /** Próximo tick em que pode dar dash. */
  private dashAt = 0;
  /** Golpes e projéteis já sorteados na defesa (cada um sorteia uma vez). */
  private handled = new Set<string>();
  /** Provocação pendente até este tick (-1 = nenhuma). */
  private tauntUntil = -1;
  private ledge: LedgeChoice | null = null;
  private recovering: Recovering | null = null;
  private targetId = -1;
  private targetUntil = 0;
  /** Último tick processado (o mesmo tick duas vezes não sorteia de novo). */
  private lastTick = -1;
  private status = '';

  constructor(options: BotOptions) {
    this.id = options.id;
    this.level = options.level;
    this.profile = BOT_PROFILES[options.level];
    // seeds vizinhas (um bot por lutador) dão sequências bem diferentes
    this.rng = { rng: seedRng((options.seed ^ Math.imul(options.id + 1, 0x9e3779b9)) >>> 0) };
    this.reaction = this.profile.reaction;
  }

  /** O que o bot está fazendo agora (overlay de debug). */
  get doing(): string {
    return this.status;
  }

  /**
   * Input do lutador do bot para o próximo tick, olhando o estado atual (chamar
   * uma vez por tick, antes do `stepGame`).
   */
  next(state: GameState): InputMask {
    if (state.tick === this.lastTick) return this.lastOut;
    this.lastTick = state.tick;
    this.remember(state);
    const me = state.fighters[this.id];
    if (!me || state.phase !== 'fight' || me.state === 'ko' || me.stocks <= 0) {
      this.macro = [];
      this.recovering = null;
      this.status = state.phase === 'countdown' ? 'esperando a luta' : 'fora';
      return this.out(NO_INPUT);
    }
    const terrain = terrainOf(getStage(state.stageId));
    this.watchEvents(state, me);
    const foes = this.look(me, terrain);
    const target = this.pickTarget(state.tick, me, foes);

    if (me.state === 'hitstun' || me.state === 'grabbed') {
      this.macro = [];
      this.status = 'apanhando';
      return this.out(NO_INPUT);
    }
    if (me.state === 'ledge') return this.out(this.onLedge(state.tick, me, target));
    this.ledge = null;
    if (isOffstage(terrain, me)) {
      this.macro = [];
      return this.out(this.onRecover(state.tick, me, terrain));
    }
    this.recovering = null;

    const queued = this.macro.shift();
    if (queued !== undefined) return this.out(this.edgeSafe(me, terrain, queued));

    const defense = this.defend(state.tick, me, terrain, foes);
    if (defense !== null) return this.out(defense);

    if (state.tick >= this.nextThink || state.tick >= this.plan.until) {
      this.decide(state, me, terrain, target);
      const now = this.macro.shift();
      if (now !== undefined) return this.out(now);
    }
    return this.out(this.act(state, me, terrain, target));
  }

  // -------------------------------------------------------------------------
  // Percepção

  private remember(state: GameState): void {
    // luta nova (revanche) com o mesmo bot: esquece a anterior
    const last = this.history[this.history.length - 1];
    if (last && state.tick <= last.tick) this.reset();
    this.history.push(snapshot(state));
    if (this.history.length > HISTORY) this.history.shift();
  }

  /** Esquece tudo (luta nova). */
  reset(): void {
    this.history = [];
    this.macro = [];
    this.lastOut = NO_INPUT;
    this.nextThink = 0;
    this.attackAt = 0;
    this.dashAt = 0;
    this.handled.clear();
    this.tauntUntil = -1;
    this.ledge = null;
    this.recovering = null;
    this.targetId = -1;
    this.targetUntil = 0;
    this.plan = { kind: 'space', until: 0, spacing: px(200), wander: 0, jumped: false };
  }

  /** O que o bot viu `reaction` ticks atrás. */
  private seen(): Snapshot {
    const i = Math.max(0, this.history.length - 1 - this.reaction);
    const snap = this.history[i];
    if (!snap) throw new Error('bot sem histórico');
    return snap;
  }

  /** Os adversários como o bot enxerga agora. */
  private look(me: Fighter, terrain: Terrain): Foe[] {
    const snap = this.seen();
    const predict = idiv(this.reaction * this.profile.predict, 100);
    const foes: Foe[] = [];
    for (const o of snap.fighters) {
      if (o.id === me.id || o.team === me.team || o.stocks <= 0 || o.state === 'ko') continue;
      const now = predictFighter(o, terrain, predict);
      foes.push({ seen: o, now, path: predictPath(now, terrain, PATH_TICKS), seenTick: snap.tick });
    }
    return foes;
  }

  /** Alvo: o adversário mais perto, trocando de alvo só de vez em quando. */
  private pickTarget(tick: number, me: Fighter, foes: readonly Foe[]): Foe | null {
    const current = foes.find((f) => f.seen.id === this.targetId);
    if (current && tick < this.targetUntil) return current;
    let best: Foe | null = null;
    let bestGap = 0;
    for (const foe of foes) {
      const gap = Math.abs(centerX(foe.now) - centerX(me)) + Math.abs(feetY(foe.now) - feetY(me));
      if (!best || gap < bestGap) {
        best = foe;
        bestGap = gap;
      }
    }
    this.targetId = best?.seen.id ?? -1;
    this.targetUntil = tick + 60 + rngInt(this.rng, 60);
    return best;
  }

  /** Acertou alguém (segue o combo) ou tirou uma vida (provoca). */
  private watchEvents(state: GameState, me: Fighter): void {
    for (const e of state.events) {
      if (e.type === 'hit' && e.attacker === me.id && e.victim !== me.id) {
        const victim = state.fighters[e.victim];
        if (victim && victim.team !== me.team && rngChance(this.rng, this.profile.followUp)) {
          this.setPlan('chase', state.tick, 30 + rngInt(this.rng, 25));
        }
      } else if (e.type === 'ko') {
        const victim = state.fighters[e.fighter];
        if (victim && victim.team !== me.team && rngChance(this.rng, this.profile.taunt)) {
          this.tauntUntil = state.tick + 150;
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // Saída

  private out(mask: InputMask): InputMask {
    const m = mask & INPUT_BITS;
    this.lastOut = m;
    return m;
  }

  /**
   * Fila de inputs para apertar `bits` (segurando `hold` junto) por `ticks` ticks e
   * soltar. Se o botão estava apertado, solta antes (senão o aperto não conta).
   */
  private press(bits: InputMask, hold: InputMask, ticks = 2): InputMask {
    this.queue(bits, hold, ticks);
    return this.macro.shift() ?? NO_INPUT;
  }

  /** Põe na fila o aperto de `bits` (ver `press`), para sair a partir deste tick. */
  private queue(bits: InputMask, hold: InputMask, ticks = 2): void {
    const queue: InputMask[] = [];
    if (this.lastOut & bits) queue.push(hold);
    for (let i = 0; i < ticks; i++) queue.push(bits | hold);
    queue.push(hold);
    this.macro = queue;
  }

  /**
   * Não anda nem dá dash para fora do palco sem querer: perto da borda, solta a
   * direção (a não ser na pressão de borda, que chega mais perto).
   */
  private edgeSafe(me: Fighter, terrain: Terrain, mask: InputMask, close = false): InputMask {
    if (!me.grounded) return mask;
    let out = mask;
    const dir = axisX(out);
    if (dir !== 0) {
      const gap = edgeAhead(terrain, me, dir);
      const margin = close ? px(4) : px(20) + me.stats.walkSpeed * 3;
      if (gap !== null && gap < margin) out &= ~(Button.LEFT | Button.RIGHT);
    }
    if (out & Button.DODGE) {
      const dashDir = axisX(mask) || me.facing;
      const gap = edgeAhead(terrain, me, dashDir);
      if (gap !== null && gap < px(180)) out &= ~Button.DODGE;
    }
    return out;
  }

  // -------------------------------------------------------------------------
  // Borda e volta ao palco

  /** Pendurado: espera um pouco e sobe ou pula (mais rápido com o adversário perto). */
  private onLedge(tick: number, me: Fighter, target: Foe | null): InputMask {
    const since = tick - me.stateTicks;
    if (this.ledge?.since !== since) {
      const extra = { easy: 30, medium: 18, hard: 12 }[this.level];
      const close = target !== null && Math.abs(centerX(target.now) - centerX(me)) < px(160);
      this.ledge = {
        since,
        wait: LEDGE_MIN_TICKS + rngInt(this.rng, extra),
        // com o adversário esperando em cima, pular é mais seguro que subir na cara dele
        action: rngChance(this.rng, close ? 60 : 30) ? 'jump' : 'getup',
      };
    }
    this.status = 'pendurado na borda';
    if (me.stateTicks < this.ledge.wait) return NO_INPUT;
    if (this.ledge.action === 'jump') {
      this.status = 'pulando da borda';
      return this.lastOut & Button.JUMP ? NO_INPUT : Button.JUMP;
    }
    this.status = 'subindo da borda';
    return dirBits(me.facing);
  }

  /** Fora do palco: volta, gastando o mínimo que der conta. */
  private onRecover(tick: number, me: Fighter, terrain: Terrain): InputMask {
    let rec = this.recovering;
    if (!rec) {
      const roll = rngInt(this.rng, 100);
      const mistake =
        roll < this.profile.recoveryMistake ? (roll % 2 === 0 ? 'panic' : 'late') : 'none';
      rec = { since: tick, nextCheck: tick, mistake };
      this.recovering = rec;
    }
    const edge = recoveryEdge(terrain, me);
    if (!edge) return NO_INPUT;
    this.status = 'voltando ao palco';
    // demorou para perceber que caiu: só vai para a borda
    if (rec.mistake === 'late' && tick - rec.since < 16) {
      this.status = 'voltando (atrasado)';
      return recoveryInput(me, edge, this.lastOut) & (Button.LEFT | Button.RIGHT);
    }
    if (tick < rec.nextCheck) return recoveryInput(me, edge, this.lastOut);
    rec.nextCheck = tick + 3;
    const action: RecoveryAction =
      rec.mistake === 'panic'
        ? this.panicRecovery(me)
        : chooseRecovery(me, terrain, edge, this.profile.recoveryMargin, this.lastOut);
    if (action === 'wait') return recoveryInput(me, edge, this.lastOut);
    this.status = `voltando: ${action}`;
    const input = recoveryActionInput(me, edge, action, this.lastOut);
    // o botão estava apertado: soltou agora, aperta no próximo tick
    if (!(input & (Button.JUMP | Button.SPECIAL | Button.DODGE | Button.ATTACK)))
      rec.nextCheck = tick + 1;
    return input;
  }

  /** Erro de quem caiu: gasta o pulo e a recuperação logo de cara. */
  private panicRecovery(me: Fighter): RecoveryAction {
    if (!isFree(me)) return 'wait';
    if (me.airJumpsLeft > 0) return 'jump';
    if (!me.recoveryUsed && me.vy >= 0) return 'recovery';
    return 'wait';
  }

  // -------------------------------------------------------------------------
  // Defesa

  /**
   * Golpe ou projétil vindo na direção do bot (que ele já viu): sorteia uma vez se
   * vai se defender e, se for, esquiva, pula, foge ou contra-ataca.
   */
  private defend(
    tick: number,
    me: Fighter,
    terrain: Terrain,
    foes: readonly Foe[],
  ): InputMask | null {
    if (!isFree(me) && me.state !== 'dash') return null;
    const body: Box = { x: me.x, y: me.y, w: me.w, h: me.h };
    for (const foe of foes) {
      const o = foe.now;
      if (!attacking(o) || !o.move) continue;
      const key = `${String(o.id)}:${String(foe.seenTick - foe.seen.stateTicks)}:${o.move}`;
      if (this.handled.has(key)) continue;
      const eta = this.strikeEta(o, terrain, body);
      if (eta < 0) continue;
      this.handled.add(key);
      if (!rngChance(this.rng, this.profile.defend)) continue;
      const away = sideOf(centerX(me) - centerX(o), flip(me.facing));
      return this.respond(me, terrain, eta, away, false);
    }
    const snap = this.seen();
    for (const p of snap.projectiles) {
      const owner = snap.fighters[p.owner];
      if (!owner || owner.team === me.team) continue;
      const key = `p:${String(p.owner)}:${String(snap.tick - (p.lifetime - p.ticksLeft))}`;
      if (this.handled.has(key)) continue;
      const eta = this.projectileEta(p, terrain, body);
      if (eta < 0) continue;
      this.handled.add(key);
      if (!rngChance(this.rng, this.profile.defend)) continue;
      return this.respond(me, terrain, eta, sideOf(p.vx, flip(me.facing)), true);
    }
    if (this.handled.size > 64) this.handled.clear();
    return null;
  }

  /** Ticks até o golpe do adversário encostar no corpo do bot (-1 = não encosta). */
  private strikeEta(o: Fighter, terrain: Terrain, body: Box): number {
    const c = cloneFighter(o);
    for (let t = 1; t <= 18; t++) {
      stepFighter(c, NO_INPUT, terrain.solids);
      if (c.state !== 'attack') return -1;
      if (activeHitboxes(c).some((h) => overlaps(h, body))) return t - this.lag();
    }
    return -1;
  }

  /** Ticks até o projétil encostar no corpo do bot (-1 = não encosta). */
  private projectileEta(p: Projectile, terrain: Terrain, body: Box): number {
    const list = [{ ...p, hit: { ...p.hit } }];
    for (let t = 1; t <= 24 && list.length > 0; t++) {
      stepProjectiles(list, terrain.solids, terrain.stage.blastZone);
      const q = list[0];
      if (q && overlaps(q, body)) return t - this.lag();
    }
    return -1;
  }

  /** Quanto do atraso o bot não compensa (o golpe está mais adiantado do que ele acha). */
  private lag(): number {
    return this.reaction - idiv(this.reaction * this.profile.predict, 100);
  }

  /** Reage a um golpe que chega em `eta` ticks (como o bot calcula, com erro). */
  private respond(
    me: Fighter,
    terrain: Terrain,
    eta: number,
    away: -1 | 1,
    projectile: boolean,
  ): InputMask | null {
    if (eta <= 0) return null; // já era: não deu tempo de ver
    const err = this.profile.dodgeError;
    const jitter = err > 0 ? rngInt(this.rng, err * 2 + 1) - err : 0;
    const special = characterOf(me).special;
    const counter = special?.move.counter ? special.move : null;
    if (counter && canUseSpecial(me) && rngChance(this.rng, this.profile.special)) {
      // contra-ataque: a janela ativa precisa cobrir a chegada do golpe
      this.status = 'contra-ataque';
      const wait = Math.max(0, eta - counter.startup - 3 + jitter);
      return this.after(wait, Button.SPECIAL, NO_INPUT);
    }
    if (!me.grounded) {
      if (me.airDodgeUsed) return null;
      this.status = 'esquiva';
      const wait = Math.max(0, eta - 3 + jitter);
      return this.after(wait, Button.DODGE, dirBits(away));
    }
    if (projectile || !rngChance(this.rng, 50)) {
      this.status = projectile ? 'pulando o projétil' : 'pulando para fugir';
      return this.press(Button.JUMP, dirBits(away), 10);
    }
    const awayDir = away;
    const room = edgeAhead(terrain, me, awayDir);
    if (me.dashCooldown === 0 && (room === null || room > px(200))) {
      this.status = 'dash para fugir';
      return this.press(Button.DODGE, dirBits(awayDir), 1);
    }
    this.status = 'pulando para fugir';
    return this.press(Button.JUMP, dirBits(away), 10);
  }

  /** Espera `wait` ticks (segurando nada) e aperta `bits` com `hold`. */
  private after(wait: number, bits: InputMask, hold: InputMask): InputMask {
    if (wait <= 0) return this.press(bits, hold, 1);
    const queue: InputMask[] = [];
    for (let i = 1; i < wait; i++) queue.push(NO_INPUT);
    queue.push(bits | hold, hold);
    this.macro = queue;
    return NO_INPUT;
  }

  // -------------------------------------------------------------------------
  // Decisão

  private setPlan(kind: BotPlanKind, tick: number, ticks: number): void {
    this.plan = {
      kind,
      until: tick + ticks,
      spacing: px(170 + rngInt(this.rng, 90)),
      wander: (rngInt(this.rng, 3) - 1) as -1 | 0 | 1,
      jumped: false,
    };
  }

  /** Escolhe o próximo plano, de tempos em tempos (cada nível pensa num ritmo). */
  private decide(state: GameState, me: Fighter, terrain: Terrain, target: Foe | null): void {
    const p = this.profile;
    const tick = state.tick;
    const j = p.reactionJitter;
    this.reaction = Math.max(2, p.reaction + rngInt(this.rng, j * 2 + 1) - j);
    const think = p.thinkMin + rngInt(this.rng, p.thinkMax - p.thinkMin + 1);
    this.nextThink = tick + think;
    // o plano de combo e o de borda seguem até acabar
    if (tick < this.plan.until && (this.plan.kind === 'chase' || this.plan.kind === 'edgeguard')) {
      return;
    }
    if (!target) {
      this.setPlan('center', tick, think);
      return;
    }
    if (rngChance(this.rng, p.distraction)) {
      this.setPlan('idle', tick, 25 + rngInt(this.rng, 40));
      return;
    }
    const seen = this.seen();
    if (bombOn(seen.bombs, me.id)) {
      this.setPlan('hunt', tick, think);
      return;
    }
    if (bombOn(seen.bombs, target.seen.id)) {
      this.setPlan('avoid', tick, think);
      return;
    }
    if (isOffstage(terrain, target.now) && rngChance(this.rng, p.edgeguard)) {
      this.setPlan('edgeguard', tick, 90 + rngInt(this.rng, 60));
      return;
    }
    // buff (a aura da Marília): usa quando está longe e seguro
    const special = characterOf(me).special;
    const adx = Math.abs(centerX(target.now) - centerX(me));
    if (
      special?.move.buff &&
      canUseSpecial(me) &&
      me.grounded &&
      !hasBuff(me) &&
      adx > px(380) &&
      rngChance(this.rng, p.special)
    ) {
      this.status = 'usando o especial';
      this.queue(Button.SPECIAL, NO_INPUT, 1);
      return;
    }

    const projectile = special?.move.projectile !== undefined;
    const edge = nearestEdge(terrain, centerX(me));
    const nearEdge = edge !== null && Math.abs(edge.x - centerX(me)) < px(150);
    const weights: [BotPlanKind, number][] = [
      ['approach', 40 + idiv(p.aggression, 2) + (target.now.damage > 90 ? 10 : 0)],
      ['space', 25 + idiv(100 - p.aggression, 4)],
      ['retreat', me.damage > 110 ? 18 : 4],
      ['jumpIn', adx > px(120) && adx < px(420) ? 10 + idiv(p.tech, 4) : 0],
      ['zone', projectile && adx > px(260) ? idiv(p.special, 2) : 0],
      ['center', nearEdge ? 30 : 0],
    ];
    const total = weights.reduce((sum, [, w]) => sum + w, 0);
    let roll = rngInt(this.rng, Math.max(1, total));
    let kind: BotPlanKind = 'approach';
    for (const [k, w] of weights) {
      if (roll < w) {
        kind = k;
        break;
      }
      roll -= w;
    }
    this.setPlan(kind, tick, think + 10);
  }

  // -------------------------------------------------------------------------
  // Execução do plano

  private act(state: GameState, me: Fighter, terrain: Terrain, target: Foe | null): InputMask {
    const tick = state.tick;
    const plan = this.plan;
    this.status = PLAN_LABELS[plan.kind];

    // provocação pendente: só no chão, livre e com o adversário longe
    if (this.tauntUntil >= tick && me.grounded && isFree(me)) {
      const far = !target || Math.abs(centerX(target.now) - centerX(me)) > px(380);
      if (far) {
        this.tauntUntil = -1;
        this.status = 'provocando';
        return this.press(Button.TAUNT, NO_INPUT, 1);
      }
    }

    if (!target) return this.walkTo(me, terrain, terrain.centerX, px(40));
    const dx = centerX(target.now) - centerX(me);
    const adx = Math.abs(dx);
    const dy = feetY(target.now) - feetY(me);
    const toward = sign(dx);

    switch (plan.kind) {
      case 'idle': {
        if (plan.wander === 0 || !me.grounded) return NO_INPUT;
        return this.edgeSafe(me, terrain, dirBits(plan.wander));
      }
      case 'center':
        return this.walkTo(me, terrain, terrain.centerX, px(60));
      case 'edgeguard': {
        if (!isOffstage(terrain, target.now) && target.now.state !== 'ledge') {
          plan.until = tick;
          return NO_INPUT;
        }
        const strike = this.tryAttack(tick, me, terrain, target, this.profile.punish);
        if (strike !== null) return strike;
        const edge = nearestEdge(terrain, centerX(target.now));
        if (!edge) return NO_INPUT;
        const spot = edge.x - edge.side * (idiv(me.w, 2) + px(26));
        return this.walkTo(me, terrain, spot, px(10), true);
      }
      case 'avoid': {
        // longe de quem está com a bomba; encurralado, pula por cima
        const strike = this.tryAttack(
          tick,
          me,
          terrain,
          target,
          this.profile.aggression,
          false,
          true,
        );
        if (strike !== null) return strike;
        if (adx > px(300)) return NO_INPUT;
        const away = toward === 0 ? 1 : flip(toward);
        const room = me.grounded ? edgeAhead(terrain, me, away) : null;
        if (me.grounded && room !== null && room < px(60) && adx < px(200)) {
          return this.press(Button.JUMP, dirBits(toward), 12);
        }
        return this.edgeSafe(me, terrain, dirBits(away));
      }
      case 'hunt':
      case 'chase':
      case 'approach':
      case 'jumpIn': {
        const rate =
          plan.kind === 'hunt' ? 100 : plan.kind === 'chase' ? this.profile.followUp : undefined;
        const strike = this.tryAttack(tick, me, terrain, target, rate, plan.kind === 'hunt');
        if (strike !== null) return strike;
        if (plan.kind === 'jumpIn' && me.grounded && !plan.jumped) {
          plan.jumped = true;
          const short = target.now.grounded && rngChance(this.rng, this.profile.tech);
          return this.press(Button.JUMP, dirBits(toward), short ? 2 : 12);
        }
        return this.chaseMove(tick, me, terrain, target, dx, dy);
      }
      case 'space':
      case 'zone':
      case 'retreat': {
        const strike = this.tryAttack(
          tick,
          me,
          terrain,
          target,
          plan.kind === 'retreat' ? idiv(this.profile.aggression, 2) : undefined,
          false,
          plan.kind === 'zone',
        );
        if (strike !== null) return strike;
        const want =
          plan.kind === 'retreat' ? px(420) : plan.kind === 'zone' ? px(380) : plan.spacing;
        if (adx < want - px(30)) return this.edgeSafe(me, terrain, dirBits(-toward || 1));
        if (adx > want + px(40) && plan.kind !== 'retreat') {
          return this.edgeSafe(me, terrain, dirBits(toward));
        }
        // na distância: vira para o adversário e fica mexendo um pouco
        if (me.facing !== toward && toward !== 0 && me.grounded) return dirBits(toward);
        return NO_INPUT;
      }
    }
  }

  /** Anda até `x` (no chão), parando a `stop` de distância. */
  private walkTo(me: Fighter, terrain: Terrain, x: number, stop: number, close = false): InputMask {
    const dx = x - centerX(me);
    if (Math.abs(dx) <= stop) return NO_INPUT;
    return this.edgeSafe(me, terrain, dirBits(sign(dx)), close);
  }

  /** Vai atrás do adversário: andando, com dash, pulando para a plataforma dele ou descendo. */
  private chaseMove(
    tick: number,
    me: Fighter,
    terrain: Terrain,
    target: Foe,
    dx: number,
    dy: number,
  ): InputMask {
    const adx = Math.abs(dx);
    const toward = sign(dx);
    const p = this.profile;
    if (me.grounded) {
      // ele está numa plataforma acima: pula
      if (dy < -px(90) && adx < px(260)) return this.press(Button.JUMP, dirBits(toward), 12);
      // ele está embaixo e o bot numa plataforma: desce
      if (dy > px(70) && me.onPlatform && adx < px(300)) {
        return this.lastOut & Button.DOWN ? NO_INPUT : Button.DOWN;
      }
      if (
        adx > px(330) &&
        me.dashCooldown === 0 &&
        tick >= this.dashAt &&
        rngChance(this.rng, p.tech)
      ) {
        this.dashAt = tick + 40;
        return this.edgeSafe(me, terrain, this.press(Button.DODGE, dirBits(toward), 1));
      }
      if (adx < px(36)) return NO_INPUT;
      return this.edgeSafe(me, terrain, dirBits(toward));
    }
    // no ar: segue de lado; pulo aéreo para alcançar quem está acima
    let mask = adx > px(20) ? dirBits(toward) : NO_INPUT;
    if (dy < -px(60) && me.vy >= 0 && me.airJumpsLeft > 0 && !(this.lastOut & Button.JUMP)) {
      mask |= Button.JUMP;
    } else if (
      dy > px(100) &&
      me.vy > 0 &&
      !me.fastFalling &&
      !isOffstage(terrain, me) &&
      rngChance(this.rng, idiv(p.tech, 4))
    ) {
      // queda rápida para chegar logo no chão (só em cima do palco)
      mask |= Button.DOWN;
    }
    return mask;
  }

  // -------------------------------------------------------------------------
  // Ataque

  /** Golpes que dá para tentar agora (no chão ou no ar). */
  private candidates(me: Fighter, terrain: Terrain, target: Foe, toward: -1 | 0 | 1): Candidate[] {
    const dir = dirBits(toward || me.facing);
    const above = feetY(target.now) < me.y + idiv(me.h, 3);
    const below = target.now.y > feetY(me) - px(10);
    const list: Candidate[] = [];
    if (me.grounded) {
      list.push({ move: 'neutralLight', press: Button.ATTACK, hold: NO_INPUT, maxTicks: 20 });
      list.push({ move: 'sideLight', press: Button.ATTACK | dir, hold: NO_INPUT, maxTicks: 26 });
      list.push({
        move: 'downLight',
        press: Button.ATTACK | Button.DOWN,
        hold: NO_INPUT,
        maxTicks: 26,
      });
      if (above)
        list.push({
          move: 'recovery',
          press: Button.ATTACK | Button.UP,
          hold: NO_INPUT,
          maxTicks: 24,
        });
    } else {
      list.push({ move: 'neutralAir', press: Button.ATTACK, hold: dir, maxTicks: 24 });
      list.push({ move: 'sideAir', press: Button.ATTACK | dir, hold: dir, maxTicks: 30 });
      if (below)
        list.push({ move: 'downAir', press: Button.ATTACK | Button.DOWN, hold: dir, maxTicks: 28 });
      if (above && !me.recoveryUsed && !isOffstage(terrain, me)) {
        list.push({ move: 'recovery', press: Button.ATTACK | Button.UP, hold: dir, maxTicks: 24 });
      }
      if (
        below &&
        !isOffstage(terrain, me) &&
        Math.abs(centerX(target.now) - centerX(me)) < px(90)
      ) {
        list.push({
          move: 'groundPound',
          press: Button.SPECIAL | Button.DOWN,
          hold: NO_INPUT,
          maxTicks: 50,
        });
      }
    }
    const special = characterOf(me).special;
    if (special && specialStrikes(special.move) && canUseSpecial(me)) {
      const move = special.move;
      const reach = move.projectile ? Math.min(move.projectile.lifetimeTicks, 70) : move.active;
      list.push({
        move: 'special',
        press: Button.SPECIAL | dir,
        hold: me.grounded ? NO_INPUT : dir,
        maxTicks: move.startup + reach + 4,
      });
    }
    return list;
  }

  /**
   * Tenta um golpe que alcança o adversário (testando cada um com a cópia do
   * lutador). `rate`: chance de atacar quando alcança (padrão: a agressividade, ou a
   * punição se o adversário está exposto). Devolve o input do 1º tick, ou null.
   */
  private tryAttack(
    tick: number,
    me: Fighter,
    terrain: Terrain,
    target: Foe,
    rate?: number,
    bodyOnly = false,
    preferSpecial = false,
  ): InputMask | null {
    if (tick < this.attackAt) return null;
    if (!isFree(me) && me.state !== 'dash' && me.state !== 'landing') return null;
    const o = target.now;
    const p = this.profile;
    const dx = centerX(o) - centerX(me);
    const special = characterOf(me).special;
    const ranged = special?.move.projectile !== undefined && canUseSpecial(me);
    if (Math.abs(dx) > (ranged ? px(1100) : px(420)) || Math.abs(feetY(o) - feetY(me)) > px(420)) {
      return null;
    }
    // invencível (respawn, esquiva) ou no contra-ataque: quem entende espera
    const careful = rngChance(this.rng, p.defend);
    if (o.invulnTicks > 6 && careful) {
      this.attackAt = tick + 4;
      return null;
    }
    const countering = isCountering(o) && careful;

    const toward = sign(dx);
    let options = this.candidates(me, terrain, target, toward);
    if (bodyOnly)
      options = options.filter((c) => !(c.move === 'special' && special?.move.projectile));
    if (countering) options = options.filter((c) => c.move === 'special' && special?.move.grab);
    if (options.length === 0) return null;

    const hits: { c: Candidate; hit: number }[] = [];
    for (const c of options) {
      const r = probeMove(me, terrain, c.press, c.hold, target.path, c.maxTicks);
      if (r.hit > 0 && !r.unsafe) hits.push({ c, hit: r.hit });
    }
    if (hits.length === 0) {
      // erro de distância: ataca no vento com o adversário perto
      if (
        Math.abs(dx) < px(230) &&
        Math.abs(feetY(o) - feetY(me)) < px(120) &&
        rngChance(this.rng, idiv(p.mistake, 5))
      ) {
        const base = options.filter((c) => c.move !== 'special' && c.move !== 'groundPound');
        const c = base[rngInt(this.rng, Math.max(1, base.length))];
        if (c) {
          this.attackAt = tick + 20 + rngInt(this.rng, 20);
          this.status = 'errou a distância';
          return this.press(c.press, c.hold);
        }
      }
      this.attackAt = tick + 2;
      return null;
    }

    const chance = rate ?? (inEndlag(o) ? p.punish : p.aggression);
    if (!rngChance(this.rng, chance)) {
      // hesitou: não sorteia de novo logo em seguida
      this.attackAt = tick + 6 + rngInt(this.rng, 12);
      return null;
    }
    let pick = hits[0];
    if (rngChance(this.rng, p.mistake)) {
      pick = hits[rngInt(this.rng, hits.length)];
    } else {
      let best = -Infinity;
      for (const h of hits) {
        const s = this.score(me, o, h.c, h.hit, preferSpecial);
        if (s > best) {
          best = s;
          pick = h;
        }
      }
    }
    if (!pick) return null;
    const def = moveDef(me, pick.c.move);
    this.attackAt = tick + Math.min(totalFrames(def), 40) + rngInt(this.rng, 8);
    this.status = pick.c.move === 'special' ? 'especial' : 'atacando';
    return this.press(pick.c.press, pick.c.hold);
  }

  /** Nota de um golpe que acerta: dano, força para tirar a vida e rapidez, com um sorteio. */
  private score(
    me: Fighter,
    o: Fighter,
    c: Candidate,
    hit: number,
    preferSpecial: boolean,
  ): number {
    const def = moveDef(me, c.move);
    const props = def.projectile?.hit ?? def.counter ?? def;
    const damage = props.damage;
    const kb = idiv(knockback(props, o.damage + damage, effectiveWeight(o)), px(1));
    // com o % alto, golpe forte vale mais
    const finisher = Math.min(3 * 10, idiv(o.damage, 4));
    const noise = rngInt(this.rng, 12 + idiv(this.profile.mistake, 2));
    let s = damage * 3 + idiv(kb * finisher, 10) - hit * 2 + noise;
    if (c.move === 'special') s += preferSpecial ? 25 : idiv(this.profile.special, 10);
    return s;
  }
}
