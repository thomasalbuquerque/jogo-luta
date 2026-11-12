import Phaser from 'phaser';
import { getCharacter, STAGES } from '@jogo-luta/sim';
import { playSfx } from '../audio/sfx';
import { addAudioHint } from '../audio/unlock';
import { Menu } from '../input/menu';
import { MenuInput } from '../input/menuInput';
import {
  fitTeams,
  FREE_FOR_ALL,
  MIN_TEAM_PLAYERS,
  splitIndex,
  TEAM_NAMES,
  teamSplits,
  type TeamSetup,
} from '../match/teams';
import { getOnline } from '../net/online';
import { netLabel, onlineRoute } from '../net/route';
import type { OnlineSession } from '../net/session';
import { cssColor, fadeIn, panel, teamColor, titleText, UI, uiText } from '../ui/theme';
import type { BackdropData } from './BackdropScene';
import type { MatchSetup } from './FightScene';

const PLAYERS = 2;
/** Miniatura do mapa (16:9, como a tela). */
const THUMB_W = 720;
const THUMB_H = 405;
const THUMB_Y = 110;
/** Com as opções de time (3 ou 4 jogadores), a miniatura vai para a esquerda e as opções à direita. */
const THUMB_X_WITH_OPTIONS = 48;
const OPTIONS_X = 812;
const OPTIONS_W = 420;
const ROW_H = 54;

/** Nome e descrição de cada mapa (o sim só conhece o id). */
const STAGE_INFO: Readonly<Record<string, { name: string; blurb: string }>> = {
  test: {
    name: 'Laje',
    blurb: 'Laje no fim de tarde, com 2 tábuas para subir. Caiu do prédio, perdeu a vida.',
  },
};

export function stageName(id: string): string {
  return STAGE_INFO[id]?.name ?? id;
}

/** Linhas do painel de opções (só as que valem agora). */
type OptionRow = 'stage' | 'mode' | 'split' | 'friendlyFire';

/**
 * Seleção de mapa: um cursor só, qualquer jogador mexe. ←/→ troca (quando houver
 * mais de um), Ataque/Pulo/Enter luta, Especial/Esc volta para os personagens.
 * Online, quem escolhe é o host (P1); os outros veem a escolha.
 *
 * Com 3 ou 4 jogadores, um painel ao lado tem as opções da luta: todos contra
 * todos ou times, como dividir os times e o fogo amigo. ↑/↓ escolhe a linha,
 * ←/→ muda o valor.
 */
export class StageSelectScene extends Phaser.Scene {
  private controls!: MenuInput;
  private setup: MatchSetup = { characters: [], stageId: '' };
  private index = 0;
  private team: TeamSetup = FREE_FOR_ALL;
  /** Última divisão de times escolhida (volta nela ao ligar os times de novo). */
  private split = 0;
  private row = 0;
  private name!: Phaser.GameObjects.Text;
  private blurb!: Phaser.GameObjects.Text;
  private arrows: Phaser.GameObjects.Text[] = [];
  private optionsGfx: Phaser.GameObjects.Graphics | null = null;
  private optionTexts: Phaser.GameObjects.Text[] = [];
  /** Sala online (null = jogo local). */
  private net: OnlineSession | null = null;
  private netText: Phaser.GameObjects.Text | null = null;

  constructor() {
    super('stage');
  }

  init(data: Partial<MatchSetup>): void {
    this.index = Math.max(
      0,
      STAGES.findIndex((s) => s.id === data.stageId),
    );
    const characters = data.characters ?? [];
    this.setup = { characters, stageId: STAGES[this.index]?.id ?? '' };
    this.team = fitTeams(
      { teams: data.teams ? [...data.teams] : null, friendlyFire: data.friendlyFire === true },
      characters.length,
    );
    this.split = Math.max(0, this.team.teams ? splitIndex(this.team.teams) : 0);
    this.row = 0;
    this.net = getOnline();
    this.netText = null;
    this.optionsGfx = null;
    this.optionTexts = [];
  }

  /** Tem opções de time: 3 ou 4 jogadores. */
  private get hasOptions(): boolean {
    return this.setup.characters.length >= MIN_TEAM_PLAYERS;
  }

  /** Este lado escolhe (local, ou o host online). */
  private get picks(): boolean {
    return !this.net || this.net.role === 'host';
  }

  private get thumbX(): number {
    return this.hasOptions ? THUMB_X_WITH_OPTIONS : (this.scale.width - THUMB_W) / 2;
  }

  create(): void {
    this.controls = new MenuInput();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.controls.destroy();
      this.scene.stop('backdrop');
    });
    fadeIn(this);
    addAudioHint(this, 2);
    const { width, height } = this.scale;
    titleText(this, width / 2, 50, 'ESCOLHA O MAPA', 38);

    const x = this.thumbX;
    const cx = x + THUMB_W / 2;
    // a miniatura é a cena do fundo (atrás desta): o painel deixa o buraco dela
    const g = this.add.graphics();
    panel(g, x - 12, THUMB_Y + THUMB_H, THUMB_W + 24, 120, UI.panel, 1, 16);
    g.fillRect(x - 12, THUMB_Y + THUMB_H, THUMB_W + 24, 20);
    g.lineStyle(12, UI.panel, 1);
    g.strokeRect(x - 6, THUMB_Y - 6, THUMB_W + 12, THUMB_H + 12);
    g.lineStyle(4, UI.accent, 1);
    g.strokeRect(x - 2, THUMB_Y - 2, THUMB_W + 4, THUMB_H + 4);

    this.name = uiText(this, cx, THUMB_Y + THUMB_H + 30, '', {
      fontFamily: UI.titleFont,
      fontSize: '32px',
    }).setOrigin(0.5);
    this.blurb = uiText(this, cx, THUMB_Y + THUMB_H + 74, '', {
      fontSize: '18px',
      color: '#ced4da',
      align: 'center',
      wordWrap: { width: THUMB_W - 20 },
    }).setOrigin(0.5);
    // com o painel de opções, o mapa troca pela linha "Mapa"
    if (STAGES.length > 1 && !this.hasOptions) {
      this.arrows = [-1, 1].map((side) =>
        uiText(this, cx + side * (THUMB_W / 2 + 50), THUMB_Y + THUMB_H / 2, side < 0 ? '◀' : '▶', {
          fontSize: '44px',
          color: '#ffd166',
        }).setOrigin(0.5),
      );
    }
    if (this.hasOptions) this.optionsGfx = this.add.graphics();
    if (this.net) {
      this.netText = uiText(this, width - 16, 14, netLabel(this.net), {
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#ced4da',
      }).setOrigin(1, 0);
    }
    const options = this.hasOptions ? '↑ ↓ ← →: opções da luta      ' : '';
    const hint = this.picks
      ? `${options}Ataque, Pulo ou Enter: lutar      Especial ou Esc: trocar lutador`
      : 'O P1 escolhe o mapa e as opções e começa a luta      Especial ou Esc: trocar lutador';
    uiText(this, width / 2, height - 22, hint, { fontSize: '15px', color: UI.muted }).setOrigin(
      0.5,
    );
    this.show();
  }

  override update(_time: number, delta: number): void {
    const net = this.net;
    if (net) {
      const route = onlineRoute(net, 'stage');
      if (route) {
        this.scene.start(route.scene, route.data);
        return;
      }
      this.netText?.setText(netLabel(net));
      this.followHost(net);
    }
    const actions = this.controls.poll(PLAYERS, delta).any;
    if (actions & Menu.BACK) {
      playSfx(this, 'ui_back');
      // online: a sala inteira volta para a seleção (quem entrou pede ao host)
      if (net) net.openSelect();
      else this.scene.start('select', this.fullSetup());
      return;
    }
    if (!this.picks) return;
    if (this.hasOptions) this.moveOptions(actions);
    else if (STAGES.length > 1 && actions & (Menu.LEFT | Menu.RIGHT)) {
      this.changeStage(actions & Menu.LEFT ? -1 : 1);
    }
    if (actions & (Menu.CONFIRM | Menu.START)) {
      playSfx(this, 'ui_confirm');
      if (net) net.startMatch(this.setup.characters, this.setup.stageId, this.team);
      else this.scene.start('fight', this.fullSetup());
    }
  }

  /** O que foi escolhido aqui: personagens, mapa e times. */
  private fullSetup(): MatchSetup {
    return { ...this.setup, teams: this.team.teams, friendlyFire: this.team.friendlyFire };
  }

  /** Online: o host trocou o mapa ou as opções: mostra o mesmo aqui. */
  private followHost(net: OnlineSession): void {
    const screen = net.screen;
    if (screen?.name !== 'stage' || this.picks) return;
    const stageChanged = screen.stageId !== this.setup.stageId;
    const teamsChanged =
      (screen.teams?.join() ?? '') !== (this.team.teams?.join() ?? '') ||
      screen.friendlyFire !== this.team.friendlyFire;
    if (!stageChanged && !teamsChanged) return;
    this.index = Math.max(
      0,
      STAGES.findIndex((s) => s.id === screen.stageId),
    );
    this.team = { teams: screen.teams, friendlyFire: screen.friendlyFire };
    if (screen.teams) this.split = Math.max(0, splitIndex(screen.teams));
    if (stageChanged) this.show();
    else this.drawOptions();
  }

  /** Linhas do painel agora (os times só aparecem com o modo times). */
  private rows(): OptionRow[] {
    const rows: OptionRow[] = [];
    if (STAGES.length > 1) rows.push('stage');
    rows.push('mode');
    if (this.team.teams) rows.push('split', 'friendlyFire');
    return rows;
  }

  /** ↑/↓ troca a linha; ←/→ muda o valor dela. */
  private moveOptions(actions: number): void {
    const rows = this.rows();
    if (actions & (Menu.UP | Menu.DOWN)) {
      const n = rows.length;
      this.row = (this.row + (actions & Menu.UP ? n - 1 : 1)) % n;
      playSfx(this, 'ui_move');
      this.drawOptions();
    }
    if (!(actions & (Menu.LEFT | Menu.RIGHT))) return;
    const step = actions & Menu.LEFT ? -1 : 1;
    const row = rows[this.row];
    if (row === 'stage') {
      this.changeStage(step);
      return;
    }
    const players = this.setup.characters.length;
    const splits = teamSplits(players);
    if (row === 'mode') {
      this.team = this.team.teams
        ? { ...this.team, teams: null }
        : { ...this.team, teams: splits[this.split] ?? splits[0] ?? null };
    } else if (row === 'split') {
      this.split = (this.split + step + splits.length) % splits.length;
      this.team = { ...this.team, teams: splits[this.split] ?? null };
    } else if (row === 'friendlyFire') {
      this.team = { ...this.team, friendlyFire: !this.team.friendlyFire };
    }
    playSfx(this, 'ui_move');
    this.drawOptions();
    this.net?.openStage(this.setup.characters, this.setup.stageId, this.team);
  }

  private changeStage(step: number): void {
    const n = STAGES.length;
    this.index = (this.index + step + n) % n;
    playSfx(this, 'ui_move');
    this.show();
    this.net?.openStage(this.setup.characters, this.setup.stageId, this.team);
  }

  /** Mostra o mapa escolhido: o cenário de verdade na miniatura, nome e descrição. */
  private show(): void {
    const stage = STAGES[this.index];
    if (!stage) return;
    this.setup = { ...this.setup, stageId: stage.id };
    this.name.setText(stageName(stage.id));
    this.blurb.setText(STAGE_INFO[stage.id]?.blurb ?? '');
    const viewport = { x: this.thumbX, y: THUMB_Y, w: THUMB_W, h: THUMB_H };
    this.scene.stop('backdrop');
    this.scene.launch('backdrop', { stageId: stage.id, viewport } satisfies BackdropData);
    this.drawOptions();
  }

  /** Painel de opções: cada linha com o valor, e embaixo quem está em cada time. */
  private drawOptions(): void {
    const g = this.optionsGfx;
    if (!g) return;
    g.clear();
    for (const t of this.optionTexts) t.destroy();
    this.optionTexts = [];
    const text = (
      x: number,
      y: number,
      value: string,
      style: Phaser.Types.GameObjects.Text.TextStyle,
    ) => {
      const t = uiText(this, x, y, value, style);
      this.optionTexts.push(t);
      return t;
    };
    const x = OPTIONS_X;
    const right = x + OPTIONS_W;
    panel(g, x, THUMB_Y - 6, OPTIONS_W, THUMB_H + 132, UI.panel, 1, 16);
    text(x + 20, THUMB_Y + 10, 'OPÇÕES DA LUTA', {
      fontFamily: UI.titleFont,
      fontSize: '22px',
      color: '#ffd166',
    });

    const rows = this.rows();
    this.row = Math.min(this.row, rows.length - 1);
    const teams = this.team.teams;
    const players = this.setup.characters.length;
    let y = THUMB_Y + 56;
    for (const [i, row] of rows.entries()) {
      const selected = this.picks && i === this.row;
      if (selected) {
        g.fillStyle(0x0b0e16, 0.5);
        g.fillRoundedRect(x + 10, y, OPTIONS_W - 20, ROW_H - 8, 10);
        g.lineStyle(3, UI.accent, 1);
        g.strokeRoundedRect(x + 10, y, OPTIONS_W - 20, ROW_H - 8, 10);
      }
      const label = {
        stage: 'Mapa',
        mode: 'Modo',
        split: 'Times',
        friendlyFire: 'Fogo amigo',
      }[row];
      const value = {
        stage: stageName(this.setup.stageId),
        mode: teams ? (players === 4 ? '2 contra 2' : '2 contra 1') : 'Todos contra todos',
        split: `Divisão ${String(this.split + 1)} de ${String(teamSplits(players).length)}`,
        friendlyFire: this.team.friendlyFire ? 'Ligado' : 'Desligado',
      }[row];
      const mid = y + (ROW_H - 8) / 2;
      text(x + 26, mid, label, { fontSize: '18px', color: UI.muted }).setOrigin(0, 0.5);
      text(right - 26, mid, selected ? `◀  ${value}  ▶` : value, {
        fontSize: '19px',
        fontStyle: 'bold',
      }).setOrigin(1, 0.5);
      y += ROW_H;
    }

    // quem está em cada time (ou a lista de todos, cada um por si)
    y += 10;
    if (!teams) {
      text(x + 26, y, 'Cada um por si: o último de pé vence.', {
        fontSize: '16px',
        color: '#ced4da',
        wordWrap: { width: OPTIONS_W - 52 },
      });
      return;
    }
    for (const team of [0, 1]) {
      const color = teamColor(team);
      text(x + 26, y, `TIME ${TEAM_NAMES[team] ?? ''}`, {
        fontFamily: UI.titleFont,
        fontSize: '18px',
        color: cssColor(color),
      });
      y += 28;
      teams.forEach((t, p) => {
        if (t !== team) return;
        const id = this.setup.characters[p] ?? '';
        g.fillStyle(color, 1);
        g.fillCircle(x + 34, y + 11, 6);
        text(x + 48, y, `P${String(p + 1)}  ${id ? getCharacter(id).name : ''}`, {
          fontSize: '17px',
          fontStyle: 'bold',
        });
        y += 26;
      });
      y += 8;
    }
    text(
      x + 26,
      y,
      this.team.friendlyFire
        ? 'Golpes acertam o companheiro também.'
        : 'Golpes atravessam o companheiro.',
      { fontSize: '15px', color: UI.muted },
    );
  }
}
