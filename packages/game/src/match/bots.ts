import {
  Bot,
  BOT_LEVEL_NAMES,
  isBotLevel,
  NO_INPUT,
  type BotLevel,
  type GameState,
  type InputMask,
} from '@jogo-luta/sim';

/**
 * Bots na luta local: quem é bot em cada lugar e a troca dos inputs. O bot é um
 * controle a mais (`sim/bot`): o jogo só pergunta a ele o input de cada tick.
 */

/** Nível do bot de cada lugar, na ordem dos lutadores (null = gente jogando). */
export type BotSlots = readonly (BotLevel | null)[];

/** Algum lugar é bot. */
export function hasBots(bots: BotSlots | null | undefined): bots is BotSlots {
  return bots?.some((b) => b !== null) === true;
}

/** Lugares de bot vindos de fora (dados de cena): o que não é nível vira gente. */
export function parseBots(raw: unknown): BotSlots | null {
  if (!Array.isArray(raw)) return null;
  const bots = raw.map((b: unknown) => (isBotLevel(b) ? b : null));
  return hasBots(bots) ? bots : null;
}

/** Como o bot aparece (HUD, em cima do lutador, resultado): "CPU Médio". */
export function botName(level: BotLevel): string {
  return `CPU ${BOT_LEVEL_NAMES[level]}`;
}

/** Nome de cada lugar: o do bot, ou o de quem joga (`humans`, na ordem das pessoas). */
export function seatNames(bots: BotSlots, humans: readonly (string | null)[]): (string | null)[] {
  let human = 0;
  return bots.map((level) => (level ? botName(level) : (humans[human++] ?? null)));
}

/**
 * Inputs de quem é gente, cada um no seu lugar (os de bot ficam vazios). Com uma
 * pessoa só, qualquer teclado ou controle mexe nela; com mais, a 1ª pessoa usa os
 * controles do P1, a 2ª os do P2…
 */
export function humanInputs(sampled: readonly InputMask[], bots: BotSlots): InputMask[] {
  const humans = bots.flatMap((b, i) => (b ? [] : [i]));
  const all = sampled.reduce((a, b) => a | b, NO_INPUT);
  return bots.map((b, i) => {
    if (b) return NO_INPUT;
    if (humans.length === 1) return all;
    return sampled[humans.indexOf(i)] ?? NO_INPUT;
  });
}

/** Os bots de uma luta (um por lugar de bot). Luta nova: bots novos. */
export class BotPlayers {
  private readonly bots: (Bot | null)[];

  constructor(levels: BotSlots, seed: number) {
    this.bots = levels.map((level, id) =>
      level ? new Bot({ id, level, seed: (seed + id * 7919) >>> 0 }) : null,
    );
  }

  /** Troca o input de cada lugar de bot pelo que o bot decidiu olhando o estado. */
  apply(state: GameState, inputs: readonly InputMask[]): InputMask[] {
    return inputs.map((mask, i) => this.bots[i]?.next(state) ?? mask);
  }

  /** O que o bot do lugar `id` está fazendo (null = não é bot). */
  doing(id: number): string | null {
    return this.bots[id]?.doing ?? null;
  }
}
