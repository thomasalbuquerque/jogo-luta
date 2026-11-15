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

/**
 * STUN públicos: bastam para a maioria das conexões (fibra, Wi-Fi de casa). Quem
 * está atrás de NAT restritivo (comum em 4G) precisa de TURN, um servidor que
 * repassa o tráfego: ele entra pelas variáveis `VITE_TURN_*` (ver "Online" no GDD).
 */
const STUN_SERVERS: RTCIceServer[] = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
  { urls: 'stun:stun.cloudflare.com:3478' },
];

/**
 * Configuração do online a partir das variáveis de ambiente do build (Vite):
 *
 * - `VITE_TURN_URLS` (separadas por vírgula), `VITE_TURN_USERNAME` e
 *   `VITE_TURN_CREDENTIAL`: TURN com usuário e senha fixos;
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
  const config: NetConfig = { iceServers: [...STUN_SERVERS] };
  if (turnUrls.length > 0) {
    config.iceServers.push({
      urls: turnUrls,
      username: text('VITE_TURN_USERNAME'),
      credential: text('VITE_TURN_CREDENTIAL'),
    });
  }

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

/** Tempo máximo esperando as credenciais do TURN antes de seguir sem elas. */
const TURN_FETCH_TIMEOUT_MS = 4000;
/** Mais servidores que isto só atrasam a conexão. */
const MAX_FETCHED_SERVERS = 4;

function isIceUrl(url: unknown): url is string {
  return typeof url === 'string' && /^(stun|turns?):\S+$/.test(url);
}

/**
 * Lê a resposta do endpoint de credenciais (`{ iceServers }`, um servidor ou uma
 * lista) e devolve só o que tem formato válido.
 */
export function parseIceServers(data: unknown): RTCIceServer[] {
  if (typeof data !== 'object' || data === null) return [];
  const raw = (data as { iceServers?: unknown }).iceServers;
  const entries: unknown[] = Array.isArray(raw) ? raw : [raw];
  const servers: RTCIceServer[] = [];
  for (const entry of entries) {
    if (typeof entry !== 'object' || entry === null) continue;
    const { urls, username, credential } = entry as Record<string, unknown>;
    const list = (Array.isArray(urls) ? (urls as unknown[]) : [urls]).filter(isIceUrl);
    if (list.length === 0) continue;
    const server: RTCIceServer = { urls: list };
    if (typeof username === 'string') server.username = username;
    if (typeof credential === 'string') server.credential = credential;
    servers.push(server);
  }
  return servers.slice(0, MAX_FETCHED_SERVERS);
}

/**
 * A configuração do online, com as credenciais temporárias do TURN quando o
 * build aponta um endpoint para elas (`VITE_TURN_ENDPOINT`: o Worker de
 * `packages/server`). Se o endpoint falhar ou demorar, segue sem TURN: a
 * conexão direta continua funcionando para a maioria.
 */
export async function loadNetConfig(
  env: Readonly<Record<string, unknown>>,
  fetchFn: typeof fetch = fetch,
): Promise<NetConfig> {
  const config = netConfig(env);
  const endpoint = env.VITE_TURN_ENDPOINT;
  if (typeof endpoint !== 'string' || endpoint.trim() === '') return config;
  try {
    const response = await fetchFn(endpoint.trim(), {
      signal: AbortSignal.timeout(TURN_FETCH_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`HTTP ${String(response.status)}`);
    config.iceServers.push(...parseIceServers(await response.json()));
  } catch (error) {
    console.warn('Online: sem credenciais do TURN; só conexão direta.', error);
  }
  return config;
}
