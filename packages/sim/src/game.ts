import { BASE_CHARACTER_ID } from './characters';
import { resolveHits, resolveProjectileHits, stepGrabs } from './combat';
import { TICK_RATE } from './constants';
import { cueNames, type GameEvent } from './events';
import { createFighter, knockOut, respawn, stepFighter, type Fighter } from './fighter';
import type { InputMask } from './input';
import { idiv } from './math';
import { overlaps } from './physics';
import { stepProjectiles, type Projectile } from './projectile';
import { TEST_STAGE, type Spawn, type Stage } from './stage';

/** Ticks fora de cena depois de um KO, antes de reaparecer. */
export const RESPAWN_DELAY_TICKS = 60;
/** Invencibilidade ao reaparecer (~2 s). */
export const RESPAWN_INVULN_TICKS = 120;
/** Morte súbita: todos os empatados voltam com 1 stock e este dano. */
export const SUDDEN_DEATH_DAMAGE = 300;
/** Invencibilidade no começo da morte súbita, para dar tempo de entender. */
export const SUDDEN_DEATH_INVULN_TICKS = 60;

export interface MatchRules {
  stocks: number;
  /** Duração da luta em ticks; 0 = sem limite. */
  timeLimitTicks: number;
}

export const DEFAULT_RULES: MatchRules = { stocks: 3, timeLimitTicks: 4 * 60 * TICK_RATE };

export type MatchPhase = 'fight' | 'over';

/** Estado completo da luta: só dados simples, serializável. */
export interface GameState {
  tick: number;
  stageId: string;
  rules: MatchRules;
  phase: MatchPhase;
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

const STAGES: Record<string, Stage> = { [TEST_STAGE.id]: TEST_STAGE };

export function getStage(id: string): Stage {
  const stage = STAGES[id];
  if (!stage) throw new Error(`Mapa desconhecido: ${id}`);
  return stage;
}

export interface GameSetup {
  /** Id da ficha de cada jogador, na ordem. Sem isso: 2 bonecos de teste. */
  characters?: readonly string[];
  stage?: Stage;
  rules?: MatchRules;
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
  return {
    tick: 0,
    stageId: stage.id,
    rules: { ...rules },
    phase: 'fight',
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
 * Depois do fim da luta, só o contador de ticks anda.
 */
export function stepGame(state: GameState, inputs: readonly InputMask[]): void {
  const events: GameEvent[] = [];
  state.events = events;
  if (state.phase === 'over') {
    state.tick++;
    return;
  }
  const stage = getStage(state.stageId);
  for (const f of state.fighters) {
    if (f.state === 'ko') stepKnockedOut(f, stage, events);
    stepFighter(f, inputs[f.id] ?? 0, stage.solids, state.projectiles);
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
  stepClock(state, stage);
  state.tick++;
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

/** Cópia profunda do estado (snapshot). */
export function cloneState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state)) as GameState;
}
