import { Peer, type DataConnection, type PeerOptions } from 'peerjs';
import type { NetConfig } from './config';
import type { ControlMessage } from './protocol';
import { roomPeerId } from './roomCode';
import type { EndReason, Link, Route, Transport } from './transport';

/** Id combinado do canal de inputs (os dois lados criam o canal com o mesmo id). */
const INPUT_CHANNEL_ID = 100;
/** Fila do canal de inputs acima disto: o pacote é descartado (o próximo cobre). */
const MAX_BUFFERED_BYTES = 64 * 1024;
/** Espera antes de derrubar a conexão ao fechar, para a última mensagem sair. */
const CLOSE_GRACE_MS = 300;
/** Tempo máximo de uma tentativa de conexão. */
const DIAL_TIMEOUT_MS = 12000;
/** Espera entre tentativas (reconexão com a sala ou com o servidor de sinalização). */
const RETRY_MS = 2000;
/** Maior pacote aceito pelo caminho de reserva (canal confiável). */
const MAX_FALLBACK_BYTES = 256;

interface FallbackPacket {
  t: 'raw';
  d: number[];
}

function isFallbackPacket(data: unknown): data is FallbackPacket {
  if (typeof data !== 'object' || data === null) return false;
  const { t, d } = data as { t?: unknown; d?: unknown };
  return (
    t === 'raw' &&
    Array.isArray(d) &&
    d.length <= MAX_FALLBACK_BYTES &&
    d.every((n) => Number.isInteger(n) && n >= 0 && n <= 255)
  );
}

/**
 * Conexão WebRTC com o outro jogador, aberta pelo PeerJS.
 *
 * O canal do PeerJS é confiável e ordenado: fica para o lobby e o controle. Os
 * inputs vão por um segundo DataChannel na mesma conexão, sem ordenação e sem
 * retransmissão (parecido com UDP): pacote atrasado não segura os seguintes. O
 * PeerJS não cria canal assim, então ele é criado direto na RTCPeerConnection,
 * com id combinado (`negotiated`), sem precisar de nova sinalização.
 *
 * Enquanto esse canal não abre (ou se o navegador não deixar criar), os pacotes
 * vão pelo canal confiável: funciona, só sente mais a perda de pacote.
 */
class PeerTransport implements Transport {
  onControl: ((data: unknown) => void) | null = null;
  onPacket: ((bytes: Uint8Array) => void) | null = null;
  onClose: (() => void) | null = null;
  route: Route | null = null;
  private raw: RTCDataChannel | null = null;
  private dead = false;
  private readonly timers: number[] = [];

  constructor(
    private readonly conn: DataConnection,
    /** Avisa o Link que esta conexão acabou (caiu ou foi fechada). */
    private readonly onDead: () => void,
  ) {
    conn.on('data', (data) => {
      if (this.dead) return;
      if (isFallbackPacket(data)) this.onPacket?.(Uint8Array.from(data.d));
      else this.onControl?.(data);
    });
    conn.on('close', this.die);
    conn.on('error', this.die);
    const pc = conn.peerConnection;
    pc.addEventListener('iceconnectionstatechange', () => {
      if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'closed') this.die();
    });
    try {
      const raw = pc.createDataChannel('inputs', {
        negotiated: true,
        id: INPUT_CHANNEL_ID,
        ordered: false,
        maxRetransmits: 0,
      });
      raw.binaryType = 'arraybuffer';
      raw.addEventListener('message', (e: MessageEvent<unknown>) => {
        if (!this.dead && e.data instanceof ArrayBuffer) this.onPacket?.(new Uint8Array(e.data));
      });
      this.raw = raw;
    } catch (error) {
      console.warn('Online: sem canal de inputs próprio; usando o canal confiável.', error);
    }
    for (const ms of [1500, 6000]) {
      this.timers.push(window.setTimeout(() => void this.readRoute(), ms));
    }
  }

  /** Os pacotes estão indo pelo canal sem retransmissão (e não pelo de reserva). */
  get unreliable(): boolean {
    return this.raw?.readyState === 'open';
  }

  sendControl(message: ControlMessage): void {
    if (this.dead || !this.conn.open) return;
    void this.conn.send(message);
  }

  sendPacket(bytes: Uint8Array<ArrayBuffer>): void {
    if (this.dead) return;
    const raw = this.raw;
    if (raw?.readyState === 'open') {
      if (raw.bufferedAmount > MAX_BUFFERED_BYTES) return;
      try {
        raw.send(bytes);
      } catch {
        // canal fechando: o pacote se perde, como qualquer outro
      }
      return;
    }
    if (this.conn.open) void this.conn.send({ t: 'raw', d: Array.from(bytes) });
  }

  close(): void {
    if (this.dead) return;
    this.dead = true;
    this.clearTimers();
    window.setTimeout(() => {
      this.raw?.close();
      this.conn.close();
    }, CLOSE_GRACE_MS);
    this.onDead();
  }

  private readonly die = (): void => {
    if (this.dead) return;
    this.dead = true;
    this.clearTimers();
    this.raw?.close();
    this.conn.close();
    this.onClose?.();
    this.onDead();
  };

  private clearTimers(): void {
    for (const id of this.timers) window.clearTimeout(id);
    this.timers.length = 0;
  }

  /** Descobre pelo par de candidatos escolhido se o tráfego vai direto ou por relay. */
  private async readRoute(): Promise<void> {
    try {
      const stats = await this.conn.peerConnection.getStats();
      const reports: Record<string, unknown>[] = [];
      stats.forEach((report: Record<string, unknown>) => reports.push(report));
      const transport = reports.find(
        (r) => r.type === 'transport' && typeof r.selectedCandidatePairId === 'string',
      );
      const pair =
        reports.find(
          (r) => r.type === 'candidate-pair' && r.id === transport?.selectedCandidatePairId,
        ) ??
        reports.find(
          (r) => r.type === 'candidate-pair' && r.nominated === true && r.state === 'succeeded',
        );
      const local = reports.find(
        (r) => r.type === 'local-candidate' && r.id === pair?.localCandidateId,
      );
      const remote = reports.find(
        (r) => r.type === 'remote-candidate' && r.id === pair?.remoteCandidateId,
      );
      if (!local) return;
      const relayed = local.candidateType === 'relay' || remote?.candidateType === 'relay';
      this.route = relayed ? 'relay' : 'direct';
    } catch {
      // sem estatísticas neste navegador: fica sem saber
    }
  }
}

/**
 * Sala no PeerJS: o host se registra no servidor de sinalização com o código da
 * sala; quem entra disca para esse id. A partir daí o tráfego é direto (P2P).
 * Quando a conexão cai, quem entrou disca de novo; o host fica esperando.
 */
export class PeerLink implements Link {
  onReady: (() => void) | null = null;
  onTransport: ((transport: Transport) => void) | null = null;
  onFail: ((reason: EndReason) => void) | null = null;
  private readonly peer: Peer;
  private closed = false;
  /** O servidor de sinalização já respondeu alguma vez. */
  private registered = false;
  private everConnected = false;
  private live: PeerTransport | null = null;
  private dialing: DataConnection | null = null;
  private readonly timers = new Set<number>();

  constructor(
    private readonly role: 'host' | 'guest',
    private readonly code: string,
    config: NetConfig,
  ) {
    const options: PeerOptions = {
      config: { iceServers: config.iceServers, sdpSemantics: 'unified-plan' },
      ...config.signaling,
    };
    this.peer = role === 'host' ? new Peer(roomPeerId(code), options) : new Peer(options);
    this.peer.on('open', () => {
      if (this.closed) return;
      this.registered = true;
      this.onReady?.();
      if (this.role === 'guest') this.dial();
    });
    this.peer.on('connection', (conn) => {
      conn.on('open', () => {
        this.adopt(conn);
      });
    });
    // caiu do servidor de sinalização: a luta em andamento não depende dele, mas a reconexão sim
    this.peer.on('disconnected', () => {
      this.later(this.reconnectSignaling, RETRY_MS);
    });
    this.peer.on('error', (error) => {
      this.onPeerError(error.type);
    });
  }

  /** Conexão P2P em uso: direta/relay e se o canal de inputs sem retransmissão abriu. */
  get unreliable(): boolean {
    return this.live?.unreliable ?? false;
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    for (const id of this.timers) window.clearTimeout(id);
    this.timers.clear();
    // dá tempo de a despedida sair antes de derrubar tudo
    window.setTimeout(() => {
      this.peer.destroy();
    }, CLOSE_GRACE_MS + 100);
  }

  private later(run: () => void, ms: number): void {
    if (this.closed) return;
    const id = window.setTimeout(() => {
      this.timers.delete(id);
      if (!this.closed) run();
    }, ms);
    this.timers.add(id);
  }

  private fail(reason: EndReason): void {
    if (!this.closed) this.onFail?.(reason);
  }

  private readonly reconnectSignaling = (): void => {
    if (this.peer.destroyed || !this.peer.disconnected) return;
    this.peer.reconnect();
  };

  private onPeerError(type: string): void {
    if (this.closed) return;
    switch (type) {
      case 'unavailable-id':
        // sala nova: o código já existe. Voltando ao servidor: o registro antigo ainda não saiu
        if (!this.registered) this.fail('taken');
        else this.later(this.reconnectSignaling, RETRY_MS);
        break;
      case 'peer-unavailable':
        this.dialing = null;
        if (!this.everConnected) this.fail('not-found');
        else this.later(this.dial, RETRY_MS);
        break;
      case 'browser-incompatible':
      case 'invalid-id':
      case 'invalid-key':
      case 'ssl-unavailable':
        this.fail('error');
        break;
      case 'network':
      case 'server-error':
      case 'socket-error':
      case 'socket-closed':
        if (!this.registered) this.fail('error');
        else this.later(this.reconnectSignaling, RETRY_MS);
        break;
      default:
        break;
    }
  }

  /** Quem entra: disca para a sala (a 1ª vez e a cada queda). */
  private readonly dial = (): void => {
    if (this.closed || this.role !== 'guest' || this.live || this.dialing) return;
    if (this.peer.disconnected) {
      // sem servidor de sinalização não dá para discar: o 'open' dele disca de novo
      this.reconnectSignaling();
      this.later(this.dial, RETRY_MS * 2);
      return;
    }
    const conn = this.peer.connect(roomPeerId(this.code), {
      reliable: true,
      serialization: 'json',
    });
    this.dialing = conn;
    this.later(() => {
      if (this.dialing !== conn) return;
      this.dialing = null;
      conn.close();
      if (this.everConnected) this.dial();
      else this.fail('error');
    }, DIAL_TIMEOUT_MS);
    conn.on('open', () => {
      if (this.dialing !== conn) {
        conn.close();
        return;
      }
      this.dialing = null;
      this.adopt(conn);
    });
    conn.on('error', () => {
      if (this.dialing !== conn) return;
      this.dialing = null;
      this.later(this.dial, RETRY_MS);
    });
  };

  private adopt(conn: DataConnection): void {
    if (this.closed) {
      conn.close();
      return;
    }
    this.everConnected = true;
    const transport = new PeerTransport(conn, () => {
      if (this.live === transport) this.live = null;
      this.later(this.dial, RETRY_MS / 2);
    });
    this.live = transport;
    this.onTransport?.(transport);
  }
}
