# Balanceamento dos especiais — 2ª rodada (depois de os amigos jogarem)

Este arquivo é o pedido de trabalho para quem for aplicar as mudanças. Ele substitui nada: o
`docs/BALANCEAMENTO.md` (1ª rodada, já aplicada) continua valendo como histórico e **não deve ser
alterado**.

Origem: os amigos jogaram, gostaram, e repararam principalmente nos **especiais**. Esta rodada mexe
em 8 personagens, quase só no especial. O jogo é casual: a meta é cada especial ser divertido de
usar e justo de enfrentar, não equilíbrio de torneio.

Leia antes: `CLAUDE.md` (regras de arquitetura e de commits) e a seção
[Instruções para executar](#instruções-para-executar) no fim.

## Resumo

Tempos em ticks (60 = 1 s). S / A / R = startup / active / recovery. A recarga (`cooldownTicks`)
conta do começo do especial.

| Personagem  | O que muda                                                                                                                | Tipo               |
| ----------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| Crocko      | Janela do contra-ataque 20 → 60; recarga 90 → 150; devolve a bola do Igão direito; efeito ciano                           | Reforço + código   |
| Marília     | Aura deixa de anular golpe e passa a cortar o dano pela metade; dura 120 → 300; recarga 480 → 450; correção de desempenho | Reforço + código   |
| Tauba       | Teleporte vai sempre para a ponta mais próxima do palco; recarga 240 → 300                                                | Contenção + código |
| Igão        | Bola: dano 8 → 11, 4 quiques mais altos, vai mais longe                                                                   | Reforço            |
| João Frango | Frango mais rápido (9,5 → 10,5), mesmo alcance; recarga 42 → 54                                                           | Ajuste             |
| Darllan     | Peso 124 → 118; startup do Rolo 18 → 24; recarga 60 → 100                                                                 | Contenção          |
| Schummaki   | Arrancada: dano 13 → 12; recarga 75 → 110                                                                                 | Contenção          |
| Meia        | Combo dura metade (60 → 30 ticks, "5 HITS"); dano 16 → 15; mais rápido no chão                                            | Ajuste             |

Não mudam: Dadazinho, Tchula, Gabs. Moveset base (`moves.ts`), padrões (`stats.ts`) e as constantes
de `combat.ts` não mudam.

### Especiais: antes e depois

| Personagem  | S / A / R antes | S / A / R depois | Recarga   | Dano      | Efeito                                       |
| ----------- | --------------- | ---------------- | --------- | --------- | -------------------------------------------- |
| Crocko      | 6 / 20 / 28     | 6 / **60** / 28  | 90 → 150  | 14%       | Janela de 1/3 s → 1 s                        |
| Marília     | 40 / 1 / 12     | 40 / 1 / 12      | 480 → 450 | —         | Invencível 2 s → metade do dano por 5 s      |
| Tauba       | 14 / 20 / 18    | 14 / 20 / 18     | 240 → 300 | —         | Lugar sorteado → ponta mais próxima do palco |
| Igão        | 18 / 1 / 18     | 18 / 1 / 18      | 90        | 8% → 11%  | 3 quiques, ~620 px → 4 quiques, ~800 px      |
| João Frango | 10 / 1 / 16     | 10 / 1 / 16      | 42 → 54   | 5%        | 9,5 → 10,5 px/tick, ~570 px                  |
| Darllan     | 18 / 5 / 26     | **24** / 5 / 26  | 60 → 100  | 15%       | Mesma área                                   |
| Schummaki   | 16 / 14 / 20    | 16 / 14 / 20     | 75 → 110  | 13% → 12% | Mesma investida                              |
| Meia        | 6 / 4 / 36      | 6 / 4 / 36       | 90        | 16% → 15% | Preso 60 → 30 ticks; 10 golpes → 5           |

---

## Crocko — Correção postural

Arquivo: `packages/sim/src/characters/crocko.ts`.

### Números

| Campo                   | Antes | Depois  | Motivo                                                                                |
| ----------------------- | ----- | ------- | ------------------------------------------------------------------------------------- |
| `special.active`        | 20    | **60**  | 1/3 de segundo era curto demais para alguém bater nele dentro da janela. Agora é 1 s. |
| `special.cooldownTicks` | 90    | **150** | Ver abaixo: 100 deixaria o contra-ataque ligado 60% do tempo.                         |

Não muda: startup 6, recovery 28, o acerto devolvido (14% a 40°, 11 / 0,20).

**Por que 150 e não 100 (o valor que o usuário sugeriu):** o especial inteiro passa a durar
6 + 60 + 28 = 94 ticks. Com recarga 100, sobrariam 6 ticks entre o fim de um e o começo do
outro: ele ficaria em contra-ataque 60 de cada 100 ticks, e contra quem só tem golpe e projétil
isso é quase um escudo permanente (só o agarrão do Meia passa). Com 150:

|                                         | Antes (20 / 90) | Sugerido (60 / 100) | Proposto (60 / 150) |
| --------------------------------------- | --------------- | ------------------- | ------------------- |
| Janela aberta                           | 20 ticks        | 60 ticks            | 60 ticks            |
| Tempo com a janela aberta (no máximo)   | 22%             | 60%                 | 40%                 |
| Ticks sem especial depois que ele acaba | 36              | 6                   | 56                  |

Fica 3 vezes mais fácil de acertar o contra-ataque, e o adversário ainda tem quase 1 s garantido
sem contra-ataque depois de cada uso, além dos 28 ticks de recovery para punir quem errou. Se,
jogando, ainda parecer fraco, o próximo passo é baixar a recarga para 130, não aumentar a janela.

### Devolver a bola do Igão

O código já devolve projétil (`resolveProjectileHits` em `combat.ts`: troca o dono e inverte o
`vx`). Na prática, com a bola do Igão não parece que devolveu, por três motivos (**confirmar com um
teste antes de corrigir**):

1. A bola devolvida mantém o `ticksLeft` e os `bounces` que sobravam. Quase sempre ela já quicou
   e está no fim da vida: some logo depois de virar, ou no próximo toque no chão.
2. Não há evento no `sim` para "projétil devolvido": o jogo não toca som nem mostra efeito.
3. A bola continua com a aparência de bola do Igão, indo embora sem destaque.

O que fazer no `sim`:

- `Projectile` (`projectile.ts`) passa a guardar o tempo de vida e os quiques originais (dois
  campos novos, preenchidos em `spawnProjectile`). Conferir `snapshot.ts` e os testes que montam
  projétil na mão (`special.test.ts`, `teams.test.ts`).
- Ao devolver, em `resolveProjectileHits`: `ticksLeft` e `bounces` voltam ao valor original. A
  bola devolvida faz o caminho de volta inteiro, quicando. Vale para qualquer projétil (o frango, o
  tiro), não só a bola.
- Novo evento em `events.ts` (por exemplo `{ type: 'reflect', fighter, from, x, y }`: quem
  devolveu, de quem era, ponto de contato). Evento não entra no estado: não afeta determinismo.
- Dano e knockback do projétil devolvido continuam os do projétil (a bola devolve 11%, não 14%).

Testes novos (`special.test.ts` ou `characters.test.ts`): Igão saca contra o Crocko em
contra-ataque a ~150, ~300 e ~500 px; nos três casos a bola volta e acerta o Igão se ele ficar
parado, e sai 1 evento `reflect`.

### Efeito ciano no contra-ataque

Hoje, quando o contra-ataque pega, saem um estalo e umas linhas pequenas (`spawnCounterHitFx` em
`FightScene.ts`) e um brilho perto da cabeça. Os amigos não percebem que foi contra-ataque. Precisa
ficar óbvio para quem controla o Crocko e para os adversários.

Acrescentar `color` ao `counter` de `CharacterFx` (`render/fx.ts`); no Crocko, um ciano claro
puxado do turquesa dele (`#1ba39c`), por exemplo `0x3fe8e0`. Quando o contra-ataque pega (evento
`hit` de tipo `counter` **e** o evento novo `reflect`):

- um clarão ciano grande no ponto de contato (textura `FX_TEXTURE.glow`, aditivo, com `tint`), e um
  anel de onda de choque ciano abrindo (a textura de anel que já existe em `fxTextures.ts`);
- o boneco do Crocko pisca em ciano por ~10 ticks (`setTint`, do jeito que o `flashUntil` já faz
  com o branco);
- no golpe devolvido, quem levou também pisca em ciano no lugar do branco;
- o projétil devolvido fica pintado de ciano até sumir (o desenho do projétil sabe quem é o dono:
  dono com `counter.color` e que não é o dono original = pintado);
- o som `counter` já toca no golpe; tocar também no `reflect`.

**Não usar `postFX`/`preFX` do Phaser** (ver a correção de desempenho da Marília). Tudo com
sprites aditivos e `tint`, que são baratos.

Os anéis que sobem pelo corpo durante a janela (`spawnCounterFx`, um a cada 7 ticks) continuam;
com a janela de 60 ticks saem ~9 em vez de 3, o que já ajuda a ver que a janela está aberta. Se
couber, pintar esses anéis com a mesma cor.

### Conferir

- A animação `crocko_special` usa `timing: 'move'` (estica com o active): a pose de pilates dura
  1 s. Olhar no `?rig` se não ficou parada demais.
- O tutorial usa o contra-ataque do Crocko (`tutorial/lessons.ts`, `tutorial/director.ts`): a
  lição continua funcionando com a janela e a recarga novas (a demonstração tem tempos próprios).
- Teste "Crocko espera vir: contra-ataque curto e forte..." (`characters.test.ts`): ajustar o nome
  e os limites (a janela não é mais curta).

---

## Marília — Tragadinha

Arquivos: `packages/sim/src/characters/marilia.ts`, `character.ts`, `moves.ts`, `fighter.ts`,
`combat.ts`; no jogo, `FightScene.ts`, `FighterView.ts`, `render/fx.ts`.

### Regra nova

A aura deixa de fazer os golpes passarem por ela. Com a aura ligada, a Marília **leva o golpe
normalmente** (knockback, hitstun, agarrão), mas o **dano é cortado pela metade**.

| Campo                          | Antes  | Depois    | Motivo                                                                |
| ------------------------------ | ------ | --------- | --------------------------------------------------------------------- |
| `blocks[0].invulnerable`       | `true` | **tirar** | Não é mais invencível.                                                |
| `blocks[0].damageTakenPercent` | —      | **50**    | Campo novo do bloco buff: % do dano recebido que vale (100 = normal). |
| `blocks[0].durationTicks`      | 120    | **300**   | "Aumentar bastante": de 2 s para 5 s.                                 |
| `special.cooldownTicks`        | 480    | **450**   | Um pouco menor, mantendo uma janela sem aura.                         |

Não muda: startup 40 (vulnerável: apanhando, o especial cai e a recarga já contou), active 1,
recovery 12.

Linha do tempo de um uso (ticks desde o começo do especial): tragada 1–40, aura 41–340, sem aura
341–450, e a próxima tragada leva mais 40. Ou seja, entre uma aura e outra há **pelo menos 150
ticks (2,5 s) sem proteção**, 40 deles parada fumando: é a janela para bater nela.

Conta de equilíbrio:

|                                  | Antes                  | Depois                 |
| -------------------------------- | ---------------------- | ---------------------- |
| Aura ligada (no máximo)          | 120 de 480 ticks (25%) | 300 de 490 ticks (61%) |
| Dano que ela leva, na média      | 75% (zero na aura)     | ~70% (metade na aura)  |
| Dá para matar com a aura ligada? | Não                    | Sim                    |
| Dá para agarrar / interromper?   | Não                    | Sim                    |

O dano evitado no total é parecido, mas a aura cobre muito mais tempo e deixa de ser "tudo ou
nada": ela fica mais útil para quem usa (fica ligada na maior parte da luta) e menos frustrante
para quem enfrenta (sempre dá para bater e arremessar). Como o knockback usa o % acumulado, levar
metade do dano faz ela demorar mais para chegar no % de morrer: com 88 de peso ela morre com
~113%; usando bem a aura, é como se aguentasse ~150%. Se ficar forte demais, o primeiro ajuste é
`damageTakenPercent` 60, não a duração.

### Como implementar no `sim`

- `BuffBlock` (`character.ts`) ganha `damageTakenPercent: int(10, 100).default(100)`; `BuffDef`
  (`moves.ts`) e `Fighter` (`fighter.ts`: campo novo ao lado de `buffDamage`, zerado em
  `clearBuff`, copiado em `fireBlocks`, e no snapshot) acompanham.
- Nova função em `fighter.ts`, ao lado de `dealtDamage`: dano recebido =
  `idiv(damage * percentual, 100)`, **no mínimo 1** quando o dano original é maior que 0 (senão o
  golpe de 1% do combo do Meia vira 0). Só inteiros.
- Aplicar em todo lugar que soma dano no alvo: `launch` (golpe, contra-ataque, projétil,
  arremesso) e os golpes do combo em `stepGrabs`. O hitstop continua calculado com o dano
  original (o impacto parece o mesmo). O evento `hit` leva o dano que valeu de verdade, e um campo
  novo `reduced: true` quando foi cortado.
- O bloco continua genérico: `invulnerable` fica no schema e no código (os testes de
  `special.test.ts` sobre a aura invencível continuam valendo), só não é mais usado pela Marília.
- Atualizar a ficha: comentário do topo, `blurb` ("...com a aura, não sente golpe nenhum" →
  algo como "Destemida: fuma o palheiro e, com a aura, sente só metade do golpe.") e o comentário
  da recarga.
- Testes da Marília em `characters.test.ts` ("com a aura, o golpe passa...", recarga 480):
  reescrever para a regra nova (com a aura leva knockback e metade do dano; sem a aura, dano
  inteiro; apanhando no startup a aura não liga).

### Como fica na tela

- O brilho e os fiapos de fumaça hoje dependem de `hasAura(f)` (que exige `invulnerable`). Passam
  a depender de o buff estar ligado (`f.buffTicks > 0`) no personagem que tem `aura` no
  `CHARACTER_FX`.
- Golpe com `reduced: true`: reaproveitar a estrelinha verde e o "plim" do `onAuraPass` (menores,
  junto com o impacto normal), para o adversário ver que o golpe pegou mais fraco.
- O piscar no fim (`blinkTicks: 30`) continua, avisando que a aura vai acabar.

### Correção de desempenho (o jogo trava quando ela solta o especial)

Causa: a aura usa o efeito **Glow do Phaser no container do boneco** (`setGlow` em
`render/FighterView.ts`, chamado por `drawAura` em `FightScene.ts`). É o único `postFX` do jogo.
Efeito de pós-processamento em container faz o Phaser desenhar o boneco em texturas do tamanho do
canvas e rodar o shader do Glow em cada pixel delas. Com `quality 0.12` e `distance 14`, o shader
lê a textura ~730 vezes por pixel (53 ângulos × 14 distâncias), e o canvas é do tamanho da tela
(`RENDER_SCALE` até 3: até 3840 × 2160). São bilhões de leituras por quadro enquanto a aura está
ligada. Além disso, nos últimos 30 ticks o efeito é removido e recriado a cada 4 ticks (o piscar).
Com a aura durando 5 s em vez de 2, o problema ficaria 2,5 vezes mais longo.

O que fazer:

- **Remover o Glow**: apagar `setGlow` e o campo `glow` do `FighterView`, e não usar
  `postFX`/`preFX` em lugar nenhum da luta.
- No lugar, um brilho barato: uma imagem com a textura `FX_TEXTURE.glow`, aditiva, pintada com
  `aura.color`, **atrás** do boneco, do tamanho do corpo (um pouco maior que a hurtbox, mais alta
  que larga), pulsando em escala e alpha com a mesma conta de hoje
  (`4.2 + 1.2 * sin(tick * 0.22)` vira um alpha/escala equivalente). Uma imagem por lutador que
  tem aura, criada uma vez e só escondida/mostrada (nada de criar e destruir no piscar).
- Os fiapos (`spawnAuraWisp`, 1 a cada 4 ticks) e a baforada (13 partículas, 1 vez) são baratos e
  ficam.
- Atualizar o comentário do `aura` em `render/fx.ts` (fala do Glow do Phaser) e o trecho
  correspondente do `docs/ARTE.md`/`docs/GDD.md`, se citarem o Glow.

Como conferir: no navegador, com o painel de desempenho do DevTools (ou o contador de FPS do modo
debug, se houver), comparar o tempo de quadro com a aura desligada e ligada, em tela cheia. Tem que
ficar igual. Antes da correção dá para ver a queda do mesmo jeito, para ter a comparação.

---

## Tauba — Silent quit

Arquivos: `packages/sim/src/characters/tauba.ts`, `character.ts`, `moves.ts`, `fighter.ts`.

### O que está acontecendo

O teleporte foi feito para fugir de pressão, mas virou recuperação: arremessado para longe, o
jogador espera o hitstun acabar, aperta o especial e reaparece num lugar sorteado do palco, quase
sempre longe do adversário. É divertido e compensa o especial não dar dano, mas está forte demais:
ele volta de qualquer lugar e ainda cai num lugar seguro.

### Regra nova

O Tauba some como hoje e reaparece **sempre na ponta do palco mais próxima dele**.

- "Palco" aqui são os blocos sólidos (`kind: 'solid'`), não as plataformas atravessáveis. No mapa
  atual são as duas pontas da plataforma principal (x = −450 e x = +450, y = 0). As plataformas
  pequenas ficam de fora: senão, do meio do palco, ele iria para a quina de dentro de uma delas.
- "Mais próxima" é pela distância horizontal entre o centro dos pés e a quina. Empate: a quina do
  lado para onde ele está virado.
- Reaparece em pé em cima do bloco, com o corpo inteiro dentro dele: centro a
  `metade da largura + TELEPORT_EDGE_MARGIN` (12 px) da quina, como os pontos sorteados de hoje.
- O resto do reaparecimento fica igual: zera velocidade e knockback, vira para o adversário mais
  perto, sem invencibilidade no recovery (18 ticks).

Exemplos: caindo no buraco da direita → ponta direita. Em cima do palco em x = +100 → ponta
direita. Em cima da plataforma pequena da esquerda → ponta esquerda.

| Campo                   | Antes                                             | Depois           | Motivo                                                                       |
| ----------------------- | ------------------------------------------------- | ---------------- | ---------------------------------------------------------------------------- |
| `blocks[0]`             | `target: 'random', candidates: 3, nearChance: 25` | `target: 'edge'` | Destino previsível, na borda.                                                |
| `special.cooldownTicks` | 240                                               | **300**          | De 4 s para 5 s entre usos: se for arremessado de novo logo depois, não tem. |

Não muda: 14 / 20 / 18, `oncePerAir`, `hoverStartup`.

Por que isso equilibra sem tirar a graça: ele continua voltando de qualquer lugar (a recuperação
garantida, que os amigos gostaram, fica), mas volta **na borda**, o lugar mais perigoso do palco, e
todo mundo sabe onde. O adversário pode esperar lá e bater nos 18 ticks de recovery. Usar como fuga
no meio da luta também passa a custar posição: ele sai do centro e vai para o canto. Sem dano no
especial e com corpo e números só um pouco acima da média, não precisa de mais contenção que essa.

### Como implementar

- `TeleportBlock.target` ganha o valor `'edge'` (é um modo do bloco que já existe, não um bloco
  novo). O modo `'random'` continua no schema e no código, com os testes dele.
- Hoje o "sumir e reaparecer" está preso a `move.teleport.random` em vários lugares: `isVanished`,
  `stepAttack` (chama `reappear`), `moveFrameEffects`, a checagem em torno da linha 909 de
  `fighter.ts`, e no jogo `FightScene.ts` (`fx.vanishSquares && move.teleport?.random`,
  `quitAlpha`). Generalizar para "teleporte que some" com os dois destinos (sorteado ou ponta), e
  procurar por `teleport?.random` e `teleport.random` no repositório inteiro.
- O modo `'edge'` não usa o RNG. Como o Tauba deixa de consumir números sorteados, a luta do teste
  de determinismo muda: se "a luta do teste tem de tudo" quebrar, trocar a seed (já foi feito uma
  vez na 1ª rodada).
- Testes novos: de fora do palco à direita e abaixo → ponta direita; de cima do palco à esquerda
  do centro → ponta esquerda; de cima de uma plataforma pequena → ponta do mesmo lado; reaparece
  em pé, dentro do bloco, sem velocidade.
- Atualizar o teste da ficha em `characters.test.ts`
  (`special?.move.teleport?.random` igual a `{ candidates: 3, nearChance: 25 }`), o comentário do
  topo da ficha e o `blurb` ("some do nada e volta onde ninguém espera" não é mais verdade; algo
  como "Fujão: some do nada e reaparece na beira do palco.").

---

## Igão — Saque

Arquivo: `packages/sim/src/characters/igao.ts`.

| Campo                     | Antes | Depois  | Motivo                                                                                  |
| ------------------------- | ----- | ------- | --------------------------------------------------------------------------------------- |
| `blocks[0].hit.damage`    | 8     | **11**  | Pedido. Igual ao aéreo lateral base; ainda abaixo de todo especial de golpe (12 a 18%). |
| `blocks[0].bounces`       | 3     | **4**   | Quica mais vezes.                                                                       |
| `blocks[0].bounceKeep`    | 72    | **78**  | Cada quique sobe mais.                                                                  |
| `blocks[0].lifetimeTicks` | 85    | **110** | Sem isso a bola some antes do 4º quique.                                                |

Não muda: startup 18, recovery 18, recarga 90, velocidade 9,5 a 40° para baixo, gravidade 0,45, e
o knockback (7 / 0,10): a bola continua sem matar. É o que segura o reforço: mais dano e mais
alcance, mas ainda é ferramenta de incomodar e obrigar a pular, não de finalizar.

Trajetória calculada (aproximada; a conta do `sim` é em inteiros e pode dar alguns px de diferença):

|                    | Antes          | Depois             |
| ------------------ | -------------- | ------------------ |
| Altura dos quiques | ~70, 37, 19 px | ~83, 51, 31, 19 px |
| Distância total    | ~620 px        | ~800 px            |
| Tempo em quadra    | 85 ticks       | 110 ticks          |

Cuidado: o 1º quique não pode passar por cima de quem está parado. Os mais baixos (Tauba e
Marília) têm 90 px; a base da bola chega a ~83. **Conferir com teste**: a altura do 1º quique tem
que ficar abaixo de 90 px. Se passar, baixar `bounceKeep` para 76.

Com 800 px a bola sacada do meio do palco (900 px de largura) cai pela borda no fim: tudo bem.

Atualizar: os testes do Saque em `characters.test.ts` (3 quiques, alturas, distância), o comentário
da ficha (alturas e "quica 3 vezes") e a linha do Igão no GDD.

---

## João Frango — Frango assado voador

Arquivo: `packages/sim/src/characters/joao-frango.ts`.

| Campo                     | Antes | Depois   | Motivo                                                                               |
| ------------------------- | ----- | -------- | ------------------------------------------------------------------------------------ |
| `blocks[0].speed`         | 9,5   | **10,5** | Um pouquinho mais rápido: mais difícil de desviar andando.                           |
| `blocks[0].lifetimeTicks` | 60    | **54**   | Mantém o alcance (10,5 × 54 = 567 px; era 570). Só a velocidade muda, não o alcance. |
| `special.cooldownTicks`   | 42    | **54**   | Um pouquinho mais de recarga, para compensar o projétil melhor.                      |

Não muda: 10 / 1 / 16, dano 5%, knockback 6 / 0,05.

Com 27 ticks de especial e 54 de recarga, sobram 27 ticks sem frango depois de cada tiro (eram 15):
continua sendo o especial de recarga mais curta do jogo, que é a identidade do zoner, mas dá um
respiro maior para quem tenta chegar perto.

---

## Darllan — peso e Rolo na bancada

Arquivo: `packages/sim/src/characters/darllan.ts`.

| Campo                   | Antes | Depois  | Motivo                                                                                          |
| ----------------------- | ----- | ------- | ----------------------------------------------------------------------------------------------- |
| `stats.weight`          | 124   | **118** | Aguentava demais: morria só com ~177%. Com 118, ~168%. Continua o mais pesado (Crocko tem 114). |
| `special.startup`       | 18    | **24**  | O rolo subindo é o aviso. 6 ticks a mais (0,1 s) deixam mais previsível e dá tempo de esquivar. |
| `special.cooldownTicks` | 60    | **100** | Estava saindo quase em sequência.                                                               |

Não muda: active 5, recovery 26, a área (216 × 60), o acerto (15% a 50°, 10 / 0,20), velocidades,
pulo, golpes base.

O especial passa a durar 24 + 5 + 26 = 55 ticks; com recarga 100 sobram 45 ticks sem Rolo depois de
cada uso (eram 11). O dano e a força ficam: é um especial lento, de perto, de um personagem lento.
O preço agora está no aviso e na recarga.

"Vida" neste jogo é o peso (quanto mais pesado, mais % aguenta): baixar o peso já é baixar a vida,
não há outro campo.

A animação `darllan_special` usa `timing: 'move'`: o rolo sobe mais devagar sozinho. Olhar no
`?rig` e na luta se o brilho do rolo (`slam.shine`) continua saindo na hora certa.

O teste da ficha continua valendo (mais pesado, mais lento, pulo mais baixo); conferir se algum
compara o peso com um número.

---

## Schummaki — Arrancada

Arquivo: `packages/sim/src/characters/schummaki.ts`.

| Campo                   | Antes | Depois  | Motivo                                                                      |
| ----------------------- | ----- | ------- | --------------------------------------------------------------------------- |
| `blocks[0].hit.damage`  | 13    | **12**  | Pedido: 1% a menos.                                                         |
| `special.cooldownTicks` | 75    | **110** | Com 50 ticks de especial, sobravam 25 sem Arrancada. Agora sobram 60 (1 s). |

Não muda: 16 / 14 / 20, velocidade 17 (11 no ar), a caixa, o knockback (11 / 0,19), ângulo 32°.

A Arrancada continua forte (atravessa 238 px e mata em % alto); o que muda é que errar ou acertar
uma deixa 1 s inteiro sem ela. Atualizar o comentário da ficha ("sobram 25 ticks").

---

## Meia — Comando

Arquivos: `packages/sim/src/characters/meia.ts`, `packages/game/src/rig/characterClips.ts`.

### O que está acontecendo

O agarrão prende por 60 ticks (1 s) enquanto solta 9 golpes. Com 3 ou 4 jogadores, nesse 1 s
alguém chega e bate no Meia, e o combo cai. É frustrante, porque acertar o agarrão já é difícil
(alcance de ~36 px, ele precisa estar colado).

### Números

| Campo                  | Antes                    | Depois                   | Motivo                                                                              |
| ---------------------- | ------------------------ | ------------------------ | ----------------------------------------------------------------------------------- |
| `blocks[0].holdTicks`  | 60                       | **30**                   | Metade do tempo exposto.                                                            |
| `blocks[0].combo`      | `{ hits: 9, damage: 1 }` | `{ hits: 4, damage: 2 }` | Mesmo ritmo de hoje (um golpe a cada 6 ticks), menos golpes e cada um mais visível. |
| `blocks[0].hit.damage` | 7                        | 7                        | Não muda. Total: 4 × 2 + 7 = **15%** (era 9 + 7 = 16%).                             |
| `stats.walkSpeed`      | 7                        | **7,3**                  | Chega colado mais rápido. O Schummaki (7,4) continua o mais rápido no chão.         |
| `stats.dashSpeed`      | 14                       | **14,3**                 | Acompanha (Schummaki: 14,5).                                                        |

Não muda: 6 / 4 / 36, recarga 90, a caixa do agarrão, o knockback do chute (9 / 0,20 a 40°), peso
88, golpes base.

Os golpes saem nos ticks 6, 12, 18 e 24 do agarrão e o chute no 30: o contador fecha em
**"5 HITS"** em vez de "10 HITS". Manter 1 golpe a cada 6 ticks, em vez de espremer 9 golpes em
30 ticks (1 a cada 3), é o que deixa cada golpe legível com a animação mais curta.

Equilíbrio: o agarrão fica mais seguro para o Meia (metade do tempo exposto) e ele chega mais
fácil; em troca, dá 1% a menos. Na 1ª rodada ele foi contido por estar acima da média (peso 88,
ar 5,8, recovery 36), e isso fica. Se a velocidade nova deixar ele forte demais, voltar o
`walkSpeed` para 7,15 antes de mexer no especial.

### Animação e efeitos

- `meia_special_combo` em `characterClips.ts`: hoje `length: 92` e `comboKeys(9, 6, 32)`
  (9 golpes, 1 a cada 6 ticks, 32 de recovery). Passa a `comboKeys(4, 6, 32)` e `length` 62
  (30 + 32). Conferir como `comboKeys` posiciona o chute final e se o `length` bate.
- Com 4 golpes, só aparecem os 4 primeiros de `COMBO_STRIKES`. Escolher os 4 que leem melhor
  (por exemplo jab, chute baixo, gancho, chute alto) em vez de simplesmente os 4 primeiros, se a
  função permitir sem complicar.
- `onComboHit` em `FightScene.ts` tem uma lista `heights` com a altura de cada golpe na ordem do
  clipe: ajustar para a ordem nova.
- O `CommandView` segura o contador por `COUNTER_HOLD` ticks depois do último golpe: conferir que
  o "5 HITS" ainda aparece por tempo suficiente.
- Atualizar: comentário do topo da ficha ("9 golpes de 1%", "10 HITS", "1 s preso"), o teste da
  ficha (`combo` igual a `{ hits: 9, damage: 1 }`, dano total 16), `fighterPose.test.ts` se
  depender do `holdTicks`, e o item "Agarrão com combo" do GDD (o exemplo "60 ticks e 9 golpes").

---

## Como os especiais ficam entre si

Leitura do conjunto, para conferir que nada saiu da curva:

- **Especiais de dano, do mais fraco ao mais forte:** Frango 5% (recarga 54), Saque 11% (90, não
  mata), Arrancada 12% (110), Controle na mão 13% (60, difícil de acertar), Correção postural 14%
  (150, depende do adversário bater), Doze 15% (100), Rolo 15% (100, aviso de 24), Comando 15%
  (90, alcance curtíssimo), Scout 18% (150, aviso de 28). A regra da 1ª rodada continua: quanto
  mais dano e alcance, mais aviso e mais recarga.
- **Recargas dos especiais de golpe forte** ficam agora todas entre 90 e 150. Os dois que estavam
  abaixo (Rolo 60, Arrancada 75) eram justamente os mais reclamados.
- **Especiais sem dano:** a aura da Marília fica ligada a maior parte do tempo, mas não anula mais
  nada; o teleporte do Tauba continua salvando, mas deixa ele na borda.
- **Controle na mão (Gabs)** fica com a recarga mais curta entre os de golpe (60). Não mexi: é o
  mais difícil de acertar (ponto cego) e ninguém reclamou. Vale observar nas próximas partidas.

---

## Instruções para executar

1. Criar a branch `feat/balanceamento-especiais` a partir da `main`.
2. **Não alterar** `docs/BALANCEAMENTO.md`.
3. Aplicar exatamente os valores das tabelas. Campo que não aparece não muda.
4. Ordem sugerida, um commit (ou mais) por item, sempre com `pnpm test`, `pnpm lint` e
   `pnpm typecheck` passando:
   1. Só números de ficha: João Frango, Schummaki, Darllan, Igão (com os testes de cada um).
   2. Meia (ficha, clipe do combo, efeitos, testes).
   3. Marília: regra de dano reduzido no `sim` (com testes) → ficha → brilho novo sem Glow.
   4. Tauba: modo `'edge'` no `sim` (com testes) → ficha → efeitos.
   5. Crocko: números → projétil devolvido e evento `reflect` (com testes) → efeito ciano.
5. Regras do `sim` que continuam valendo nas partes de código: sem Phaser/DOM, só inteiros na
   lógica (`idiv`, sem `Math.random`, sem ponto flutuante novo), estado serializável (campos novos
   de `Fighter` e `Projectile` entram no snapshot), personagem é dado (nada de `if (id === ...)`).
6. Conferir no navegador (`pnpm dev`), com o console sem erros:
   - Marília: soltar o especial em tela cheia e ver que o jogo não perde desempenho; levar golpe
     com a aura e ver o dano pela metade no HUD.
   - Crocko: contra-atacar um golpe e a bola do Igão; o efeito ciano tem que ser impossível de
     não ver.
   - Tauba: usar o especial caindo de cada lado, em cima do palco e em cima das plataformas.
   - Igão: a bola quica 4 vezes e acerta o Tauba parado no 1º quique.
   - Meia: o combo fecha em "5 HITS" e a animação bate com os golpes.
   - Darllan e Schummaki: `?rig` para ver o especial com os tempos novos.
7. Documentação, no mesmo commit de cada mudança:
   - `docs/GDD.md`: tabela "Os personagens jogáveis" (peso do Darllan; chão do Meia; a coluna do
     especial dos 8), o item **Aura** (regra nova: dano reduzido; a aura invencível continua
     existindo como opção do bloco), o item **Agarrão com combo** (exemplo), o teleporte (modo
     ponta) e o contra-ataque (projétil devolvido recomeça a vida e os quiques; evento `reflect`).
   - `docs/ELENCO.md`: descrição do especial de Marília, Tauba, Meia e Igão, onde citar a regra
     antiga.
   - Textos do jogo que descrevem os especiais (procurar por "aura", "10 HITS", "sorteado" em
     `packages/game/src`, incluindo `tutorial/`).
   - `docs/ROADMAP.md`: marcar a tarefa correspondente, se houver.
8. Mensagens de commit em inglês, Conventional Commits, sem menção ao Claude e sem
   `Co-Authored-By` (`CLAUDE.md`). Merge na `main` e push no fim.

Replays gravados antes da mudança deixam de valer (o jogo já avisa pelo hash).

## Pontos para o usuário decidir depois de jogar

1. **Recarga do Crocko (150).** O usuário sugeriu 100; este documento propõe 150 pelo motivo da
   seção do Crocko. Se ele parecer fraco, baixar para 130.
2. **Aura da Marília em 50%.** Se ela ficar difícil demais de matar, 60%.
3. **Tauba só nas pontas do bloco principal.** Se parecer punitivo demais, a alternativa é
   reaparecer um pouco mais para dentro (por exemplo 60 px da quina), não voltar ao sorteio.
4. **Tudo aqui é conta, não partida jogada.** Vale jogar de novo com os amigos e ajustar.

### Decidido pelo usuário (vale no lugar das tabelas acima)

1. Recarga do Crocko: **120** (janela aberta no máximo 50% do tempo; sobram 26 ticks sem
   contra-ataque depois de cada uso).
2. Aura da Marília: **`damageTakenPercent` 60** (leva 60% do dano com a aura).
3. Tauba: reaparece com o centro dos pés a **60 px da quina** (campo `edgeInset` do bloco
   teleporte), não colado nela.
