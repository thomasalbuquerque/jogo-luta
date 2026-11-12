import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createGame,
  nextRng,
  getStage,
  hashState,
  MATCH_RULES,
  NO_INPUT,
  PLAYABLE_CHARACTERS,
  STAGES,
  stepGame,
  type GameState,
} from '@jogo-luta/sim';
import { LoopbackNetwork, type LoopbackOptions } from './loopback';
import { NOTICE_MS, OnlineSession, RECONNECT_MS, SILENCE_DROP_MS } from './session';
import type { Link } from './transport';

const A = PLAYABLE_CHARACTERS[0] ?? '';
const B = PLAYABLE_CHARACTERS[1] ?? '';
const CHARACTERS = [A, B];
const STAGE = STAGES[0]?.id ?? '';
/** Cada passo da rede de mentira vale isto no relógio. */
const STEP_MS = 5;

function fakeLink(): Link & { closed: boolean } {
  return {
    onReady: null,
    onTransport: null,
    onFail: null,
    closed: false,
    close() {
      this.closed = true;
    },
  };
}

/**
 * Uma sala numa rede de mentira, com relógio próprio: o host e `guests` que vão
 * entrar (cada um só se conecta ao host). `builds[0]` é o build do host.
 */
function setup(options: LoopbackOptions = {}, builds: string[] = [], guests = 1) {
  const rng = { rng: 1234 };
  const random = (): number => nextRng(rng) / 0x100000000;
  const net = new LoopbackNetwork({ random, ...options });
  let now = 1000;
  let seed = 1;
  const sessions: OnlineSession[] = [];
  const make = (role: 'host' | 'guest', build = 'b1') => {
    const link = fakeLink();
    const session = new OnlineSession({
      role,
      code: 'ABCD',
      link,
      build,
      clock: () => now,
      newSeed: () => seed++ * 7919,
    });
    sessions.push(session);
    return { link, session };
  };
  const h = make('host', builds[0]);
  const gs = Array.from({ length: guests }, (_, i) => make('guest', builds[i + 1]));
  /** Anda a rede e o relógio `n` passos. */
  const run = (n = 10): void => {
    for (let i = 0; i < n; i++) {
      now += STEP_MS;
      net.step();
      for (const session of sessions) session.update();
    }
  };
  /** Abre uma conexão nova entre o host e quem entra (a 1ª ou uma reconexão). */
  const connect = (guest: OnlineSession = gs[0]?.session ?? h.session) => {
    const [a, b] = net.pair();
    h.session.attach(a);
    guest.attach(b);
    return [a, b] as const;
  };
  /** Todos entram, um de cada vez (cada um pega o próximo lugar). */
  const connectAll = () =>
    gs.map((g) => {
      const ends = connect(g.session);
      run();
      return ends;
    });
  /** Mais alguém que chega depois. */
  const newcomer = (build = 'b1') => make('guest', build);
  const wait = (ms: number): void => {
    now += ms;
  };
  return {
    net,
    host: h.session,
    guest: gs[0]?.session ?? h.session,
    guests: gs.map((g) => g.session),
    hostLink: h.link,
    guestLink: gs[0]?.link ?? h.link,
    run,
    connect,
    connectAll,
    newcomer,
    wait,
  };
}

/** Um lado da luta: o sim e o que ele apertaria em cada tick. */
function player(session: OnlineSession, seed: number) {
  const rng = { rng: seed };
  let state: GameState | null = null;
  let id = -1;
  const hashes: number[] = [];
  const inputs: number[][] = [];
  return {
    hashes,
    inputs,
    get state(): GameState | null {
      return state;
    },
    /** Um quadro do jogo: lê o input, manda, e roda o tick se tiver o input de todos. */
    frame(): void {
      const match = session.match;
      if (!match || session.ended) return;
      if (match.seq !== id || !state) {
        id = match.seq;
        hashes.length = 0;
        inputs.length = 0;
        state = createGame({
          characters: match.characters,
          stage: getStage(match.stageId),
          rules: { ...MATCH_RULES, countdownTicks: 5 },
          seed: match.seed,
        });
      }
      if (state.phase === 'over') return;
      // segura cada sorteio por alguns ticks, como quem joga
      if (match.lockstep.needsLocal()) match.lockstep.addLocal(nextRng(rng) & 0x1ff);
      session.sendInputs();
      if (!match.lockstep.ready()) return;
      const step = match.lockstep.step();
      inputs.push(step);
      stepGame(state, step);
      const hash = hashState(state);
      hashes.push(hash);
      if (state.tick % 30 === 0) session.reportHash(state.tick, hash);
    },
  };
}

type Room = ReturnType<typeof setup>;
type Side = ReturnType<typeof player>;

/** Joga `frames` quadros com todos da sala e devolve cada lado. */
function play(s: Room, frames: number, each?: (frame: number) => void): Side[] {
  const sides = [s.host, ...s.guests].map((session, i) => player(session, 11 * (i + 1)));
  for (let f = 0; f < frames; f++) {
    each?.(f);
    for (const side of sides) side.frame();
    s.run(3);
  }
  return sides;
}

/** Todos os lados viram a mesma luta até onde cada um chegou; devolve até onde todos chegaram. */
function expectSameFight(sides: readonly Side[]): number {
  const n = Math.min(...sides.map((side) => side.hashes.length));
  const first = sides[0]?.hashes.slice(0, n);
  for (const side of sides) expect(side.hashes.slice(0, n)).toEqual(first);
  return n;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('OnlineSession: sala', () => {
  it('quem entra se apresenta e os dois ficam conectados', () => {
    const s = setup();
    expect(s.host.status).toBe('connecting');
    s.hostLink.onReady?.();
    expect(s.host.roomReady).toBe(true);
    s.connect();
    s.run();
    expect(s.host.status).toBe('connected');
    expect(s.guest.status).toBe('connected');
    expect([s.host.local, s.guest.local]).toEqual([0, 1]);
    expect(s.guest.roster).toEqual(s.host.roster);
  });

  it('mede o ping dos dois lados', () => {
    const s = setup({ minDelay: 4, maxDelay: 4 });
    s.connect();
    s.run(400);
    // 4 passos de ida + 4 de volta
    expect(s.host.ping.rtt).toBeCloseTo(8 * STEP_MS, 0);
    expect(s.guest.ping.rtt).toBeCloseTo(8 * STEP_MS, 0);
  });

  it('builds diferentes: quem entra é recusado e o host continua esperando', () => {
    const s = setup({}, ['b1', 'b2']);
    s.connect();
    s.run();
    expect(s.guest.ended).toBe('version');
    expect(s.guestLink.closed).toBe(true);
    expect(s.host.ended).toBeNull();
    expect(s.host.status).toBe('connecting');
    expect(s.host.players).toBe(1);
  });

  it('cabem 4, cada um no seu lugar; o 5º é recusado', () => {
    const s = setup({}, [], 3);
    s.connectAll();
    expect(s.host.players).toBe(4);
    expect(s.guests.map((g) => g.local)).toEqual([1, 2, 3]);
    for (const g of s.guests) expect(g.roster).toEqual(s.host.roster);
    expect(s.guests[0]?.notice).toBe('P4 entrou na sala.');
    const fifth = s.newcomer();
    s.connect(fifth.session);
    s.run();
    expect(fifth.session.ended).toBe('full');
    expect(s.host.players).toBe(4);
    // as conexões de quem já estava continuam valendo
    s.host.openSelect();
    s.run();
    for (const g of s.guests) expect(g.screen?.name).toBe('select');
  });

  it('dá para entrar na seleção, mas não no meio da luta', () => {
    const s = setup();
    s.connect();
    s.run();
    s.host.openSelect();
    s.run();
    s.host.setSel(1, true);
    const third = s.newcomer();
    s.connect(third.session);
    s.run();
    expect(third.session.local).toBe(2);
    expect(third.session.screen?.name).toBe('select');
    expect(third.session.selection(0)).toEqual({ cursor: 1, ready: true });
    expect(s.guest.players).toBe(3);
    expect(s.guest.notice).toBe('P3 entrou na sala.');
    s.host.startMatch([A, B, A], STAGE);
    s.run();
    const late = s.newcomer();
    s.connect(late.session);
    s.run();
    expect(late.session.ended).toBe('busy');
    expect(s.host.players).toBe(3);
  });

  it('sair avisa o outro lado', () => {
    const s = setup();
    s.connect();
    s.run();
    s.guest.leave();
    s.run();
    expect(s.guest.ended).toBe('quit');
    expect(s.host.ended).toBe('left');
    expect(s.hostLink.closed).toBe(true);
  });

  it('o host sai: a sala acaba para todos', () => {
    const s = setup({}, [], 2);
    s.connectAll();
    s.host.leave();
    s.run();
    expect(s.guests.map((g) => g.ended)).toEqual(['host-left', 'host-left']);
  });

  it('quem sai na seleção some da lista e os lugares de quem vem depois andam', () => {
    const s = setup({}, [], 3);
    s.connectAll();
    s.host.openSelect();
    s.run();
    const [p2, p3, p4] = s.guests;
    p3?.setSel(5, true);
    p4?.setSel(6, false);
    s.run();
    p2?.leave();
    s.run();
    expect(s.host.ended).toBeNull();
    expect(s.host.players).toBe(3);
    expect(p3?.local).toBe(1);
    expect(p4?.local).toBe(2);
    expect(p4?.notice).toBe('P2 saiu da sala.');
    expect(s.host.notice).toBe('P2 saiu da sala.');
    // a seleção de cada um vai junto para o lugar novo
    expect(s.host.selection(1)).toEqual({ cursor: 5, ready: true });
    expect(p4?.selection(1)).toEqual({ cursor: 5, ready: true });
    expect(p3?.selection(2)).toEqual({ cursor: 6, ready: false });
    s.wait(NOTICE_MS);
    expect(s.host.notice).toBe('');
  });

  it('falha do Link acaba com a sala', () => {
    const s = setup();
    s.guestLink.onFail?.('not-found');
    expect(s.guest.ended).toBe('not-found');
    expect(s.guest.status).toBe('closed');
  });
});

describe('OnlineSession: telas', () => {
  it('o host manda na tela e quem entra segue', () => {
    const s = setup();
    s.connect();
    s.run();
    s.host.openSelect();
    s.run();
    expect(s.guest.screen).toEqual(s.host.screen);
    s.host.openStage(CHARACTERS, STAGE);
    s.run();
    expect(s.guest.screen).toEqual({
      name: 'stage',
      seq: 2,
      characters: CHARACTERS,
      stageId: STAGE,
      teams: null,
      friendlyFire: false,
    });
    s.host.startMatch(CHARACTERS, STAGE);
    s.run();
    expect(s.guest.match?.seq).toBe(3);
    expect(s.guest.match?.seed).toBe(s.host.match?.seed);
    expect(s.guest.match?.delay).toBe(s.host.match?.delay);
    expect(s.guest.match?.clients).toEqual(s.host.roster);
    expect([s.host.match?.local, s.guest.match?.local]).toEqual([0, 1]);
  });

  it('o host só abre o mapa e a luta com um personagem para cada um da sala', () => {
    const s = setup({}, [], 2);
    s.connectAll();
    s.host.openSelect();
    s.run();
    s.host.openStage(CHARACTERS, STAGE);
    s.host.startMatch(CHARACTERS, STAGE);
    s.run();
    expect(s.host.screen?.name).toBe('select');
    s.host.startMatch([A, B, B], STAGE);
    s.run();
    expect(s.guests[1]?.match?.characters).toEqual([A, B, B]);
    expect(s.guests[1]?.match?.local).toBe(2);
  });

  it('os times escolhidos vão para todos, na tela de mapa e na luta', () => {
    const s = setup({}, [], 2);
    s.connectAll();
    const teams = { teams: [0, 1, 1], friendlyFire: true };
    s.host.openStage([A, B, A], STAGE, teams);
    s.run();
    const stage = s.guests[1]?.screen;
    expect(stage?.name === 'stage' && [stage.teams, stage.friendlyFire]).toEqual([[0, 1, 1], true]);
    s.host.startMatch([A, B, A], STAGE, teams);
    s.run();
    expect(s.guests[0]?.match?.teams).toEqual([0, 1, 1]);
    expect(s.guests[0]?.match?.friendlyFire).toBe(true);
    // times que não fecham com quem está na sala: todos contra todos
    s.host.startMatch([A, B, A], STAGE, { teams: [0, 0, 0], friendlyFire: true });
    s.run();
    expect(s.guests[0]?.match?.teams).toBeNull();
    expect(s.guests[0]?.match?.friendlyFire).toBe(false);
  });

  it('quem entra não muda a tela sozinho, mas pode pedir a seleção', () => {
    const s = setup();
    s.connect();
    s.run();
    s.host.startMatch(CHARACTERS, STAGE);
    s.run();
    s.guest.openStage(CHARACTERS, STAGE);
    s.guest.startMatch(CHARACTERS, STAGE);
    s.run();
    expect(s.host.screen?.name).toBe('fight');
    s.guest.openSelect();
    expect(s.guest.screen?.name).toBe('fight');
    s.run();
    expect(s.host.screen?.name).toBe('select');
    expect(s.guest.screen?.name).toBe('select');
  });

  it('a seleção de cada um chega do outro lado', () => {
    const s = setup();
    s.connect();
    s.run();
    s.host.openSelect();
    s.run();
    s.host.setSel(1, false);
    s.guest.setSel(0, true);
    s.run();
    expect(s.guest.selection(0)).toEqual({ cursor: 1, ready: false });
    expect(s.host.selection(1)).toEqual({ cursor: 0, ready: true });
    expect(s.guest.selection(1)).toEqual({ cursor: 0, ready: true });
    // tela nova: a seleção antiga não vale mais
    s.host.openStage(CHARACTERS, STAGE);
    s.host.openSelect();
    s.run();
    expect(s.host.selection(1)).toBeNull();
    expect(s.guest.selection(0)).toBeNull();
  });

  it('com 4, a seleção de cada um chega a todos, pelo host', () => {
    const s = setup({}, [], 3);
    s.connectAll();
    s.host.openSelect();
    s.run();
    s.host.setSel(0, true);
    s.guests.forEach((g, i) => {
      g.setSel(i + 1, i === 1);
    });
    s.run();
    const expected = [
      { cursor: 0, ready: true },
      { cursor: 1, ready: false },
      { cursor: 2, ready: true },
      { cursor: 3, ready: false },
    ];
    for (const session of [s.host, ...s.guests]) {
      expect([0, 1, 2, 3].map((seat) => session.selection(seat))).toEqual(expected);
    }
  });

  it('revanche só com o voto dos dois', () => {
    const s = setup();
    s.connect();
    s.run();
    s.host.startMatch(CHARACTERS, STAGE);
    s.run();
    const first = s.host.match?.seq;
    s.guest.voteRematch();
    s.run();
    expect(s.host.rematch).toEqual({ local: false, votes: 1, total: 2 });
    expect(s.guest.rematch).toEqual({ local: true, votes: 1, total: 2 });
    expect(s.host.match?.seq).toBe(first);
    s.host.voteRematch();
    s.run();
    expect(s.host.match?.seq).not.toBe(first);
    expect(s.guest.match?.seq).toBe(s.host.match?.seq);
    expect(s.guest.match?.seed).not.toBe(undefined);
    expect(s.guest.rematch).toEqual({ local: false, votes: 0, total: 2 });
  });

  it('com 3, a revanche espera o voto de todos, e todos veem a contagem', () => {
    const s = setup({}, [], 2);
    s.connectAll();
    s.host.startMatch([A, B, A], STAGE);
    s.run();
    const first = s.host.match?.seq;
    s.host.voteRematch();
    s.guests[0]?.voteRematch();
    s.run();
    expect(s.guests[1]?.rematch).toEqual({ local: false, votes: 2, total: 3 });
    expect(s.host.match?.seq).toBe(first);
    s.guests[1]?.voteRematch();
    s.run();
    expect(s.host.match?.seq).not.toBe(first);
    expect(s.guests[1]?.match?.seq).toBe(s.host.match?.seq);
    expect(s.guests[1]?.match?.characters).toEqual([A, B, A]);
  });
});

describe('OnlineSession: partida', () => {
  it('os dois lados rodam a mesma luta numa rede boa', () => {
    const s = setup();
    s.connect();
    s.run();
    s.host.startMatch(CHARACTERS, STAGE);
    const sides = play(s, 1500);
    expect(sides[0]?.hashes.length).toBeGreaterThan(1000);
    expectSameFight(sides);
    expect(s.host.match?.desync.first).toBeNull();
    expect(s.host.match?.desync.checked).toBeGreaterThan(20);
    expect(s.guest.match?.desync.checked).toBeGreaterThan(20);
  });

  it('com perda de 30%, demora e pacotes fora de ordem, a luta continua igual', () => {
    const s = setup({ loss: 0.3, minDelay: 1, maxDelay: 12 });
    s.connect();
    s.run(40);
    s.host.startMatch(CHARACTERS, STAGE);
    const sides = play(s, 3000);
    expect(expectSameFight(sides)).toBeGreaterThan(1000);
    expect(s.host.match?.desync.first).toBeNull();
    expect(s.guest.match?.desync.first).toBeNull();
  });

  it('com 4, perda e pacotes fora de ordem, todos rodam a mesma luta (o host repassa)', () => {
    const s = setup({ loss: 0.2, minDelay: 1, maxDelay: 8 }, [], 3);
    s.connectAll();
    s.run(40);
    s.host.startMatch([A, B, A, B], STAGE);
    const sides = play(s, 2500);
    expect(expectSameFight(sides)).toBeGreaterThan(800);
    // os inputs de cada um chegaram iguais a todos
    const n = Math.min(...sides.map((side) => side.inputs.length));
    for (const side of sides) expect(side.inputs.slice(0, n)).toEqual(sides[0]?.inputs.slice(0, n));
    expect(s.host.match?.desync.first).toBeNull();
    // o host compara com cada um dos 3
    expect(s.host.match?.desync.checked).toBeGreaterThan(3 * 20);
    for (const g of s.guests) expect(g.match?.desync.first).toBeNull();
  });

  it('o host repassa o input de quem entrou assim que chega, sem esperar o próprio quadro', () => {
    const s = setup({}, [], 2);
    s.connectAll();
    s.host.startMatch([A, B, A], STAGE);
    s.run();
    const [p2, p3] = s.guests;
    p2?.match?.lockstep.addLocal(0x10);
    p2?.sendInputs();
    s.run(4);
    // o host não rodou nenhum quadro, e o P3 já tem o input do P2
    const lockstep = p3?.match?.lockstep;
    expect(lockstep?.outgoing(0, [2]).have[1]).toBe((p3?.match?.delay ?? 0) + 1);
  });

  it('o atraso cobre o pior caminho: entre dois que entraram, passando pelo host', () => {
    const one = setup({ minDelay: 6, maxDelay: 6 });
    one.connect();
    one.run(400);
    one.host.startMatch(CHARACTERS, STAGE);
    const two = setup({ minDelay: 6, maxDelay: 6 }, [], 2);
    two.connectAll();
    two.run(400);
    two.host.startMatch([A, B, A], STAGE);
    // 30 ms de ida: 3 ticks com um só; 60 ms (ida até o host e dele ao outro) com dois
    expect(one.host.match?.delay).toBe(3);
    expect(two.host.match?.delay).toBe(5);
  });

  it('a conexão cai no meio, volta, e a luta segue de onde parou', () => {
    const s = setup({ loss: 0.1, maxDelay: 4 });
    let ends = s.connect();
    s.run();
    s.host.startMatch(CHARACTERS, STAGE);
    let stalledAt = 0;
    const sides = play(s, 1200, (frame) => {
      if (frame === 300) ends[0].drop();
      if (frame === 301) {
        expect(s.host.status).toBe('reconnecting');
        expect(s.guest.status).toBe('reconnecting');
      }
      if (frame === 500) {
        stalledAt = s.host.match?.lockstep.tick ?? 0;
        ends = s.connect();
      }
    });
    expect(s.host.status).toBe('connected');
    // parou enquanto estava sem conexão, e depois andou
    expect(stalledAt).toBeLessThan(320);
    expect(sides[0]?.hashes.length).toBeGreaterThan(stalledAt + 300);
    expectSameFight(sides);
    expect(s.host.match?.desync.first).toBeNull();
  });

  it('a partida que se perdeu na queda chega na reconexão', () => {
    const s = setup();
    const ends = s.connect();
    s.run();
    s.host.openSelect();
    s.run();
    s.guest.setSel(1, true);
    ends[0].drop();
    s.host.startMatch(CHARACTERS, STAGE);
    s.run();
    expect(s.guest.screen?.name).toBe('select');
    s.connect();
    s.run();
    expect(s.guest.match?.seq).toBe(s.host.match?.seq);
    const sides = play(s, 200);
    expect(expectSameFight(sides)).toBeGreaterThan(100);
  });

  it('pacote de inputs de outra partida não entra na nova', () => {
    const s = setup({ minDelay: 30, maxDelay: 30 });
    s.connect();
    s.run(100);
    s.host.startMatch(CHARACTERS, STAGE);
    s.run(100);
    const old = s.guest.match;
    old?.lockstep.addLocal(0x1ff);
    s.guest.sendInputs(); // ainda viajando quando a revanche começa
    s.host.voteRematch();
    s.guest.voteRematch();
    s.run(100);
    expect(s.host.match?.seq).not.toBe(old?.seq);
    expect(s.host.match?.lockstep.remoteLead).toBe(s.host.match?.delay);
  });

  it('quem sai no meio da luta fica parado, e a luta segue igual para os outros', () => {
    const s = setup({ loss: 0.1, maxDelay: 4 }, [], 2);
    s.connectAll();
    s.host.startMatch([A, B, A], STAGE, { teams: [0, 1, 1], friendlyFire: false });
    const [, p3] = s.guests;
    let leftAt = 0;
    const sides = play(s, 900, (frame) => {
      if (frame === 300) {
        p3?.leave();
        leftAt = s.host.match?.lockstep.tick ?? 0;
      }
      if (frame === 310) expect(s.guests[0]?.notice).toBe('P3 saiu da sala.');
    });
    expect(s.host.ended).toBeNull();
    expect(s.host.players).toBe(2);
    const [host, p2] = sides;
    if (!host || !p2) throw new Error('faltou um lado');
    expect(expectSameFight([host, p2])).toBeGreaterThan(leftAt + 400);
    // depois que saiu (e os inputs dele que já estavam no caminho), o P3 não aperta nada
    const after = host.inputs.slice(leftAt + 60).map((step) => step[2]);
    expect(after.length).toBeGreaterThan(300);
    expect(after.every((mask) => mask === NO_INPUT)).toBe(true);
    // a revanche é com quem ficou
    s.host.voteRematch();
    s.guests[0]?.voteRematch();
    s.run();
    expect(s.guests[0]?.match?.characters).toEqual([A, B]);
    // com 2, não tem time: todos contra todos
    expect(s.guests[0]?.match?.teams).toBeNull();
    expect(s.guests[0]?.match?.clients).toEqual(s.host.roster);
  });

  it('hash diferente no mesmo tick: registra a dessincronização', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const s = setup();
    s.connect();
    s.run();
    s.host.startMatch(CHARACTERS, STAGE);
    s.run();
    s.host.reportHash(30, 111);
    s.guest.reportHash(30, 222);
    s.run();
    expect(s.host.match?.desync.first).toEqual({ tick: 30, player: 1, local: 111, remote: 222 });
    expect(s.guest.match?.desync.first).toEqual({ tick: 30, player: 0, local: 222, remote: 111 });
    expect(error).toHaveBeenCalledTimes(2);
    expect(String(error.mock.calls[0]?.[0])).toContain('tick 30');
  });

  it('com 3, o host diz quem dessincronizou', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const s = setup({}, [], 2);
    s.connectAll();
    s.host.startMatch([A, B, A], STAGE);
    s.run();
    s.host.reportHash(60, 5);
    s.guests[0]?.reportHash(60, 5);
    s.guests[1]?.reportHash(60, 6);
    s.run();
    expect(s.host.match?.desync.first).toEqual({ tick: 60, player: 2, local: 5, remote: 6 });
    expect(s.guests[0]?.match?.desync.first).toBeNull();
    expect(s.guests[1]?.match?.desync.first?.player).toBe(0);
  });
});

describe('OnlineSession: queda de conexão', () => {
  it('conexão muda por muito tempo é dada por caída', () => {
    const s = setup();
    const ends = s.connect();
    s.run();
    // nada mais chega, mas ninguém avisou que caiu
    ends[0].onPacket = null;
    ends[0].onControl = null;
    s.wait(SILENCE_DROP_MS - 100);
    s.run(2);
    expect(s.host.status).toBe('connected');
    expect(s.host.silentMs).toBeGreaterThan(1000);
    s.wait(200);
    s.run(2);
    expect(s.host.status).toBe('reconnecting');
    expect(s.guest.status).toBe('reconnecting');
  });

  it('sem reconectar dentro do prazo, a sala acaba', () => {
    const s = setup();
    const ends = s.connect();
    s.run();
    ends[1].drop();
    s.run(2);
    expect(s.guest.status).toBe('reconnecting');
    expect(s.guest.reconnectLeftMs).toBeGreaterThan(RECONNECT_MS - 1000);
    s.wait(RECONNECT_MS);
    s.run(2);
    expect(s.host.ended).toBe('lost');
    expect(s.guest.ended).toBe('lost');
    expect(s.guestLink.closed).toBe(true);
  });

  it('com 3, quem cai e não volta sai da sala, e a luta segue sem ele', () => {
    const s = setup({}, [], 2);
    const ends = s.connectAll();
    s.host.startMatch([A, B, A], STAGE);
    // 3 passos de rede por quadro: o prazo de reconexão passa em ~2000 quadros, com a luta parada
    const frames = Math.ceil(RECONNECT_MS / (3 * STEP_MS)) + 400;
    const sides = play(s, frames, (frame) => {
      if (frame === 100) ends[1]?.[0].drop();
      if (frame === 150) expect(s.host.status).toBe('reconnecting');
    });
    expect(s.guests[1]?.ended).toBe('lost');
    expect(s.host.ended).toBeNull();
    expect(s.host.status).toBe('connected');
    expect(s.host.players).toBe(2);
    expect(s.guests[0]?.players).toBe(2);
    const [host, p2] = sides;
    if (!host || !p2) throw new Error('faltou um lado');
    expect(expectSameFight([host, p2])).toBeGreaterThan(300);
  });

  it('na reconexão, cada um manda de novo a seleção e o voto de revanche', () => {
    const s = setup();
    let ends = s.connect();
    s.run();
    s.host.openSelect();
    s.run();
    ends[0].drop();
    s.host.setSel(1, true);
    s.guest.setSel(0, true);
    ends = s.connect();
    s.run();
    expect(s.guest.selection(0)).toEqual({ cursor: 1, ready: true });
    expect(s.host.selection(1)).toEqual({ cursor: 0, ready: true });

    s.host.startMatch(CHARACTERS, STAGE);
    s.run();
    const first = s.host.match?.seq;
    ends[0].drop();
    s.guest.voteRematch();
    s.host.voteRematch();
    s.connect();
    s.run();
    expect(s.host.match?.seq).not.toBe(first);
    expect(s.guest.match?.seq).toBe(s.host.match?.seq);
  });

  it('conexão que chega depois do fim da sala é fechada', () => {
    const s = setup();
    s.host.leave();
    const [a, b] = s.net.pair();
    s.host.attach(a);
    s.run();
    expect(a.open).toBe(false);
    expect(b.open).toBe(false);
  });
});
