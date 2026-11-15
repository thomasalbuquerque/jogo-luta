# Servidor do online

Por enquanto só existe o `turn-worker.js`: um Cloudflare Worker que entrega ao jogo credenciais temporárias do TURN da Cloudflare. O TURN é o servidor intermediário (relay) que repassa o tráfego de quem não consegue conexão direta (NAT restritivo, comum em 4G e em alguns provedores).

O jogo pede as credenciais ao Worker ao criar ou entrar numa sala (variável `VITE_TURN_ENDPOINT` no build). Sem o Worker, o online continua funcionando só com conexão direta.

## Publicar o Worker (uma vez)

1. No painel da Cloudflare: **Realtime → TURN Server → Create**. Guarde o **Turn Token ID** e o **API Token**.
2. **Workers & Pages → Create → Worker** (o modelo "Hello World"), com o nome `jogo-luta-turn`, e **Deploy**.
3. **Edit code**: apague o que estiver lá, cole o conteúdo de `turn-worker.js` e clique em **Deploy**.
4. No Worker, **Settings → Variables and Secrets → Add**, os dois do tipo **Secret**:
   - `TURN_KEY_ID`: o Turn Token ID;
   - `TURN_API_TOKEN`: o API Token.
5. Copie o endereço do Worker (`https://jogo-luta-turn.<sua-conta>.workers.dev`).
6. No GitHub, no repositório: **Settings → Secrets and variables → Actions → Variables → New repository variable**, com o nome `TURN_ENDPOINT` e o endereço do Worker como valor. O próximo deploy já usa.

Para testar no `pnpm dev`, crie `packages/game/.env.local` com `VITE_TURN_ENDPOINT=<endereço do Worker>`.

## Se o endereço do jogo mudar

O Worker só responde aos sites da lista `ALLOWED_ORIGINS`, no começo do `turn-worker.js`. Mudou o endereço do jogo, atualize a lista e publique o Worker de novo.
