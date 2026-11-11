import { newSeed } from '../match/replayFile';
import { netConfig } from './config';
import { PeerLink } from './peerLink';
import { randomRoomCode } from './roomCode';
import { OnlineSession } from './session';

declare const __BUILD_ID__: string | undefined;

/** Build do jogo (o commit, no deploy): os dois lados precisam do mesmo. */
export const BUILD_ID = typeof __BUILD_ID__ === 'string' ? __BUILD_ID__ : 'dev';

/** De quanto em quanto tempo a sessão cuida de ping e prazos (fora do loop do jogo). */
const UPDATE_MS = 100;

let current: OnlineSession | null = null;
let timer: number | undefined;

/**
 * A sala online aberta, se houver (pode já ter acabado: ver `ended`). As cenas
 * leem isto ao abrir: com sala, a tela é online; sem sala, é o jogo local.
 */
export function getOnline(): OnlineSession | null {
  return current;
}

function open(role: 'host' | 'guest', code: string): OnlineSession {
  closeOnline();
  const session = new OnlineSession({
    role,
    code,
    link: new PeerLink(role, code, netConfig(import.meta.env)),
    build: BUILD_ID,
    clock: () => performance.now(),
    newSeed,
  });
  current = session;
  // por timer, e não pelo quadro do jogo: continua com a aba em segundo plano
  timer = window.setInterval(() => {
    session.update();
  }, UPDATE_MS);
  return session;
}

/** Cria uma sala com um código novo. */
export function hostRoom(): OnlineSession {
  return open('host', randomRoomCode());
}

/** Entra na sala do código. */
export function joinRoom(code: string): OnlineSession {
  return open('guest', code);
}

/** Sai da sala (avisando o outro lado) e volta ao jogo local. */
export function closeOnline(): void {
  current?.leave();
  current = null;
  if (timer !== undefined) window.clearInterval(timer);
  timer = undefined;
}
