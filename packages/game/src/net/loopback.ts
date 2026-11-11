import type { ControlMessage } from './protocol';
import type { Route, Transport } from './transport';

export interface LoopbackOptions {
  /** Chance de perder cada pacote do canal sem garantia (0..1). */
  loss?: number;
  /** Demora de entrega, em passos (cada pacote sorteia uma entre as duas). */
  minDelay?: number;
  maxDelay?: number;
  /** Sorteio (0..1) das perdas e demoras; com seed, o teste se repete igual. */
  random?: () => number;
}

interface Delivery {
  at: number;
  run: () => void;
}

class LoopbackEnd implements Transport {
  onControl: ((data: unknown) => void) | null = null;
  onPacket: ((bytes: Uint8Array) => void) | null = null;
  onClose: (() => void) | null = null;
  readonly route: Route | null = 'direct';
  peer!: LoopbackEnd;
  open = true;
  /** Hora de entrega da última mensagem confiável (elas não se ultrapassam). */
  private lastControlAt = 0;

  constructor(private readonly net: LoopbackNetwork) {}

  sendControl(message: ControlMessage): void {
    if (!this.open) return;
    // passa por texto, como na rede de verdade
    const text = JSON.stringify(message);
    this.lastControlAt = Math.max(this.lastControlAt, this.net.arrival());
    const peer = this.peer;
    this.net.schedule(this.lastControlAt, () => {
      if (peer.open) peer.onControl?.(JSON.parse(text));
    });
  }

  sendPacket(bytes: Uint8Array<ArrayBuffer>): void {
    if (!this.open || this.net.drops()) return;
    const copy = bytes.slice();
    const peer = this.peer;
    this.net.schedule(this.net.arrival(), () => {
      if (peer.open) peer.onPacket?.(copy);
    });
  }

  /** Fecha deste lado; o que já foi mandado pelo canal confiável ainda chega antes. */
  close(): void {
    if (!this.open) return;
    this.open = false;
    const peer = this.peer;
    this.lastControlAt = Math.max(this.lastControlAt, this.net.arrival());
    this.net.schedule(this.lastControlAt, () => {
      if (!peer.open) return;
      peer.open = false;
      peer.onClose?.();
    });
  }

  /** Derruba a conexão na hora: os dois lados ficam sabendo e nada mais chega. */
  drop(): void {
    const wasOpen = this.open;
    this.open = false;
    if (this.peer.open) {
      this.peer.open = false;
      this.peer.onClose?.();
    }
    if (wasOpen) this.onClose?.();
  }
}

/**
 * Rede de mentira para os testes: liga dois lados na memória, com demora, perda
 * e troca de ordem no canal sem garantia. O tempo anda em passos (`step`).
 */
export class LoopbackNetwork {
  private now = 0;
  private queue: Delivery[] = [];
  private readonly loss: number;
  private readonly minDelay: number;
  private readonly maxDelay: number;
  private readonly random: () => number;

  constructor(options: LoopbackOptions = {}) {
    this.loss = options.loss ?? 0;
    this.minDelay = options.minDelay ?? 1;
    this.maxDelay = Math.max(this.minDelay, options.maxDelay ?? this.minDelay);
    this.random = options.random ?? (() => 0.5);
  }

  /** Uma conexão nova: as duas pontas. */
  pair(): [LoopbackEnd, LoopbackEnd] {
    const a = new LoopbackEnd(this);
    const b = new LoopbackEnd(this);
    a.peer = b;
    b.peer = a;
    return [a, b];
  }

  drops(): boolean {
    return this.random() < this.loss;
  }

  arrival(): number {
    const span = this.maxDelay - this.minDelay + 1;
    return this.now + this.minDelay + Math.min(span - 1, Math.floor(this.random() * span));
  }

  schedule(at: number, run: () => void): void {
    this.queue.push({ at, run });
  }

  /** Anda um passo e entrega o que venceu (o que for mandado na entrega fica para depois). */
  step(): void {
    this.now++;
    const due = this.queue.filter((d) => d.at <= this.now);
    this.queue = this.queue.filter((d) => d.at > this.now);
    due.sort((a, b) => a.at - b.at);
    for (const d of due) d.run();
  }
}

export type { LoopbackEnd };
