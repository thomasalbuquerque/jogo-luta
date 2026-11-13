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
- **Vozes de cada personagem hoje:** `schummaki_bordao`, `schummaki_ko`, `joao_frango_bordao`,
  `joao_frango_ko`, `dadazinho_bordao` (o "sexo" seco, que sai no fim da air guitar), `dadazinho_ko`,
  `tauba_bordao` (o trompete: uns 2 s de fanfarra, que entram quando o trompete chega na boca; sem
  áudio, o jogo sintetiza a fanfarra), `tauba_ko`, `tchula_bordao` (o "Nooola!" gritado, que sai
  quando ele aponta a chave de boca), `tchula_ko`, `crocko_bordao` (ainda sem bordão: sai quando ele
  aponta para o adversário depois do alongamento), `crocko_ko`, `darllan_bordao` (o "Darllan!"
  gritado de braços abertos, que sai depois da mordida no biscoito) e `darllan_ko`.
- **Vozes:** curtas (provocação até ~3 s, KO até ~1,5 s), sem silêncio no começo. Áudios gravados pelos
  próprios amigos no WhatsApp funcionam melhor que IA.
- **Música:** tem que emendar no loop (o fim encaixa no começo). Use só música que o grupo pode usar.
- **Efeitos (`sfx/`):** `hit_light`, `hit_medium`, `hit_heavy`, `swing`, `jump`, `air_jump`, `dash`, `dodge`,
  `land`, `grab`, `counter`, `ko`, `respawn`, `vanish` e `appear` (o "plim" do Tauba sumindo e voltando), `rifle_shot` e `rifle_bolt` (o tiro
  e o ferrolho da scout do Tchula), `spine_crack` (o "créc" de coluna da correção do Crocko), `flour_thump` (o "póf" do rolo do Darllan batendo no chão) (lista em `packages/game/src/audio/sfxSynth.ts`).
