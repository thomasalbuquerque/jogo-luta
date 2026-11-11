# GDD — Jogo de luta dos amigos

Documento de 1 página com as regras do jogo. Quando uma regra mudar no código, mude aqui também.
Os números são ponto de partida e serão ajustados nas Etapas 1–3 e 11.

## Partida

- **Formato:** 1x1 no mesmo PC; online, de 2 a 4 (todos contra todos; 2x2 a caminho). Plataforma de luta, sem barra de vida: quem sai da tela perde uma vida.
- **Stocks:** 3 vidas por jogador.
- **Tempo limite:** 4 minutos. No fim do tempo vence quem tiver mais stocks; empate em stocks → menor % de dano; empate total → morte súbita (1 stock, 300%).
- **Dano:** cada golpe soma % ao alvo (começa em 0%, sem teto). Quanto maior o %, mais longe o golpe arremessa.
- **Knockback:** `(força base + dano acumulado × escala do golpe) × 100 ÷ peso` (peso 100 = médio), com o dano do alvo já somado o do golpe. Ver [Combate](#combate).
- **Hitstun:** proporcional ao knockback; durante o hitstun o lutador não age.
- **Hitstop:** os dois lutadores congelam alguns ticks no impacto (mais em golpes fortes).
- **Blast zones:** retângulo além das bordas da tela; sair dele inteiro = KO (inclusive cair do mapa).
- **Respawn:** 1 s fora de cena, depois reaparece no alto do mapa com 0% e 2 s de invencibilidade. Sem stock, está fora; quando sobra 1 lutador, ele vence (se os últimos stocks caírem no mesmo tick, empate).
- **Morte súbita:** só os empatados voltam, nos pontos de início, com 1 stock, 300% e 1 s de invencibilidade, sem limite de tempo.
- **Contagem:** antes de cada luta, "3, 2, 1, LUTA!" (2,5 s). Na contagem ninguém age e o relógio não anda (fase `countdown` do `sim`).
- **Pausa:** Esc, Enter ou Start do controle; a luta também pausa sozinha quando a janela perde o foco. Continuar (Esc, Start ou Especial), recomeçar, trocar lutador ou voltar ao menu. Voltando da pausa, botão que ficou apertado só conta depois de soltar.
- **Resultado e revanche:** 1 s depois do fim, a tela de resultado mostra quem venceu e os números de cada um (KOs, quedas, dano causado, golpes, maior golpe). Revanche já vem escolhida (Ataque, Pulo ou Enter); Especial ou Esc troca de lutador. Também dá para ver o replay da luta e salvar em arquivo (ver [Determinismo e replays](#determinismo-e-replays)).
- **Simulação:** 60 ticks/s, passo fixo. Todos os tempos de golpe são contados em ticks.

## Movimento

- Andar, pulo, **1 pulo aéreo** (recarrega ao tocar o chão ou ao dar wall jump), wall jump.
- **Pulo curto:** soltar o pulo enquanto sobe corta a subida pela metade.
- **Wall jump:** encostado na lateral de um bloco sólido, no ar, segurando na direção dele o lutador desliza devagar; pulo arremessa para longe da parede. Até 3 por vez no ar.
- **Fast fall:** ↓ no ar, depois do ápice, acelera a queda.
- **Plataformas atravessáveis:** passa por baixo pulando; ↓ em cima delas para descer.
- **Esquiva:** no chão é um dash curto (9 ticks, recarga de 18; pulo cancela o dash). No ar é um dodge em qualquer das 8 direções (ou parado), sem gravidade, com 12 ticks de invencibilidade, 1 por vez no ar.
- **Tolerâncias:** pulo até 5 ticks depois de sair da borda (coyote time) e pulo apertado até 6 ticks antes de poder pular fica guardado (buffer).
- **Unidades no `sim`:** inteiros em subpixel (1 px = 100 subpx), para o resultado ser igual em todo navegador.
- **Borda (ledge):** caindo ao lado da quina de cima de um bloco sólido, com as mãos na altura dela, o lutador agarra (segurar ↓ não agarra). Agarrar devolve pulo aéreo, dodge e recuperação. Depois de 6 ticks pendurado: ↑ ou na direção do palco sobe; pulo pula; ↓ ou para fora solta (30 ticks sem poder agarrar de novo). Pendurado não é invencível.

## Controles

Padrão abaixo; dá para trocar na tela **Controles** (menu inicial), e fica salvo no navegador. Uma tecla só vale para um botão: escolher uma que já é usada troca as duas. Enter, Esc, M, ` , Tab e F1–F12 são reservadas. No controle (o mesmo mapa para todos), as direções ficam sempre no analógico e no D-pad; Select e Start são reservados. Gamepad (Gamepad API) é o recomendado.

Nos menus, além dos controles de cada jogador, sempre valem as setas, Enter (confirma) e Esc (volta).

| Ação       | Jogador 1  | Jogador 2 | Gamepad (padrão)       |
| ---------- | ---------- | --------- | ---------------------- |
| Direções   | W A S D    | Setas     | Analógico esq. / D-pad |
| Pular      | Espaço     | J         | A                      |
| Ataque     | V          | K         | X                      |
| Especial   | B          | L         | B                      |
| Esquiva    | Shift esq. | I         | RB / RT                |
| Provocação | R          | U         | Y                      |

**M** liga e desliga o som (vale para todos; o navegador lembra).

**Input como dado:** a cada tick, cada jogador vira uma bitmask. O `sim` só enxerga isso.

| Bit | Botão | Bit | Botão   |
| --- | ----- | --- | ------- |
| 0   | LEFT  | 5   | ATTACK  |
| 1   | RIGHT | 6   | SPECIAL |
| 2   | UP    | 7   | DODGE   |
| 3   | DOWN  | 8   | TAUNT   |
| 4   | JUMP  |     |         |

## Moveset base (igual para todos)

Cada personagem só muda números destes golpes (dano, força, alcance, frames) na ficha. Valores base em
`packages/sim/src/moves.ts`.

| Golpe              | Input              | Uso                                 | Frames (S/A/R)  | Dano | Ângulo    | KB base / escala |
| ------------------ | ------------------ | ----------------------------------- | --------------- | ---- | --------- | ---------------- |
| Leve neutro (chão) | Ataque parado      | Rápido, curto alcance               | 4 / 3 / 7       | 5%   | 30°       | 7 / 0,08         |
| Leve lado (chão)   | Ataque + ←/→       | Avança, arremessa na horizontal     | 7 / 4 / 12      | 8%   | 25°       | 9 / 0,17         |
| Leve baixo (chão)  | Ataque + ↓         | Rasteira, arremessa para cima       | 6 / 4 / 14      | 7%   | 80°       | 10 / 0,16        |
| Aéreo neutro       | Ataque no ar       | Golpe em volta do corpo             | 5 / 6 / 12      | 7%   | 45° longe | 8 / 0,12         |
| Aéreo lado         | Ataque + ←/→ no ar | Principal golpe de KO lateral       | 9 / 4 / 18      | 11%  | 35°       | 10 / 0,21        |
| Aéreo baixo        | Ataque + ↓ no ar   | Golpe para baixo (spike fraco)      | 8 / 5 / 14      | 9%   | 285°      | 7 / 0,08         |
| Recuperação        | Ataque + ↑         | Sobe e acerta; 1 vez por ar         | 3 / 12 / 12     | 8%   | 80°       | 9 / 0,17         |
| Ground pound       | Especial + ↓ no ar | Cai rápido e acerta ao tocar o chão | 8 / até 40 / 10 | 6%   | 285°      | 6 / 0,06         |
| ↳ onda ao pousar   | —                  | Acerta dos dois lados               | 0 / 4 / 16      | 10%  | 50° longe | 11 / 0,16        |

- **Frames:** cada golpe é definido em ticks: **startup** (preparação) → **active** (hitbox ligada) → **recovery** (vulnerável). As hitboxes podem mudar de frame a frame (ex.: o arco do aéreo lado começa em cima e desce para a frente).
- **Escolha do golpe:** ↓ > ↑ > ←/→ > parado. No ar, ↑ + Ataque com a recuperação já usada vira aéreo neutro. A recuperação volta ao tocar o chão, agarrar a borda ou levar golpe.
- **Durante o golpe:** no chão o lutador para (cada golpe pode liberar andar com `canWalk`); no ar dá para mirar com ←/→. Nunca vira no meio do golpe. O recovery é a janela em que quem errou fica exposto. Os golpes de lado viram para o lado apertado ao começar. Leve lado dá um avanço; recuperação dá um impulso para cima.
- **Landing lag:** pousar no meio de um aéreo corta o golpe e deixa o lutador parado alguns ticks (4 a 8). O ground pound, ao pousar, vira a onda.
- **Buffer:** Ataque e Especial apertados ficam guardados 6 ticks. Pulo + Ataque juntos no chão: pula e solta o aéreo no tick seguinte. O dash pode sair em ataque.

## Combate

- **Hitbox × hurtbox:** a hurtbox é o corpo do lutador. Cada golpe acerta cada alvo 1 vez. Se dois golpes se acertam no mesmo tick, os dois levam (troca). Invencível (dodge aéreo, respawn) não leva golpe.
- **Knockback** em px/tick, na direção do ângulo do golpe (0° = para a frente de quem bate, 90° = para cima, 270° = para baixo). Golpes em volta do corpo ("longe") arremessam para longe do centro de quem bate.
- O arremesso é uma velocidade à parte que freia 0,38 px/tick a cada tick ao longo da direção (no chão, pelo menos 1,5 na horizontal). Pular ou dar dodge depois do hitstun não cancela o arremesso.
- Spike em quem está no chão quica para cima, com metade da força.
- **Hitstun:** `6 + 1,2 × knockback` ticks (knockback em px/tick). Levar golpe cancela o golpe em andamento e devolve pulo aéreo, dodge e recuperação.
- **Hitstop:** `3 + dano ÷ 3` ticks (máx. 12), para os dois.
- **Referência de KO** (sem o alvo reagir): aéreo lado ~100% perto da borda e ~130% no meio; leve lado ~125% / ~155%; golpes para cima ~175%.
- **Determinismo:** seno e cosseno vêm de uma tabela de inteiros; todo o estado do combate é inteiro. Ver [Determinismo e replays](#determinismo-e-replays).

## Especiais e provocação

- Botão **Especial**: cada personagem tem **1 especial**, que sai com Especial parado ou com qualquer direção (exceto Especial + ↓ no ar, que é o ground pound do moveset base). ←/→ ao começar vira o lutador para aquele lado.
- O especial é um golpe como os outros (startup / active / recovery), montado com **blocos** do `sim` (`packages/sim/src/character.ts`). Os instantâneos disparam no 1º frame ativo; os contínuos duram o active. Cada bloco aparece no máximo 1 vez, e só 1 bloco liga hitbox (investida, área ou agarrão).

| Bloco         | Quando         | O que faz                                                                                                                                              |
| ------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Projétil      | 1º frame ativo | Solta um projétil na frente (ângulo, velocidade, gravidade, duração). Some ao acertar, ao bater em bloco sólido ou no fim do tempo. Só o alvo congela. |
| Investida     | active         | Avança reto com a hitbox; no ar não cai e é mais curta (`airSpeed`). No fim freia para a velocidade normal.                                            |
| Área          | active         | Hitbox em volta do corpo; arremessa para longe do centro.                                                                                              |
| Contra-ataque | active         | Quem acerta o lutador na janela leva o golpe do bloco; projétil volta para quem soltou. Errar deixa exposto no recovery.                               |
| Buff          | 1º frame ativo | Por um tempo: % de dano causado, % de velocidade (chão e ar), % de peso.                                                                               |
| Teleporte     | 1º frame ativo | Reaparece a uma distância na direção apertada (8 direções; sem direção, para a frente). Para em bloco sólido. Pode dar invencibilidade curta.          |
| Agarrão       | active         | A hitbox segura o alvo na frente por um tempo; ←/→ escolhe o lado; depois arremessa. Ganha do contra-ataque. Quem segura levando golpe solta.          |

- **Opções do especial:** recarga (`cooldownTicks`, contada do começo), 1 vez por ar (`oncePerAir`, volta como a recuperação) e ficar parado no ar no startup (`hoverStartup`).
- **Provocação** (R / U / Y): só no chão, parado pela duração da ficha; levar golpe desfaz. Sem efeito de jogo. Mostra o bordão num balão e toca o áudio do amigo (`audio/vozes/<taunt.sound>`); enquanto não há áudio gravado, toca uma voz provisória sintetizada a partir do bordão.

## Game feel e áudio

Só apresentação: nada disto muda a luta. O `sim` avisa o que aconteceu em cada tick (`state.events`: golpe com força e ponto do impacto, agarrão, KO, respawn e ações como pulo, dash, dodge, pouso, começo de golpe e provocação), e o jogo desenha e toca em cima disso.

- **Impacto:** estrela, clarão, anel na cor de quem bateu e faíscas na direção do arremesso, tudo maior quanto mais forte o golpe. Quem leva fica branco por alguns ticks e o % no HUD pula de tamanho.
- **Tremor de tela:** proporcional ao knockback (golpe fraco quase não treme); o KO treme forte.
- **Rastro:** quem voa a mais de 14 px/tick deixa fumaça, que vira fogo nos arremessos mais fortes.
- **KO:** explosão na borda da tela por onde o lutador saiu, apontando para dentro, na cor do jogador.
- **Golpe decisivo:** quando um golpe vai tirar o último stock e acabar a luta (o jogo simula à frente uma cópia do estado enquanto o alvo está sem controle), a câmera dá zoom em quem voa e o tempo fica a 20% por ~1,3 s. Se a luta acabar sem esse aviso (ex.: caiu sozinho), há uma câmera lenta mais curta no KO final.
- **Poeira** no pulo do chão, no pouso, no dash e no wall jump; anel no pulo aéreo; brilho no respawn.
- **Sons:** golpe fraco, médio e forte (pela força do arremesso), swing, pulo, pulo aéreo, dash, dodge, pouso, agarrão, contra-ataque, KO e respawn, com uma variação de tom a cada toque. São gerados em código; um arquivo em `audio/sfx/<nome>.*` substitui o gerado.
- **Vozes:** provocação e KO de cada amigo, dos áudios em `audio/vozes/` (ids `taunt.sound` e `koSound` da ficha). Sem áudio, a provocação "canta" o bordão e o KO é um grito sintetizado com o tom do personagem.
- **Música:** uma faixa no menu e outra na luta, em loop, trocando com fade. Provisórias, geradas em código; `audio/musica/menu.*` e `audio/musica/luta.*` substituem.
- **Liberar o áudio:** os navegadores só tocam som depois de um clique ou tecla. Até lá, um aviso no alto da tela pede isso, e a música começa assim que liberar.

Como pôr os áudios gravados: [`audio/LEIAME.md`](../audio/LEIAME.md).

## Seleção

- **Fluxo:** tela inicial (qualquer tecla) → modo (mesmo PC; online; ver replay; controles) → personagem → mapa → luta → resultado → revanche.
- **Personagem:** grade de 7 casas (os que existem e silhuetas "em breve"; cresce aos poucos). Cada jogador anda com as próprias direções, confirma com Ataque ou Pulo e desfaz com Especial; Especial com ninguém pronto (ou Esc) volta ao menu. O painel de cada um mostra o lutador, estilo, especial, barras e bordão. Pode repetir personagem: o contorno e o marcador em cima da cabeça têm a cor do jogador.
- **Mapa:** um cursor só, qualquer jogador mexe; por enquanto só a Laje.
- **HUD:** painel de cada jogador com retrato, % de dano (branco → amarelo → laranja → vermelho → vinho conforme sobe) e stocks com a cabecinha do personagem; relógio no alto.

## Determinismo e replays

A mesma seed com os mesmos inputs dá sempre a mesma luta, tick a tick, em qualquer navegador. É a base do [online](#online).

- **Regras do `sim`:** nada de `Math.random`, relógio, `Math.sin`/`cos`/`pow`/`sqrt` nem `**` (o ESLint barra). Seno e cosseno vêm de tabela (`trig.ts`), raiz e divisão são inteiras (`math.ts`), e todo número do estado é inteiro.
- **Sorte:** RNG com seed (`rng.ts`), com o estado guardado em `GameState.rng`. A seed é sorteada pelo jogo ao criar a luta; dentro do `sim`, tudo sai dela. Hoje nenhuma regra usa sorte: quando uma usar, tem que ser por este RNG.
- **Snapshot** (`snapshot.ts`): `cloneState` copia o estado campo a campo (barato, dá para fazer todo tick), `restoreState` volta a um snapshot, `serializeState`/`deserializeState` passam por texto e `hashState` dá um hash de 32 bits do estado inteiro. Dois lados com hashes diferentes no mesmo tick = dessincronizou.
- **Teste de determinismo:** 10 mil ticks de inputs aleatórios rodados duas vezes têm o mesmo hash em todos os ticks; voltar a um snapshot e refazer chega ao mesmo estado.
- **Replay** (`replay.ts`): seed + personagens + mapa + regras + a bitmask de cada jogador em cada tick, e o hash do estado final. Toda luta é gravada. Na tela de resultado: **Ver replay** e **Salvar replay** (baixa um `.json` pequeno, bom de mandar no grupo). No menu inicial, **Ver replay** abre um arquivo salvo (ou arraste o arquivo para o jogo). Assistindo, aparece "● REPLAY" embaixo do relógio; pausa funciona; no fim dá para ver de novo, salvar ou jogar a mesma luta.
- **Validade do replay:** só reproduz na mesma versão das regras. Se um número de golpe ou de personagem mudou desde a gravação, a luta sai diferente; o jogo percebe pelo hash final e avisa na tela de resultado. Arquivo que não é replay (ou quebrado) é recusado com o motivo.
- **Atraso de input** (para sentir o netcode por atraso antes de ter rede): os inputs de um jogador só chegam ao `sim` N ticks depois (0 a 15; 3 ticks = 50 ms). `?atraso=3` na URL atrasa o jogador 1 e `?atraso=3,2` os dois; com o debug ligado (`), as teclas 1/2 diminuem/aumentam o do P1 e 3/4 o do P2. O replay grava os inputs já atrasados.
- **Debug:** a 1ª linha do overlay mostra o hash do estado e a seed; num replay, o tick atual e, no fim, se ficou igual à gravação.

## Online

Luta de 2 a 4 jogadores, cada um no seu PC, direto entre eles (P2P por WebRTC). Quem cria a sala é o host. Por enquanto é todos contra todos; os times são a próxima tarefa da Etapa 9.

- **Sala por código:** no menu, **Jogar online** → **Criar sala** mostra um código de 4 letras (sem I nem O) para mandar no grupo; os amigos escolhem **Entrar com código** e digitam (ou colam). `C` (ou clique) copia um link que já entra na sala (`?sala=ABCD`). Cabem 4 na sala; um quinto é recusado ("Essa sala já está cheia").
- **Quando dá para entrar:** com a sala esperando ou na seleção de lutador. Assim que o primeiro amigo entra, o host vai para a seleção, e quem chega depois entra direto nela (aparece um painel novo e "P3 entrou na sala."). No mapa e na luta (resultado incluído), quem chega é recusado e avisado para tentar quando voltarem à seleção.
- **Quem é quem:** o host é o P1; quem entra pega o próximo lugar (P2, P3, P4), na ordem de chegada. Se alguém sai, quem estava depois dele anda um lugar. Cada um joga no seu PC com qualquer um dos controles (as teclas do P1, as do P2 ou o gamepad).
- **Telas:** as mesmas do jogo local, sincronizadas. Na seleção há um painel para cada um na sala (com 3 ou 4, mais estreitos, lado a lado); cada um mexe só no próprio cursor e vê o dos outros; com todos prontos, vai para o mapa, que é escolhido pelo host. No resultado, a revanche começa quando **todos** escolhem **Revanche** (o resultado mostra quantos já votaram), e **Trocar lutador** leva a sala inteira de volta à seleção. Esc na seleção (ou **Sair da sala** no menu) sai da sala.
- **Alguém sai:** de propósito ou porque a conexão caiu e não voltou em 30 s. Os outros veem "P3 saiu da sala." (ou "caiu e não voltou"). Na luta, o lutador dele fica parado até ela acabar, e a revanche é com quem ficou; no mapa, a sala volta para a seleção. Se o host ficar sozinho, a sala acaba; se o host sai, a sala acaba para todos.
- **Sem pausa:** Esc/Start abre um menu por cima (continuar ou sair da sala), mas a luta continua; com o menu aberto o lutador fica parado. Trocar de aba não pausa: os outros ficam esperando.
- **Estrela:** cada um que entra se conecta só ao host. O host recebe os inputs de todos e repassa cada um para os outros assim que chega (não é malha completa: com 4 jogadores são 3 conexões, todas no host). A tela da sala, a seleção de cada um, os votos e os hashes também passam pelo host. Se a conexão P2P com 4 ficar instável, a saída é o relay da Etapa 12.
- **Netcode por atraso (lockstep):** o que cada um aperta só vale alguns ticks depois e, nesse meio-tempo, viaja até os outros. O host escolhe o atraso ao começar a partida, pelo pior caminho da sala: entre dois que entraram, o input vai até o host e do host ao outro, então conta o ping dos dois (2 a 3 ticks no 1x1 com ping baixo; até 8). O `sim` só roda um tick quando tem o input de todos, então todos veem exatamente a mesma luta. Se o input de alguém atrasa, a luta espera ("Esperando o outro jogador…" no 1x1; "Esperando o P3…" com mais gente). Sem rollback (Etapa 12, opcional).
- **Canais:** o lobby e o controle vão por um canal confiável; os inputs vão por um DataChannel sem ordenação e sem retransmissão (parecido com UDP). Cada pacote leva, de cada jogador, os inputs que quem recebe ainda não confirmou (e quantos inputs de cada um quem manda já tem), então pacote perdido é coberto pelo seguinte.
- **Ping:** no canto do HUD, com o atraso de input da partida: verde até 60 ms, amarelo até 120 ms, vermelho acima; "relay" quando o tráfego passa por TURN. Quem entrou vê o ping até o host; o host vê o de quem está mais longe.
- **Dessincronização:** a cada 30 ticks (e no fim da luta) todos mandam o hash do estado, e o host compara o dele com o de cada um (e cada um com o do host). Se divergir, fica registrado no console (tick, quem e os dois hashes), aparece "DESSINCRONIZOU" no HUD e um aviso no resultado pedindo para salvar o replay de cada lado.
- **Queda e reconexão:** 1 s sem ouvir alguém mostra "Conexão instável…"; se uma conexão cai, os dois lados dela veem "Reconectando…" e a luta fica parada para todos (falta o input de alguém); quem entrou disca de novo e a luta segue do mesmo tick. Depois de 30 s sem voltar, ele sai da sala (ver **Alguém sai**); quem entrou e perdeu o host vê a sala acabar ("A conexão caiu e não voltou").
- **Mesma versão:** todos precisam do mesmo build do jogo (senão a luta sairia diferente); com builds diferentes, quem entra é avisado para recarregar a página.
- **Servidores:** a sinalização (só para se acharem) usa o servidor gratuito do PeerJS; STUN público do Google e da Cloudflare; TURN de fallback público do PeerJS, que fica longe do Brasil. Para trocar, defina no build `VITE_TURN_URLS` (separadas por vírgula), `VITE_TURN_USERNAME` e `VITE_TURN_CREDENTIAL` (TURN próprio) e/ou `VITE_PEER_HOST`, `VITE_PEER_PORT`, `VITE_PEER_PATH` e `VITE_PEER_SECURE` (PeerServer próprio).
- **Debug:** com o debug ligado (`), a 1ª linha mostra sala, lugar e quantos estão nela, estado da conexão, ping, rota (direta ou relay), atraso, folga de inputs e quantos hashes já bateram.

O código fica em `packages/game/src/net`: `lockstep.ts` (filas de input de cada jogador), `protocol.ts` (mensagens e pacotes), `session.ts` (sala em estrela, telas, partida, quem entra e sai, reconexão), `peerLink.ts` (PeerJS/WebRTC). Tudo menos o `peerLink` roda em teste, com uma rede de mentira que perde e embaralha pacotes (`loopback.ts`), inclusive salas de 4.

## Ficha de personagem

Cada personagem é um arquivo em `packages/sim/src/characters/` (registrado em `index.ts`), validado com zod ao carregar: campo desconhecido, número fora da faixa ou cor inválida param o jogo com uma mensagem dizendo o quê. Unidades da ficha: px, px/tick, ticks e %; o que a ficha não muda vem do padrão.

```ts
export const FULANO = defineCharacter({
  id: 'fulano',
  name: 'Fulano',
  blurb: 'Estilo de luta em 1 linha (tela de seleção).',
  colors: { primary: '#e63946', secondary: '#f1faee' },
  stats: {
    weight: 100, // 100 = médio; maior = voa menos
    walkSpeed: 6.5, // px/tick
    airSpeed: 5.5,
    jumpHeight: 175, // px (airJumpHeight: sem valor = 80% disso)
    airJumps: 1,
    hurtbox: { w: 48, h: 96 }, // corpo (colisão e hurtbox), px
    // opcionais: airJumpHeight, gravity, maxFallSpeed, fastFallSpeed, dashSpeed
  },
  moves: {
    // só os ajustes; o resto vem do moveset base
    sideLight: { damage: 9, baseKnockback: 9.5 },
    sideAir: { startup: 8, reach: 110 }, // startup desloca as hitboxes; reach = % do alcance
  },
  special: {
    name: 'Nome do especial',
    startup: 10,
    active: 1,
    recovery: 16,
    cooldownTicks: 40, // opcional; também oncePerAir e hoverStartup
    blocks: [
      {
        type: 'projectile',
        speed: 9.5,
        lifetimeTicks: 60,
        size: { w: 34, h: 22 },
        hit: { damage: 5, angle: 25, baseKnockback: 6, knockbackScale: 0.05 },
      },
    ],
  },
  taunt: { text: 'Bordão!', sound: 'fulano_bordao', animation: 'fulano_taunt', durationTicks: 60 },
  koSound: 'fulano_ko', // opcional; sem valor = '<id com _>_ko' (áudio em audio/vozes/)
  animations: { idle: 'fulano_parado' }, // opcional; sem valor = '<id>_<chave>'
});
```

Ajustes de golpe aceitos: `startup`, `active`, `recovery`, `damage`, `angle`, `baseKnockback`, `knockbackScale`, `landingLag`, `canWalk`, `reach`.

`animations` e `taunt.animation` são nomes de clipes do esqueleto (`packages/game/src/rig/characterClips.ts`). Sem clipe com esse nome, o personagem usa o do esqueleto base (`rig/clips.ts`). Os golpes são animados nas fases da ficha, então mudar os frames de um golpe não desalinha a animação. A arte e o esqueleto estão em [`docs/ARTE.md`](ARTE.md).

### Os 2 primeiros

| Personagem  | Estilo | Peso | Chão (px/tick) | Ar (px/tick) | Pulo | Pulos aéreos | Especial                                                                            |
| ----------- | ------ | ---- | -------------- | ------------ | ---- | ------------ | ----------------------------------------------------------------------------------- |
| Schummaki   | Rusher | 112  | 7,4            | 5,3          | 165  | 1            | **Arrancada** (investida): 16 / 14 / 20, 13%, 1 vez por ar, parado no ar no startup |
| João Frango | Zoner  | 86   | 5,6            | 6,2          | 180  | 2            | **Frango assado voador** (projétil): 10 / 1 / 16, 5%, reto, ~570 px, recarga de 42  |

O elenco (apelidos, traços, especial e provocação de cada um) fica em [`docs/ELENCO.md`](ELENCO.md).
