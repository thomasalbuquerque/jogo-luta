import {
  createGame,
  NO_INPUT,
  STAGES,
  type GameState,
  type InputMask,
  type MatchRules,
} from '@jogo-luta/sim';
import {
  DUMMY,
  LESSONS,
  PLAYER,
  setupPair,
  TUTORIAL_STOCKS,
  type Lesson,
  type LessonCtx,
  type Memo,
} from './lessons';

/** O jogador é o Crocko; o adversário é o boneco de treino (o `base` do sim). */
export const TUTORIAL_CHARACTERS = ['crocko', 'base'] as const;

/** Sem contagem, sem relógio e com vidas de sobra. */
export const TUTORIAL_RULES: MatchRules = { stocks: TUTORIAL_STOCKS, timeLimitTicks: 0 };

/**
 * `demo`: o Crocko joga sozinho mostrando o movimento. `try`: vez do jogador.
 * `done`: conseguiu (o jogador continua mexendo um pouco antes da próxima lição).
 * `finished`: acabou o tutorial; treino livre com o boneco.
 */
export type TutorialPhase = 'demo' | 'try' | 'done' | 'finished';

/** Depois que a demonstração consegue, ainda mostra isto antes de passar a vez. */
export const DEMO_TAIL_TICKS = 45;
/** Demonstração mais longa que isto passa a vez mesmo sem ter conseguido. */
export const DEMO_MAX_TICKS = 480;
/** Tempo do "Boa!" antes da próxima lição. */
export const DONE_TICKS = 80;
/** Alguém saiu da tela no meio da tentativa: arruma o palco de novo depois disto. */
export const RESET_AFTER_KO_TICKS = 50;

export function createTutorialGame(seed = 1): GameState {
  const stage = STAGES[0];
  return createGame({
    characters: TUTORIAL_CHARACTERS,
    rules: TUTORIAL_RULES,
    seed,
    ...(stage ? { stage } : {}),
  });
}

/**
 * Roteiro do tutorial: em cada tick decide o input do Crocko (demonstração ou
 * jogador) e do boneco, e depois do tick confere se a lição foi cumprida.
 * Só mexe no estado do sim entre ticks (posições ao arrumar o palco).
 */
export class TutorialDirector {
  index = 0;
  phase: TutorialPhase = 'demo';
  /** Ticks na fase atual. */
  t = 0;
  private memo: Memo = {};
  /** Tick (da fase) em que a demonstração conseguiu; -1 = ainda não. */
  private demoDoneAt = -1;
  /** Tick (da fase) em que o palco é arrumado de novo; -1 = nenhum. */
  private resetAt = -1;

  /** Nos testes: a vez do jogador também usa os inputs da demonstração. */
  autoplay = false;

  constructor(readonly lessons: readonly Lesson[] = LESSONS) {}

  /** A demonstração atual já mostrou o movimento dando certo. */
  get demoSucceeded(): boolean {
    return this.demoDoneAt >= 0;
  }

  get lesson(): Lesson | null {
    return this.lessons[this.index] ?? null;
  }

  /** O boneco vai atacar (mostra o "!" em cima dele). */
  warning(state: GameState): boolean {
    const lesson = this.lesson;
    if (!lesson?.warning || this.phase === 'finished') return false;
    const ctx = this.ctx(state);
    return ctx ? lesson.warning(ctx) : false;
  }

  /** Começa a lição `index` pela demonstração (fora da lista: tutorial concluído). */
  start(state: GameState, index: number): void {
    this.index = Math.max(0, Math.min(index, this.lessons.length));
    const lesson = this.lesson;
    if (!lesson) {
      // treino livre: os dois de volta ao palco, frente a frente
      this.enter('finished');
      state.projectiles.length = 0;
      setupPair(-150, 150)(state);
      return;
    }
    this.enter('demo');
    this.arrange(state, lesson);
  }

  /** Mostra de novo a demonstração da lição atual. */
  replayDemo(state: GameState): void {
    this.start(state, this.index);
  }

  /** Pula para a próxima lição. */
  skip(state: GameState): void {
    this.start(state, this.index + 1);
  }

  /** Inputs deste tick (Crocko, boneco), com o input do jogador `player`. */
  inputs(state: GameState, player: InputMask): InputMask[] {
    const lesson = this.lesson;
    const ctx = this.ctx(state);
    const out: InputMask[] = state.fighters.map(() => NO_INPUT);
    if (!lesson || !ctx || this.phase === 'finished') {
      out[PLAYER] = player;
      return out;
    }
    // o boneco primeiro: a demonstração do contra-ataque lê o relógio dele
    out[DUMMY] = lesson.dummy?.(ctx) ?? NO_INPUT;
    out[PLAYER] = this.phase === 'demo' || this.autoplay ? lesson.demo(ctx) : player;
    return out;
  }

  /** Depois do tick: confere a lição e passa de fase. */
  afterStep(state: GameState): void {
    const lesson = this.lesson;
    const ctx = this.ctx(state);
    this.t++;
    if (!lesson || !ctx || this.phase === 'finished') return;
    const ko = state.events.some((e) => e.type === 'ko');

    switch (this.phase) {
      case 'demo':
        if (this.demoDoneAt < 0 && lesson.done(ctx)) this.demoDoneAt = this.t;
        if (
          (this.demoDoneAt >= 0 && this.t - this.demoDoneAt >= DEMO_TAIL_TICKS) ||
          this.t >= DEMO_MAX_TICKS
        ) {
          this.enter('try');
          this.arrange(state, lesson);
        }
        break;
      case 'try':
        if (lesson.done(ctx)) {
          this.enter('done');
          break;
        }
        if (ko && this.resetAt < 0) this.resetAt = this.t + RESET_AFTER_KO_TICKS;
        if (this.resetAt >= 0 && this.t >= this.resetAt) {
          this.resetAt = -1;
          this.memo = {};
          lesson.setup(state);
        }
        break;
      case 'done':
        if (this.t >= DONE_TICKS) this.start(state, this.index + 1);
        break;
    }
  }

  private enter(phase: TutorialPhase): void {
    this.phase = phase;
    this.t = 0;
    this.memo = {};
    this.demoDoneAt = -1;
    this.resetAt = -1;
  }

  /** Arruma o palco da lição: projéteis somem, recargas zeram. */
  private arrange(state: GameState, lesson: Lesson): void {
    state.projectiles.length = 0;
    lesson.setup(state);
  }

  private ctx(state: GameState): LessonCtx | null {
    const me = state.fighters[PLAYER];
    const dummy = state.fighters[DUMMY];
    if (!me || !dummy) return null;
    return { state, me, dummy, t: this.t, memo: this.memo };
  }
}
