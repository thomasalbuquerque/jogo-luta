import { describe, expect, it } from 'vitest';
import { netConfig } from './config';

describe('netConfig', () => {
  it('sem variáveis: sinalização gratuita, STUN público e o TURN do PeerJS', () => {
    const config = netConfig({});
    expect(config.signaling).toBeUndefined();
    const urls = config.iceServers.flatMap((s) => s.urls);
    expect(urls.some((u) => u.startsWith('stun:'))).toBe(true);
    expect(urls.some((u) => u.startsWith('turn:'))).toBe(true);
  });

  it('TURN próprio entra no lugar do público', () => {
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
    expect(config.iceServers.flatMap((s) => s.urls).join()).not.toContain('peerjs.com');
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
