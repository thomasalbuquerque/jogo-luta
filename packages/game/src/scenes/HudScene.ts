import Phaser from 'phaser';
import { getCharacter, type Fighter } from '@jogo-luta/sim';
import { playSfx } from '../audio/sfx';
import { addAudioHint } from '../audio/unlock';
import {
  countdownNumber,
  damageColor,
  formatClock,
  mix,
  specialBar,
  type SpecialStatus,
} from '../render/hud';
import { KoBurstLayer } from '../render/koBurst';
import { pingLabel, pingQuality } from '../net/ping';
import { waitingLabel } from '../net/route';
import { UNSTABLE_MS } from '../net/session';
import type { EdgePoint } from '../render/koEdge';
import { addPortrait } from '../ui/portrait';
import { hasTeams, teamName } from '../match/teams';
import { cssColor, fighterColor, fitWidth, teamColor, UI, uiText } from '../ui/theme';
import type { FightScene } from './FightScene';
import { BELOW_VOLUME_Y } from './VolumeScene';
import { VIEW } from '../render/view';
import { getControls } from '../input/controls';
import { readPads } from '../input/InputManager';
import { QuickControlsView } from '../ui/QuickControlsView';
import type { QuickDevice } from '../ui/quickControls';

/** O % cresce ao levar golpe e volta sozinho (até este tamanho). */
const DAMAGE_POP_MAX = 1.6;
const DAMAGE_POP_RATE = 9;
const PANEL_W = 300;
const PANEL_H = 92;
/** Espaço entre os painéis, com 3 ou 4 lutadores. */
const PANEL_GAP = 12;
/** Com times: espaço a mais entre um time e outro. */
const TEAM_GAP = 28;
const PORTRAIT = 84;
const STOCK_ICON = 26;
/** Online: parado esperando o input de alguém por mais que isto, avisa na tela (ms). */
const WAITING_NOTICE_MS = 400;
/** Cor do ping: bom, médio, ruim. */
const PING_COLORS = { good: '#80ed99', ok: '#ffd166', bad: '#ff5a3c' } as const;
/** Quanto tempo o "LUTA!" fica na tela depois da contagem (ms). */
const GO_MS = 900;
/** Barra do especial: altura e o clarão quando fica pronta (ms). */
const SPECIAL_H = 8;
const SPECIAL_FLASH_MS = 350;
/** Período do brilho pulsando com o especial pronto (ms). */
const SPECIAL_PULSE_MS = 700;
/** Gasto no ar (1 vez por ar): cinza até tocar o chão. */
const SPECIAL_SPENT = 0x6c757d;

/** Barra de recarga do especial no painel, na cor do jogador. */
interface SpecialGauge {
  g: Phaser.GameObjects.Graphics;
  x: number;
  y: number;
  w: number;
  color: number;
  /** Situação no frame anterior (para o clarão quando fica pronta). */
  status: SpecialStatus;
  flashMs: number;
}

interface Panel {
  damage: Phaser.GameObjects.Text;
  portrait: Phaser.GameObjects.Image;
  stocks: Phaser.GameObjects.Image[];
  special: SpecialGauge | null;
}

/**
 * HUD por cima da luta, com câmera própria (sem zoom): painel de cada jogador
 * (retrato, % de dano que esquenta conforme sobe, stocks), tempo, contagem
 * "3, 2, 1, LUTA!" e a explosão do KO na borda da tela. Online, também o ping
 * e os avisos de conexão (esperando o outro jogador, reconectando, dessincronizou).
 */
export class HudScene extends Phaser.Scene {
  private panels: Panel[] = [];
  private clock!: Phaser.GameObjects.Text;
  private countdown!: Phaser.GameObjects.Text;
  private replayTag!: Phaser.GameObjects.Text;
  private replayMs = 0;
  /** Online: ping e atraso de input, no canto. */
  private netText!: Phaser.GameObjects.Text;
  /** Online: aviso de conexão no meio da tela. */
  private netBanner!: Phaser.GameObjects.Text;
  private desyncTag!: Phaser.GameObjects.Text;
  private koBursts!: KoBurstLayer;
  /** Último % mostrado e tamanho atual do texto, por jogador. */
  private shownDamage: number[] = [];
  private pop: number[] = [];
  /** Último número da contagem mostrado (0 = nenhum). */
  private shownCount = 0;
  private goMs = 0;
  /** Relógio do brilho das barras de especial prontas (ms). */
  private pulseMs = 0;
  /** Cola de comandos no canto (Tab ou Select abre). */
  private quick!: QuickControlsView;

  constructor() {
    super('hud');
  }

  create(): void {
    const { width, height } = VIEW;
    const fighters = this.fight.state.fighters;
    // por baixo do resto do HUD
    this.koBursts = new KoBurstLayer(this);
    addAudioHint(this);
    this.shownDamage = fighters.map((f) => f.damage);
    this.pop = fighters.map(() => 1);
    this.shownCount = 0;
    this.goMs = 0;
    const n = fighters.length;
    const y = height - PANEL_H - 14;
    if (hasTeams(fighters)) {
      this.panels = this.drawTeamPanels(fighters, y);
    } else {
      // com 2, um de cada lado; com mais, lado a lado e centralizados (4 cabem na largura)
      const row = n * PANEL_W + (n - 1) * PANEL_GAP;
      this.panels = fighters.map((f, i) => {
        const x =
          n === 2
            ? (width * (i + 1)) / 3 + (i === 0 ? -70 : 70) - PANEL_W / 2
            : (width - row) / 2 + i * (PANEL_W + PANEL_GAP);
        return this.drawPanel(f, x, y);
      });
    }
    this.clock = uiText(this, width / 2, 14, '', {
      fontFamily: UI.titleFont,
      fontSize: '30px',
      stroke: '#0b0e16',
      strokeThickness: 6,
    }).setOrigin(0.5, 0);
    uiText(
      this,
      width - 14,
      BELOW_VOLUME_Y,
      this.fight.net ? 'Esc · Start: menu' : 'Esc · Start: pausa',
      {
        fontSize: '14px',
        color: '#e9ecef',
        stroke: '#0b0e16',
        strokeThickness: 4,
      },
    )
      .setOrigin(1, 0)
      .setAlpha(0.75);
    this.netText = uiText(this, width - 14, BELOW_VOLUME_Y + 22, '', {
      fontSize: '15px',
      fontStyle: 'bold',
      stroke: '#0b0e16',
      strokeThickness: 4,
    }).setOrigin(1, 0);
    this.netBanner = uiText(this, width / 2, 120, '', {
      fontFamily: UI.titleFont,
      fontSize: '26px',
      color: '#ffd166',
      stroke: '#0b0e16',
      strokeThickness: 7,
    })
      .setOrigin(0.5, 0)
      .setVisible(false);
    this.desyncTag = uiText(this, width / 2, 56, 'DESSINCRONIZOU', {
      fontFamily: UI.titleFont,
      fontSize: '18px',
      color: '#ff5a3c',
      stroke: '#0b0e16',
      strokeThickness: 6,
    })
      .setOrigin(0.5, 0)
      .setVisible(false);
    // assistindo a um replay: etiqueta piscando embaixo do relógio
    this.replayTag = uiText(this, width / 2, 56, '● REPLAY', {
      fontFamily: UI.titleFont,
      fontSize: '22px',
      color: '#ff5a3c',
      stroke: '#0b0e16',
      strokeThickness: 6,
    })
      .setOrigin(0.5, 0)
      .setVisible(false);
    this.replayMs = 0;
    this.countdown = uiText(this, width / 2, height / 2 - 40, '', {
      fontFamily: UI.titleFont,
      fontSize: '150px',
      color: '#ffd166',
      stroke: '#0b0e16',
      strokeThickness: 18,
    })
      .setOrigin(0.5)
      .setVisible(false);
    // online, este PC é um jogador só (qualquer teclado vale): mostra só as teclas do P1
    this.quick = new QuickControlsView(this, getControls, this.fight.net ? [0] : [0, 1], () =>
      readPads().length > 0 ? 'pad' : 'keyboard',
    );
    // Tab é reservada (nenhum botão do jogo usa); sem o capture, o navegador troca o foco
    this.input.keyboard?.addCapture('TAB');
    this.input.keyboard?.on('keydown-TAB', (e: KeyboardEvent) => {
      if (!e.repeat) this.quick.toggle('keyboard');
    });
  }

  /** Abre (ou fecha) a cola de comandos, com os botões do aparelho que apertou. */
  toggleQuickControls(device: QuickDevice): void {
    this.quick.toggle(device);
  }

  private get fight(): FightScene {
    return this.scene.get('fight') as FightScene;
  }

  /**
   * Com times: os painéis agrupados por time (o time 0 à esquerda), com um
   * espaço entre os times e o nome do time em cima de cada grupo. Devolve os
   * painéis na ordem dos lutadores.
   */
  private drawTeamPanels(fighters: readonly Fighter[], y: number): Panel[] {
    const order = [...fighters].sort((a, b) => a.team - b.team || a.id - b.id);
    const groups = new Set(order.map((f) => f.team)).size;
    const row = order.length * PANEL_W + (order.length - 1) * PANEL_GAP + (groups - 1) * TEAM_GAP;
    const panels: Panel[] = [];
    let x = (VIEW.width - row) / 2;
    let groupX = x;
    for (const [i, f] of order.entries()) {
      panels[f.id] = this.drawPanel(f, x, y);
      const next = order[i + 1];
      if (next?.team === f.team) {
        x += PANEL_W + PANEL_GAP;
        continue;
      }
      // fim do grupo: nome do time centralizado em cima dele
      const groupW = x + PANEL_W - groupX;
      uiText(this, groupX + groupW / 2, y - 6, teamName(f.team), {
        fontFamily: UI.titleFont,
        fontSize: '17px',
        color: cssColor(teamColor(f.team)),
        stroke: '#0b0e16',
        strokeThickness: 5,
      }).setOrigin(0.5, 1);
      x += PANEL_W + PANEL_GAP + TEAM_GAP;
      groupX = x;
    }
    return panels;
  }

  /** Painel de um jogador: retrato num círculo da cor dele (ou do time), nome, % e stocks. */
  private drawPanel(f: Fighter, x: number, y: number): Panel {
    const color = fighterColor(this.fight.state.fighters, f.id);
    const c = getCharacter(f.character);
    const g = this.add.graphics();
    g.fillStyle(0x0b0e16, 0.72);
    g.fillRoundedRect(x, y, PANEL_W, PANEL_H, 18);
    g.lineStyle(3, color, 1);
    g.strokeRoundedRect(x, y, PANEL_W, PANEL_H, 18);
    const px = x + 8 + PORTRAIT / 2;
    const py = y + PANEL_H / 2 - 6;
    g.fillStyle(color, 1);
    g.fillCircle(px, py, PORTRAIT / 2);
    g.fillStyle(0x0b0e16, 0.35);
    g.fillCircle(px, py, PORTRAIT / 2 - 4);
    const portrait = addPortrait(this, f.character, px, py - 4, PORTRAIT + 8);
    const you = this.fight.net?.match?.local === f.id ? ' VOCÊ' : '';
    uiText(this, px, y + PANEL_H - 6, `P${String(f.id + 1)}${you}`, {
      fontFamily: UI.titleFont,
      fontSize: '18px',
      color: '#0b0e16',
      backgroundColor: cssColor(color),
      padding: { x: 6, y: 0 },
    }).setOrigin(0.5, 1);
    // em cima: o nome de quem joga (na cor dele) e o lutador; sem nome, só o lutador
    const nameX = x + PORTRAIT + 22;
    const nameW = x + PANEL_W - 14 - nameX;
    const player = this.fight.names[f.id];
    const top = uiText(this, nameX, y + 10, (player ?? c.name).toUpperCase(), {
      fontSize: '16px',
      fontStyle: 'bold',
      color: cssColor(color),
    });
    fitWidth(top, nameW);
    if (player) {
      const fighter = uiText(this, nameX + top.displayWidth + 8, y + 12, c.name.toUpperCase(), {
        fontSize: '13px',
        fontStyle: 'bold',
        color: UI.muted,
      });
      // sem espaço para o lutador ao lado do nome: fica só o nome
      if (fighter.x + fighter.width > nameX + nameW) fighter.destroy();
    }
    // na base do painel, embaixo dos stocks e do % (que fica por cima quando pula)
    const bar = specialBar(f);
    const special: SpecialGauge | null = bar && {
      g: this.add.graphics(),
      x: x + PORTRAIT + 22,
      y: y + PANEL_H - SPECIAL_H - 8,
      w: PANEL_W - PORTRAIT - 42,
      color,
      status: bar.status,
      flashMs: 0,
    };
    const damage = uiText(this, x + PANEL_W - 14, y + 46, '0%', {
      fontFamily: UI.titleFont,
      fontSize: '42px',
      stroke: '#0b0e16',
      strokeThickness: 7,
    }).setOrigin(1, 0.5);
    const total = this.fight.state.rules.stocks;
    const stocks = Array.from({ length: total }, (_, s) =>
      addPortrait(
        this,
        f.character,
        x + PORTRAIT + 22 + STOCK_ICON / 2 + s * (STOCK_ICON + 4),
        y + PANEL_H - 32,
        STOCK_ICON,
      ),
    );
    return { damage, portrait, stocks, special };
  }

  /**
   * Barra do especial: enche na cor do jogador (mais escura) enquanto recarrega;
   * pronta, fica na cor cheia com um contorno branco pulsando e dá um clarão ao
   * encher. Gasto no ar (1 vez por ar), fica cinza até tocar o chão.
   */
  private drawSpecial(s: SpecialGauge, f: Fighter, out: boolean, delta: number): void {
    const bar = specialBar(f);
    if (!bar) return;
    if (bar.status === 'ready' && s.status !== 'ready') s.flashMs = SPECIAL_FLASH_MS;
    s.status = bar.status;
    s.flashMs = Math.max(0, s.flashMs - delta);
    const { g, x, y, w } = s;
    const h = SPECIAL_H;
    g.clear().setAlpha(out ? 0.35 : 1);
    // trilho
    g.fillStyle(0x000000, 0.6);
    g.fillRoundedRect(x - 2, y - 2, w + 4, h + 4, (h + 4) / 2);
    const ready = bar.status === 'ready';
    const pulse = 0.5 + 0.5 * Math.sin((this.pulseMs / SPECIAL_PULSE_MS) * Math.PI * 2);
    let fillColor = mix(s.color, 0x0b0e16, 0.35);
    if (ready) fillColor = mix(s.color, 0xffffff, 0.2 * pulse);
    else if (bar.status === 'spent') fillColor = SPECIAL_SPENT;
    const fw = w * bar.fill;
    if (fw >= 1) {
      const r = Math.min(h / 2, fw / 2);
      g.fillStyle(fillColor, 1);
      g.fillRoundedRect(x, y, fw, h, r);
      // reflexo em cima
      g.fillStyle(0xffffff, ready ? 0.35 : 0.18);
      g.fillRoundedRect(x + r / 2, y + 1, Math.max(0, fw - r), h / 3, Math.min(h / 6, fw / 2));
    }
    if (ready) {
      g.lineStyle(2, 0xffffff, 0.25 + 0.4 * pulse);
      g.strokeRoundedRect(x - 3, y - 3, w + 6, h + 6, (h + 6) / 2);
    }
    if (s.flashMs > 0) {
      const k = s.flashMs / SPECIAL_FLASH_MS;
      g.fillStyle(0xffffff, 0.9 * k);
      g.fillRoundedRect(x - 4 * k, y - 4 * k, w + 8 * k, h + 8 * k, (h + 8 * k) / 2);
    }
  }

  /** Explosão do KO na borda da tela (px de tela), na cor do jogador. */
  koBurst(at: EdgePoint, color: number): void {
    this.koBursts.spawn(at, color);
  }

  override update(_time: number, delta: number): void {
    const state = this.fight.state;
    this.koBursts.update(delta);
    this.quick.update(delta);
    this.pulseMs = (this.pulseMs + delta) % SPECIAL_PULSE_MS;
    for (const [i, panel] of this.panels.entries()) {
      const f = state.fighters[i];
      if (!f) continue;
      // levou dano: o % pula de tamanho, proporcional ao golpe
      const shown = this.shownDamage[i] ?? 0;
      let pop = this.pop[i] ?? 1;
      if (f.damage > shown) pop = Math.min(pop + 0.15 + (f.damage - shown) * 0.03, DAMAGE_POP_MAX);
      pop = 1 + (pop - 1) * Math.exp(-DAMAGE_POP_RATE * (delta / 1000));
      this.shownDamage[i] = f.damage;
      this.pop[i] = pop;
      const out = f.state === 'ko';
      panel.damage
        .setScale(pop)
        .setText(`${String(f.damage)}%`)
        .setColor(cssColor(damageColor(f.damage)))
        .setAlpha(out ? 0.35 : 1);
      panel.portrait.setAlpha(f.stocks > 0 ? 1 : 0.35);
      if (panel.special) this.drawSpecial(panel.special, f, out || f.stocks === 0, delta);
      panel.stocks.forEach((icon, s) => {
        const alive = s < f.stocks;
        icon.setTint(alive ? 0xffffff : 0x000000).setAlpha(alive ? 1 : 0.3);
      });
    }
    if (state.suddenDeath) {
      this.clock.setText('MORTE SÚBITA');
    } else {
      this.clock.setText(state.rules.timeLimitTicks > 0 ? formatClock(state.timeLeft) : '');
    }
    this.updateCountdown(delta);
    this.updateNet();
    this.replayMs += delta;
    this.replayTag
      .setVisible(this.fight.playback !== null)
      .setAlpha(this.replayMs % 1200 < 800 ? 1 : 0.35);
  }

  /** Online: ping no canto e, se a conexão engasgar, o aviso no meio da tela. */
  private updateNet(): void {
    const fight = this.fight;
    const net = fight.net;
    const match = fight.onlineMatch;
    this.netText.setVisible(net !== null);
    this.desyncTag.setVisible(Boolean(match?.desync.first));
    if (!net) {
      this.netBanner.setVisible(false);
      return;
    }
    const delay = match ? ` · atraso ${String(match.delay)}f` : '';
    const relay = net.route === 'relay' ? ' · relay' : '';
    this.netText
      .setText(`${pingLabel(net.ping.rtt)}${delay}${relay}`)
      .setColor(PING_COLORS[pingQuality(net.ping.rtt)]);

    let banner = '';
    if (net.status === 'reconnecting') {
      banner = `Reconectando… ${String(Math.ceil(net.reconnectLeftMs / 1000))} s`;
    } else if (!net.ended && match && !fight.ended) {
      if (net.silentMs > UNSTABLE_MS) banner = 'Conexão instável…';
      else if (fight.stalledMs > WAITING_NOTICE_MS) {
        banner = waitingLabel(match.characters.length, match.lockstep.waiting(), net.matchNames());
      }
    }
    // quem entrou ou saiu da sala, quando não há aviso de conexão
    if (!banner) banner = net.notice;
    this.netBanner.setVisible(banner !== '').setText(banner);
  }

  /** "3, 2, 1" enquanto o sim conta, e "LUTA!" quando a luta começa. */
  private updateCountdown(delta: number): void {
    const state = this.fight.state;
    const total = state.rules.countdownTicks ?? 0;
    const n = state.phase === 'countdown' ? countdownNumber(state.countdown, total) : 0;
    if (n !== this.shownCount) {
      if (n > 0) {
        this.flashCountdown(String(n), '#ffd166');
        playSfx(this, 'count');
      } else if (this.shownCount > 0 && state.phase === 'fight') {
        this.flashCountdown('LUTA!', '#ff5a3c');
        playSfx(this, 'go');
        this.goMs = GO_MS;
      }
      this.shownCount = n;
    }
    if (n === 0 && this.goMs > 0) {
      this.goMs -= delta;
      this.countdown.setAlpha(Math.min(1, this.goMs / 300));
      if (this.goMs <= 0) this.countdown.setVisible(false);
    }
    if (n === 0 && this.goMs <= 0) this.countdown.setVisible(false);
  }

  private flashCountdown(text: string, color: string): void {
    const t = this.countdown;
    this.tweens.killTweensOf(t);
    t.setText(text).setColor(color).setVisible(true).setAlpha(1).setScale(2.2);
    this.tweens.add({ targets: t, scale: 1, duration: 260, ease: 'Back.Out' });
  }
}
