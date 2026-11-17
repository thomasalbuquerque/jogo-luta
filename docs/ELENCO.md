# Elenco — os 16 amigos

Planilha de personagens. Uma linha por amigo. Cada um tem **1 especial** e **1 provocação**. O especial
deve caber nos blocos do `sim` (projétil, investida, área, contra-ataque, buff, teleporte, agarrão);
veja `docs/GDD.md`.

**Autorização:** marque ✅ quando o amigo aceitar ter a imagem (e a voz) no jogo.

| #   | Apelido     | Traço mais caricato                                                           | Bordão                       | Especial (bloco)                      | Provocação                                       | Cores                                    | Autorizou |
| --- | ----------- | ----------------------------------------------------------------------------- | ---------------------------- | ------------------------------------- | ------------------------------------------------ | ---------------------------------------- | --------- |
| 1   | Schummaki   | Cara de piloto de corrida, apaixonado por carros, caiçara do litoral          | "Vem com o Schummy, mermão!" | **Arrancada** (investida)             | Gira um volante imaginário e grita o bordão      | Vermelho, branco, grafite                |           |
| 2   | João Frango | "Tem clone dele no mundo todo", dono de restaurante, traço de frango          | "Ô Mariiiliaaa!"             | **Frango assado voador** (projétil)   | Mãos em concha, gritando o bordão                | Branco (avental), laranja, amarelo-milho |           |
| 3   | Dadazinho   | Óculos preto, cavanhaque, estatura média e magro, guitarrista, jogador de CS  | "sexo"                       | **Doze** (projétil)                   | Air guitar, depois solta "sexo" na seca          | Verde, verde-oliva, preto                |           |
| 4   | Tauba       | Careca, barbudo, baixinho, dev frontend, trompetista, some do Discord do nada | "🎵🎶" (toca o trompete)     | **Silent quit** (teleporte)           | Toca um trechinho clássico no trompete           | Preto, branco, dourado                   |           |
| 5   | Tchula      | Mecânico de macacão, olho verde, joga de scout no CS                          | "Nooola!"                    | **Scout** (projétil)                  | Gira a chave de boca na mão e grita o bordão     | Cinza, amarelo, preto                    |           |
| 6   | Crocko      | Alto, óculos preto, barba, professor de pilates e fisioterapeuta              | (a definir)                  | **Correção postural** (contra-ataque) | Alonga e aponta a postura                        | Turquesa, branco, preto                  |           |
| 7   | Darllan     | Confeiteiro de biscoitos, alto, moreno e grandão                              | "Darllan!"                   | **Rolo na bancada** (área)            | Morde um biscoito e grita o bordão               | Marrom-chocolate, creme, rosa-glacê      |           |
| 8   | Gabs        | Servidor público da prefeitura (crachá no pescoço), gamer                     | (a definir)                  | **Controle na mão** (área)            | Aperta o controle e comemora: "GG!"              | Azul-royal, roxo, cinza-claro            |           |
| 9   | Marília     | Baixinha (1,64 m), cabelo castanho, puxa um palheiro do nada                  | "Gentiii!"                   | **Tragadinha** (buff)                 | Mãos no rosto, gritando o bordão                 | Rosa-framboesa, jeans claro, verde-menta |           |
| 10  | Meia        | Óculos grandes pretos e quadrados, magro, pro player de jogo de luta          | (a definir)                  | **Comando** (agarrão)                 | Ajeita os óculos e chama com a mão               | Branco, ciano-elétrico, jeans            |           |
| 11  | Igão        | Jogador de vôlei, alto (1,90 m), cabelo castanho curto                        | "Cê tá miolo né nê?"         | **Saque** (projétil)                  | Quica a bola, aponta e solta o bordão            | Roxo-violeta, verde-limão, roxo-escuro   |           |
| 12  | Thom4o      | Alto (1,80 m), magro, dev, relógio preto no pulso                             | "É o Turbas!"                | **Tá plantada!** (agarrão + bomba)    | Confere o relógio, aponta e grita o bordão       | Amarelo-alerta, preto, vermelho-LED      |           |
| 13  | Arquelau    | Loiro de olho verde, dev de moletom com capuz, imita a voz de todo mundo      | Imita o do adversário        | **Dublagem** (projétil + cópia)       | Microfone na boca, repete o bordão do adversário | Bordô, areia, âmbar                      |           |
| 14  |             |                                                                               |                              |                                       |                                                  |                                          |           |
| 15  |             |                                                                               |                              |                                       |                                                  |                                          |           |
| 16  |             |                                                                               |                              |                                       |                                                  |                                          |           |

## Os primeiros

Escolhidos porque são bem diferentes de jogar: Schummaki vai para cima (investida), João Frango
controla de longe (projétil).

### 1. Schummaki

- **Quem é:** 30 anos, natural de São Sebastião (litoral de SP), gosta de carros. Alto (1,90 m, a
  mesma altura do Igão). O apelido vem da semelhança física com um piloto de Fórmula 1.
- **Estilo de luta:** rusher. Rápido no chão, peso médio-alto, pulo um pouco mais baixo.
- **Especial — Arrancada (investida):** "queima pneu" por alguns ticks (fumaça de pneu) e dispara
  na horizontal, acertando quem estiver no caminho. Startup mais longo, alcance e knockback altos;
  no ar a distância é menor (não vira recuperação infinita).
- **Provocação:** gira um volante imaginário, faz "vrum vrum" e solta "Vem com o Schummy, mermão!".
- **Visual:** roupa de quem curte carro. Jaqueta de corrida vermelha (`#D62839`), aberta, com
  listras brancas nas mangas e laterais grafite (`#2E3138`), sem logos; camiseta grafite; bermuda
  cargo grafite; luvas de piloto sem dedos, cinza; tênis vermelho e branco. Sem boné, para o topete
  aparecer. Cores: vermelho, branco e grafite. Concept art: `art/schummaki/1-conceito.png`.
- **Sem referências ao piloto:** o apelido vem da semelhança, mas o personagem não faz referência a
  ele: nada de nome, número, capacete, macacão ou logos de equipe, nem nada que lembre o acidente
  dele. Usar vermelho tudo bem.

### 2. João Frango

- **Quem é:** 24 anos, carioca, estatura média (1,70 m), dono de restaurante, acorda tarde, vive
  postando foto de comida. O
  grupo diz que ele tem clones pelo mundo (parece com várias pessoas). O apelido não tem motivo, mas
  as montagens com traço de frango viraram piada.
- **Estilo de luta:** zoner. Mais leve, bom no ar, mais lento no chão.
- **Especial — Frango assado voador (projétil):** arremessa um frango assado (ou prato do restaurante)
  que viaja em linha reta e some depois de um tempo. Dano baixo, knockback baixo, recarga curta:
  serve para controlar distância.
- **Provocação:** põe as mãos em concha e grita "Ô Mariiiliaaa!" (chamando a Marília, amiga do grupo).
- **Visual:** avental de cozinheiro, um detalhe de frango (crista no boné, ou chinelo/meias com pé de
  galinha), cara de sono. Cores: branco do avental, laranja e amarelo-milho.
- **Ideias guardadas** (para efeito cômico, KO ou provocação alternativa): "clone" dele aparecendo
  no fundo do mapa; flash de celular tirando foto do prato; bocejo ao respawnar (acorda tarde).

### 3. Dadazinho

- **Quem é:** 30 anos, também chamado de Broder. Estatura média (1,70 m) e magro, pele branca, óculos de
  armação preta e cavanhaque clássico. Guitarrista. No CS do grupo, gosta de jogar de doze (a
  MAG-7). Solta "sexo" do nada, sem motivo nenhum: é só uma brincadeira dele, sem teor sexual.
- **Bordão:** "sexo", assim mesmo, tudo minúsculo: falado seco, sem emoção.
- **Estilo de luta:** punisher de curta distância. Leve e rápido (é magro), mas o
  especial é lento para sair e pune quem chega perto.
- **Especial — Doze (projétil):** a doze aparece nas mãos dele, ele dá um tiro para a frente e a
  arma some. O tiro é um projétil curto e forte: alcance de uns 200 px (bem menor que o frango do
  João), dano e knockback altos, startup e recovery longos, recarga longa. Efeitos: fumacinha
  quando a arma aparece e some, clarão do cano, rastro de chumbo.
- **Provocação:** toca uma air guitar (uma mão no braço da guitarra, a outra palhetando), para,
  olha para a tela e diz "sexo" na seca.
- **Visual:** camisa verde (`#3F9A4E`) de manga comprida, de botão, com gola e dois bolsos no peito,
  por dentro da calça; calça comprida verde-oliva escura (`#4F5B32`) com cinto preto; tênis
  off-white. Óculos de armação preta (`#23262B`) e cavanhaque. Cores: verde, verde-oliva e preto.
- **A arma:** escopeta compacta de bomba, de cano curto e carregador na frente do cabo, como a
  MAG-7. A arte é genérica, inspirada nela: nada de copiar o desenho da skin Justice, emblemas,
  nomes ou logos do CS. Troque as cores da arma em `<ITEMS>` abaixo se quiser lembrar a skin.
- **Ideias guardadas:** "sexo" aleatório como fala de vitória ou ao respawnar; cápsula saltando da
  arma no tiro.
- **No jogo:** jogável. A doze aparece na mão com fumacinha, o tiro sai com clarão e dá um coice
  para trás; o chumbo voa uns 200 px. Na provocação ele toca a air guitar e só no fim solta o
  "sexo" (`voiceAt` da ficha). Ficha em `packages/sim/src/characters/dadazinho.ts`.

#### Ficha de arte

```text
CHARACTER SHEET
Name: Dadazinho ("Broder") — 30-year-old guy, guitarist, plays shooter games with his friends, likes to say one random word out of nowhere with a straight face.
Fighting style: close-range punisher — light and quick, compact relaxed stance, ready to pull out a shotgun.
Body: based on the photos; short and skinny build.
Outfit: green (#3F9A4E) long-sleeve button-down shirt with a collar and two chest pockets, tucked into dark olive (#4F5B32) long pants with a black belt; off-white (#F6F0E4) sneakers.
Signature details: black rectangular glasses, classic goatee, the green shirt with two chest pockets.
Colors: primary #3F9A4E, secondary #4F5B32, accent #23262B.
Face/personality: deadpan, slight smug smirk.
Special move: "Doze" — a compact pump shotgun appears in his hands, he fires one blast forward, and the gun vanishes.
Taunt: plays air guitar, stops, looks at the camera and says one word with a straight face.
Extra parts for the parts sheet: two hands playing air guitar, one fretting, one strumming.
Props and effects for the effects sheet: the shotgun (side view, pointing right, no hands); 1 muzzle-flash burst; pellet streaks; smoke puffs for the gun appearing and vanishing.
Avoid: text, logos or game emblems on the clothes and the gun;
```

Trechos prontos para os textos do Firefly (pasta `art/dadazinho/`):

- `<EXPRESSION>`: `deadpan smug smirk`
- `<CHARACTER>`:
  `Dadazinho, 30-year-old guitarist, short and skinny, fair skin, black rectangular glasses, classic goatee, deadpan smirk. Green (#3F9A4E) long-sleeve button-down shirt with a collar and two chest pockets, tucked into dark olive (#4F5B32) long pants with a black belt; off-white sneakers.`
- `<LEGWEAR>`: `long pants with belt`
- `<SHOE>`: `chunky sneaker`
- `<EXTRA>`: `two hands playing air guitar, one fretting, one strumming`
- Manga comprida até o punho: no passo 3, troque `upper arm with sleeve; forearm without hand` por
  `upper arm with sleeve; forearm with sleeve, without hand`.
- `<ITEMS>`:
  `1 compact boxy pump-action shotgun with a short barrel and a box magazine, side view pointing right, no hands, off-white with blue and gold details; 1 big muzzle-flash burst; 5 short pellet streaks; 3 small gray smoke puffs`

### 4. Tauba

- **Quem é:** 30 anos, baixinho (1,64 m), careca, barbudo, pele um pouco morena. Desenvolvedor de
  software frontend. Toca trompete. A piada do grupo: ele sai do Discord do nada, sem avisar
  ("silent quit").
- **Bordão:** não fala: toca. O balão mostra notas musicais (🎵🎶) e o som é o trompete.
- **Estilo de luta:** fujão (trickster). Peso médio-leve, bom no chão e no ar, golpes normais sem
  nada de especial. O jogo dele é sumir quando aperta e voltar de qualquer lugar.
- **Especial — Silent quit (teleporte):** ele some do nada e reaparece **na ponta do palco mais
  perto dele**, em pé em cima do bloco principal, a 60 px da quina. O jogador não escolhe para onde
  vai, mas todo mundo sabe onde ele vai aparecer: a borda, o lugar mais perigoso do palco.
  - **Destino:** a quina de cima do bloco sólido mais perto do centro dos pés dele, na horizontal
    (as plataformas atravessáveis ficam de fora; empate: a do lado para onde está virado). Caindo no
    buraco da direita, volta na ponta direita; em cima do palco em x = +100, também; em cima da
    plataforma pequena da esquerda, na ponta esquerda. Sem sorteio: não usa o RNG.
  - **Antes (até a 2ª rodada de balanceamento):** reaparecia num lugar sorteado do palco, quase
    sempre longe do adversário. Virou recuperação forte demais: voltava de qualquer lugar e ainda
    caía num lugar seguro. O modo sorteado (`target: 'random'`) continua no bloco.
  - **Tempo:** startup de 14 (ele congela e começa a sumir, ainda vulnerável), uns 20 ticks fora da
    luta (invisível e intangível), reaparece e tem recovery de 18 sem invencibilidade: quem esperar
    na borda pune.
  - **Sem hitbox:** é só fuga e reposicionamento, não causa dano.
  - **Recarga longa:** 300 ticks (5 s), contada do começo. Funciona no ar 1 vez (`oncePerAir`):
    como sempre volta para o palco, serve de recuperação, e por isso a recarga é tão longa: se for
    arremessado de novo logo depois, não tem. Usar no meio da luta como fuga custa posição (ele sai
    do centro e vai para o canto).
  - **Efeitos:** ao sumir, o corpo se desfaz em quadradinhos (como uma chamada caindo) com um "plim"
    de desconexão; ao voltar, os quadradinhos se juntam com um "plim" de conexão. Nada de logo ou
    som do Discord: tudo genérico.
  - **Código novo (feito):** o bloco teleporte ganhou os destinos que somem: sorteado
    (`target: 'random'`) e na ponta (`target: 'edge'`, com `edgeInset`), no mesmo bloco, em vez de um
    bloco novo.
- **Provocação:** um trompete aparece na mão dele com uma fumacinha, ele toca um trechinho de uns
  2 s e o trompete some. Enquanto toca, saem notas musicais do trompete e o balão mostra 🎵🎶. A
  música é original, no clima de fanfarra clássica de concerto: em Dó maior, Sol–Dó–Mi–Sol (curtas),
  Mi (curta), Sol (longa). Sem áudio gravado, o jogo sintetiza o trompete com essas notas, em vez da
  voz provisória.
- **Visual:** terno preto de músico de concerto: paletó preto (`#1E1F24`) abotoado, até o quadril,
  sem cauda, com lenço dourado (`#E0A93B`) no bolso; camisa social branca (`#F4F1EA`) e gravata
  borboleta preta; calça social preta; sapato social preto. Careca e barba cheia escura. Ele é magro mas tem braço forte e busto forte (não muito, mas destaca um pouco na roupa) Cores:
  preto, branco e dourado (o dourado do trompete e do lenço ajuda a ler o personagem nos menus
  escuros).
- **No jogo:** jogável. No especial ele ajeita a gravata, se desfaz em quadradinhos com um "plim"
  descendo, fica 20 ticks sumido e volta na ponta do palco mais perto dele com os
  quadradinhos se juntando e um "plim" subindo. Na provocação o trompete aparece com fumacinha, as
  notas saem da boca do trompete no ritmo da fanfarra e o balão mostra 🎵🎶. Sem áudio gravado, a
  fanfarra é sintetizada (`packages/game/src/audio/fanfare.ts`). Ficha em
  `packages/sim/src/characters/tauba.ts`.
- **Ideias guardadas:** "fulano saiu da chamada" como balão ao levar KO; reaparecer no respawn com
  o "plim" de conexão; o trompete dando uma nota desafinada quando ele leva golpe na provocação.

#### Ficha de arte

```text
CHARACTER SHEET
Name: Tauba — 30-year-old frontend developer and trumpet player, famous among his friends for silently leaving voice calls without saying goodbye.
Fighting style: trickster — evasive and sneaky, light on his feet, upright confident stance.
Body: based on the photos; short build; slightly muscular upper body giving extra volume to his chest and arms.
Outfit: black (#1E1F24) concert suit: buttoned hip-length jacket with no tails and a gold (#E0A93B) pocket square; white (#F4F1EA) dress shirt with a black bow tie; black dress pants; black dress shoes.
Signature details: shaved bald head, full dark beard, the concert suit with bow tie and gold pocket square.
Colors: primary #1E1F24, secondary #F4F1EA, accent #E0A93B.
Face/personality: calm poker face, eyes glancing to the side, as if about to sneak away.
Special move: "Silent quit" — he dissolves into small squares and vanishes, then reappears somewhere else on the stage.
Taunt: a trumpet appears in his hands, he plays a short classical fanfare, and music notes come out of the bell.
Extra parts for the parts sheet: two hands holding a trumpet, one gripping it, one pressing the valves.
Props and effects for the effects sheet: the trumpet (side view, bell pointing right, no hands); 3 music notes; small square particles for vanishing and reappearing; smoke puffs for the trumpet appearing and vanishing.
Avoid: text or logos on the clothes; chat app logos or icons; tails on the jacket.
```

Trechos prontos para os textos do Firefly (pasta `art/tauba/`):

- `<EXPRESSION>`: `poker face glancing sideways`
- `<CHARACTER>`:
  `Tauba, 30-year-old trumpet player, short, bald, slightly muscular upper body giving extra volume to his chest and arms, bald, full dark beard, light brown skin, calm poker face. Black (#1E1F24) concert suit: buttoned hip-length jacket, no tails, gold (#E0A93B) pocket square; white dress shirt, black bow tie; black dress pants; black dress shoes.`
- `<LEGWEAR>`: `dress pants`
- `<SHOE>`: `dress shoe`
- `<EXTRA>`: `two hands holding a trumpet, one gripping it, one pressing the valves`
- Manga comprida até o punho: no passo 3, troque `upper arm with sleeve; forearm without hand` por
  `upper arm with sleeve; forearm with sleeve, without hand`.
- `<ITEMS>`:
  `1 shiny brass trumpet, side view with the bell pointing right, no hands; 3 black music notes; 8 small glowing squares for vanishing; 3 small gray smoke puffs`

### 5. Tchula

- **Quem é:** 35 anos, mecânico. Estatura média (1,70 m), cabelo castanho, olhos verdes, pele
  branca. No CS do grupo, joga de scout (a SSG 08).
- **Bordão:** "Nooola!", gritado, puxando o "o".
- **Estilo de luta:** sniper. Peso médio-alto (braço de mecânico), meio lento no chão e no ar,
  golpes normais fortes e um pouco lentos. O jogo dele é manter distância e acertar o tiro de
  longe; de perto, sofre. Contraste com o Dadazinho: a doze pune de perto, a scout pune de longe.
- **Especial — Scout (projétil):** a scout aparece nas mãos dele, ele mira, dá um tiro e a arma
  some. O tiro é um projétil **muito rápido, fino e de longo alcance**: atravessa o palco inteiro.
  - **Tiro:** reto para a frente (`launchAngle` 0, sem gravidade), velocidade alta (~36 px/tick) e
    vida de ~30 ticks (uns 1000 px: passa do palco de 900 px). Caixa baixa e comprida (~64×14 px):
    fina para dar para desviar pulando ou abaixando, comprida para não atravessar a hurtbox sem
    acertar.
  - **Dano:** alto (~18), knockback médio-alto (ângulo baixo, ~20°). É o golpe que mata de longe,
    então precisa ser bem telegrafado.
  - **Tempo:** startup longo (~28 ticks: a arma aparece e ele mira), recovery longo (~30 ticks:
    puxa o ferrolho e a arma some). Recarga longa (~150 ticks, 2,5 s): errar custa caro.
  - **No ar:** funciona, mas não ajuda a voltar ao palco (não tem impulso).
  - **Efeitos:** fumacinha quando a arma aparece e some; durante a mira, uma linha de mira fininha
    e um brilho na luneta (aviso para o adversário, só visual); no tiro, clarão do cano, rastro
    branco do projétil e coice para trás; no recovery, cápsula saltando do ferrolho.
  - **Sem código novo no `sim`:** cabe no bloco projétil como está. A linha de mira, o rastro e a
    cápsula são só efeitos do `game`.
- **Provocação:** tira uma chave de boca do bolso, gira na mão como um revólver, aponta com ela para
  o adversário e grita "Nooola!".
- **Visual:** macacão de mecânico cinza (`#6E737B`) de manga comprida, com zíper na frente e
  detalhes em amarelo (`#F2C230`): faixas nos punhos, nos joelhos e no peito, e costuras amarelas;
  bolsos no peito e nas pernas; flanela vermelha saindo do bolso de trás. Bota preta (`#1F2023`) de
  segurança, de cano médio, com bico reforçado e sola grossa. Cabelo castanho curto, olhos verdes
  (bem visíveis na cabeça). Um pouco de graxa nas mãos e no rosto. Cores: cinza, amarelo e preto (o
  amarelo ajuda a ler o personagem nos menus escuros).
- **A arma:** rifle de ferrolho leve e comprido, com luneta, como a SSG 08 na pintura padrão
  (escura, preta e grafite). A arte é genérica, inspirada nela: nada de nomes, emblemas ou logos do
  CS.
- **No jogo:** jogável. No especial a scout aparece com uma fumacinha, ele mira (uma linha de mira
  clara sai do cano, cada vez mais forte e piscando no fim, e a luneta brilha), o tiro sai com
  clarão e estampido, o coice joga o corpo para trás, ele puxa o ferrolho (a cápsula salta com um
  clique-claque) e a arma some. Na provocação ele tira a chave de boca do bolso de trás, gira a
  chave na mão, que para em pé no punho, aponta para a frente e grita "Nooola!". Sem áudio gravado, o tiro e o ferrolho são
  sintetizados (`rifle_shot`, `rifle_bolt`). Ficha em `packages/sim/src/characters/tchula.ts`.
- **Ideias guardadas:** "Nooola!" ao acertar o tiro de longe ou ao levar KO; respawn limpando as
  mãos na flanela; headshot (acertar a cabeça) com dano extra, se um dia o `sim` tiver hurtbox de
  cabeça.

#### Ficha de arte

```text
CHARACTER SHEET
Name: Tchula — 35-year-old car mechanic, plays shooter games with his friends as a long-range sniper.
Fighting style: sniper — sturdy and steady, keeps his distance, calm aiming stance.
Body: based on the photos; average height and medium build, strong forearms.
Outfit: gray (#6E737B) long-sleeve mechanic coverall with a front zipper, yellow (#F2C230) bands on the cuffs, knees and chest, yellow stitching, chest and leg pockets, a red rag hanging from the back pocket; black (#1F2023) mid-height steel-toe safety work boots with thick soles.
Signature details: short brown hair, green eyes, the gray coverall with yellow bands, a few grease smudges on his hands and cheek.
Colors: primary #6E737B, secondary #F2C230, accent #1F2023.
Face/personality: focused, one eye slightly squinted as if aiming, confident half smile.
Special move: "Scout" — a long bolt-action scoped rifle appears in his hands, he aims, fires one shot straight across the stage, and the rifle vanishes.
Taunt: pulls a wrench from his pocket, spins it in his hand like a revolver, points it at the opponent and shouts his catchphrase.
Extra parts for the parts sheet: two hands holding a wrench, one gripping it, one open.
Props and effects for the effects sheet: the rifle (side view, pointing right, no hands); the wrench; 1 muzzle-flash burst; a long thin bullet trail; 1 small brass shell casing; a small scope glint; smoke puffs for the rifle appearing and vanishing.
Avoid: text, logos or brand names on the coverall and the rifle; game emblems.
```

Trechos prontos para os textos do Firefly (pasta `art/tchula/`):

- `<EXPRESSION>`: `focused squint, confident half smile`
- `<CHARACTER>`:
  `Tchula, 35-year-old car mechanic, average height, medium build, fair skin, short brown hair, green eyes, a few grease smudges. Gray (#6E737B) long-sleeve mechanic coverall with a front zipper, yellow (#F2C230) bands on the cuffs, knees and chest, yellow stitching, a red rag in the back pocket; black steel-toe safety work boots.`
- `<LEGWEAR>`: `coverall pants with yellow knee bands`
- `<SHOE>`: `steel-toe safety work boot`
- `<EXTRA>`: `two hands holding a wrench, one gripping it, one open`
- Manga comprida até o punho: no passo 3, troque `upper arm with sleeve; forearm without hand` por
  `upper arm with sleeve; forearm with sleeve, without hand`.
- `<ITEMS>`:
  `1 long bolt-action sniper rifle with a scope, side view pointing right, no hands, matte black and dark graphite; 1 chrome wrench; 1 muzzle-flash burst; 1 long thin white bullet trail; 1 small brass shell casing; 1 small scope glint; 3 small gray smoke puffs`

### 6. Crocko

- **Quem é:** 35 anos, professor de pilates e fisioterapeuta. Alto (1,80 m), cabelo preto, pele
  morena, barba curta, óculos de armação preta redonda.
- **Bordão:** a definir. Enquanto não tiver, a provocação sai sem fala (só o gesto).
- **Estilo de luta:** paciente (counter). Peso alto e bom alcance (é alto, só o Igão e o Schummaki são maiores), meio
  lento no chão, pulo médio. O jogo dele é ficar perto, esperar o adversário apertar o botão e
  punir. Contraste com o Schummaki: o Schummaki vai para cima, o Crocko espera vir.
- **Especial — Correção postural (contra-ataque):** ele para numa pose de pilates (equilibrado numa
  perna, braços abertos, olhando o adversário como quem avalia a postura do aluno). Quem bater nele
  nessa janela leva a "correção": um tapa firme de mão aberta nas costas, de fisioterapeuta, que
  arremessa.
  - **Janela:** startup curto (~6 ticks), active de 60 ticks (1 s, a janela do contra-ataque),
    recovery longo (~28 ticks) se ninguém bater: ele perde o equilíbrio e fica exposto.
  - **Golpe devolvido:** dano ~14, knockback alto (ângulo ~40°, para longe dele). Projétil que
    acertar na janela volta para quem soltou (resposta natural ao João Frango e ao Tchula).
  - **Recarga:** 120 ticks (2 s), contada do começo, para não virar escudo: a janela fica aberta
    no máximo metade do tempo, e sobram 26 ticks sem contra-ataque depois de cada uso.
  - **No ar:** funciona, sem impulso (não ajuda a voltar ao palco).
  - **Perde do agarrão:** como todo contra-ataque, o agarrão passa por ele.
  - **Efeitos:** na pose, um brilho leve em volta dele (aviso de que está esperando); quando pega,
    um "ding" e um congelamento curto; no golpe, um "créc" de coluna estalando e linhas de impacto.
    Para ninguém deixar de perceber que foi contra-ataque, tudo em ciano claro (`#3FE8E0`, puxado do
    turquesa dele): os anéis da janela, um clarão grande e um anel de onda de choque no ponto do
    contato, ele piscando em ciano, quem levou o golpe devolvido também, e o projétil devolvido
    pintado de ciano até sumir (com o som do contra-ataque também na devolução).
  - **Quase nada novo no `sim`:** cabe no bloco contra-ataque. O oponente só toma o golpe e entra
    no hitstun normal: nenhuma animação nova para ele. O `sim` só passou a marcar quem o
    contra-ataque pegou (no `moveHits`), para o jogo tocar o tapa em vez do recovery de quem errou.
- **Provocação:** faz um alongamento lateral (braços para cima, inclina para o lado) e aponta para
  o adversário com cara de "olha essa postura".
- **Visual:** professor de estúdio de pilates, com roupa de treino. Camiseta turquesa (`#1BA39C`) lisa
  de manga curta, justa e para fora do short; short esportivo preto (`#22252A`) acima do joelho;
  tênis de treino branco (`#F4F6F5`) e leve. Óculos de armação preta redonda, cabelo preto curto e
  liso penteado para trás, barba cheia e curta. Corpo alto, magro e atlético, postura impecável
  (costas retas, peito aberto). Cores: turquesa, branco e preto (o turquesa lê bem nos menus escuros
  e não repete a cor de ninguém).
- **No jogo:** jogável. No especial ele abre os braços e levanta o joelho (pose de pilates), e anéis
  turquesa sobem dos pés à cabeça enquanto a janela está aberta, como quem avalia a postura. Se
  alguém bater, um brilho aparece acima da cabeça, sai o tapa de mão aberta com um passo à frente,
  um estalo, linhas de impacto e o "créc" de coluna (`spine_crack`, sintetizado), além do "tim" do
  contra-ataque. Projétil que encosta na janela volta (com o brilho, sem o tapa). Se ninguém bater,
  ele perde o equilíbrio, balança com cara de dor e volta para a guarda. Na provocação ele estica um
  braço para cima com a outra mão na cintura, inclina para trás e aponta para o adversário; o balão
  diz "Olha essa postura..." até ele ter bordão. Ficha em `packages/sim/src/characters/crocko.ts`.
- **Ideias guardadas:** "Contrai o abdômen!" ou "Respira!" como fala do contra-ataque, se ele não
  tiver bordão próprio; respawn fazendo uma respiração profunda de pilates; uma bola suíça como
  objeto no fundo de um mapa.

#### Ficha de arte

```text
CHARACTER SHEET
Name: Crocko — 35-year-old pilates instructor and physical therapist, tall, with perfect posture.
Fighting style: patient counter-puncher — calm and balanced, waits for the opponent to attack and then corrects them.
Body: based on the photos; tall, lean and athletic build, very upright posture.
Outfit: plain turquoise (#1BA39C) short-sleeve shirt, fitted, untucked; black (#22252A) athletic sports shorts above the knee; light white (#F4F6F5) training sneakers.
Signature details: black rounded glasses, short straight black hair combed back, short full beard, the turquoise shirt.
Colors: primary #1BA39C, secondary #F4F6F5, accent #22252A.
Face/personality: calm, attentive, slightly judging look, as if checking someone's posture.
Special move: "Correção postural" — he holds a balanced pilates pose on one leg with open arms; if someone hits him, he answers with a firm open-hand slap on their back that sends them flying.
Taunt: does a side stretch with his arms up, then points at the opponent as if criticizing their posture.
Extra parts for the parts sheet: one hand pointing with the index finger; one flat open hand, palm forward, for the slap.
Props and effects for the effects sheet: a soft ring of light around a standing body (waiting glow); 1 small star-shaped "ding" sparkle; 1 crack-shaped impact burst; 4 short impact lines.
Avoid: text or logos on the clothes; gym brand logos; medical coat.
```

Trechos prontos para os textos do Firefly (pasta `art/crocko/`):

- `<EXPRESSION>`: `calm attentive look, slightly judging`
- `<CHARACTER>`:
  `Crocko, 35-year-old pilates instructor, tall, lean and athletic, very upright posture, tan brown skin, short straight black hair combed back, black rounded glasses, short full beard. Turquoise (#1BA39C) short-sleeve shirt, untucked; black (#22252A) athletic sports shorts; light white training sneakers.`
- `<LEGWEAR>`: `black athletic shorts` (short: no passo 3 use as versões de short de `<HIPS>` e
  `<LEGS>` e apague `<PANTS>`)
- `<SHOE>`: `white training sneaker`
- `<EXTRA>`: `one hand pointing with the index finger, one flat open hand with the palm forward`
- `<ITEMS>`:
  `1 soft turquoise ring of light; 1 small white star-shaped sparkle; 1 crack-shaped white impact burst; 4 short white impact lines`

### 7. Darllan

- **Quem é:** 35 anos, confeiteiro que faz biscoitos. Alto (1,80 m, a mesma altura do Crocko),
  moreno, corpo grande e um pouco acima do peso. Cabelo e barba: seguir as fotos.
- **Bordão:** "Darllan!"
- **Estilo de luta:** pesadão. O mais pesado do elenco (voa menos), lento no chão e de pulo baixo,
  com golpes um pouco mais fortes. O jogo dele é chegar perto e bater forte, sem pressa. Contraste
  com o Crocko: os dois são altos, mas o Crocko espera o adversário vir e o Darllan vai lá e bate.
- **Especial — Rolo na bancada (área):** ele ergue o rolo de massa com as duas mãos acima da cabeça
  e bate com tudo no chão, como quem abre massa na bancada. A pancada solta uma nuvem de farinha e
  migalhas de biscoito e arremessa quem estiver em volta, dos dois lados.
  - **Tempo:** startup longo (~18 ticks, o rolo subindo é o aviso), active curto (~5 ticks, a
    pancada), recovery longo (~26 ticks, agachado com o rolo no chão): quem esquivar pune.
  - **Golpe:** dano ~15, knockback alto (ângulo ~50°, para longe dele). Hitbox em volta do corpo, da
    cintura para baixo, com uns 80 px de cada lado: pega quem estiver colado, na frente ou atrás.
  - **Recarga:** ~60 ticks (1 s), contada do começo, para não virar spam.
  - **No ar:** sai igual (a mesma pose, batendo em volta), sem impulso: não ajuda a voltar ao palco.
  - **Efeitos:** no startup, um brilho no rolo erguido (aviso); na pancada, uma nuvem de farinha
    branca no chão, migalhas de biscoito voando, um tremor curto da câmera e um "póf" grave.
  - **Sem código novo no `sim`:** cabe no bloco área como está.
  - **Animação simples:** o Darllan precisa de 1 clipe de especial com 3 poses (rolo erguido,
    pancada no chão, agachado). O oponente usa o hitstun e o arremesso que já existem: nenhuma
    animação nova para ele. A farinha e as migalhas são partículas, não o esqueleto. A única peça
    nova é o rolo de massa.
- **O biscoito dele:** não é cookie. Biscoito redondo de massa amanteigada bem assada, cor
  `#C89D6A` (lê melhor no tamanho pequeno e contra o creme da camiseta), com a borda ondulada e um
  coraçãozinho de glacê rosa (`#E8789A`) no meio. Só isso: a borda ondulada e o glacê bastam para
  ler como biscoito mesmo pequeno. As migalhas são pedacinhos da mesma massa, sem glacê.
- **Provocação:** tira um biscoito do bolso do avental, dá uma mordida e grita "Darllan!" de
  braços abertos. Duas poses (mordendo e de braços abertos); o biscoito é a mesma peça das
  migalhas, inteira.
- **Visual:** confeiteiro de avental. Avental marrom-chocolate (`#6B4226`) amarrado na cintura,
  do peito ao joelho, com o bolso e a alça do pescoço em rosa-glacê (`#E8789A`); camiseta creme
  (`#F2E3C6`) de manga curta por baixo; calça jeans escura; tênis creme. Uma mancha de farinha no
  avental e na bochecha. Corpo alto e largo, barriga leve, ombros largos, braços grossos. Sem
  chapéu de chef (o avental branco já é do João Frango; o do Darllan é marrom). Cores:
  marrom-chocolate, creme e rosa-glacê (o marrom e o rosa não repetem a cor de ninguém).
- **No jogo:** jogável. No especial ele tira o rolo de massa, ergue com as duas mãos acima da cabeça
  (um brilho na ponta do rolo avisa) e desce com tudo no chão, gritando: a farinha estoura para os
  dois lados, as migalhas voam, a câmera treme e sai o "póf" (`flour_thump`, sintetizado). Fica
  agachado com o rolo no chão até levantar e guardar o rolo. No ar a pancada sai igual, e a farinha
  sai de onde o rolo estiver. Na provocação ele tira o biscoito do bolso do avental, morde (as
  migalhas caem), mastiga e abre os braços gritando "Darllan!". Nos golpes base bate um pouco mais
  forte que os outros. Ficha em `packages/sim/src/characters/darllan.ts`.
- **Ideias guardadas:** respawn caindo com uma fornada de biscoitos; KO com uma nuvem de farinha;
  um forno de padaria no fundo de um mapa.

#### Ficha de arte

```text
CHARACTER SHEET
Name: Darllan — 35-year-old biscuit baker, tall and big, warm and loud.
Fighting style: heavy brawler — slow and strong, walks up close and hits hard around him.
Body: based on the photos; tall (same height as the tallest fighters), big and slightly heavyset build, broad shoulders, thick arms, soft belly.
Outfit: chocolate brown (#6B4226) baker's apron tied at the waist, from chest to knee, with a frosting pink (#E8789A) front pocket and neck strap; cream (#F2E3C6) short-sleeve T-shirt underneath; dark blue jeans; cream sneakers. A smear of flour on the apron and on one cheek.
Signature details: the chocolate brown apron with the pink pocket, the flour smears, hair and beard as in the photos.
Colors: primary #6B4226, secondary #F2E3C6, accent #E8789A.
Face/personality: big friendly grin, loud and confident, a bit of a show-off.
Special move: "Rolo na bancada" — he raises a wooden rolling pin with both hands above his head and slams it on the ground, like rolling dough on the counter; a cloud of flour and biscuit crumbs bursts out and knocks back everyone around him.
Taunt: takes a biscuit out of the apron pocket, bites it, then opens his arms wide and shouts his own name.
Extra parts for the parts sheet: two hands gripping (for the rolling pin); one hand holding a small round biscuit.
Props and effects for the effects sheet: 1 wooden rolling pin; 1 round butter biscuit (#C89D6A golden-baked dough) with a wavy scalloped edge and a small pink (#E8789A) icing heart in the middle; 1 white flour cloud puff; 4 small plain biscuit crumbs (#C89D6A); 1 small shine sparkle.
Avoid: text or logos on the clothes; chef hat; white apron.
```

Trechos prontos para os textos do Firefly (pasta `art/darllan/`):

- `<EXPRESSION>`: `big friendly grin, loud and confident`
- `<CHARACTER>`:
  `Darllan, 35-year-old biscuit baker, tall, big and slightly heavyset build, broad shoulders, thick arms, soft belly, tan brown skin. Chocolate brown (#6B4226) baker's apron from chest to knee with a frosting pink (#E8789A) front pocket and neck strap; cream (#F2E3C6) short-sleeve T-shirt underneath; dark blue jeans; cream sneakers; a smear of flour on the apron and on one cheek.`
- `<LEGWEAR>`: `dark blue jeans`
- `<SHOE>`: `cream sneaker`
- `<EXTRA>`: `two gripping hands for a rolling pin, one hand holding a small round biscuit`
- `<ITEMS>`:
  `1 wooden rolling pin; 1 round butter biscuit (#C89D6A golden-baked dough) with a wavy scalloped edge and a small pink (#E8789A) icing heart in the middle; 1 white flour cloud puff; 4 small plain biscuit crumbs (#C89D6A); 1 small shine sparkle`

### 8. Gabs

- **Quem é:** 30 anos, servidor público que trabalha na prefeitura, gamer. Altura média (1,70 m),
  corpo levemente gordo (nem magro, nem gordo). Cabeça do mesmo tamanho da dos outros (o estilo já
  é cabeçudo); quem marca ele é o crachá da prefeitura e o fone gamer no pescoço.
- **Bordão:** a definir. Enquanto não tiver, o balão da provocação diz "GG!".
- **Estilo de luta:** espaçador. Peso médio-alto, meio lento no chão, pulo médio. O jogo dele é
  ficar na distância certa e deixar o bonequinho bater; colado nele, o especial não pega. Contraste
  com o Darllan: os dois usam área, mas o Darllan bate em volta do corpo e o Gabs bate longe dele.
  Contraste com o Dadazinho: a doze viaja e pega de perto também; o bonequinho aparece num ponto
  fixo e não pega quem está colado.
- **Especial — Controle na mão (área):** um controle de videogame aparece nas mãos dele e, à frente,
  surge um bonequinho de videogame em pixel art. O Gabs aperta os botões e o bonequinho dá um soco
  ou chute, como se ele estivesse jogando.
  - **Onde acerta:** num ponto fixo a média distância, de ~105 a ~195 px à frente do centro dele,
    na altura do chão. Entre o corpo dele e o bonequinho fica o ponto cego: quem está colado não
    leva. Atrás também não pega.
  - **Tempo:** startup médio (~14 ticks, o bonequinho surgindo é o aviso), active curto (~6 ticks,
    o golpe), recovery médio (~22 ticks, o bonequinho some e o controle vai embora).
  - **Golpe:** dano ~11, knockback médio (ângulo ~35°, para longe do Gabs).
  - **Risco:** se o Gabs apanhar no meio, o golpe cai e o bonequinho some junto, como se o
    controle caísse da mão.
  - **Recarga:** ~60 ticks (1 s), contada do começo.
  - **No ar:** sai igual, com o bonequinho à frente na altura dele, sem impulso: não ajuda a voltar
    ao palco.
  - **Efeitos:** o controle aparece com uma fumacinha; o bonequinho surge e some com um efeito de
    "spawn" 8-bit (linhas de varredura e um pisca), diferente dos quadradinhos do Tauba; blips 8-bit
    no spawn e no golpe (sons gerados em código).
  - **Sem código novo no `sim`:** cabe no bloco área como está, com a hitbox deslocada à frente.
- **O bonequinho:** uma versão 8-bit do próprio Gabs, de camisa polo azul e crachá. Poucos quadros
  em pixel art (surgir, golpe, sumir), fora do esqueleto. Nada de personagem de jogo de verdade.
- **O controle:** genérico, sem forma, cor ou logo de nenhum console.
- **Provocação (provisória):** pega o controle, aperta os botões rapidinho e levanta os braços
  comemorando; o balão diz "GG!" até ele ter bordão.
- **Visual:** camisa polo azul-royal (`#2F5DA8`) de manga curta, calça jeans escura e sapatênis
  cinza-claro (`#B8BCC4`). Crachá da prefeitura pendurado no pescoço: cordão escuro e cartão branco
  com foto, sem texto nem brasão. Um fone gamer grande com detalhe roxo (`#9B5DE5`) apoiado no
  pescoço marca o lado gamer. Polo, crachá e fone fazem a silhueta dele. Corpo médio com barriga
  leve. Cores: azul-royal, roxo e cinza-claro (o azul e o roxo não repetem a cor de ninguém).
- **No jogo:** jogável. O controle aparece nas duas mãos (a mão de provocação dele é o controle com
  as duas mãos, de frente) e o bonequinho 8-bit surge no ponto da área, em pé no startup, dá um soco
  ou um chute (sorteado) no 1º frame ativo e some piscando no recovery; se o Gabs apanhar, some na
  hora. Ficha em `packages/sim/src/characters/gabs.ts`.
- **Ideias guardadas:** respawn com uma tela de "carregando..."; KO com um "GAME OVER" em pixel;
  bordão ligado a jogo ou à prefeitura.

#### Ficha de arte

```text
CHARACTER SHEET
Name: Gabs — 30-year-old city hall clerk and gamer, laid-back, lives for video games.
Fighting style: spacer — keeps a set distance and lets a tiny 8-bit fighter hit for him; medium-heavy, a bit slow on the ground.
Body: based on the photos; average height, slightly chubby build (neither slim nor fat), light belly.
Outfit: royal blue (#2F5DA8) short-sleeve polo shirt, untucked; city hall ID badge hanging on a thick dark lanyard (white card with a photo, no text or crest); big gamer headset with purple (#9B5DE5) details resting around his neck; dark blue jeans; light gray (#B8BCC4) casual sneakers.
Signature details: the polo, the ID badge on the lanyard, the gamer headset around the neck.
Colors: primary #2F5DA8, secondary #9B5DE5, accent #B8BCC4.
Face/personality: focused gamer look, relaxed half smile; hair and facial hair as in the photos.
Special move: "Controle na mão" — a generic game controller appears in his hands; in front of him, a tiny 8-bit pixel-art version of himself pops up and punches or kicks while he presses the buttons.
Taunt: mashes the controller buttons fast, then raises both arms celebrating.
Extra parts for the parts sheet: two hands holding a generic game controller, thumbs on the buttons.
Props and effects for the effects sheet: 1 generic game controller (no console shape or logo); 1 tiny 8-bit pixel-art Gabs (blue polo, white badge) facing right in 3 poses: standing, punching, kicking; 3 small smoke puffs; 4 horizontal scan-line strips; 1 small pixel hit spark.
Avoid: text, letters or crest on the badge; logos; any real console or real game character; headset over the ears.
```

Trechos prontos para os textos do Firefly (pasta `art/gabs/`):

- `<EXPRESSION>`: `focused gamer squint`
- `<CHARACTER>`:
  `Gabs, 30-year-old city hall clerk and gamer, average height, slightly chubby with a light belly. Royal blue (#2F5DA8) short-sleeve polo, untucked; ID badge on a thick dark lanyard (white card with photo, no text); big gamer headset with purple (#9B5DE5) details resting on his neck; dark blue jeans; light gray (#B8BCC4) casual sneakers.`
- `<LEGWEAR>`: `dark blue jeans`
- `<SHOE>`: `light gray casual sneaker`
- `<EXTRA>`: `two hands holding a generic game controller, thumbs on the buttons`
- `<ITEMS>`:
  `1 generic dark gray game controller with purple (#9B5DE5) buttons, no logo; 1 tiny chunky pixel-art 8-bit version of him (blue polo, white badge) facing right, side view, in 3 poses: standing, punching, kicking; 3 small smoke puffs; 4 thin horizontal scan-line strips; 1 small pixel hit spark`
- **Cabeças (passo 2):** acrescente `No headset or badge on the heads.` antes de `Bold`. O fone e o
  crachá ficam no tronco; se vierem na cabeça, sobem e descem junto com ela e aparecem em dobro.
- **Peças (passo 3):** o tronco tem que vir com o crachá e o fone no pescoço. Se faltarem, use a
  linha "Faltou uma peça" da [tabela de correções](ARTE.md#se-der-errado-no-firefly) pedindo
  `the ID badge on the lanyard and the headset around the neck, on the torso`.

### 9. Marília

- **Quem é:** 26 anos, baixinha (1,64 m, a mesma altura do Tauba), pele branca, cabelo castanho.
  Corpo de mulher comum, com proporções médias e naturais: o desenho não sexualiza a personagem.
  Rosto e jeito: seguir as fotos. É a Marília que o João Frango chama na provocação dele.
- **Bordão:** "Gentiii!", esticando o "i", no tom de quem não acredita no que está vendo.
- **Estilo de luta:** destemida. Leve e rápida no chão, pulo bom, golpes normais um pouco mais
  fracos que a média. O jogo dela é achar a hora de fumar e, com a aura ligada, ir para cima sem
  medo de apanhar. Contraste com o Crocko: o Crocko espera o golpe para devolver; a Marília
  aguenta o golpe e segue.
- **Especial — Tragadinha (buff):** ela tira um cigarrinho de palha (palheiro) do bolso de trás,
  põe na boca e dá uma tragada (a ponta acende em brasa). Ao soltar, a fumaça sai verde clarinha e
  envolve o corpo dela: vira uma aura. Com a aura, ela sente bem menos os golpes por um tempo.
  - **Tempo:** startup longo (~40 ticks: ~12 tirando o palheiro, ~18 na tragada, ~10 soltando a
    fumaça), vulnerável o tempo todo: é o preço do especial, e quem estiver perto pune. Se ela
    apanhar no startup, o palheiro cai e o especial é perdido (a recarga já contou). Recovery curto
    (~12 ticks, ela joga o palheiro fora).
  - **A aura:** liga no 1º frame ativo e dura 300 ticks (5 s). Ela leva golpes, projéteis e
    agarrões normalmente (knockback, hitstun, arremesso), mas soma só 60% do dano (no mínimo 1%).
    Ela anda, pula e ataca normalmente. Dá para matar e agarrar com a aura ligada; como o
    knockback usa o % acumulado, ela só demora mais para chegar no % de morrer. Até a 2ª rodada de
    balanceamento a aura era invencível (golpes passavam por ela); ficou ligada pouco tempo e era
    tudo ou nada.
  - **Recarga:** 450 ticks (7,5 s), contada do começo: entre uma aura e outra há pelo menos 150
    ticks (2,5 s) sem proteção, 40 deles parada fumando.
  - **No ar:** funciona, sem impulso; como o startup é longo e ela vai caindo, não serve de
    recuperação.
  - **Efeitos:** brasa laranja na ponta do palheiro durante a tragada; fumacinha cinza quando ela
    traga; ao soltar, uma baforada verde clarinha (`#B5F2C6`) que se espalha em volta do corpo e
    vira a aura: um contorno de luz verde clarinho colado na silhueta, com fiapos de fumaça verde
    subindo. Golpe que pega com a aura ligada faz, junto do impacto, uma estrelinha verde e um "plim"
    menores (o golpe pegou mais fraco). Nos últimos 30
    ticks a aura pisca, avisando que vai acabar.
  - **Como desenhar a aura:** no código, nunca com imagem. Ela é um brilho verde clarinho
    (`#B5F2C6`) atrás do boneco: um brilho macio e aditivo, do tamanho do corpo (mais alto que
    largo), pulsando, criado uma vez e só mostrado ou escondido. Antes era o efeito Glow do Phaser
    no container do rig, mas ele derrubava o desempenho em tela cheia (pós-processamento lendo o
    boneco centenas de vezes por pixel), e foi trocado. Uma bolha redonda leria como escudo e
    esconderia a personagem. Da folha de efeitos vêm só o palheiro, as fumacinhas cinzas, os fiapos verdes (sobem em
    volta dela) e a estrelinha do "plim"; a brasa é um pontinho laranja piscando, também no código.
  - **Código novo (feito):** o bloco buff ganhou a opção `damageTakenPercent` (ver "Aura" no
    `docs/GDD.md`), em vez de um bloco novo. A opção `invulnerable: true` (aura invencível) continua
    no bloco, mas ela não usa mais.
- **Provocação:** põe as duas mãos no rosto, arregala os olhos, balança a cabeça e grita "Gentiii!".
- **Visual:** roupa do dia a dia. Camiseta rosa-framboesa (`#E2557F`) lisa, de manga curta, um
  pouco folgada e para fora da calça; calça jeans clara (`#8DB0D8`) de cintura alta e perna reta,
  com cinto; tênis off-white de cano baixo com detalhes verde-menta (`#8FD9A8`). Cabelo castanho
  solto, na altura do ombro, nunca abaixo dele: o cabelo é parte da cabeça, e comprido ficaria
  duro e por cima do ombro e do braço nos golpes. Cores: rosa-framboesa, jeans claro e
  verde-menta. O menta do tênis puxa o verde da aura, e o rosa não repete o rosa-glacê do Darllan
  (é mais forte e frio).
- **No jogo:** jogável. Ela tira o palheiro do bolso de trás, leva à boca e traga (a brasa acende),
  solta a baforada verde no 1º frame ativo e fica zen, com o brilho verde colado no corpo e fiapos de
  fumaça subindo; no recovery joga o palheiro fora com um peteleco. Golpe que pega com a aura faz a
  estrelinha e o "plim" junto do impacto. Na provocação, as mãos vão nas bochechas e ela balança a cabeça gritando.
  Ficha em `packages/sim/src/characters/marilia.ts`.
- **Ideias guardadas:** se o João Frango provocar com ela na luta ("Ô Mariiiliaaa!"), ela responde
  "Gentiii!"; respawn soltando uma baforada; "Gentiii!" ao levar KO.

#### Ficha de arte

```text
CHARACTER SHEET
Name: Marília — 26-year-old woman, cheerful and dramatic, every now and then pulls out a hand-rolled straw cigarette and gets completely zen.
Fighting style: fearless — light and quick, small relaxed stance, walks into hits when her aura is on.
Body: based on the photos; petite and short (one of the shortest in the cast); average natural female build with medium proportions, drawn modestly, not sexualized.
Outfit: raspberry pink (#E2557F) plain short-sleeve T-shirt, slightly loose, untucked; light-wash (#8DB0D8) high-waist straight jeans with a belt; low off-white (#F6F0E4) sneakers with mint (#8FD9A8) details.
Signature details: loose shoulder-length brown hair (not below the shoulders), the pink T-shirt, a hand-rolled straw cigarette.
Colors: primary #E2557F, secondary #8DB0D8, accent #8FD9A8.
Face/personality: expressive, big wide eyes, dramatic "can you believe this?" look.
Special move: "Tragadinha" — she pulls a hand-rolled straw cigarette from her back pocket, takes a drag, and exhales a light green smoke that wraps around her body as a glowing aura; while it lasts, she shrugs hits off.
Taunt: puts both hands on her cheeks, eyes wide, shakes her head and shouts her catchphrase.
Extra parts for the parts sheet: one hand holding a thin hand-rolled cigarette between two fingers.
Props and effects for the effects sheet: the hand-rolled straw cigarette (side view, pointing right, no hands); 1 small orange ember glow; 3 small gray smoke puffs; 4 light green smoke wisps; 1 small light green sparkle.
Avoid: text or logos on the clothes; revealing or tight clothes; exaggerated curves; hair below the shoulders.
```

Trechos prontos para os textos do Firefly (pasta `art/marilia/`):

- **É uma amiga:** no passo 1, troque `Keep his real face shape` por `Keep her real face shape`; no
  passo 5, troque `his outfit` por `her outfit`.
- `<EXPRESSION>`: `half-closed eyes, gentle smile`
- `<CHARACTER>`:
  `Marília, 26-year-old woman, petite and short, average natural build, modest, fair skin, shoulder-length loose brown hair, expressive wide eyes. Raspberry pink (#E2557F) short-sleeve T-shirt, slightly loose, untucked; light-wash (#8DB0D8) high-waist straight jeans with a belt; off-white sneakers with mint (#8FD9A8) details.`
- `<LEGWEAR>`: `light-wash jeans`
- `<SHOE>`: `off-white sneaker with mint details`
- `<EXTRA>`: `one hand holding a thin hand-rolled cigarette between two fingers`
- `<ITEMS>`:
  `1 thin hand-rolled straw cigarette with a pale corn-husk wrap, side view pointing right, no hands; 1 small orange ember glow; 3 small gray smoke puffs; 4 light green smoke wisps; 1 small light green sparkle`

  A aura não entra na folha: é feita no código (ver "Como desenhar a aura"). Se a folha já veio com
  uma silhueta verde, não precisa refazer; o recorte ignora essa peça.

- **Cabeças (passo 2):** acrescente
  `Same shoulder-length loose hair on every head, not below the shoulders.` antes de `Bold`. O
  cabelo vai na cabeça e o jogo troca a cabeça inteira; se o comprimento mudar de uma cabeça para
  outra, o cabelo "pula" quando ela apanha ou provoca.
- **Peças (passo 3):** se o tronco vier com a camiseta justa ou com decote, anexe a folha de peças
  e mande
  `Edit the attached image: make the torso a slightly loose plain T-shirt with a round crew neck, modest. Keep everything else the same.`

### 10. Meia

- **Quem é:** 30 anos, estatura média (1,70 m, a mesma altura do Gabs), magro. Óculos grandes de
  armação preta e quadrada. Cabelo, pele e barba: seguir as fotos. Joga jogo de luta
  profissionalmente (o anime fighter de duplas BlazBlue Cross Tag Battle): o especial é a piada com
  isso, um "comando" de jogo de luta difícil que o jogador faz com um botão só.
- **Bordão:** a definir. Enquanto não tiver, o balão da provocação diz "Vem!".
- **Estilo de luta:** técnico. Leve e rápido no chão e no ar, golpes base rápidos (startup um
  pouco menor) e um pouco mais fracos que a média. O jogo dele é chegar colado e pegar: o especial
  tem alcance curto, então ele precisa entrar na cara do adversário. Contraste com o Dadazinho: a
  doze pune quem chega perto; o Meia é quem tem que chegar perto.
- **Especial — Comando (agarrão):** acima da cabeça dele aparece a sequência ↓ ← B ↘ → ↑ X, como a
  notação de um golpe de jogo de luta, sem logo de nenhum jogo. Se pegar, ele **não** faz pose de
  agarrar: o adversário fica preso na frente dele enquanto ele solta um combo rápido de socos e
  chutes, um contador de "HITS" sobe a cada golpe, e o último chute arremessa. O jogador só aperta o
  botão do especial, como todo mundo.
  - **O comando:** desenhado no código (setas e botões redondos com as letras B e X, sem cor de
    controle de nenhum console). No startup os símbolos acendem um a um, 1 por tick, como se ele
    digitasse o comando rapidinho; o X acende no 1º frame ativo. A sequência vira junto com ele:
    virado para a esquerda, as setas espelham (↓ → B ↙ ← ↑ X), como nos jogos de luta.
  - **Tempo:** startup curto (6 ticks, 1 por símbolo), active curto (4 ticks, a janela do agarrão).
    Recovery longo se errar (~32 ticks): é o "fica exposto".
  - **Alcance:** curto, uns 36 px à frente do corpo, da cintura ao ombro. Precisa estar colado.
  - **Se pegar:** o adversário fica preso 30 ticks (meio segundo: com 3 ou 4 jogadores, menos tempo
    exposto). A cada 6 ticks sai um golpe do combo (4 golpes) que dá 2% de dano sem knockback; o contador mostra "2 HITS", "3 HITS"... e o último
    chute é o arremesso (dano ~7, knockback médio-alto, ângulo ~40°, para o lado em que ele está
    virado). Fecha em "5 HITS" e 15% no total. Como em todo agarrão, ←/→ durante o combo escolhe
    para que lado arremessa.
  - **Se errar:** o comando fica vermelho, com um "X" grande por cima, e treme; ele fica parado no
    recovery longo, de guarda aberta.
  - **Riscos:** se alguém (o companheiro do agarrado, no 2v2) bater nele no meio do combo, ele solta
    o adversário e o contador some. Na Marília com a aura ele pega normalmente, mas os golpes
    somam menos dano. Ganha do contra-ataque do Crocko, como todo agarrão.
  - **Recarga:** ~90 ticks (1,5 s), contada do começo.
  - **No ar:** funciona, sem impulso. Se pegar no ar, os dois ficam parados no ar até o arremesso.
  - **Efeitos:** setas acendendo no startup; a cada golpe do combo, uma faísca de impacto, linhas de
    velocidade e um "pá" curto, com um tremor leve (sem congelar, para o combo correr); o contador
    "N HITS" em amarelo, inclinado, crescendo um pouco a cada golpe, ao lado dele; no arremesso, uma
    explosão de impacto maior e um "póu" forte. No erro, um "buzz" grave, de comando errado.
  - **A animação:** 1 clipe de combo com 4 poses de soco e chute (jab, chute baixo, gancho e chute
    alto, de 6 desenhadas: o direto e o chute giratório ficam guardados) e 1 pose final de chute forte (o arremesso),
    todas com os punhos fechados, nunca agarrando. O combo anda pelos golpes do agarrão, não pelo
    frame do golpe (que fica parado enquanto segura). O adversário usa a pose de agarrado que já
    existe, com um tranco a cada golpe: nenhuma animação nova para ele.
  - **Precisa de código novo (pequeno):** o bloco agarrão de hoje só dá dano no arremesso. Falta
    uma opção de golpes durante o agarrão no mesmo bloco (ex.: `combo: { hits: 4, damage: 2 }`),
    que espalha os golpes pelo `holdTicks` e solta um evento de acerto a cada um (para a faísca, o
    som e o contador), em vez de um bloco novo. O contador e o comando são só do `game`: o `sim` já
    diz se o agarrão pegou (`moveHits` e `grabTicks` de quem segura).
- **Provocação (provisória):** empurra os óculos para cima com o indicador, olha para o adversário
  e chama com a mão, palma para cima (o "vem" clássico de jogo de luta). O balão diz "Vem!" até ele
  ter bordão.
- **Visual:** roupa comum do dia a dia. Camiseta branca (`#F4F4F0`) de manga curta, gola redonda,
  para fora da calça, com uma estampa grande no meio do peito: um emblema abstrato, simétrico, em
  ciano-elétrico (`#22C1EE`) com contorno preto, que lembra marca de roupa ou estampa de camiseta,
  sem letras e sem ser marca de verdade (simétrico para não sair errado quando o jogo espelha o
  personagem). Calça jeans média (`#3E5F8A`) de perna reta; tênis preto (`#1C1C1F`). Óculos
  grandes de armação preta e quadrada. Corpo magro, de estatura média. Cores: branco,
  ciano-elétrico e jeans (o ciano é mais azul e mais vivo que o turquesa do Crocko, e o branco da
  camiseta lê bem nos menus escuros).
- **No jogo:** jogável. O comando acende em cima da cabeça enquanto ele entra colado; se pega, o
  adversário fica preso levando 4 golpes (faísca, "pá" e o contador "N HITS" atrás dele) e o chute
  final arremessa com uma explosão e o "póu", fechando em "5 HITS" e 15%. Se erra, o comando fica
  vermelho com o X, toca o "buzz" e ele fica de guarda aberta. Na provocação ajeita os óculos com o
  indicador e chama com a mão de trás; o balão "Vem!" sai no `voiceAt`. Ficha em
  `packages/sim/src/characters/meia.ts`.
- **Ideias guardadas:** respawn estalando os dedos e o pescoço, como antes de uma partida; "GG"
  ao levar KO; um "PERFECT" no fim do combo se ele não tomou dano na luta; um fliperama de luta no
  fundo de um mapa.

#### Ficha de arte

```text
CHARACTER SHEET
Name: Meia — 30-year-old pro fighting-game player, calm and technical, always reading the opponent.
Fighting style: technical grappler — light and quick, compact low stance, fists up, ready to dash in close.
Body: based on the photos; average height, slim build.
Outfit: white (#F4F4F0) short-sleeve crew-neck T-shirt, untucked, with one big symmetrical abstract emblem in the middle of the chest (electric cyan #22C1EE with a black outline, like a streetwear print, no letters, not a real brand); medium-blue (#3E5F8A) straight jeans; black (#1C1C1F) sneakers.
Signature details: big square black glasses, the white T-shirt with the big cyan emblem.
Colors: primary #F4F4F0, secondary #22C1EE, accent #3E5F8A.
Face/personality: focused competitive look behind the glasses, slight confident smirk.
Special move: "Comando" — a fighting-game input command appears above his head; if he catches the opponent up close, he unleashes a fast combo of punches and kicks while a hit counter goes up, and the last kick launches them.
Taunt: pushes his glasses up with the index finger, then beckons the opponent with a palm-up hand.
Extra parts for the parts sheet: one hand with the index finger raised (pushing up the glasses); one palm-up beckoning hand.
Props and effects for the effects sheet: 4 small white-yellow hit sparks in different shapes; 3 short white speed-streak arcs for punches and kicks; 1 big impact burst for the final kick; 3 small gray smoke puffs.
Avoid: letters, words or real brand logos on the T-shirt; game logos or emblems; grabbing or holding poses in the combo.
```

Trechos prontos para os textos do Firefly (pasta `art/meia/`):

- `<EXPRESSION>`: `focused competitive look, slight confident smirk`
- `<CHARACTER>`:
  `Meia, 30-year-old pro fighting-game player, average height, slim build, big square black glasses, focused look. White (#F4F4F0) short-sleeve crew-neck T-shirt with one big symmetrical abstract cyan (#22C1EE) emblem on the chest, black outline, no letters; medium-blue (#3E5F8A) straight jeans; black sneakers.`
- `<LEGWEAR>`: `medium-blue jeans`
- `<SHOE>`: `black sneaker`
- `<EXTRA>`: `one hand with the index finger raised, one palm-up beckoning hand`
- `<ITEMS>`:
  `4 small white-yellow hit sparks in different shapes; 3 short white speed-streak arcs; 1 big white-yellow impact burst; 3 small gray smoke puffs`

  O comando (↓ ← B ↘ → ↑ X), o "X" vermelho e o contador "N HITS" não entram na folha: são
  desenhados no código, porque a sequência vira com ele e o contador muda de número.

- **Estampa (passo 1):** o texto do conceito pede `No text or logos on the clothes`; a estampa
  entra mesmo assim, porque o `<CHARACTER>` diz que é um emblema sem letras. Se vier sem estampa,
  com letras ou com cara de marca de verdade, anexe o conceito e mande
  `Edit the attached image: put one big symmetrical abstract cyan (#22C1EE) emblem with a black outline in the middle of the T-shirt, no letters. Keep everything else the same.`
- **Peças (passo 3):** o tronco tem que vir com a estampa inteira, no meio do peito. Se ela vier
  cortada ou faltando, use a mesma correção acima com a folha de peças.

### 11. Igão

- **Quem é:** 35 anos, jogador de vôlei. Alto (1,90 m, a mesma altura do Schummaki), mais que o
  Crocko e o Darllan (1,80 m). Pele branca, cabelo castanho e curto. Rosto e barba: seguir as fotos.
- **Bordão:** "Cê tá miolo né nê?", no tom de quem zoa o adversário que acabou de errar.
- **Estilo de luta:** aéreo. Peso médio, um pouco abaixo da média no chão, e o **pulo mais alto do
  elenco** (do chão e no ar), por causa do vôlei. Os aéreos têm um pouco mais de alcance (braço
  comprido) e o aéreo para baixo é uma cortada, mais forte que a média. O preço de ser alto: o
  corpo comprido é fácil de acertar. O jogo dele é soltar o saque para obrigar o
  adversário a pular e pegá-lo no ar, onde ele é melhor. Contraste com o João Frango: os dois são
  bons no ar, mas o João é leve, flutua e controla de longe com 2 pulos aéreos; o Igão sobe mais
  alto num pulo só e briga lá em cima. Contraste com o Crocko: os dois são altos, mas o Crocko
  fica no chão esperando; o Igão vive no ar.
- **Especial — Saque (projétil):** ele joga a bola de vôlei para cima com uma mão, sem saltar, e
  bate nela de cima para baixo com a mão aberta. A bola sai em diagonal, para baixo e para a
  frente, bate no chão e quica 4 vezes, cada quique mais baixo, até acertar alguém ou acabar o
  tempo.
  - **Tempo:** startup médio (~18 ticks: a bola subindo e o braço armando são o aviso), active de
    1 tick (a batida), recovery médio (~18 ticks, o braço descendo).
  - **A bola:** nasce na mão esticada lá em cima, um pouco à frente da cabeça (32 px à frente e
    54 px acima do centro do corpo: o braço dele não alcança mais alto que isso), e sai a 9,5
    px/tick num ângulo de 40° para baixo, com gravidade 0,45. Caixa redonda de 28 × 28 px.
  - **Os quiques:** 4, guardando 78% da velocidade vertical a cada quique (a horizontal não muda).
    Com esses números, o 1º quique sobe uns 78 px (ainda pega quem está em pé, até os baixinhos de
    90 px), o 2º uns 45 px, o 3º uns 25 px e o 4º uns 14 px, rente ao chão. Vida de 110 ticks
    (1,8 s): ela anda uns 800 px no total, quase o palco inteiro. Quem pular por cima escapa; o 1º
    quique é o mais difícil de pular.
  - **Onde quica e onde some:** quica no topo do chão e no topo das plataformas atravessáveis
    (vindo de cima, como um lutador pousando). Na lateral ou embaixo de um bloco sólido (parede),
    some, como todo projétil hoje. Depois do último quique, o próximo toque no chão faz ela sumir;
    numa plataforma atravessável sem quiques sobrando, ela passa direto, como hoje. Saiu do palco,
    cai até a blast zone ou até o tempo acabar.
  - **Golpe:** dano ~11, knockback médio (ângulo ~50°, para o lado em que a bola anda). O mesmo em
    qualquer quique. Some ao acertar alguém.
  - **Recarga:** ~90 ticks (1,5 s), contada do começo: a 2ª bola só sai quando a 1ª já quicou 3
    vezes, no fim do caminho.
  - **No ar:** funciona igual (vira um saque viagem), sem impulso: não ajuda a voltar ao palco. A
    bola sai de mais alto, então o 1º quique fica mais longe.
  - **Interações:** a correção do Crocko devolve a bola para quem sacou, que faz o caminho de
    volta inteiro (a vida e os quiques recomeçam, o dano continua 11%); na Marília com a aura a bola acerta, mas dá menos dano.
  - **Efeitos:** a bola gira no ar no sentido em que anda (rotação no código, não precisa de
    quadros); na batida, um estouro de impacto na mão e um "pá!" de tapa forte; atrás da bola, um
    rastro curto até o 1º quique; a cada quique, uma poeirinha no chão e um "tum" que vai ficando
    mais baixo; ao acertar alguém, a faísca de impacto normal.
  - **A animação:** 1 clipe de especial: a mão de trás joga a bola para cima, o braço da frente
    arma lá no alto, atrás da cabeça, bate lá em cima com a mão aberta e desce na frente do corpo
    no recovery. A bola do startup é desenhada solta pelo jogo, da mão de trás até o ponto da
    batida, onde vira o projétil. Sem pulo: os pés não saem do chão. O adversário usa o hitstun
    normal: nenhuma animação nova para ele.
  - **Código novo (feito):** o projétil sumia ao bater num bloco sólido. Ganhou uma opção de
    quique no mesmo bloco projétil, em vez de um bloco novo: `bounces` (quantos quiques, padrão
    0 = como antes) e `bounceKeep` (quanto da velocidade vertical sobra a cada quique, em %,
    padrão 65; o Igão usa 72). No `stepProjectiles`, quando a bola está caindo e a base dela cruzou o topo
    de um chão ou plataforma neste tick, com quiques sobrando: ela fica em cima da superfície,
    `vy = -idiv(vy * bounceKeep, 100)` e gasta 1 quique. Fora isso, igual a hoje (parede some,
    plataforma sem quique passa). O projétil em voo guarda os quiques que sobram (entra no
    snapshot e no hash). É conta com inteiros: replay e online continuam iguais. Um evento de
    quique (com a posição) deixa o jogo tocar o "tum" e a poeirinha.
- **Provocação:** quica a bola no chão duas vezes com uma mão, como quem se prepara para sacar,
  segura a bola, aponta para o adversário e solta "Cê tá miolo né nê?". A bola é a mesma peça do
  especial.
- **Visual:** uniforme de jogador de vôlei. Camisa roxo-violeta (`#6A3FB8`) de manga curta, justa,
  para fora do short, com a gola e uma faixa em cada lateral em verde-limão (`#C4E53A`), **sem
  número e sem nome** (número vira espelhado quando o jogo vira o personagem); short de vôlei curto
  roxo-escuro (`#2E1F57`), acima do joelho, com um filete verde-limão na lateral; joelheiras pretas
  (`#1C1C1F`) nos dois joelhos; meias brancas curtas e tênis de vôlei branco (`#F4F5F7`) com
  detalhe verde-limão. Corpo alto, magro e atlético, braços e pernas compridos. A bola: branca, com
  os gomos curvos de bola de vôlei em roxo e verde-limão, sem logo nem marca. Cores: roxo-violeta,
  verde-limão e roxo-escuro (ninguém tem roxo como cor principal: o roxo do Gabs é só o detalhe do
  fone, e o violeta do Igão é mais escuro e mais fechado; o verde-limão é bem mais amarelado e vivo
  que o verde do Dadazinho e a menta da Marília).
- **No jogo:** jogável. No Saque a bola sai da mão de trás, sobe girando, ele bate lá em cima
  com um estouro e o "pá!", e ela desce em diagonal com um rastro curto, quica 4 vezes com uma
  poeirinha e um "tum" cada vez mais baixo, girando no sentido em que anda. Na provocação quica a
  bola no chão duas vezes, segura na cintura, aponta com a outra mão e o balão "Cê tá miolo né
  nê?" sai no `voiceAt`. Ficha em `packages/sim/src/characters/igao.ts`.
- **Ideias guardadas:** respawn caindo com a bola debaixo do braço; apito de juiz no KO dele; um
  "bloqueio" de braços erguidos como provocação alternativa; uma rede de vôlei de praia no fundo de
  um mapa.

#### Ficha de arte

```text
CHARACTER SHEET
Name: Igão — 35-year-old volleyball player, the tallest of the group, cocky and playful, loves to tease whoever just missed.
Fighting style: aerial fighter — medium weight, the highest jumper of the cast, long reach in the air, spikes opponents down.
Body: based on the photos; very tall, lean and athletic build, long arms and legs.
Outfit: violet purple (#6A3FB8) short-sleeve fitted volleyball jersey, untucked, with a lime green (#C4E53A) crew collar and one lime green stripe down each side, no number and no name; short dark purple (#2E1F57) volleyball shorts above the knee with a thin lime green side stripe; black (#1C1C1F) knee pads on both knees; short white socks; white (#F4F5F7) volleyball shoes with lime green details.
Signature details: the violet jersey with lime green collar and side stripes, the black knee pads, short brown hair.
Colors: primary #6A3FB8, secondary #C4E53A, accent #2E1F57.
Face/personality: cocky teasing grin, one eyebrow slightly raised.
Special move: "Saque" — standing on the ground, without jumping, he tosses a volleyball up with one hand and spikes it with the other open hand, sending it diagonally down and forward; it bounces four times along the ground, each bounce lower.
Taunt: bounces the volleyball on the ground twice with one hand, like before a serve, catches it, then points at the opponent and teases them.
Extra parts for the parts sheet: one hand pointing with the index finger.
Props and effects for the effects sheet: 1 volleyball (white with curved violet and lime green panels, no logo); 1 white-yellow impact burst for the hand hitting the ball; 3 short white speed streaks; 3 small light-brown dust puffs for the bounces.
Avoid: numbers, letters or names on the jersey; real brand logos on the clothes or on the ball; national team kits; jumping poses in the serve.
```

Trechos prontos para os textos do Firefly (pasta `art/igao/`):

- `<EXPRESSION>`: `cocky teasing grin, one eyebrow slightly raised`
- `<CHARACTER>`:
  `Igão, 35-year-old volleyball player, very tall, lean and athletic, long arms and legs, fair skin, short brown hair. Violet purple (#6A3FB8) short-sleeve fitted volleyball jersey, untucked, lime green (#C4E53A) collar and side stripes, no number; short dark purple (#2E1F57) volleyball shorts; black knee pads; short white socks; white volleyball shoes with lime green details.`
- `<LEGWEAR>`: `short dark purple volleyball shorts` (short: no passo 3 use as versões de short de `<HIPS>` e
  `<LEGS>` e apague `<PANTS>`)
- `<SHOE>`: `white volleyball shoe with a short white sock`
- `<EXTRA>`: `one hand pointing with the index finger`
- `<ITEMS>`:
  `1 volleyball, white with curved violet (#6A3FB8) and lime green (#C4E53A) panels, no logo; 1 big white-yellow impact burst; 3 short white speed streaks; 3 small light-brown dust puffs`
- **Joelheiras (passo 3):** a joelheira fica na canela, no topo dela, cobrindo o joelho: no
  `<LEGS>` de short, troque `shin` por `shin with a black knee pad at the top, covering the knee`.
  Se ela vier na coxa ou nas duas peças, a dobra do joelho mostra a joelheira em dobro; anexe a
  folha de peças e mande
  `Edit the attached parts sheet: draw the black knee pad only at the top of the shin, not on the thigh. Keep every other part exactly the same.`
- **Camisa (passo 1):** se vier com número ou nome nas costas ou no peito, anexe o conceito e mande
  `Edit the attached image: remove any number, letter or name from the jersey. Keep everything else the same.`

### 12. Thom4o

- **Quem é:** desenvolvedor de software. Alto (1,80 m, a mesma altura do Crocko e do Darllan),
  magro, sem óculos, com um relógio preto no pulso. Idade a confirmar. Cabelo, pele e barba: seguir
  as fotos.
- **Bordão:** "É o Turbas!"
- **Estilo de luta:** bate e corre. Leve e rápido no chão e no ar, pulo bom, golpes base normais.
  O preço: é alto e leve, então é fácil de acertar e voa longe. O jogo dele tem dois tempos: entrar
  colado para plantar a bomba e, plantada, fugir (ou manter o adversário longe) até ela estourar.
  Contraste com o Meia: os dois precisam chegar colados, mas o Meia pega e resolve na hora (15%); o
  Thom4o planta e a briga dos 5 segundos seguintes decide quem leva.
- **Especial — Tá plantada! (agarrão + bomba):** de perto, ele tira uma C4 de trás das costas e
  cola no peito do adversário. A bomba tem um relógio, que todo mundo vê. Quem está com ela passa
  para outro lutador acertando um golpe nele: é uma batata quente. Quando o relógio zera, ela
  estoura em quem estiver com ela e machuca quem estiver em volta.
  - **Colar:** é um agarrão curto. Alcance de uns 40 px à frente do corpo, da cintura ao ombro
    (o do Meia tem 36): precisa estar colado. Startup 7, active 5; se errar, recovery de 28 com a
    bomba na mão e a guarda aberta. Se pegar, ele segura o adversário 14 ticks (o tempo de colar, com
    o "bip-bip" de armada) e solta com um empurrão fraco: 3% de dano, sem força para matar, que
    afasta os dois uns 60 a 160 px conforme o %. Como todo agarrão, ganha do contra-ataque do Crocko
    e pega a Marília com a aura.
  - **O relógio:** 300 ticks (5 s), contados a partir do empurrão. Aparece grande em cima da cabeça
    de quem está com a bomba, com um bipe que vai acelerando.
  - **Passar:** quem está com a bomba passa para qualquer lutador em quem acertar um **golpe de
    corpo**: golpes base, investida, área, agarrão ou o golpe devolvido do contra-ataque. **Projétil
    não passa** (frango, doze, scout, bola, microfone): a bomba está colada no corpo, tem que
    encostar. O golpe dá o dano e o arremesso normais, e a bomba vai junto. Golpe de quem **não**
    está com a bomba não muda nada: o Thom4o pode bater no portador à vontade.
  - **Pode voltar para o Thom4o? Sim.** Sem isso, no 1 contra 1 o adversário não teria o que fazer
    além de esperar a explosão. Com isso, plantar é um risco calculado, e é daí que vem a graça.
    Duas regras deixam a volta justa:
    - **Trava de devolução (60 ticks, 1 s):** quem acabou de passar a bomba (ou de plantar) não
      recebe essa bomba de volta por 60 ticks. O golpe acerta normalmente, mas a bomba fica onde
      está. Quem acabou de levar a bomba do Thom4o não devolve na hora com um tapa: o Thom4o sai do
      empurrão com 1 s de vantagem (até uns 400 px correndo). Vale igual para todos: se o adversário
      passar para o Thom4o, também fica 1 s protegido. Com 3 ou 4 jogadores, a trava vale só para
      quem passou; os outros podem receber.
    - **Piso do relógio (120 ticks, 2 s):** se a bomba passar com menos de 120 ticks no relógio, o
      relógio volta para 120. Ninguém recebe uma bomba a 1 tick de estourar: sobra pelo menos 1 s
      depois da trava para tentar devolver. O relógio nunca volta para 300.
  - **Conta no 1 contra 1:** plantou no tick 0; até o 60 o adversário não consegue devolver; do 60
    ao 300 ele tem 4 s para acertar o Thom4o. O Thom4o anda a 7,0 px/tick (a média é 6,5), então
    fugir funciona, mas o palco tem 900 px: não dá para só correr. Bater no portador também defende
    (em hitstun ele não passa nada).
  - **Explosão em quem está com a bomba:** 18% de dano e arremesso forte para cima (ângulo 90°,
    força 11, escala 0,18). Pela conta do GDD, mata por cima a partir de uns 140% num peso médio; em
    % baixo levanta o alvo e abre um combo aéreo. Não dá para esquivar: está colada. Nem a esquiva
    aérea nem o contra-ataque salvam o portador; a aura da Marília reduz o dano, como sempre.
  - **Explosão em volta:** 10% de dano e arremesso médio para longe do portador (ângulo 45°, força
    8, escala 0,13; não mata antes de uns 230%). A área é uma caixa de **220 × 180 px** centrada no
    corpo do portador: 110 px para cada lado (a largura do Rolo do Darllan) e 90 px para cima e para
    baixo. Pega quem estiver a menos de uns dois corpos de distância. Quem está em volta pode
    esquivar (a invencibilidade da esquiva aérea e do respawn vale).
  - **Por que danos diferentes:** quem ficou com a bomba teve 5 s para passar e não passou, então
    leva o golpe cheio (18%, o mesmo dano da Scout do Tchula). Quem só estava perto leva pouco mais
    da metade (10%, como a onda do ground pound): dói o bastante para ninguém ficar colado no
    portador, sem punir demais quem não tinha nada com isso.
  - **Quem a área acerta:** todo mundo em volta, **inclusive o próprio Thom4o**. Ele pode bater no
    portador durante a contagem, mas tem que sair de perto no fim. Com times e fogo amigo desligado,
    a área poupa só os companheiros do Thom4o; quem está com a bomba leva sempre, de qualquer time.
  - **Se quem está com a bomba perder a vida:** a bomba some com ele, sem explodir.
  - **Recarga:** só existe 1 bomba dele por vez; com a bomba em jogo, o botão do especial não faz
    nada. Quando ela estoura ou some, a recarga é de 600 ticks (10 s). Errando o agarrão, 120 ticks
    (2 s) contados do começo. Dá no máximo 1 bomba a cada 15 s; errar custa pouco.
  - **No ar:** funciona, sem impulso. Se pegar no ar, os dois ficam parados no ar até o empurrão.
  - **Interações:** o Meia passa a bomba no 1º golpe do Comando e fica 30 ticks segurando alguém
    com uma bomba (risco dele). O Crocko com a bomba passa quando o contra-ataque pega. A Arrancada
    do Schummaki, o Rolo do Darllan e o bonequinho do Gabs passam de mais longe. Quem depende de
    projétil (João Frango, Dadazinho, Tchula, Igão) tem que passar no braço. Um lutador só carrega 1
    bomba: com dois Thom4os, o agarrão do segundo pega mas não cola.
  - **Efeitos:** a C4 aparece na mão com uma fumacinha; colada, fica presa no peito de quem está
    com ela, com a luz vermelha piscando no ritmo do bipe. A cada bipe, o corpo todo de quem está com ela
    acende num brilho vermelho que some aos poucos (como a aura da Marília): dá para ver de longe
    quem está com a bomba. O relógio (segundos com 1 casa) é
    desenhado no código, em cima da cabeça, e fica vermelho no último segundo. Quem está travado
    mostra um cadeado pequeno em cima da cabeça. No último segundo, um anel fino no chão mostra o
    tamanho da área, para quem está perto saber de onde sair. Na passagem, um "tlec" e a bomba pula
    de um corpo para o outro. Na explosão: clarão laranja, anel de onda de choque, fumaça escura,
    tremor de câmera e um "bum" grave (sons gerados em código).
  - **A animação:** 1 clipe de especial: a mão de trás traz a bomba de trás das costas, o braço da
    frente estica e bate a bomba no peito do adversário, e ele recua com um passo. Se errar, fica
    com a bomba na mão olhando para ela. O adversário usa a pose de agarrado que já existe. A bomba
    no peito é uma peça solta presa ao tronco do esqueleto (o esqueleto é o mesmo para todos).
  - **Precisa de código novo (médio):** o bloco agarrão ganha uma opção `bomb` (relógio, trava,
    piso, o golpe do portador e a caixa e o golpe da área), em vez de um bloco novo. O estado da
    luta ganha a lista de bombas em jogo (dono, quem está com ela, ticks que faltam, quem passou por
    último e a trava), que entra no snapshot e no hash. No combate, golpe de corpo do portador que
    acerta alguém sem trava e sem bomba troca o portador. Eventos novos para o jogo desenhar e tocar:
    plantou, passou, explodiu. Tudo com inteiros, sem RNG: replay e online continuam iguais.
  - **Se precisar ajustar:** relógio (300), trava (60), piso (120), área (220 × 180), danos
    (18 / 10) e alcance do agarrão (40 px). Se quem depende de projétil sofrer demais para passar,
    liberar o passe por projétil só a curta distância.
- **Números da ficha (proposta):**

  | Campo        | Valor      | Comparação                                        |
  | ------------ | ---------- | ------------------------------------------------- |
  | `weight`     | 92         | Leve (Meia 88, Tauba 92; médio 100)               |
  | `walkSpeed`  | 7,0        | Rápido (Schummaki 7,4, Meia 7,3; médio 6,5)       |
  | `airSpeed`   | 6,0        | Bom no ar (Dadazinho e Tauba 6,0; médio 5,5)      |
  | `jumpHeight` | 182        | Pulo bom (Marília 185; médio 175)                 |
  | `dashSpeed`  | 14         | Como o Dadazinho                                  |
  | `hurtbox`    | 46 × 104   | 1,80 m (como Crocko e Darllan), magro             |
  | Queda        | rápida     | `fastFallSpeed` 19, como a maioria                |
  | Golpes base  | padrão     | Sem ajustes                                       |
  | Especial     | 7 / 5 / 28 | Agarrão de 40 px, segura 14 ticks, empurrão de 3% |
  | Recarga      | 120 / 600  | Errou (do começo) / depois que a bomba estoura    |

- **A bomba:** pacote de explosivo com um teclado pequeno, um visor e fios coloridos, como a C4 do
  CS. A arte é genérica, inspirada nela: nada de nomes, emblemas ou logos do CS, e o visor vem sem
  números (o relógio é desenhado no código, porque muda a cada tick e o jogo espelha o personagem).
- **Provocação:** levanta o pulso, confere o relógio como quem conta o tempo da bomba, aponta para
  o adversário e grita "É o Turbas!".
- **Visual:** roupa comum do dia a dia. Camiseta amarelo-alerta (`#F7C81E`) lisa, de manga curta,
  gola redonda, para fora da calça; calça preta (`#1F2023`) de perna reta; tênis preto com duas
  listras brancas na lateral e sola branca (listras genéricas, sem imitar marca de verdade);
  relógio preto no pulso. Sem óculos. Corpo alto e magro, braços e pernas compridos. Cores:
  amarelo-alerta, preto e vermelho-LED (`#E5352B`, a luz da bomba e o relógio). Amarelo com preto é
  a faixa de perigo, e ninguém tem amarelo como cor principal: o do Tchula é só a faixa do macacão
  e o do João Frango é o boné. A camiseta clara também segura a leitura nos menus escuros, já que a
  calça e o tênis são pretos.
- **No jogo:** jogável (`packages/sim/src/characters/thom4o.ts`, bomba em
  `packages/sim/src/bomb.ts`). A arte (`art/thom4o/`) veio com óculos de aro fino prateado e a C4
  dos efeitos; a bomba redonda que veio na mão, na folha de peças, ficou sem uso. O relógio é uma
  peça solta presa só no pulso da frente.
- **Ideias guardadas:** "Tá plantada!" como fala ao colar a bomba; respawn conferindo o relógio;
  KO dele com um "bip" comprido; se a própria bomba estourar nele, o balão mostra "É o Turbas...".

#### Ficha de arte

```text
CHARACTER SHEET
Name: Thom4o — software developer, tall and slim, always checking his black wristwatch; sticks a time bomb on his opponents and runs.
Fighting style: hit-and-run bomber — light and fast, low ready-to-sprint stance, one hand behind his back hiding the bomb.
Body: based on the photos; tall, slim build, long arms and legs.
Outfit: plain hazard yellow (#F7C81E) short-sleeve crew-neck T-shirt, untucked; black (#1F2023) straight pants; black sneakers with two plain white side stripes and white soles; black wristwatch.
Signature details: no glasses, the yellow T-shirt, the black wristwatch; hair and facial hair as in the photos.
Colors: primary #F7C81E, secondary #1F2023, accent #E5352B.
Face/personality: mischievous grin, like someone who knows the clock is ticking.
Special move: "Tá plantada!" — up close, he slaps a time bomb with a blinking red light onto the opponent's chest and runs; the bomb jumps to whoever the carrier hits and explodes on whoever holds it when the timer ends.
Taunt: checks his wristwatch, then points at the opponent and shouts his catchphrase.
Extra parts for the parts sheet: one hand pointing with the index finger; one open hand holding the flat time bomb.
Props and effects for the effects sheet: 1 time bomb (a flat pack of tan explosive blocks taped together, with a small dark keypad, a blank dark display and colored wires, front view, no hands); 1 black wristwatch; 1 big orange-yellow explosion burst; 1 thin ring-shaped shock wave; 3 dark gray smoke puffs; 1 small red light glow.
Avoid: text, numbers or logos on the clothes, the watch and the bomb; digits on the bomb display; game emblems; real shoe brands (no three-stripe design); glasses.
```

Trechos prontos para os textos do Firefly (pasta `art/thom4o/`):

- `<EXPRESSION>`: `mischievous grin`
- `<CHARACTER>`:
  `Thom4o, software developer, tall, slim, no glasses, mischievous grin. Hazard yellow (#F7C81E) plain short-sleeve T-shirt, untucked; black (#1F2023) straight pants; black sneakers with two plain white side stripes and white soles; black wristwatch on one wrist.`
- `<LEGWEAR>`: `black pants`
- `<SHOE>`: `black sneaker with two white side stripes and a white sole`
- `<EXTRA>`: `one pointing hand, one open hand holding a flat time bomb`
- `<ITEMS>`:
  `1 time bomb: a flat pack of tan explosive blocks taped together, with a small dark keypad, a blank dark display and colored wires, front view, no hands; 1 black wristwatch, side view; 1 big orange-yellow explosion burst; 1 thin ring-shaped shock wave; 3 dark gray smoke puffs; 1 small red light glow`
- **Relógio (passo 3):** o braço de trás usa a mesma peça do antebraço da frente, então relógio
  desenhado no antebraço aparece nos dois pulsos. Por isso ele vai na folha de efeitos, como peça
  solta, e o jogo prende só no pulso da frente. Se o antebraço vier com relógio, anexe a folha de
  peças e mande
  `Edit the attached parts sheet: remove the wristwatch from the forearm. Keep every other part exactly the same.`
- **Tênis e calça (passo 3):** os dois são pretos; as listras e a sola brancas é que separam o
  tênis da canela. Se o tênis vier todo preto, peça as listras e a sola de novo.
- **Listras (passo 1):** se vierem três listras inclinadas (cara de marca de verdade), anexe o
  conceito e mande
  `Edit the attached image: make the sneaker stripes two plain horizontal white stripes, not a brand design. Keep everything else the same.`

### 13. Arquelau

- **Quem é:** desenvolvedor de software. Alto (1,80 m, como o Thom4o, o Crocko e o Darllan), loiro
  de olho verde, nem magro nem gordo. Quase sempre de moletom com capuz e zíper, calça e tênis. Na
  vida real ele imita a voz de todo mundo do grupo: o especial vem daí. Idade a confirmar. Rosto e
  barba: seguir as fotos.
- **Bordão:** não tem um só dele: ele imita. Na provocação repete o bordão do adversário mais
  perto; se estiver com a cabeça de alguém (ver o especial), repete o dessa pessoa. Quando não há
  quem imitar (Arquelau contra Arquelau), vale o bordão fixo da ficha: a escolher entre os dos
  outros (sugestão: "Ô Mariiiliaaa!", do João Frango).
- **Estilo de luta:** imitador. Tudo na média: peso, chão, ar e pulo, golpes base sem ajuste. Ele
  não tem um golpe forte próprio: a força dele é a dos outros. Sem cópia, joga só com os golpes
  base e um microfone que quase não machuca; com cópia, tem o especial do adversário enquanto o
  dono fica sem. Ser mediano em tudo é o que deixa qualquer especial roubado servir nele. Contraste
  com o Crocko: o Crocko devolve o golpe que recebe; o Arquelau toma o especial para ele.
- **Especial — Dublagem (projétil + cópia):** ele gira um microfone pelo cabo, como um laço, e
  joga reto para a frente. Se acertar alguém, "grava" a voz da pessoa: o especial dela entra em
  recarga e o Arquelau fica com uma cópia para usar **uma vez**. A cabeça dele vira a cabeça do
  dono do especial até a cópia ser usada.
  - **Por que microfone:** é a ferramenta de quem imita voz, e o cabo faz o papel do laço. A
    alternativa de dev, guardada: um cabo USB que "copia e cola" (Ctrl+C, Ctrl+V).
  - **O arremesso:** startup de 14 ticks (o microfone girando em cima da cabeça é o aviso), active
    de 1, recovery de 22 (puxando o cabo de volta). O microfone sai reto a 16 px/tick e vive 17
    ticks: chega a uns 300 px do centro dele, um terço do palco. É mais longe que a Doze (~250 px)
    e bem mais curto que o Frango (570 px). Caixa pequena, de 30 × 24 px, na altura do peito: dá
    para pular por cima ou esquivar.
  - **O acerto:** 4% de dano e um tranco fraco (ângulo 30°, força 5, escala 0,03): não mata nem
    abre combo. O valor do golpe é o roubo.
  - **O que acontece com quem levou:** o especial dele entra em recarga como se tivesse acabado de
    usar: a recarga dele mesmo, contada do zero, com **teto de 150 ticks (2,5 s)**. Se ele já
    estava numa recarga maior, fica a maior. Efeito que já estava ligado continua (a aura da
    Marília, uma bomba do Thom4o em jogo, um projétil no ar). O teto existe por causa do Tauba
    (recarga de 300, e o especial é a recuperação dele) e da Marília (450): sem teto, ficariam 5 s
    e 7,5 s sem especial por um golpe de 4%.
  - **A cópia:** enquanto está com ela, o botão do especial solta o especial do dono, com todos os
    números da ficha dele (tempos, dano, força, alcance, 1 vez por ar), saindo do corpo do
    Arquelau. A cópia vale **1 uso** e some depois de **600 ticks (10 s)** sem usar, ou se ele
    perder uma vida. Com a cópia guardada ele não joga o microfone: não dá para acumular duas.
  - **Recarga:** errou o microfone, 120 ticks (2 s) contados do começo. Roubou, a recarga da
    Dublagem só começa quando a cópia é usada ou some: 180 ticks (3 s).
  - **Por que esses tempos:** depois de um roubo, o microfone seguinte só pode acertar uns 200
    ticks depois, no melhor caso (o resto do recovery, 180 de recarga e 14 de startup). Como a
    trava de quem levou é de no máximo 150, **todo mundo fica pelo menos uns 50 ticks (quase 1 s)
    com o especial de volta** antes de poder ser roubado de novo, e na maioria dos casos bem mais.
    Ninguém fica travado para sempre.
  - **A trava em cada um** (a recarga do dono, até o teto) e o que o Arquelau leva:

    | Dono        | Trava (ticks)           | O que o Arquelau ganha                         |
    | ----------- | ----------------------- | ---------------------------------------------- |
    | Schummaki   | 110                     | Uma Arrancada                                  |
    | João Frango | 54                      | Um frango                                      |
    | Dadazinho   | 100                     | Um tiro de doze                                |
    | Tauba       | 150 (teto; a dele: 300) | Um Silent quit (serve de recuperação)          |
    | Tchula      | 150                     | Um tiro de scout                               |
    | Crocko      | 120                     | Uma janela de contra-ataque                    |
    | Darllan     | 100                     | Uma pancada de rolo                            |
    | Gabs        | 60                      | Um golpe do bonequinho                         |
    | Marília     | 150 (teto; a dela: 450) | Uma aura de 5 s                                |
    | Meia        | 90                      | Um Comando (agarrão com combo)                 |
    | Igão        | 90                      | Um saque                                       |
    | Thom4o      | 90                      | Uma bomba para plantar (a bomba é do Arquelau) |

  - **A cabeça:** ao roubar, a cabeça do Arquelau troca pela do dono com um "puf"; o corpo
    continua o dele (moletom bordô), então dá para saber quem é quem mesmo com o dono na luta. A
    cabeça roubada usa as 4 expressões do dono (normal, golpe levado, provocação e KO). No último
    segundo da cópia ela pisca; ao usar ou perder a cópia, volta a dele com outro "puf".
  - **A voz:** ao soltar o especial copiado, toca o bordão do dono em tom de imitação. É a piada
    do personagem.
  - **No ar:** o microfone funciona, sem impulso: não ajuda a voltar ao palco. O especial copiado
    segue as regras do dono (a Arrancada e o Silent quit ajudam a voltar, 1 vez por ar).
  - **Interações:** o contra-ataque do Crocko devolve o microfone: o Arquelau leva os 4% e fica
    sem a Dublagem pela recarga cheia (180). Na Marília com a aura o microfone acerta e rouba
    normalmente (só o dano é menor). Com 3 ou 4 jogadores, pega o primeiro em quem encostar. Com
    times e fogo amigo desligado, atravessa o companheiro; ligado, dá para copiar o especial do
    companheiro, mas ele também fica na recarga. Contra outro Arquelau: se o outro estiver com uma
    cópia, rouba a cópia; se não estiver, só dá o dano e põe a Dublagem dele em recarga. O
    microfone é projétil: não passa a bomba do Thom4o.
  - **Efeitos:** no startup o microfone gira em cima da cabeça com um "vuu-vuu"; no voo, o cabo é
    uma linha da mão até o microfone, desenhada no código (estica na ida e encolhe na volta). Ao
    acertar, ondas de voz em âmbar (`#FFC94D`) saem de quem levou e correm pelo cabo até ele, com
    um chiado de gravação; em cima da cabeça de quem levou aparece um ícone de especial riscado
    enquanto a trava dura. Com a cópia, um ícone pequeno de microfone fica em cima do Arquelau com
    um anel que esvazia nos 10 s.
  - **A animação:** 1 clipe de especial dele (girar, arremessar, puxar). O especial copiado toca o
    clipe de especial do dono no corpo do Arquelau, com os objetos e os efeitos do dono (o
    esqueleto é o mesmo para todos, e a arte do dono já está carregada porque ele está na luta).
    As mãos especiais vêm da folha do dono, como estão. Nenhuma arte nova por personagem copiado.
  - **Precisa de código novo (médio no `sim`, maior no `game`):** o bloco projétil ganha uma opção
    `steal` (teto da trava, duração da cópia e recarga depois da cópia), em vez de um bloco novo.
    O lutador ganha "cópia guardada" (de quem e quantos ticks faltam), que entra no snapshot e no
    hash; com ela, o botão do especial usa a ficha do dono (personagem é dado, então é só apontar
    para outra ficha). Eventos novos: roubou, usou a cópia, perdeu a cópia. Sem RNG e só com
    inteiros: replay e online continuam iguais. No `game`: trocar a cabeça, tocar o clipe e os
    efeitos do dono no corpo dele, o cabo, os ícones e a voz de imitação.
  - **Se precisar ajustar:** alcance do microfone (velocidade 16 × 17 ticks), startup (14), teto
    da trava (150), duração da cópia (600) e recarga depois da cópia (180). Se a cópia ficar forte
    demais com algum especial (o tiro de scout é o candidato), o primeiro ajuste é dar 80% do dano
    na cópia.
- **Números da ficha (proposta):**

  | Campo        | Valor       | Comparação                                           |
  | ------------ | ----------- | ---------------------------------------------------- |
  | `weight`     | 100         | Médio                                                |
  | `walkSpeed`  | 6,6         | Média (6,5)                                          |
  | `airSpeed`   | 5,6         | Média (5,5)                                          |
  | `jumpHeight` | 176         | Média (175)                                          |
  | `dashSpeed`  | 13,2        | Média (13)                                           |
  | `hurtbox`    | 50 × 104    | 1,80 m, corpo médio (a mesma do Crocko)              |
  | Queda        | rápida      | `fastFallSpeed` 19, como a maioria                   |
  | Golpes base  | padrão      | Sem ajustes                                          |
  | Especial     | 14 / 1 / 22 | Microfone a 16 px/tick por 17 ticks, 30 × 24 px, 4%  |
  | Recarga      | 120 / 180   | Errou (do começo) / depois de usar ou perder a cópia |

- **Provocação:** leva o microfone à boca, faz cara de deboche e repete o bordão do adversário
  mais perto, imitando a voz dele. O balão mostra o bordão do imitado (para quem ainda não tem
  bordão, o texto do balão dele: "Olha essa postura...", "GG!", "Vem!"; para o Tauba, as notas
  🎵🎶, com ele imitando o trompete com a boca). O som é o áudio do bordão do imitado tocado em
  outro tom, até o Arquelau gravar as próprias imitações (`audio/vozes/arquelau_imita_<id>`, uma
  por amigo: é a voz dele de verdade fazendo o que ele faz na vida real).
- **Visual:** moletom bordô (`#8E2440`) com zíper, fechado, até o quadril, de manga comprida, com
  o capuz **caído nas costas** (nunca na cabeça: a cabeça troca no especial, e o capuz tem que
  ficar no tronco) e dois cordões curtos cor de areia; calça areia (`#D9C49A`) de perna reta;
  tênis off-white (`#F6F0E4`) com detalhes bordô. Cabelo loiro, olhos verdes (bem visíveis na
  cabeça). Corpo alto, de largura média. Cores: bordô, areia e âmbar (`#FFC94D`, as ondas de voz).
  O bordô é bem mais escuro e fechado que o vermelho do Schummaki e mais vermelho que o rosa da
  Marília, e ninguém tem calça clara cor de areia: a calça e o cabelo loiro seguram a leitura nos
  menus escuros.
- **O microfone:** de mão, genérico, com a cabeça de tela metálica e o corpo escuro, sem marca.
- **No jogo:** ainda não está (só esta ficha). A ficha do `sim` vai em
  `packages/sim/src/characters/arquelau.ts`.
- **Ideias guardadas:** louro é loiro e também é papagaio, o bicho que imita voz: um papagaio no
  ombro ou no fundo de um mapa; a fala de vitória imitando o bordão de quem perdeu; KO dele com um
  chiado de microfone (microfonia); a figurinha da seleção trocando de rosto de vez em quando.

#### Ficha de arte

```text
CHARACTER SHEET
Name: Arquelau — software developer, blond with green eyes, the impersonator of the group: he can copy anyone's voice.
Fighting style: copycat all-rounder — average build and speed, relaxed stance, spinning a microphone by its cable like a lasso.
Body: based on the photos; tall, average build (neither slim nor heavy).
Outfit: wine red (#8E2440) zip-up hoodie, zipped, hip-length, long sleeves, with the hood down resting behind the neck and two short sand-colored drawstrings; sand (#D9C49A) straight pants; off-white (#F6F0E4) sneakers with wine red details.
Signature details: blond hair, green eyes, the wine red hoodie with the hood down.
Colors: primary #8E2440, secondary #D9C49A, accent #FFC94D.
Face/personality: playful smirk, one eyebrow raised, as if about to do an impression of someone.
Special move: "Dublagem" — he spins a microphone by its cable and throws it straight forward like a lasso; if it hits, he steals the opponent's voice and special move, and his head turns into the opponent's head until he uses it.
Taunt: holds the microphone to his mouth and repeats the opponent's catchphrase, mocking them.
Extra parts for the parts sheet: one hand holding a microphone up to the mouth; one fist gripping a cable.
Props and effects for the effects sheet: 1 handheld microphone (side view, head pointing right, no hands); 3 curved amber sound-wave arcs in different sizes; 1 small amber sparkle; 3 small gray smoke puffs.
Avoid: text or logos on the clothes; the hood over the head; brand logos on the microphone; hoodie below the hips.
```

Trechos prontos para os textos do Firefly (pasta `art/arquelau/`):

- `<EXPRESSION>`: `playful smirk, one eyebrow raised`
- `<CHARACTER>`:
  `Arquelau, software developer, tall, average build, blond hair, green eyes, playful smirk. Wine red (#8E2440) zip-up hoodie, zipped, hip-length, long sleeves, hood down behind the neck; sand (#D9C49A) straight pants; off-white sneakers with wine red details.`
- `<LEGWEAR>`: `sand-colored pants`
- `<SHOE>`: `off-white sneaker with wine red details`
- `<EXTRA>`: `one hand holding a microphone, one fist gripping a cable`
- Manga comprida até o punho: no passo 3, troque `upper arm with sleeve; forearm without hand` por
  `upper arm with sleeve; forearm with sleeve, without hand`.
- `<ITEMS>`:
  `1 handheld microphone with a metal mesh head and a dark body, side view with the head pointing right, no hands, no logo; 3 curved amber (#FFC94D) sound-wave arcs in different sizes; 1 small amber sparkle; 3 small gray smoke puffs`

  O cabo não entra na folha: é desenhado no código, porque estica e encolhe.

- **Cabeças (passo 2):** acrescente `No hood on the heads.` antes de `Bold`. O capuz fica no
  tronco; se vier na cabeça, some quando a cabeça troca pela de outro personagem.
- **Peças (passo 3):** o tronco tem que vir com o capuz caído atrás do pescoço e o zíper fechado.
  Se o capuz faltar, use a linha "Faltou uma peça" da
  [tabela de correções](ARTE.md#se-der-errado-no-firefly) pedindo
  `the hood down, resting behind the neck, on the torso`.

### Arte

Fotos de cada amigo servem de referência para a concept art. O guia de estilo, a ficha de arte de
cada personagem e os prompts (Firefly e ChatGPT) ficam em [`docs/ARTE.md`](ARTE.md), na seção
"Personagem novo".
