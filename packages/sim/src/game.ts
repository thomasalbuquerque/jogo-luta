import { resolveHits } from './combat';
import { createFighter, placeAtSpawn, stepFighter, type Fighter } from './fighter';
import type { InputMask } from './input';
import { overlaps } from './physics';
import { TEST_STAGE, type Stage } from './stage';

/** Estado completo da luta: só dados simples, serializável. */
export interface GameState {
  tick: number;
  stageId: string;
  fighters: Fighter[];
}

const STAGES: Record<string, Stage> = { [TEST_STAGE.id]: TEST_STAGE };

export function getStage(id: string): Stage {
  const stage = STAGES[id];
  if (!stage) throw new Error(`Mapa desconhecido: ${id}`);
  return stage;
}

export function createGame(playerCount = 2, stage: Stage = TEST_STAGE): GameState {
  const fighters: Fighter[] = [];
  for (let i = 0; i < playerCount; i++) {
    const spawn = stage.spawns[i % stage.spawns.length];
    if (!spawn) throw new Error('Mapa sem spawn');
    fighters.push(createFighter(i, spawn));
  }
  return { tick: 0, stageId: stage.id, fighters };
}

/** Avança a luta um tick. `inputs[i]` é a bitmask do jogador i neste tick. */
export function stepGame(state: GameState, inputs: readonly InputMask[]): void {
  const stage = getStage(state.stageId);
  for (const f of state.fighters) {
    stepFighter(f, inputs[f.id] ?? 0, stage.solids);
    // Etapa 1: sair da blast zone só devolve ao spawn (KO e stocks vêm na Etapa 2).
    if (!overlaps(f, stage.blastZone)) {
      const spawn = stage.spawns[f.id % stage.spawns.length];
      if (spawn) placeAtSpawn(f, spawn);
    }
  }
  resolveHits(state.fighters);
  state.tick++;
}

/** Cópia profunda do estado (snapshot). */
export function cloneState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state)) as GameState;
}
