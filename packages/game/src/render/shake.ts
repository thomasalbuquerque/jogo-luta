/**
 * Tremor de tela por "trauma" (0..1): cada impacto soma trauma, que cai sozinho
 * com o tempo. O deslocamento cresce com o quadrado do trauma, então golpe
 * fraco quase não treme e golpe forte sacode. Só render: usa o tempo real.
 */
export interface ShakeOptions {
  /** Deslocamento máximo, em px de tela, com trauma 1. */
  maxOffset: number;
  /** Quanto trauma some por segundo. */
  decayPerSecond: number;
}

export const DEFAULT_SHAKE: ShakeOptions = { maxOffset: 22, decayPerSecond: 1.6 };

/** Trauma de um golpe: cresce com a força do arremesso (px/tick). */
export function hitTrauma(knockbackPx: number): number {
  return Math.min(0.2 + knockbackPx * 0.018, 0.85);
}

export class Shake {
  trauma = 0;
  private time = 0;

  constructor(private readonly opts: ShakeOptions = DEFAULT_SHAKE) {}

  add(amount: number): void {
    this.trauma = Math.min(1, this.trauma + Math.max(0, amount));
  }

  /** Avança `dtMs` e devolve o deslocamento da câmera, em px de tela. */
  update(dtMs: number): { x: number; y: number } {
    this.time += dtMs / 1000;
    const power = this.trauma * this.trauma * this.opts.maxOffset;
    this.trauma = Math.max(0, this.trauma - (this.opts.decayPerSecond * dtMs) / 1000);
    if (power === 0) return { x: 0, y: 0 };
    return { x: power * wobble(this.time, 0), y: power * wobble(this.time, 1.7) };
  }

  reset(): void {
    this.trauma = 0;
  }
}

/** Ruído suave em -1..1 (soma de senos com frequências que não se repetem juntas). */
function wobble(t: number, phase: number): number {
  return 0.6 * Math.sin(t * 61 + phase) + 0.4 * Math.sin(t * 97 + phase * 2.3);
}
