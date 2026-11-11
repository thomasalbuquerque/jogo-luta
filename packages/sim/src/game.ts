import { BASE_CHARACTER_ID } from './characters';
import { resolveHits, resolveProjectileHits, stepGrabs } from './combat';
import { TICK_RATE } from './constants';
import { cueNames, type GameEvent } from './events';
import { createFighter, knockOut, respawn, stepFighter, type Fighter } from './fighter';
import { NO_INPUT, type InputMask } from './input';
import { idiv } from './math';
import { overlaps } from './physics';
import { stepProjectiles, type Projectile } from './projectile';
import { seedRng } from './rng';
import { STAGES, TEST_STAGE, type Spawn, type Stage } from './stage';

/** Ticks fora de cena depois de um KO, antes de reaparecer. */
export const RESPAWN_DELAY_TICKS = 60;
/** Invencibilidade ao reaparecer (~2 s). */
export const RESPAWN_INVULN_TICKS = 120;
/** Morte súbita: todos os empatados voltam com 1 stock e este dano. */
export const SUDDEN_DEATH_DAMAGE = 300;
/** Invencibilidade no começo da morte súbita, para dar tempo de entender. */
export const SUDDEN_DEATH_INVULN_TICKS = 60;
/** Contagem "3, 2, 1" antes da luta (um número a cada terço). */
export const COUNTDOWN_TICKS = 150;

export interface MatchRules {
  stocks: number;
  /** Duração da luta em ticks; 0 = sem limite. */
  timeLimitTicks: number;
  /**
   * Contagem antes da luta, em ticks (sem valor: começa direto). Durante a
   * contagem o input é ignorado e o relógio não anda.
   */
  countdownTicks?: number;
}

export const DEFAULT_RULES: MatchRules = { stocks: 3, timeLimitTicks: 4 * 60 * TICK_RATE };

/** Regras da luta de verdade: as padrão, com a contagem antes. */
export const MATCH_RULES: MatchRules = { ...DEFAULT_RULES, countdownTicks: COUNTDOWN_TICKS };

export type MatchPhase = 'countdown' | 'fight' | 'over';

/** Estado completo da luta: só dados simples, serializável. */
export interface GameState {
  tick: number;
  /** Estado do RNG com seed (`rng.ts`): a sorte da luta, se alguma regra usar, sai daqui. */
  rng: number;
  stageId: string;
  rules: MatchRules;
  phase: MatchPhase;
  /** Ticks até a contagem acabar e a luta começar (0 depois disso). */
  countdown: number;
  /** Ticks até o fim do tempo (fica em 0 na morte súbita ou sem limite). */
  timeLeft: number;
  suddenDeath: boolean;
  /** Id do vencedor quando a luta acaba; null = empate (ou luta em andamento). */
  winner: number | null;
  fighters: Fighter[];
  /** Projéteis em voo (especiais). */
  projectiles: Projectile[];
  /** O que aconteceu no último tick (som e efeitos); nenhuma regra lê. */
  events: GameEvent[];
}

export function getStage(id: string): Stage {
  const stage = STAGES.find((s) => s.id === id);
  if (!stage) throw new Error(`Mapa desconhecido: ${id}`);
  return stage;
}

export interface GameSetup {
  /** Id da ficha de cada jogador, na ordem. Sem isso: 2 bonecos de teste. */
  characters?: readonly string[];
  stage?: Stage;
  rules?: MatchRules;
  /** Seed do RNG da luta. A mesma seed com os mesmos inputs dá a mesma luta. */
  seed?: number;
}

export function createGame(setup: GameSetup = {}): GameState {
  const { stage = TEST_STAGE, rules = DEFAULT_RULES } = setup;
  const characters = setup.characters ?? [BASE_CHARACTER_ID, BASE_CHARACTER_ID];
  const fighters: Fighter[] = [];
  for (const [i, character] of characters.entries()) {
    const f = createFighter(i, spawnPoint(stage, i), character);
    f.stocks = rules.stocks;
    fighters.push(f);
  }
  const countdown = Math.max(0, rules.countdownTicks ?? 0);
  return {
    tick: 0,
    rng: seedRng(setup.seed ?? 1),
    stageId: stage.id,
    rules: { ...rules },
    phase: countdown > 0 ? 'countdown' : 'fight',
    countdown,
    timeLeft: rules.timeLimitTicks,
    suddenDeath: false,
    winner: null,
    fighters,
    projectiles: [],
    events: [],
  };
}

function spawnPoint(stage: Stage, id: number): Spawn {
  const point = stage.spawns[id % stage.spawns.length];
  if (!point) throw new Error('Mapa sem spawn');
  return point;
}

function respawnPoint(stage: Stage, id: number): Spawn {
  const point = stage.respawns[id % stage.respawns.length];
  if (!point) throw new Error('Mapa sem ponto de respawn');
  return point;
}

/** Conta o tempo fora de cena e devolve o lutador ao mapa, se ainda tiver stock. */
function stepKnockedOut(f: Fighter, stage: Stage, events: GameEvent[]): void {
  if (f.stocks <= 0) return;
  if (f.respawnTicks > 0) f.respawnTicks--;
  if (f.respawnTicks === 0) {
    respawn(f, respawnPoint(stage, f.id), RESPAWN_INVULN_TICKS);
    events.push({ type: 'respawn', fighter: f.id });
  }
}

/**
 * Avança a luta um tick. `inputs[i]` é a bitmask do jogador i neste tick.
 * Na contagem o input é ignorado (os lutadores ficam parados no spawn); depois
 * do fim da luta, só o contador de ticks anda.
 */
export function stepGame(state: GameState, inputs: readonly InputMask[]): void {
  const events: GameEvent[] = [];
  state.events = events;
  if (state.phase === 'over') {
    state.tick++;
    return;
  }
  const stage = getStage(state.stageId);
  const counting = state.phase === 'countdown';
  for (const f of state.fighters) {
    if (f.state === 'ko') stepKnockedOut(f, stage, events);
    const input = counting ? NO_INPUT : (inputs[f.id] ?? NO_INPUT);
    stepFighter(f, input, stage.solids, state.projectiles);
    for (const action of cueNames(f.cues)) events.push({ type: 'action', fighter: f.id, action });
  }
  stepProjectiles(state.projectiles, stage.solids, stage.blastZone);
  resolveHits(state.fighters, events);
  resolveProjectileHits(state.fighters, state.projectiles, events);
  stepGrabs(state.fighters, stage.solids, events);
  // Saiu inteiro da blast zone = KO.
  for (const f of state.fighters) {
    if (f.state === 'ko' || overlaps(f, stage.blastZone)) continue;
    const x = f.x + idiv(f.w, 2);
    const y = f.y + idiv(f.h, 2);
    knockOut(f, RESPAWN_DELAY_TICKS);
    events.push({ type: 'ko', fighter: f.id, x, y, stocksLeft: f.stocks });
  }
  checkLastStanding(state);
  if (counting) stepCountdown(state);
  else stepClock(state, stage);
  clearNegativeZeros(state);
  state.tick++;
}

/**
 * Lado × 0 dá -0 (ex.: `facing * 0` olhando para a esquerda). Nas contas -0 e 0
 * valem igual, mas o JSON grava -0 como 0: sem isto, um estado que passou por
 * texto (replay, rede) deixaria de ser idêntico ao original. "+ 0" troca -0 por 0.
 */
function clearNegativeZeros(state: GameState): void {
  for (const f of state.fighters) {
    f.vx += 0;
    f.vy += 0;
    f.kbx += 0;
    f.kby += 0;
  }
  for (const p of state.projectiles) {
    p.vx += 0;
    p.vy += 0;
  }
}

/** Conta a contagem antes da luta; no fim dela, a luta começa (o relógio só anda depois). */
function stepCountdown(state: GameState): void {
  if (state.phase !== 'countdown') return;
  if (state.countdown > 0) state.countdown--;
  if (state.countdown === 0) state.phase = 'fight';
}

/** Lutadores ainda na luta (com stock, mesmo esperando respawn). */
export function aliveFighters(state: GameState): Fighter[] {
  return state.fighters.filter((f) => f.stocks > 0);
}

function endMatch(state: GameState, winner: number | null): void {
  state.phase = 'over';
  state.winner = winner;
}

/** Sobrou 1 (vence) ou ninguém (empate: os últimos stocks caíram juntos). */
function checkLastStanding(state: GameState): void {
  if (state.fighters.length < 2) return;
  const alive = aliveFighters(state);
  if (alive.length <= 1) endMatch(state, alive[0]?.id ?? null);
}

function stepClock(state: GameState, stage: Stage): void {
  if (state.phase !== 'fight' || state.suddenDeath || state.rules.timeLimitTicks <= 0) return;
  if (state.timeLeft > 0) state.timeLeft--;
  if (state.timeLeft === 0) timeUp(state, stage);
}

/**
 * Fim do tempo: vence quem tiver mais stocks; empate em stocks → menor %;
 * empate total → morte súbita (1 stock, 300%) só entre os empatados.
 */
function timeUp(state: GameState, stage: Stage): void {
  let leaders = aliveFighters(state);
  const maxStocks = Math.max(...leaders.map((f) => f.stocks));
  leaders = leaders.filter((f) => f.stocks === maxStocks);
  const minDamage = Math.min(...leaders.map((f) => f.damage));
  leaders = leaders.filter((f) => f.damage === minDamage);

  const [first] = leaders;
  if (leaders.length === 1 && first) {
    endMatch(state, first.id);
    return;
  }

  state.suddenDeath = true;
  for (const f of state.fighters) {
    if (leaders.includes(f)) {
      respawn(f, spawnPoint(stage, f.id), SUDDEN_DEATH_INVULN_TICKS);
      state.events.push({ type: 'respawn', fighter: f.id });
      f.stocks = 1;
      f.damage = SUDDEN_DEATH_DAMAGE;
    } else {
      // Quem não empatou no topo está fora.
      if (f.state !== 'ko') knockOut(f, 0);
      f.stocks = 0;
    }
  }
}
