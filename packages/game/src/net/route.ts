import { pingLabel } from './ping';
import { MAX_ROOM_PLAYERS } from './protocol';
import type { OnlineSession, RematchVotes } from './session';
import type { EndReason } from './transport';

/** Telas que participam do online (as chaves das cenas). */
export type OnlineSceneKey = 'online' | 'select' | 'stage' | 'fight';

export interface OnlineRoute {
  scene: OnlineSceneKey;
  data: {
    ended?: EndReason;
    characters?: string[];
    stageId?: string;
    teams?: number[] | null;
    friendlyFire?: boolean;
  };
}

/**
 * Para onde a cena `here` deve ir, se a sala mudou de tela ou acabou (null =
 * fica onde está). A tela da sala é do host; os dois lados seguem por aqui.
 */
export function onlineRoute(net: OnlineSession, here: OnlineSceneKey): OnlineRoute | null {
  if (net.ended) {
    return here === 'online' ? null : { scene: 'online', data: { ended: net.ended } };
  }
  const screen = net.screen;
  if (!screen || screen.name === here) return null;
  if (screen.name === 'select') return { scene: 'select', data: {} };
  return {
    scene: screen.name,
    data: {
      characters: screen.characters,
      stageId: screen.stageId,
      teams: screen.teams,
      friendlyFire: screen.friendlyFire,
    },
  };
}

/**
 * Aviso de luta parada esperando input: "Esperando o outro jogador…" no 1x1;
 * com mais gente, quem está faltando ("Esperando o P3…", "Esperando o P2 e o P4…").
 */
export function waitingLabel(players: number, waiting: readonly number[]): string {
  if (players <= 2 || waiting.length === 0) return 'Esperando o outro jogador…';
  const names = waiting.map((p) => `o P${String(p + 1)}`);
  const last = names.pop() ?? '';
  return `Esperando ${names.length > 0 ? `${names.join(', ')} e ${last}` : last}…`;
}

/** Votos de revanche no resultado ('' = ninguém votou ainda). */
export function rematchLabel(r: RematchVotes): string {
  if (r.total <= 2) {
    if (r.local) return 'Esperando o outro jogador aceitar a revanche…';
    return r.votes > 0 ? 'O outro jogador quer revanche!' : '';
  }
  const count = `${String(r.votes)} de ${String(r.total)} votos`;
  if (r.local) return `Esperando os outros aceitarem a revanche… (${count})`;
  return r.votes > 0 ? `Pediram revanche: ${count}.` : '';
}

/** "Sala ABCD · 3 de 4 · ping 23 ms" (com "reconectando" ou "relay" quando for o caso). */
export function netLabel(net: OnlineSession): string {
  const parts = [`Sala ${net.code}`, `${String(net.players)} de ${String(MAX_ROOM_PLAYERS)}`];
  if (net.status === 'reconnecting') parts.push('reconectando…');
  else parts.push(pingLabel(net.ping.rtt));
  if (net.route === 'relay') parts.push('relay');
  return parts.join(' · ');
}
