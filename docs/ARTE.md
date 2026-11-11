# Arte — passo a passo (Etapa 4)

Este arquivo diz exatamente o que fazer para gerar a arte do jogo: onde clicar, o que anexar, o que
colar, o que conferir e onde salvar cada imagem. No fim estão o guia de estilo (o porquê de cada
regra) e o modelo de ficha para os próximos personagens.

## Visão geral

| Parte | O quê            | O que sai                                                             | Imagens | Situação    |
| ----- | ---------------- | --------------------------------------------------------------------- | ------- | ----------- |
| 1     | Estilo do jogo   | `style.png` (boneco no estilo do jogo) e `shape.png` (molde do corpo) | 2       | ✅ feita    |
| 2     | Schummaki        | Conceito, cabeças com expressões, peças do corpo, efeitos, figurinha  | 5       | conceito ✅ |
| 3     | João Frango      | Igual à parte 2                                                       | 5       |             |
| 4     | Cenário (a laje) | Arte do mapa, 3 camadas de fundo, peças do palco                      | 5       |             |

As partes 2 a 4 podem ser feitas por dois caminhos. Os dois usam as mesmas imagens de referência e
salvam com os mesmos nomes:

- **[Caminho A — Firefly](#caminho-a--firefly-gpt-image-15)**, com o modelo GPT Image 1.5 (o que
  você está usando). Cada imagem é um pedido separado: você anexa as referências e cola um texto
  curto.
- **[Caminho B — ChatGPT](#caminho-b--chatgpt)**. Uma conversa por personagem. Serve quando houver
  cota de imagens no ChatGPT.

**Não misture os caminhos no mesmo personagem.** Comece e termine cada um no mesmo lugar, porque
cada ferramenta desenha um pouco diferente.

Os textos para colar estão em inglês porque o gerador segue melhor instruções técnicas assim.

## Parte 0 — Antes de começar

1. Peça o OK de cada amigo para usar a foto e a imagem dele (coluna "Autorizou" do `ELENCO.md`).
2. Separe 2 ou 3 fotos de cada amigo: rosto de frente bem iluminado, rosto de perfil e corpo
   inteiro. Sem óculos escuros e sem filtro.
3. Guarde as fotos **fora** da pasta do projeto. O repositório é público.
4. As imagens geradas vão para a pasta `art/` na raiz do projeto, sempre em PNG e no tamanho
   original.

## Parte 1 — Estilo do jogo ✅

Feita no ChatGPT. As duas imagens servem de referência para todas as outras e **não devem ser
refeitas**: trocar o estilo no meio deixa os personagens com cara de jogos diferentes.

- **`art/style/style.png`:** um boneco genérico desenhado no estilo do jogo. Não é nenhum amigo,
  para que o estilo passe para os outros personagens sem levar junto o rosto dele.
- **`art/style/shape.png`:** um manequim cinza, inteiro e separado em peças. Ele define a lista de
  peças do esqueleto de animação.

O `shape.png` saiu diferente do pedido: está de frente (não em 3/4), com a cabeça um pouco menor e
o corpo mais fino que o do `style.png`, sobre um fundo escuro. Não precisa refazer. Ele é só
referência e nunca entra no jogo, e os textos das peças já pedem cabeça, tronco e quadril em 3/4 e
mandam seguir as proporções do conceito do personagem, não as do manequim.

Os textos usados na parte 1 estão no [Caminho B](#caminho-b--chatgpt), caso um dia precise refazer.

## Caminho A — Firefly (GPT Image 1.5)

### Como gerar uma imagem no Firefly

Todo passo deste caminho segue o mesmo roteiro. Os nomes dos botões estão como na ajuda da Adobe; no
Firefly em português eles podem aparecer traduzidos.

1. Abra o Firefly (firefly.adobe.com), clique em **Generate** no painel da esquerda e depois em
   **Generate image**.
2. Em **Model**, na parte _Partner models_, escolha **GPT Image 1.5**. É ele que aceita **Reference
   images** (até 6). Na primeira vez o Firefly pede para confirmar que o modelo não é da Adobe:
   clique em OK. Use esse mesmo modelo no jogo inteiro.
3. Em **Aspect ratio**, escolha o formato que o passo indica: **Wide (4:3)** ou **Square (1:1)**.
4. Em **Reference images**, envie as imagens que o passo indica.
5. Cole o texto do passo no campo **Prompt** e clique em **Generate**.
6. Escolha o melhor resultado, baixe em PNG e salve com o nome indicado.

O que muda em relação ao ChatGPT:

- **Não existe conversa.** O Firefly não lembra da imagem anterior. Por isso todo passo manda
  anexar as referências de novo, e cada texto já traz tudo o que precisa.
- **O campo de texto aceita uns 1.000 caracteres.** Os textos deste caminho já cabem. Se escrever
  um novo, mantenha curto: as imagens de referência fazem a maior parte do trabalho.
- **Não há fundo transparente.** Os textos pedem fundo magenta liso (#FF00FF). O Claude remove
  depois; se preferir, o Photoshop também tira, com _Remover plano de fundo_.
- **Cada geração gasta créditos da Adobe.** Se a imagem saiu quase certa, corrija em vez de gerar
  de novo do zero (veja [Se der errado no Firefly](#se-der-errado-no-firefly)).

### Parte 2 — Schummaki (Firefly)

#### 2.1 Conceito → `1-conceito.png` ✅

**Feito:** `art/schummaki/1-conceito.png`. Corpo de frente, pose de luta em 3/4 virada para a
direita e 3 cabeças (sorrindo, piscando, sério). Ele define o personagem: as próximas imagens copiam
dele. Também serve de modelo de layout e traço para o conceito dos outros amigos (veja o 3.1). Se
ainda não mandou para o Schummaki aprovar, mande antes de seguir.

Como ele saiu, para repetir quando precisar (o truque **"rosto de uma, roupa de outra"**):

1. Uma geração acertou o rosto; outra acertou a roupa, mas na cor errada (azul-petróleo).
2. No Paint, recortei a roupa da segunda imagem.
3. Mandei as duas em _Reference images_, a folha com o rosto certo e o recorte da roupa, com este
   texto:

```text
Edit the attached character sheet. Keep exactly the same: face, hair, beard, expressions, poses, proportions, layout and drawing style.
Change only the outfit: the outfit should be exactly like the attached petrol-blue outfit, you should only change the colors:
jacket: open red (#D62839) with white and graphite (#2E3138)
shorts: graphite (#2E3138)
sneakers: white with red (#D62839) details
```

#### 2.2 Cabeças com expressões → `2-cabecas.png`

**Formato:** Square (1:1). **Referências:** `1-conceito.png` + 1 ou 2 fotos do rosto dele.

```text
Head expression sheet of the character in the attached concept sheet: same design, same style. Use the attached photos only for facial likeness.
4 heads only, cut at the neck, all in 3/4 view facing right, same size, in a 2x2 grid with space between them:
1. Fight-ready: confident smirk.
2. Hurt: eyes squeezed shut, teeth clenched.
3. Taunt: mouth wide open shouting, eyebrows raised.
4. KO: dizzy spiral eyes, tongue slightly out.
Bold dark plum-brown outline, flat 2-tone cel shading, light from above. Solid flat magenta (#FF00FF) background. No text.
```

**Confira:** 4 cabeças iguais ao conceito, todas viradas para a direita. Elas viram as cabeças do
jogo: ao levar golpe, provocar ou cair, o jogo troca a cabeça inteira.

**Salve como:** `art/schummaki/2-cabecas.png`

#### 2.3 Peças do corpo → `3-pecas.png`

**Formato:** Square (1:1). **Referências:** `1-conceito.png` + `shape.png`.

```text
Cut-out animation parts of the character in the attached concept sheet, wearing the same outfit. Use the attached gray mannequin only as the list of parts and how they are split; keep the proportions of the concept sheet.
Parts, each separate with space between them, none touching: head and torso and hips (each in 3/4 view facing right); upper arm; forearm; fist; open hand; thigh; shin; shoe. Extra: two hands gripping an invisible steering wheel.
Rounded, slightly extended joint ends so the parts overlap when rotated. Every part complete and straight, nothing cut off.
Bold dark plum-brown outline, flat 2-tone cel shading, light from above. Solid flat magenta (#FF00FF) background. No text, no labels.
```

**Confira:** as peças do manequim, agora com a roupa dele, mais as 2 mãos segurando o volante.
Nada encostando, nada cortado. Basta 1 de cada peça de braço e perna: o braço e a perna de trás
usam a mesma peça, escurecida na animação.

**Salve como:** `art/schummaki/3-pecas.png`

#### 2.4 Efeitos do especial → `4-efeitos.png`

**Formato:** Square (1:1). **Referências:** `1-conceito.png`.

```text
Effects sheet for the special move of the character in the attached concept sheet, same outline and colors: 4 tire-smoke puffs in different sizes (light gray); 2 horizontal speed-streak shapes; 1 burnt-rubber skid mark seen from the side. Each item separate, with space between them.
Bold dark plum-brown outline, flat 2-tone cel shading. Solid flat magenta (#FF00FF) background. No text.
```

**Salve como:** `art/schummaki/4-efeitos.png`

#### 2.5 Figurinha → `5-figurinha.png`

É o retrato da tela de seleção e do placar. Pode ficar para depois, se os créditos apertarem.

**Formato:** Square (1:1). **Referências:** `1-conceito.png` + 1 foto do rosto dele.

```text
Portrait sticker of the character in the attached concept sheet, same design and style; use the attached photo only for facial likeness. Bust (head and shoulders), 3/4 view facing right, confident expression, inside a die-cut sticker: thick off-white border following the silhouette, over a round badge in the main color of his outfit.
Bold dark plum-brown outline, flat 2-tone cel shading. Solid flat magenta (#FF00FF) background outside the sticker. No text.
```

**Salve como:** `art/schummaki/5-figurinha.png`

### Parte 3 — João Frango (Firefly)

Os mesmos 5 passos da parte 2, com os textos do João. Salve em `art/joao-frango/`.

#### 3.1 Conceito → `1-conceito.png`

O conceito do Schummaki entra como referência para o João sair com o mesmo layout e o mesmo traço. O
texto manda copiar só o estilo e a disposição, não o rosto nem a roupa.

**Formato:** Wide (4:3). **Referências:** `art/schummaki/1-conceito.png` + 2 ou 3 fotos do João.

```text
Character concept sheet of my friend from the attached photos. Copy only the drawing style and the exact layout of the attached cartoon sheet, not its face, hair or outfit: front view standing, 3/4 view in a fighting stance facing right, and 3 heads on the right (smiling, winking, sleepy yawn). Keep his real face shape, hair, nose, eyebrows and facial hair; exaggerate his most distinctive features by about 30%.
Character: João Frango, sleepy restaurant owner from Rio, slim build, half-closed sleepy eyes, easygoing smile. Off-white chef apron over an orange (#F28C28) t-shirt; corn-yellow (#F6C945) cap with a red-orange chicken comb sticking out on top; casual shorts; flip-flops. No text on the apron.
Big head, bold dark outline, flat 2-tone cel shading, light from above. Plain light-gray background. No text, logos or numbers.
```

**Confira:** dá para reconhecer o João? Não veio nada do Schummaki (rosto, topete, jaqueta
vermelha)? Se uma geração acertar o rosto e outra a roupa, junte as duas com o truque "rosto de uma,
roupa de outra" do 2.1.

**Salve como:** `art/joao-frango/1-conceito.png`. **Mande para o amigo aprovar antes de seguir.**

#### 3.2 Cabeças com expressões → `2-cabecas.png`

**Formato:** Square (1:1). **Referências:** `1-conceito.png` do João + 1 ou 2 fotos do rosto dele.

```text
Head expression sheet of the character in the attached concept sheet: same design, same style. Use the attached photos only for facial likeness.
4 heads only, cut at the neck, all in 3/4 view facing right, same size, in a 2x2 grid with space between them:
1. Fight-ready: confident smirk.
2. Hurt: eyes squeezed shut, teeth clenched.
3. Taunt: mouth wide open shouting, eyebrows raised.
4. KO: dizzy spiral eyes, tongue slightly out.
Bold dark plum-brown outline, flat 2-tone cel shading, light from above. Solid flat magenta (#FF00FF) background. No text.
```

**Salve como:** `art/joao-frango/2-cabecas.png`

#### 3.3 Peças do corpo → `3-pecas.png`

**Formato:** Square (1:1). **Referências:** `1-conceito.png` do João + `shape.png`.

```text
Cut-out animation parts of the character in the attached concept sheet, wearing the same outfit. Use the attached gray mannequin only as the list of parts and how they are split; keep the proportions of the concept sheet.
Parts, each separate with space between them, none touching: head and torso and hips (each in 3/4 view facing right); upper arm; forearm; fist; open hand; thigh; shin; foot with flip-flop. Extra: two hands cupped as if around the mouth, shouting.
Rounded, slightly extended joint ends so the parts overlap when rotated. Every part complete and straight, nothing cut off.
Bold dark plum-brown outline, flat 2-tone cel shading, light from above. Solid flat magenta (#FF00FF) background. No text, no labels.
```

**Salve como:** `art/joao-frango/3-pecas.png`

#### 3.4 Efeitos do especial → `4-efeitos.png`

**Formato:** Square (1:1). **Referências:** `1-conceito.png` do João.

```text
Effects sheet for the special move of the character in the attached concept sheet, same outline and colors: a whole golden roast chicken flying to the right, side view, in 3 slightly different rotation frames; 3 small steam puffs; 1 short motion-trail shape. Each item separate, with space between them.
Bold dark plum-brown outline, flat 2-tone cel shading. Solid flat magenta (#FF00FF) background. No text.
```

**Salve como:** `art/joao-frango/4-efeitos.png`

#### 3.5 Figurinha → `5-figurinha.png`

**Formato:** Square (1:1). **Referências:** `1-conceito.png` do João + 1 foto do rosto dele.

```text
Portrait sticker of the character in the attached concept sheet, same design and style; use the attached photo only for facial likeness. Bust (head and shoulders), 3/4 view facing right, confident expression, inside a die-cut sticker: thick off-white border following the silhouette, over a round badge in the main color of his outfit.
Bold dark plum-brown outline, flat 2-tone cel shading. Solid flat magenta (#FF00FF) background outside the sticker. No text.
```

**Salve como:** `art/joao-frango/5-figurinha.png`

### Parte 4 — Cenário: a laje (Firefly)

O primeiro mapa é a laje de um prédio no litoral, no fim da tarde, com vista para os morros e o mar.
O topo do prédio é a plataforma principal da luta (as paredes dos lados servem para o wall jump), e
as 2 plataformas finas flutuam acima dela, como no mapa de teste. Salve tudo em
`art/cenario-laje/`.

O Firefly vai no máximo até o formato 4:3, e as camadas do fundo precisam ser bem mais largas que a
tela. Isso se resolve depois: o Claude repete e emenda as camadas, ou o Photoshop alarga com
_Expansão generativa_.

#### 4.1 Arte do mapa → `1-mapa.png`

**Formato:** Wide (4:3). **Referências:** `style.png`.

```text
Stage art for a 2D platform fighting game, side view, in the style of the attached cartoon reference but softer: lighter, less saturated, thin outlines, flat shapes, gradient only in the sky. No characters.
A rooftop ("laje") of a simple concrete building in a Brazilian coastal town at golden hour. In the center, the main platform: the flat rooftop of the building, a block about twice as wide as tall, with plain walls on both sides. Above it, two thin floating wooden plank platforms, one on the left and one on the right. Behind: neighboring rooftops with blue water tanks, TV antennas and a clothesline; further back, green hills and the sea; warm orange-pink sky. No text.
```

**Confira:** é o mapa inteiro, montado. Ele serve de referência para as próximas 4 imagens.

#### 4.2 a 4.4 Camadas do fundo

O fundo do jogo é feito de 3 camadas que se movem em velocidades diferentes (o efeito de
profundidade, chamado parallax). Uma geração por camada.

**Formato:** Wide (4:3). **Referências:** `1-mapa.png`.

**4.2 Céu → `2-ceu.png`**

```text
Using the attached stage art, draw only the sky and the sun, filling the whole image, with the same colors and style. Nothing else: no buildings, no hills, no sea. No text.
```

**4.3 Morros e mar → `3-longe.png`**

```text
Using the attached stage art, draw only the far layer: the green hills and the sea along the bottom half, with the same colors and style. Everything above the hills is solid flat magenta (#FF00FF). No buildings, no text.
```

**4.4 Lajes vizinhas → `4-meio.png`**

```text
Using the attached stage art, draw only the middle layer: the neighboring rooftops, blue water tanks, TV antennas and clothesline along the bottom part, with the same colors and style. Everything above them is solid flat magenta (#FF00FF). No main building, no floating platforms, no text.
```

#### 4.5 Peças do palco → `5-pecas.png`

As proporções importam: o jogo já tem as caixas de colisão (topo do prédio 900 × 420 px, plataformas
230 × 16 px).

**Formato:** Wide (4:3). **Referências:** `1-mapa.png`.

```text
Using the attached stage art for style and colors, draw the stage pieces separately, with space between them, on a solid flat magenta (#FF00FF) background:
1. The main platform: the top of the building as one block about 2.1 times wider than tall. The rooftop surface is a perfectly flat, straight top edge with nothing on it. Plain walls on both sides; the bottom fades into shadow.
2. One thin floating wooden plank platform about 14 times wider than tall, with two small metal brackets underneath.
3. Separate decorations: a small brick barbecue grill, a blue water tank, a plastic chair, a cooler box.
No text.
```

**Confira:** o topo do prédio é uma linha reta (é onde os lutadores pisam) e não tem nada em cima.

### Personagem novo no Firefly

Copie os textos da parte 3 (João Frango, feito do zero) e troque só o que é do João:

- **Conceito (3.1):** troque a linha que começa com `Character:` pela descrição do novo amigo, em
  inglês, no mesmo tamanho (nome, de onde é, físico, expressão, roupa peça por peça com as cores, o
  que evitar). A ficha da [Referência](#ficha-para-um-personagem-novo) ajuda a pensar no que
  escrever.
- **Peças (3.3):** troque o que vem depois de `Extra:` pelas mãos especiais dele (ou apague o
  `Extra:`), e `foot with flip-flop` pelo calçado dele.
- **Efeitos (3.4):** troque a lista de itens pelos efeitos do especial dele.
- **Cabeças (3.2) e figurinha (3.5):** iguais para todos, não mude nada.

Se uma geração acertar o rosto e outra a roupa, junte as duas com o truque "rosto de uma, roupa de
outra" do 2.1.

Antes de gerar, confira se o texto passou de 1.000 caracteres (o Firefly corta o excesso).

### Se der errado no Firefly

Primeiro, tente gerar de novo com o mesmo texto: cada geração sai um pouco diferente. Se a imagem
saiu quase certa, corrija só o defeito: anexe **a imagem com defeito** em _Reference images_ (mais
as fotos, quando o problema é o rosto) e mande só a frase da tabela.

| Problema                                | Anexe                                               | Mande                                                                                                                                                                                                     |
| --------------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Não parece o amigo                      | A imagem + 2 fotos do rosto                         | `Edit the attached cartoon: redo only the face so it clearly looks like the man in the attached photos (nose, eyebrows, jaw, hairline). Keep everything else the same.`                                   |
| Ficou genérico, parecendo outro jogo    | A imagem                                            | `Edit the attached cartoon: bigger head (1/3 of the height), stronger caricature of his most distinctive features, flat 2-tone shading. Keep everything else the same.`                                   |
| Fundo xadrez, sujo ou com sombra        | A imagem                                            | `Edit the attached image: replace the whole background with solid flat magenta (#FF00FF). Keep everything else the same.`                                                                                 |
| Peças encostando ou cortadas            | A imagem                                            | `Redo the attached parts sheet with more empty space between all parts, every part complete, with rounded joint ends. Same character, same style.`                                                        |
| Apareceu texto ou logo                  | A imagem                                            | `Edit the attached image: remove all text, letters, numbers and logos. Keep everything else the same.`                                                                                                    |
| Virado para o lado errado               | A imagem                                            | `Edit the attached image: turn it to a 3/4 view facing right. Keep everything else the same.`                                                                                                             |
| Luz vindo de um lado                    | A imagem                                            | `Edit the attached image: light from straight above, shadows only under the chin, arms and lower parts. Keep everything else the same.`                                                                   |
| Rosto bom numa imagem, roupa boa noutra | A imagem com o rosto certo + recorte da roupa certa | `Edit the attached character sheet. Keep exactly the same: face, hair, expressions, poses, proportions, layout and drawing style. Change only the outfit: it should be exactly like the attached outfit.` |

Para defeitos pequenos (um logo, um dedo a mais, uma peça cortada), o **Photoshop** costuma ser mais
barato: selecione a área com o laço, use o _Preenchimento generativo_ e descreva o que deve ficar
ali. Para tirar o fundo, use _Remover plano de fundo_.

## Caminho B — ChatGPT

No ChatGPT cada personagem tem uma conversa própria. A primeira mensagem passa as regras e não
gera imagem; cada mensagem seguinte gera 1 imagem. Se o ChatGPT avisar que acabou o limite de
imagens do dia, pare e continue no dia seguinte na mesma conversa.

### Parte 1 — Estilo do jogo (já feita)

Os textos que criaram o `style.png` e o `shape.png`. Só use se precisar refazer a parte 1.

#### 1.1 Primeira mensagem (não gera imagem)

Abra uma **conversa nova**. Não anexe nada. Cole:

```text
[BLOCO DE ESTILO]
ART STYLE "CALÇADÃO" — locked rules for every image in this conversation:
- 2D cartoon art for a platform fighting game, hand-inked caricature look, as if a Brazilian beach-boardwalk caricature artist drew characters for a modern fighting game.
- Proportions: big-head caricature, exactly 3 heads tall (head = 1/3 of total height). Compact torso, short sturdy legs, oversized hands and shoes. The whole body fits a box 1 wide by 2 tall.
- Likeness first: keep the real person's face shape, hairline, nose, eyebrows, facial hair and eye shape from the photos, and exaggerate their 1-2 most distinctive features by about 30%. Eyes stay human-shaped, not anime.
- Line: bold clean ink outline in dark plum-brown (#2B1A22), never pure black. Thicker on the outer silhouette, thinner on inner details, slightly tapered ends.
- Shading: flat cel shading only: one base color + one hard-edged shadow tone tinted cool violet + one small hard highlight. No gradients, no airbrush, no texture, no noise.
- Light: from straight above and slightly in front, so the art can be mirrored horizontally. Shadows under the chin, under the arms and on the lower part of shapes. No side lighting, no rim light.
- Colors: saturated and warm, few colors per character (3 main colors + skin + outline). Use off-white (#F6F0E4) instead of pure white.
- Clothing: everyday Brazilian clothes (t-shirts, zip jackets, caps, shorts, aprons, flip-flops, sneakers). No armor, no fantasy gear.
- Readability: a strong silhouette that still reads at 100 pixels tall. No thin straps, tiny patterns or small details.
- Never draw: text, letters, numbers, logos, brand names, watermarks, signatures, real sports team liveries.

[INSTRUÇÕES]
I'm making a 2D platform fighting game where my 16 friends are the characters. In this conversation we will create 2 reference images that will define the style for all of them. Do not generate any image yet. Reply only "OK" and summarize the style rules in 3 short lines.
```

**Confira:** ele responde "OK" e um resumo. Se gerar uma imagem mesmo assim, ignore e siga.

#### 1.2 Boneco do estilo → `style.png`

Cole:

```text
Create the STYLE ANCHOR image following the locked style rules.
One original generic character, not based on any real person: an average Brazilian guy in his late 20s, short dark hair, plain t-shirt, shorts and chunky sneakers.
Show him twice, side by side, same scale, feet on the same baseline: (1) front view, neutral standing pose; (2) 3/4 view facing right, relaxed fighting stance with fists up and knees slightly bent.
Plain flat light-gray background (#E6E6E6). Wide landscape image. No text.
```

**Confira:** cabeça grande (1/3 da altura), contorno marrom-escuro (não preto), sombra chapada sem
degradê, nenhum texto. Se gostar do visual, este é o estilo do jogo inteiro.

**Salve como:** `art/style/style.png`

#### 1.3 Molde do corpo → `shape.png`

Cole:

```text
Now create the BODY TEMPLATE for a 2D cut-out (skeletal) animation rig, using the style anchor above for line, shading and exact proportions.
A neutral faceless mannequin with the exact same proportions as the anchor character: smooth medium-gray body (#9AA0A6), same outline, no clothes, no hair, no face details.
Left third of the image: the whole mannequin assembled, 3/4 view facing right, neutral standing pose, arms hanging slightly away from the body.
Right two thirds: the same mannequin split into separate parts, laid out in a tidy grid with generous empty space between them, no part touching or overlapping another:
head; torso (neck to waist); hips (waist to crotch); upper arm; forearm; hand closed in a fist; open hand; thigh; shin; shoe.
Every limb part has rounded, slightly extended ends at the joints (shoulder, elbow, wrist, hip, knee, ankle) so the parts overlap when rotated, like paper puppet pieces. Draw limb parts straight and vertical, each one complete, nothing cut off by the image border.
Transparent background. No text, no numbers, no labels.
```

**Confira:** à esquerda o manequim montado; à direita 10 peças soltas, sem encostar umas nas outras
e sem nada cortado na borda. Só existe 1 braço e 1 perna: o braço e a perna de trás usam a mesma
peça, escurecida na animação.

**Salve como:** `art/style/shape.png`

Pronto: a parte 1 nunca mais se repete.

### Parte 2 — Schummaki (ChatGPT)

Os passos abaixo valem para qualquer amigo; só a primeira mensagem muda. Cada personagem tem a sua
conversa, para o rosto de um não passar para o outro.

#### 2.1 Primeira mensagem (não gera imagem)

Abra uma **conversa nova** e **anexe 3 coisas**: `style.png`, `shape.png` e as 2–3 fotos do amigo.
Cole a mensagem do personagem:

##### Mensagem do Schummaki

```text
[BLOCO DE ESTILO]
ART STYLE "CALÇADÃO" — locked rules for every image in this conversation:
- 2D cartoon art for a platform fighting game, hand-inked caricature look, as if a Brazilian beach-boardwalk caricature artist drew characters for a modern fighting game.
- Proportions: big-head caricature, exactly 3 heads tall (head = 1/3 of total height). Compact torso, short sturdy legs, oversized hands and shoes. The whole body fits a box 1 wide by 2 tall.
- Likeness first: keep the real person's face shape, hairline, nose, eyebrows, facial hair and eye shape from the photos, and exaggerate their 1-2 most distinctive features by about 30%. Eyes stay human-shaped, not anime.
- Line: bold clean ink outline in dark plum-brown (#2B1A22), never pure black. Thicker on the outer silhouette, thinner on inner details, slightly tapered ends.
- Shading: flat cel shading only: one base color + one hard-edged shadow tone tinted cool violet + one small hard highlight. No gradients, no airbrush, no texture, no noise.
- Light: from straight above and slightly in front, so the art can be mirrored horizontally. Shadows under the chin, under the arms and on the lower part of shapes. No side lighting, no rim light.
- Colors: saturated and warm, few colors per character (3 main colors + skin + outline). Use off-white (#F6F0E4) instead of pure white.
- Clothing: everyday Brazilian clothes (t-shirts, zip jackets, caps, shorts, aprons, flip-flops, sneakers). No armor, no fantasy gear.
- Readability: a strong silhouette that still reads at 100 pixels tall. No thin straps, tiny patterns or small details.
- Never draw: text, letters, numbers, logos, brand names, watermarks, signatures, real sports team liveries.

[FICHA DO PERSONAGEM]
CHARACTER SHEET
Name: Schummaki — 30-year-old guy from the coast of São Paulo state (a "caiçara"), crazy about cars.
Fighting style: rusher — fast on the ground, heavy, always charging forward. Grounded, leaning-forward posture.
Body: based on the photos; solid, medium-heavy build.
Outfit: open red (#D62839) racing-style track jacket with white stripes down the sleeves and graphite (#2E3138) side panels, no logos; graphite t-shirt underneath; gray fingerless driving gloves; graphite cargo shorts; chunky red-and-white sneakers. No cap: his hair must show.
Signature details: red jacket, driving gloves, his hair.
Colors: primary #D62839, secondary #F6F0E4, accent #2E3138.
Face/personality: competitive, determined grin.
Special move: "Arrancada" — he burns rubber in place (thick tire smoke at his feet), then shoots forward like a car.
Taunt: turns an imaginary steering wheel with both hands, making "vroom vroom", then shouts his catchphrase.
Extra parts for the parts sheet: two hands gripping an invisible steering wheel (left and right).
Props and effects for the effects sheet: 4 tire-smoke puffs in different sizes (light gray, inked); 2 horizontal speed-streak shapes; 1 burnt-rubber skid mark seen from the side.
Avoid: any reference to a real racing driver: no racing suits, helmets, racing numbers, names, team or sponsor logos.

[INSTRUÇÕES]
Attached: (1) the style anchor, for style only — do not copy its face; (2) the body template, only as the list of animation parts; (3) photos of my friend, for likeness.
Do not generate any image yet. Reply only "OK" and list the 3 most distinctive facial features you see in the photos, which you will exaggerate.
```

##### Mensagem do João Frango

```text
[BLOCO DE ESTILO]
ART STYLE "CALÇADÃO" — locked rules for every image in this conversation:
- 2D cartoon art for a platform fighting game, hand-inked caricature look, as if a Brazilian beach-boardwalk caricature artist drew characters for a modern fighting game.
- Proportions: big-head caricature, exactly 3 heads tall (head = 1/3 of total height). Compact torso, short sturdy legs, oversized hands and shoes. The whole body fits a box 1 wide by 2 tall.
- Likeness first: keep the real person's face shape, hairline, nose, eyebrows, facial hair and eye shape from the photos, and exaggerate their 1-2 most distinctive features by about 30%. Eyes stay human-shaped, not anime.
- Line: bold clean ink outline in dark plum-brown (#2B1A22), never pure black. Thicker on the outer silhouette, thinner on inner details, slightly tapered ends.
- Shading: flat cel shading only: one base color + one hard-edged shadow tone tinted cool violet + one small hard highlight. No gradients, no airbrush, no texture, no noise.
- Light: from straight above and slightly in front, so the art can be mirrored horizontally. Shadows under the chin, under the arms and on the lower part of shapes. No side lighting, no rim light.
- Colors: saturated and warm, few colors per character (3 main colors + skin + outline). Use off-white (#F6F0E4) instead of pure white.
- Clothing: everyday Brazilian clothes (t-shirts, zip jackets, caps, shorts, aprons, flip-flops, sneakers). No armor, no fantasy gear.
- Readability: a strong silhouette that still reads at 100 pixels tall. No thin straps, tiny patterns or small details.
- Never draw: text, letters, numbers, logos, brand names, watermarks, signatures, real sports team liveries.

[FICHA DO PERSONAGEM]
CHARACTER SHEET
Name: João Frango — 24-year-old guy from Rio de Janeiro, owns a restaurant, always sleepy because he wakes up late, always taking photos of food.
Fighting style: zoner — light and floaty, attacks from a distance. Relaxed, loose posture.
Body: based on the photos; light, slim build.
Outfit: off-white chef apron (#F2EAD8) over an orange t-shirt (#F28C28); corn-yellow (#F6C945) baseball cap with a red-orange chicken comb sticking out on top; casual shorts; flip-flops.
Signature details: the chicken comb on the cap, the apron, the sleepy eyes.
Colors: primary #F2EAD8, secondary #F28C28, accent #F6C945.
Face/personality: sleepy half-closed eyes, easygoing smile.
Special move: "Frango assado voador" — he throws a whole golden roast chicken that flies straight forward.
Taunt: cups both hands around his mouth and shouts "Ô Mariiiliaaa!".
Extra parts for the parts sheet: two hands cupped around the mouth, as when shouting (left and right).
Props and effects for the effects sheet: the roast chicken projectile, side view flying right, in 3 slightly different rotation frames; 3 small steam puffs; 1 short motion-trail shape behind the chicken.
Avoid: restaurant names, text or logos on the apron or cap.

[INSTRUÇÕES]
Attached: (1) the style anchor, for style only — do not copy its face; (2) the body template, only as the list of animation parts; (3) photos of my friend, for likeness.
Do not generate any image yet. Reply only "OK" and list the 3 most distinctive facial features you see in the photos, which you will exaggerate.
```

Para um amigo novo, copie uma dessas mensagens e troque só o trecho entre `[FICHA DO PERSONAGEM]` e
`[INSTRUÇÕES]` pela ficha dele (modelo em [Ficha para um personagem novo](#ficha-para-um-personagem-novo)).

**Confira:** ele responde "OK" e lista 3 traços do rosto do amigo. Se faltou o traço que todo mundo
reconhece (a sobrancelha, o queixo, o cabelo), responda corrigindo, por exemplo: _"O mais marcante é
o queixo comprido, exagere isso."_

#### 2.2 Conceito → `1-conceito.png`

Cole:

```text
Create the CHARACTER CONCEPT SHEET.
The same character 3 times, side by side, same scale, feet on the same baseline: front view; 3/4 view facing right; full side profile facing right. Neutral standing pose, arms relaxed.
Same proportions as the style anchor (3 heads tall). The face must clearly look like my friend in the photos.
Plain flat light-gray background (#E6E6E6). Wide landscape image. No text.
```

**Confira:** dá para reconhecer o amigo? Se não, use a correção "Não parece o amigo" e repita até
ficar bom. Este é o desenho que define o personagem.

**Salve como:** `art/<personagem>/1-conceito.png` (ex.: `art/schummaki/1-conceito.png`).

**Mande para o amigo aprovar antes de seguir.**

#### 2.3 Cabeças com expressões → `2-cabecas.png`

**Anexe** `1-conceito.png` de novo. O ChatGPT lembra das imagens anteriores da conversa, mas vai
perdendo a fidelidade depois de vários pedidos; o anexo segura o desenho aprovado. Cole:

```text
Use the attached concept sheet as the definitive design of this character. Create the HEAD EXPRESSION SHEET.
4 heads only, cut at the neck, no body. All in 3/4 view facing right, same size, same angle, same hair/cap, in a 2x2 grid with generous space between them:
1. Fight-ready: confident, slight smirk.
2. Hurt: eyes squeezed shut, teeth clenched, recoiling from a hit.
3. Taunt: mouth wide open shouting the catchphrase, eyebrows raised.
4. KO: dizzy spiral eyes, mouth hanging open, tongue slightly out.
Transparent background. No text.
```

**Confira:** 4 cabeças iguais ao conceito, todas viradas para a direita. Elas viram as cabeças do
jogo: ao levar golpe, provocar ou cair, o jogo troca a cabeça inteira.

**Salve como:** `art/<personagem>/2-cabecas.png`

#### 2.4 Peças do corpo → `3-pecas.png`

**Anexe** `1-conceito.png` e `shape.png`. Cole:

```text
Use the attached concept sheet as the definitive design and the attached body template only as the list of parts and how they are split. Create the CUT-OUT ANIMATION PARTS for this character, wearing the outfit from the concept sheet.
Keep the proportions of the concept sheet, not of the mannequin.
Parts: head (fight-ready expression, with hair/cap), torso and hips, each in 3/4 view facing right; upper arm; forearm; fist; open hand; thigh; shin; shoe. Plus the extra parts listed in the character sheet, if any.
Clothes follow the parts: sleeves on the arm parts, pants or shorts on the hips and leg parts, accessories on the part they belong to.
Rounded, slightly extended joint ends; every part complete and straight; generous empty space between parts, none touching.
Transparent background. No text, no labels.
```

**Confira:** mesmas peças do molde, agora com a roupa do amigo, mais as mãos extras da ficha. Nada
encostando, nada cortado.

**Salve como:** `art/<personagem>/3-pecas.png`

#### 2.5 Efeitos do especial → `4-efeitos.png`

**Anexe** `1-conceito.png`. Cole:

```text
Use the attached concept sheet as the reference for line and colors. Create the PROPS AND EFFECTS SHEET for this character's special move and taunt, as listed in the character sheet.
Same ink outline and flat cel shading as the character. Each item separate, generous space between them, nothing touching.
Transparent background. No text.
```

**Confira:** os itens da linha "Props and effects" da ficha (fumaça de pneu no Schummaki, frango
assado no João).

**Salve como:** `art/<personagem>/4-efeitos.png`

#### 2.6 Figurinha → `5-figurinha.png`

É o retrato da tela de seleção e do placar. Pode ficar para depois, se o limite do dia apertar.

**Anexe** `1-conceito.png`. Cole:

```text
Use the attached concept sheet as the definitive design. Create the PORTRAIT STICKER for the character select screen.
Bust (head and shoulders) in 3/4 view facing right, fight-ready expression, inside a die-cut sticker: thick off-white sticker border following the outer silhouette, over a round badge in the character's primary color.
Square image, transparent background outside the sticker. No text.
```

**Salve como:** `art/<personagem>/5-figurinha.png`

**Se o personagem começar a mudar de cara** no meio da conversa, não insista nela: abra uma conversa
nova, anexe `style.png`, `shape.png`, `1-conceito.png` e as fotos, cole a mesma primeira mensagem
(2.1) e continue do passo em que parou.

### Parte 3 — João Frango (ChatGPT)

Repita a parte 2 inteira numa conversa nova, usando a mensagem do **João Frango** no passo 2.1 e
salvando em `art/joao-frango/`.

### Parte 4 — Cenário: a laje (ChatGPT)

O primeiro mapa é a laje de um prédio no litoral, no fim da tarde, com vista para os morros e o mar.
O topo do prédio é a plataforma principal da luta (as paredes dos lados servem para o wall jump), e
as 2 plataformas finas flutuam acima dela, como no mapa de teste. Para outro tema, troque só a
descrição do lugar nas mensagens 4.2 e 4.6.

#### 4.1 Primeira mensagem (não gera imagem)

Abra uma **conversa nova** e **anexe** `style.png`. Cole:

```text
[BLOCO DE ESTILO]
ART STYLE "CALÇADÃO" — locked rules for every image in this conversation:
- 2D cartoon art for a platform fighting game, hand-inked caricature look, as if a Brazilian beach-boardwalk caricature artist drew characters for a modern fighting game.
- Proportions: big-head caricature, exactly 3 heads tall (head = 1/3 of total height). Compact torso, short sturdy legs, oversized hands and shoes. The whole body fits a box 1 wide by 2 tall.
- Likeness first: keep the real person's face shape, hairline, nose, eyebrows, facial hair and eye shape from the photos, and exaggerate their 1-2 most distinctive features by about 30%. Eyes stay human-shaped, not anime.
- Line: bold clean ink outline in dark plum-brown (#2B1A22), never pure black. Thicker on the outer silhouette, thinner on inner details, slightly tapered ends.
- Shading: flat cel shading only: one base color + one hard-edged shadow tone tinted cool violet + one small hard highlight. No gradients, no airbrush, no texture, no noise.
- Light: from straight above and slightly in front, so the art can be mirrored horizontally. Shadows under the chin, under the arms and on the lower part of shapes. No side lighting, no rim light.
- Colors: saturated and warm, few colors per character (3 main colors + skin + outline). Use off-white (#F6F0E4) instead of pure white.
- Clothing: everyday Brazilian clothes (t-shirts, zip jackets, caps, shorts, aprons, flip-flops, sneakers). No armor, no fantasy gear.
- Readability: a strong silhouette that still reads at 100 pixels tall. No thin straps, tiny patterns or small details.
- Never draw: text, letters, numbers, logos, brand names, watermarks, signatures, real sports team liveries.

[INSTRUÇÕES]
Background rules for this conversation: backgrounds are less saturated and lighter than the characters, with thin outlines or none, flat shapes, gradients only in the sky. The fighters must always stand out against the background.
Attached: the style anchor, for line and color reference.
We will create the first stage of the game. Do not generate any image yet. Reply only "OK".
```

#### 4.2 Arte do mapa → `1-mapa.png`

Cole:

```text
Create the STAGE KEY ART, a wide panoramic landscape image.
A rooftop ("laje") of a simple concrete building in a Brazilian coastal town at golden hour, side view like a 2D platform game. Behind it: neighboring rooftops with blue water tanks, TV antennas and a clothesline; further back, green hills ("morros") and the sea; warm orange-pink sky.
In the center, the main fighting platform: the top of the building, a flat walkable rooftop about twice as wide as it is tall (the building block itself), with plain walls on both sides. Above it, two thin floating wooden plank platforms, one on the left and one on the right.
No characters, no text.
```

**Confira:** é o mapa inteiro, montado. Ele serve de referência para as próximas 4 imagens.

**Salve como:** `art/cenario-laje/1-mapa.png`

#### 4.3 a 4.5 Camadas do fundo

O fundo do jogo é feito de 3 camadas que se movem em velocidades diferentes (o efeito de
profundidade, chamado parallax). Uma mensagem por camada. **Anexe** `1-mapa.png` em cada uma.

**4.3 Céu → `2-ceu.png`**

```text
Using the attached key art, create only the SKY layer: the sky and sun, nothing else. Very wide panoramic image, it must fill the whole frame. No text.
```

**4.4 Morros e mar → `3-longe.png`**

```text
Using the attached key art, create only the FAR layer: hills and sea along the bottom half, transparent above the hill line. Very wide panoramic image. No text.
```

**4.5 Lajes vizinhas → `4-meio.png`**

```text
Using the attached key art, create only the MID layer: the neighboring rooftops, water tanks, antennas and clothesline along the bottom part of the image, transparent above them. Very wide panoramic image. No text.
```

**Salve em:** `art/cenario-laje/`, com os nomes acima.

#### 4.6 Peças do palco → `5-pecas.png`

As proporções importam: o jogo já tem as caixas de colisão (topo do prédio 900 × 420 px, plataformas
230 × 16 px). **Anexe** `1-mapa.png`. Cole:

```text
Using the attached key art for line and colors, create the STAGE PIECES, separate, with generous space between them, transparent background:
1. The main platform: the top part of the building as one block, about 2.1 times wider than tall. The walkable rooftop surface is a perfectly flat, straight top edge, with nothing standing on it. Plain walls on the left and right sides. The bottom fades into darker shadow.
2. One thin floating wooden plank platform, about 14 times wider than tall, with two small metal brackets underneath.
3. Rooftop decoration, as separate items: a small brick barbecue grill, a blue water tank, a plastic chair, a cooler box.
No text.
```

**Confira:** o topo do prédio é uma linha reta (é onde os lutadores pisam) e não tem nada em cima.

**Salve como:** `art/cenario-laje/5-pecas.png`

### Se der errado no ChatGPT

Mande só a frase da tabela, na mesma conversa. O ChatGPT ajusta a última imagem.

| Problema                                           | Mande                                                                                                                                                                      |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Não parece o amigo                                 | `The face doesn't look enough like my friend in the photos. Keep everything else identical and redo only the face: match his <nose / eyebrows / jaw / hairline>.`          |
| Ficou genérico, parecendo outro jogo               | `Push the caricature: head exactly 1/3 of the height, exaggerate his <traço> more, warmer plum-brown outline, flat 2-tone shading with no gradients.`                      |
| Fundo xadrez cinza desenhado (transparência falsa) | `The background is a drawn checkerboard, not real transparency. Redo the same image on a solid flat magenta (#FF00FF) background, no shadows on it, nothing else changed.` |
| Peças encostando ou cortadas                       | `Some parts touch each other or are cut off. Redo with more empty space between all parts, every part complete, with rounded joint ends.`                                  |
| Apareceu texto ou logo                             | `Remove all text, letters, numbers and logos. Change nothing else.`                                                                                                        |
| Proporção mudou                                    | `Match the concept sheet exactly: same head size, same limb lengths, 3 heads tall.`                                                                                        |
| Virado para o lado errado                          | `Redo in 3/4 view facing right. Change nothing else.`                                                                                                                      |
| Luz vindo de um lado                               | `Light must come from straight above, not from the side, so the art can be mirrored. Redo the shading only.`                                                               |
| Estilo mudando depois de muitas mensagens          | Copie de novo o trecho `[BLOCO DE ESTILO]` da primeira mensagem e cole sozinho.                                                                                            |

O fundo magenta liso não é problema: o Claude remove depois.

## Depois: trazer para o Claude

No fim, a pasta `art/` fica assim (só as versões aprovadas):

```text
art/
  style/           style.png, shape.png
  schummaki/       1-conceito.png, 2-cabecas.png, 3-pecas.png, 4-efeitos.png, 5-figurinha.png
  joao-frango/     (mesmos nomes)
  cenario-laje/    1-mapa.png, 2-ceu.png, 3-longe.png, 4-meio.png, 5-pecas.png
```

Não precisa esperar terminar tudo. Assim que tiver um personagem, diga aqui no Claude, por exemplo:
_"as imagens do Schummaki estão em `art/schummaki/`, segue a Etapa 4"_. O Claude tira o fundo,
recorta e nomeia as peças, acerta a escala pelo tamanho do personagem no jogo e prepara a montagem no
esqueleto de animação.

---

## Referência: o estilo do jogo

Esta seção explica as regras que já estão dentro do `[BLOCO DE ESTILO]`. Não precisa colar nada
daqui.

### Identidade: "Calçadão"

A base é a do Brawlhalla: cartoon 2D, contorno grosso, sombra chapada e silhueta que se lê de
longe. O que separa o jogo dele:

1. **Caricatura de calçadão.** Cabeça grande e traço do amigo exagerado, como o caricaturista de
   praia faz. No Brawlhalla os corpos são heroicos (~4,5 cabeças); aqui são 3 cabeças. O rosto é o
   que faz o grupo reconhecer quem é quem.
2. **Mundo do dia a dia.** Boné, camiseta, avental, chinelo, jaqueta. Nada de armadura nem fantasia.
3. **Figurinha.** Retratos da seleção e do placar são figurinhas com borda branca de adesivo, como
   num álbum. A tela de seleção vira um álbum (Etapa 6).
4. **Tinta marrom, sombra fria.** Contorno marrom-ameixa escuro (não preto) e sombras de 1 tom,
   chapadas, puxadas para o violeta.

### Regras

| Item          | Regra                                                                                                                                                            |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Proporção     | 3 cabeças de altura. Tronco compacto, pernas curtas e firmes, mãos e tênis grandes. O corpo cabe numa caixa de 1 × 2 (como a hurtbox, ~48 × 96 px).              |
| Rosto         | Semelhança primeiro: formato do rosto, cabelo, nariz, sobrancelha, barba e olhos vêm das fotos; 1 ou 2 traços marcantes exagerados ~30%. Olho humano, não anime. |
| Contorno      | Tinta `#2B1A22`, nunca preto puro. Grosso na silhueta, fino nos detalhes internos, pontas afinando.                                                              |
| Sombreamento  | Cor base + 1 sombra de borda dura, puxada para o violeta + 1 brilho pequeno. Sem degradê, sem aerógrafo, sem textura.                                            |
| Luz           | De cima e um pouco de frente. **Nunca de lado:** o jogo espelha o personagem para virar à esquerda.                                                              |
| Vista no jogo | 3/4 virado para a direita. O jogo espelha para a esquerda, então nada de texto, número ou logo (sairia ao contrário).                                            |
| Cores         | Saturadas e quentes. Por personagem: 3 cores principais + pele + contorno. Branco = off-white `#F6F0E4`.                                                         |
| Leitura       | Tem que funcionar com ~100 px de altura: silhueta forte, nada de alça fina, estampa miúda ou detalhe menor que um dedo.                                          |
| Cenário       | Menos saturado e mais claro que os personagens, contorno fino ou nenhum. Degradê só no céu. O lutador sempre se destaca do fundo.                                |
| Proibido      | Texto, letras, números, logos, marcas, marca d'água, assinatura, uniforme de equipe real.                                                                        |

### Ficha para um personagem novo

Preencha a partir do `ELENCO.md` e das fotos, e cole no lugar da ficha na primeira mensagem (2.1).

```text
CHARACTER SHEET
Name: <apelido> — <idade>, <quem é em 1 linha>.
Fighting style: <rusher / zoner / ...> — <como isso aparece no corpo e na pose>.
Body: based on the photos; <build>.
Outfit: <roupa, peça por peça, com as cores>.
Signature details: <2-3 detalhes que ajudam a reconhecer>.
Colors: primary <hex>, secondary <hex>, accent <hex>.
Face/personality: <expressão de sempre>.
Special move: <nome> — <o que acontece>.
Taunt: <o que ele faz>.
Extra parts for the parts sheet: <mãos especiais etc., ou "none">.
Props and effects for the effects sheet: <lista>.
Avoid: <o que não pode aparecer>.
```
