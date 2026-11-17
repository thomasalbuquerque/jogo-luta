# Cenários novos — textos para o Firefly

Sete mapas novos, um para cada lugar do grupo. Cada um tem um **formato de plataformas diferente**
da laje e dos outros, sempre simples: no máximo um vão ou um degrau, nada de labirinto.

O caminho é o mesmo da [laje](ARTE.md#cenário-a-laje): 5 imagens por mapa, geradas no Firefly com o
modelo GPT Image 1.5 (ver [Como gerar uma imagem no Firefly](ARTE.md#como-gerar-uma-imagem-no-firefly)).

| Mapa                                                                        | Pasta                      | Formato                                              | Situação |
| --------------------------------------------------------------------------- | -------------------------- | ---------------------------------------------------- | -------- |
| [Oficina do Tchula](#1-oficina-do-tchula)                                   | `art/cenario-oficina/`     | Chão largo e uma passarela larga no meio             | no jogo  |
| [Pilates do Crocko](#2-pilates-do-crocko)                                   | `art/cenario-pilates/`     | Dois degraus: barra baixa à esquerda, alta à direita | a fazer  |
| [São Sebastião do Schummy e do Meia](#3-são-sebastião-do-schummy-e-do-meia) | `art/cenario-praia/`       | Areia, um vão de mar e um barco; uma prancha no alto | a fazer  |
| [Prefeitura do Gabs](#4-prefeitura-do-gabs)                                 | `art/cenario-prefeitura/`  | Triângulo: duas baixas dos lados e uma alta no meio  | a fazer  |
| [Quadra de vôlei do Igão](#5-quadra-de-vôlei-do-igão)                       | `art/cenario-quadra/`      | O chão mais largo, liso, só com a cadeira do juiz    | a fazer  |
| [Confeitaria do Darllan](#6-confeitaria-do-darllan)                         | `art/cenario-confeitaria/` | Bancada com um degrau sólido (o forno) na ponta      | no jogo  |
| [Concerto do Tauba](#7-concerto-do-tauba)                                   | `art/cenario-teatro/`      | Palco estreito e dois camarotes para fora dele       | a fazer  |

## O formato de cada mapa

Desenho em escala (cada letra vale 25 px de largura e cada linha 50 px de altura; o lutador tem
48 × 96 px). `█` é chão sólido, com parede dos lados e borda para agarrar; `━` é plataforma
atravessável. A laje vem primeiro, para comparar.

```text
Laje (o mapa de hoje)
           ━━━━━━━━━            ━━━━━━━━━


        ████████████████████████████████████

1. Oficina: uma passarela larga no meio
                  ━━━━━━━━━━━━━━━━


      ████████████████████████████████████████

2. Pilates: dois degraus
                                ━━━━━━━━━

           ━━━━━━━━━

        ████████████████████████████████████

3. São Sebastião: a prancha no alto, o barco no mar
           ━━━━━━━━━


  ███████████████████████████████████   ▀▀▀▀▀▀▀▀▀

4. Prefeitura: triângulo
                      ━━━━━━━━

           ━━━━━━━━              ━━━━━━━━


        ████████████████████████████████████

5. Quadra: chão liso e a cadeira do juiz
                                        ━━━━━


   ██████████████████████████████████████████████

6. Confeitaria: o forno é um degrau sólido
          ━━━━━━━━━                   █████████
                                      █████████
                                      █████████
     ██████████████████████████████████████████

7. Concerto: os camarotes ficam fora do palco
━━━━━━━━                                    ━━━━━━━━

          ████████████████████████████████
```

As medidas abaixo são o alvo das caixas de colisão, em px do jogo (x = 0 no meio, y = 0 no chão,
para cima é negativo). Na hora de montar o mapa, o Claude acerta os números com a arte que saiu.

| Mapa          | Chão sólido (x de … a …)                                   | Plataformas atravessáveis (x de … a …, altura)                    |
| ------------- | ---------------------------------------------------------- | ----------------------------------------------------------------- |
| Laje (hoje)   | −450 a 450                                                 | −380 a −150 e 150 a 380, as duas a 150 do chão                    |
| Oficina       | −500 a 500                                                 | −190 a 190, a 150                                                 |
| Pilates       | −450 a 450                                                 | −380 a −160, a 110; 160 a 380, a 210                              |
| São Sebastião | −600 a 280 (areia)                                         | barco: 360 a 580, na altura da areia; prancha: −380 a −160, a 150 |
| Prefeitura    | −460 a 460                                                 | −380 a −180 e 180 a 380, a 130; −110 a 110, a 250                 |
| Quadra        | −575 a 575                                                 | cadeira do juiz: 350 a 480, a 150                                 |
| Confeitaria   | bancada: −520 a 180; forno: 180 a 520, com o topo 65 acima | biscoito: −440 a −170, a 150                                      |
| Concerto      | −400 a 400                                                 | camarotes: −640 a −440 e 440 a 640, a 110                         |

O forno da confeitaria saiu baixo (65), para subir da bancada com um pulo só. Todas as alturas
cabem no pulo de quem pula menos (Darllan: 162 px no primeiro pulo, 284 com o
segundo). As de até 150 saem com um pulo só; as de 210 e 250 pedem o segundo pulo ou uma plataforma
mais baixa no caminho.

## Como gerar (vale para os 7)

Cada mapa tem as mesmas 5 imagens, salvas na pasta dele:

| Arquivo       | O que é                                                              | Referência (_Reference images_)            |
| ------------- | -------------------------------------------------------------------- | ------------------------------------------ |
| `1-mapa.png`  | O mapa inteiro, montado. Serve de referência para as outras 4.       | `art/cenario-laje/1-mapa.png` (só o traço) |
| `2-fundo.png` | A camada de trás, na imagem inteira: o céu ou a parede do fundo.     | o `1-mapa.png` do próprio mapa             |
| `3-longe.png` | A camada de longe, na metade de baixo, com magenta em cima.          | o `1-mapa.png` do próprio mapa             |
| `4-meio.png`  | A camada do meio, na parte de baixo, com magenta em cima.            | o `1-mapa.png` do próprio mapa             |
| `5-pecas.png` | As peças do palco (chão, plataformas, decorações), em fundo magenta. | o `1-mapa.png` do próprio mapa             |

- **Formato:** o mesmo da laje, o mais largo que o Firefly oferecer (as imagens da laje têm
  1536 × 864 px).
- **O `2-fundo.png` é o `2-ceu.png` da laje** com outro nome, porque nos mapas fechados ele é uma
  parede.
- **Comece por um mapa só**, de preferência a oficina (o formato mais simples), e traga para o
  Claude montar antes de gerar os outros. São 35 imagens no total; se algo no jeito de pedir
  precisar mudar, é melhor descobrir na 5ª do que na 35ª.
- **Gere o `1-mapa.png` e aprove antes das outras 4.** Elas copiam dele.
- Os textos já cabem no limite de ~1.000 caracteres do Firefly. Se acrescentar alguma coisa, tire
  outra.

**Confira em todo mapa:**

| Imagem        | Tem que ter                                                                                                    |
| ------------- | -------------------------------------------------------------------------------------------------------------- |
| `1-mapa.png`  | As plataformas na quantidade e no lugar do desenho acima. Nenhuma pessoa (fora a orquestra, no concerto).      |
| Camadas       | Magenta liso em cima (menos no `2-fundo.png`, que enche a imagem). Nada do palco: nem chão, nem plataformas.   |
| `5-pecas.png` | O topo do chão é uma linha reta, sem nada em cima. Peças separadas, nenhuma cortada, fundo magenta sem sombra. |
| Todas         | Sem texto, letreiro, número ou logo. Cores mais claras e menos saturadas que as dos personagens.               |

**Se der errado**, anexe a imagem com defeito e mande a frase (troque o trecho entre `<...>`). As
frases de fundo e de texto da [tabela do ARTE.md](ARTE.md#se-der-errado-no-firefly) também valem.

| Problema                              | Mande                                                                                                                                                                               |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plataformas a mais ou no lugar errado | `Edit the attached stage art: there must be exactly <one wide platform above the center of the main platform>. Remove any other floating platform. Keep everything else the same.`  |
| Copiou a laje (pôr do sol, tábuas)    | Gere de novo. Se insistir, tire a referência e troque o começo do texto por `Stage art for a 2D platform fighting game, side view, soft cartoon style: thin outlines, flat shapes.` |
| Apareceu gente                        | `Edit the attached image: remove all people. Keep everything else the same.`                                                                                                        |
| Coisas em cima do chão principal      | `Edit the attached image: remove everything standing on top of the main platform. Its top is a flat, straight edge. Keep everything else the same.`                                 |
| Camada com o palco junto              | `Edit the attached image: remove the main platform and the floating platforms and replace them with solid flat magenta (#FF00FF). Keep everything else the same.`                   |
| Cores fortes demais                   | `Edit the attached image: make the colors lighter and less saturated, with thinner outlines. Keep everything else the same.`                                                        |

## 1. Oficina do Tchula

Oficina mecânica de caminhão, nas cores do Tchula (cinza, preto e pouco amarelo). O chão é uma rampa
de inspeção de concreto, e a única plataforma é uma passarela de grade de aço pendurada por
correntes, larga e bem no meio. Salve em `art/cenario-oficina/`.

**Mapa → `1-mapa.png`** (referência: `art/cenario-laje/1-mapa.png`)

```text
Stage art for a 2D platform fighting game, side view. Copy only the drawing style of the attached image (thin outlines, flat shapes, soft colors), not its place, colors or platforms. No characters.
Inside a Brazilian truck repair shop. In the center, the main platform: a raised concrete service ramp, a block about twice as wide as tall, with a flat top, plain walls on both sides and a thin yellow-and-black hazard stripe along the top edge. Above its center, one wide steel grating walkway hanging from the ceiling by two chains. No other platforms. Behind: two cab-over trucks, one with the cab tilted open, stacks of truck tires, a tool wall, oil drums and an engine hoist; corrugated metal walls and a big open garage door with daylight. Colors: light grays, dark gray (#6E737B) and near-black, with only a few small yellow (#F2C230) accents. No text.
```

**Parede do fundo → `2-fundo.png`** (referência nesta e nas próximas: o `1-mapa.png` da oficina)

```text
Using the attached stage art, draw only the back wall of the truck repair shop, filling the whole image, with the same colors and style: corrugated metal wall, high windows, steel roof beams, hanging lamps and a big open garage door with daylight. Nothing in front of the wall: no trucks, no tools, no platforms. No text.
```

**Caminhões → `3-longe.png`**

```text
Using the attached stage art, draw only the far layer: two cab-over trucks parked side by side, one with the cab tilted open, and a tall shelf of truck parts, standing along the bottom half on a concrete floor that reaches the bottom of the image, with the same colors and style. Everything above them is solid flat magenta (#FF00FF). No walls, no platforms, no text.
```

**Bancada e ferramentas → `4-meio.png`**

```text
Using the attached stage art, draw only the middle layer: a long workbench with a vise, a tool wall panel, a tool cart, stacks of truck tires, oil drums, an air compressor and an engine hoist, standing along the bottom part on a concrete floor that reaches the bottom of the image, with the same colors and style. Everything above them is solid flat magenta (#FF00FF). No trucks, no main platform, no hanging walkway, no text.
```

**Peças do palco → `5-pecas.png`**

```text
Using the attached stage art for style and colors, draw the stage pieces separately, with space between them, on a solid flat magenta (#FF00FF) background:
1. The main platform: the concrete service ramp as one block about 3 times wider than tall. Its top is a perfectly flat, straight edge with nothing on it; a thin yellow-and-black hazard stripe runs just below the edge. Plain walls on both sides; the bottom fades into shadow.
2. One steel grating walkway about 20 times wider than tall, flat top, with a short piece of chain going up from each end.
3. One straight vertical piece of the same chain.
4. Separate decorations: a stack of three truck tires, a tool cart, an oil drum, a yellow hydraulic floor jack.
No text.
```

**Confira:** uma passarela só, no meio. O amarelo aparece só em detalhes (faixa, macaco, talha). O
pedaço de corrente solto serve para o Claude repetir a corrente até o teto.

## 2. Pilates do Crocko

Estúdio de pilates claro, com os quatro aparelhos (Reformer, Cadillac, Chair e Ladder Barrel),
plantas e os equipamentos pequenos, nas cores do Crocko (turquesa, branco e preto). O chão é um
tablado de madeira clara, e as plataformas são duas barras de madeira penduradas por cordas com
mola: uma baixa à esquerda e uma alta à direita. Salve em `art/cenario-pilates/`.

**Mapa → `1-mapa.png`** (referência: `art/cenario-laje/1-mapa.png`)

```text
Stage art for a 2D platform fighting game, side view. Copy only the drawing style of the attached image (thin outlines, flat shapes, soft colors), not its place, colors or platforms. No characters.
Inside a bright pilates studio. In the center, the main platform: a raised light-wood studio floor, a block about twice as wide as tall, with a flat top and plain walls on both sides. Above it, two thin wooden bar platforms hanging from the ceiling by white ropes with springs: a low one on the left and a clearly higher one on the right, like two steps. Behind: pilates apparatus (a Reformer, a Cadillac trapeze table, a Wunda Chair and a Ladder Barrel), wall bars, a big mirror, potted plants, exercise balls, light dumbbells, a coiled rope, wooden sticks and rolled mats; white walls and large windows with soft daylight. Colors: white, light wood, turquoise (#1BA39C) accents, black frames. No text.
```

**Parede do fundo → `2-fundo.png`** (referência nesta e nas próximas: o `1-mapa.png` do pilates)

```text
Using the attached stage art, draw only the back wall of the pilates studio, filling the whole image, with the same colors and style: white wall, large windows with soft daylight, a big wall mirror, wooden wall bars and a shelf with small potted plants. Nothing in front of the wall: no apparatus, no props, no platforms. No text.
```

**Cadillac e Ladder Barrel → `3-longe.png`**

```text
Using the attached stage art, draw only the far layer: a Cadillac (pilates trapeze table) and a Ladder Barrel with tall potted plants between them, standing along the bottom half on a light-wood floor that reaches the bottom of the image, with the same colors and style. Everything above them is solid flat magenta (#FF00FF). No walls, no platforms, no text.
```

**Reformer, Chair e equipamentos → `4-meio.png`**

```text
Using the attached stage art, draw only the middle layer: a pilates Reformer and a Wunda Chair, a rack of light dumbbells, exercise balls, a coiled rope, wooden sticks leaning on a stand, rolled mats and potted plants, standing along the bottom part on a light-wood floor that reaches the bottom of the image, with the same colors and style. Everything above them is solid flat magenta (#FF00FF). No main platform, no hanging platforms, no text.
```

**Peças do palco → `5-pecas.png`**

```text
Using the attached stage art for style and colors, draw the stage pieces separately, with space between them, on a solid flat magenta (#FF00FF) background:
1. The main platform: the raised light-wood studio floor as one block about 3 times wider than tall. Its top is a perfectly flat, straight edge with nothing on it. Plain walls on both sides; the bottom fades into shadow.
2. One thin wooden bar platform about 13 times wider than tall, flat top, with a short piece of white rope with a spring going up from each end.
3. One straight vertical piece of the same white rope.
4. Separate decorations: a big turquoise exercise ball, a potted monstera plant in a white vase, a small rack of light dumbbells, a basket with rolled mats and wooden sticks.
No text.
```

**Confira:** dá para reconhecer os quatro aparelhos (dois em cada camada). No `1-mapa.png`, a barra
da direita fica bem mais alta que a da esquerda. A bola turquesa é a "bola suíça no fundo de um
mapa" das ideias guardadas do Crocko.

## 3. São Sebastião do Schummy e do Meia

Praia de dia: muita areia e um pedaço pequeno de mar, à direita. O chão é a faixa de areia; depois
de um vão pequeno de mar vem um barco de pesca, na altura da areia, e no alto, à esquerda, uma
prancha de surfe. No fundo, o condomínio de casas de praia com telha cerâmica, **um** chinelo branco
num telhado e a rua de asfalto. Salve em `art/cenario-praia/`.

**Mapa → `1-mapa.png`** (referência: `art/cenario-laje/1-mapa.png`)

```text
Stage art for a 2D platform fighting game, side view. Copy only the drawing style of the attached image (thin outlines, flat shapes, soft colors), not its place, colors or platforms. No characters.
A beach in a small Brazilian coastal town on a sunny day. The main platform: a wide block of beach sand, about twice as wide as tall, with a flat top and plain walls; its right end meets a small strip of sea. On the sea, right next to the sand, a small wooden fishing boat with a flat deck level with the sand. Above the left half of the sand, one surfboard lying flat, floating in the air like a thin platform. No other platforms. Behind: more sand, a strip of asphalt street, then a condominium of beach houses with clay tile roofs behind a low white wall; exactly one white flip-flop lies on one roof; coconut palms; far behind, green forested hills. On the right quarter, the sea up to the horizon. Blue sky, few clouds. No text.
```

**Céu → `2-fundo.png`** (referência nesta e nas próximas: o `1-mapa.png` da praia)

```text
Using the attached stage art, draw only the sky, filling the whole image, with the same colors and style: bright blue summer sky with a few soft white clouds. Nothing else: no hills, no sea, no houses, no palms. No text.
```

**Morros e mar → `3-longe.png`**

```text
Using the attached stage art, draw only the far layer along the bottom half: green forested hills and, on the right quarter, the sea up to the horizon with a distant island, with the same colors and style. Everything above the hills is solid flat magenta (#FF00FF). No houses, no beach, no text.
```

**Condomínio, rua e areia → `4-meio.png`**

```text
Using the attached stage art, draw only the middle layer along the bottom part: the condominium of beach houses with clay tile roofs behind a low white wall, coconut palms, a strip of asphalt street with a curb in front of the wall, then beach sand down to the bottom of the image; on the right quarter, the sea. Exactly one white flip-flop (a single one, not a pair) lies on one of the roofs. Same colors and style. Everything above the roofs and palms is solid flat magenta (#FF00FF). No main platform, no boat, no surfboard, no text.
```

**Peças do palco → `5-pecas.png`**

```text
Using the attached stage art for style and colors, draw the stage pieces separately, with space between them, on a solid flat magenta (#FF00FF) background:
1. The main platform: a block of beach sand about 3 times wider than tall. Its top is a perfectly flat, straight edge with nothing on it. Plain sand walls on both sides; the bottom fades into shadow.
2. A small wooden fishing boat, side view, about 4 times wider than tall. Its top is a flat plank deck, a straight edge with nothing above it.
3. One surfboard lying flat, side view, about 14 times wider than tall, white with one red and one cyan stripe, a small fin underneath.
4. One strip of sea surface with small waves, side view, about 6 times wider than tall.
5. Separate decorations: a beach umbrella stuck in the sand, a folding beach chair, a green coconut with a straw, a sandcastle with a small bucket.
No text.
```

**Confira:** no `4-meio.png`, um chinelo só (não o par), branco, em cima de um telhado; telhados de
telha cerâmica; a rua de asfalto aparece; o mar ocupa só um pedaço à direita. Esta camada não pode
ser repetida espelhada para os lados, como na laje (apareceriam três chinelos e mar dos dois lados):
se puder, alargue no Photoshop com a _Expansão generativa_; senão o Claude completa as laterais. A
prancha leva o vermelho do Schummy e o ciano do Meia.

## 4. Prefeitura do Gabs

A praça em frente à prefeitura de uma cidade pequena do Brasil, de manhã. O chão é um calçadão de
pedra portuguesa, e as três plataformas são beirais de pedra em triângulo: duas baixas dos lados e
uma alta no meio. O prédio leva o azul-royal do Gabs nos detalhes. Salve em
`art/cenario-prefeitura/`.

**Mapa → `1-mapa.png`** (referência: `art/cenario-laje/1-mapa.png`)

```text
Stage art for a 2D platform fighting game, side view. Copy only the drawing style of the attached image (thin outlines, flat shapes, soft colors), not its place, colors or platforms. No characters.
The square in front of the city hall of a small Brazilian town, on a clear morning. In the center, the main platform: a raised stone plaza, a block about twice as wide as tall, with a flat top paved in a black-and-white wave mosaic and plain stone walls on both sides. Above it, three thin stone ledge platforms forming a triangle: two low ones on the left and right, and one higher in the center. Behind: the city hall, a two-story colonial building in cream with royal-blue (#2F5DA8) trim, arched windows, a central door with steps and columns, a balcony with the Brazilian flag between two plain flags, a clock without numbers on top; imperial palm trees; far behind, a church tower and low houses. Pale blue sky. No text.
```

**Céu → `2-fundo.png`** (referência nesta e nas próximas: o `1-mapa.png` da prefeitura)

```text
Using the attached stage art, draw only the sky, filling the whole image, with the same colors and style: pale blue morning sky with a few thin clouds. Nothing else: no buildings, no trees, no hills. No text.
```

**Cidade ao longe → `3-longe.png`**

```text
Using the attached stage art, draw only the far layer along the bottom half: the skyline of a small Brazilian town, with a white church tower, low houses with clay tile roofs, trees and soft green hills, with the same colors and style. Everything above them is solid flat magenta (#FF00FF). No city hall, no palm trees, no text.
```

**Prefeitura → `4-meio.png`**

```text
Using the attached stage art, draw only the middle layer along the bottom part: the city hall (a two-story colonial building in cream with royal-blue trim, arched windows, a central door with steps and columns, a balcony with the Brazilian flag between two plain flags, a round clock without numbers on the pediment), with imperial palm trees and old street lamps on both sides, on a stone sidewalk that reaches the bottom of the image. Same colors and style. Everything above the building and the palms is solid flat magenta (#FF00FF). No main platform, no floating platforms, no text.
```

**Peças do palco → `5-pecas.png`**

```text
Using the attached stage art for style and colors, draw the stage pieces separately, with space between them, on a solid flat magenta (#FF00FF) background:
1. The main platform: the raised stone plaza as one block about 3 times wider than tall. Its top is a perfectly flat, straight edge with nothing on it, paved in a black-and-white wave mosaic. Plain stone walls on both sides; the bottom fades into shadow.
2. One thin stone ledge platform about 13 times wider than tall, flat top, with two small scroll brackets underneath.
3. Separate decorations: a green iron park bench, a bronze bust on a stone pedestal, an old street lamp, two pigeons.
No text.
```

**Confira:** três plataformas em triângulo, a do meio mais alta. Nenhum letreiro no prédio (o
gerador gosta de escrever "PREFEITURA"; se escrever, use a frase de tirar texto do `ARTE.md`). As
três plataformas usam a mesma peça.

## 5. Quadra de vôlei do Igão

Ginásio clássico: piso de madeira com as marcações, a rede e as arquibancadas, com o roxo e o
verde-limão do Igão. É o chão mais largo do jogo e não tem plataforma flutuando: a única é a
cadeira do juiz, pequena, do lado direito. A rede fica atrás, atravessando o fundo inteiro. Salve em
`art/cenario-quadra/`.

**Mapa → `1-mapa.png`** (referência: `art/cenario-laje/1-mapa.png`)

```text
Stage art for a 2D platform fighting game, side view. Copy only the drawing style of the attached image (thin outlines, flat shapes, soft colors), not its place, colors or platforms. No characters.
Inside a classic indoor volleyball gym. In the center, the main platform: the near half of the wooden court, a very wide block about 2.5 times wider than tall, with a flat top of light wood with white court lines and plain walls on both sides. On its right part stands a referee stand: a metal ladder chair, taller than a person, with a small flat platform on top. No floating platforms. Behind: the volleyball net stretched across the whole width between two posts, the far half of the court, and rows of bleachers with purple (#6A3FB8) seats; brick walls, high windows, steel roof trusses, hanging lamps and a blank scoreboard. Colors: warm light wood, white lines, purple, a few lime-green (#C4E53A) accents. No text.
```

**Parede do fundo → `2-fundo.png`** (referência nesta e nas próximas: o `1-mapa.png` da quadra)

```text
Using the attached stage art, draw only the back wall of the gym, filling the whole image, with the same colors and style: painted brick wall, high windows with daylight, steel roof trusses, hanging lamps and a blank scoreboard. Nothing in front of the wall: no bleachers, no net, no court. No text.
```

**Rede e arquibancadas → `3-longe.png`**

```text
Using the attached stage art, draw only the far layer along the bottom half: the volleyball net stretched across the whole width between two posts; behind it, the far half of the wooden court with white lines; behind that, rows of empty bleachers with purple seats, stairs and handrails. The court floor reaches the bottom of the image. Same colors and style. Everything above the bleachers is solid flat magenta (#FF00FF). No walls, no people, no main platform, no referee stand, no text.
```

**Bancos dos times → `4-meio.png`**

```text
Using the attached stage art, draw only the middle layer along the bottom part: on the left side and on the right side, a team bench with towels and water bottles and a scorer's table with a blank flip scoreboard, standing on a strip of wooden court floor that reaches the bottom of the image. The center of the image is empty. Same colors and style. Everything above them and in the center is solid flat magenta (#FF00FF). No net, no bleachers, no main platform, no text.
```

**Peças do palco → `5-pecas.png`**

```text
Using the attached stage art for style and colors, draw the stage pieces separately, with space between them, on a solid flat magenta (#FF00FF) background:
1. The main platform: the wooden court as one block about 3.5 times wider than tall. Its top is a perfectly flat, straight edge with nothing on it, light wood with a white court line. Plain walls on both sides; the bottom fades into shadow.
2. A volleyball referee stand, side view: a metal ladder chair about 1.3 times taller than wide, with a flat platform on top and nothing above it.
3. Separate decorations: a ball cart full of purple-and-lime volleyballs, a sports bag, a water jug with cups, a wide floor mop.
No text.
```

**Confira:** nenhuma plataforma flutuando; placar vazio, sem números; arquibancada vazia. A rede vai
na mesma camada das arquibancadas de propósito: sozinha, em fundo magenta, a malha fina sairia com
franja rosa no recorte. Nenhuma bola solta no chão: ela se confundiria com a bola do Saque do Igão.

## 6. Confeitaria do Darllan

Cozinha de confeitaria cheia de biscoitos, nas cores do Darllan (creme e marrom-chocolate) com os
tons pastel de glacê. O chão é a bancada comprida; encostado na ponta direita dela, o forno é um
degrau sólido, mais alto, onde também se luta. A plataforma é um biscoito gigante com glacê rosa, à
esquerda. Salve em `art/cenario-confeitaria/`.

**Mapa → `1-mapa.png`** (referência: `art/cenario-laje/1-mapa.png`)

```text
Stage art for a 2D platform fighting game, side view. Copy only the drawing style of the attached image (thin outlines, flat shapes, soft colors), not its place, colors or platforms. No characters.
Inside a pastry kitchen that bakes decorated biscuits. The main platform has two levels: a long baker's table with a flat marble top and a cream cabinet base and, touching its right end, a tall steel bakery oven with a flat top, higher than the table like one big step, with glass doors showing biscuits baking. Above the left half of the table, one thin floating platform: a giant flat butter biscuit with pink icing. No other platforms. Behind: rack trolleys full of biscuit trays, shelves with glass jars of biscuits, a decorating table with rows of iced biscuits, piping bags and bowls of icing; cream tiled walls. Colors: cream, chocolate brown (#6B4226) and pastel icing colors: pink (#E8789A), mint, baby blue, lilac. No text.
```

**Parede do fundo → `2-fundo.png`** (referência nesta e nas próximas: o `1-mapa.png` da confeitaria)

```text
Using the attached stage art, draw only the back wall of the pastry kitchen, filling the whole image, with the same colors and style: cream tiled wall, wooden shelves with glass jars of biscuits and pastel tins, hanging utensils and a window with warm light. Nothing in front of the wall: no tables, no ovens, no trolleys, no platforms. No text.
```

**Carrinhos de assadeiras → `3-longe.png`**

```text
Using the attached stage art, draw only the far layer along the bottom half: rack trolleys full of trays of biscuits, a second bakery oven and a tall steel fridge, standing on a checkered tile floor that reaches the bottom of the image, with the same colors and style. Everything above them is solid flat magenta (#FF00FF). No walls, no platforms, no text.
```

**Mesa de decoração → `4-meio.png`**

```text
Using the attached stage art, draw only the middle layer along the bottom part: a decorating table with rows of biscuits iced in pastel colors, piping bags and bowls of colored icing, a stand mixer, a cooling rack with biscuits and flour sacks, standing on a checkered tile floor that reaches the bottom of the image, with the same colors and style. Everything above them is solid flat magenta (#FF00FF). No main platform, no oven, no floating biscuit, no text.
```

**Peças do palco → `5-pecas.png`**

```text
Using the attached stage art for style and colors, draw the stage pieces separately, with space between them, on a solid flat magenta (#FF00FF) background:
1. The baker's table: one block about 3 times wider than tall, with a thick marble top that is a perfectly flat, straight edge with nothing on it, over a cream cabinet base. The bottom fades into shadow.
2. The bakery oven: a steel deck oven about twice as tall as wide, with a perfectly flat top with nothing on it and two glass doors showing trays of biscuits in warm light. The bottom fades into shadow.
3. One thin platform about 13 times wider than tall: a giant flat butter biscuit, golden brown, with pink icing dripping over its front edge.
4. Separate decorations: a mint-green stand mixer, a big glass jar full of biscuits, a three-tier stand with iced biscuits, a flour sack.
No text.
```

**Confira:** no `1-mapa.png`, o forno fica encostado na ponta direita da bancada e é mais alto que
ela; um biscoito flutuando só. No `5-pecas.png`, a bancada e o forno vêm separados, os dois com o
topo reto. Nenhum rolo de massa solto no cenário: ele é a arma do especial do Darllan.

## 7. Concerto do Tauba

Sala de concerto durante uma apresentação de orquestra, com os trompetes na frente. O palco de
madeira é o chão, mais estreito que o dos outros mapas, e as plataformas são dois camarotes, um de
cada lado, **fora** do palco e um pouco acima dele. Preto, branco e dourado do Tauba, com o vermelho
das cortinas. Salve em `art/cenario-teatro/`.

**Mapa → `1-mapa.png`** (referência: `art/cenario-laje/1-mapa.png`)

```text
Stage art for a 2D platform fighting game, side view. Copy only the drawing style of the attached image (thin outlines, flat shapes, soft colors), not its place, colors or platforms. No characters in the foreground.
Inside a classic concert hall during an orchestra concert. In the center, the main platform: the wooden stage, a block about 1.8 times wider than tall, with a flat top of polished planks, plain walls on both sides and a row of small footlights on its front wall. Outside the stage, one on each side and a little higher than its floor, two thin theater-box balcony platforms in cream and gold, with no railing. No other platforms. Behind: the orchestra seated on risers, small low-detail musicians in black, with golden trumpets and trombones, violins, cellos, a tuba, timpani and a harp; red velvet curtains with gold trim and tall organ pipes. Colors: dark wood, deep red, gold (#E0A93B), black, off-white. No text.
```

**Fundo do palco → `2-fundo.png`** (referência nesta e nas próximas: o `1-mapa.png` do concerto)

```text
Using the attached stage art, draw only the back of the stage, filling the whole image, with the same colors and style: tall organ pipes over a wood-paneled wall, framed by red velvet curtains with gold trim, in warm stage light. Nothing in front of it: no orchestra, no instruments, no platforms. No text.
```

**Fundo da orquestra → `3-longe.png`**

```text
Using the attached stage art, draw only the far layer along the bottom half: the back rows of the orchestra on wooden risers, with timpani, double basses, a tuba, trombones and french horns, played by small low-detail musicians in black. The risers reach the bottom of the image. Same colors and style. Everything above them is solid flat magenta (#FF00FF). No curtains, no platforms, no text.
```

**Frente da orquestra → `4-meio.png`**

```text
Using the attached stage art, draw only the middle layer along the bottom part: the front rows of the orchestra, with a row of golden trumpets, violins, cellos and a harp, and music stands, played by small low-detail musicians in black seated on a wooden floor that reaches the bottom of the image. Same colors and style. Everything above them is solid flat magenta (#FF00FF). No main platform, no balconies, no text.
```

**Peças do palco → `5-pecas.png`**

```text
Using the attached stage art for style and colors, draw the stage pieces separately, with space between them, on a solid flat magenta (#FF00FF) background:
1. The main platform: the wooden stage as one block about 3 times wider than tall. Its top is a perfectly flat, straight edge of polished planks with nothing on it; a row of small footlights on the front wall. Plain walls on both sides; the bottom fades into shadow.
2. One thin theater-box balcony platform about 12 times wider than tall, flat top, cream with gold ornaments and two gold brackets underneath, no railing.
3. Separate decorations: a golden trumpet resting on a trumpet stand, a music stand, a kettledrum, a harp.
No text.
```

**Confira:** os camarotes ficam fora do palco, um de cada lado, sem grade na frente (a grade
esconderia as pernas de quem luta em cima). Partitura sem notas legíveis. Se os músicos saírem
estranhos (rostos tortos, braços a mais), troque nos textos do `3-longe.png` e do `4-meio.png` o
trecho `played by small low-detail musicians in black` por
`resting on empty chairs, with no people`.

## Depois: trazer para o Claude

Quando as 5 imagens de um mapa estiverem na pasta, diga, por exemplo: _"as imagens da oficina estão
em `art/cenario-oficina/`, monta o mapa"_. O Claude amplia as imagens 2×, escreve o `recortes.json`,
cria o mapa no `sim` com as caixas da tabela lá de cima, encaixa a arte e põe o mapa na tela de
seleção (ver [Cenário](ARTE.md#4-cenário) no `ARTE.md`). As camadas do fundo saem na largura da regra de
"Peso das camadas" do `ARTE.md`, e o fundo ganha um `tone` quando disputa com os lutadores.

O jogo hoje só conhece o formato da laje (um prédio e tábuas iguais). O que cada mapa novo pede a
mais no código:

- **Todos:** escolher o mapa na tela de seleção (hoje só há a Laje) e uma arte por mapa.
- **Oficina e pilates:** corrente ou corda repetida da plataforma até o teto.
- **São Sebastião:** plataforma na altura do chão (o barco), a faixa de mar na frente e a camada do
  meio sem repetir espelhada.
- **Quadra:** a plataforma é o topo de uma peça que vai até o chão (a cadeira do juiz).
- **Confeitaria:** dois blocos sólidos encostados, com artes diferentes.
- **Concerto:** plataformas fora do chão principal.
