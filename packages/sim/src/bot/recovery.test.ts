import { describe, expect, it } from 'vitest';
import { PLAYABLE_CHARACTERS } from '../characters';
import { px } from '../constants';
import { createGame, getStage, stepGame, type GameState } from '../game';
import { NO_INPUT } from '../input';
import { STAGES } from '../stage';
import { Bot } from './bot';
import type { BotLevel } from './levels';
import { terrainOf } from './terrain';

/**
 * Coloca o bot (lutador 0) parado fora do palco, `out` px para fora da borda e
 * `down` px abaixo dela, e deixa ele voltar. O adversário fica parado no meio.
 */
function offstage(
  character: string,
  stageId: string,
  side: -1 | 1,
  out: number,
  down: number,
  level: BotLevel,
  seed = 1,
): { back: boolean; state: GameState } {
  const stage = getStage(stageId);
  const state = createGame({ characters: [character, 'joao-frango'], stage, seed });
  const edge = terrainOf(stage).edges.find((e) => e.side === side);
  const me = state.fighters[0];
  const foe = state.fighters[1];
  if (!edge || !me || !foe) throw new Error('mapa sem borda');
  me.x = edge.x + side * px(out) - me.w / 2;
  // começa caindo (o estado de quem acabou de nascer na luta)
  me.y = edge.y + px(down) - me.h;
  foe.x = -foe.w / 2;
  const bot = new Bot({ id: 0, level, seed });
  for (let t = 0; t < 400; t++) {
    stepGame(state, [bot.next(state), NO_INPUT]);
    if (me.state === 'ko') return { back: false, state };
    if (me.grounded) return { back: true, state };
  }
  return { back: me.grounded || me.state === 'ledge', state };
}

/** Pontos de onde todo mundo tem que conseguir voltar (px para fora, px para baixo). */
const SPOTS: readonly (readonly [number, number])[] = [
  [120, 0],
  [250, -100],
  [200, 120],
  [320, 60],
  [80, 220],
];

describe('bot: volta ao palco', () => {
  for (const stage of STAGES) {
    it(`volta de vários pontos com todos os personagens (${stage.id})`, () => {
      const fails: string[] = [];
      for (const c of PLAYABLE_CHARACTERS) {
        for (const side of [-1, 1] as const) {
          for (const [out, down] of SPOTS) {
            if (!offstage(c, stage.id, side, out, down, 'hard').back) {
              fails.push(`${c} lado ${String(side)} (${String(out)}, ${String(down)})`);
            }
          }
        }
      }
      expect(fails).toEqual([]);
    });
  }

  it('o médio também volta de perto da borda', () => {
    const fails: string[] = [];
    for (const c of PLAYABLE_CHARACTERS) {
      for (const side of [-1, 1] as const) {
        if (!offstage(c, 'test', side, 150, 40, 'medium', 3).back)
          fails.push(`${c} ${String(side)}`);
      }
    }
    expect(fails).toEqual([]);
  });
});
