import { TICK_RATE } from '../constants';
import { createGame, getStage, stepGame, type GameState, type MatchRules } from '../game';
import { NO_INPUT, type InputMask } from '../input';
import { Bot } from './bot';
import type { BotLevel } from './levels';

/** Luta inteira entre bots, sem ninguém jogando (testes e ajuste dos níveis). */
export interface BotMatchSetup {
  characters: readonly string[];
  /** Nível de cada lutador (null = parado, sem bot). */
  levels: readonly (BotLevel | null)[];
  stageId: string;
  seed: number;
  rules?: MatchRules;
  teams?: readonly number[];
  /** Para antes, mesmo que a luta não tenha acabado. */
  maxTicks?: number;
}

export interface BotMatch {
  state: GameState;
  bots: (Bot | null)[];
  /**
   * Quantas vezes cada um caiu sozinho: perdeu a vida depois de ter pisado no chão
   * (ou agarrado a borda) desde o último golpe que levou.
   */
  selfDestructs: number[];
  ticks: number;
}

/** Roda a luta até acabar (ou até `maxTicks`). */
export function runBotMatch(setup: BotMatchSetup): BotMatch {
  const state = createGame({
    characters: setup.characters,
    stage: getStage(setup.stageId),
    seed: setup.seed,
    ...(setup.rules ? { rules: setup.rules } : {}),
    ...(setup.teams ? { teams: setup.teams } : {}),
  });
  const bots = setup.levels.map((level, id) =>
    level ? new Bot({ id, level, seed: setup.seed + id * 7919 }) : null,
  );
  // pisou no chão depois do último golpe que levou: dali em diante, cair é culpa dele
  const safe = setup.characters.map(() => false);
  const selfDestructs = setup.characters.map(() => 0);
  const maxTicks = setup.maxTicks ?? 5 * 60 * TICK_RATE;
  let ticks = 0;
  while (state.phase !== 'over' && ticks < maxTicks) {
    const inputs: InputMask[] = bots.map((bot) => bot?.next(state) ?? NO_INPUT);
    stepGame(state, inputs);
    ticks++;
    for (const e of state.events) {
      // inclusive a própria bomba (o dono também leva)
      if (e.type === 'hit') safe[e.victim] = false;
      if (e.type === 'ko' && safe[e.fighter]) {
        selfDestructs[e.fighter] = (selfDestructs[e.fighter] ?? 0) + 1;
      }
      if (e.type === 'ko') safe[e.fighter] = false;
    }
    for (const f of state.fighters) {
      if (f.state !== 'hitstun' && (f.grounded || f.state === 'ledge')) safe[f.id] = true;
    }
  }
  return { state, bots, selfDestructs, ticks };
}
