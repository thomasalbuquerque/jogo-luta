import { INPUT_BITS, NO_INPUT, type InputMask } from '@jogo-luta/sim';

/** Inputs por pacote, no máximo (o que não couber vai no próximo). */
export const MAX_PACKET_INPUTS = 64;
/** O outro lado nunca está tão à frente: input além disso é ignorado. */
const MAX_REMOTE_LEAD = 600;

/** O que vai em cada pacote de inputs. */
export interface InputBatch {
  /** Quantos inputs do outro lado já chegaram aqui (o próximo tick dele que falta). */
  ack: number;
  /** Tick do 1º input de `masks`. */
  start: number;
  masks: InputMask[];
}

/**
 * Netcode por atraso (lockstep) para 2 jogadores, sem rede: só as filas.
 *
 * O que o jogador aperta no tick T só vale no tick T + atraso; nesse meio-tempo
 * o input viaja até o outro lado. O `sim` só avança um tick quando tem o input
 * dos dois para ele (`ready`), então os dois lados rodam exatamente a mesma luta.
 *
 * O canal perde pacotes: cada pacote leva todos os inputs que o outro lado ainda
 * não confirmou (`ack`), então um pacote perdido é coberto pelo seguinte.
 */
export class Lockstep {
  /** Próximo tick que o `sim` vai rodar. */
  tick = 0;
  /** `tapes[jogador][tick]`: os inputs de cada um, sem buracos. */
  private readonly tapes: InputMask[][];
  /** Quantos inputs meus o outro lado já confirmou. */
  private acked: number;

  constructor(
    /** Jogador deste lado (0 ou 1). */
    readonly local: number,
    /** Atraso de input, em ticks (igual nos dois lados). */
    readonly delay: number,
  ) {
    // os primeiros `delay` ticks não têm input de ninguém: os dois lados já sabem
    this.tapes = [0, 1].map(() => Array.from({ length: delay }, () => NO_INPUT));
    this.acked = delay;
  }

  get remote(): number {
    return 1 - this.local;
  }

  private tape(player: number): InputMask[] {
    const tape = this.tapes[player];
    if (!tape) throw new Error(`Lockstep: jogador ${String(player)} não existe`);
    return tape;
  }

  /** Falta ler o input local deste tick (ele vale no tick atual + atraso). */
  needsLocal(): boolean {
    return this.tape(this.local).length <= this.tick + this.delay;
  }

  /** Guarda o que o jogador local apertou agora, para o tick atual + atraso. */
  addLocal(mask: InputMask): void {
    if (this.needsLocal()) this.tape(this.local).push(mask & INPUT_BITS);
  }

  /** Já tem o input dos dois para o tick atual. */
  ready(): boolean {
    return this.tapes.every((tape) => tape.length > this.tick);
  }

  /** Inputs do tick atual (um por jogador) e passa para o próximo. Só com `ready()`. */
  step(): InputMask[] {
    if (!this.ready()) throw new Error('Lockstep: falta input para o tick');
    const inputs = this.tapes.map((tape) => tape[this.tick] ?? NO_INPUT);
    this.tick++;
    return inputs;
  }

  /** O que mandar agora: os inputs locais que o outro lado ainda não confirmou. */
  outgoing(): InputBatch {
    return {
      ack: this.tape(this.remote).length,
      start: this.acked,
      masks: this.tape(this.local).slice(this.acked, this.acked + MAX_PACKET_INPUTS),
    };
  }

  /** Recebe um pacote do outro lado. Repetido, atrasado ou com buraco: aproveita o que der. */
  receive(batch: InputBatch): void {
    if (batch.ack > this.acked && batch.ack <= this.tape(this.local).length) {
      this.acked = batch.ack;
    }
    const tape = this.tape(this.remote);
    // buraco antes deste pacote: espera o próximo, que traz desde o confirmado
    if (batch.start > tape.length) return;
    for (let i = tape.length - batch.start; i < batch.masks.length; i++) {
      if (tape.length >= this.tick + MAX_REMOTE_LEAD) return;
      tape.push((batch.masks[i] ?? NO_INPUT) & INPUT_BITS);
    }
  }

  /** Folga: quantos ticks ainda dá para rodar com os inputs do outro que já chegaram. */
  get remoteLead(): number {
    return this.tape(this.remote).length - this.tick;
  }

  /** Inputs locais ainda sem confirmação do outro lado. */
  get unacked(): number {
    return this.tape(this.local).length - this.acked;
  }
}
