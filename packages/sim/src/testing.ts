import type { InputMask } from './input';
import { nextRng, seedRng, type RngHolder } from './rng';

/**
 * Só para testes: inputs aleatórios (com seed) que parecem alguém jogando. Cada
 * jogador segura uma combinação de botões por alguns ticks e troca.
 */
export class RandomInputs {
  private readonly rng: RngHolder;
  private readonly masks: InputMask[];
  private readonly ticksLeft: number[];

  constructor(seed: number, players = 2) {
    this.rng = { rng: seedRng(seed) };
    this.masks = Array.from({ length: players }, () => 0);
    this.ticksLeft = Array.from({ length: players }, () => 0);
  }

  /** Inputs de todos os jogadores para o próximo tick. */
  next(): InputMask[] {
    for (let i = 0; i < this.masks.length; i++) {
      const left = this.ticksLeft[i] ?? 0;
      if (left > 0) {
        this.ticksLeft[i] = left - 1;
        continue;
      }
      // 2 sorteios juntos: menos botões apertados ao mesmo tempo
      this.masks[i] = nextRng(this.rng) & nextRng(this.rng) & 0x1ff;
      this.ticksLeft[i] = nextRng(this.rng) % 12;
    }
    return [...this.masks];
  }
}
