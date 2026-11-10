# GDD — Jogo de luta dos amigos

Documento de 1 página com as regras do jogo. Quando uma regra mudar no código, mude aqui também.
Os números são ponto de partida e serão ajustados nas Etapas 1–3 e 11.

## Partida

- **Formato:** 1x1 (depois 2x2). Plataforma de luta, sem barra de vida: quem sai da tela perde uma vida.
- **Stocks:** 3 vidas por jogador.
- **Tempo limite:** 4 minutos. No fim do tempo vence quem tiver mais stocks; empate em stocks → menor % de dano; empate total → morte súbita (1 stock, 300%).
- **Dano:** cada golpe soma % ao alvo (começa em 0%, sem teto). Quanto maior o %, mais longe o golpe arremessa.
- **Knockback:** `(força base + dano acumulado × escala do golpe) ÷ peso`. Direção definida pelo golpe.
- **Hitstun:** proporcional ao knockback; durante o hitstun o lutador não age.
- **Hitstop:** os dois lutadores congelam alguns ticks no impacto (mais em golpes fortes).
- **Blast zones:** retângulo além das bordas da tela; sair dele = KO.
- **Respawn:** reaparece no alto do mapa com 0% e ~2 s de invencibilidade.
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
- **Borda (ledge):** encostar na quina da plataforma principal agarra; dali sobe, pula ou solta.

## Controles

Rascunho; o remapeamento entra na Etapa 6. Gamepad (Gamepad API) é o recomendado.

| Ação       | Jogador 1 | Jogador 2 | Gamepad (padrão)       |
| ---------- | --------- | --------- | ---------------------- |
| Direções   | W A S D   | Setas     | Analógico esq. / D-pad |
| Pular      | Espaço    | J         | A                      |
| Ataque     | V         | K         | X                      |
| Especial   | B         | L         | B                      |
| Esquiva    | F         | I         | RB / RT                |
| Provocação | R         | U         | Y                      |

**Input como dado:** a cada tick, cada jogador vira uma bitmask. O `sim` só enxerga isso.

| Bit | Botão | Bit | Botão   |
| --- | ----- | --- | ------- |
| 0   | LEFT  | 5   | ATTACK  |
| 1   | RIGHT | 6   | SPECIAL |
| 2   | UP    | 7   | DODGE   |
| 3   | DOWN  | 8   | TAUNT   |
| 4   | JUMP  |     |         |

## Moveset base (igual para todos)

Cada personagem só muda números destes golpes (dano, força, alcance, frames).

| Golpe              | Input              | Uso                                 |
| ------------------ | ------------------ | ----------------------------------- |
| Leve neutro (chão) | Ataque parado      | Rápido, curto alcance               |
| Leve lado (chão)   | Ataque + ←/→       | Avança, arremessa na horizontal     |
| Leve baixo (chão)  | Ataque + ↓         | Rasteira, arremessa para cima       |
| Aéreo neutro       | Ataque no ar       | Golpe em volta do corpo             |
| Aéreo lado         | Ataque + ←/→ no ar | Principal golpe de KO lateral       |
| Aéreo baixo        | Ataque + ↓ no ar   | Golpe para baixo (spike fraco)      |
| Recuperação        | Ataque + ↑         | Sobe e acerta; 1 vez por ar         |
| Ground pound       | Especial + ↓ no ar | Cai rápido e acerta ao tocar o chão |

Cada golpe é definido em ticks: **startup** (preparação) → **active** (hitbox ligada) → **recovery** (vulnerável).

## Especiais e provocação

- Botão **Especial**: cada personagem tem **1 especial**, que sai com Especial parado ou com qualquer direção (exceto Especial + ↓ no ar, que é o ground pound do moveset base). A direção ←/→ só vira o lutador para aquele lado.
- O especial é montado com blocos do `sim`: projétil, investida, área, contra-ataque, buff, teleporte, agarrão.
- **Provocação:** animação + áudio do amigo. Sem efeito de jogo (no máximo um efeito cômico pequeno).

## Ficha de personagem

Cada personagem é um arquivo de dados validado com zod (Etapa 3). Formato previsto:

```ts
{
  id: 'fulano',
  name: 'Fulano',
  colors: { primary: '#e63946', secondary: '#f1faee' },
  stats: {
    weight: 100,          // 100 = médio; maior = voa menos
    walkSpeed: 6,         // px/tick
    airSpeed: 5,
    jumpHeight: 140,      // px
    airJumps: 1,
    hurtbox: { w: 48, h: 96 },
  },
  moves: {                // só os ajustes; o resto vem do moveset base
    sideLight: { damage: 9, baseKnockback: 30 },
    sideAir: { activeTicks: 4 },
  },
  special: {
    name: 'Nome do especial',
    blocks: [{ type: 'projectile', speed: 10, damage: 6, lifetimeTicks: 60 }],
  },
  taunt: { animation: 'fulano_taunt', sound: 'fulano_bordao' },
  animations: { idle: 'fulano_idle', run: 'fulano_run' /* ... */ },
}
```

O elenco (apelidos, traços, especial e provocação de cada um) fica em [`docs/ELENCO.md`](ELENCO.md).
