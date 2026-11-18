import { describe, expect, it } from 'vitest';
import { PLAYABLE_CHARACTERS } from '../characters';
import { px } from '../constants';
import { createGame, getStage, MATCH_RULES, stepGame } from '../game';
import { Button, NO_INPUT } from '../input';
import { hashState } from '../snapshot';
import { CONFEITARIA_STAGE, STAGES, TEST_STAGE } from '../stage';
import { Bot } from './bot';
import { BOT_LEVELS, BOT_PROFILES, type BotLevel } from './levels';
import { predictPath, probeMove } from './lookahead';
import { runBotMatch } from './match';
import { isOffstage, terrainOf } from './terrain';

const N = PLAYABLE_CHARACTERS.length;

/** Lutas inteiras entre bots demoram: no CI (máquina mais lenta) passam dos 5 s padrão. */
const SLOW = { timeout: 60_000 };

/** Personagem de número `i` (dá a volta no elenco). */
function cast(i: number): string {
  return PLAYABLE_CHARACTERS[((i % N) + N) % N] ?? '';
}

/** Vitórias de `a` contra `b` em `games` lutas, trocando personagens, mapas e lados. */
function wins(a: BotLevel, b: BotLevel, games: number): number {
  let won = 0;
  for (let i = 0; i < games; i++) {
    const swap = i % 2 === 1;
    const m = runBotMatch({
      characters: swap ? [cast(i * 5 + 3), cast(i)] : [cast(i), cast(i * 5 + 3)],
      levels: swap ? [b, a] : [a, b],
      stageId: STAGES[i % STAGES.length]?.id ?? 'test',
      seed: 1000 + i,
    });
    if (m.state.winner === (swap ? 1 : 0)) won++;
  }
  return won;
}

describe('bot: mapa', () => {
  it('acha as bordas que dão para o vazio', () => {
    const laje = terrainOf(TEST_STAGE);
    expect(laje.edges).toEqual([
      { x: px(-450), y: 0, side: -1 },
      { x: px(450), y: 0, side: 1 },
    ]);
    expect(laje.centerX).toBe(0);
    // na confeitaria, o degrau do forno não é borda: embaixo dele tem a bancada
    const conf = terrainOf(CONFEITARIA_STAGE);
    expect(conf.edges).toEqual([
      { x: px(-520), y: 0, side: -1 },
      { x: px(520), y: px(-65), side: 1 },
    ]);
  });

  it('fora do palco é no ar sem chão embaixo', () => {
    const state = createGame({ stage: TEST_STAGE });
    const f = state.fighters[0];
    if (!f) throw new Error('sem lutador');
    const t = terrainOf(TEST_STAGE);
    f.grounded = false;
    f.state = 'fall';
    f.x = px(-200);
    f.y = px(-300);
    expect(isOffstage(t, f)).toBe(false);
    f.x = px(-600);
    expect(isOffstage(t, f)).toBe(true);
    // embaixo do palco também é fora
    f.x = px(-100);
    f.y = px(500);
    expect(isOffstage(t, f)).toBe(true);
  });
});

describe('bot: testando golpes com a cópia do lutador', () => {
  it('o soco parado alcança quem está colado e não alcança quem está longe', () => {
    const state = createGame({ stage: TEST_STAGE });
    const [me, foe] = state.fighters;
    if (!me || !foe) throw new Error('sem lutadores');
    for (let t = 0; t < 30; t++) stepGame(state, [NO_INPUT, NO_INPUT]);
    const t = terrainOf(TEST_STAGE);
    me.facing = 1;
    foe.x = me.x + me.w + px(10);
    const near = probeMove(me, t, Button.ATTACK, NO_INPUT, predictPath(foe, t, 30), 20);
    expect(near.hit).toBeGreaterThan(0);
    foe.x = me.x + px(400);
    const far = probeMove(me, t, Button.ATTACK, NO_INPUT, predictPath(foe, t, 30), 20);
    expect(far.hit).toBe(-1);
  });
});

describe('bot: níveis', SLOW, () => {
  it('quanto mais difícil, mais rápido reage e menos erra', () => {
    const [easy, medium, hard] = BOT_LEVELS.map((l) => BOT_PROFILES[l]);
    if (!easy || !medium || !hard) throw new Error('faltam níveis');
    expect(easy.reaction).toBeGreaterThan(medium.reaction);
    expect(medium.reaction).toBeGreaterThan(hard.reaction);
    expect(easy.mistake).toBeGreaterThan(medium.mistake);
    expect(medium.mistake).toBeGreaterThan(hard.mistake);
    expect(easy.defend).toBeLessThan(hard.defend);
    // nenhum é perfeito
    expect(hard.reaction).toBeGreaterThanOrEqual(10);
    expect(hard.defend).toBeLessThan(100);
    expect(hard.aggression).toBeLessThan(100);
  });

  it('o difícil ganha do médio, e o médio do fácil, quase sempre', () => {
    expect(wins('hard', 'medium', 6)).toBeGreaterThanOrEqual(5);
    expect(wins('medium', 'easy', 6)).toBeGreaterThanOrEqual(5);
  });
});

describe('bot: luta', SLOW, () => {
  it('mesma seed, mesma luta', () => {
    const setup = {
      characters: [cast(2), cast(7)],
      levels: ['medium', 'hard'] as const,
      stageId: 'oficina',
      seed: 42,
      maxTicks: 3000,
    };
    const a = runBotMatch({ ...setup, levels: [...setup.levels] });
    const b = runBotMatch({ ...setup, levels: [...setup.levels] });
    expect(hashState(a.state)).toBe(hashState(b.state));
    expect(a.ticks).toBe(b.ticks);
  });

  it('só olha: pensar não muda o estado da luta (o replay continua igual)', () => {
    const state = createGame({ characters: [cast(3), cast(11)], stage: getStage('confeitaria') });
    const bots = [
      new Bot({ id: 0, level: 'hard', seed: 1 }),
      new Bot({ id: 1, level: 'easy', seed: 2 }),
    ];
    for (let t = 0; t < 2500; t++) {
      const before = hashState(state);
      const inputs = bots.map((b) => b.next(state));
      expect(hashState(state)).toBe(before);
      stepGame(state, inputs);
    }
  });

  it('não aperta nada na contagem', () => {
    const state = createGame({ characters: [cast(0), cast(1)], rules: MATCH_RULES });
    const bot = new Bot({ id: 0, level: 'hard', seed: 1 });
    while (state.phase === 'countdown') {
      expect(bot.next(state)).toBe(NO_INPUT);
      stepGame(state, [NO_INPUT, NO_INPUT]);
    }
  });

  it('o difícil não cai sozinho em nenhum mapa', () => {
    for (const [i, stage] of STAGES.entries()) {
      for (const k of [0, 1]) {
        const m = runBotMatch({
          characters: [cast(i * 4 + k), cast(i * 4 + k + 6)],
          levels: ['hard', 'hard'],
          stageId: stage.id,
          seed: 300 + i * 2 + k,
        });
        expect(m.selfDestructs).toEqual([0, 0]);
        expect(m.state.phase).toBe('over');
      }
    }
  });

  it('esquiva, usa o especial e provoca às vezes (não é robô)', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 4; i++) {
      const state = createGame({
        characters: [cast(i), cast(i + 3)],
        stage: getStage('test'),
        seed: i,
      });
      const bots = [
        new Bot({ id: 0, level: 'easy', seed: i }),
        new Bot({ id: 1, level: 'hard', seed: i }),
      ];
      while (state.phase !== 'over' && state.tick < 4 * 3600) {
        stepGame(
          state,
          bots.map((b) => b.next(state)),
        );
        for (const e of state.events) {
          if (e.type === 'action') seen.add(e.action);
          if (e.type === 'action' && e.action === 'SWING') {
            seen.add(`golpe ${state.fighters[e.fighter]?.move ?? ''}`);
          }
        }
      }
    }
    for (const thing of [
      'AIR_DODGE',
      'DASH',
      'TAUNT',
      'AIR_JUMP',
      'golpe special',
      'golpe sideAir',
    ]) {
      expect(seen).toContain(thing);
    }
  });

  it('chega em quem está parado em qualquer canto do mapa e bate', () => {
    const fails: string[] = [];
    for (const level of ['easy', 'hard'] as const) {
      for (const stage of STAGES) {
        for (const [k, spot] of stage.spawns.entries()) {
          const state = createGame({ characters: [cast(k * 3), cast(1)], stage, seed: k });
          const foe = state.fighters[1];
          if (!foe) continue;
          foe.x = spot.x - foe.w / 2;
          foe.y = spot.y - foe.h - px(1);
          const bot = new Bot({ id: 0, level, seed: 77 + k });
          let hit = false;
          while (state.tick < 1200 && !hit) {
            stepGame(state, [bot.next(state), NO_INPUT]);
            hit = state.events.some((e) => e.type === 'hit' && e.attacker === 0);
          }
          if (!hit) fails.push(`${level} ${stage.id} lugar ${String(k)}`);
        }
      }
    }
    expect(fails).toEqual([]);
  });

  it('joga em time: 2 contra 2 de bots termina com um time vencedor', () => {
    const m = runBotMatch({
      characters: [cast(0), cast(4), cast(8), cast(10)],
      levels: ['medium', 'medium', 'medium', 'medium'],
      stageId: 'oficina',
      teams: [0, 1, 0, 1],
      seed: 9,
    });
    expect(m.state.phase).toBe('over');
    expect(m.state.winnerTeam).not.toBeNull();
  });

  it('numa revanche (o tick volta ao começo), esquece a luta anterior', () => {
    const bot = new Bot({ id: 1, level: 'medium', seed: 5 });
    let state = createGame({ characters: [cast(0), cast(1)] });
    for (let t = 0; t < 200; t++) stepGame(state, [NO_INPUT, bot.next(state)]);
    state = createGame({ characters: [cast(0), cast(1)] });
    const first = bot.next(state);
    expect(first & ~0x1ff).toBe(0);
    expect(bot.doing).not.toBe('');
  });
});
