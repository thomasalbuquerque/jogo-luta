# Roadmap — Jogo de luta dos amigos

## Visão geral

O jogo fica completo e divertido no modo local, com 2 personagens, antes de qualquer linha de rede. Depois vêm o online e o restante do elenco. É um jogo de luta 2D estilo Brawlhalla, só no navegador, distribuído por link para o grupo.

- **Stack:** Phaser + TypeScript + Vite no front. WebRTC (PeerJS) ou um servidor Node pequeno para o online. Deploy estático em Vercel ou Cloudflare Pages.
- **Local antes de online:** se a luta não for divertida no mesmo teclado, rede não salva.
- **Retângulos antes de arte:** física e combate são validados com formas coloridas. A arte entra só quando o jogo já é bom.
- **Moveset base compartilhado:** todos usam os mesmos golpes leves e aéreos. Cada amigo ganha visual próprio, 1 especial e uma provocação.
- **Personagem é dado, não código:** cada personagem é uma ficha de configuração. Balancear é editar números.
- **Lógica separada da renderização:** a simulação roda num pacote próprio (`sim`), em passo fixo de 60 ticks/s, sem física do Phaser. É isso que viabiliza o online por atraso e deixa o rollback possível, se um dia precisar.

### Fases

Cada fase só começa quando o marco da anterior foi atingido.

| Fase                | Etapas                                                        | Marco para passar                              |
| ------------------- | ------------------------------------------------------------- | ---------------------------------------------- |
| 1. Núcleo local     | 0 Fundação · 1 Movimento · 2 Combate base · 3 Personagens (2) | A luta de retângulos já é divertida            |
| 2. Arte e polimento | 4 Arte com IA · 5 Game feel e áudio · 6 Menus e HUD           | **Jogo local completo, link enviado ao grupo** |
| 3. Online           | 7 Determinismo · 8 Online 1x1 · 9 Online 2x2                  | 10 partidas online sem dessincronizar          |
| 4. Conteúdo         | 10 Elenco completo · 11 Balanceamento e deploy                | 16 jogáveis e o grupo joga sem explicação      |
| 5. Opcional         | 12 Online avançado (rollback, relay)                          | Só se o online por atraso incomodar ou falhar  |

## Regra de commits (vale para todas as etapas)

Cada tarefa vira vários commits pequenos, e todo dia de trabalho termina com push. Detalhes em `CLAUDE.md`.

- [ ] Regras de commit no `CLAUDE.md` (commits pequenos, Conventional Commits, testes antes de commitar, push ao fim da sessão, sem `Co-Authored-By`).
- [ ] E-mail do `git config` verificado no GitHub (o gráfico só conta commits com e-mail verificado).
- [ ] Branches por tarefa com merge na `main` (o gráfico só conta commits na branch padrão de um repositório que não é fork).
- [ ] Repositório público, ou "Private contributions" ativado no perfil do GitHub.
- [ ] Coautoria do Claude desligada: em `C:\Users\Felipe\.claude\settings.json`, `"attribution": { "commit": "", "pr": "" }`.

## Etapa 0 — Fundação

Objetivo: projeto configurado, regras do jogo escritas e um link público funcionando.

- [x] Monorepo com pnpm workspaces: `packages/sim` (lógica pura, sem Phaser), `packages/game` (Phaser, render, input, áudio) e, mais tarde, `packages/server`.
- [x] Vite + TypeScript strict + ESLint/Prettier + Vitest.
- [x] `docs/GDD.md` de 1 página: regras da partida (3 stocks, tempo limite), controles, lista do moveset base e formato da ficha de personagem.
- [ ] Planilha dos 16 amigos: apelido, traço mais caricato, bordão, ideia de especial, ideia de provocação, cores.
- [x] Escolher os 2 primeiros personagens: os dois mais caricatos e com especiais bem diferentes entre si.
- [ ] Combinar com o grupo o uso da imagem de cada um no jogo.
- [x] Deploy contínuo desde o dia 1, para mandar link a cada etapa.

**Pronto quando:** uma cena vazia do Phaser abre num link público.

## Etapa 1 — Movimento com retângulos

Objetivo: dois retângulos se movendo pelo mapa com sensação boa de controle.

- [x] Loop de simulação em passo fixo (60 ticks/s) com acumulador, separado do loop de renderização do Phaser.
- [x] Camada de input: teclado e gamepad (Gamepad API) viram uma bitmask de botões por tick. Dois jogadores no mesmo teclado.
- [x] Física própria com caixas (AABB): gravidade, velocidade, colisão com chão e paredes.
- [x] Mapa de teste: plataforma principal + 2 plataformas atravessáveis (descer com ↓).
- [x] Movimentos: andar, pulo, pulo duplo, wall jump, dodge/dash, fast fall.
- [x] Câmera que enquadra os dois jogadores com zoom dinâmico.
- [x] Overlay de debug: FPS, tick atual, estado e velocidade de cada jogador.

**Pronto quando:** só ficar pulando pelo mapa já é gostoso.

## Etapa 2 — Combate base

Objetivo: uma luta 1x1 de retângulos com começo, meio e fim.

- [x] Máquina de estados do lutador: idle, run, jump, fall, attack, hitstun, dodge, ledge, KO.
- [x] Ataques definidos por frames: startup, active e recovery, com hitboxes por frame.
- [x] Hurtbox por lutador e detecção hitbox × hurtbox.
- [x] Dano em % e knockback que cresce com o %: força base + (dano acumulado × escala), dividido pelo peso.
- [x] Hitstun e hitstop (congelamento curto no impacto).
- [x] Blast zones: saiu da tela = KO. Stocks e respawn com invencibilidade.
- [x] Moveset base: 3 leves no chão (neutro, lado, baixo), 3 aéreos (neutro, lado, baixo), golpe de recuperação para cima e ground pound. O botão Especial fica reservado para o especial de cada personagem (e o ground pound).
- [x] Visualizador de hitbox e hurtbox no modo debug.
- [x] Testes unitários do `sim`: knockback, KO, troca de estados.

**Pronto quando:** depois de uma luta, dá vontade de jogar outra.

## Etapa 3 — Personagens como dados (os 2 primeiros)

Objetivo: trocar ou criar um personagem é editar um arquivo, não escrever código.

- [x] Schema da ficha de personagem (tipo TS + validação com zod): peso, velocidade, altura do pulo, ajustes nos golpes base, especial, provocação e ids de animação.
- [x] Biblioteca de blocos de especial reutilizáveis: projétil, investida, ataque em área, contra-ataque, buff temporário, teleporte, agarrão. Um especial = combinação de blocos + números.
- [x] Provocação: animação + áudio, sem efeito de jogo (ou um efeito cômico pequeno).
- [x] Schummaki e João Frango completos em retângulo: stats, especial e provocação.
- [x] Seletor mínimo com 2 opções no modo local.

**Pronto quando:** os dois personagens parecem diferentes de jogar, mesmo ainda sendo retângulos.

## Etapa 4 — Pipeline de arte com IA

Objetivo: os 2 primeiros personagens animados e reconhecíveis. Esta etapa define o processo que será repetido 14 vezes depois.

- [x] Guia de estilo único: proporção caricata (cabeça grande ajuda a reconhecer os amigos), tipo de contorno, paleta e iluminação. Um prompt base fixo para todos os personagens.
- [x] Concept art de cada um: frente, perfil e 3 expressões, a partir da descrição e de fotos.
- [x] Gerar o personagem em partes separadas, em pose neutra e fundo transparente: cabeça, tronco, braços (2 partes), mãos, pernas (2 partes), pés. O `pnpm art` tira o fundo magenta, recorta as peças pelo `art/<pasta>/recortes.json` e gera um atlas por personagem.
- [x] Montar um esqueleto humanoide único. Em vez do DragonBones/Spine, um esqueleto próprio em TypeScript (`packages/game/src/rig`): mesmos ossos para todos, cada amigo só troca as peças (skins).
- [x] Animar o esqueleto base: idle, run, jump, fall, os 8 golpes base, hit, dodge, ledge e KO (arremessado girando, com a cabeça de KO).
- [x] Animar o especial e a provocação de cada um dos 2 personagens.
- [x] Exportar para o Phaser. O esqueleto roda direto no Phaser (atlas + imagens por osso), sem spritesheet.
- [x] Alinhar os frames ativos das hitboxes (Etapa 2) com os frames visuais de cada golpe. Os golpes são animados nas fases do sim (startup, active, recovery): o quadro do impacto cai sempre no 1º frame ativo, com teste.
- [x] Cenário do primeiro mapa: fundo em camadas com parallax.

**Pronto quando:** alguém do grupo acerta quem é quem só de olhar.

## Etapa 5 — Game feel e áudio

Objetivo: um golpe forte tem que doer de ver e de ouvir.

- [x] Screen shake proporcional ao knockback, flash branco no personagem atingido, partículas de impacto.
- [x] Rastro visual nos golpes fortes e efeito de KO na borda da tela.
- [x] Zoom e câmera lenta curta no golpe que decide a partida.
- [x] Efeitos sonoros: golpes, pulo, dodge, KO, respawn.
- [ ] Voz de cada amigo na provocação e no KO. Áudios gravados pelos próprios amigos no WhatsApp funcionam melhor que IA. O jogo já toca o que estiver em `audio/vozes/` (com voz provisória sintetizada enquanto não há): falta gravar (ver `audio/LEIAME.md`).
- [x] Música de menu e de luta.
- [x] Liberar o áudio no primeiro clique (os navegadores bloqueiam autoplay).

**Pronto quando:** quem assiste reage aos golpes.

## Etapa 6 — Menus, seleção e HUD

Objetivo: o jogo local fica completo de ponta a ponta. **Este é o marco principal: mandar o link pro grupo.**

- [x] Fluxo: tela inicial → modo (local / online) → seleção de personagem → seleção de mapa → luta → resultado → revanche.
- [x] Tela de seleção com grade de 7 retratos. Quem ainda não existe aparece como silhueta com "em breve". O total é 16, mas por enquanto manter só 7 retratos (incluindo os dois personagens iniciais), para não dar expectativa para o grupo que vai ter 16 personagens. Estou pensando se realmente vai ter tudo isso, porque são muitos. Futuramente a silhueta com "em breve" pode ir aumentando gradualmente.
- [x] HUD: retrato, % de dano com cor que esquenta conforme sobe, stocks restantes.
- [x] Contagem "3, 2, 1, LUTA", pausa e tela de resultado.
- [x] Remapear controles e salvar no localStorage.

**Pronto quando:** dois amigos jogam no mesmo PC sem você explicar nada.

## Etapa 7 — Preparar para rede

Objetivo: a mesma sequência de inputs sempre produz exatamente a mesma luta. Sem isso, o online dessincroniza.

- [x] Determinismo do `sim`: nada de `Math.random` (usar RNG com seed), nada de tempo real, nada de `Math.sin`/`cos`/`pow` na lógica, porque podem variar entre navegadores. Usar tabela de valores ou inteiros (ponto fixo).
- [x] Estado do jogo serializável e barato de clonar (snapshot e restore). Base dos replays, da checagem de dessincronização e do rollback, se ele vier (Etapa 12).
- [x] Teste automatizado: rodar 10 mil ticks com inputs aleatórios (mesma seed) duas vezes e comparar o hash do estado.
- [x] Replays: gravar seed + lista de inputs e reproduzir. De brinde, dá para compartilhar lances no grupo.
- [x] Simular latência localmente, atrasando os inputs de um jogador em N frames, para sentir o netcode antes de ter rede.

**Pronto quando:** um replay gravado reproduz a luta idêntica, frame a frame.

## Etapa 8 — Online 1x1

Objetivo: dois amigos em casas diferentes jogando sem lag perceptível. Modelo: host é um dos jogadores, conexão P2P por WebRTC.

- [x] Sala por código: o host cria a sala e recebe um código de 4 letras para mandar no grupo; o amigo entra com o código.
- [x] Conexão WebRTC DataChannel sem ordenação e sem retransmissão (comportamento parecido com UDP), via PeerJS. O PeerJS só cria canal confiável (fica para o lobby); o canal dos inputs é criado direto na mesma conexão.
- [x] Sinalização: o servidor gratuito do PeerJS para começar; um servidor próprio em Node se ele der problema (aí é só apontar as variáveis `VITE_PEER_*` para ele; `packages/server` ainda não precisou existir).
- [x] STUN público + TURN de fallback para quem estiver atrás de NAT restritivo (comum em 4G). O TURN é o público do PeerJS (longe do Brasil: ping alto); um TURN próprio entra pelas variáveis `VITE_TURN_*`.
- [x] Netcode por atraso: cada lado espera o input do outro com 2 a 3 frames de atraso. Com todos em São Paulo e na fibra, o ping deve ficar baixo o bastante para isso não ser perceptível. O rollback ficou para a Etapa 12, opcional.
- [x] Detecção de dessincronização: trocar o hash do estado a cada N ticks e registrar quando divergir.
- [x] Desconexão, reconexão e indicador de ping.

**Pronto quando:** 10 partidas seguidas entre casas diferentes sem dessincronizar.

## Etapa 9 — 2x2

Objetivo: lutas em dupla, locais e online.

- [x] Generalizar sala e netcode para 4 jogadores: o host recebe os inputs de todos e repassa (estrela, não malha completa). Se a conexão P2P com 4 ficar instável, o relay está na Etapa 12.
- [x] Times: cores por time, fogo amigo liga/desliga, HUD agrupado por time.
- [x] Câmera e mapa ajustados para 4 lutadores.
- [x] 2x2 local com 4 gamepads no mesmo PC.

**Pronto quando:** uma partida 2x2 online termina sem travar.

## Etapa 10 — Elenco completo

Objetivo: os 14 personagens restantes, em lotes de 3 ou 4, usando o pipeline da Etapa 4.

- [ ] Lote 1 (3–4 personagens)
- [ ] Lote 2 (3–4 personagens)
- [ ] Lote 3 (3–4 personagens)
- [ ] Lote 4 (restantes)
- [ ] 1 ou 2 mapas novos com tema de piadas internas do grupo.

Checklist de cada personagem:

1. Ficha: stats, 1 especial montado com blocos existentes, provocação.
2. Concept art aprovado pelo próprio amigo.
3. As 5 imagens geradas pela seção "Personagem novo" do `docs/ARTE.md` (uma folha de peças só, `3-pecas.png`) e encaixadas como skin no esqueleto base.
4. Animações do especial e da provocação.
5. Áudio: bordão, provocação e KO.
6. Retrato para a tela de seleção e para o HUD.
7. Teste: 5 lutas contra personagens diferentes.

Só crie um bloco de especial novo quando a ideia do amigo realmente pedir.

**Pronto quando:** 16 personagens jogáveis na tela de seleção.

## Etapa 11 — Balanceamento, polimento e deploy final

Objetivo: nenhum personagem domina, e o jogo roda bem em qualquer PC do grupo.

- [ ] Estatísticas por partida (personagem, vitória, golpe que causou cada KO) salvas num backend leve: NestJS + Postgres ou Supabase.
- [ ] Ajustar os números nas fichas a partir dos dados e do feedback.
- [ ] Testar em Chrome, Firefox, Edge e Safari, inclusive num notebook fraco.
- [ ] Otimizar carregamento: texture atlas, imagens em WebP, carregar só os personagens escolhidos.
- [ ] Página inicial com controles e "como jogar"; domínio próprio é opcional.
- [ ] Extras opcionais: ranking/ELO do grupo, modo treino, replays compartilháveis por link.

**Pronto quando:** o grupo marca partidas sozinho, sem você organizar.

## Etapa 12 — Online avançado (opcional)

Objetivo: resolver problemas do online que de fato apareceram. Só entra se o online por atraso das Etapas 8 e 9 incomodar ou falhar; cada item é independente e pode nunca ser feito.

- [ ] Rollback (se o atraso de input incomodar): prever o input remoto e, quando o real chegar, voltar ao snapshot e re-simular. Usa tudo da Etapa 7. Efeitos de render e áudio não podem tocar duas vezes na re-simulação.
- [ ] Servidor relay pequeno em Node com WebSocket (se a conexão P2P falhar por NAT/4G ou ficar instável com 4 jogadores): substitui o host e o TURN, e só repassa inputs.

**Pronto quando:** o problema que motivou o item sumiu nas partidas do grupo.

## Riscos principais

- **Arte inconsistente entre personagens:** travar o guia de estilo na Etapa 4 e não mudar mais.
- **Online dessincronizando:** não pular a Etapa 7.
- **Complexidade do netcode:** começar só com atraso; rollback e relay ficam para a Etapa 12, e só se fizerem falta.
- **Escopo de 16 personagens:** o jogo já é divertido com 4; os lotes deixam o elenco crescer sem travar o resto.
