# Áudios gravados

Tudo o que estiver aqui entra no jogo sozinho no próximo `pnpm dev` ou build (não precisa mexer em código).
Enquanto um áudio não existe, o jogo toca uma versão gerada em código com a mesma função.

| Pasta     | Arquivo                       | Toca quando                                      |
| --------- | ----------------------------- | ------------------------------------------------ |
| `vozes/`  | `<taunt.sound da ficha>.opus` | provocação (ex.: `vozes/schummaki_bordao.opus`)  |
| `vozes/`  | `<koSound da ficha>.opus`     | o amigo toma KO (ex.: `vozes/schummaki_ko.opus`) |
| `musica/` | `menu.mp3`                    | seleção de personagem (em loop)                  |
| `musica/` | `luta.mp3`                    | luta (em loop)                                   |
| `sfx/`    | `<nome>.wav`                  | troca um efeito gerado (nomes abaixo)            |

- **Formatos:** `.opus`, `.ogg`, `.mp3`, `.m4a`, `.wav` ou `.webm`. Áudio do WhatsApp (`.opus`) funciona direto.
  O mesmo áudio em dois formatos (ex.: `luta.ogg` e `luta.mp3`) também vale: o navegador toca o primeiro que conseguir.
- **Nome:** minúsculas, números e `_`, igual ao id na ficha (`packages/sim/src/characters/`).
  Os ids de cada personagem: `taunt.sound` (provocação) e `koSound` (KO; sem ele, `<id com _>_ko`).
- **Vozes:** curtas (provocação até ~3 s, KO até ~1,5 s), sem silêncio no começo. Áudios gravados pelos
  próprios amigos no WhatsApp funcionam melhor que IA.
- **Música:** tem que emendar no loop (o fim encaixa no começo). Use só música que o grupo pode usar.
- **Efeitos (`sfx/`):** `hit_light`, `hit_medium`, `hit_heavy`, `swing`, `jump`, `air_jump`, `dash`, `dodge`,
  `land`, `grab`, `counter`, `ko`, `respawn` (lista em `packages/game/src/audio/sfxSynth.ts`).
