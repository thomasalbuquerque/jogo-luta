import { describe, expect, it } from 'vitest';
import { PLAYABLE_CHARACTERS } from './characters';
import { MATCH_RULES, stepGame, type GameState } from './game';
import {
  createReplay,
  decodeReplay,
  encodeReplay,
  finishReplay,
  MAX_REPLAY_TICKS,
  recordInputs,
  REPLAY_TAG,
  replayGame,
  replayInputs,
  replayLength,
  replayMatches,
  runReplay,
  type Replay,
} from './replay';
import { hashState } from './snapshot';
import { TEST_STAGE } from './stage';
import { RandomInputs } from './testing';

const SETUP = {
  characters: PLAYABLE_CHARACTERS,
  stageId: TEST_STAGE.id,
  rules: MATCH_RULES,
  seed: 4242,
};

/** Joga uma luta inteira (até acabar) gravando, como o jogo faz. */
function recordMatch(inputSeed = 9): { replay: Replay; state: GameState; hashes: number[] } {
  const replay = createReplay(SETUP);
  const state = replayGame(replay);
  const inputs = new RandomInputs(inputSeed);
  const hashes: number[] = [];
  while (state.phase !== 'over') {
    const frame = inputs.next();
    recordInputs(replay, frame);
    stepGame(state, frame);
    hashes.push(hashState(state));
  }
  finishReplay(replay, state);
  return { replay, state, hashes };
}

describe('replay', () => {
  it('reproduz a luta gravada idêntica, frame a frame', () => {
    const { replay, state, hashes } = recordMatch();
    expect(replayLength(replay)).toBe(hashes.length);
    expect(replayLength(replay)).toBeGreaterThan(600);

    const again = replayGame(replay);
    for (let tick = 0; tick < replayLength(replay); tick++) {
      stepGame(again, replayInputs(replay, tick));
      expect(hashState(again)).toBe(hashes[tick]);
    }
    expect(again).toEqual(state);
    expect(again.phase).toBe('over');
    expect(replayMatches(replay, again)).toBe(true);
  });

  it('runReplay confere o hash final', () => {
    const { replay, state } = recordMatch();
    const result = runReplay(replay);
    expect(result.ok).toBe(true);
    expect(result.state.winner).toBe(state.winner);
  });

  it('um input trocado muda a luta e o replay acusa', () => {
    const { replay } = recordMatch();
    const tape = replay.inputs[0];
    if (!tape) throw new Error('sem fita');
    for (let t = 200; t < 260; t++) tape[t] = (tape[t] ?? 0) ^ 0b10011;
    expect(runReplay(replay).ok).toBe(false);
  });

  it('a seed faz parte da luta gravada', () => {
    const { replay } = recordMatch();
    expect(runReplay({ ...replay, seed: replay.seed + 1 }).ok).toBe(false);
  });

  it('grava só os bits de botão e completa quem não mandou input', () => {
    const replay = createReplay(SETUP);
    recordInputs(replay, [0xfffff]);
    expect(replay.inputs).toEqual([[0x1ff], [0]]);
    expect(replayInputs(replay, 0)).toEqual([0x1ff, 0]);
    // depois do fim da fita, ninguém aperta nada
    expect(replayInputs(replay, 5)).toEqual([0, 0]);
  });

  it('não divide dados com o setup', () => {
    const replay = createReplay(SETUP);
    replay.rules.stocks = 1;
    replay.characters[0] = 'outro';
    expect(MATCH_RULES.stocks).toBe(3);
    expect(SETUP.characters[0]).toBe(PLAYABLE_CHARACTERS[0]);
  });
});

describe('arquivo de replay', () => {
  it('ida e volta por texto dá o mesmo replay, que ainda reproduz a luta', () => {
    const { replay } = recordMatch();
    const loaded = decodeReplay(encodeReplay(replay));
    expect(loaded).toEqual(replay);
    expect(runReplay(loaded).ok).toBe(true);
  });

  it('o arquivo é pequeno (inputs repetidos viram contagem)', () => {
    const { replay } = recordMatch();
    const text = encodeReplay(replay);
    const raw = JSON.stringify(replay.inputs).length;
    expect(text.length).toBeLessThan(raw / 2);
  });

  it('replay vazio também vai e volta', () => {
    const replay = createReplay(SETUP);
    expect(decodeReplay(encodeReplay(replay))).toEqual(replay);
  });

  const valid = (): Record<string, unknown> =>
    JSON.parse(encodeReplay(recordMatch().replay)) as Record<string, unknown>;

  it.each<[string, (file: Record<string, unknown>) => void, RegExp]>([
    ['outra marca', (f) => (f.jogo = 'outro-jogo'), /não é um replay deste jogo/],
    ['outra versão', (f) => (f.version = 999), /outra versão/],
    ['personagem que não existe', (f) => (f.characters = ['fulano', 'beltrano']), /personagem/],
    ['mapa que não existe', (f) => (f.stageId = 'lua'), /mapa desconhecido/],
    ['fita ímpar', (f) => (f.inputs = [[1], [1]]), /fita de inputs quebrada/],
    [
      'bitmask fora dos botões',
      (f) =>
        (f.inputs = [
          [4096, 3],
          [0, 3],
        ]),
      /fita de inputs inválida/,
    ],
    [
      'contagem zero',
      (f) =>
        (f.inputs = [
          [1, 0],
          [1, 0],
        ]),
      /fita de inputs inválida/,
    ],
    [
      'fitas de tamanhos diferentes',
      (f) =>
        (f.inputs = [
          [1, 5],
          [1, 6],
        ]),
      /tamanhos diferentes/,
    ],
    ['fita a menos', (f) => (f.inputs = [[1, 5]]), /número de fitas/],
    [
      'longo demais',
      (f) =>
        (f.inputs = [
          [1, MAX_REPLAY_TICKS, 2, 1],
          [1, MAX_REPLAY_TICKS, 2, 1],
        ]),
      /longo demais/,
    ],
    ['stocks absurdos', (f) => (f.rules = { stocks: 1e9, timeLimitTicks: 0 }), /Replay inválido/],
    ['seed quebrada', (f) => (f.seed = 1.5), /Replay inválido/],
  ])('recusa arquivo com %s', (_name, breakIt, message) => {
    const file = valid();
    breakIt(file);
    expect(() => decodeReplay(JSON.stringify(file))).toThrow(message);
  });

  it('recusa texto que não é JSON e JSON que não é replay', () => {
    expect(() => decodeReplay('oi')).toThrow(/não é um replay/);
    expect(() => decodeReplay('[]')).toThrow(/Replay inválido/);
    expect(() => decodeReplay('null')).toThrow(/Replay inválido/);
    expect(() => decodeReplay(JSON.stringify({ jogo: REPLAY_TAG }))).toThrow(/Replay inválido/);
  });
});
