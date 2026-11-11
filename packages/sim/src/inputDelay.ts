import { NO_INPUT, type InputMask } from './input';

/** Maior atraso aceito, em ticks (15 ticks = 250 ms: já é injogável). */
export const MAX_INPUT_DELAY = 15;

/**
 * Atrasa os inputs de cada jogador em N ticks: o que foi apertado agora só
 * chega ao `sim` N ticks depois. É o que o netcode por atraso (Etapa 8) faz
 * para dar tempo de o input do outro lado chegar; aqui serve para sentir esse
 * atraso sem rede.
 *
 * Fica fora do estado da luta: o `sim` (e o replay) só veem os inputs já atrasados.
 */
export class InputDelay {
  private readonly delays: number[] = [];
  /** Últimos inputs de cada jogador, do mais antigo ao mais novo. */
  private readonly history: InputMask[][] = [];

  constructor(delays: readonly number[] = []) {
    for (const [player, ticks] of delays.entries()) this.setDelay(player, ticks);
  }

  /** Atraso de um jogador, em ticks (0 = sem atraso). */
  getDelay(player: number): number {
    return this.delays[player] ?? 0;
  }

  setDelay(player: number, ticks: number): void {
    const whole = Number.isFinite(ticks) ? Math.trunc(ticks) : 0;
    this.delays[player] = Math.max(0, Math.min(MAX_INPUT_DELAY, whole));
  }

  /** Algum jogador está com atraso. */
  get active(): boolean {
    return this.delays.some((d) => d > 0);
  }

  /**
   * Recebe os inputs lidos neste tick e devolve os que o `sim` deve usar: os de
   * N ticks atrás (nada apertado enquanto não passaram N ticks).
   */
  push(inputs: readonly InputMask[]): InputMask[] {
    return inputs.map((mask, player) => {
      const tape = (this.history[player] ??= []);
      tape.push(mask);
      if (tape.length > MAX_INPUT_DELAY + 1) tape.shift();
      return tape[tape.length - 1 - this.getDelay(player)] ?? NO_INPUT;
    });
  }

  /** Esquece o que estava na fila (luta nova, volta da pausa). */
  reset(): void {
    this.history.length = 0;
  }
}
