import { pingLabel } from './ping';
import type { OnlineSession } from './session';
import type { EndReason } from './transport';

/** Telas que participam do online (as chaves das cenas). */
export type OnlineSceneKey = 'online' | 'select' | 'stage' | 'fight';

export interface OnlineRoute {
  scene: OnlineSceneKey;
  data: { ended?: EndReason; characters?: string[]; stageId?: string };
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
    data: { characters: screen.characters, stageId: screen.stageId },
  };
}

/** "Sala ABCD · ping 23 ms" (com "reconectando" ou "relay" quando for o caso). */
export function netLabel(net: OnlineSession): string {
  const parts = [`Sala ${net.code}`];
  if (net.status === 'reconnecting') parts.push('reconectando…');
  else parts.push(pingLabel(net.ping.rtt));
  if (net.route === 'relay') parts.push('relay');
  return parts.join(' · ');
}
