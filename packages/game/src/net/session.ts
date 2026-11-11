import { DesyncDetector } from './desync';
import { Lockstep } from './lockstep';
import { delayForPing, PingMeter } from './ping';
import {
  decodePacket,
  encodeInputPacket,
  encodeTimePacket,
  NET_VERSION,
  parseControl,
  type ControlMessage,
  type FightScreen,
  type Screen,
} from './protocol';
import type { EndReason, Link, Transport } from './transport';

/** Um ping a cada tanto (também é o sinal de vida do canal sem garantia). */
export const PING_INTERVAL_MS = 250;
/** Sem ouvir nada por este tempo: conexão instável (aviso na tela). */
export const UNSTABLE_MS = 1000;
/** Sem ouvir nada por este tempo: dá a conexão por caída e tenta outra. */
export const SILENCE_DROP_MS = 6000;
/** Tempo máximo tentando reconectar antes de desistir da sala. */
export const RECONNECT_MS = 30000;

export type NetStatus =
  /** Ainda sem o outro jogador (host esperando, ou quem entra discando). */
  | 'connecting'
  | 'connected'
  /** A conexão caiu no meio: tentando de novo. */
  | 'reconnecting'
  /** A sala acabou (ver `ended`). */
  | 'closed';

/** A partida online em andamento. */
export interface OnlineMatch extends FightScreen {
  lockstep: Lockstep;
  desync: DesyncDetector;
}

/** Cursor e confirmação de um jogador na seleção de personagem. */
export interface Selection {
  cursor: number;
  ready: boolean;
}

export interface SessionOptions {
  role: 'host' | 'guest';
  /** Código da sala. */
  code: string;
  link: Link;
  /** Build do jogo: os dois lados precisam do mesmo para a luta sair igual. */
  build: string;
  /** Relógio em ms (fora do `sim`: só para ping e prazos de conexão). */
  clock: () => number;
  /** Sorteio de 32 bits (seed de cada partida e id de quem entra). */
  newSeed: () => number;
}

/**
 * Uma sala online de 2 jogadores, sem Phaser nem WebRTC: recebe as conexões do
 * `Link`, faz a apresentação (versão, sala cheia), mantém a tela da sala
 * (seleção → mapa → luta), a seleção de cada um, os votos de revanche, o ping,
 * a partida (lockstep + checagem de dessincronização) e a reconexão.
 *
 * O host é o jogador 1 e manda na tela da sala; quem entra é o jogador 2 e
 * segue. As cenas só leem o estado daqui a cada quadro.
 */
export class OnlineSession {
  readonly role: 'host' | 'guest';
  readonly code: string;
  /** Jogador deste lado (host = 0, quem entra = 1). */
  readonly local: number;
  status: NetStatus = 'connecting';
  /** Por que a sala acabou (null = ainda aberta). */
  ended: EndReason | null = null;
  /** Host: a sala já está registrada e o código pode ser mostrado. */
  roomReady = false;
  readonly ping = new PingMeter();
  /** Tela atual da sala (null = ainda na sala de espera). */
  screen: Screen | null = null;
  match: OnlineMatch | null = null;
  /** Seleção do outro jogador (null = ainda não mandou nesta tela). */
  remoteSel: Selection | null = null;
  /** Votos de revanche da partida atual. */
  readonly rematch = { local: false, remote: false };

  private readonly link: Link;
  private readonly build: string;
  private readonly clock: () => number;
  private readonly newSeed: () => number;
  /** Id de quem entra, para o host reconhecer a reconexão. */
  private readonly client: string;
  /** Host: o id de quem entrou primeiro (a vaga é dele). */
  private guest: string | null = null;
  private transport: Transport | null = null;
  private localSel: Selection | null = null;
  private seq = 0;
  private lastHeard = 0;
  private lastPing = -PING_INTERVAL_MS;
  private downSince = 0;

  constructor(options: SessionOptions) {
    this.role = options.role;
    this.code = options.code;
    this.local = options.role === 'host' ? 0 : 1;
    this.link = options.link;
    this.build = options.build;
    this.clock = options.clock;
    this.newSeed = options.newSeed;
    this.client = options.newSeed().toString(36);
    this.link.onReady = () => {
      this.roomReady = true;
    };
    this.link.onTransport = (transport) => {
      this.attach(transport);
    };
    this.link.onFail = (reason) => {
      this.end(reason);
    };
  }

  /** Jogador do outro lado. */
  get remote(): number {
    return 1 - this.local;
  }

  /** Há quanto tempo não chega nada do outro lado (0 se não está conectado). */
  get silentMs(): number {
    return this.status === 'connected' ? this.clock() - this.lastHeard : 0;
  }

  /** Reconectando: quanto falta para desistir, em ms. */
  get reconnectLeftMs(): number {
    if (this.status !== 'reconnecting') return 0;
    return Math.max(0, RECONNECT_MS - (this.clock() - this.downSince));
  }

  /** Tráfego direto ou por relay (null = não se sabe). */
  get route(): Transport['route'] {
    return this.transport?.route ?? null;
  }

  /** Conexão nova (a 1ª ou uma reconexão). */
  attach(transport: Transport): void {
    if (this.ended) {
      transport.close();
      return;
    }
    transport.onControl = (data) => {
      this.onControl(transport, data);
    };
    transport.onPacket = (bytes) => {
      if (transport === this.transport) this.onPacket(bytes);
    };
    transport.onClose = () => {
      if (transport === this.transport) this.onDown();
    };
    // o host só adota a conexão depois de quem entrou se apresentar
    if (this.role === 'host') return;
    this.replaceTransport(transport);
    transport.sendControl({ t: 'hello', v: NET_VERSION, build: this.build, client: this.client });
  }

  private replaceTransport(transport: Transport): void {
    const old = this.transport;
    this.transport = transport;
    this.lastHeard = this.clock();
    if (old && old !== transport) old.close();
  }

  private onDown(): void {
    this.transport = null;
    if (this.ended) return;
    // antes da 1ª conexão quem cuida é o Link (sala não encontrada, sem internet)
    if (this.status === 'connected') {
      this.status = 'reconnecting';
      this.downSince = this.clock();
    }
  }

  private onConnected(): void {
    this.status = 'connected';
    this.lastHeard = this.clock();
    this.lastPing = -PING_INTERVAL_MS;
    // o que pode ter se perdido com a conexão anterior vai de novo
    if (this.role === 'host' && this.screen) this.send({ t: 'screen', screen: this.screen });
    this.resendOwnState();
  }

  private resendOwnState(): void {
    const screen = this.screen;
    if (!screen) return;
    if (screen.name === 'select' && this.localSel) {
      this.send({ t: 'sel', seq: screen.seq, ...this.localSel });
    }
    if (screen.name === 'fight' && this.rematch.local) {
      this.send({ t: 'rematch', seq: screen.seq });
    }
  }

  private send(message: ControlMessage): void {
    this.transport?.sendControl(message);
  }

  private onControl(from: Transport, data: unknown): void {
    if (this.ended) return;
    const message = parseControl(data);
    if (!message) return;
    if (message.t === 'hello') {
      this.onHello(from, message);
      return;
    }
    if (from !== this.transport) return;
    this.lastHeard = this.clock();
    switch (message.t) {
      case 'welcome':
        if (this.role === 'guest') this.onConnected();
        break;
      case 'refuse':
        if (this.role === 'guest') this.end(message.reason);
        break;
      case 'screen':
        if (this.role === 'guest' && message.screen.seq !== this.screen?.seq) {
          this.applyScreen(message.screen);
          // o que eu já tinha feito nesta tela (reconexão) vai de novo
          this.resendOwnState();
        }
        break;
      case 'sel':
        if (this.screen?.name === 'select' && message.seq === this.screen.seq) {
          this.remoteSel = { cursor: message.cursor, ready: message.ready };
        }
        break;
      case 'goto':
        if (this.role === 'host' && this.screen?.name !== 'select') this.openSelect();
        break;
      case 'rematch':
        if (this.screen?.name === 'fight' && message.seq === this.screen.seq) {
          this.rematch.remote = true;
          this.checkRematch();
        }
        break;
      case 'hash':
        if (this.match && message.seq === this.match.seq) {
          this.reportDesync(this.match.desync.addRemote(message.tick, message.hash));
        }
        break;
      case 'bye':
        this.end('left');
        break;
    }
  }

  /** Host: alguém se apresentou. Versão diferente ou sala cheia: recusa só essa conexão. */
  private onHello(from: Transport, hello: Extract<ControlMessage, { t: 'hello' }>): void {
    if (this.role !== 'host') return;
    if (hello.v !== NET_VERSION || hello.build !== this.build) {
      from.sendControl({ t: 'refuse', reason: 'version' });
      return;
    }
    if (this.guest !== null && this.guest !== hello.client) {
      from.sendControl({ t: 'refuse', reason: 'full' });
      return;
    }
    this.guest = hello.client;
    this.replaceTransport(from);
    from.sendControl({ t: 'welcome' });
    this.onConnected();
  }

  private onPacket(bytes: Uint8Array): void {
    const packet = decodePacket(bytes);
    if (!packet || this.ended) return;
    this.lastHeard = this.clock();
    switch (packet.type) {
      case 'ping':
        this.transport?.sendPacket(encodeTimePacket('pong', packet.time));
        break;
      case 'pong':
        this.ping.add(this.clock() - packet.time);
        break;
      case 'input':
        // pacote atrasado de outra partida não entra nesta
        if (this.match && packet.seq === this.match.seq) this.match.lockstep.receive(packet);
        break;
    }
  }

  /** Chamado várias vezes por segundo: ping, conexão muda e prazo de reconexão. */
  update(): void {
    if (this.ended) return;
    const now = this.clock();
    if (this.status === 'reconnecting' && now - this.downSince >= RECONNECT_MS) {
      this.end('lost');
      return;
    }
    const transport = this.transport;
    if (!transport || this.status !== 'connected') return;
    if (now - this.lastHeard >= SILENCE_DROP_MS) {
      // muda demais: fecha, e o Link disca de novo
      this.onDown();
      transport.close();
      return;
    }
    if (now - this.lastPing >= PING_INTERVAL_MS) {
      this.lastPing = now;
      transport.sendPacket(encodeTimePacket('ping', now));
    }
  }

  private applyScreen(screen: Screen): void {
    this.screen = screen;
    this.seq = Math.max(this.seq, screen.seq);
    this.remoteSel = null;
    this.localSel = null;
    this.rematch.local = false;
    this.rematch.remote = false;
    this.match =
      screen.name === 'fight'
        ? {
            ...screen,
            lockstep: new Lockstep(this.local, screen.delay),
            desync: new DesyncDetector(),
          }
        : null;
  }

  private setScreen(screen: Screen): void {
    if (this.role !== 'host' || this.ended) return;
    this.applyScreen(screen);
    this.send({ t: 'screen', screen });
  }

  /**
   * Vai para a seleção de personagem. Quem entrou só pede: a tela muda quando o
   * host responder.
   */
  openSelect(): void {
    if (this.role === 'guest') this.send({ t: 'goto', screen: 'select' });
    else this.setScreen({ name: 'select', seq: this.seq + 1 });
  }

  /** Host: abre a seleção de mapa (ou troca o mapa mostrado). */
  openStage(characters: readonly string[], stageId: string): void {
    this.setScreen({ name: 'stage', seq: this.seq + 1, characters: [...characters], stageId });
  }

  /** Host: começa uma partida, com seed nova e o atraso de input que o ping pede. */
  startMatch(characters: readonly string[], stageId: string): void {
    this.setScreen({
      name: 'fight',
      seq: this.seq + 1,
      characters: [...characters],
      stageId,
      seed: this.newSeed() >>> 0,
      delay: delayForPing(this.ping.rtt, this.ping.jitter),
    });
  }

  /** Seleção de personagem deste lado (só manda quando muda). */
  setSel(cursor: number, ready: boolean): void {
    const screen = this.screen;
    if (screen?.name !== 'select') return;
    if (this.localSel?.cursor === cursor && this.localSel.ready === ready) return;
    this.localSel = { cursor, ready };
    this.send({ t: 'sel', seq: screen.seq, cursor, ready });
  }

  /** Quero revanche. Com os dois votos, o host começa outra partida igual. */
  voteRematch(): void {
    const screen = this.screen;
    if (screen?.name !== 'fight' || this.rematch.local) return;
    this.rematch.local = true;
    this.send({ t: 'rematch', seq: screen.seq });
    this.checkRematch();
  }

  private checkRematch(): void {
    const screen = this.screen;
    if (this.role !== 'host' || screen?.name !== 'fight') return;
    if (this.rematch.local && this.rematch.remote) {
      this.startMatch(screen.characters, screen.stageId);
    }
  }

  /** Manda os inputs locais que o outro lado ainda não confirmou (todo tick). */
  sendInputs(): void {
    const match = this.match;
    if (!match || this.status !== 'connected') return;
    this.transport?.sendPacket(encodeInputPacket(match.seq, match.lockstep.outgoing()));
  }

  /** Hash do estado deste lado depois do tick `tick`: guarda, manda e compara. */
  reportHash(tick: number, hash: number): void {
    const match = this.match;
    if (!match) return;
    this.send({ t: 'hash', seq: match.seq, tick, hash });
    this.reportDesync(match.desync.addLocal(tick, hash));
  }

  private reportDesync(found: ReturnType<DesyncDetector['addLocal']>): void {
    if (!found) return;
    const hex = (n: number): string => n.toString(16).padStart(8, '0');
    console.error(
      `Online: a luta dessincronizou no tick ${String(found.tick)} ` +
        `(sala ${this.code}, hash local ${hex(found.local)}, do outro lado ${hex(found.remote)}).`,
    );
  }

  /** Sai da sala de propósito (avisa o outro lado). */
  leave(): void {
    if (this.ended) return;
    this.send({ t: 'bye' });
    this.end('quit');
  }

  private end(reason: EndReason): void {
    if (this.ended) return;
    this.ended = reason;
    this.status = 'closed';
    const transport = this.transport;
    this.transport = null;
    transport?.close();
    this.link.close();
  }
}
