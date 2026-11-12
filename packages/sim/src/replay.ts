import { z } from 'zod';
import { hasCharacter } from './characters';
import { TICK_RATE } from './constants';
import { createGame, getStage, stepGame, type GameState, type MatchRules } from './game';
import { INPUT_BITS, NO_INPUT, type InputMask } from './input';
import { hashState } from './snapshot';
import { STAGES } from './stage';

/**
 * Replay: a seed e os inputs de cada tick. Como o `sim` é determinístico,
 * rodar de novo com esses dados dá a mesma luta, frame a frame.
 *
 * O replay só vale para a mesma versão das regras: se um número de golpe ou de
 * personagem mudar, a luta sai diferente. O `finalHash` denuncia isso.
 */
export const REPLAY_VERSION = 1;
/** Marca do arquivo de replay. */
export const REPLAY_TAG = 'jogo-luta-replay';
/** Tamanho máximo de um replay (30 min): arquivo maior que isso é recusado. */
export const MAX_REPLAY_TICKS = 30 * 60 * TICK_RATE;

export interface ReplaySetup {
  characters: readonly string[];
  stageId: string;
  rules: MatchRules;
  seed: number;
  /** Time de cada jogador (sem isso: todos contra todos). */
  teams?: readonly number[] | null;
}

export interface Replay {
  version: number;
  seed: number;
  /** Id da ficha de cada jogador, na ordem. */
  characters: string[];
  stageId: string;
  rules: MatchRules;
  /** Time de cada jogador, na ordem (sem isso: todos contra todos). */
  teams?: number[];
  /** `inputs[jogador][tick]`: a bitmask que o `sim` recebeu. */
  inputs: InputMask[][];
  /** Hash do estado depois do último tick gravado (0 enquanto a gravação não fechou). */
  finalHash: number;
}

/** Replay vazio, pronto para gravar a luta criada com este mesmo setup. */
export function createReplay(setup: ReplaySetup): Replay {
  const replay: Replay = {
    version: REPLAY_VERSION,
    seed: setup.seed,
    characters: [...setup.characters],
    stageId: setup.stageId,
    rules: { ...setup.rules },
    inputs: setup.characters.map(() => []),
    finalHash: 0,
  };
  if (setup.teams) replay.teams = [...setup.teams];
  return replay;
}

/** A luta do replay, no tick 0. */
export function replayGame(replay: Replay): GameState {
  return createGame({
    characters: replay.characters,
    stage: getStage(replay.stageId),
    rules: replay.rules,
    seed: replay.seed,
    ...(replay.teams ? { teams: replay.teams } : {}),
  });
}

/** Ticks gravados. */
export function replayLength(replay: Replay): number {
  return replay.inputs[0]?.length ?? 0;
}

/** Grava os inputs de 1 tick (os mesmos que vão para o `stepGame`). */
export function recordInputs(replay: Replay, inputs: readonly InputMask[]): void {
  for (const [player, tape] of replay.inputs.entries()) {
    tape.push((inputs[player] ?? NO_INPUT) & INPUT_BITS);
  }
}

/** Fecha a gravação: guarda o hash do estado a que a luta chegou. */
export function finishReplay(replay: Replay, state: GameState): void {
  replay.finalHash = hashState(state);
}

/** Inputs de todos os jogadores num tick (depois do fim: ninguém aperta nada). */
export function replayInputs(replay: Replay, tick: number): InputMask[] {
  return replay.inputs.map((tape) => tape[tick] ?? NO_INPUT);
}

/** O estado chegou aonde a gravação chegou? Falso = outra versão das regras (ou dessincronizou). */
export function replayMatches(replay: Replay, state: GameState): boolean {
  return hashState(state) === replay.finalHash;
}

/** Roda o replay inteiro, sem desenhar. `ok`: reproduziu a luta gravada. */
export function runReplay(replay: Replay): { state: GameState; ok: boolean } {
  const state = replayGame(replay);
  const length = replayLength(replay);
  for (let tick = 0; tick < length; tick++) stepGame(state, replayInputs(replay, tick));
  return { state, ok: replayMatches(replay, state) };
}

/** Comprime uma fita em pares [bitmask, repetições]: quem joga segura os botões por vários ticks. */
function packTape(tape: readonly InputMask[]): number[] {
  const out: number[] = [];
  let i = 0;
  while (i < tape.length) {
    const mask = tape[i] ?? NO_INPUT;
    let count = 1;
    while (i + count < tape.length && tape[i + count] === mask) count++;
    out.push(mask, count);
    i += count;
  }
  return out;
}

function unpackTape(pairs: readonly number[]): InputMask[] {
  const out: InputMask[] = [];
  for (let i = 0; i + 1 < pairs.length; i += 2) {
    const mask = pairs[i] ?? NO_INPUT;
    const count = pairs[i + 1] ?? 0;
    for (let n = 0; n < count; n++) out.push(mask);
  }
  return out;
}

/** Texto (JSON) do replay, para salvar em arquivo e mandar no grupo. */
export function encodeReplay(replay: Replay): string {
  return JSON.stringify({
    jogo: REPLAY_TAG,
    version: replay.version,
    seed: replay.seed,
    characters: replay.characters,
    stageId: replay.stageId,
    rules: replay.rules,
    teams: replay.teams,
    inputs: replay.inputs.map(packTape),
    finalHash: replay.finalHash,
  });
}

const uint32 = z.number().int().min(0).max(0xffffffff);
const ticks = z.number().int().min(0).max(MAX_REPLAY_TICKS);

function tapeTicks(pairs: readonly number[]): number {
  let total = 0;
  for (let i = 1; i < pairs.length; i += 2) total += pairs[i] ?? 0;
  return total;
}

/** O arquivo vem de fora (mandado no grupo): tudo é conferido antes de virar luta. */
const ReplayFileSchema = z
  .object({
    jogo: z.literal(REPLAY_TAG, { error: 'não é um replay deste jogo' }),
    version: z.literal(REPLAY_VERSION, { error: 'replay de outra versão do jogo' }),
    seed: uint32,
    characters: z
      .array(z.string().refine(hasCharacter, { error: 'personagem desconhecido' }))
      .min(1)
      .max(4),
    stageId: z.string().refine((id) => STAGES.some((s) => s.id === id), {
      error: 'mapa desconhecido',
    }),
    rules: z.object({
      stocks: z.number().int().min(1).max(99),
      timeLimitTicks: ticks,
      countdownTicks: ticks.optional(),
      friendlyFire: z.boolean().optional(),
    }),
    teams: z.array(z.number().int().min(0).max(3)).max(4).optional(),
    inputs: z
      .array(
        z
          .array(z.number().int().min(0).max(MAX_REPLAY_TICKS))
          .refine((pairs) => pairs.length % 2 === 0, { error: 'fita de inputs quebrada' })
          .refine((pairs) => pairs.every((v, i) => (i % 2 === 0 ? v <= INPUT_BITS : v >= 1)), {
            error: 'fita de inputs inválida',
          })
          .refine((pairs) => tapeTicks(pairs) <= MAX_REPLAY_TICKS, {
            error: 'replay longo demais',
          }),
      )
      .max(4),
    finalHash: uint32,
  })
  .refine((r) => !r.teams || r.teams.length === r.characters.length, {
    error: 'times não batem com os jogadores',
  })
  .refine((r) => r.inputs.length === r.characters.length, {
    error: 'número de fitas diferente do número de jogadores',
  })
  .refine((r) => r.inputs.every((t) => tapeTicks(t) === tapeTicks(r.inputs[0] ?? [])), {
    error: 'fitas de tamanhos diferentes',
  });

/** Lê o texto de `encodeReplay`. Arquivo estranho ou quebrado: erro com mensagem legível. */
export function decodeReplay(text: string): Replay {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Replay inválido: o arquivo não é um replay.');
  }
  const parsed = ReplayFileSchema.safeParse(data);
  if (!parsed.success) {
    const reason = parsed.error.issues[0]?.message ?? 'arquivo inválido';
    throw new Error(`Replay inválido: ${reason}.`);
  }
  const file = parsed.data;
  const rules: MatchRules = {
    stocks: file.rules.stocks,
    timeLimitTicks: file.rules.timeLimitTicks,
  };
  if (file.rules.countdownTicks !== undefined) rules.countdownTicks = file.rules.countdownTicks;
  if (file.rules.friendlyFire !== undefined) rules.friendlyFire = file.rules.friendlyFire;
  const replay: Replay = {
    version: file.version,
    seed: file.seed,
    characters: file.characters,
    stageId: file.stageId,
    rules,
    inputs: file.inputs.map(unpackTape),
    finalHash: file.finalHash,
  };
  if (file.teams) replay.teams = file.teams;
  return replay;
}
