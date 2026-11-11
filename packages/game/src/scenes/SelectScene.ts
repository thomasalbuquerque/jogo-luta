import Phaser from 'phaser';
import { getCharacter, PLAYABLE_CHARACTERS, STAGES, type Character } from '@jogo-luta/sim';
import { music } from '../audio/music';
import { playSfx } from '../audio/sfx';
import { addAudioHint } from '../audio/unlock';
import { playVoice } from '../audio/voice';
import { getControls, keyLabel } from '../input/controls';
import { Menu } from '../input/menu';
import { MenuInput } from '../input/menuInput';
import { getOnline } from '../net/online';
import { netLabel, onlineRoute } from '../net/route';
import type { OnlineSession } from '../net/session';
import { colorValue, statBars } from '../render/fighterLook';
import { FighterView } from '../render/FighterView';
import { clipFor } from '../rig/library';
import { sampleClip } from '../rig/animation';
import { gridColumns, gridMove, selectSlots } from '../ui/grid';
import { addPortrait, drawSilhouette } from '../ui/portrait';
import { cssColor, fadeIn, panel, playerColor, titleText, UI, uiText } from '../ui/theme';
import type { MatchSetup } from './FightScene';

const PLAYERS = 2;
const TILE_W = 136;
const TILE_H = 150;
const TILE_GAP = 14;
const GRID_Y = 92;
const PANEL_Y = 276;
const PANEL_W = 580;
const PANEL_H = 368;
/** Altura do lutador desenhado no painel (px). */
const PANEL_FIGHTER_H = 290;
/** Com os 2 prontos, espera isto antes de ir para o mapa (dá tempo de ver e de desfazer). */
const START_DELAY_MS = 700;

interface PlayerPanel {
  container: Phaser.GameObjects.Container;
  view: FighterView | null;
  /** Tempo da animação no painel, em ticks. */
  t: number;
  clip: 'idle' | 'taunt';
}

/**
 * Seleção de personagem: grade com 7 casas (os que existem e silhuetas "em
 * breve"). Cada jogador anda com as próprias direções, confirma com Ataque ou
 * Pulo e desfaz com Especial. Com os 2 prontos, vai para a seleção de mapa.
 *
 * Online, cada PC só mexe no próprio cursor (com qualquer um dos controles) e
 * vê o do outro jogador pela rede.
 */
export class SelectScene extends Phaser.Scene {
  private controls!: MenuInput;
  private slots: (string | null)[] = [];
  private cursors: number[] = [];
  private ready: boolean[] = [];
  private readyMs = 0;
  private cursorGfx!: Phaser.GameObjects.Graphics;
  private tags: Phaser.GameObjects.Text[] = [];
  private tiles: Phaser.GameObjects.Container[] = [];
  private panels: PlayerPanel[] = [];
  /** Sala online (null = jogo local, os 2 no mesmo PC). */
  private net: OnlineSession | null = null;
  private netText: Phaser.GameObjects.Text | null = null;
  /** Online: o host já pediu a tela de mapa. */
  private stageOpened = false;

  constructor() {
    super('select');
  }

  /** Voltando da luta ou do mapa, os cursores começam nos personagens escolhidos antes. */
  init(data: Partial<MatchSetup>): void {
    this.slots = selectSlots(PLAYABLE_CHARACTERS);
    this.cursors = Array.from({ length: PLAYERS }, (_, i) => {
      const index = this.slots.indexOf(data.characters?.[i] ?? '');
      return index >= 0 ? index : i % PLAYABLE_CHARACTERS.length;
    });
    this.ready = this.cursors.map(() => false);
    this.readyMs = 0;
    this.net = getOnline();
    this.netText = null;
    this.stageOpened = false;
  }

  create(): void {
    this.controls = new MenuInput();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.controls.destroy();
    });
    music.play(this, 'menu');
    addAudioHint(this, 2);
    fadeIn(this);
    // gera a música da luta enquanto escolhem, para não travar ao começar
    this.time.delayedCall(1500, () => {
      music.warm(this, 'luta');
    });
    const { width, height } = this.scale;
    titleText(this, width / 2, 46, 'ESCOLHA O LUTADOR', 38);

    this.tiles = this.slots.map((id, i) => this.drawTile(id, i));
    this.cursorGfx = this.add.graphics();
    this.tags = this.cursors.map((_, p) =>
      uiText(this, 0, 0, `P${String(p + 1)}`, {
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#0b0e16',
        backgroundColor: cssColor(playerColor(p)),
        padding: { x: 6, y: 2 },
      }).setOrigin(0.5, 0.5),
    );
    this.panels = this.cursors.map(() => ({
      container: this.add.container(0, 0),
      view: null,
      t: 0,
      clip: 'idle',
    }));
    this.cursors.forEach((_, p) => {
      this.rebuildPanel(p);
    });

    if (this.net) {
      this.netText = uiText(this, width - 16, 14, netLabel(this.net), {
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#ced4da',
      }).setOrigin(1, 0);
    }
    uiText(this, width / 2, height - 22, this.net ? this.onlineHint(this.net) : this.hintText(), {
      fontSize: '15px',
      color: UI.muted,
    }).setOrigin(0.5);
    this.refresh();
  }

  override update(_time: number, delta: number): void {
    const net = this.net;
    if (net) {
      const route = onlineRoute(net, 'select');
      if (route) {
        this.scene.start(route.scene, route.data);
        return;
      }
      this.netText?.setText(netLabel(net));
    }
    const frame = this.controls.poll(PLAYERS, delta);
    if (frame.system & Menu.BACK) {
      this.backToTitle();
      return;
    }
    const count = this.slots.length;
    const cols = gridColumns(count);
    // online: este PC só mexe no próprio cursor, com qualquer um dos controles
    const mine = frame.players.reduce((a, b) => a | b, 0);
    for (let p = 0; p < PLAYERS; p++) {
      if (net && p !== net.local) {
        this.followRemote(p, net);
        continue;
      }
      const actions = net ? mine : (frame.players[p] ?? 0);
      if (this.ready[p]) {
        if (actions & Menu.BACK) this.setReady(p, false);
        continue;
      }
      // online, Especial não sai da sala sem querer: só o Esc
      if (actions & Menu.BACK && !net && !this.ready.some(Boolean)) {
        this.backToTitle();
        return;
      }
      const cursor = this.cursors[p] ?? 0;
      const next = gridMove(cursor, actions, cols, count);
      if (next !== cursor) {
        this.cursors[p] = next;
        playSfx(this, 'ui_move');
        this.rebuildPanel(p);
      }
      if (actions & Menu.CONFIRM) this.confirm(p);
    }
    net?.setSel(this.cursors[net.local] ?? 0, this.ready[net.local] === true);

    if (this.ready.every(Boolean)) {
      this.readyMs += delta;
      if (this.readyMs >= START_DELAY_MS) {
        const characters = this.cursors.map((i) => this.slots[i] ?? '');
        if (!net) {
          this.scene.start('stage', { characters } satisfies Partial<MatchSetup>);
          return;
        }
        // online: o host abre o mapa para os dois (quem entrou segue a tela da sala)
        if (net.role === 'host' && !this.stageOpened) {
          this.stageOpened = true;
          net.openStage(characters, STAGES[0]?.id ?? '');
        }
      }
    } else {
      this.readyMs = 0;
    }
    this.animatePanels(delta);
    this.refresh();
  }

  /** Online: o cursor e a confirmação do outro jogador, como chegaram pela rede. */
  private followRemote(p: number, net: OnlineSession): void {
    const sel = net.selection(p);
    if (!sel) return;
    const cursor = Math.min(sel.cursor, this.slots.length - 1);
    if (cursor !== this.cursors[p]) {
      this.cursors[p] = cursor;
      this.rebuildPanel(p);
    }
    const id = this.slots[cursor];
    const ready = sel.ready && Boolean(id);
    if (ready === (this.ready[p] === true)) return;
    this.setReady(p, ready);
    if (ready && id) {
      const c = getCharacter(id);
      playVoice(this, c.taunt.sound, c.taunt.text);
    }
  }

  private backToTitle(): void {
    playSfx(this, 'ui_back');
    this.scene.start('title', { menu: true });
  }

  /** Confirma o personagem do cursor (silhueta "em breve" não dá). */
  private confirm(p: number): void {
    const id = this.slots[this.cursors[p] ?? 0];
    if (!id) {
      playSfx(this, 'ui_error');
      const tile = this.tiles[this.cursors[p] ?? 0];
      if (tile) {
        this.tweens.add({ targets: tile, x: tile.x + 5, duration: 40, yoyo: true, repeat: 2 });
      }
      return;
    }
    this.setReady(p, true);
    const c = getCharacter(id);
    playVoice(this, c.taunt.sound, c.taunt.text);
  }

  private setReady(p: number, ready: boolean): void {
    this.ready[p] = ready;
    playSfx(this, ready ? 'ui_confirm' : 'ui_back');
    const panelState = this.panels[p];
    if (panelState) {
      panelState.clip = ready ? 'taunt' : 'idle';
      panelState.t = 0;
    }
    this.rebuildPanel(p);
  }

  private tileX(i: number): number {
    const cols = gridColumns(this.slots.length);
    const total = cols * TILE_W + (cols - 1) * TILE_GAP;
    return (this.scale.width - total) / 2 + (i % cols) * (TILE_W + TILE_GAP);
  }

  private tileY(i: number): number {
    const cols = gridColumns(this.slots.length);
    return GRID_Y + Math.floor(i / cols) * (TILE_H + TILE_GAP);
  }

  /** Casa da grade: figurinha e nome, ou silhueta "em breve". */
  private drawTile(id: string | null, i: number): Phaser.GameObjects.Container {
    const x = this.tileX(i);
    const y = this.tileY(i);
    const tile = this.add.container(x, y);
    const g = this.add.graphics();
    panel(g, 0, 0, TILE_W, TILE_H, id ? UI.panel : UI.panelDark, 1, 10);
    tile.add(g);
    if (id) {
      const c = getCharacter(id);
      g.fillStyle(colorValue(c.colors.primary), 0.25);
      g.fillRoundedRect(4, 4, TILE_W - 8, TILE_H - 40, 8);
      tile.add(addPortrait(this, id, TILE_W / 2, 58, 104));
      tile.add(
        uiText(this, TILE_W / 2, TILE_H - 18, c.name, {
          fontSize: '15px',
          fontStyle: 'bold',
        }).setOrigin(0.5),
      );
    } else {
      drawSilhouette(g, TILE_W / 2, 62, 92, 0x05070b);
      tile.add(
        uiText(this, TILE_W / 2, TILE_H - 18, 'EM BREVE', {
          fontSize: '14px',
          fontStyle: 'bold',
          color: UI.dim,
        }).setOrigin(0.5),
      );
    }
    return tile;
  }

  /** Painel grande do jogador `p`: o lutador animado, nome, estilo, especial e barras. */
  private rebuildPanel(p: number): void {
    const state = this.panels[p];
    if (!state) return;
    state.view?.container.destroy();
    state.view = null;
    const box = state.container;
    box.removeAll(true);
    const x = p === 0 ? 40 : this.scale.width - 40 - PANEL_W;
    const y = PANEL_Y;
    box.setPosition(x, y);
    const color = playerColor(p);
    const ready = this.ready[p] === true;
    const id = this.slots[this.cursors[p] ?? 0] ?? null;

    const g = this.add.graphics();
    panel(g, 0, 0, PANEL_W, PANEL_H, UI.panel, 0.95);
    g.lineStyle(ready ? 6 : 3, color, 1);
    g.strokeRoundedRect(0, 0, PANEL_W, PANEL_H, 14);
    box.add(g);
    // chão do lutador
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(130, PANEL_H - 34, 170, 22);

    const textX = 262;
    const text = (dy: number, value: string, style: Phaser.Types.GameObjects.Text.TextStyle) => {
      const t = uiText(this, textX, dy, value, style);
      box.add(t);
      return t;
    };
    box.add(
      uiText(this, 16, 14, `P${String(p + 1)}${this.net?.local === p ? ' · VOCÊ' : ''}`, {
        fontFamily: UI.titleFont,
        fontSize: '26px',
        color: cssColor(color),
      }),
    );

    if (!id) {
      drawSilhouette(g, 130, PANEL_H / 2 + 10, 230, 0x0b0e16);
      text(40, '?', { fontFamily: UI.titleFont, fontSize: '40px', color: UI.dim });
      text(100, 'Em breve.', { fontSize: '22px', color: UI.muted });
      return;
    }

    const c = getCharacter(id);
    const view = new FighterView(this, id, PANEL_FIGHTER_H / 1.12);
    state.view = view;
    // fica dentro do painel, por cima do fundo dele
    box.add(view.container);
    text(28, c.name, { fontFamily: UI.titleFont, fontSize: '34px' });
    text(80, c.blurb, { fontSize: '17px', color: '#ced4da', wordWrap: { width: 300 } });
    text(146, `Especial: ${c.special?.name ?? '—'}`, {
      fontSize: '19px',
      fontStyle: 'bold',
      color: c.colors.secondary,
    });
    this.drawBars(box, g, c, textX, 190);
    text(300, `“${c.taunt.text}”`, {
      fontSize: '16px',
      fontStyle: 'italic',
      color: '#8d99ae',
      wordWrap: { width: 300 },
    });
    if (ready) {
      const badge = uiText(this, PANEL_W - 16, PANEL_H - 16, 'PRONTO!', {
        fontFamily: UI.titleFont,
        fontSize: '26px',
        color: '#0b0e16',
        backgroundColor: cssColor(color),
        padding: { x: 10, y: 4 },
      }).setOrigin(1, 1);
      box.add(badge);
      badge.setScale(1.4);
      this.tweens.add({ targets: badge, scale: 1, duration: 180, ease: 'Back.Out' });
    }
    this.poseFighter(p);
  }

  /** Barras de peso, velocidade e pulo (só para comparar de relance). */
  private drawBars(
    box: Phaser.GameObjects.Container,
    g: Phaser.GameObjects.Graphics,
    c: Character,
    x: number,
    y: number,
  ): void {
    statBars(c).forEach((bar, i) => {
      const by = y + i * 24;
      box.add(uiText(this, x, by - 3, bar.label, { fontSize: '15px', color: UI.muted }));
      g.fillStyle(0x1d2333, 1);
      g.fillRect(x + 64, by, 220, 12);
      g.fillStyle(colorValue(c.colors.secondary), 1);
      g.fillRect(x + 64, by, 220 * Math.max(0.05, bar.value), 12);
    });
  }

  private animatePanels(delta: number): void {
    for (const [p, state] of this.panels.entries()) {
      state.t += (delta / 1000) * 60;
      this.poseFighter(p);
    }
  }

  private poseFighter(p: number): void {
    const state = this.panels[p];
    const id = this.slots[this.cursors[p] ?? 0];
    if (!state?.view || !id) return;
    const c = getCharacter(id);
    const clip = clipFor(c, state.clip);
    // a provocação toca uma vez e volta para o parado
    if (state.clip === 'taunt' && state.t > c.taunt.durationTicks) {
      state.clip = 'idle';
      state.t = 0;
    }
    const facing = p === 0 ? 1 : -1;
    state.view.setPose(sampleClip(clip, state.t), 130, PANEL_H - 34, facing, clip.ground === true);
  }

  /** Molduras e etiquetas de cada jogador sobre a casa escolhida. */
  private refresh(): void {
    const g = this.cursorGfx;
    g.clear();
    for (const [p, cursor] of this.cursors.entries()) {
      const color = playerColor(p);
      const x = this.tileX(cursor);
      const y = this.tileY(cursor);
      const inset = p * 7;
      g.lineStyle(this.ready[p] ? 7 : 4, color, 1);
      g.strokeRoundedRect(
        x - 6 + inset,
        y - 6 + inset,
        TILE_W + 12 - inset * 2,
        TILE_H + 12 - inset * 2,
        12,
      );
      this.tags[p]?.setPosition(x + (p === 0 ? 22 : TILE_W - 22), y - 6);
    }
  }

  /** Rodapé do online: quem é este PC e como sair da sala. */
  private onlineHint(net: OnlineSession): string {
    return `Você é o P${String(net.local + 1)}      Direções escolhem · Ataque ou Pulo confirma · Especial desfaz      Esc sai da sala`;
  }

  /** Rodapé com as teclas atuais de cada jogador. */
  private hintText(): string {
    const [p1, p2] = getControls().keys;
    const hint = (label: string, k: typeof p1) =>
      k
        ? `${label}: ${keyLabel(k.LEFT[0] ?? '')} ${keyLabel(k.RIGHT[0] ?? '')} escolhe · ${keyLabel(k.ATTACK[0] ?? '')} confirma · ${keyLabel(k.SPECIAL[0] ?? '')} desfaz`
        : '';
    return `${hint('P1', p1)}      ${hint('P2', p2)}      Controle: A confirma · B desfaz      Esc volta`;
  }
}
