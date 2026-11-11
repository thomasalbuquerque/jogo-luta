import type { GameEvent } from '@jogo-luta/sim';

/** Números de um jogador na luta (tela de resultado). */
export interface PlayerStats {
  /** Quedas do adversário em que este foi o último a bater. */
  kos: number;
  /** Vidas perdidas (inclui cair sozinho). */
  falls: number;
  /** Dano causado, em %. */
  damageDealt: number;
  /** Golpes que acertaram. */
  hits: number;
  /** Maior dano de um golpe só, em %. */
  bestHit: number;
}

export interface MatchStats {
  players: PlayerStats[];
  /** Último a bater em cada um desde que reapareceu (-1 = ninguém). */
  lastHitBy: number[];
}

export function createStats(players: number): MatchStats {
  return {
    players: Array.from({ length: players }, () => ({
      kos: 0,
      falls: 0,
      damageDealt: 0,
      hits: 0,
      bestHit: 0,
    })),
    lastHitBy: Array.from({ length: players }, () => -1),
  };
}

/** Soma os eventos de um tick nas estatísticas. */
export function recordEvents(stats: MatchStats, events: readonly GameEvent[]): void {
  for (const e of events) {
    switch (e.type) {
      case 'hit': {
        const attacker = stats.players[e.attacker];
        if (attacker && e.attacker !== e.victim) {
          attacker.damageDealt += e.damage;
          attacker.hits++;
          attacker.bestHit = Math.max(attacker.bestHit, e.damage);
        }
        stats.lastHitBy[e.victim] = e.attacker;
        break;
      }
      case 'ko': {
        const victim = stats.players[e.fighter];
        if (victim) victim.falls++;
        const by = stats.lastHitBy[e.fighter] ?? -1;
        const killer = by !== e.fighter ? stats.players[by] : undefined;
        if (killer) killer.kos++;
        stats.lastHitBy[e.fighter] = -1;
        break;
      }
      default:
        break;
    }
  }
}
