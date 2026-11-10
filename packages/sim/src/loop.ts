import { TICK_MS } from './constants';

/**
 * Loop de passo fixo com acumulador.
 *
 * Quem chama (o render) informa quanto tempo real passou; o loop decide quantos
 * ticks rodar. A lógica do jogo só vê ticks, nunca o tempo real. O `alpha`
 * devolvido (0..1) é quanto falta do próximo tick, para o render interpolar.
 */
export class FixedStepLoop {
  private accumulator = 0;

  /**
   * @param maxTicksPerAdvance evita a "espiral da morte": se a aba travar,
   *   descarta o atraso em vez de tentar simular segundos de uma vez.
   */
  constructor(
    private readonly tickMs: number = TICK_MS,
    private readonly maxTicksPerAdvance = 5,
  ) {}

  /** Avança o tempo e roda `step` quantas vezes couber. Retorna o alpha de interpolação. */
  advance(elapsedMs: number, step: () => void): number {
    this.accumulator += Math.max(0, elapsedMs);
    let ticks = 0;
    while (this.accumulator >= this.tickMs) {
      if (ticks >= this.maxTicksPerAdvance) {
        this.accumulator = 0;
        break;
      }
      step();
      this.accumulator -= this.tickMs;
      ticks++;
    }
    return this.accumulator / this.tickMs;
  }

  reset(): void {
    this.accumulator = 0;
  }
}
