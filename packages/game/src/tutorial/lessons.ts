import {
  Button,
  placeAtSpawn,
  px,
  SUBPX,
  type ButtonName,
  type CueName,
  type Fighter,
  type GameState,
  type HitEvent,
  type InputMask,
} from '@jogo-luta/sim';

/**
 * Lições do tutorial: cada uma arruma o palco, mostra o movimento (o Crocko
 * jogando sozinho, com os inputs da demonstração) e depois confere se o jogador
 * conseguiu fazer. Tudo lê e mexe só no estado do sim: roda em teste, sem Phaser.
 *
 * O jogador é sempre o lutador 0 (Crocko) e o boneco de treino é o lutador 1.
 */

export const PLAYER = 0;
export const DUMMY = 1;

/** O que cada lição guarda enquanto roda (zerado a cada demonstração e tentativa). */
export type Memo = Record<string, number>;

export interface LessonCtx {
  state: GameState;
  me: Fighter;
  dummy: Fighter;
  /** Ticks desde o começo da demonstração ou da tentativa. */
  t: number;
  memo: Memo;
}

export interface Lesson {
  id: string;
  title: string;
  /**
   * O que fazer, em uma ou duas frases. Botões como `{ATTACK}`: viram a tecla ou o
   * botão do controle que a pessoa escolheu (`formatPrompt`).
   */
  text: string;
  /** Botões usados (a dica com as teclas de cada um aparece embaixo do texto). */
  buttons: readonly ButtonName[];
  /** Arruma o palco: onde cada um fica, dano, etc. */
  setup: (state: GameState) => void;
  /** Input do Crocko na demonstração. */
  demo: (ctx: LessonCtx) => InputMask;
  /** Input do boneco (sem isso, fica parado). */
  dummy?: (ctx: LessonCtx) => InputMask;
  /** O boneco vai atacar: mostra o "!" em cima dele. */
  warning?: (ctx: LessonCtx) => boolean;
  /** Conseguiu? Chamado depois de cada tick (os eventos do tick estão em `state.events`). */
  done: (ctx: LessonCtx) => boolean;
}

const { LEFT, RIGHT, UP, DOWN, JUMP, ATTACK, SPECIAL, DODGE, TAUNT } = Button;

/** Coloca o lutador parado com os pés em (x, y) px, virado para `facing`. */
export function place(f: Fighter, x: number, y: number, facing: -1 | 1, damage = 0): void {
  placeAtSpawn(f, { x: px(x), y: px(y) });
  f.facing = facing;
  f.damage = damage;
  f.respawnTicks = 0;
  f.stocks = TUTORIAL_STOCKS;
}

/** Vidas de cada um no tutorial: ninguém fica sem. */
export const TUTORIAL_STOCKS = 99;

/** Centro dos pés, em px. */
export function feetX(f: Fighter): number {
  return (f.x + f.w / 2) / SUBPX;
}

export function feetY(f: Fighter): number {
  return (f.y + f.h) / SUBPX;
}

/** Segura entre os ticks `from` (inclusive) e `to` (exclusive). */
function during(t: number, from: number, to: number): boolean {
  return t >= from && t < to;
}

/** O jogador fez esta ação neste tick (pulo, pulo aéreo, wall jump...). */
function didAction(state: GameState, action: CueName): boolean {
  return state.events.some(
    (e) => e.type === 'action' && e.fighter === PLAYER && e.action === action,
  );
}

/** O jogador acertou o boneco neste tick. */
function hitDummy(state: GameState, kind?: HitEvent['kind']): boolean {
  return state.events.some(
    (e) =>
      e.type === 'hit' &&
      e.attacker === PLAYER &&
      e.victim === DUMMY &&
      (kind === undefined || e.kind === kind),
  );
}

/** Acertou o boneco com este golpe base neste tick. */
function hitWith(ctx: LessonCtx, move: string): boolean {
  return hitDummy(ctx.state, 'hit') && ctx.me.move === move;
}

/** Boneco fora do caminho (lições de movimento): no chão, na ponta direita. */
function dummyAside(state: GameState): void {
  const dummy = state.fighters[DUMMY];
  if (dummy) place(dummy, 380, 0, -1);
}

export function setupPair(meX: number, dummyX: number, dummyDamage = 0) {
  return (state: GameState): void => {
    const [me, dummy] = [state.fighters[PLAYER], state.fighters[DUMMY]];
    if (me) place(me, meX, 0, dummyX > meX ? 1 : -1);
    if (dummy) place(dummy, dummyX, 0, dummyX > meX ? -1 : 1, dummyDamage);
  };
}

function setupAlone(x: number, y: number, facing: -1 | 1 = 1) {
  return (state: GameState): void => {
    const me = state.fighters[PLAYER];
    if (me) place(me, x, y, facing);
    dummyAside(state);
  };
}

/**
 * Boneco que vem andando até o jogador e ataca de lado de tempos em tempos (a
 * lição do contra-ataque). O "!" aparece `WARN_TICKS` antes do golpe.
 */
const DUMMY_CYCLE = 110;
const DUMMY_STRIKE = 60;
const WARN_TICKS = 24;
const DUMMY_REACH = 70;

function strikingDummy(ctx: LessonCtx): InputMask {
  const { me, dummy, memo } = ctx;
  if (dummy.state === 'hitstun' || dummy.state === 'ko' || me.state === 'ko') {
    memo.timer = 0;
    return 0;
  }
  const dx = feetX(me) - feetX(dummy);
  const toward = dx > 0 ? RIGHT : LEFT;
  const gap = Math.abs(dx) - (me.w + dummy.w) / 2 / SUBPX;
  const timer = memo.timer ?? 0;
  // longe: anda até o jogador (sem atacar no meio do caminho)
  if (gap > DUMMY_REACH && timer < DUMMY_STRIKE - WARN_TICKS) {
    memo.timer = 0;
    return toward;
  }
  memo.timer = (timer + 1) % DUMMY_CYCLE;
  // a cada golpe o dano do jogador volta a zero: errar não joga ele para fora
  if (memo.timer === 0) me.damage = 0;
  return timer === DUMMY_STRIKE ? toward | ATTACK : 0;
}

function strikeComing(ctx: LessonCtx): boolean {
  const timer = ctx.memo.timer ?? 0;
  return timer >= DUMMY_STRIKE - WARN_TICKS && timer <= DUMMY_STRIKE + 6;
}

export const LESSONS: readonly Lesson[] = [
  {
    id: 'andar',
    title: 'Andar',
    text: 'Ande para os lados com {LEFT} e {RIGHT}.',
    buttons: ['LEFT', 'RIGHT'],
    setup: setupAlone(-40, 0),
    demo: ({ t }) => (during(t, 10, 60) ? RIGHT : during(t, 70, 100) ? LEFT : 0),
    done: ({ me, memo }) => {
      memo.minX = Math.min(memo.minX ?? feetX(me), feetX(me));
      memo.maxX = Math.max(memo.maxX ?? feetX(me), feetX(me));
      return memo.maxX - memo.minX >= 220;
    },
  },
  {
    id: 'pulo',
    title: 'Pulo e pulo duplo',
    text: 'Aperte {JUMP} para pular. No ar, aperte {JUMP} de novo para o pulo duplo. Tocar de leve faz um pulo mais baixo.',
    buttons: ['JUMP'],
    setup: setupAlone(-40, 0),
    demo: ({ t }) => (during(t, 10, 26) || during(t, 34, 46) ? JUMP : 0),
    done: ({ state }) => didAction(state, 'AIR_JUMP'),
  },
  {
    id: 'queda-rapida',
    title: 'Queda rápida',
    text: 'No ar, depois do ponto mais alto do pulo, segure {DOWN} para cair mais rápido.',
    buttons: ['JUMP', 'DOWN'],
    setup: setupAlone(-40, 0),
    demo: ({ t }) => (during(t, 10, 30) ? JUMP : during(t, 40, 80) ? DOWN : 0),
    done: ({ me }) => me.fastFalling,
  },
  {
    id: 'plataforma',
    title: 'Descer da plataforma',
    text: 'As plataformas finas dá para atravessar pulando por baixo. Em cima de uma, aperte {DOWN} para descer por ela.',
    buttons: ['DOWN'],
    setup: setupAlone(-265, -150),
    demo: ({ t }) => (during(t, 20, 26) ? DOWN : 0),
    done: ({ me, memo }) => {
      if (me.dropTicks > 0) memo.dropped = 1;
      return memo.dropped === 1 && me.grounded && !me.onPlatform;
    },
  },
  {
    id: 'soco',
    title: 'Ataque comum',
    text: 'Ataque parado ({ATTACK}) dá um soco rápido. Acerte o boneco!',
    buttons: ['ATTACK'],
    setup: setupPair(-40, 40),
    demo: ({ t }) => (during(t, 15, 19) ? ATTACK : 0),
    done: (ctx) => hitWith(ctx, 'neutralLight'),
  },
  {
    id: 'lado',
    title: 'Ataque para o lado',
    text: 'Ataque para o lado ({ATTACK} + {RIGHT} ou {LEFT}) avança e arremessa na horizontal.',
    buttons: ['ATTACK', 'RIGHT'],
    setup: setupPair(-90, 40),
    demo: ({ t }) => (during(t, 15, 21) ? RIGHT | ATTACK : 0),
    done: (ctx) => hitWith(ctx, 'sideLight'),
  },
  {
    id: 'rasteira',
    title: 'Rasteira',
    text: 'Ataque para baixo ({ATTACK} + {DOWN}) no chão é uma rasteira, que joga o adversário para cima.',
    buttons: ['ATTACK', 'DOWN'],
    setup: setupPair(-40, 40),
    demo: ({ t }) => (during(t, 15, 21) ? DOWN | ATTACK : 0),
    done: (ctx) => hitWith(ctx, 'downLight'),
  },
  {
    id: 'cima',
    title: 'Ataque para cima',
    text: 'Ataque para cima ({ATTACK} + {UP}) acerta para cima e dá um impulso. No ar, é a recuperação para voltar ao palco (1 vez por pulo).',
    buttons: ['ATTACK', 'UP'],
    setup: setupPair(-40, 40),
    demo: ({ t }) => (during(t, 15, 21) ? UP | ATTACK : 0),
    done: ({ me }) => me.state === 'attack' && me.move === 'recovery',
  },
  {
    id: 'aereo',
    title: 'Ataques no ar',
    text: 'No ar, Ataque ({ATTACK}) faz golpes aéreos: parado, + {RIGHT}/{LEFT} (o mais forte, bom para nocautear) ou + {DOWN}.',
    buttons: ['JUMP', 'ATTACK'],
    setup: setupPair(-120, 60),
    demo: ({ t }) =>
      during(t, 10, 24)
        ? JUMP | RIGHT
        : during(t, 24, 30)
          ? RIGHT | ATTACK
          : during(t, 30, 40)
            ? RIGHT
            : 0,
    done: ({ me }) =>
      me.state === 'attack' &&
      !me.grounded &&
      (me.move === 'neutralAir' || me.move === 'sideAir' || me.move === 'downAir'),
  },
  {
    id: 'esquiva',
    title: 'Esquiva',
    text: 'Esquiva ({DODGE}) no chão é um dash rápido. No ar, é uma esquiva em qualquer direção que te deixa invencível por um instante (1 por pulo). Faça uma no ar.',
    buttons: ['DODGE', 'JUMP'],
    setup: setupAlone(-40, 0),
    demo: ({ t }) => (during(t, 10, 24) ? JUMP : during(t, 30, 34) ? DODGE | RIGHT : 0),
    done: ({ me }) => me.state === 'dodge',
  },
  {
    id: 'pisao',
    title: 'Pisão (ground pound)',
    text: 'No ar, Especial para baixo ({SPECIAL} + {DOWN}) despenca e acerta quem estiver perto ao tocar o chão. Todo personagem tem.',
    buttons: ['JUMP', 'SPECIAL', 'DOWN'],
    setup: setupPair(-60, 80),
    demo: ({ t }) => (during(t, 10, 28) ? JUMP : during(t, 34, 40) ? DOWN | SPECIAL : 0),
    done: ({ me }) => me.move === 'groundPound' || me.move === 'groundPoundLand',
  },
  {
    id: 'parede',
    title: 'Deslizar e pular na parede',
    text: 'No ar, encostado na lateral do palco, segure a direção da parede ({RIGHT}) para deslizar devagar. Aí aperte {JUMP}: é o wall jump (até 3 seguidos).',
    buttons: ['RIGHT', 'JUMP'],
    // fora do palco, à esquerda, encostado na parede e já abaixo do topo
    setup: setupAlone(-475, 200),
    demo: ({ me, t, memo }) => {
      if (me.state === 'wallslide') memo.slid = (memo.slid ?? 0) + 1;
      if ((memo.slid ?? 0) > 12) return JUMP;
      return t >= 4 ? RIGHT : 0;
    },
    done: ({ state }) => didAction(state, 'WALL_JUMP'),
  },
  {
    id: 'borda',
    title: 'Agarrar a borda',
    text: 'Caindo perto da quina do palco, o lutador agarra a borda sozinho. Pendurado: {UP} ou a direção do palco sobe, {JUMP} pula e {DOWN} solta.',
    buttons: ['UP', 'JUMP', 'DOWN'],
    // fora do palco, à esquerda, um pouco acima da quina: cai e agarra
    setup: setupAlone(-480, -20),
    demo: ({ me, memo }) => {
      if (me.state === 'ledge') memo.hang = (memo.hang ?? 0) + 1;
      return (memo.hang ?? 0) > 30 ? UP : 0;
    },
    done: ({ me, memo }) => {
      if (me.state === 'ledge') memo.grabbed = 1;
      return memo.grabbed === 1 && me.grounded && feetY(me) === 0;
    },
  },
  {
    id: 'nocaute',
    title: 'Nocaute',
    text: 'O objetivo é jogar o adversário para fora da tela. Cada golpe soma % de dano, e quanto mais %, mais longe ele voa. O boneco está com 150%: arremesse ele!',
    buttons: ['ATTACK', 'RIGHT'],
    setup: setupPair(230, 320, 150),
    demo: ({ t }) => (during(t, 15, 21) ? RIGHT | ATTACK : 0),
    done: ({ state }) => state.events.some((e) => e.type === 'ko' && e.fighter === DUMMY),
  },
  {
    id: 'contra-ataque',
    title: 'Especial do Crocko: Correção postural',
    text: 'Esse especial do Crocko é de contra-ataque: ele trava numa pose de pilates e quem bater nele nessa hora leva um tapa que arremessa (devolve até projétil). Se ninguém bater, ele perde o equilíbrio e fica exposto. Quando aparecer o "!", aperte Especial ({SPECIAL}) logo antes do golpe chegar.',
    buttons: ['SPECIAL'],
    setup: setupPair(-60, 60),
    demo: (ctx) => ((ctx.memo.timer ?? 0) === DUMMY_STRIKE - 6 ? SPECIAL : 0),
    dummy: strikingDummy,
    warning: strikeComing,
    done: ({ state }) => hitDummy(state, 'counter'),
  },
  {
    id: 'provocacao',
    title: 'Provocação',
    text: 'Provocação ({TAUNT}) serve só para zoar (no chão, parado). Cuidado: dá para apanhar no meio dela!',
    buttons: ['TAUNT'],
    setup: setupPair(-120, 120),
    demo: ({ t }) => (during(t, 15, 19) ? TAUNT : 0),
    done: ({ me }) => me.state === 'taunt',
  },
];
