import { INPUT_BITS, NO_INPUT, type InputMask } from '@jogo-luta/sim';

/** Inputs de cada jogador por pacote, no máximo (o que não couber vai no próximo). */
export const MAX_PACKET_INPUTS = 64;
/** Ninguém está tão à frente: input além disso é ignorado. */
const MAX_REMOTE_LEAD = 600;

/** Inputs seguidos de um jogador, num pacote. */
export interface InputRun {
  player: number;
  /** Tick do 1º input de `masks`. */
  start: number;
  masks: InputMask[];
}

/** O que vai em cada pacote de inputs. */
export interface InputBatch {
  /**
   * Quantos inputs de cada jogador quem mandou já tem (o próximo tick que falta
   * de cada um): confirma o que chegou.
   */
  have: number[];
  runs: InputRun[];
}

/**
 * Netcode por atraso (lockstep) para 2 a 4 jogadores, sem rede: só as filas.
 *
 * O que o jogador aperta no tick T só vale no tick T + atraso; nesse meio-tempo
 * o input viaja até os outros lados. O `sim` só avança um tick quando tem o
 * input de todos para ele (`ready`), então todos rodam exatamente a mesma luta.
 *
 * A sala é uma estrela: cada um que entrou só fala com o host, e o host repassa
 * os inputs de cada um para os outros. Aqui isso é só quem manda o quê para quem
 * (`outgoing` e `receive` recebem a lista de jogadores daquele par).
 *
 * O canal perde pacotes: cada pacote leva todos os inputs que o par ainda não
 * confirmou (`have`), então um pacote perdido é coberto pelo seguinte.
 */
export class Lockstep {
  /** Próximo tick que o `sim` vai rodar. */
  tick = 0;
  /** `tapes[jogador][tick]`: os inputs de cada um, sem buracos. */
  private readonly tapes: InputMask[][];
  /** `acked.get(par)[jogador]`: quantos inputs daquele jogador o par já confirmou. */
  private readonly acked = new Map<number, number[]>();

  constructor(
    /** Jogadores da partida. */
    readonly players: number,
    /** Jogador deste lado. */
    readonly local: number,
    /** Atraso de input, em ticks (igual em todos os lados). */
    readonly delay: number,
  ) {
    // os primeiros `delay` ticks não têm input de ninguém: todos já sabem
    this.tapes = Array.from({ length: players }, () =>
      Array.from({ length: delay }, () => NO_INPUT),
    );
  }

  private tape(player: number): InputMask[] {
    const tape = this.tapes[player];
    if (!tape) throw new Error(`Lockstep: jogador ${String(player)} não existe`);
    return tape;
  }

  private ackedBy(peer: number): number[] {
    let acked = this.acked.get(peer);
    if (!acked) {
      acked = this.tapes.map(() => this.delay);
      this.acked.set(peer, acked);
    }
    return acked;
  }

  /** Falta ler o input local deste tick (ele vale no tick atual + atraso). */
  needsLocal(): boolean {
    return this.tape(this.local).length <= this.tick + this.delay;
  }

  /** Guarda o que o jogador local apertou agora, para o tick atual + atraso. */
  addLocal(mask: InputMask): void {
    if (this.needsLocal()) this.tape(this.local).push(mask & INPUT_BITS);
  }

  /**
   * Host: quem saiu da sala fica parado. A fita dele é completada com input
   * vazio até acompanhar a local, e vai para os outros como qualquer input.
   */
  fillAbsent(player: number): void {
    const tape = this.tape(player);
    const target = this.tape(this.local).length;
    while (tape.length < target) tape.push(NO_INPUT);
  }

  /** Já tem o input de todos para o tick atual. */
  ready(): boolean {
    return this.tapes.every((tape) => tape.length > this.tick);
  }

  /** Jogadores cujo input do tick atual ainda não chegou. */
  waiting(): number[] {
    const missing: number[] = [];
    this.tapes.forEach((tape, player) => {
      if (tape.length <= this.tick) missing.push(player);
    });
    return missing;
  }

  /** Inputs do tick atual (um por jogador) e passa para o próximo. Só com `ready()`. */
  step(): InputMask[] {
    if (!this.ready()) throw new Error('Lockstep: falta input para o tick');
    const inputs = this.tapes.map((tape) => tape[this.tick] ?? NO_INPUT);
    this.tick++;
    return inputs;
  }

  /** O que mandar agora ao par `peer`: das fitas de `players`, o que ele ainda não confirmou. */
  outgoing(peer: number, players: readonly number[]): InputBatch {
    const acked = this.ackedBy(peer);
    const runs: InputRun[] = [];
    for (const player of players) {
      const start = acked[player] ?? this.delay;
      const masks = this.tape(player).slice(start, start + MAX_PACKET_INPUTS);
      if (masks.length > 0) runs.push({ player, start, masks });
    }
    return { have: this.tapes.map((tape) => tape.length), runs };
  }

  /**
   * Recebe um pacote do par `peer`, que só pode trazer as fitas de `players` (o
   * resto é ignorado). Repetido, atrasado ou com buraco: aproveita o que der.
   * Devolve quantos inputs novos entraram.
   */
  receive(peer: number, batch: InputBatch, players: readonly number[]): number {
    const acked = this.ackedBy(peer);
    this.tapes.forEach((tape, player) => {
      const have = batch.have[player] ?? 0;
      if (have > (acked[player] ?? 0) && have <= tape.length) acked[player] = have;
    });
    let added = 0;
    for (const run of batch.runs) {
      if (!players.includes(run.player) || run.player === this.local) continue;
      const tape = this.tape(run.player);
      // buraco antes deste pedaço: espera o próximo pacote, que traz desde o confirmado
      if (run.start > tape.length) continue;
      for (let i = tape.length - run.start; i < run.masks.length; i++) {
        if (tape.length >= this.tick + MAX_REMOTE_LEAD) break;
        tape.push((run.masks[i] ?? NO_INPUT) & INPUT_BITS);
        added++;
      }
    }
    return added;
  }

  /** Folga: quantos ticks ainda dá para rodar com os inputs dos outros que já chegaram. */
  get remoteLead(): number {
    let lead = Infinity;
    this.tapes.forEach((tape, player) => {
      if (player !== this.local) lead = Math.min(lead, tape.length - this.tick);
    });
    return Number.isFinite(lead) ? lead : 0;
  }

  /** Inputs locais ainda sem confirmação (do par mais atrasado). */
  get unacked(): number {
    const length = this.tape(this.local).length;
    let worst = 0;
    for (const acked of this.acked.values()) {
      worst = Math.max(worst, length - (acked[this.local] ?? 0));
    }
    return worst;
  }
}
