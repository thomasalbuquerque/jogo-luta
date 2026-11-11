import type { ControlMessage } from './protocol';

/** Por onde o tráfego está passando: direto entre os dois, ou por um servidor (TURN). */
export type Route = 'direct' | 'relay';

/**
 * Uma conexão aberta com o outro jogador, com dois canais: o confiável (chega
 * tudo, em ordem: lobby e controle) e o sem garantia (pode perder e trocar a
 * ordem, como UDP: inputs e ping).
 */
export interface Transport {
  sendControl(message: ControlMessage): void;
  sendPacket(bytes: Uint8Array<ArrayBuffer>): void;
  /** O que chegou pelo canal confiável (ainda sem conferir o formato). */
  onControl: ((data: unknown) => void) | null;
  onPacket: ((bytes: Uint8Array) => void) | null;
  /** A conexão caiu (ou foi fechada pelo outro lado). Não dispara no `close()` local. */
  onClose: (() => void) | null;
  /** Direto ou por relay (null = ainda não se sabe). */
  readonly route: Route | null;
  /** Fecha deste lado. O que já foi mandado pelo canal confiável ainda é entregue. */
  close(): void;
}

/** Por que a sala acabou. */
export type EndReason =
  /** Saí da sala. */
  | 'quit'
  /** O outro jogador saiu. */
  | 'left'
  /** A conexão caiu e não voltou. */
  | 'lost'
  /** Não existe sala com esse código. */
  | 'not-found'
  /** A sala já tem 2 jogadores. */
  | 'full'
  /** Os dois lados estão com versões diferentes do jogo. */
  | 'version'
  /** O código sorteado já está em uso (o host sorteia outro). */
  | 'taken'
  /** Não deu para falar com o servidor de sinalização. */
  | 'error';

/**
 * Quem cria as conexões: registra a sala (host) ou disca para ela (quem entra),
 * e disca de novo quando a conexão cai.
 */
export interface Link {
  /** Sala registrada no servidor de sinalização (host) ou servidor alcançado (quem entra). */
  onReady: (() => void) | null;
  /** Conexão nova aberta (a 1ª ou uma reconexão). */
  onTransport: ((transport: Transport) => void) | null;
  /** Não tem como continuar. */
  onFail: ((reason: EndReason) => void) | null;
  close(): void;
}

/** Aviso na tela para cada fim de sala ('' = não precisa avisar). */
export function endMessage(reason: EndReason): string {
  switch (reason) {
    case 'left':
      return 'O outro jogador saiu da sala.';
    case 'lost':
      return 'A conexão caiu e não voltou.';
    case 'not-found':
      return 'Sala não encontrada. Confira o código com quem criou.';
    case 'full':
      return 'Essa sala já está cheia.';
    case 'version':
      return 'Versões diferentes do jogo: os dois precisam recarregar a página (Ctrl+F5).';
    case 'error':
      return 'Não deu para conectar. Confira a internet e tente de novo.';
    case 'quit':
    case 'taken':
      return '';
  }
}
