/** Hashes de estado guardados à espera do outro lado, no máximo (os mais velhos saem). */
const MAX_PENDING = 256;

/** Onde os dois lados deixaram de ter a mesma luta. */
export interface Desync {
  tick: number;
  local: number;
  remote: number;
}

/**
 * Checagem de dessincronização: os dois lados trocam o hash do estado de tempos
 * em tempos; se num mesmo tick os hashes diferem, a luta deixou de ser a mesma.
 * Os hashes chegam fora de hora (cada lado roda no seu ritmo), então ficam
 * guardados até o par aparecer.
 */
export class DesyncDetector {
  /** A 1ª divergência (as seguintes são consequência dela). */
  first: Desync | null = null;
  /** Ticks em que os dois hashes foram comparados. */
  checked = 0;
  private readonly local = new Map<number, number>();
  private readonly remote = new Map<number, number>();

  /** Hash deste lado depois do tick `tick`. Devolve a divergência, se achou uma agora. */
  addLocal(tick: number, hash: number): Desync | null {
    return this.add(this.local, this.remote, tick, hash);
  }

  /** Hash que o outro lado mandou. Devolve a divergência, se achou uma agora. */
  addRemote(tick: number, hash: number): Desync | null {
    return this.add(this.remote, this.local, tick, hash);
  }

  private add(
    mine: Map<number, number>,
    theirs: Map<number, number>,
    tick: number,
    hash: number,
  ): Desync | null {
    const other = theirs.get(tick);
    if (other === undefined) {
      mine.set(tick, hash);
      if (mine.size > MAX_PENDING) {
        const oldest = mine.keys().next();
        if (!oldest.done) mine.delete(oldest.value);
      }
      return null;
    }
    theirs.delete(tick);
    this.checked++;
    if (other === hash || this.first) return null;
    this.first =
      mine === this.local
        ? { tick, local: hash, remote: other }
        : { tick, local: other, remote: hash };
    return this.first;
  }
}
