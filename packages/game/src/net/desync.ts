/** Hashes de estado guardados à espera dos outros lados, no máximo (os mais velhos saem). */
const MAX_PENDING = 256;

/** Onde um lado deixou de ter a mesma luta que este. */
export interface Desync {
  tick: number;
  /** Jogador do outro lado (o que mandou `remote`). */
  player: number;
  local: number;
  remote: number;
}

/** Guarda um hash por tick, sem crescer para sempre (os mais velhos saem). */
function remember(map: Map<number, number>, tick: number, hash: number): void {
  map.set(tick, hash);
  if (map.size > MAX_PENDING) {
    const oldest = map.keys().next();
    if (!oldest.done) map.delete(oldest.value);
  }
}

/**
 * Checagem de dessincronização: os lados trocam o hash do estado de tempos em
 * tempos; se num mesmo tick os hashes diferem, a luta deixou de ser a mesma.
 * Os hashes chegam fora de hora (cada lado roda no seu ritmo), então ficam
 * guardados até o par aparecer. Compara com vários outros lados (o host, com
 * cada um que entrou): o hash local fica guardado até todos mandarem o deles.
 */
export class DesyncDetector {
  /** A 1ª divergência (as seguintes são consequência dela). */
  first: Desync | null = null;
  /** Comparações feitas (um par de hashes do mesmo tick). */
  checked = 0;
  private readonly local = new Map<number, number>();
  /** `remote.get(jogador)`: hashes dele ainda sem o local do mesmo tick. */
  private readonly remote = new Map<number, Map<number, number>>();

  /** Hash deste lado depois do tick `tick`. Devolve a divergência, se achou uma agora. */
  addLocal(tick: number, hash: number): Desync | null {
    remember(this.local, tick, hash);
    let found: Desync | null = null;
    for (const [player, pending] of this.remote) {
      const other = pending.get(tick);
      if (other === undefined) continue;
      pending.delete(tick);
      found = this.compare(tick, player, hash, other) ?? found;
    }
    return found;
  }

  /** Hash que o jogador `player` mandou. Devolve a divergência, se achou uma agora. */
  addRemote(player: number, tick: number, hash: number): Desync | null {
    const mine = this.local.get(tick);
    if (mine !== undefined) return this.compare(tick, player, mine, hash);
    let pending = this.remote.get(player);
    if (!pending) {
      pending = new Map();
      this.remote.set(player, pending);
    }
    remember(pending, tick, hash);
    return null;
  }

  private compare(tick: number, player: number, local: number, remote: number): Desync | null {
    this.checked++;
    if (local === remote || this.first) return null;
    this.first = { tick, player, local, remote };
    return this.first;
  }
}
