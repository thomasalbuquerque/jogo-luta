import { DesyncDetector, type Desync } from './desync';
import { Lockstep } from './lockstep';
import { delayForPing, PingMeter, starPing } from './ping';
import {
  decodePacket,
  encodeInputPacket,
  encodeTimePacket,
  MAX_ROOM_PLAYERS,
  NET_VERSION,
  parseControl,
  type ControlMessage,
  type FightScreen,
  type Packet,
  type Screen,
} from './protocol';
import type { EndReason, Link, Route, Transport } from './transport';

/** Um ping a cada tanto (também é o sinal de vida do canal sem garantia). */
export const PING_INTERVAL_MS = 250;
/** Sem ouvir nada por este tempo: conexão instável (aviso na tela). */
export const UNSTABLE_MS = 1000;
/** Sem ouvir nada por este tempo: dá a conexão por caída e tenta outra. */
export const SILENCE_DROP_MS = 6000;
/** Tempo máximo tentando reconectar antes de desistir de alguém (ou da sala). */
export const RECONNECT_MS = 30000;
/** Por quanto tempo o aviso de alguém que entrou ou saiu fica na tela. */
export const NOTICE_MS = 4000;

export type NetStatus =
  /** Ainda sem ninguém (host esperando, ou quem entra discando). */
  | 'connecting'
  | 'connected'
  /** A conexão com alguém caiu no meio: tentando de novo. */
  | 'reconnecting'
  /** A sala acabou (ver `ended`). */
  | 'closed';

/** A partida online em andamento. */
export interface OnlineMatch extends FightScreen {
  /** Lutador deste lado. */
  local: number;
  lockstep: Lockstep;
  desync: DesyncDetector;
}

/** Cursor e confirmação de um jogador na seleção de personagem. */
export interface Selection {
  cursor: number;
  ready: boolean;
}

/** Votos de revanche da partida atual. */
export interface RematchVotes {
  /** Este lado já votou. */
  local: boolean;
  /** Quantos já votaram (contando este lado). */
  votes: number;
  /** Quantos precisam votar (todos na sala). */
  total: number;
}

export interface SessionOptions {
  role: 'host' | 'guest';
  /** Código da sala. */
  code: string;
  link: Link;
  /** Build do jogo: todos precisam do mesmo para a luta sair igual. */
  build: string;
  /** Relógio em ms (fora do `sim`: só para ping e prazos de conexão). */
  clock: () => number;
  /** Sorteio de 32 bits (seed de cada partida e id de cada um na sala). */
  newSeed: () => number;
}

/**
 * Uma conexão com outro lado da sala. O host tem uma para cada um que entrou;
 * quem entra tem só a do host.
 */
interface Peer {
  /** Id de quem está do outro lado (para quem entra, o host é `HOST_PEER`). */
  client: string;
  transport: Transport | null;
  /** connecting: ainda sem a 1ª conexão; down: caiu e espera voltar. */
  state: 'connecting' | 'connected' | 'down';
  downSince: number;
  lastHeard: number;
  lastPing: number;
  readonly ping: PingMeter;
}

/** Chave da conexão com o host, do lado de quem entra (não é um id sorteado). */
const HOST_PEER = '#host';
/** Ping de quem ainda não tem conexão nenhuma. */
const NO_PING = new PingMeter();

/** Os lutadores da partida menos o `skip`. */
function allBut(match: FightScreen, skip: number): number[] {
  const players: number[] = [];
  for (let p = 0; p < match.characters.length; p++) if (p !== skip) players.push(p);
  return players;
}

function newPeer(client: string, state: Peer['state']): Peer {
  return {
    client,
    transport: null,
    state,
    downSince: 0,
    lastHeard: 0,
    lastPing: -PING_INTERVAL_MS,
    ping: new PingMeter(),
  };
}

/**
 * Uma sala online de 2 a 4 jogadores, sem Phaser nem WebRTC: recebe as conexões
 * do `Link`, faz a apresentação (versão, sala cheia, sala em luta), mantém quem
 * está na sala, a tela (seleção → mapa → luta), a seleção de cada um, os votos
 * de revanche, o ping, a partida (lockstep + checagem de dessincronização), a
 * reconexão e quem sai no meio.
 *
 * A sala é uma estrela: o host é o P1, manda na tela e tem uma conexão com cada
 * um que entrou; quem entra só fala com o host, que repassa os inputs de cada um
 * para os outros assim que chegam. As cenas só leem o estado daqui a cada quadro.
 */
export class OnlineSession {
  readonly role: 'host' | 'guest';
  readonly code: string;
  /** Por que a sala acabou (null = ainda aberta). */
  ended: EndReason | null = null;
  /** Host: a sala já está registrada e o código pode ser mostrado. */
  roomReady = false;
  /** Tela atual da sala (null = ainda na sala de espera). */
  screen: Screen | null = null;
  match: OnlineMatch | null = null;

  private readonly link: Link;
  private readonly build: string;
  private readonly clock: () => number;
  private readonly newSeed: () => number;
  /** Id deste lado na sala (sorteado; serve para reconhecer a reconexão). */
  private readonly client: string;
  /** Quem está na sala, na ordem dos lugares (o host é o 1º). */
  private clients: string[];
  /** Conexões com os outros lados, pelo id de cada um. */
  private readonly peers = new Map<string, Peer>();
  /** Seleção dos outros na tela atual, pelo id de cada um. */
  private readonly sels = new Map<string, Selection>();
  private localSel: Selection | null = null;
  private voted = false;
  /** Host: quem já votou na revanche. */
  private readonly voters = new Set<string>();
  /** Quem entra: quantos votos o host contou. */
  private hostVotes = 0;
  /** Host: lutadores da partida que saíram da sala (ficam parados até ela acabar). */
  private readonly absent = new Set<number>();
  private noticeText = '';
  private noticeAt = -Infinity;
  private seq = 0;

  constructor(options: SessionOptions) {
    this.role = options.role;
    this.code = options.code;
    this.link = options.link;
    this.build = options.build;
    this.clock = options.clock;
    this.newSeed = options.newSeed;
    this.client = options.newSeed().toString(36);
    this.clients = this.role === 'host' ? [this.client] : [];
    if (this.role === 'guest') this.peers.set(HOST_PEER, newPeer(HOST_PEER, 'connecting'));
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

  /** Quem está na sala (ids), na ordem dos lugares. */
  get roster(): readonly string[] {
    return this.clients;
  }

  /** Quantos estão na sala. */
  get players(): number {
    return this.clients.length;
  }

  /** Lugar deste lado na sala (host = 0; -1 = ainda sem a lista do host). */
  get local(): number {
    return this.clients.indexOf(this.client);
  }

  get status(): NetStatus {
    if (this.ended) return 'closed';
    const states = [...this.peers.values()].map((p) => p.state);
    if (states.includes('down')) return 'reconnecting';
    return states.includes('connected') ? 'connected' : 'connecting';
  }

  /** Ping com o host (quem entra) ou com quem está mais longe (host). */
  get ping(): PingMeter {
    let worst: PingMeter | null = null;
    for (const peer of this.peers.values()) {
      if (!worst || (peer.ping.rtt ?? 0) > (worst.rtt ?? 0)) worst = peer.ping;
    }
    return worst ?? NO_PING;
  }

  /** Há quanto tempo não chega nada de alguém conectado (0 se não há ninguém). */
  get silentMs(): number {
    const now = this.clock();
    let silent = 0;
    for (const peer of this.peers.values()) {
      if (peer.state === 'connected') silent = Math.max(silent, now - peer.lastHeard);
    }
    return silent;
  }

  /** Reconectando: quanto falta para desistir (de quem caiu primeiro), em ms. */
  get reconnectLeftMs(): number {
    const now = this.clock();
    let left = Infinity;
    for (const peer of this.peers.values()) {
      if (peer.state === 'down') left = Math.min(left, RECONNECT_MS - (now - peer.downSince));
    }
    return Number.isFinite(left) ? Math.max(0, left) : 0;
  }

  /** Tráfego direto ou por relay (relay se alguma conexão passa por um; null = não se sabe). */
  get route(): Route | null {
    let route: Route | null = null;
    for (const peer of this.peers.values()) {
      const r = peer.transport?.route ?? null;
      if (r === 'relay') return 'relay';
      route = r ?? route;
    }
    return route;
  }

  /** Seleção de quem está no lugar `seat` (null = ainda não escolheu nesta tela). */
  selection(seat: number): Selection | null {
    const client = this.clients[seat];
    if (client === undefined) return null;
    return client === this.client ? this.localSel : (this.sels.get(client) ?? null);
  }

  get rematch(): RematchVotes {
    const votes =
      this.role === 'host' ? this.voters.size : Math.max(this.hostVotes, this.voted ? 1 : 0);
    return { local: this.voted, votes, total: this.clients.length };
  }

  /** Aviso recente da sala (alguém entrou ou saiu); '' passados alguns segundos. */
  get notice(): string {
    return this.clock() - this.noticeAt < NOTICE_MS ? this.noticeText : '';
  }

  private announce(text: string): void {
    this.noticeText = text;
    this.noticeAt = this.clock();
  }

  /** "P3": o número de quem está (ou estava) no lugar `seat`; na luta, o do lutador. */
  private playerLabel(client: string, seat: number): string {
    const fighter = this.match?.clients.indexOf(client) ?? -1;
    return `P${String((fighter >= 0 ? fighter : seat) + 1)}`;
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
      const peer = this.peerOf(transport);
      if (peer) this.onPacket(peer, bytes);
    };
    transport.onClose = () => {
      const peer = this.peerOf(transport);
      if (peer) this.onDown(peer);
    };
    // o host só adota a conexão depois de quem entrou se apresentar
    const host = this.peers.get(HOST_PEER);
    if (this.role === 'host' || !host) return;
    this.replaceTransport(host, transport);
    transport.sendControl({ t: 'hello', v: NET_VERSION, build: this.build, client: this.client });
  }

  private peerOf(transport: Transport): Peer | null {
    for (const peer of this.peers.values()) if (peer.transport === transport) return peer;
    return null;
  }

  private replaceTransport(peer: Peer, transport: Transport): void {
    const old = peer.transport;
    peer.transport = transport;
    peer.lastHeard = this.clock();
    if (old && old !== transport) old.close();
  }

  private onDown(peer: Peer): void {
    peer.transport = null;
    if (this.ended) return;
    // antes da 1ª conexão quem cuida é o Link (sala não encontrada, sem internet)
    if (peer.state === 'connected') {
      peer.state = 'down';
      peer.downSince = this.clock();
    }
  }

  private onConnected(peer: Peer): void {
    peer.state = 'connected';
    peer.lastHeard = this.clock();
    peer.lastPing = -PING_INTERVAL_MS;
    // o que pode ter se perdido com a conexão anterior vai de novo
    if (this.role === 'host') this.syncPeer(peer);
    else this.resendOwnState();
  }

  /** Host: tudo o que quem (re)conectou precisa para seguir a sala. */
  private syncPeer(peer: Peer): void {
    const send = (message: ControlMessage): void => {
      peer.transport?.sendControl(message);
    };
    send({ t: 'roster', clients: [...this.clients] });
    const screen = this.screen;
    if (!screen) return;
    send({ t: 'screen', screen });
    if (screen.name === 'select') send(this.selsMessage(screen.seq));
    if (screen.name === 'fight') send({ t: 'votes', seq: screen.seq, count: this.voters.size });
  }

  /** Quem entra: o que já tinha feito nesta tela vai de novo (reconexão ou tela nova). */
  private resendOwnState(): void {
    const screen = this.screen;
    if (!screen) return;
    if (screen.name === 'select' && this.localSel) {
      this.broadcast({ t: 'sel', seq: screen.seq, ...this.localSel });
    }
    if (screen.name === 'fight' && this.voted) this.broadcast({ t: 'rematch', seq: screen.seq });
  }

  /** Manda para todos os outros lados (quem entra só tem o host). */
  private broadcast(message: ControlMessage): void {
    for (const peer of this.peers.values()) peer.transport?.sendControl(message);
  }

  private onControl(from: Transport, data: unknown): void {
    if (this.ended) return;
    const message = parseControl(data);
    if (!message) return;
    if (message.t === 'hello') {
      this.onHello(from, message);
      return;
    }
    const peer = this.peerOf(from);
    if (!peer) return;
    peer.lastHeard = this.clock();
    if (this.role === 'host') this.onGuestMessage(peer, message);
    else this.onHostMessage(peer, message);
  }

  /** Quem entra: mensagem do host. */
  private onHostMessage(peer: Peer, message: ControlMessage): void {
    switch (message.t) {
      case 'welcome':
        this.onConnected(peer);
        break;
      case 'refuse':
        this.end(message.reason);
        break;
      case 'roster':
        this.setRoster(message.clients);
        break;
      case 'screen':
        if (message.screen.seq !== this.screen?.seq) {
          this.applyScreen(message.screen);
          this.resendOwnState();
        }
        break;
      case 'sels':
        if (this.screen?.name === 'select' && message.seq === this.screen.seq) {
          this.sels.clear();
          message.sels.forEach((sel, seat) => {
            const client = this.clients[seat];
            if (sel && client !== undefined && client !== this.client) this.sels.set(client, sel);
          });
        }
        break;
      case 'votes':
        if (this.screen?.name === 'fight' && message.seq === this.screen.seq) {
          this.hostVotes = message.count;
        }
        break;
      case 'hash':
        if (this.match && message.seq === this.match.seq) {
          this.reportDesync(this.match.desync.addRemote(0, message.tick, message.hash));
        }
        break;
      case 'bye':
        this.end('host-left');
        break;
      default:
        // o resto só o host recebe
        break;
    }
  }

  /** Host: mensagem de quem entrou. */
  private onGuestMessage(peer: Peer, message: ControlMessage): void {
    const screen = this.screen;
    switch (message.t) {
      case 'sel':
        if (screen?.name === 'select' && message.seq === screen.seq) {
          this.sels.set(peer.client, { cursor: message.cursor, ready: message.ready });
          this.broadcastSels();
        }
        break;
      case 'goto':
        if (screen?.name !== 'select') this.openSelect();
        break;
      case 'rematch':
        if (screen?.name === 'fight' && message.seq === screen.seq) {
          this.voters.add(peer.client);
          this.afterVote();
        }
        break;
      case 'hash': {
        const match = this.match;
        const fighter = match?.clients.indexOf(peer.client) ?? -1;
        if (match && message.seq === match.seq && fighter >= 0) {
          this.reportDesync(match.desync.addRemote(fighter, message.tick, message.hash));
        }
        break;
      }
      case 'bye':
        this.removePlayer(peer.client, 'quit');
        break;
      default:
        // o resto só quem entra recebe
        break;
    }
  }

  /**
   * Host: alguém se apresentou. Reconexão: volta para o mesmo lugar. Versão
   * diferente, sala cheia ou em luta: recusa só essa conexão.
   */
  private onHello(from: Transport, hello: Extract<ControlMessage, { t: 'hello' }>): void {
    if (this.role !== 'host') return;
    if (hello.v !== NET_VERSION || hello.build !== this.build) {
      from.sendControl({ t: 'refuse', reason: 'version' });
      return;
    }
    let peer = this.peers.get(hello.client);
    const joining = !peer;
    if (!peer) {
      const refusal = this.refusal(hello.client);
      if (refusal) {
        from.sendControl({ t: 'refuse', reason: refusal });
        return;
      }
      peer = newPeer(hello.client, 'connecting');
      this.peers.set(hello.client, peer);
      this.clients.push(hello.client);
      this.announce(`P${String(this.clients.length)} entrou na sala.`);
    }
    this.replaceTransport(peer, from);
    from.sendControl({ t: 'welcome' });
    this.onConnected(peer);
    if (joining) {
      // os outros veem o lugar novo (na seleção, com a tabela de seleções do tamanho certo)
      this.broadcast({ t: 'roster', clients: [...this.clients] });
      this.broadcastSels();
    }
  }

  private refusal(client: string): 'full' | 'busy' | null {
    if (client === this.client || this.clients.length >= MAX_ROOM_PLAYERS) return 'full';
    const screen = this.screen?.name;
    return screen === 'stage' || screen === 'fight' ? 'busy' : null;
  }

  /** Quem entra: a lista da sala que o host mandou (avisa quem entrou e quem saiu). */
  private setRoster(clients: readonly string[]): void {
    const old = this.clients;
    if (old.length > 0) {
      old.forEach((client, seat) => {
        if (!clients.includes(client))
          this.announce(`${this.playerLabel(client, seat)} saiu da sala.`);
      });
      clients.forEach((client, seat) => {
        if (!old.includes(client)) this.announce(`P${String(seat + 1)} entrou na sala.`);
      });
    }
    this.clients = [...clients];
  }

  /**
   * Host: alguém saiu de vez (de propósito ou a conexão não voltou). Sai da
   * lista; na luta, o lutador dele fica parado até ela acabar; no mapa, a sala
   * volta para a seleção. Sem mais ninguém, a sala acaba.
   */
  private removePlayer(client: string, reason: 'quit' | 'lost'): void {
    const seat = this.clients.indexOf(client);
    const peer = this.peers.get(client);
    if (seat < 0 || !peer) return;
    const label = this.playerLabel(client, seat);
    this.peers.delete(client);
    peer.transport?.close();
    this.clients.splice(seat, 1);
    this.sels.delete(client);
    this.voters.delete(client);
    const fighter = this.match?.clients.indexOf(client) ?? -1;
    if (fighter >= 0) this.absent.add(fighter);
    this.announce(`${label} ${reason === 'quit' ? 'saiu da sala' : 'caiu e não voltou'}.`);
    if (this.clients.length < 2) {
      this.end(reason === 'quit' ? 'left' : 'lost');
      return;
    }
    this.broadcast({ t: 'roster', clients: [...this.clients] });
    switch (this.screen?.name) {
      case 'select':
        this.broadcastSels();
        break;
      case 'stage':
        // os personagens escolhidos não batem mais com quem está na sala
        this.openSelect();
        break;
      case 'fight':
        // quem saiu não precisa votar na revanche
        this.afterVote();
        break;
      default:
        break;
    }
  }

  private onPacket(peer: Peer, bytes: Uint8Array): void {
    const packet = decodePacket(bytes);
    if (!packet || this.ended) return;
    peer.lastHeard = this.clock();
    switch (packet.type) {
      case 'ping':
        peer.transport?.sendPacket(encodeTimePacket('pong', packet.time));
        break;
      case 'pong':
        peer.ping.add(this.clock() - packet.time);
        break;
      case 'input':
        this.onInputs(peer, packet);
        break;
    }
  }

  private onInputs(peer: Peer, packet: Extract<Packet, { type: 'input' }>): void {
    const match = this.match;
    // pacote atrasado de outra partida não entra nesta
    if (!match || packet.seq !== match.seq) return;
    if (this.role === 'guest') {
      // do host vem o input de todos os outros
      match.lockstep.receive(0, packet, allBut(match, match.local));
      return;
    }
    // host: só o input de quem mandou entra; o que chegou de novo já vai para os outros
    const fighter = match.clients.indexOf(peer.client);
    if (fighter < 0 || match.lockstep.receive(fighter, packet, [fighter]) === 0) return;
    for (const other of this.peers.values()) {
      if (other !== peer) this.sendInputsTo(other, match);
    }
  }

  /**
   * Jogadores cujos inputs vão daqui para o lutador `to`: quem entra só manda o
   * próprio; o host manda o de todos menos o dele.
   */
  private routeTo(match: OnlineMatch, to: number): number[] {
    return this.role === 'guest' ? [match.local] : allBut(match, to);
  }

  private sendInputsTo(peer: Peer, match: OnlineMatch): void {
    const transport = peer.transport;
    if (peer.state !== 'connected' || !transport) return;
    const to = this.role === 'guest' ? 0 : match.clients.indexOf(peer.client);
    if (to < 0) return;
    const batch = match.lockstep.outgoing(to, this.routeTo(match, to));
    transport.sendPacket(encodeInputPacket(match.seq, batch));
  }

  /** Chamado várias vezes por segundo: ping, conexão muda e prazo de reconexão. */
  update(): void {
    if (this.ended) return;
    const now = this.clock();
    for (const peer of this.peers.values()) {
      if (peer.state === 'down') {
        if (now - peer.downSince < RECONNECT_MS) continue;
        // um de cada vez (a sala pode acabar com isso); os outros, na próxima chamada
        if (this.role === 'guest') this.end('lost');
        else this.removePlayer(peer.client, 'lost');
        return;
      }
      const transport = peer.transport;
      if (peer.state !== 'connected' || !transport) continue;
      if (now - peer.lastHeard >= SILENCE_DROP_MS) {
        // muda demais: fecha, e o Link disca de novo
        this.onDown(peer);
        transport.close();
        continue;
      }
      if (now - peer.lastPing >= PING_INTERVAL_MS) {
        peer.lastPing = now;
        transport.sendPacket(encodeTimePacket('ping', now));
      }
    }
  }

  private applyScreen(screen: Screen): void {
    this.screen = screen;
    this.seq = Math.max(this.seq, screen.seq);
    this.sels.clear();
    this.localSel = null;
    this.voted = false;
    this.voters.clear();
    this.hostVotes = 0;
    this.absent.clear();
    this.match = null;
    if (screen.name !== 'fight') return;
    const local = screen.clients.indexOf(this.client);
    if (local < 0) {
      // partida sem este lado: não tem como seguir a sala
      this.end('busy');
      return;
    }
    this.match = {
      ...screen,
      local,
      lockstep: new Lockstep(screen.characters.length, local, screen.delay),
      desync: new DesyncDetector(),
    };
  }

  private setScreen(screen: Screen): void {
    if (this.role !== 'host' || this.ended) return;
    this.applyScreen(screen);
    this.broadcast({ t: 'screen', screen });
  }

  /**
   * Vai para a seleção de personagem. Quem entrou só pede: a tela muda quando o
   * host responder.
   */
  openSelect(): void {
    if (this.role === 'guest') this.broadcast({ t: 'goto', screen: 'select' });
    else this.setScreen({ name: 'select', seq: this.seq + 1 });
  }

  /** Host: abre a seleção de mapa (ou troca o mapa mostrado), com o personagem de cada lugar. */
  openStage(characters: readonly string[], stageId: string): void {
    if (this.role !== 'host') return;
    if (characters.length !== this.clients.length) {
      this.openSelect();
      return;
    }
    this.setScreen({ name: 'stage', seq: this.seq + 1, characters: [...characters], stageId });
  }

  /**
   * Host: começa uma partida com quem está na sala (o personagem de cada lugar),
   * com seed nova e o atraso de input que o pior caminho da sala pede.
   */
  startMatch(characters: readonly string[], stageId: string): void {
    if (this.role !== 'host') return;
    if (characters.length !== this.clients.length) {
      this.openSelect();
      return;
    }
    const path = starPing([...this.peers.values()].map((p) => p.ping));
    this.setScreen({
      name: 'fight',
      seq: this.seq + 1,
      characters: [...characters],
      stageId,
      seed: this.newSeed() >>> 0,
      delay: delayForPing(path.rtt, path.jitter),
      clients: [...this.clients],
    });
  }

  /** Seleção de personagem deste lado (só manda quando muda). */
  setSel(cursor: number, ready: boolean): void {
    const screen = this.screen;
    if (screen?.name !== 'select') return;
    if (this.localSel?.cursor === cursor && this.localSel.ready === ready) return;
    this.localSel = { cursor, ready };
    if (this.role === 'host') this.broadcastSels();
    else this.broadcast({ t: 'sel', seq: screen.seq, cursor, ready });
  }

  private selsMessage(seq: number): ControlMessage {
    const sels = this.clients.map((_, seat) => {
      const sel = this.selection(seat);
      return sel ? { ...sel } : null;
    });
    return { t: 'sels', seq, sels };
  }

  /** Host: a seleção de todos, para todos. */
  private broadcastSels(): void {
    const screen = this.screen;
    if (this.role !== 'host' || screen?.name !== 'select') return;
    this.broadcast(this.selsMessage(screen.seq));
  }

  /** Quero revanche. Com o voto de todos na sala, o host começa outra partida igual. */
  voteRematch(): void {
    const screen = this.screen;
    if (screen?.name !== 'fight' || this.voted) return;
    this.voted = true;
    if (this.role === 'guest') {
      this.broadcast({ t: 'rematch', seq: screen.seq });
      return;
    }
    this.voters.add(this.client);
    this.afterVote();
  }

  /** Host: todos votaram? Revanche. Senão, conta os votos para todos. */
  private afterVote(): void {
    const screen = this.screen;
    if (this.role !== 'host' || screen?.name !== 'fight') return;
    if (this.voters.size > 0 && this.clients.every((c) => this.voters.has(c))) {
      this.startRematch(screen);
      return;
    }
    this.broadcast({ t: 'votes', seq: screen.seq, count: this.voters.size });
  }

  /** Mesma luta de novo, com quem ainda está na sala (cada um com o seu personagem). */
  private startRematch(screen: FightScreen): void {
    const characters: string[] = [];
    for (const client of this.clients) {
      const character = screen.characters[screen.clients.indexOf(client)];
      if (character === undefined) {
        this.openSelect();
        return;
      }
      characters.push(character);
    }
    this.startMatch(characters, screen.stageId);
  }

  /** Manda os inputs que cada lado ainda não confirmou (todo tick). */
  sendInputs(): void {
    const match = this.match;
    if (!match) return;
    // quem saiu fica parado: o host completa a fita dele com input vazio
    for (const fighter of this.absent) match.lockstep.fillAbsent(fighter);
    for (const peer of this.peers.values()) this.sendInputsTo(peer, match);
  }

  /** Hash do estado deste lado depois do tick `tick`: guarda, manda e compara. */
  reportHash(tick: number, hash: number): void {
    const match = this.match;
    if (!match) return;
    this.broadcast({ t: 'hash', seq: match.seq, tick, hash });
    this.reportDesync(match.desync.addLocal(tick, hash));
  }

  private reportDesync(found: Desync | null): void {
    if (!found) return;
    const hex = (n: number): string => n.toString(16).padStart(8, '0');
    const me = (this.match?.local ?? 0) + 1;
    console.error(
      `Online: a luta dessincronizou no tick ${String(found.tick)} ` +
        `(sala ${this.code}: hash do P${String(me)} ${hex(found.local)}, ` +
        `do P${String(found.player + 1)} ${hex(found.remote)}).`,
    );
  }

  /** Sai da sala de propósito (avisa os outros lados). */
  leave(): void {
    if (this.ended) return;
    this.broadcast({ t: 'bye' });
    this.end('quit');
  }

  private end(reason: EndReason): void {
    if (this.ended) return;
    this.ended = reason;
    for (const peer of this.peers.values()) {
      const transport = peer.transport;
      peer.transport = null;
      transport?.close();
    }
    this.link.close();
  }
}
