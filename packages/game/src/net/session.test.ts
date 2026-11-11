import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createGame,
  nextRng,
  getStage,
  hashState,
  MATCH_RULES,
  PLAYABLE_CHARACTERS,
  STAGES,
  stepGame,
  type GameState,
} from '@jogo-luta/sim';
import { LoopbackNetwork, type LoopbackOptions } from './loopback';
import { OnlineSession, RECONNECT_MS, SILENCE_DROP_MS } from './session';
import type { Link } from './transport';

const CHARACTERS = [PLAYABLE_CHARACTERS[0] ?? '', PLAYABLE_CHARACTERS[1] ?? ''];
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

/** Duas sessões (host e quem entra) numa rede de mentira, com relógio próprio. */
function setup(options: LoopbackOptions = {}, builds: [string, string] = ['b1', 'b1']) {
  const rng = { rng: 1234 };
  const random = (): number => nextRng(rng) / 0x100000000;
  const net = new LoopbackNetwork({ random, ...options });
  let now = 1000;
  let seed = 1;
  const make = (role: 'host' | 'guest', build: string) => {
    const link = fakeLink();
    const session = new OnlineSession({
      role,
      code: 'ABCD',
      link,
      build,
      clock: () => now,
      newSeed: () => seed++ * 7919,
    });
    return { link, session };
  };
  const h = make('host', builds[0]);
  const g = make('guest', builds[1]);
  /** Anda a rede e o relógio `n` passos. */
  const run = (n = 10): void => {
    for (let i = 0; i < n; i++) {
      now += STEP_MS;
      net.step();
      h.session.update();
      g.session.update();
    }
  };
  /** Abre uma conexão nova entre os dois (a 1ª ou uma reconexão). */
  const connect = () => {
    const [a, b] = net.pair();
    h.session.attach(a);
    g.session.attach(b);
    return [a, b] as const;
  };
  const wait = (ms: number): void => {
    now += ms;
  };
  return {
    net,
    host: h.session,
    guest: g.session,
    hostLink: h.link,
    guestLink: g.link,
    run,
    connect,
    wait,
  };
}

/** Um lado da luta: o sim e o que ele apertaria em cada tick. */
function player(session: OnlineSession, seed: number) {
  const rng = { rng: seed };
  let state: GameState | null = null;
  let id = -1;
  const hashes: number[] = [];
  return {
    hashes,
    get state(): GameState | null {
      return state;
    },
    /** Um quadro do jogo: lê o input, manda, e roda o tick se tiver o input dos dois. */
    frame(): void {
      const match = session.match;
      if (!match) return;
      if (match.seq !== id || !state) {
        id = match.seq;
        hashes.length = 0;
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
      stepGame(state, match.lockstep.step());
      const hash = hashState(state);
      hashes.push(hash);
      if (state.tick % 30 === 0) session.reportHash(state.tick, hash);
    },
  };
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
  });

  it('um terceiro não entra na sala cheia', () => {
    const s = setup();
    s.connect();
    s.run();
    const link = fakeLink();
    const third = new OnlineSession({
      role: 'guest',
      code: 'ABCD',
      link,
      build: 'b1',
      clock: () => 0,
      newSeed: () => 999,
    });
    const [a, b] = s.net.pair();
    s.host.attach(a);
    third.attach(b);
    s.run();
    expect(third.ended).toBe('full');
    expect(s.host.status).toBe('connected');
    // a conexão de quem já estava continua valendo
    s.host.openSelect();
    s.run();
    expect(s.guest.screen?.name).toBe('select');
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
    });
    s.host.startMatch(CHARACTERS, STAGE);
    s.run();
    expect(s.guest.match?.seq).toBe(3);
    expect(s.guest.match?.seed).toBe(s.host.match?.seed);
    expect(s.guest.match?.delay).toBe(s.host.match?.delay);
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
    expect(s.guest.remoteSel).toEqual({ cursor: 1, ready: false });
    expect(s.host.remoteSel).toEqual({ cursor: 0, ready: true });
    // tela nova: a seleção antiga não vale mais
    s.host.openStage(CHARACTERS, STAGE);
    s.host.openSelect();
    s.run();
    expect(s.host.remoteSel).toBeNull();
    expect(s.guest.remoteSel).toBeNull();
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
    expect(s.host.rematch).toEqual({ local: false, remote: true });
    expect(s.host.match?.seq).toBe(first);
    s.host.voteRematch();
    s.run();
    expect(s.host.match?.seq).not.toBe(first);
    expect(s.guest.match?.seq).toBe(s.host.match?.seq);
    expect(s.guest.match?.seed).not.toBe(undefined);
    expect(s.guest.rematch).toEqual({ local: false, remote: false });
  });
});

describe('OnlineSession: partida', () => {
  /** Joga até a luta acabar (ou `frames` quadros) e devolve os dois lados. */
  function play(s: ReturnType<typeof setup>, frames: number, each?: (frame: number) => void) {
    const a = player(s.host, 11);
    const b = player(s.guest, 22);
    for (let f = 0; f < frames; f++) {
      each?.(f);
      a.frame();
      b.frame();
      s.run(3);
    }
    return { a, b };
  }

  it('os dois lados rodam a mesma luta numa rede boa', () => {
    const s = setup();
    s.connect();
    s.run();
    s.host.startMatch(CHARACTERS, STAGE);
    const { a, b } = play(s, 1500);
    expect(a.hashes.length).toBeGreaterThan(1000);
    const n = Math.min(a.hashes.length, b.hashes.length);
    expect(a.hashes.slice(0, n)).toEqual(b.hashes.slice(0, n));
    expect(s.host.match?.desync.first).toBeNull();
    expect(s.host.match?.desync.checked).toBeGreaterThan(20);
    expect(s.guest.match?.desync.checked).toBeGreaterThan(20);
  });

  it('com perda de 30%, demora e pacotes fora de ordem, a luta continua igual', () => {
    const s = setup({ loss: 0.3, minDelay: 1, maxDelay: 12 });
    s.connect();
    s.run(40);
    s.host.startMatch(CHARACTERS, STAGE);
    const { a, b } = play(s, 3000);
    const n = Math.min(a.hashes.length, b.hashes.length);
    expect(n).toBeGreaterThan(1000);
    expect(a.hashes.slice(0, n)).toEqual(b.hashes.slice(0, n));
    expect(s.host.match?.desync.first).toBeNull();
    expect(s.guest.match?.desync.first).toBeNull();
  });

  it('a conexão cai no meio, volta, e a luta segue de onde parou', () => {
    const s = setup({ loss: 0.1, maxDelay: 4 });
    let ends = s.connect();
    s.run();
    s.host.startMatch(CHARACTERS, STAGE);
    let stalledAt = 0;
    const { a, b } = play(s, 1200, (frame) => {
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
    expect(a.hashes.length).toBeGreaterThan(stalledAt + 300);
    const n = Math.min(a.hashes.length, b.hashes.length);
    expect(a.hashes.slice(0, n)).toEqual(b.hashes.slice(0, n));
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
    const { a, b } = play(s, 200);
    expect(a.hashes.length).toBeGreaterThan(100);
    expect(a.hashes.slice(0, 100)).toEqual(b.hashes.slice(0, 100));
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
    expect(s.guest.remoteSel).toEqual({ cursor: 1, ready: true });
    expect(s.host.remoteSel).toEqual({ cursor: 0, ready: true });

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
