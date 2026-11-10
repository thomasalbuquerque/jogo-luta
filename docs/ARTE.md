# Arte — guia de estilo e prompts (Etapa 4)

Guia visual único do jogo e os prompts para gerar a arte no ChatGPT. **Depois que as âncoras (A1 e
A2) forem aprovadas, o estilo fica travado:** os 16 personagens usam as mesmas regras e as mesmas
imagens de referência. Mudar o estilo no meio é o maior risco de arte do projeto (ver
`ROADMAP.md`).

## Identidade: "Calçadão"

A base é a do Brawlhalla: cartoon 2D, contorno grosso, cel shading e silhueta que se lê de longe. O
que separa o jogo dele:

1. **Caricatura de calçadão.** Cabeça grande e traço do amigo exagerado, como o caricaturista de
   praia faz. No Brawlhalla os corpos são heroicos (~4,5 cabeças); aqui são 3 cabeças. O rosto é o
   que faz o grupo reconhecer quem é quem.
2. **Mundo do dia a dia.** Boné, camiseta, avental, chinelo, jaqueta. Nada de armadura nem fantasia.
   O visual de cada um vem do que ele veste e do bordão.
3. **Figurinha.** Retratos da seleção e do HUD são figurinhas: recorte com borda branca de adesivo,
   como num álbum. A tela de seleção vira um álbum (Etapa 6).
4. **Tinta marrom, sombra fria.** Contorno marrom-ameixa escuro (não preto) e sombras de 1 tom,
   chapadas, puxadas para o violeta. Dá um ar de ilustração de papel, mais quente que o Brawlhalla.

## Regras travadas

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

## Como usar no ChatGPT

**Por que os prompts estão em inglês:** o gerador segue instruções técnicas (proporção, fundo,
layout) com mais precisão em inglês. As conversas com o ChatGPT podem ser em português.

### Antes de começar

- Peça o OK de cada amigo para usar foto e imagem (coluna "Autorizou" do `ELENCO.md`).
- Separe 2 ou 3 fotos de cada um: rosto de frente bem iluminado, rosto de perfil e corpo inteiro.
  Sem óculos escuros, sem filtro, sem boné cobrindo o cabelo (a menos que o boné seja o visual dele).
- **Fotos dos amigos nunca entram no repositório** (ele é público).

### Ordem (e prioridade, se a cota diária acabar)

| #   | Conversa no ChatGPT                        | Imagens | O que sai                                                 |
| --- | ------------------------------------------ | ------- | --------------------------------------------------------- |
| 1   | **Âncoras** (uma vez só, nunca mais refaz) | 2       | A1 estilo, A2 molde do corpo                              |
| 2   | **Schummaki** (conversa nova)              | 4–5     | C1 conceito, C2 cabeças, C3 peças, C4 props, C5 figurinha |
| 3   | **João Frango** (conversa nova)            | 4–5     | idem                                                      |
| 4   | **Cenário** (conversa nova)                | 4       | S1 arte do mapa, S2 camadas, S3 peças                     |

Contando as tentativas, são uns 20–30 pedidos de imagem. No plano gratuito, faça um bloco por dia.

### Regras de uso

- **Uma conversa por personagem.** Dentro da conversa o ChatGPT lembra das imagens anteriores (ajuda
  a manter o mesmo personagem); entre personagens, conversa nova evita que um rosto vaze para o outro.
- **Primeira mensagem não gera imagem.** Ela só cola as regras, a ficha e as fotos. As próximas
  mensagens são curtas e cada uma pede 1 imagem.
- **Uma imagem por mensagem.** Pedir várias juntas piora tudo.
- Se o resultado começar a fugir do estilo depois de várias mensagens, cole o bloco de estilo de novo.
- **Fundo transparente:** os prompts pedem fundo transparente. Se vier um xadrez cinza _desenhado_
  (falso), use a correção "fundo falso" no fim deste arquivo: fundo magenta liso, que o Claude
  remove depois.
- Antes de seguir para C2, mande o C1 para o amigo aprovar.

### Onde salvar o que vier do ChatGPT

Baixe em PNG, no tamanho original, e salve com estes nomes. Guarde só a versão aprovada de cada um.

```text
art/
  _style/        a1-anchor.png, a2-body-template.png
  schummaki/     c1-concept.png, c2-heads.png, c3-parts.png, c4-props.png, c5-portrait.png
  joao-frango/   (mesmos nomes)
  stage-laje/    s1-keyart.png, s2-sky.png, s2-far.png, s2-mid.png, s3-pieces.png
```

Depois, aqui no Claude: _"as imagens do Schummaki estão em `art/schummaki/`, segue a Etapa 4"_. O
Claude tira o fundo, recorta e nomeia as peças, acerta a escala pela hurtbox e prepara a montagem
no esqueleto.

---

## Bloco de estilo (já incluído na Mensagem 1 de cada conversa)

```text
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
```

---

## Conversa 1 — Âncoras (uma vez só)

### Mensagem 1 (sem imagem)

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

### A1 — Âncora de estilo

Um personagem genérico, que **não** é nenhum amigo. Assim o estilo vai junto para as outras
conversas, mas o rosto não.

```text
Create the STYLE ANCHOR image following the locked style rules.
One original generic character, not based on any real person: an average Brazilian guy in his late 20s, short dark hair, plain t-shirt, shorts and chunky sneakers.
Show him twice, side by side, same scale, feet on the same baseline: (1) front view, neutral standing pose; (2) 3/4 view facing right, relaxed fighting stance with fists up and knees slightly bent.
Plain flat light-gray background (#E6E6E6). Wide landscape image. No text.
```

### A2 — Molde do corpo (esqueleto)

Este é o molde que todos os amigos vão "vestir". As peças de todos precisam ter o mesmo tamanho para
caberem no mesmo esqueleto do DragonBones. O braço e a perna de trás usam a mesma peça, escurecida
no rig.

```text
Now create the BODY TEMPLATE for a 2D cut-out (skeletal) animation rig, using the style anchor above for line, shading and exact proportions.
A neutral faceless mannequin with the exact same proportions as the anchor character: smooth medium-gray body (#9AA0A6), same outline, no clothes, no hair, no face details.
Left third of the image: the whole mannequin assembled, 3/4 view facing right, neutral standing pose, arms hanging slightly away from the body.
Right two thirds: the same mannequin split into separate parts, laid out in a tidy grid with generous empty space between them, no part touching or overlapping another:
head; torso (neck to waist); hips (waist to crotch); upper arm; forearm; hand closed in a fist; open hand; thigh; shin; shoe.
Every limb part has rounded, slightly extended ends at the joints (shoulder, elbow, wrist, hip, knee, ankle) so the parts overlap when rotated, like paper puppet pieces. Draw limb parts straight and vertical, each one complete, nothing cut off by the image border.
Transparent background. No text, no numbers, no labels.
```

---

## Conversas 2 e 3 — Personagens

### Mensagem 1 (sem imagem)

Anexe: **A1, A2 e as 2–3 fotos do amigo.** Copie a mensagem inteira do personagem. Para os próximos 14, copie uma delas e troque só o trecho entre `[FICHA DO PERSONAGEM]` e `[INSTRUÇÕES]` pela ficha do novo personagem (modelo em [Fichas dos personagens](#fichas-dos-personagens)).

#### Schummaki

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
Extra parts for C3: two hands gripping an invisible steering wheel (left and right).
Props and effects for C4: 4 tire-smoke puffs in different sizes (light gray, inked); 2 horizontal speed-streak shapes; 1 burnt-rubber skid mark seen from the side.
Avoid: red racing suit or red as a main color, helmets, racing numbers, names, sponsor logos, and any resemblance to a famous racing driver beyond what is in the photos.

[INSTRUÇÕES]
Attached: (1) the style anchor, for style only — do not copy its face; (2) the body template, for proportions and part layout; (3) photos of my friend, for likeness.
Do not generate any image yet. Reply only "OK" and list the 3 most distinctive facial features you see in the photos, which you will exaggerate.
```

#### João Frango

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
Extra parts for C3: two hands cupped around the mouth, as when shouting (left and right).
Props and effects for C4: the roast chicken projectile, side view flying right, in 3 slightly different rotation frames; 3 small steam puffs; 1 short motion-trail shape behind the chicken.
Avoid: restaurant names, text or logos on the apron or cap.

[INSTRUÇÕES]
Attached: (1) the style anchor, for style only — do not copy its face; (2) the body template, for proportions and part layout; (3) photos of my friend, for likeness.
Do not generate any image yet. Reply only "OK" and list the 3 most distinctive facial features you see in the photos, which you will exaggerate.
```

Confira a lista que ele devolver. Se faltou o traço que todo mundo reconhece (a sobrancelha, o
queixo, o cabelo), corrija antes de seguir.

### C1 — Conceito (frente, 3/4 e perfil)

```text
Create the CHARACTER CONCEPT SHEET.
The same character 3 times, side by side, same scale, feet on the same baseline: front view; 3/4 view facing right; full side profile facing right. Neutral standing pose, arms relaxed.
Same proportions as the body template (3 heads tall). The face must clearly look like my friend in the photos.
Plain flat light-gray background (#E6E6E6). Wide landscape image. No text.
```

### C2 — Cabeças (expressões)

Essas 4 cabeças são as concept art de expressão e também as cabeças do rig: o jogo troca a cabeça
inteira conforme a animação.

```text
Using the approved concept sheet above as the definitive design, create the HEAD EXPRESSION SHEET.
4 heads only, cut at the neck, no body. All in 3/4 view facing right, same size, same angle, same hair/cap, in a 2x2 grid with generous space between them:
1. Fight-ready: confident, slight smirk.
2. Hurt: eyes squeezed shut, teeth clenched, recoiling from a hit.
3. Taunt: mouth wide open shouting the catchphrase, eyebrows raised.
4. KO: dizzy spiral eyes, mouth hanging open, tongue slightly out.
Transparent background. No text.
```

### C3 — Peças para o esqueleto

```text
Create the CUT-OUT ANIMATION PARTS for this character, wearing the outfit from the concept sheet.
Follow the body template exactly: same layout, same part list, same part sizes and proportions.
Parts: head (fight-ready expression, 3/4 facing right, with hair/cap); torso; hips; upper arm; forearm; fist; open hand; thigh; shin; shoe. Plus the extra parts listed in the character sheet, if any.
Clothes follow the parts: sleeves on the arm parts, pants or shorts on the hips and leg parts, accessories on the part they belong to.
Rounded, slightly extended joint ends; every part complete and straight; generous empty space between parts, none touching.
Transparent background. No text, no labels.
```

### C4 — Props e efeitos do especial

```text
Create the PROPS AND EFFECTS SHEET for this character's special move and taunt, as described in the character sheet.
Same ink outline and flat cel shading as the character. Each item separate, generous space between them, nothing touching.
Transparent background. No text.
```

### C5 — Figurinha (retrato da seleção e do HUD)

Pode ficar para a Etapa 6, se a cota apertar.

```text
Create the PORTRAIT STICKER for the character select screen.
Bust (head and shoulders) in 3/4 view facing right, fight-ready expression, inside a die-cut sticker: thick off-white sticker border following the outer silhouette, over a round badge in the character's primary color.
Square image, transparent background outside the sticker. No text.
```

---

## Fichas dos personagens

As fichas abaixo já estão coladas na Mensagem 1 de cada personagem. Para os próximos 14, copie o modelo e preencha a partir do
`ELENCO.md` e das fotos.

### Modelo

```text
CHARACTER SHEET
Name: <apelido> — <idade>, <quem é em 1 linha>.
Fighting style: <rusher / zoner / ...> — <como isso aparece no corpo e na pose>.
Body: based on the photos; <build>.
Outfit: <roupa, peça por peça, com as cores>.
Signature details: <2-3 detalhes que ajudam a reconhecer>.
Colors: primary <hex>, secondary <hex>, accent <hex>.
Face/personality: <expressão de sempre>.
Special move: <nome> — <o que acontece, para o C4>.
Taunt: <o que ele faz>.
Extra parts for C3: <mãos especiais etc., ou "none">.
Props and effects for C4: <lista>.
Avoid: <o que não pode aparecer>.
```

### Schummaki

```text
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
Extra parts for C3: two hands gripping an invisible steering wheel (left and right).
Props and effects for C4: 4 tire-smoke puffs in different sizes (light gray, inked); 2 horizontal speed-streak shapes; 1 burnt-rubber skid mark seen from the side.
Avoid: red racing suit or red as a main color, helmets, racing numbers, names, sponsor logos, and any resemblance to a famous racing driver beyond what is in the photos.
```

### João Frango

```text
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
Extra parts for C3: two hands cupped around the mouth, as when shouting (left and right).
Props and effects for C4: the roast chicken projectile, side view flying right, in 3 slightly different rotation frames; 3 small steam puffs; 1 short motion-trail shape behind the chicken.
Avoid: restaurant names, text or logos on the apron or cap.
```

---

## Conversa 4 — Cenário: "Laje"

Primeiro mapa: a laje de um prédio no litoral, no fim da tarde, com vista para os morros e o mar.
Junta os dois primeiros (caiçara e carioca) e combina com a geometria do mapa de teste: a plataforma
principal é o topo do prédio (as laterais são as paredes do wall jump) e as 2 plataformas
atravessáveis flutuam acima dela. Se preferir outro tema, troque só a descrição do lugar nos prompts.

### Mensagem 1 (sem imagem)

Anexe: **A1.**

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

### S1 — Arte do mapa (referência)

```text
Create the STAGE KEY ART, a wide panoramic landscape image.
A rooftop ("laje") of a simple concrete building in a Brazilian coastal town at golden hour, side view like a 2D platform game. Behind it: neighboring rooftops with blue water tanks, TV antennas and a clothesline; further back, green hills ("morros") and the sea; warm orange-pink sky.
In the center, the main fighting platform: the top of the building, a flat walkable rooftop about twice as wide as it is tall (the building block itself), with plain walls on both sides. Above it, two thin floating wooden plank platforms, one on the left and one on the right.
No characters, no text.
```

### S2 — Camadas do parallax (3 imagens, uma por mensagem)

```text
Using the key art above, create only the SKY layer: the sky and sun, nothing else. Very wide panoramic image, it must fill the whole frame. No text.
```

```text
Using the key art above, create only the FAR layer: hills and sea along the bottom half, transparent above the hill line. Very wide panoramic image. No text.
```

```text
Using the key art above, create only the MID layer: the neighboring rooftops, water tanks, antennas and clothesline along the bottom part of the image, transparent above them. Very wide panoramic image. No text.
```

### S3 — Peças do palco

As medidas importam: o código já tem as caixas de colisão (topo do prédio 900 × 420 px, plataformas
230 × 16 px).

```text
Create the STAGE PIECES, separate, with generous space between them, transparent background:
1. The main platform: the top part of the building as one block, about 2.1 times wider than tall. The walkable rooftop surface is a perfectly flat, straight top edge, with nothing standing on it. Plain walls on the left and right sides. The bottom fades into darker shadow.
2. One thin floating wooden plank platform, about 14 times wider than tall, with two small metal brackets underneath.
3. Rooftop decoration, as separate items: a small brick barbecue grill, a blue water tank, a plastic chair, a cooler box.
Same line and colors as the key art. No text.
```

---

## Correções rápidas

Mensagens curtas para quando a imagem vier com problema. Elas não repetem o resto do prompt: o
ChatGPT ajusta a última imagem.

| Problema                       | Mensagem                                                                                                                                                                   |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Não parece o amigo             | `The face doesn't look enough like my friend in the photos. Keep everything else identical and redo only the face: match his <nose / eyebrows / jaw / hairline>.`          |
| Ficou genérico ou "Brawlhalla" | `Push the caricature: head exactly 1/3 of the height, exaggerate his <traço> more, warmer plum-brown outline, flat 2-tone shading with no gradients.`                      |
| Fundo falso (xadrez desenhado) | `The background is a drawn checkerboard, not real transparency. Redo the same image on a solid flat magenta (#FF00FF) background, no shadows on it, nothing else changed.` |
| Peças encostando ou cortadas   | `Some parts touch each other or are cut off. Redo with more empty space between all parts, every part complete, with rounded joint ends.`                                  |
| Apareceu texto ou logo         | `Remove all text, letters, numbers and logos. Change nothing else.`                                                                                                        |
| Proporção mudou                | `Match the body template exactly: same head size, same limb lengths, 3 heads tall.`                                                                                        |
| Vista errada                   | `Redo in 3/4 view facing right, like the body template. Change nothing else.`                                                                                              |
| Luz de lado                    | `Light must come from straight above, not from the side, so the art can be mirrored. Redo the shading only.`                                                               |
