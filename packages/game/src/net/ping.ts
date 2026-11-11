import { MAX_INPUT_DELAY, TICK_MS } from '@jogo-luta/sim';

/** Atraso de input do online: nunca menos que isto (2 ticks = 33 ms, não dá para sentir). */
export const MIN_NET_DELAY = 2;
/** Nem mais que isto (com ping tão alto, é melhor travar de vez em quando que jogar atrasado). */
export const MAX_NET_DELAY = Math.min(8, MAX_INPUT_DELAY);
/** Sem medida de ping ainda. */
export const DEFAULT_NET_DELAY = 3;
/** Folga somada à ida do input: 1 tick até o outro lado ler o pacote. */
const MARGIN_MS = TICK_MS;

/** Quanto pesa cada medida nova na média (0..1). */
const SMOOTHING = 0.2;
/** Medida maior que isto não é ping, é engasgo (aba em segundo plano): limita. */
const MAX_SAMPLE_MS = 2000;

/** Ping (ida e volta) com média móvel, e o quanto ele varia. */
export class PingMeter {
  /** Ida e volta, em ms (null = ainda sem medida). */
  rtt: number | null = null;
  /** Variação média entre medidas, em ms. */
  jitter = 0;

  add(sampleMs: number): void {
    if (!Number.isFinite(sampleMs) || sampleMs < 0) return;
    const sample = Math.min(sampleMs, MAX_SAMPLE_MS);
    if (this.rtt === null) {
      this.rtt = sample;
      return;
    }
    this.jitter += (Math.abs(sample - this.rtt) - this.jitter) * SMOOTHING;
    this.rtt += (sample - this.rtt) * SMOOTHING;
  }

  reset(): void {
    this.rtt = null;
    this.jitter = 0;
  }
}

/**
 * Atraso de input para um ping: o input precisa chegar do outro lado (metade da
 * ida e volta, mais a variação) antes do tick em que vale. Ping baixo (fibra,
 * mesma cidade) dá 2 a 3 ticks.
 */
export function delayForPing(rttMs: number | null, jitterMs = 0): number {
  if (rttMs === null) return DEFAULT_NET_DELAY;
  const ticks = Math.ceil((rttMs / 2 + jitterMs + MARGIN_MS) / TICK_MS);
  return Math.max(MIN_NET_DELAY, Math.min(MAX_NET_DELAY, ticks));
}

/** Ping de um caminho: ida e volta e variação, em ms (rtt null = sem medida). */
export interface PathPing {
  rtt: number | null;
  jitter: number;
}

/**
 * O pior caminho de um input numa sala em estrela, como um ping só (para o
 * `delayForPing`). Cada um que entrou só fala com o host: do host até ele, o
 * caminho é o ping dele; entre dois que entraram, o input passa pelo host, então
 * soma os dois maiores pings (e as duas maiores variações). Falta medir alguém:
 * sem medida.
 */
export function starPing(pings: readonly PathPing[]): PathPing {
  if (pings.length === 0 || pings.some((p) => p.rtt === null)) return { rtt: null, jitter: 0 };
  const sumTop2 = (values: number[]): number =>
    values
      .sort((a, b) => b - a)
      .slice(0, 2)
      .reduce((a, b) => a + b, 0);
  return {
    rtt: sumTop2(pings.map((p) => p.rtt ?? 0)),
    jitter: sumTop2(pings.map((p) => p.jitter)),
  };
}

export type PingQuality = 'good' | 'ok' | 'bad';

/** Cor do indicador: verde até 60 ms, amarelo até 120 ms, vermelho acima. */
export function pingQuality(rttMs: number | null): PingQuality {
  if (rttMs === null) return 'ok';
  if (rttMs <= 60) return 'good';
  return rttMs <= 120 ? 'ok' : 'bad';
}

/** "ping 23 ms" (ou "ping …" sem medida). */
export function pingLabel(rttMs: number | null): string {
  return rttMs === null ? 'ping …' : `ping ${String(Math.round(rttMs))} ms`;
}
