/**
 * Chama `beat` a cada `ms`, mesmo com a aba escondida ou a janela coberta.
 *
 * Com a página em segundo plano o navegador para o `requestAnimationFrame` e
 * freia os timers dela para 1 por segundo, mas não os de um Web Worker: o timer
 * roda num worker, que só avisa a página. Sem worker (navegador antigo ou
 * bloqueado), cai no `setInterval` comum.
 *
 * Devolve a função que para as batidas.
 */
export function startHeartbeat(ms: number, beat: () => void): () => void {
  try {
    const source = `setInterval(() => postMessage(0), ${String(ms)});`;
    const url = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
    const worker = new Worker(url);
    worker.onmessage = beat;
    return () => {
      worker.terminate();
      URL.revokeObjectURL(url);
    };
  } catch {
    const timer = window.setInterval(beat, ms);
    return () => {
      window.clearInterval(timer);
    };
  }
}
