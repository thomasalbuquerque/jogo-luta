# Balanceamento do elenco — proposta para revisão

Proposta de ajuste das 11 fichas jogáveis (`packages/sim/src/characters/*.ts`), com os valores de
antes e depois e o motivo de cada um. Depois de revisado, este arquivo serviu de base para o prompt
de execução (seção [Instruções para executar](#instruções-para-executar)).

> **Aplicada em novembro de 2026**, exatamente com os números deste documento (um commit por
> personagem). Fora do previsto: o teste de determinismo "a luta do teste tem de tudo" trocou a
> seed 2024 pela 7, porque a luta aleatória é caótica e, com a 2024, um lutador deixava de morrer
> em alguns dos estados intermediários.

Resumo do que muda:

- **Altura** de 6 personagens (Schummaki, João Frango, Dadazinho, Tchula, Crocko, Darllan), seguindo
  as alturas reais.
- **Queda** (descer da plataforma e fast fall) passa a contar como vantagem e ganha faixas de
  verdade. Hoje 10 dos 11 descem no mesmo tempo.
- **Três personagens acima da média são contidos** (Schummaki, Meia, João Frango) e **dois abaixo
  são reforçados** (Gabs e Tchula).
- Tauba não muda. Moveset base (`moves.ts`), padrões (`stats.ts`) e constantes de combate não mudam.

## Como a análise foi feita

Li as 11 fichas, o schema (`character.ts`), o moveset base (`moves.ts`), a física (`fighter.ts`,
`physics.ts`), o combate (`combat.ts`), os projéteis e o mapa (`stage.ts`). Para os critérios que
não dá para comparar só olhando o número da ficha, calculei o efeito real com as fórmulas do `sim`:

| Métrica calculada                | Como                                                                                                              |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| % de KO que o personagem aguenta | Aéreo lado base (10 / 0,21 a 35°), alvo segurando para dentro depois do hitstun, até passar da blast zone lateral |
| Tempo para descer da plataforma  | 150 px (plataforma do mapa até o chão) com ↓ segurado                                                             |
| Recuperação                      | Fora do palco: pulos aéreos + golpe de recuperação, distância horizontal até voltar à altura inicial              |
| Tempo de pulo                    | Ticks até o ápice e até pousar, com a gravidade e a queda máxima de cada um                                       |

### Critérios e o que cada um vale

| Critério                 | Campo da ficha                             | Efeito real no jogo                                                                                                            |
| ------------------------ | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Peso                     | `weight`                                   | O mais forte de todos. Cada 10 de peso = ~14 pontos de % a mais para morrer. Hoje: Dadazinho morre com 105%, Darllan com 177%. |
| Tamanho do corpo         | `hurtbox`                                  | Corpo maior leva mais golpe e mais projétil. Ver [Altura](#altura).                                                            |
| Velocidade no chão       | `walkSpeed`, `dashSpeed`                   | Quem escolhe a distância da luta. Vale mais para quem precisa chegar perto.                                                    |
| Velocidade no ar         | `airSpeed`                                 | Mira dos aéreos e distância de volta ao palco.                                                                                 |
| Pulo                     | `jumpHeight`, `airJumpHeight`, `airJumps`  | Altura e, junto com a gravidade, a recuperação.                                                                                |
| Queda                    | `gravity`, `maxFallSpeed`, `fastFallSpeed` | Ver [Queda](#queda-descer-mais-rápido-é-vantagem).                                                                             |
| Golpes base              | `moves`                                    | Dano, startup e alcance. 1 tick de startup vale mais que 1% de dano.                                                           |
| Dano e força do especial | `hit` do bloco                             | Dano, e se o golpe mata (knockback base e escala).                                                                             |
| Tempo do especial        | `startup` / `active` / `recovery`          | Startup = aviso para o adversário; recovery = punição se errar.                                                                |
| Recarga do especial      | `cooldownTicks`                            | De quanto em quanto tempo o especial volta.                                                                                    |
| Duração do efeito        | `durationTicks`, `holdTicks`, `active`     | Aura da Marília, agarrão do Meia, janela do Crocko, sumiço do Tauba.                                                           |

### Orçamento aproximado (só para achar quem está fora da curva)

Para comparar personagens tão diferentes, dei pontos a cada critério em relação ao boneco padrão
(peso 100, corpo 48 × 96, chão 6,5, ar 5,5, queda 17). **É uma régua grosseira, não uma medida
exata:** as notas de golpes e de especial são julgamento meu. Serve para mostrar quem está muito
acima ou muito abaixo dos outros, não para decidir a segunda casa decimal.

Regra dos pontos: peso +1 a cada 4; corpo −1 a cada 400 px² de área; chão +1 a cada 0,4 px/tick; ar
+1 a cada 0,3; recuperação +1 a cada 50 px de distância acima de 430; queda +1 a cada 1,5 px/tick de
fast fall; golpes e especial por nota.

| Personagem  | Antes | Só com a altura nova | Depois |
| ----------- | ----- | -------------------- | ------ |
| Schummaki   | 9,4   | 7,9                  | 5,2    |
| Meia        | 7,6   | 7,6                  | 5,8    |
| João Frango | 7,2   | 6,7                  | 5,2    |
| Dadazinho   | 5,7   | 4,8                  | 5,4    |
| Tauba       | 5,1   | 5,1                  | 5,1    |
| Darllan     | 4,7   | 5,0                  | 5,3    |
| Crocko      | 4,5   | 4,7                  | 5,3    |
| Igão        | 4,4   | 4,4                  | 5,0    |
| Marília     | 4,2   | 4,2                  | 4,8    |
| Tchula      | 3,3   | 3,5                  | 5,0    |
| Gabs        | 1,4   | 1,4                  | 5,3    |

Antes: de 1,4 a 9,4. Depois: de 4,8 a 5,8.

O que a régua mostrou, e que bate com a leitura das fichas:

- **Schummaki tem tudo:** é o mais rápido no chão, o 3º mais pesado, tem golpes base mais fortes e
  mais rápidos, e o único especial sem recarga.
- **Meia** tem os números de um personagem leve e rápido, mas sem o preço: os golpes dele são mais
  rápidos (o que vale mais que o 1% a menos).
- **João Frango** volta ao palco de 756 px de distância; o segundo melhor volta de 486. É 55% a mais.
- **Gabs** é lento, largo, sem ajuste nenhum nos golpes, e o especial dele é o mais fraco dos que
  dão dano (11%, knockback baixo, com ponto cego).
- **Tchula** paga caro (lento no chão, no ar e nos golpes) por um especial bom.

## Altura

### O que a altura muda no jogo

A altura é o `hurtbox.h` da ficha. Conferi no código tudo o que depende dela:

| Efeito                                                                | Para quem é mais alto                                                                                                          |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Corpo maior: mais golpes e projéteis acertam                          | Pior                                                                                                                           |
| Golpes e projéteis saem do centro do corpo, então saem de mais alto   | Um pouco melhor para acertar quem está em cima; os golpes para baixo (aéreo baixo, ground pound) alcançam menos abaixo dos pés |
| A borda é agarrada pelo topo do corpo: agarra com os pés mais embaixo | Um pouco melhor (Igão agarra 22 px mais baixo que o Tauba)                                                                     |
| A arte é escalada pela altura da hurtbox (`FighterView`)              | O boneco fica maior na tela, na mesma proporção                                                                                |
| Altura do pulo, velocidade, peso                                      | Não mudam                                                                                                                      |

No saldo, ser mais alto é **desvantagem**. Por isso quem cresceu ganhou compensação e quem diminuiu
(2 px) não perdeu nada.

### Escala

A escala de hoje já é quase uma reta (1,64 m = 90 px; 1,90 m = 112 px). Mantive as duas pontas, que
já estão certas e têm arte ajustada, e encaixei as duas alturas do meio:

| Altura real | `hurtbox.h` | Quem                                       |
| ----------- | ----------- | ------------------------------------------ |
| 1,64 m      | 90          | Tauba, Marília                             |
| 1,70 m      | 96          | João Frango, Dadazinho, Tchula, Gabs, Meia |
| 1,80 m      | 104         | Crocko, Darllan                            |
| 1,90 m      | 112         | Schummaki, Igão                            |

1,70 m ficou em 96 (a reta daria 95) porque é a altura do boneco padrão e a do Gabs e do Meia, que
assim não mudam.

### Antes e depois

A largura (`hurtbox.w`) não muda em ninguém: ela é a do corpo (magro, largo), não a da altura.

| Personagem  | Altura real | `hurtbox` antes | `hurtbox` depois | Mudança |
| ----------- | ----------- | --------------- | ---------------- | ------- |
| Schummaki   | 1,90 m      | 52 × 100        | 52 × **112**     | +12     |
| João Frango | 1,70 m      | 46 × 92         | 46 × **96**      | +4      |
| Dadazinho   | 1,70 m      | 44 × 88         | 44 × **96**      | +8      |
| Tauba       | 1,64 m      | 46 × 90         | 46 × 90          | —       |
| Tchula      | 1,70 m      | 50 × 98         | 50 × **96**      | −2      |
| Crocko      | 1,80 m      | 50 × 106        | 50 × **104**     | −2      |
| Darllan     | 1,80 m      | 56 × 106        | 56 × **104**     | −2      |
| Gabs        | 1,70 m      | 54 × 96         | 54 × 96          | —       |
| Marília     | 1,64 m      | 44 × 90         | 44 × 90          | —       |
| Meia        | 1,70 m      | 44 × 96         | 44 × 96          | —       |
| Igão        | 1,90 m      | 50 × 112        | 50 × 112         | —       |

Consequências:

- **Dadazinho** deixa de ser o menor alvo do elenco (área +9%): fica com o mesmo corpo do Meia
  (44 × 96). Tauba e Marília passam a ser os mais baixos. A compensação está na
  [ficha dele](#dadazinho).
- **Schummaki** fica com a maior área do elenco, empatado com o Darllan (5824 px²).
- **Igão** deixa de ser "o mais alto": empata com o Schummaki.
- **Crocko** deixa de ser mais alto que o Schummaki.

### Ajustes que acompanham a altura

Como golpes e projéteis saem do centro do corpo, e a arte cresce junto, dois especiais precisam
acompanhar:

| Ficha     | Campo                | Antes                           | Depois                          | Motivo                                                                                      |
| --------- | -------------------- | ------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------- |
| Dadazinho | `offset` do projétil | `{ x: 52, y: -22 }`             | `{ x: 56, y: -24 }`             | A arma cresce 9% com o boneco; o tiro tem que continuar saindo do cano. Conferir no `?rig`. |
| Schummaki | `box` da investida   | `{ x: 28, y: 4, w: 66, h: 84 }` | `{ x: 28, y: 5, w: 66, h: 94 }` | A caixa cobria 84% do corpo; mantém a proporção no corpo mais alto.                         |

Os outros (João +4, Tchula/Crocko/Darllan −2) mudam o centro em 1 ou 2 px: não precisa ajustar.

## Queda: descer mais rápido é vantagem

### O que o código faz hoje

Em cima de uma plataforma, apertar ↓ solta o lutador e, no mesmo tick, liga o fast fall
(`controlFree` em `fighter.ts`): a velocidade vira direto `fastFallSpeed`, sem aceleração. Então
**a regra do jogo já é "quem tem `fastFallSpeed` maior desce mais rápido"**. Não há nada no código
que favoreça quem desce devagar.

O que está errado são os valores:

1. **Quase não há diferença.** Para descer os 150 px da plataforma até o chão, 10 dos 11 levam 9
   ticks; só o João leva 10. Os valores vão de 15 a 18,5, mas a diferença some no arredondamento.
2. **A queda lenta foi tratada como qualidade.** O João "flutua" (gravidade 0,56, queda 15) como
   parte de ser "bom no ar". Flutuar ajuda a voltar ao palco, e isso já está contado na
   recuperação dele. Descer devagar, em si, é desvantagem: demora mais para voltar ao chão, para
   sair de cima de alguém e para fugir de quem está embaixo.
3. **A queda rápida nunca foi contada como vantagem.** Os pesados ganharam a queda mais rápida por
   serem "pesados", sem isso entrar na conta do que eles têm de bom.

### Nova regra

`fastFallSpeed` conta como vantagem no orçamento e passa a ter 3 faixas, cada uma com 1 tick de
diferença na descida da plataforma. A gravidade e a queda máxima acompanham a faixa, para a queda
normal (sem ↓) seguir a mesma ordem.

| Faixa  | `fastFallSpeed` | `gravity` | `maxFallSpeed` | Descer 150 px | Quem                                                               |
| ------ | --------------- | --------- | -------------- | ------------- | ------------------------------------------------------------------ |
| Rápida | 19              | 0,70–0,72 | 12             | 8 ticks       | Schummaki, Dadazinho, Tchula, Crocko, Darllan, Gabs, Marília, Igão |
| Média  | 17              | 0,65      | 11             | 9 ticks       | Tauba, Meia                                                        |
| Lenta  | 15              | 0,60      | 10             | 10 ticks      | João Frango                                                        |

Quem ficou em cada faixa e por quê:

- **Dadazinho, rápida:** compensa o corpo um pouco maior. Combina com o estilo: ele pune, então
  precisa cair em cima do adversário na hora certa.
- **Pesados (Darllan, Crocko, Tchula, Gabs), rápida:** já tinham os maiores valores, só que sem
  efeito prático. Agora ganham 1 tick de verdade. Os quatro estavam na metade de baixo do orçamento.
- **Schummaki, rápida:** sobe de 18,5 para 19, que é o que faz o valor dele valer 1 tick. É rusher.
- **Marília e Igão, rápida:** os dois estavam abaixo da média. Ela "vai para cima sem medo"; ele
  vive no ar e bate de cima para baixo (a cortada).
- **Tauba e Meia, média:** Tauba já está na média do orçamento; Meia está acima.
- **João Frango, lenta:** continua o mais lento para descer. É o preço de flutuar e ter a melhor
  recuperação do jogo.

Gravidade maior também diminui um pouco a recuperação (o golpe de recuperação tem impulso fixo). Os
números de cada um estão nas fichas abaixo e já contam isso.

### Antes e depois

| Personagem  | `gravity`       | `maxFallSpeed` | `fastFallSpeed` | Descer 150 px (ticks) |
| ----------- | --------------- | -------------- | --------------- | --------------------- |
| Schummaki   | 0,72            | 12             | 18,5 → **19**   | 9 → 8                 |
| João Frango | 0,56 → **0,60** | 9,5 → **10**   | 15              | 10                    |
| Dadazinho   | 0,66 → **0,70** | 11 → **12**    | 17,5 → **19**   | 9 → 8                 |
| Tauba       | 0,65 (padrão)   | 11 (padrão)    | 17 (padrão)     | 9                     |
| Tchula      | 0,70            | 11,5 → **12**  | 17,5 → **19**   | 9 → 8                 |
| Crocko      | 0,70            | 11,8 → **12**  | 18 → **19**     | 9 → 8                 |
| Darllan     | 0,72            | 12             | 18,5 → **19**   | 9 → 8                 |
| Gabs        | 0,68 → **0,70** | 11,5 → **12**  | 17,5 → **19**   | 9 → 8                 |
| Marília     | 0,65 → **0,70** | 11 → **12**    | 17 → **19**     | 9 → 8                 |
| Meia        | 0,65 (padrão)   | 11 (padrão)    | 17 (padrão)     | 9                     |
| Igão        | 0,66 → **0,70** | 11 → **12**    | 17 → **19**     | 9 → 8                 |

A altura do pulo não muda com a gravidade: o `sim` calcula a velocidade do pulo a partir da altura
da ficha. Gravidade maior só deixa o pulo mais seco (sobe e desce em menos ticks).

## Especiais: comparação

Tempos em ticks (60 = 1 s). "Total" = startup + active + recovery.

| Personagem  | Especial          | S / A / R    | Total | Recarga | Dano | Força (base / escala) | Efeito e duração                              |
| ----------- | ----------------- | ------------ | ----- | ------- | ---- | --------------------- | --------------------------------------------- |
| Schummaki   | Arrancada         | 16 / 14 / 20 | 50    | **0**   | 13%  | 11 / 0,19             | Investida de 238 px (154 no ar)               |
| João Frango | Frango            | 10 / 1 / 16  | 27    | 42      | 5%   | 6 / 0,05              | Projétil lento, 570 px                        |
| Dadazinho   | Doze              | 20 / 1 / 26  | 47    | 100     | 15%  | 10 / 0,20             | Tiro curto, ~250 px                           |
| Tauba       | Silent quit       | 14 / 20 / 18 | 52    | 240     | —    | —                     | Some 20 ticks, volta num chão sorteado        |
| Tchula      | Scout             | 28 / 1 / 30  | 59    | 150     | 18%  | 9 / 0,21              | Tiro que atravessa o palco                    |
| Crocko      | Correção postural | 6 / 20 / 28  | 54    | 90      | 14%  | 11 / 0,20             | Janela de contra-ataque de 20 ticks           |
| Darllan     | Rolo na bancada   | 18 / 5 / 26  | 49    | 60      | 15%  | 10 / 0,20             | Área dos dois lados, 216 px                   |
| Gabs        | Controle na mão   | 14 / 6 / 22  | 42    | 60      | 11%  | 8 / 0,16              | Área de 105 a 195 px à frente, com ponto cego |
| Marília     | Tragadinha        | 40 / 1 / 12  | 53    | 480     | —    | —                     | Aura de 120 ticks (2 s a cada 8 s)            |
| Meia        | Comando           | 6 / 4 / 32   | 42    | 90      | 16%  | 9 / 0,20              | Agarrão; prende 60 ticks                      |
| Igão        | Saque             | 18 / 1 / 18  | 37    | 90      | 8%   | 7 / 0,10              | Bola que quica 3 vezes, ~600 px               |

Leitura:

- A regra geral está boa e foi bem pensada: quanto mais dano e alcance, mais startup, mais recovery
  e mais recarga (Scout: 18%, palco inteiro, 28 de startup, 150 de recarga; Frango: 5%, 10 de
  startup, 42 de recarga). **Mantive essa lógica.**
- **Dois pontos fora da regra:** a Arrancada é o único especial sem recarga, com 13% e força de
  golpe que mata; e o Controle na mão dá menos dano e menos força que o Rolo do Darllan, com a
  mesma recarga, sendo mais difícil de acertar (ponto cego).
- **Durações de efeito (aura 120, agarrão 60, janela do contra-ataque 20, sumiço 20): não mexi.**
  São efeitos de tudo ou nada (invencível ou não, preso ou não), em que um ajuste pequeno muda
  muito. A aura fica ligada 25% do tempo no melhor caso e custa 40 ticks vulnerável; o agarrão
  prende 1 s mas deixa o Meia exposto a terceiros; a janela do Crocko é 1/3 de segundo com 28 de
  punição. Estão coerentes entre si.

## Ficha por ficha

Só aparecem os campos que mudam. O que não está na tabela fica como está.

### Schummaki

Problema: está muito acima dos outros. Mais rápido no chão (7,4), 3º mais pesado (112), 4 golpes
base melhorados e especial sem recarga. A ideia do personagem é "rusher": rápido e agressivo. Ele
não precisa também aguentar tanto quanto um pesado.

| Campo                   | Antes     | Depois                        | Motivo                                                                                                                                     |
| ----------------------- | --------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `hurtbox.h`             | 100       | **112**                       | 1,90 m.                                                                                                                                    |
| `weight`                | 112       | **106**                       | Continua acima da média (é o que o ELENCO pede: "médio-alto"), mas deixa de ser quase um Crocko. Morre com ~145% em vez de ~156%.          |
| `fastFallSpeed`         | 18,5      | **19**                        | Entra na faixa rápida (8 ticks).                                                                                                           |
| `moves.sideAir.damage`  | 12        | **11**                        | Volta ao dano base. Mantém a escala 0,22 (continua matando um pouco antes) e o landing lag 9.                                              |
| `moves.downAir`         | dano 10   | **remover o ajuste** (dano 9) | Um rusher de chão não precisa do aéreo para baixo mais forte.                                                                              |
| `special.cooldownTicks` | 0         | **75**                        | Único especial sem recarga. Com 50 ticks de duração, 75 dá 25 ticks sem especial depois de cada uso: acaba o spam, sem tirar a ferramenta. |
| `special.blocks[0].box` | h 84, y 4 | **h 94, y 5**                 | Acompanha a altura.                                                                                                                        |

Não muda: `walkSpeed` 7,4 e `dashSpeed` 14,5 (é a identidade dele), jab rápido, ombrada forte, dano
e força da Arrancada.

### João Frango

Problema: a recuperação. Com 2 pulos aéreos e gravidade 0,56, ele volta de 756 px; quase ninguém
consegue tirar um stock dele pela borda. O resto está no lugar: leve, lento no chão, golpes fracos
no chão.

| Campo           | Antes | Depois   | Motivo                                                                                      |
| --------------- | ----- | -------- | ------------------------------------------------------------------------------------------- |
| `hurtbox.h`     | 92    | **96**   | 1,70 m.                                                                                     |
| `airJumpHeight` | 120   | **105**  | Cada pulo aéreo sobe um pouco menos. Com 2 pulos, ainda sobe 210 px (os outros: 125 a 160). |
| `gravity`       | 0,56  | **0,60** | Flutua um pouco menos. Continua o mais flutuante do elenco.                                 |
| `maxFallSpeed`  | 9,5   | **10**   | Acompanha a gravidade.                                                                      |

Resultado: recuperação de 756 para ~676 px. Ainda é a melhor do jogo com folga (o segundo tem ~470).

Não muda: `fastFallSpeed` 15 (a descida mais lenta: é o preço dele), o Frango (5%, recarga 42: é
fraco de propósito e a recarga curta é a identidade), peso 86, 2 pulos aéreos.

### Dadazinho

Problema: a altura nova. Ele era o menor alvo do elenco (44 × 88) e passa a ter altura média
(44 × 96, o corpo do Meia). É uma perda pequena, mas é a principal defesa de quem morre com 105%.
A faixa de queda rápida cobre essa perda; não precisa de mais nada.

| Campo                      | Antes                           | Depois                                                          | Motivo                                                    |
| -------------------------- | ------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------- |
| `hurtbox.h`                | 88                              | **96**                                                          | 1,70 m.                                                   |
| `gravity`                  | 0,66                            | **0,70**                                                        | Faixa rápida.                                             |
| `maxFallSpeed`             | 11                              | **12**                                                          | Faixa rápida.                                             |
| `fastFallSpeed`            | 17,5                            | **19**                                                          | Faixa rápida (8 ticks). É a compensação pelo corpo maior. |
| `special.blocks[0].offset` | `{ x: 52, y: -22 }`             | `{ x: 56, y: -24 }`                                             | Acompanha a altura (o tiro sai do cano).                  |
| `blurb`                    | "...leve, rápido e baixinho..." | "Punisher: leve, rápido e magro. A doze pune quem chega perto." | Não é mais o baixinho do elenco.                          |

Limpeza sem efeito no jogo: `neutralLight: { startup: 4, damage: 5 }` e `neutralAir: { damage: 7 }`
repetem os valores base (não mudam nada). Podem sair, deixando só `sideLight: { damage: 7, recovery: 10 }`.
O comentário "golpes rápidos e fracos" não descreve o que a ficha faz; trocar por "soco lateral mais
fraco e com menos recovery".

Não muda: a Doze (15%, 20 de startup, recarga 100: já é forte e bem cobrada), peso 84,
`walkSpeed` 7, `airSpeed` 6, `airJumpHeight` 130. A recuperação cai um pouco com a gravidade maior
(462 → 438 px).

O alcance total da Doze sobe ~4 px (o cano está mais à frente). O tiro continua acertando o
personagem mais baixo em pé (a caixa fica de 50 a 94 px do chão; Tauba e Marília têm 90).

### Tauba

**Sem mudança.** Está no meio do orçamento. Não tem dano no especial, mas o Silent quit é uma
recuperação garantida a cada 4 s (sempre cai num chão) e uma fuga de pressão; os números dele são
todos um pouco acima da média (chão 6,8, ar 6, pulo 178) com corpo pequeno. A altura já estava certa.

### Tchula

Problema: paga demais. É lento no chão (5,8), o 2º mais lento no ar (5,1) e tem os golpes base mais
lentos do elenco, tudo para ter a Scout, que tem 28 de startup e 150 de recarga.

| Campo           | Antes | Depois  | Motivo                                                                       |
| --------------- | ----- | ------- | ---------------------------------------------------------------------------- |
| `hurtbox.h`     | 98    | **96**  | 1,70 m.                                                                      |
| `walkSpeed`     | 5,8   | **6,0** | Um sniper precisa conseguir abrir distância. Continua abaixo da média (6,5). |
| `maxFallSpeed`  | 11,5  | **12**  | Faixa rápida.                                                                |
| `fastFallSpeed` | 17,5  | **19**  | Faixa rápida (8 ticks).                                                      |

Não muda: a Scout inteira, os golpes base (mais lentos e mais fortes: a troca é justa), peso 108.

### Crocko

Pouco abaixo da média. Ajuste pequeno.

| Campo           | Antes | Depois  | Motivo                  |
| --------------- | ----- | ------- | ----------------------- |
| `hurtbox.h`     | 106   | **104** | 1,80 m.                 |
| `maxFallSpeed`  | 11,8  | **12**  | Faixa rápida.           |
| `fastFallSpeed` | 18    | **19**  | Faixa rápida (8 ticks). |

Não muda: a Correção postural, o alcance dos golpes, peso 114. Trocar o comentário da ficha: ele não
é mais "o mais alto do elenco".

### Darllan

Pensei em baixar o peso dele (124 é muito: morre só com ~177%), mas ele já paga: o mais lento no
chão e no ar, o pulo mais baixo, a pior recuperação (350 px) e o maior corpo. Fica como está, só com
a altura e a faixa de queda.

| Campo           | Antes | Depois  | Motivo                  |
| --------------- | ----- | ------- | ----------------------- |
| `hurtbox.h`     | 106   | **104** | 1,80 m.                 |
| `fastFallSpeed` | 18,5  | **19**  | Faixa rápida (8 ticks). |

Não muda: peso 124, os golpes mais fortes, o Rolo na bancada.

### Gabs

Problema: o mais fraco do elenco, com folga. É quase tão pesado e lento quanto o Tchula e o Crocko,
mas sem os golpes fortes de um nem o alcance do outro, e com o corpo mais largo depois do Darllan.
O especial exige distância exata e dá pouco.

| Campo                                  | Antes | Depois   | Motivo                                                                                      |
| -------------------------------------- | ----- | -------- | ------------------------------------------------------------------------------------------- |
| `walkSpeed`                            | 5,8   | **6,1**  | Um espaçador precisa acertar a distância; com 5,8 ele não consegue se posicionar.           |
| `airSpeed`                             | 5,3   | **5,5**  | Vai para a média.                                                                           |
| `gravity`                              | 0,68  | **0,70** | Faixa rápida.                                                                               |
| `maxFallSpeed`                         | 11,5  | **12**   | Faixa rápida.                                                                               |
| `fastFallSpeed`                        | 17,5  | **19**   | Faixa rápida (8 ticks).                                                                     |
| `special.startup`                      | 14    | **12**   | O alvo sai do ponto fixo andando; 2 ticks a menos ajudam a acertar.                         |
| `special.blocks[0].hit.damage`         | 11    | **13**   | Entre o Saque (8) e o Rolo (15): é mais difícil de acertar que o Rolo, mas acerta de longe. |
| `special.blocks[0].hit.baseKnockback`  | 8     | **9,5**  | Passa a afastar de verdade quem levou.                                                      |
| `special.blocks[0].hit.knockbackScale` | 0,16  | **0,19** | Mata em % alto, como os outros especiais de dano (0,19 a 0,21).                             |

Não muda: o ponto cego (é o que faz o personagem), a área, o recovery 22, a recarga 60, peso 110,
altura.

### Marília

Pouco abaixo da média. A aura é forte, mas custa 40 ticks vulnerável e 8 s de recarga, e os golpes
dela são os mais fracos.

| Campo           | Antes         | Depois   | Motivo                                               |
| --------------- | ------------- | -------- | ---------------------------------------------------- |
| `gravity`       | 0,65 (padrão) | **0,70** | Faixa rápida.                                        |
| `maxFallSpeed`  | 11 (padrão)   | **12**   | Faixa rápida.                                        |
| `fastFallSpeed` | 17 (padrão)   | **19**   | Faixa rápida (8 ticks): combina com "vai para cima". |

Não muda: a Tragadinha inteira (startup 40, aura 120, recarga 480), os golpes, peso 88, altura.

### Meia

Problema: acima da média. Tem velocidade e corpo de personagem leve, e os golpes base são 1 tick
mais rápidos em 6 golpes, o que mais do que paga o 1% a menos. O especial sai em 6 ticks e ganha do
contra-ataque.

| Campo              | Antes | Depois  | Motivo                                                                                  |
| ------------------ | ----- | ------- | --------------------------------------------------------------------------------------- |
| `weight`           | 90    | **88**  | Magro; fica igual à Marília. Morre com ~112% em vez de ~116%.                           |
| `airSpeed`         | 6     | **5,8** | O jogo dele é no chão, colado. No ar fica bom, não ótimo.                               |
| `special.recovery` | 32    | **36**  | Errar o agarrão mais rápido do jogo tem que custar: a janela de punição cresce 4 ticks. |

Não muda: os golpes rápidos (identidade), `walkSpeed` 7, o Comando (16%, prende 60, recarga 90),
queda média, altura.

### Igão

Pouco abaixo da média: peso médio, um dos maiores corpos, especial fraco em dano.

| Campo           | Antes       | Depois   | Motivo                                                                      |
| --------------- | ----------- | -------- | --------------------------------------------------------------------------- |
| `gravity`       | 0,66        | **0,70** | Faixa rápida.                                                               |
| `maxFallSpeed`  | 11 (padrão) | **12**   | Faixa rápida.                                                               |
| `fastFallSpeed` | 17 (padrão) | **19**   | Faixa rápida (8 ticks): sobe mais alto que todos e desce rápido para bater. |

Não muda: o pulo mais alto (200 / 160), o Saque (a bola tem gravidade própria: os quiques não
mudam), os aéreos, peso 100, altura. Trocar os comentários: ele não é mais "o mais alto" sozinho
nem tem "a maior hurtbox" (em área, Schummaki e Darllan são maiores).

## Resultado esperado

Calculado com as fórmulas do `sim` para os valores propostos:

| Personagem  | Peso      | Morre com (meio do palco) | Descer 150 px | Recuperação (px) | Área do corpo (px²) |
| ----------- | --------- | ------------------------- | ------------- | ---------------- | ------------------- |
| Schummaki   | 112 → 106 | 156% → 145%               | 9 → 8         | 371              | 5200 → 5824         |
| João Frango | 86        | 109%                      | 10            | 756 → 676        | 4232 → 4416         |
| Dadazinho   | 84        | 105%                      | 9 → 8         | 462 → 438        | 3872 → 4224         |
| Tauba       | 92        | 120%                      | 9             | 474              | 4140                |
| Tchula      | 108       | 148%                      | 9 → 8         | 367              | 4900 → 4800         |
| Crocko      | 114       | 159%                      | 9 → 8         | 380              | 5300 → 5200         |
| Darllan     | 124       | 177%                      | 9 → 8         | 350              | 5936 → 5824         |
| Gabs        | 110       | 152%                      | 9 → 8         | 398 → 402        | 5184                |
| Marília     | 88        | 113%                      | 9 → 8         | 478 → 443        | 3960                |
| Meia        | 90 → 88   | 116% → 112%               | 9             | 486 → 470        | 4224                |
| Igão        | 100       | 134%                      | 9 → 8         | 473 → 439        | 5600                |

## Instruções para executar

Para quem for aplicar esta proposta (seguir também o `CLAUDE.md`):

1. Criar a branch `feat/balanceamento`.
2. Alterar **só** as fichas em `packages/sim/src/characters/`. Não mexer em `stats.ts`
   (`DEFAULT_STATS`), `moves.ts` nem nas constantes de `fighter.ts` e `combat.ts`.
3. Aplicar exatamente os valores das tabelas de [Ficha por ficha](#ficha-por-ficha). Campo que não
   aparece na tabela não muda. Onde a tabela diz "(padrão)" no antes, o campo não existe na ficha
   hoje: acrescentar.
4. Um commit por personagem (`feat(sim): rebalance <personagem>`), com os testes e o lint passando.
5. Atualizar os comentários do topo de cada ficha alterada para descrever os números novos.
6. Atualizar os testes (lista abaixo) no mesmo commit do personagem que os quebra.
7. Atualizar a documentação (lista abaixo).
8. Conferir no navegador (lista abaixo).

### Testes que quebram (`packages/sim/src/characters/characters.test.ts`)

| Teste                                      | Linha que quebra                                                | Como fica                                                                                                |
| ------------------------------------------ | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| "Dadazinho pune de perto ... baixinho"     | `DADA.stats.height` menor que `JOAO.stats.height`               | Igual à do João; tirar "baixinho" do nome                                                                |
| "Crocko espera vir ... o mais alto"        | Crocko mais alto que Schummaki, João, Dadazinho, Tauba e Tchula | Tirar o Schummaki da lista (ele é mais alto que o Crocko); igual ao Darllan; tirar "o mais alto" do nome |
| "Gabs: altura média..."                    | `GABS.stats.height` maior que `DADA.stats.height`               | Igual à do Dadazinho; maior que a do Tauba                                                               |
| "Gabs: o bonequinho acerta..."             | `target.damage` igual a 11                                      | 13                                                                                                       |
| "Igão: o pulo mais alto e a maior hurtbox" | `IGAO.stats.height` maior que a de todos                        | Maior ou igual; igual à do Schummaki; ajustar o nome                                                     |

Os outros testes desse arquivo continuam valendo com os números novos (conferi um a um: Darllan
continua o mais pesado, o mais lento e de pulo mais baixo; Marília com recarga 480 e altura do
Tauba; Meia com 16% e altura do Gabs; todos alcançam a plataforma com 1 pulo, porque a altura do
pulo não mudou). Rodar `pnpm test` inteiro: outros arquivos de teste podem usar números de alguma
ficha.

### Documentação

- `docs/GDD.md`: tabela "Os personagens jogáveis" (peso do Schummaki e do Meia; chão do
  Tchula e do Gabs; ar do Gabs e do Meia; recarga da Arrancada; números do Controle na mão;
  recovery do Comando) e o parágrafo do Igão ("a maior hurtbox").
- `docs/GDD.md`, seção Movimento: uma linha dizendo que a velocidade de descida varia por
  personagem (3 faixas).
- `docs/ELENCO.md`: alturas na tabela e em "Quem é" (Dadazinho 1,68 → 1,70; Tchula 1,74 → 1,70;
  Crocko e Darllan 1,84 → 1,80; Gabs e Meia 1,72 → 1,70; acrescentar Schummaki 1,90 e João 1,70);
  trocar "baixinho" do Dadazinho por "estatura média" e tirar "o mais alto do elenco" do Igão e
  do Crocko.
- `docs/ROADMAP.md`: marcar a tarefa de balanceamento correspondente, se houver.

As fichas de arte em inglês do `ELENCO.md` (os prompts, que dizem "short and skinny" para o
Dadazinho) descrevem imagens já geradas. **Não alterar sem o usuário pedir.**

### Conferir no navegador

- `http://localhost:5173/?rig`, todos lado a lado: as alturas na ordem certa (Tauba = Marília;
  João = Dadazinho = Tchula = Gabs = Meia; Crocko = Darllan; Schummaki = Igão).
- **Schummaki** cresce 12% e **Dadazinho** 9%, porque a arte é escalada pela hurtbox. Conferir a
  proporção dos dois e, no especial do Dadazinho, se o tiro sai do cano. Se a proporção ficar
  estranha, o acerto é no `stretch` do `recortes.json` do personagem, e isso é trabalho de arte:
  avisar o usuário em vez de mexer.
- Na luta: descer da plataforma com o Darllan, com o Tauba e com o João, e ver a diferença.
- Console sem erros.

Replays gravados antes da mudança deixam de valer (o jogo já avisa pelo hash).

## Pontos para o revisor decidir

1. **Peso do Schummaki (106).** Se a ideia é ele continuar "pesado", dá para manter 112 e tirar
   mais dos golpes base. Prefiro o peso: é a mudança mais simples de sentir.
2. **Oito personagens na mesma faixa de queda.** A diferença vai de 8 a 10 ticks, com a maioria em 8. Se depois de jogar a diferença parecer pequena, o próximo passo é abrir mais as faixas (por
   exemplo 21,5 / 17 / 14, que dá 7 / 9 / 11 ticks), não mudar quem está em qual.
3. **Darllan com 124 de peso.** Deixei. Se nas partidas ele se mostrar difícil demais de matar,
   baixar para 120 é o primeiro ajuste.
4. **Tudo aqui é conta, não partida jogada.** Os números de KO, descida e recuperação são
   calculados; as notas de golpes e especiais são julgamento. Vale jogar algumas lutas depois de
   aplicar e ajustar o que parecer errado.
