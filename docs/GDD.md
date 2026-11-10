# GDD — Jogo de luta dos amigos

Documento de 1 página com as regras do jogo. Quando uma regra mudar no código, mude aqui também.
Os números são ponto de partida e serão ajustados nas Etapas 1–3 e 11.

## Partida

- **Formato:** 1x1 (depois 2x2). Plataforma de luta, sem barra de vida: quem sai da tela perde uma vida.
- **Stocks:** 3 vidas por jogador.
- **Tempo limite:** 4 minutos. No fim do tempo vence quem tiver mais stocks; empate em stocks → menor % de dano; empate total → morte súbita (1 stock, 300%).
- **Dano:** cada golpe soma % ao alvo (começa em 0%, sem teto). Quanto maior o %, mais longe o golpe arremessa.
- **Knockback:** `(força base + dano acumulado × escala do golpe) × 100 ÷ peso` (peso 100 = médio), com o dano do alvo já somado o do golpe. Ver [Combate](#combate).
- **Hitstun:** proporcional ao knockback; durante o hitstun o lutador não age.
- **Hitstop:** os dois lutadores congelam alguns ticks no impacto (mais em golpes fortes).
- **Blast zones:** retângulo além das bordas da tela; sair dele inteiro = KO (inclusive cair do mapa).
- **Respawn:** 1 s fora de cena, depois reaparece no alto do mapa com 0% e 2 s de invencibilidade. Sem stock, está fora; quando sobra 1 lutador, ele vence (se os últimos stocks caírem no mesmo tick, empate).
- **Morte súbita:** só os empatados voltam, nos pontos de início, com 1 stock, 300% e 1 s de invencibilidade, sem limite de tempo.
- **Revanche:** no fim da luta, Ataque, Pulo ou Enter (depois de 1 s) começa outra com os mesmos personagens; Especial ou Esc volta para a seleção.
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

Rascunho; o remapeamento entra na Etapa 6. Gamepad (Gamepad API) é o recomendado.

| Ação       | Jogador 1  | Jogador 2 | Gamepad (padrão)       |
| ---------- | ---------- | --------- | ---------------------- |
| Direções   | W A S D    | Setas     | Analógico esq. / D-pad |
| Pular      | Espaço     | J         | A                      |
| Ataque     | V          | K         | X                      |
| Especial   | B          | L         | B                      |
| Esquiva    | Shift esq. | I         | RB / RT                |
| Provocação | R          | U         | Y                      |

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
- **Determinismo:** seno e cosseno vêm de uma tabela de inteiros; todo o estado do combate é inteiro.

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
- **Provocação** (R / U / Y): só no chão, parado pela duração da ficha; levar golpe desfaz. Sem efeito de jogo. Mostra o bordão num balão e toca o áudio do amigo; enquanto não há áudio gravado (Etapa 5), toca uma voz provisória sintetizada a partir do bordão.

## Seleção

- Seletor mínimo do modo local: cada jogador escolhe com ←/→, confirma com Ataque ou Pulo e desfaz com Especial. Com os 2 prontos, a luta começa. Pode repetir personagem: o contorno e o marcador em cima da cabeça têm a cor do jogador.
- No fim da luta: Ataque, Pulo ou Enter = revanche com os mesmos; Especial ou Esc = volta para a seleção.

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
  animations: { idle: 'fulano_parado' }, // opcional; sem valor = '<id>_<chave>'
});
```

Ajustes de golpe aceitos: `startup`, `active`, `recovery`, `damage`, `angle`, `baseKnockback`, `knockbackScale`, `landingLag`, `canWalk`, `reach`.

### Os 2 primeiros

| Personagem  | Estilo | Peso | Chão (px/tick) | Ar (px/tick) | Pulo | Pulos aéreos | Especial                                                                            |
| ----------- | ------ | ---- | -------------- | ------------ | ---- | ------------ | ----------------------------------------------------------------------------------- |
| Schummaki   | Rusher | 112  | 7,4            | 5,3          | 165  | 1            | **Arrancada** (investida): 16 / 14 / 20, 13%, 1 vez por ar, parado no ar no startup |
| João Frango | Zoner  | 86   | 5,6            | 6,2          | 180  | 2            | **Frango assado voador** (projétil): 10 / 1 / 16, 5%, reto, ~570 px, recarga de 42  |

O elenco (apelidos, traços, especial e provocação de cada um) fica em [`docs/ELENCO.md`](ELENCO.md).
