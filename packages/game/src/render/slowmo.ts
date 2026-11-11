/**
 * Câmera lenta curta (só render): devolve quanto do tempo real vira tempo de
 * jogo. O sim continua em ticks fixos; só chegam menos ticks por segundo.
 */
export class SlowMo {
  private remaining = 0;
  private total = 0;
  private scale = 1;

  /** Liga por `durationMs` de tempo real, com o tempo a `scale` (0..1). */
  trigger(durationMs: number, scale: number): void {
    this.total = durationMs;
    this.remaining = durationMs;
    this.scale = scale;
  }

  get active(): boolean {
    return this.remaining > 0;
  }

  /**
   * Avança `dtMs` de tempo real e devolve a escala do tempo: `scale` no começo,
   * voltando suave para 1 no último terço.
   */
  update(dtMs: number): number {
    if (this.remaining <= 0) return 1;
    this.remaining = Math.max(0, this.remaining - dtMs);
    const left = this.remaining / this.total;
    if (left >= 1 / 3) return this.scale;
    return 1 - (1 - this.scale) * left * 3;
  }

  reset(): void {
    this.remaining = 0;
  }
}
