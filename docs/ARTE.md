# Arte — passo a passo no ChatGPT (Etapa 4)

Este arquivo diz exatamente o que fazer no ChatGPT para gerar a arte do jogo: o que anexar, o que
colar, o que conferir e onde salvar cada imagem. No fim estão o guia de estilo (o porquê de cada
regra) e o modelo de ficha para os próximos personagens.

## Visão geral

Você vai abrir **4 conversas** no ChatGPT, uma de cada vez:

| Parte | Conversa         | O que sai                                                            | Imagens |
| ----- | ---------------- | -------------------------------------------------------------------- | ------- |
| 1     | Estilo do jogo   | Um boneco genérico no estilo do jogo + o molde do corpo              | 2       |
| 2     | Schummaki        | Conceito, cabeças com expressões, peças do corpo, efeitos, figurinha | 5       |
| 3     | João Frango      | Igual à parte 2                                                      | 5       |
| 4     | Cenário (a laje) | Arte do mapa, 3 camadas de fundo, peças do palco                     | 5       |

Todas as mensagens seguem o mesmo esquema:

- **A primeira mensagem de cada conversa não gera imagem.** Ela só passa as regras (e as fotos). O
  ChatGPT responde "OK".
- **Cada mensagem seguinte gera 1 imagem.** Você confere, baixa e salva com o nome indicado antes de
  mandar a próxima.
- **Se a imagem vier errada,** mande a correção da tabela [Se der errado](#se-der-errado) em vez de
  seguir.
- **Se o ChatGPT avisar que acabou o limite de imagens do dia,** pare e continue no dia seguinte na
  mesma conversa.

Os textos para colar estão em inglês porque o gerador segue melhor instruções técnicas assim. Você
pode conversar com ele em português nas correções.

## Parte 0 — Antes de começar

1. Peça o OK de cada amigo para usar a foto e a imagem dele (coluna "Autorizou" do `ELENCO.md`).
2. Separe 2 ou 3 fotos de cada amigo: rosto de frente bem iluminado, rosto de perfil e corpo
   inteiro. Sem óculos escuros e sem filtro.
3. Guarde as fotos **fora** da pasta do projeto. O repositório é público.
4. Crie a pasta `art/` na raiz do projeto. É lá que você vai salvar as imagens geradas (sempre em
   PNG, no tamanho original).

## Parte 1 — Estilo do jogo (só uma vez)

Esta conversa cria duas imagens que servem de referência para todas as outras:

- **`estilo.png`:** um boneco genérico desenhado no estilo do jogo. Não é nenhum amigo, para que o
  estilo passe para os outros personagens sem levar junto o rosto dele.
- **`molde.png`:** um manequim cinza, inteiro e separado em peças. Todos os amigos "vestem" esse
  molde, então todos ficam com o mesmo tamanho e cabem no mesmo esqueleto de animação.

Depois que essas duas imagens estiverem aprovadas, **não refaça**: trocar o estilo no meio deixa os
personagens com cara de jogos diferentes.

### 1.1 Primeira mensagem (não gera imagem)

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

### 1.2 Boneco do estilo → `estilo.png`

Cole:

```text
Create the STYLE ANCHOR image following the locked style rules.
One original generic character, not based on any real person: an average Brazilian guy in his late 20s, short dark hair, plain t-shirt, shorts and chunky sneakers.
Show him twice, side by side, same scale, feet on the same baseline: (1) front view, neutral standing pose; (2) 3/4 view facing right, relaxed fighting stance with fists up and knees slightly bent.
Plain flat light-gray background (#E6E6E6). Wide landscape image. No text.
```

**Confira:** cabeça grande (1/3 da altura), contorno marrom-escuro (não preto), sombra chapada sem
degradê, nenhum texto. Se gostar do visual, este é o estilo do jogo inteiro.

**Salve como:** `art/estilo/estilo.png`

### 1.3 Molde do corpo → `molde.png`

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

**Salve como:** `art/estilo/molde.png`

Pronto: a parte 1 nunca mais se repete.

## Parte 2 — Schummaki (e o roteiro de todo personagem)

Os passos abaixo valem para qualquer amigo; só a primeira mensagem muda. Cada personagem tem a sua
conversa, para o rosto de um não passar para o outro.

### 2.1 Primeira mensagem (não gera imagem)

Abra uma **conversa nova** e **anexe 3 coisas**: `estilo.png`, `molde.png` e as 2–3 fotos do amigo.
Cole a mensagem do personagem:

#### Mensagem do Schummaki

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
Outfit: generic racing-team style zip jacket in petrol blue (#1F6F78) with graphite (#3A3F47) side panels and two silver (#C9D1D9) stripes, no logos and no patches; graphite baseball cap; fingerless driving gloves in silver-gray; graphite board shorts (beach touch); chunky petrol-blue sneakers with silver soles.
Signature details: cap, racing-style jacket, driving gloves.
Colors: primary #1F6F78, secondary #3A3F47, accent #C9D1D9.
Face/personality: competitive, determined grin.
Special move: "Arrancada" — he burns rubber in place (thick tire smoke at his feet), then shoots forward like a car.
Taunt: turns an imaginary steering wheel with both hands, making "vroom vroom", then shouts his catchphrase.
Extra parts for the parts sheet: two hands gripping an invisible steering wheel (left and right).
Props and effects for the effects sheet: 4 tire-smoke puffs in different sizes (light gray, inked); 2 horizontal speed-streak shapes; 1 burnt-rubber skid mark seen from the side.
Avoid: red racing suit or red as a main color, helmets, racing numbers, names, sponsor logos, and any resemblance to a famous racing driver beyond what is in the photos.

[INSTRUÇÕES]
Attached: (1) the style anchor, for style only — do not copy its face; (2) the body template, for proportions and part layout; (3) photos of my friend, for likeness.
Do not generate any image yet. Reply only "OK" and list the 3 most distinctive facial features you see in the photos, which you will exaggerate.
```

#### Mensagem do João Frango

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
Attached: (1) the style anchor, for style only — do not copy its face; (2) the body template, for proportions and part layout; (3) photos of my friend, for likeness.
Do not generate any image yet. Reply only "OK" and list the 3 most distinctive facial features you see in the photos, which you will exaggerate.
```

Para um amigo novo, copie uma dessas mensagens e troque só o trecho entre `[FICHA DO PERSONAGEM]` e
`[INSTRUÇÕES]` pela ficha dele (modelo em [Ficha para um personagem novo](#ficha-para-um-personagem-novo)).

**Confira:** ele responde "OK" e lista 3 traços do rosto do amigo. Se faltou o traço que todo mundo
reconhece (a sobrancelha, o queixo, o cabelo), responda corrigindo, por exemplo: _"O mais marcante é
o queixo comprido, exagere isso."_

### 2.2 Conceito → `1-conceito.png`

Cole:

```text
Create the CHARACTER CONCEPT SHEET.
The same character 3 times, side by side, same scale, feet on the same baseline: front view; 3/4 view facing right; full side profile facing right. Neutral standing pose, arms relaxed.
Same proportions as the body template (3 heads tall). The face must clearly look like my friend in the photos.
Plain flat light-gray background (#E6E6E6). Wide landscape image. No text.
```

**Confira:** dá para reconhecer o amigo? Se não, use a correção "Não parece o amigo" e repita até
ficar bom. Este é o desenho que define o personagem.

**Salve como:** `art/<personagem>/1-conceito.png` (ex.: `art/schummaki/1-conceito.png`).

**Mande para o amigo aprovar antes de seguir.**

### 2.3 Cabeças com expressões → `2-cabecas.png`

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

### 2.4 Peças do corpo → `3-pecas.png`

**Anexe** `1-conceito.png` e `molde.png`. Cole:

```text
Use the attached concept sheet as the definitive design and the attached body template as the exact layout. Create the CUT-OUT ANIMATION PARTS for this character, wearing the outfit from the concept sheet.
Follow the body template exactly: same layout, same part list, same part sizes and proportions.
Parts: head (fight-ready expression, 3/4 facing right, with hair/cap); torso; hips; upper arm; forearm; fist; open hand; thigh; shin; shoe. Plus the extra parts listed in the character sheet, if any.
Clothes follow the parts: sleeves on the arm parts, pants or shorts on the hips and leg parts, accessories on the part they belong to.
Rounded, slightly extended joint ends; every part complete and straight; generous empty space between parts, none touching.
Transparent background. No text, no labels.
```

**Confira:** mesmas peças do molde, agora com a roupa do amigo, mais as mãos extras da ficha. Nada
encostando, nada cortado.

**Salve como:** `art/<personagem>/3-pecas.png`

### 2.5 Efeitos do especial → `4-efeitos.png`

**Anexe** `1-conceito.png`. Cole:

```text
Use the attached concept sheet as the reference for line and colors. Create the PROPS AND EFFECTS SHEET for this character's special move and taunt, as listed in the character sheet.
Same ink outline and flat cel shading as the character. Each item separate, generous space between them, nothing touching.
Transparent background. No text.
```

**Confira:** os itens da linha "Props and effects" da ficha (fumaça de pneu no Schummaki, frango
assado no João).

**Salve como:** `art/<personagem>/4-efeitos.png`

### 2.6 Figurinha → `5-figurinha.png`

É o retrato da tela de seleção e do placar. Pode ficar para depois, se o limite do dia apertar.

**Anexe** `1-conceito.png`. Cole:

```text
Use the attached concept sheet as the definitive design. Create the PORTRAIT STICKER for the character select screen.
Bust (head and shoulders) in 3/4 view facing right, fight-ready expression, inside a die-cut sticker: thick off-white sticker border following the outer silhouette, over a round badge in the character's primary color.
Square image, transparent background outside the sticker. No text.
```

**Salve como:** `art/<personagem>/5-figurinha.png`

**Se o personagem começar a mudar de cara** no meio da conversa, não insista nela: abra uma conversa
nova, anexe `estilo.png`, `molde.png`, `1-conceito.png` e as fotos, cole a mesma primeira mensagem
(2.1) e continue do passo em que parou.

## Parte 3 — João Frango

Repita a parte 2 inteira numa conversa nova, usando a mensagem do **João Frango** no passo 2.1 e
salvando em `art/joao-frango/`.

## Parte 4 — Cenário: a laje

O primeiro mapa é a laje de um prédio no litoral, no fim da tarde, com vista para os morros e o mar.
O topo do prédio é a plataforma principal da luta (as paredes dos lados servem para o wall jump), e
as 2 plataformas finas flutuam acima dela, como no mapa de teste. Para outro tema, troque só a
descrição do lugar nas mensagens 4.2 e 4.6.

### 4.1 Primeira mensagem (não gera imagem)

Abra uma **conversa nova** e **anexe** `estilo.png`. Cole:

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

### 4.2 Arte do mapa → `1-mapa.png`

Cole:

```text
Create the STAGE KEY ART, a wide panoramic landscape image.
A rooftop ("laje") of a simple concrete building in a Brazilian coastal town at golden hour, side view like a 2D platform game. Behind it: neighboring rooftops with blue water tanks, TV antennas and a clothesline; further back, green hills ("morros") and the sea; warm orange-pink sky.
In the center, the main fighting platform: the top of the building, a flat walkable rooftop about twice as wide as it is tall (the building block itself), with plain walls on both sides. Above it, two thin floating wooden plank platforms, one on the left and one on the right.
No characters, no text.
```

**Confira:** é o mapa inteiro, montado. Ele serve de referência para as próximas 4 imagens.

**Salve como:** `art/cenario-laje/1-mapa.png`

### 4.3 a 4.5 Camadas do fundo

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

### 4.6 Peças do palco → `5-pecas.png`

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

## Se der errado

Mande só a frase da tabela, na mesma conversa. O ChatGPT ajusta a última imagem.

| Problema                                           | Mande                                                                                                                                                                      |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Não parece o amigo                                 | `The face doesn't look enough like my friend in the photos. Keep everything else identical and redo only the face: match his <nose / eyebrows / jaw / hairline>.`          |
| Ficou genérico, parecendo outro jogo               | `Push the caricature: head exactly 1/3 of the height, exaggerate his <traço> more, warmer plum-brown outline, flat 2-tone shading with no gradients.`                      |
| Fundo xadrez cinza desenhado (transparência falsa) | `The background is a drawn checkerboard, not real transparency. Redo the same image on a solid flat magenta (#FF00FF) background, no shadows on it, nothing else changed.` |
| Peças encostando ou cortadas                       | `Some parts touch each other or are cut off. Redo with more empty space between all parts, every part complete, with rounded joint ends.`                                  |
| Apareceu texto ou logo                             | `Remove all text, letters, numbers and logos. Change nothing else.`                                                                                                        |
| Proporção mudou                                    | `Match the body template exactly: same head size, same limb lengths, 3 heads tall.`                                                                                        |
| Virado para o lado errado                          | `Redo in 3/4 view facing right, like the body template. Change nothing else.`                                                                                              |
| Luz vindo de um lado                               | `Light must come from straight above, not from the side, so the art can be mirrored. Redo the shading only.`                                                               |
| Estilo mudando depois de muitas mensagens          | Copie de novo o trecho `[BLOCO DE ESTILO]` da primeira mensagem e cole sozinho.                                                                                            |

O fundo magenta liso não é problema: o Claude remove depois.

## Depois: trazer para o Claude

No fim, a pasta `art/` fica assim (só as versões aprovadas):

```text
art/
  estilo/          estilo.png, molde.png
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
