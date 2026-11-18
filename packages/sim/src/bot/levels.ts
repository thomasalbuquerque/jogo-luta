/**
 * Os 3 níveis do bot. Cada nível é só um conjunto de números: o mesmo cérebro
 * (`bot.ts`) joga nos três, mudando quanto demora para reagir, quanto erra, quanto
 * ataca e quanto se defende. Chances em % (0 a 100), tempos em ticks.
 */
export const BOT_LEVELS = ['easy', 'medium', 'hard'] as const;

export type BotLevel = (typeof BOT_LEVELS)[number];

/** Nome do nível na tela. */
export const BOT_LEVEL_NAMES: Readonly<Record<BotLevel, string>> = {
  easy: 'Fácil',
  medium: 'Médio',
  hard: 'Difícil',
};

export function isBotLevel(value: unknown): value is BotLevel {
  return typeof value === 'string' && (BOT_LEVELS as readonly string[]).includes(value);
}

export interface BotProfile {
  /** Tempo de reação: o bot vê os adversários com este atraso (média, em ticks). */
  reaction: number;
  /** Variação do tempo de reação, para mais ou para menos (sorteada a cada decisão). */
  reactionJitter: number;
  /** Quanto do atraso o bot compensa prevendo o movimento do adversário (%). */
  predict: number;
  /** Ticks entre uma decisão e outra (sorteado entre os dois). */
  thinkMin: number;
  thinkMax: number;
  /** Chance de atacar quando um golpe alcança. */
  aggression: number;
  /** Chance de punir quem errou o golpe (o adversário no fim do golpe, exposto). */
  punish: number;
  /** Chance de se defender de um golpe ou projétil que vem (cada um sorteia uma vez). */
  defend: number;
  /** Erro no tempo da esquiva, em ticks (para mais ou para menos). */
  dodgeError: number;
  /** Chance de errar: golpe pior que o melhor, ou atacar fora do alcance. */
  mistake: number;
  /** Chance de se distrair um pouco a cada decisão (fica à toa por um tempo). */
  distraction: number;
  /** Chance de esperar na borda o adversário que está voltando ao palco. */
  edgeguard: number;
  /** Chance de ir atrás do adversário depois de acertar (combo). */
  followUp: number;
  /** Chance de usar o especial quando ele serve. */
  special: number;
  /** Chance de provocar depois de tirar uma vida. */
  taunt: number;
  /**
   * Volta ao palco: ticks de folga ao decidir esperar mais um pouco antes de gastar
   * o pulo aéreo ou a recuperação (mais folga = gasta mais cedo, mais seguro).
   */
  recoveryMargin: number;
  /** Chance de errar a volta ao palco (gastar tudo cedo demais, ou demorar). */
  recoveryMistake: number;
  /** Chance de usar técnica: pulo curto, queda rápida e dash. */
  tech: number;
}

export const BOT_PROFILES: Readonly<Record<BotLevel, BotProfile>> = {
  easy: {
    reaction: 26,
    reactionJitter: 6,
    predict: 0,
    thinkMin: 16,
    thinkMax: 30,
    aggression: 30,
    punish: 20,
    defend: 12,
    dodgeError: 6,
    mistake: 35,
    distraction: 9,
    edgeguard: 0,
    followUp: 15,
    special: 35,
    taunt: 60,
    recoveryMargin: 4,
    recoveryMistake: 25,
    tech: 5,
  },
  medium: {
    reaction: 18,
    reactionJitter: 4,
    predict: 40,
    thinkMin: 9,
    thinkMax: 17,
    aggression: 55,
    punish: 50,
    defend: 40,
    dodgeError: 3,
    mistake: 14,
    distraction: 2,
    edgeguard: 35,
    followUp: 45,
    special: 65,
    taunt: 40,
    recoveryMargin: 8,
    recoveryMistake: 6,
    tech: 35,
  },
  hard: {
    reaction: 13,
    reactionJitter: 3,
    predict: 80,
    thinkMin: 5,
    thinkMax: 10,
    aggression: 75,
    punish: 85,
    defend: 65,
    dodgeError: 2,
    mistake: 5,
    distraction: 0,
    edgeguard: 70,
    followUp: 75,
    special: 85,
    taunt: 30,
    recoveryMargin: 10,
    recoveryMistake: 0,
    tech: 70,
  },
};
