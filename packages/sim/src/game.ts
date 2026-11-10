import { resolveHits } from './combat';
import { createFighter, knockOut, respawn, stepFighter, type Fighter } from './fighter';
import type { InputMask } from './input';
import { overlaps } from './physics';
import { TEST_STAGE, type Spawn, type Stage } from './stage';

/** Ticks fora de cena depois de um KO, antes de reaparecer. */
export const RESPAWN_DELAY_TICKS = 60;
/** Invencibilidade ao reaparecer (~2 s). */
export const RESPAWN_INVULN_TICKS = 120;

export interface MatchRules {
  stocks: number;
}

export const DEFAULT_RULES: MatchRules = { stocks: 3 };

/** Estado completo da luta: só dados simples, serializável. */
export interface GameState {
  tick: number;
  stageId: string;
  rules: MatchRules;
  fighters: Fighter[];
}

const STAGES: Record<string, Stage> = { [TEST_STAGE.id]: TEST_STAGE };

export function getStage(id: string): Stage {
  const stage = STAGES[id];
  if (!stage) throw new Error(`Mapa desconhecido: ${id}`);
  return stage;
}

export function createGame(
  playerCount = 2,
  stage: Stage = TEST_STAGE,
  rules: MatchRules = DEFAULT_RULES,
): GameState {
  const fighters: Fighter[] = [];
  for (let i = 0; i < playerCount; i++) {
    const spawn = stage.spawns[i % stage.spawns.length];
    if (!spawn) throw new Error('Mapa sem spawn');
    const f = createFighter(i, spawn);
    f.stocks = rules.stocks;
    fighters.push(f);
  }
  return { tick: 0, stageId: stage.id, rules: { ...rules }, fighters };
}

function respawnPoint(stage: Stage, id: number): Spawn {
  const point = stage.respawns[id % stage.respawns.length];
  if (!point) throw new Error('Mapa sem ponto de respawn');
  return point;
}

/** Conta o tempo fora de cena e devolve o lutador ao mapa, se ainda tiver stock. */
function stepKnockedOut(f: Fighter, stage: Stage): void {
  if (f.stocks <= 0) return;
  if (f.respawnTicks > 0) f.respawnTicks--;
  if (f.respawnTicks === 0) respawn(f, respawnPoint(stage, f.id), RESPAWN_INVULN_TICKS);
}

/** Avança a luta um tick. `inputs[i]` é a bitmask do jogador i neste tick. */
export function stepGame(state: GameState, inputs: readonly InputMask[]): void {
  const stage = getStage(state.stageId);
  for (const f of state.fighters) {
    if (f.state === 'ko') stepKnockedOut(f, stage);
    stepFighter(f, inputs[f.id] ?? 0, stage.solids);
  }
  resolveHits(state.fighters);
  // Saiu inteiro da blast zone = KO.
  for (const f of state.fighters) {
    if (f.state !== 'ko' && !overlaps(f, stage.blastZone)) knockOut(f, RESPAWN_DELAY_TICKS);
  }
  state.tick++;
}

/** Lutadores ainda na luta (com stock, mesmo esperando respawn). */
export function aliveFighters(state: GameState): Fighter[] {
  return state.fighters.filter((f) => f.stocks > 0);
}

/** Cópia profunda do estado (snapshot). */
export function cloneState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state)) as GameState;
}
