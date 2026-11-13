# Arte — passo a passo

Este arquivo diz exatamente o que fazer para gerar a arte do jogo: onde clicar, o que anexar, o que
colar, o que conferir e onde salvar cada imagem. Depois vem o que o Claude faz com as imagens, e no
fim o guia de estilo (o porquê de cada regra) e o modelo de ficha.

## Visão geral

| O quê                                           | O que sai                                                             | Imagens | Situação |
| ----------------------------------------------- | --------------------------------------------------------------------- | ------- | -------- |
| [Estilo do jogo](#parte-1--estilo-do-jogo-)     | `style.png` (boneco no estilo do jogo) e `shape.png` (molde do corpo) | 2       | ✅ feito |
| Schummaki e João Frango                         | Conceito, cabeças, peças do corpo, efeitos, figurinha                 | 5 cada  | ✅ feito |
| Dadazinho                                       | As 5 imagens, já pelo caminho "Personagem novo"                       | 5       | ✅ feito |
| Tauba                                           | As 5 imagens, pelo caminho "Personagem novo"                          | 5       | ✅ feito |
| Tchula                                          | As 5 imagens, pelo caminho "Personagem novo"                          | 5       | ✅ feito |
| Crocko                                          | As 5 imagens, pelo caminho "Personagem novo"                          | 5       | ✅ feito |
| [Cenário: a laje](#cenário-a-laje)              | Arte do mapa, 3 camadas de fundo, peças do palco                      | 5       | ✅ feito |
| **[Personagem novo](#personagem-novo-firefly)** | **As mesmas 5 imagens, uma de cada**                                  | 5       | a fazer  |

Para os próximos amigos, siga a seção **[Personagem novo](#personagem-novo-firefly)**. Ela já tem
tudo o que deu certo e errado com o Schummaki e o João. Depois das imagens, o Claude recorta, monta
e anima tudo no jogo: ver [Do PNG ao jogo](#do-png-ao-jogo-o-que-o-claude-faz).

Há dois caminhos para gerar as imagens. Os dois usam as mesmas referências e salvam com os mesmos
nomes:

- **[Firefly](#personagem-novo-firefly)**, com o modelo GPT Image 1.5. É o caminho principal: cada
  imagem é um pedido separado, você anexa as referências e cola um texto curto.
- **[ChatGPT](#caminho-b--chatgpt)**. Uma conversa por personagem. Serve quando houver cota de
  imagens no ChatGPT.

**Não misture os caminhos no mesmo personagem.** Comece e termine cada um no mesmo lugar, porque
cada ferramenta desenha um pouco diferente.

Os textos para colar estão em inglês porque o gerador segue melhor instruções técnicas assim.

## Parte 0 — Antes de começar

1. Peça o OK de cada amigo para usar a foto e a imagem dele (coluna "Autorizou" do `ELENCO.md`).
2. Separe 2 ou 3 fotos de cada amigo: rosto de frente bem iluminado, rosto de perfil e corpo
   inteiro. Sem óculos escuros e sem filtro.
3. Guarde as fotos **fora** da pasta do projeto. O repositório é público.
4. As imagens geradas vão para a pasta `art/<pasta do personagem>/` na raiz do projeto, sempre em
   PNG e no tamanho original. O nome da pasta é o apelido em minúsculas, com hífen no lugar do
   espaço e sem acento (ex.: `joao-frango`).

## Parte 1 — Estilo do jogo ✅

Feita no ChatGPT. As duas imagens servem de referência e **não devem ser refeitas**: trocar o estilo
no meio deixa os personagens com cara de jogos diferentes.

- **`art/style/style.png`:** um boneco genérico desenhado no estilo do jogo. Não é nenhum amigo,
  para que o estilo passe para os outros personagens sem levar junto o rosto dele.
- **`art/style/shape.png`:** um manequim cinza separado em peças. Definiu a lista de peças do
  esqueleto. Hoje o texto da folha de peças já lista cada peça, então ele não é mais anexado.

Os textos usados na parte 1 estão no [Caminho B](#caminho-b--chatgpt), caso um dia precise refazer.

## Personagem novo (Firefly)

Cada personagem tem **exatamente 5 imagens**, todas em `art/<pasta>/`. Não crie outras (folha só de
tronco, só de mãos etc.): se uma imagem saiu com defeito, corrija ela mesma e salve por cima, com o
mesmo nome (veja [Se der errado](#se-der-errado-no-firefly)).

| Passo                                  | Arquivo           | Formato      | Referências                              |
| -------------------------------------- | ----------------- | ------------ | ---------------------------------------- |
| [1. Conceito](#1-conceito)             | `1-conceito.png`  | Wide (4:3)   | `art/schummaki/1-conceito.png` + fotos   |
| [2. Cabeças](#2-cabeças)               | `2-cabecas.png`   | Square (1:1) | `1-conceito.png` + 1 ou 2 fotos do rosto |
| [3. Peças do corpo](#3-peças-do-corpo) | `3-pecas.png`     | Wide (4:3)   | `1-conceito.png`                         |
| [4. Efeitos](#4-efeitos-do-especial)   | `4-efeitos.png`   | Square (1:1) | `1-conceito.png`                         |
| [5. Figurinha](#5-figurinha)           | `5-figurinha.png` | Square (1:1) | `1-conceito.png` + 1 foto do rosto       |

Antes de começar, preencha a [ficha](#ficha-para-um-personagem-novo) do amigo: dela saem a roupa
(passo 1), as mãos especiais (passo 3) e os efeitos (passo 4).

### Como gerar uma imagem no Firefly

Os nomes dos botões estão como na ajuda da Adobe; no Firefly em português podem aparecer traduzidos.

1. Abra o Firefly (firefly.adobe.com), clique em **Generate** no painel da esquerda e depois em
   **Generate image**.
2. Em **Model**, na parte _Partner models_, escolha **GPT Image 1.5**. É ele que aceita **Reference
   images** (até 6). Use esse mesmo modelo no jogo inteiro.
3. Em **Aspect ratio**, escolha o formato do passo.
4. Em **Reference images**, envie as imagens do passo.
5. Cole o texto do passo no campo **Prompt**, troque os trechos entre `<...>` e clique em
   **Generate**.
6. Escolha o melhor resultado, baixe em PNG e salve **direto na pasta do personagem**, com o nome do
   passo. O Firefly baixa com um nome comprido; renomeie.

O que saber do Firefly:

- **Não existe conversa.** Ele não lembra da imagem anterior, por isso cada passo manda anexar as
  referências de novo.
- **O campo de texto aceita uns 1.000 caracteres** e corta o resto sem avisar. Os textos abaixo
  cabem com folga se os trechos `<...>` forem curtos (o limite de cada um está indicado).
- **Não há fundo transparente.** Os textos pedem fundo magenta liso (#FF00FF), que o Claude remove.
- **Cada geração gasta créditos.** Se a imagem saiu quase certa, corrija em vez de gerar de novo.

### 1. Conceito

Define o personagem: as outras 4 imagens copiam dele. O conceito do Schummaki entra como referência
de layout e traço (o do João não, porque tem texto no avental); o texto manda copiar só o estilo e a
disposição.

**Formato:** Wide (4:3). **Referências:** `art/schummaki/1-conceito.png` + 2 ou 3 fotos do amigo.

```text
Character concept sheet of my friend from the attached photos. Copy only the drawing style and the exact layout of the attached cartoon sheet, not its face, hair or outfit: front view standing, 3/4 view in a fighting stance facing right, and 3 heads on the right (smiling, winking, <EXPRESSION>). Keep his real face shape, hair, nose, eyebrows and facial hair; exaggerate his most distinctive features by about 30%.
Character: <CHARACTER>
No text or logos on the clothes. Big head, bold dark outline, flat 2-tone cel shading, light from above. Plain light-gray background. No text, logos or numbers.
```

- `<EXPRESSION>`: a terceira cabeça, a cara típica dele (ex.: `sleepy yawn`).
- `<CHARACTER>`: até uns 350 caracteres. Apelido, quem é, físico, expressão e a roupa peça por
  peça com as cores em hex. Exemplo (João):
  `João Frango, sleepy restaurant owner from Rio, slim build, half-closed sleepy eyes, easygoing smile. Off-white chef apron over an orange (#F28C28) t-shirt; corn-yellow (#F6C945) cap with a red-orange chicken comb on top; casual shorts; flip-flops.`
- Se for uma amiga, troque `his` por `her`.

**Roupa boa para recorte.** O jogo anima o personagem em peças que giram nas juntas, então escolha
a roupa pensando nisso (as regras completas estão no [estilo](#regras)):

- Nada que atravesse uma junta e precise acompanhar dois pedaços: casaco ou saia abaixo do quadril,
  capa, cachecol solto, cabelo abaixo do ombro, alça comprida. Fica preso a uma peça só e não se
  mexe com a outra. Avental e jaqueta até o quadril funcionam (o do João cobre o short e anda com o
  tronco).
- Manga curta ou arregaçada até o cotovelo é o mais fácil. Manga comprida até o punho também dá,
  mas a manga vira parte do antebraço.
- Nenhum texto, número ou logo: o jogo espelha o personagem e a escrita sairia ao contrário.

**Confira:** dá para reconhecer o amigo? A vista em 3/4 está virada para a direita? Não veio nada do
Schummaki (rosto, topete, jaqueta vermelha, luvas)? Se uma geração acertar o rosto e outra a roupa,
junte as duas com o truque "rosto de uma, roupa de outra" da
[tabela de correções](#se-der-errado-no-firefly).

**Salve como:** `art/<pasta>/1-conceito.png`. **Mande para o amigo aprovar antes de seguir.**

### 2. Cabeças

O jogo troca a cabeça inteira conforme o estado: normal, golpe levado, provocação e KO.

**Formato:** Square (1:1). **Referências:** `1-conceito.png` + 1 ou 2 fotos do rosto.

```text
Head expression sheet of the character in the attached concept sheet: same design, same style. Use the attached photos only for facial likeness.
4 heads only, cut at the neck, all in 3/4 view facing right, same size, in a 2x2 grid with space between them:
1. Fight-ready: confident smirk.
2. Hurt: eyes squeezed shut, teeth clenched.
3. Taunt: mouth wide open shouting, eyebrows raised.
4. KO: dizzy spiral eyes, tongue slightly out.
Bold dark plum-brown outline, flat 2-tone cel shading, light from above. Solid flat magenta (#FF00FF) background. No text.
```

- **Óculos:** acrescente `Glasses with opaque light gray-blue lenses.` antes de `Bold`. Sem isso o
  vidro sai transparente, com o magenta do fundo aparecendo (aconteceu no Dadazinho; o Claude
  preenche com `fill`, mas o brilho da lente se perde).

**Confira:** 4 cabeças iguais ao conceito, do mesmo tamanho, todas viradas para a direita, cada uma
com um pedaço de pescoço. Nas lentes dos óculos, nada de rosa.

**Salve como:** `art/<pasta>/2-cabecas.png`

### 3. Peças do corpo

É a imagem mais importante para a animação. **Uma folha só, com todas as peças e nada a mais.**

**Formato:** Wide (4:3). **Referências:** só o `1-conceito.png`.

```text
Cut-out animation parts of the character in the attached concept sheet: same outfit, colors, proportions and style.
Draw each part once, separate, with space around it, all facing right: torso without sleeves or sleeve caps, shoulders closed and rounded; <HIPS>; upper arm with sleeve; forearm without hand; fist from the back of the hand; the same fist from the palm, fingers curled toward the viewer; open hand from the back; the same open hand from the palm; <LEGS>; <SHOE> with the toes to the right. Extra: <EXTRA>, cut at the wrist.
No head. Straight limbs, not posed. <PANTS>Other ends rounded, no pegs or rings.
No text or logos. Bold dark plum-brown outline, flat 2-tone cel shading, light from above. Solid flat magenta (#FF00FF) background, no glow or shadow.
```

Os trechos `<HIPS>`, `<LEGS>` e `<PANTS>` mudam conforme o que ele usa na perna:

| Trecho    | Calça comprida (social, jeans, cargo...)                                                           | Short ou bermuda (perna à mostra)                     |
| --------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `<HIPS>`  | `hips: belt and <dress pants> only down to just below the crotch`                                  | `hips (<cargo shorts> only), separate from the torso` |
| `<LEGS>`  | `thigh; shin slightly narrower than the thigh`                                                     | `thigh with the knee to the right; shin`              |
| `<PANTS>` | `Pant pieces: straight tubes, flat cut ends with no outline, hem or folds. ` (com o espaço no fim) | apague `<PANTS>`                                      |

- `<SHOE>`: o calçado (`chunky sneaker`, `dress shoe`, `foot with flip-flop`...).
- `<EXTRA>`: as mãos especiais da provocação ou do especial (ex.:
  `two hands gripping an invisible steering wheel`, `two hands holding a trumpet, one gripping it, one pressing the valves`).
  Se as mãos seguram um objeto, ele pode vir junto: o Claude usa a mão com o objeto como mão da
  frente. Sem mãos especiais, apague `Extra: <EXTRA>, cut at the wrist.`
- Se a manga é comprida até o punho, troque `forearm without hand` por
  `forearm with sleeve, without hand`.
- **Limite de ~1.000 caracteres:** com calça comprida, o `<EXTRA>` cabe com até uns 75
  caracteres. Se passar, corte as palavras do `<EXTRA>`, nunca as regras.

Por que o texto é assim (problemas que já aconteceram):

- **Quadril de calça comprida só até a virilha.** Pedido como "calça", o gerador desenha um short
  com barra e contorno embaixo, e a barra vira uma linha atravessada no quadril (Dadazinho e Tauba).
- **Pontas da calça cortadas, sem contorno, e canela só um pouco mais fina que a coxa.** Tubos
  fechados deixam uma linha em cada joelho, e canela muito mais fina faz um degrau. A calça tem que
  parecer um pano só, mas pode afinar um pouco para baixo, como calça de verdade.
- **Tronco sem a "tampa" da manga.** O gerador costuma desenhar a bola da manga no ombro da
  frente; ela fica parada no tronco quando o braço gira.
- **Mãos especiais cortadas no pulso.** Sem isso, vêm com antebraço e manga grudados.

Mesmo seguindo o texto, alguns desses defeitos voltam (barra no short, contorno nas pontas da
calça, tampa da manga, punho da camisa nas mãos especiais). **Não precisa gerar de novo por
causa deles:** o Claude corrige no recorte. Gere de novo só se faltar peça, vier peça grudada em
outra ou em pose.

**Confira** antes de salvar. Cada item tem um motivo; se faltar um, corrija pela
[tabela](#se-der-errado-no-firefly):

| Tem que ter                                                                | Por quê                                                                                                               |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Tronco **sem manga**, ombros fechados e arredondados                       | A manga vai no braço. Grudada no tronco, ela não acompanha o braço; cava aberta mostra um buraco quando o braço sobe. |
| Short (ou calça) **separado** do tronco                                    | O tronco inclina nos golpes. Grudados, abre um buraco na cintura.                                                     |
| Calça comprida: coxa e canela **retas**, canela só um pouco mais fina      | Sem degrau grande no joelho. Diferença pequena o Claude acerta no recorte.                                            |
| Braço, antebraço e mão **separados**                                       | O cotovelo e o punho dobram, e a mão troca (punho, aberta, especial).                                                 |
| **4 mãos:** punho e mão aberta, cada um pelas costas e pela palma          | A mão de trás usa a versão da palma. Sem ela, a mão de trás aparece de costas e parece virada ao contrário.           |
| **Uma** peça de cada (fora as 4 mãos), joelho e ponta do pé para a direita | O braço e a perna de trás usam a mesma peça da frente. Pares espelhados (vistos de frente) não servem.                |
| Membros **retos**, sem pose                                                | O esqueleto dobra cada junta. Braço já dobrado ou perna presa no short só servem para uma pose.                       |
| Pontas **lisas**, sem pino, anel ou marca                                  | O pino aparece no jogo (aconteceu no ombro do Schummaki). As juntas são marcadas depois, no `recortes.json`.          |
| **Sem cabeça**                                                             | As cabeças vêm do `2-cabecas.png`; sem ela sobra espaço e as peças saem maiores.                                      |
| **Sem texto** na roupa                                                     | O jogo espelha o personagem.                                                                                          |
| Fundo **magenta liso**, sem brilho nem sombra em volta das peças           | O recorte tira só o magenta. Fundo escuro se confunde com o contorno, e brilho deixa franja colorida.                 |
| Nada encostando, nada cortado na borda                                     | Cada peça é recortada sozinha.                                                                                        |

Não precisa acertar o tamanho de cada peça: o gerador costuma desenhar braços compridos e mãos
grandes, e o Claude acerta a proporção no recorte.

**Salve como:** `art/<pasta>/3-pecas.png`

### 4. Efeitos do especial

**Formato:** Square (1:1). **Referências:** `1-conceito.png`.

```text
Effects sheet for the special move of the character in the attached concept sheet, same outline and colors: <ITEMS>. Each item separate, with space between them.
Bold dark plum-brown outline, flat 2-tone cel shading. Solid flat magenta (#FF00FF) background, no glow or shadow. No text.
```

`<ITEMS>`: os itens da linha "Props and effects" da ficha, cada um com quantidade e vista. O que
voa ou anda vai **virado para a direita, de lado**. Exemplos:

- Schummaki: `4 tire-smoke puffs in different sizes (light gray); 2 horizontal speed-streak shapes; 1 burnt-rubber skid mark seen from the side`
- João: `a whole golden roast chicken flying to the right, side view, in 3 slightly different rotation frames; 3 small steam puffs; 1 short motion-trail shape`

**Salve como:** `art/<pasta>/4-efeitos.png`

### 5. Figurinha

O retrato da tela de seleção e do placar. Pode ficar para depois, se os créditos apertarem.

**Formato:** Square (1:1). **Referências:** `1-conceito.png` + 1 foto do rosto.

```text
Portrait sticker of the character in the attached concept sheet, same design and style; use the attached photo only for facial likeness. Bust (head and shoulders), 3/4 view facing right, confident expression, inside a die-cut sticker: thick off-white border following the silhouette, over a round badge in the main color of his outfit.
Bold dark plum-brown outline, flat 2-tone cel shading. Solid flat magenta (#FF00FF) background outside the sticker. No text.
```

**Salve como:** `art/<pasta>/5-figurinha.png`

### Se der errado no Firefly

Primeiro, tente gerar de novo com o mesmo texto: cada geração sai um pouco diferente. Se a imagem
saiu quase certa, corrija só o defeito: anexe **a imagem com defeito** em _Reference images_ (mais
as fotos, quando o problema é o rosto), mande a frase da tabela e **salve o resultado por cima, com
o mesmo nome**. Troque os trechos entre `<...>`.

| Problema                                                             | Anexe                                               | Mande                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Não parece o amigo                                                   | A imagem + 2 fotos do rosto                         | `Edit the attached cartoon: redo only the face so it clearly looks like the man in the attached photos (nose, eyebrows, jaw, hairline). Keep everything else the same.`                                                                                                                                                                                                               |
| Ficou genérico, parecendo outro jogo                                 | A imagem                                            | `Edit the attached cartoon: bigger head (1/3 of the height), stronger caricature of his most distinctive features, flat 2-tone shading. Keep everything else the same.`                                                                                                                                                                                                               |
| Rosto bom numa imagem, roupa boa noutra                              | A imagem com o rosto certo + recorte da roupa certa | `Edit the attached character sheet. Keep exactly the same: face, hair, expressions, poses, proportions, layout and drawing style. Change only the outfit: it should be exactly like the attached outfit.` Para trocar só as cores, acrescente as cores de cada peça, ex.: `jacket: open red (#D62839) with white and graphite (#2E3138)`. O recorte da roupa pode ser feito no Paint. |
| Fundo xadrez, escuro, com brilho ou sombra                           | A imagem                                            | `Edit the attached image: replace the whole background with solid flat magenta (#FF00FF), with no glow, light or shadow around the parts. Keep every part exactly the same.`                                                                                                                                                                                                          |
| Peças grudadas (tronco com short, manga no tronco, mão no antebraço) | A folha de peças                                    | `Edit the attached parts sheet: draw <the torso and the shorts> as two separate parts, with empty space between them. Keep every other part exactly the same.`                                                                                                                                                                                                                        |
| Faltou uma peça (ex.: a mão pela palma)                              | A folha de peças                                    | `Edit the attached parts sheet: add <the same fist seen from the palm side, fingers curled toward the viewer>, in an empty area, same style and size as the other parts. Keep every other part exactly the same.`                                                                                                                                                                     |
| Pinos, anéis ou bolinhas nas pontas das peças                        | A folha de peças                                    | `Edit the attached parts sheet: remove the pegs and rings at the joint ends. Each end plain and rounded, the same color as the part. Keep everything else the same.`                                                                                                                                                                                                                  |
| Barra no quadril, contorno nas pontas da calça, tampa da manga       | —                                                   | Não precisa corrigir: o Claude corta no recorte. Siga para a próxima imagem.                                                                                                                                                                                                                                                                                                          |
| Peças em pose (braço dobrado, perna presa no short) ou em pares      | —                                                   | Gere de novo com o texto do passo 3. Esse defeito não costuma sair com correção.                                                                                                                                                                                                                                                                                                      |
| Peças encostando ou cortadas                                         | A folha de peças                                    | `Redo the attached parts sheet with more empty space between all parts, every part complete. Same character, same style.`                                                                                                                                                                                                                                                             |
| Apareceu texto ou logo                                               | A imagem                                            | `Edit the attached image: remove all text, letters, numbers and logos. Keep everything else the same.`                                                                                                                                                                                                                                                                                |
| Virado para o lado errado                                            | A imagem                                            | `Edit the attached image: turn it to a 3/4 view facing right. Keep everything else the same.`                                                                                                                                                                                                                                                                                         |
| Luz vindo de um lado                                                 | A imagem                                            | `Edit the attached image: light from straight above, shadows only under the chin, arms and lower parts. Keep everything else the same.`                                                                                                                                                                                                                                               |

Uma correção às vezes muda outras peças. Confira a folha inteira de novo antes de salvar.

Para defeitos pequenos (um logo, um dedo a mais, uma peça cortada), o **Photoshop** costuma ser mais
barato: selecione a área com o laço, use o _Preenchimento generativo_ e descreva o que deve ficar
ali. Para tirar o fundo, use _Remover plano de fundo_ e salve em PNG com transparência (o Claude
aceita folha sem magenta).

### Schummaki e João Frango (já feitos)

Foram os dois primeiros, feitos com textos mais antigos. Os problemas que apareceram neles viraram
as regras do passo 3. Por isso as pastas deles têm folhas a mais, que **não** devem ser repetidas:

- `schummaki/3-pecas-bracos.png`: tronco, braços e mãos refeitos, porque o `3-pecas.png` veio com
  pinos nas juntas, manga grudada no tronco e mão grudada no antebraço. Quadril, pernas e tênis
  ainda saem do `3-pecas.png`.
- `joao-frango/3-pecas-tronco.png`: tronco e short, que vieram numa peça só.
- `joao-frango/3-pecas-maos.png`: as mãos pela palma, que faltaram na folha.

## Cenário: a laje

O primeiro mapa é a laje de um prédio no litoral, no fim da tarde, com vista para os morros e o mar.
O topo do prédio é a plataforma principal da luta (as paredes dos lados servem para o wall jump), e
as 2 plataformas finas flutuam acima dela, como no mapa de teste. Salve tudo em
`art/cenario-laje/`. Para outro mapa, troque só a descrição do lugar.

O Firefly vai no máximo até o formato 4:3, e as camadas do fundo precisam ser bem mais largas que a
tela. Isso se resolve depois: o Claude repete e emenda as camadas, ou o Photoshop alarga com
_Expansão generativa_.

### Arte do mapa → `1-mapa.png`

**Formato:** Wide (4:3). **Referências:** `style.png`.

```text
Stage art for a 2D platform fighting game, side view, in the style of the attached cartoon reference but softer: lighter, less saturated, thin outlines, flat shapes, gradient only in the sky. No characters.
A rooftop ("laje") of a simple concrete building in a Brazilian coastal town at golden hour. In the center, the main platform: the flat rooftop of the building, a block about twice as wide as tall, with plain walls on both sides. Above it, two thin floating wooden plank platforms, one on the left and one on the right. Behind: neighboring rooftops with blue water tanks, TV antennas and a clothesline; further back, green hills and the sea; warm orange-pink sky. No text.
```

**Confira:** é o mapa inteiro, montado. Ele serve de referência para as próximas 4 imagens.

### Camadas do fundo

O fundo do jogo é feito de 3 camadas que se movem em velocidades diferentes (o efeito de
profundidade, chamado parallax). Uma geração por camada.

**Formato:** Wide (4:3). **Referências:** `1-mapa.png`.

**Céu → `2-ceu.png`**

```text
Using the attached stage art, draw only the sky and the sun, filling the whole image, with the same colors and style. Nothing else: no buildings, no hills, no sea. No text.
```

**Morros e mar → `3-longe.png`**

```text
Using the attached stage art, draw only the far layer: the green hills and the sea along the bottom half, with the same colors and style. Everything above the hills is solid flat magenta (#FF00FF). No buildings, no text.
```

**Lajes vizinhas → `4-meio.png`**

```text
Using the attached stage art, draw only the middle layer: the neighboring rooftops, blue water tanks, TV antennas and clothesline along the bottom part, with the same colors and style. Everything above them is solid flat magenta (#FF00FF). No main building, no floating platforms, no text.
```

### Peças do palco → `5-pecas.png`

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

## Caminho B — ChatGPT

No ChatGPT cada personagem tem uma conversa própria. A primeira mensagem passa as regras e não gera
imagem; cada mensagem seguinte gera 1 imagem. Se acabar o limite de imagens do dia, continue no dia
seguinte na mesma conversa. As 5 imagens, os nomes e o que conferir são os mesmos do
[Firefly](#personagem-novo-firefly).

O ChatGPT às vezes "desenha" a transparência como um xadrez cinza. Por isso todos os textos pedem
fundo magenta liso.

### Primeira mensagem (não gera imagem)

Abra uma **conversa nova**, anexe `style.png` e as 2–3 fotos do amigo e cole a mensagem abaixo, com
a [ficha](#ficha-para-um-personagem-novo) dele no lugar indicado:

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
- Clothing: everyday Brazilian clothes (t-shirts, zip jackets, caps, shorts, aprons, flip-flops, sneakers). No armor, no fantasy gear. Nothing that hangs across a joint (long coats, capes, loose scarves, hair below the shoulders).
- Readability: a strong silhouette that still reads at 100 pixels tall. No thin straps, tiny patterns or small details.
- Never draw: text, letters, numbers, logos, brand names, watermarks, signatures, real sports team liveries.
- Background: unless a message says otherwise, solid flat magenta (#FF00FF), no glow or shadow, never a drawn checkerboard.

[FICHA DO PERSONAGEM]
<cole aqui a ficha do amigo>

[INSTRUÇÕES]
Attached: (1) the style anchor, for style only — do not copy its face; (2) photos of my friend, for likeness.
Do not generate any image yet. Reply only "OK" and list the 3 most distinctive facial features you see in the photos, which you will exaggerate.
```

**Confira:** ele responde "OK" e lista 3 traços do rosto do amigo. Se faltou o traço que todo mundo
reconhece (a sobrancelha, o queixo, o cabelo), responda corrigindo, por exemplo: _"O mais marcante é
o queixo comprido, exagere isso."_

### As 5 imagens

Mande uma mensagem por imagem, na ordem. **Anexe o `1-conceito.png` aprovado** em todas depois da
primeira: o ChatGPT vai perdendo a fidelidade depois de vários pedidos, e o anexo segura o desenho.

**1. Conceito → `1-conceito.png`**

```text
Create the CHARACTER CONCEPT SHEET, wide landscape image: front view standing; 3/4 view in a fighting stance facing right; and 3 heads on the right (smiling, winking, and his most typical expression). Same scale, feet on the same baseline. Same proportions as the style anchor (3 heads tall). The face must clearly look like my friend in the photos. Plain flat light-gray background (#E6E6E6). No text.
```

**2. Cabeças → `2-cabecas.png`**

```text
Use the attached concept sheet as the definitive design of this character. Create the HEAD EXPRESSION SHEET.
4 heads only, cut at the neck, no body. All in 3/4 view facing right, same size, same angle, same hair/cap, in a 2x2 grid with generous space between them:
1. Fight-ready: confident, slight smirk.
2. Hurt: eyes squeezed shut, teeth clenched, recoiling from a hit.
3. Taunt: mouth wide open shouting the catchphrase, eyebrows raised.
4. KO: dizzy spiral eyes, mouth hanging open, tongue slightly out.
If he wears glasses, the lenses are opaque light gray-blue, never see-through.
Solid flat magenta (#FF00FF) background. No text.
```

**3. Peças do corpo → `3-pecas.png`**

```text
Use the attached concept sheet as the definitive design. Create the CUT-OUT ANIMATION PARTS for this character in one wide image, same outfit, colors, proportions and style, as seen in the 3/4 view.
Draw each part once, separate, with generous empty space around it, all facing right:
- torso without sleeves and without sleeve caps on the shoulders, shoulders closed and rounded;
- hips, separate from the torso: shorts as they are; long pants only from the belt down to just below the crotch, with no hem;
- upper arm with sleeve; forearm without hand (with the sleeve, if the sleeves are long);
- fist seen from the back of the hand; the same fist seen from the palm, fingers curled toward the viewer;
- open hand seen from the back; the same open hand seen from the palm;
- thigh with the knee to the right; shin; shoe with the toes to the right;
- the extra hands listed in the character sheet, if any, cut at the wrist (an object they hold may come with them).
No head. Straight limbs, not posed, not in mirrored pairs. Long pants: thigh and shin are plain straight tubes, the shin only slightly narrower than the thigh, with flat cut ends that have no outline, hem or folds, so the pants look like one continuous piece. Other joint ends plain and rounded, slightly extended so the parts overlap when rotated: no pegs, pins, rings or marks on them.
No text or logos. Solid flat magenta (#FF00FF) background, no glow or shadow. No labels.
```

**4. Efeitos → `4-efeitos.png`**

```text
Use the attached concept sheet as the reference for line and colors. Create the PROPS AND EFFECTS SHEET for this character's special move and taunt, as listed in the character sheet. Anything that flies or moves faces right, side view.
Same ink outline and flat cel shading as the character. Each item separate, generous space between them, nothing touching.
Solid flat magenta (#FF00FF) background. No text.
```

**5. Figurinha → `5-figurinha.png`**

```text
Use the attached concept sheet as the definitive design. Create the PORTRAIT STICKER for the character select screen.
Bust (head and shoulders) in 3/4 view facing right, fight-ready expression, inside a die-cut sticker: thick off-white sticker border following the outer silhouette, over a round badge in the character's primary color.
Square image, solid flat magenta (#FF00FF) background outside the sticker. No text.
```

**Se o personagem começar a mudar de cara** no meio da conversa, não insista nela: abra uma conversa
nova, anexe `style.png`, `1-conceito.png` e as fotos, cole a mesma primeira mensagem e continue do
passo em que parou.

### Se der errado no ChatGPT

Mande só a frase da tabela, na mesma conversa. O ChatGPT ajusta a última imagem. Para defeitos da
folha de peças, use também as frases da [tabela do Firefly](#se-der-errado-no-firefly), trocando
`the attached parts sheet` por `the last parts sheet`.

| Problema                                           | Mande                                                                                                                                                                      |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Não parece o amigo                                 | `The face doesn't look enough like my friend in the photos. Keep everything else identical and redo only the face: match his <nose / eyebrows / jaw / hairline>.`          |
| Ficou genérico, parecendo outro jogo               | `Push the caricature: head exactly 1/3 of the height, exaggerate his <traço> more, warmer plum-brown outline, flat 2-tone shading with no gradients.`                      |
| Fundo xadrez cinza desenhado (transparência falsa) | `The background is a drawn checkerboard, not real transparency. Redo the same image on a solid flat magenta (#FF00FF) background, no shadows on it, nothing else changed.` |
| Peças encostando ou cortadas                       | `Some parts touch each other or are cut off. Redo with more empty space between all parts, every part complete.`                                                           |
| Apareceu texto ou logo                             | `Remove all text, letters, numbers and logos. Change nothing else.`                                                                                                        |
| Proporção mudou                                    | `Match the concept sheet exactly: same head size, same limb lengths, 3 heads tall.`                                                                                        |
| Virado para o lado errado                          | `Redo in 3/4 view facing right. Change nothing else.`                                                                                                                      |
| Luz vindo de um lado                               | `Light must come from straight above, not from the side, so the art can be mirrored. Redo the shading only.`                                                               |
| Estilo mudando depois de muitas mensagens          | Copie de novo o trecho `[BLOCO DE ESTILO]` da primeira mensagem e cole sozinho.                                                                                            |

### Parte 1 no ChatGPT (já feita)

Os textos que criaram o `style.png` e o `shape.png`. Só use se precisar refazer o estilo.

Abra uma **conversa nova**, sem anexos, e cole o `[BLOCO DE ESTILO]` da
[primeira mensagem](#primeira-mensagem-não-gera-imagem) seguido de:

```text
[INSTRUÇÕES]
I'm making a 2D platform fighting game where my 16 friends are the characters. In this conversation we will create 2 reference images that will define the style for all of them. Do not generate any image yet. Reply only "OK" and summarize the style rules in 3 short lines.
```

Depois, uma mensagem por imagem:

```text
Create the STYLE ANCHOR image following the locked style rules.
One original generic character, not based on any real person: an average Brazilian guy in his late 20s, short dark hair, plain t-shirt, shorts and chunky sneakers.
Show him twice, side by side, same scale, feet on the same baseline: (1) front view, neutral standing pose; (2) 3/4 view facing right, relaxed fighting stance with fists up and knees slightly bent.
Plain flat light-gray background (#E6E6E6). Wide landscape image. No text.
```

```text
Now create the BODY TEMPLATE for a 2D cut-out (skeletal) animation rig, using the style anchor above for line, shading and exact proportions.
A neutral faceless mannequin with the exact same proportions as the anchor character: smooth medium-gray body (#9AA0A6), same outline, no clothes, no hair, no face details.
Left third of the image: the whole mannequin assembled, 3/4 view facing right, neutral standing pose, arms hanging slightly away from the body.
Right two thirds: the same mannequin split into separate parts, laid out in a tidy grid with generous empty space between them, no part touching or overlapping another:
head; torso (neck to waist); hips (waist to crotch); upper arm; forearm; hand closed in a fist; open hand; thigh; shin; shoe.
Every limb part has plain rounded, slightly extended ends at the joints so the parts overlap when rotated. Draw limb parts straight and vertical, each one complete, nothing cut off by the image border.
Solid flat magenta (#FF00FF) background. No text, no numbers, no labels.
```

Salve como `art/style/style.png` e `art/style/shape.png`.

## Depois: trazer para o Claude

No fim, a pasta `art/` fica assim (só as versões aprovadas):

```text
art/
  style/           style.png, shape.png
  <pasta>/         1-conceito.png, 2-cabecas.png, 3-pecas.png, 4-efeitos.png, 5-figurinha.png
  schummaki/       os 5 + 3-pecas-bracos.png (exceção, ver "já feitos")
  joao-frango/     os 5 + 3-pecas-tronco.png e 3-pecas-maos.png (exceção, ver "já feitos")
  tchula/          os 5 + 1-conceito-face-correta.png (o rosto corrigido, só referência)
  cenario-laje/    1-mapa.png, 2-ceu.png, 3-longe.png, 4-meio.png, 5-pecas.png
```

Não precisa esperar terminar tudo. Assim que tiver um personagem, diga aqui no Claude, por exemplo:
_"as imagens do Fulano estão em `art/fulano/`, segue a Etapa 10"_. O Claude faz o resto (abaixo).

## Do PNG ao jogo (o que o Claude faz)

### 1. Recorte: `art/<pasta>/recortes.json` e `pnpm art`

Cada pasta de `art/` tem um `recortes.json` que diz onde está cada peça na folha e onde ficam as
juntas. O comando `pnpm art` (ou `pnpm art fulano`, só uma pasta) lê os PNGs, tira o fundo magenta
(a borda vira transparência, sem franja rosa), recorta, apaga sujeira solta, reduz para o tamanho
do jogo e grava um atlas em `packages/game/public/assets/`. As imagens de `art/` nunca entram no
jogo direto. `pnpm art fulano --debug <pasta>` grava também o atlas com as juntas marcadas.

Cada folha (`sheets`) tem uma escala própria: a folha de peças, a de cabeças e a de efeitos podem
vir desenhadas em tamanhos diferentes. A mesma imagem pode entrar em duas folhas com escalas
diferentes (no Dadazinho, a arma sai do `4-efeitos.png` menor que o clarão e o chumbo). Folha que
já veio sem fundo (tirado no Photoshop) leva `"key": false`. Campos de cada peça:

| Campo     | O que é                                                                                         |
| --------- | ----------------------------------------------------------------------------------------------- |
| `rect`    | Retângulo da peça na folha (x, y, largura, altura), em px da imagem original.                   |
| `pivot`   | Junta com o pai: onde a peça gira (ombro no braço, joelho na canela).                           |
| `tip`     | Junta com o filho (cotovelo no braço). Define o comprimento e a direção do osso.                |
| `sockets` | Outros encaixes: `neck`, `shoulderNear`, `shoulderFar` no tronco; `legNear`, `legFar` no short. |
| `erase`   | Polígonos apagados: toco de junta, cava do ombro, a boca aberta do punho da luva.               |
| `keep`    | Só o que está dentro fica: separa peças que vieram encostadas (as duas mãos em concha).         |
| `outline` | Linha de contorno desenhada num corte de roupa (manga, punho da luva), para não ficar "aberta". |
| `paint`   | Pinta um polígono de uma cor (`auto` = a cor em volta). Esconde o anel do toco ou um texto.     |
| `stretch` | Estica ou encolhe a peça (`[largura, altura]`), para acertar a proporção com o conceito.        |
| `fill`    | Põe uma cor por trás do desenho: vidro dos óculos que veio rosa (misturado com o magenta).      |
| `fade`    | Some aos poucos de `from` até `to`: a ponta da coxa de pele por cima da canela, sem linha.      |
| `flip`    | `true` espelha a peça na horizontal (a mão que veio virada); os pontos ficam os da folha.       |

Nomes das peças: `torso`, `hips`, `upperArm`, `forearm`, `thigh`, `shin`, `foot`, `hand_fist`,
`hand_open`, `hand_taunt`, `head_normal`, `head_hurt`, `head_taunt`, `head_ko`, `portrait` e os
efeitos `fx_*`. Uma peça com `2` no fim é a versão do lado de trás; sem ela, os dois lados usam a
mesma. Nas mãos isso importa: `hand_fist2` e `hand_open2` são as mãos vistas pela palma, e
`hand_taunt2` é a outra mão do par especial.

Um efeito com `pivot` e `tip` pode ser **segurado na mão da frente** (a doze do Dadazinho): o
`pivot` é o cabo, que fica no meio da mão, e a peça aponta para onde a mão aponta (do `pivot` para
o `tip`). Um socket `muzzle` marca a boca da arma (onde sai o clarão); na scout do Tchula, `scope`
marca a luneta (o brilho da mira) e `bolt` o ferrolho (de onde salta a cápsula). A mira sai na
direção `pivot` → `tip`, então o `tip` fica na altura do cabo, reto para a frente.

**Todas as peças viradas para a direita.** O jogo espelha tudo quando o personagem vira, e usa a
mesma peça para o braço e a perna de trás, na cor original da arte (o lado de trás não é escurecido).
Se o gerador mandou pares espelhados, use só a peça com o joelho e a ponta do pé para a direita.

**Regra das juntas.** Em cada junta, uma peça fica na frente e a outra atrás: o tronco na frente do
braço de trás, a manga na frente do antebraço, o short na frente da coxa, a coxa na frente da
canela, o pé na frente da canela, a mão na frente do antebraço. O braço da frente fica na frente do
tronco. A exceção é o cotovelo dobrado para a frente (mais de 85°, como na guarda): aí o jogo
desenha o antebraço na frente da manga, senão a barra da manga cobre o antebraço.

- **Peça da frente:** o toco é apagado junto com a linha do anel. Ela termina num corte limpo, sem
  contorno, e a junta (`tip` dela, `pivot` do filho) fica uns 1,5 px do jogo antes do corte (uns
  12 px numa folha que o jogo reduz a 0,15; proporcionalmente mais numa folha desenhada maior).
  Assim ela cobre o começo da peça de trás. Roupa é exceção: barra de manga, de short e punho de
  luva levam `outline` no corte.
- **Peça de trás:** o `pivot` fica a mesma distância depois do anel, para o anel ficar escondido. O
  toco continua lá, pintado da cor da pele com `paint`, e tapa a fresta quando o membro dobra.
- **Ombro da frente:** a cava ou o toco do ombro sai do tronco (com `outline` no corte) e o
  `shoulderNear` fica no corte, um pouco abaixo da linha do ombro: a manga cobre o resto.
- **Quadril:** o `pivot` da coxa fica dentro do short dela, acima da barra, para a barra da coxa
  ficar escondida atrás do short do quadril.
- **Ponta que entra em outra peça** (canela dentro do pé): o toco da canela é apagado, a canela não
  pode ser mais larga que o tornozelo do pé, e o topo do pé fica arredondado (sem cantos retos).
- **Calça comprida** (a calça tem que parecer um pano só, sem linha no quadril nem no joelho):
  - Quadril: a barra das pernas sai com um `erase` reto, **sem** `outline`, e os `legNear`/`legFar`
    ficam uns 10 px da folha acima do corte. A coxa continua por trás.
  - Coxa: a ponta do joelho (que fica na frente da canela) sai com `erase`, sem contorno, uns 20 px
    depois do `tip`. A ponta do quadril, escondida, fica com `paint` `auto` no contorno.
  - Canela: a ponta do joelho, atrás da coxa, fica com `paint` `auto` no contorno, para não
    aparecer linha quando o joelho dobra. Se ficar um degrau no joelho, engrosse com `stretch`
    até a canela ficar só um pouco mais fina que a coxa (na folha deitada, a grossura é a altura
    da imagem). Sem exagerar: esticar demais deforma as dobras do desenho.
- **Tampa da manga no tronco** (bola da manga desenhada no ombro da frente): apagada como a cava,
  com `outline` no corte.
- **Mãos especiais segurando um objeto** (o trompete do Tauba): a mão com o objeto vira a mão da
  frente (`hand_taunt`), com o objeto junto; da outra, só a mão (`keep`/`erase`), como mão de trás
  (`hand_taunt2`). O punho da camisa sai com `erase` nas duas. Um socket na mão marca de onde sai
  efeito (`bell`, a boca do trompete, solta as notas da provocação). Objeto que aparece e some sem mão
  (a doze do Dadazinho, a scout e a chave de boca do Tchula) vai na folha de efeitos, com `pivot` no
  cabo, e entra pela chave `prop`. Objeto que gira na mão (a chave do Tchula) também vai como `prop`,
  não como mão especial: as mãos com a chave da folha de peças dele ficaram sem uso.
- **Óculos com lente rosa** (vidro transparente na folha): `fill` com uma cor clara de vidro.
- **Short com a coxa de fora** (Crocko: coxa só de pele na folha): o quadril sai com `erase` reto
  logo abaixo da virilha, sem `outline`, e os `legNear`/`legFar` ficam uns 10 px acima do corte.
  Na coxa, a ponta do quadril até a barra do short é pintada da cor do short (`paint`) e leva
  `outline` nas bordas e na barra. Assim a perna do short gira junto com a coxa (chute, corrida)
  em vez de ficar parada no quadril como uma saia.
- **Joelho de pele** (coxa e canela à mostra): na coxa, a ponta do joelho sai com `erase` uns 30 px
  depois do `tip`, a sobra do desenho (o volume de trás do joelho) também, e as cores perto da ponta
  são pintadas iguais às do começo da canela (claro em cima, sombra embaixo). Um `fade` do `tip` até
  o corte faz a coxa sumir aos poucos por cima da canela: o joelho fica sem linha. Na canela, o
  contorno da ponta do joelho (escondida atrás da coxa) é pintado das mesmas cores.

### 2. Esqueleto e animação: `packages/game/src/rig`

- `skeleton.ts`: os 15 ossos (quadril, tronco, cabeça, braços e pernas da frente e de trás), a
  ordem de desenho (com a troca do cotovelo dobrado) e a conta que posiciona cada peça. Todos os
  personagens usam o mesmo esqueleto; o tamanho de cada osso vem das juntas das peças dele.
- `clips.ts`: as animações do esqueleto base (guarda, correr, pular, cair, parede, dash, esquiva,
  borda, levar golpe, arremessado, agarrado e os golpes). São poses-chave com o ângulo de cada osso.
- `characterClips.ts`: especial e provocação de cada personagem, pelo id da ficha. Poses em que a
  mão precisa chegar num lugar (mãos na boca, no volante) dependem do tamanho do braço e do desenho
  da mão: refaça os ângulos sempre que essas peças mudarem.
- Golpes são animados nas fases do sim (startup, active, recovery). A pose do impacto aparece no 1º
  frame ativo, quando a hitbox liga, mesmo se a ficha mudar os frames.
- A cabeça troca inteira conforme o estado: normal, golpe levado (`hurt`), provocação e KO.
- Peça na mão: a chave `prop: 'fx_...'` de um clipe põe a peça na mão da frente, e `prop: null`
  guarda (como a arma aparecendo e sumindo no especial do Dadazinho). `propSpin` gira a peça em
  volta do pivô dela, em graus, interpolado entre as chaves (a chave de boca do Tchula girando como
  um revólver; sem valor = 0, então repita o valor em cada chave enquanto ela estiver na mão).
- `render/fx.ts`: quais peças `fx_*` cada especial usa (fumaça, linhas de velocidade, projétil,
  clarão na boca da arma, a fumacinha quando a peça da mão aparece ou some, os quadradinhos do
  teleporte sorteado, as notas que saem do socket `bell` na provocação, a linha de mira e o brilho
  da luneta, a cápsula saltando do ferrolho e o som do tiro, e no contra-ataque do Crocko os anéis
  subindo pelo corpo, o brilho quando pega, o estalo e as linhas de impacto).
- Contra-ataque que pegou alguém toca o clipe `<id do especial>_counter` (o tapa do Crocko) no
  lugar do recovery; sem esse clipe, continua o do especial.

Para ver as animações, abra o jogo com `?rig` no fim do endereço (só no `pnpm dev`):
`http://localhost:5173/?rig`. ←/→ troca o clipe, F mostra 4 quadros lado a lado com a hitbox
de cada um, C troca o personagem, Espaço pausa.

### 3. Personagem novo (checklist do Claude)

1. Listar as peças da folha e medir cada uma com uma grade de coordenadas.
2. Escrever o `recortes.json`: escala de cada folha, `rect`, `pivot`, `tip` e `sockets`, e os
   `erase`, `paint` e `outline` da regra das juntas (com os casos de calça comprida, tampa da
   manga, mãos com objeto e óculos). Gerar com `pnpm art fulano --debug <pasta>` e conferir os
   pontos.
3. Acertar a proporção com `stretch`, comparando com o `1-conceito.png` e com os outros personagens
   (o jogo ajusta o boneco à altura da hurtbox: encurtar as pernas de um baixinho deixa cabeça e
   tronco maiores, como no Tauba):
   cabeça uns 30% da altura, do pescoço à barra do short uns 40%, pernas abaixo do short uns 30%.
   Braço e antebraço com comprimentos parecidos, e o alcance total parecido com o dos outros, para
   o punho cair dentro da hitbox dos golpes. Mãos de trás do mesmo tamanho aparente das da frente.
4. Conferir no `?rig`: repouso, guarda, corrida, pulo, borda, golpes (punho e pé dentro da hitbox no
   frame ativo), levar golpe, arremessado. Olhar de perto ombro, cotovelo, joelho e tornozelo, e
   procurar linhas atravessadas na roupa (barra ou contorno de uma peça por cima da outra).
5. Escrever o especial e a provocação em `characterClips.ts` e os efeitos em `render/fx.ts`.
6. Conferir na luta, com o console sem erros.

### 4. Cenário

O `recortes.json` do cenário tem as peças do palco (`building` com `wallLeft` e `wallRight`,
`plank` com `right`, para o jogo encaixar a arte nas caixas de colisão) e as camadas do fundo
(`layers`: céu, longe, meio). A posição e a velocidade de cada camada ficam em
`packages/game/src/render/stageView.ts`.

---

## Referência: o estilo do jogo

Esta seção explica as regras que já estão nos textos. Não precisa colar nada daqui.

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
| Roupa         | Nada que atravesse uma junta: casaco ou saia abaixo do quadril, capa, cachecol solto, cabelo abaixo do ombro. Fica preso a uma peça e não acompanha o movimento. |
| Cores         | Saturadas e quentes. Por personagem: 3 cores principais + pele + contorno. Branco = off-white `#F6F0E4`.                                                         |
| Leitura       | Tem que funcionar com ~100 px de altura: silhueta forte, nada de alça fina, estampa miúda ou detalhe menor que um dedo.                                          |
| Cenário       | Menos saturado e mais claro que os personagens, contorno fino ou nenhum. Degradê só no céu. O lutador sempre se destaca do fundo.                                |
| Proibido      | Texto, letras, números, logos, marcas, marca d'água, assinatura, uniforme de equipe real.                                                                        |

### Ficha para um personagem novo

Preencha a partir do `ELENCO.md` e das fotos. No Firefly ela é só o seu rascunho: a roupa vai no
passo 1, as mãos extras no passo 3 e os efeitos no passo 4. No ChatGPT, cole a ficha inteira na
primeira mensagem.

```text
CHARACTER SHEET
Name: <apelido> — <idade>, <quem é em 1 linha>.
Fighting style: <rusher / zoner / ...> — <como isso aparece no corpo e na pose>.
Body: based on the photos; <build>.
Outfit: <roupa, peça por peça, com as cores; nada que atravesse uma junta, sem texto>.
Signature details: <2-3 detalhes que ajudam a reconhecer>.
Colors: primary <hex>, secondary <hex>, accent <hex>.
Face/personality: <expressão de sempre>.
Special move: <nome> — <o que acontece>.
Taunt: <o que ele faz>.
Extra parts for the parts sheet: <mãos especiais da provocação ou do especial, ou "none">.
Props and effects for the effects sheet: <lista, com quantidade; o que voa vai de lado, para a direita>.
Avoid: <o que não pode aparecer>.
```

Exemplo preenchido (João Frango):

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
Extra parts for the parts sheet: two hands cupped around the mouth, as when shouting (left and right).
Props and effects for the effects sheet: the roast chicken projectile, side view flying right, in 3 slightly different rotation frames; 3 small steam puffs; 1 short motion-trail shape behind the chicken.
Avoid: restaurant names, text or logos on the apron or cap.
```
