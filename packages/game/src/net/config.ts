/** Onde fica o servidor de sinalização (sem valor: o gratuito do PeerJS). */
export interface SignalingServer {
  host: string;
  port: number;
  path: string;
  secure: boolean;
}

export interface NetConfig {
  /** Servidor de sinalização próprio (undefined = o gratuito do PeerJS). */
  signaling?: SignalingServer;
  /** STUN (descobre o endereço público) e TURN (relay, para NAT restritivo). */
  iceServers: RTCIceServer[];
}

/** STUN públicos: bastam para a maioria das conexões (fibra, Wi-Fi de casa). */
const STUN_SERVERS: RTCIceServer[] = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
  { urls: 'stun:stun.cloudflare.com:3478' },
];

/**
 * TURN de fallback, para quem está atrás de NAT restritivo (comum em 4G): o
 * tráfego passa por um servidor. Este é o público que já vem no PeerJS (fica
 * longe do Brasil: funciona, mas com ping alto). Um TURN próprio entra pelas
 * variáveis `VITE_TURN_*` (ver "Online" no GDD).
 */
const PEERJS_TURN: RTCIceServer = {
  urls: ['turn:eu-0.turn.peerjs.com:3478', 'turn:us-0.turn.peerjs.com:3478'],
  username: 'peerjs',
  credential: 'peerjsp',
};

/**
 * Configuração do online a partir das variáveis de ambiente do build (Vite):
 *
 * - `VITE_TURN_URLS` (separadas por vírgula), `VITE_TURN_USERNAME` e
 *   `VITE_TURN_CREDENTIAL`: TURN próprio, no lugar do público;
 * - `VITE_PEER_HOST`, `VITE_PEER_PORT`, `VITE_PEER_PATH` e `VITE_PEER_SECURE`:
 *   servidor de sinalização próprio (PeerServer), se o gratuito der problema.
 */
export function netConfig(env: Readonly<Record<string, unknown>>): NetConfig {
  const text = (key: string): string => {
    const value = env[key];
    return typeof value === 'string' ? value.trim() : '';
  };
  const turnUrls = text('VITE_TURN_URLS')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean);
  const turn: RTCIceServer =
    turnUrls.length > 0
      ? {
          urls: turnUrls,
          username: text('VITE_TURN_USERNAME'),
          credential: text('VITE_TURN_CREDENTIAL'),
        }
      : PEERJS_TURN;
  const config: NetConfig = { iceServers: [...STUN_SERVERS, turn] };

  const host = text('VITE_PEER_HOST');
  if (host) {
    const secure = text('VITE_PEER_SECURE') !== 'false';
    const port = Number.parseInt(text('VITE_PEER_PORT'), 10);
    config.signaling = {
      host,
      port: Number.isFinite(port) ? port : secure ? 443 : 80,
      path: text('VITE_PEER_PATH') || '/',
      secure,
    };
  }
  return config;
}
