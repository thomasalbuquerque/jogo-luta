import { describe, expect, it, vi } from 'vitest';
import { loadNetConfig, netConfig, parseIceServers } from './config';

describe('netConfig', () => {
  it('sem variáveis: sinalização gratuita e só STUN público', () => {
    const config = netConfig({});
    expect(config.signaling).toBeUndefined();
    const urls = config.iceServers.flatMap((s) => s.urls);
    expect(urls.length).toBeGreaterThan(0);
    expect(urls.every((u) => u.startsWith('stun:'))).toBe(true);
  });

  it('TURN com usuário e senha fixos entra depois dos STUN', () => {
    const config = netConfig({
      VITE_TURN_URLS: 'turn:turn.exemplo.dev:3478, turns:turn.exemplo.dev:5349',
      VITE_TURN_USERNAME: 'fulano',
      VITE_TURN_CREDENTIAL: 'segredo',
    });
    const turn = config.iceServers.at(-1);
    expect(turn).toEqual({
      urls: ['turn:turn.exemplo.dev:3478', 'turns:turn.exemplo.dev:5349'],
      username: 'fulano',
      credential: 'segredo',
    });
  });

  it('servidor de sinalização próprio', () => {
    expect(netConfig({ VITE_PEER_HOST: 'sinal.exemplo.dev' }).signaling).toEqual({
      host: 'sinal.exemplo.dev',
      port: 443,
      path: '/',
      secure: true,
    });
    expect(
      netConfig({
        VITE_PEER_HOST: 'localhost',
        VITE_PEER_PORT: '9000',
        VITE_PEER_PATH: '/jogo',
        VITE_PEER_SECURE: 'false',
      }).signaling,
    ).toEqual({ host: 'localhost', port: 9000, path: '/jogo', secure: false });
  });

  it('ignora valor que não é texto', () => {
    expect(netConfig({ VITE_PEER_HOST: 123, VITE_TURN_URLS: true }).signaling).toBeUndefined();
  });
});

const CLOUDFLARE_REPLY = {
  iceServers: [
    { urls: ['stun:stun.cloudflare.com:3478'] },
    {
      urls: ['turn:turn.cloudflare.com:3478?transport=udp', 'turns:turn.cloudflare.com:443'],
      username: 'temporario',
      credential: 'segredo',
    },
  ],
};

describe('parseIceServers', () => {
  it('aceita a lista da Cloudflare', () => {
    expect(parseIceServers(CLOUDFLARE_REPLY)).toEqual(CLOUDFLARE_REPLY.iceServers);
  });

  it('aceita um servidor só, fora de lista', () => {
    expect(parseIceServers({ iceServers: { urls: 'turn:a.dev:3478', username: 'u' } })).toEqual([
      { urls: ['turn:a.dev:3478'], username: 'u' },
    ]);
  });

  it('descarta o que não tem formato de servidor', () => {
    expect(parseIceServers(null)).toEqual([]);
    expect(parseIceServers('turn:a.dev')).toEqual([]);
    expect(
      parseIceServers({ iceServers: [null, 3, { urls: [] }, { urls: 'http://a.dev' }] }),
    ).toEqual([]);
    expect(
      parseIceServers({ iceServers: [{ urls: ['turn:a.dev:3478', 7], credential: 9 }] }),
    ).toEqual([{ urls: ['turn:a.dev:3478'] }]);
  });
});

describe('loadNetConfig', () => {
  const reply = (body: unknown, status = 200) =>
    vi.fn<typeof fetch>(() => Promise.resolve(new Response(JSON.stringify(body), { status })));

  it('sem endpoint: não busca nada', async () => {
    const fetchFn = reply(CLOUDFLARE_REPLY);
    expect(await loadNetConfig({}, fetchFn)).toEqual(netConfig({}));
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('com endpoint: junta as credenciais temporárias aos STUN', async () => {
    const fetchFn = reply(CLOUDFLARE_REPLY);
    const env = { VITE_TURN_ENDPOINT: ' https://turn.exemplo.dev ' };
    const config = await loadNetConfig(env, fetchFn);
    expect(fetchFn).toHaveBeenCalledWith('https://turn.exemplo.dev', expect.anything());
    expect(config.iceServers).toEqual([
      ...netConfig({}).iceServers,
      ...CLOUDFLARE_REPLY.iceServers,
    ]);
  });

  it('endpoint com erro ou fora do ar: segue só com conexão direta', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const env = { VITE_TURN_ENDPOINT: 'https://turn.exemplo.dev' };
    expect(await loadNetConfig(env, reply('erro', 502))).toEqual(netConfig({}));
    const offline: typeof fetch = () => Promise.reject(new TypeError('Failed to fetch'));
    expect(await loadNetConfig(env, offline)).toEqual(netConfig({}));
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });
});
