/**
 * Cloudflare Worker que entrega ao jogo credenciais temporárias do TURN da
 * Cloudflare (o relay para quem está atrás de NAT restritivo).
 *
 * O jogo é um site estático e não tem onde guardar segredo; o token do TURN
 * fica aqui, nos segredos do Worker, e o jogo só recebe uma credencial que
 * vence sozinha. Como publicar: ver LEIAME.md nesta pasta.
 *
 * Segredos do Worker (Settings → Variables and Secrets):
 * - TURN_KEY_ID: o "Turn Token ID" da chave de TURN;
 * - TURN_API_TOKEN: o "API Token" da mesma chave.
 */

/** Sites que podem pedir credenciais (o jogo publicado e o `pnpm dev`). */
const ALLOWED_ORIGINS = ['https://thomasalbuquerque.github.io', 'http://localhost:5173'];

/** Validade de cada credencial: bem mais que a sessão de jogo mais longa. */
const TTL_SECONDS = 86400;

/** A porta 53 é bloqueada pelos navegadores: só faria a conexão demorar. */
function withoutPort53(server) {
  const urls = [server.urls].flat().filter((url) => !/:53(\?|$)/.test(url));
  return { ...server, urls };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') ?? '';
    if (!ALLOWED_ORIGINS.includes(origin)) return new Response('Forbidden', { status: 403 });
    const cors = { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' };

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: { ...cors, 'Access-Control-Allow-Methods': 'GET' },
      });
    }
    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405, headers: cors });
    }

    const response = await fetch(
      `https://rtc.live.cloudflare.com/v1/turn/keys/${env.TURN_KEY_ID}/credentials/generate-ice-servers`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.TURN_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ttl: TTL_SECONDS }),
      },
    );
    if (!response.ok) return new Response('TURN unavailable', { status: 502, headers: cors });

    const { iceServers } = await response.json();
    const servers = [iceServers].flat().map(withoutPort53);
    return Response.json(
      { iceServers: servers },
      { headers: { ...cors, 'Cache-Control': 'no-store' } },
    );
  },
};
