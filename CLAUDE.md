# CLAUDE.md — Jogo de luta dos amigos

Jogo de luta 2D estilo Brawlhalla, só no navegador. Os 16 integrantes de um grupo de amigos são os personagens jogáveis. Não é comercial: distribuído por link.

O plano completo, com etapas e tarefas, está em `docs/ROADMAP.md`. Leia o roadmap antes de começar qualquer tarefa.

## Stack

- TypeScript (strict) + Vite + Phaser 3
- pnpm workspaces (monorepo)
- Vitest para testes
- ESLint + Prettier
- Online (a partir da Etapa 8): WebRTC via PeerJS; servidor Node só se precisar (sinalização ou relay)
- Ambiente de desenvolvimento: Windows, PowerShell, Node LTS, pnpm

## Estrutura

```
packages/
  sim/      lógica pura do jogo: física, combate, estados, personagens. SEM Phaser, SEM DOM.
  game/     Phaser: renderização, input, áudio, menus, HUD. Lê o estado do sim e desenha.
            src/rig: esqueleto único e animações (dados); public/assets: atlas gerados pelo pnpm art
            src/audio: sons, música e vozes provisórias gerados em código; src/render: efeitos (game feel)
            src/net: online de 2 a 4 (sala por código, estrela no host, lockstep por atraso, PeerJS/WebRTC); ver "Online" no GDD
  server/   (Etapa 8+) sinalização do online, se precisar; relay só na Etapa 12 (opcional).
art/        PNGs gerados por IA + recortes.json (onde está cada peça e as juntas)
audio/      áudios gravados (vozes dos amigos, música, efeitos): entram sozinhos no jogo (LEIAME.md)
scripts/art pipeline de arte (tira o fundo, recorta, gera os atlas)
docs/
  ROADMAP.md
  GDD.md    regras do jogo, controles, moveset base, formato da ficha de personagem
  ELENCO.md os 16 amigos: traços, bordão, especial, provocação, cores
  ARTE.md   guia de estilo visual (travado), prompts de imagem e o caminho do PNG até o jogo
```

## Regras de arquitetura (não quebrar)

1. **`sim` é independente.** Nunca importa Phaser, `window`, `document` ou qualquer API do navegador. Precisa rodar em Node e em teste.
2. **Passo fixo.** A simulação avança em ticks de 60/s com acumulador; a renderização interpola. Nunca use `delta` do Phaser dentro da lógica.
3. **Física própria.** Colisão por AABB no `sim`. Não usar Arcade/Matter do Phaser.
4. **Input como dado.** Cada jogador gera uma bitmask de botões por tick. O `sim` só conhece essas bitmasks.
5. **Determinismo** (obrigatório a partir da Etapa 7; prefira desde já):
   - nada de `Math.random` no `sim` → RNG com seed, guardado no estado;
   - nada de `Date.now`/`performance.now` no `sim`;
   - evitar `Math.sin`/`cos`/`pow`/`sqrt` na lógica → tabelas ou inteiros (ponto fixo);
   - estado do jogo serializável e clonável (snapshot/restore).
6. **Personagem é dado.** Cada personagem é uma ficha validada com zod (stats, ajustes no moveset base, especial, provocação, ids de animação). O especial é montado com blocos reutilizáveis do `sim` (projétil, investida, área, contra-ataque, buff, teleporte, agarrão). Só crie bloco novo quando nenhum existente servir.
7. **Moveset base compartilhado.** Todos têm os mesmos golpes base; cada personagem só muda números, visual, 1 especial e a provocação.

## Fluxo de trabalho

- Trabalhe **uma etapa do roadmap por vez**, ou uma tarefa quando for pedido. Não avance para a próxima etapa sem o usuário pedir.
- Antes de codar uma etapa, apresente em poucas linhas o plano (arquivos e ordem) e siga.
- Ao concluir cada tarefa, marque o checkbox correspondente em `docs/ROADMAP.md` (`- [x]`) no mesmo commit.
- Ao terminar uma etapa, confira o critério "Pronto quando" e diga ao usuário como testar (comando e o que observar).
- Teste no navegador o que for visual (servidor do Vite + navegador) e confira o console sem erros.
- Mantenha `docs/GDD.md` atualizado quando uma regra do jogo mudar.

## Commits e GitHub

- **Commits pequenos e frequentes:** um commit a cada mudança que funciona sozinha (uma config, um sistema, um teste, um ajuste). Nunca acumule uma tarefa inteira num commit só.
- **Conventional Commits:** `feat:`, `fix:`, `test:`, `chore:`, `docs:`, `refactor:`, `style:`, `perf:`. Mensagens em inglês, no imperativo, curtas (ex.: `feat(sim): add fixed-step loop with accumulator`).
- Rode `pnpm test` e `pnpm lint` antes de cada commit; não commite com teste quebrado.
- Branch por tarefa ou etapa (`feat/etapa-1-movimento`), merge na `main` ao concluir, e **push ao final de cada sessão**. Só commits na `main` contam no gráfico do GitHub.
- **Não adicione linhas `Co-Authored-By`, `Claude-Session` nem qualquer menção ao Claude nas mensagens de commit ou nas descrições de PR.** O autor é só o usuário.
- Nunca use `git push --force` na `main` nem reescreva histórico já enviado.

## Comandos

```
pnpm install          instalar dependências
pnpm dev              rodar o jogo (Vite, http://localhost:5173)
pnpm test             testes (Vitest, todos os pacotes)
pnpm lint             ESLint + checagem do Prettier
pnpm format           formatar com Prettier
pnpm typecheck        tsc em todos os pacotes
pnpm build            build de produção (packages/game/dist)
pnpm art [pasta]      recorta a arte de art/ e gera os atlas (--debug <pasta> mostra as juntas)
```

Visualizador de animações (só em dev): `http://localhost:5173/?rig`.

Atraso de input para testar o netcode sem rede: `http://localhost:5173/?atraso=3` (ou 1/2 e 3/4 com o debug ligado). Replays, snapshot e hash do estado: ver "Determinismo e replays" no `docs/GDD.md`.

Online: "Jogar online" no menu, ou `http://localhost:5173/?sala=ABCD` para entrar direto numa sala (duas abas no mesmo PC servem para testar). Ver "Online" no `docs/GDD.md`.

Deploy: todo push na `main` roda `.github/workflows/deploy.yml` (lint, testes, build) e publica no GitHub Pages: https://thomasalbuquerque.github.io/jogo-luta/
