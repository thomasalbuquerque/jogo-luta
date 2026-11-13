import Phaser from 'phaser';
import { commandSymbols, hitsText, type commandLook } from './command';

/** Tamanho de cada símbolo do comando e o espaço entre eles, em px de mundo. */
const SYMBOL = 13;
const GAP = 2.5;
const INK = 0x14141a;
const UNLIT = 0x6b7280;
const MISS = 0xff3b30;
/** Ticks que o contador fica na tela depois do arremesso, e quantos deles apagando. */
const COUNTER_HOLD = 50;
const COUNTER_FADE = 14;

/**
 * Comando do agarrão com combo (o Meia) em cima da cabeça, e o contador "N HITS" ao
 * lado dele. As setas e os círculos são desenhados num Graphics; as letras dos botões
 * e o contador são textos. Tudo em px de mundo, acima dos lutadores.
 */
export class CommandView {
  private readonly g: Phaser.GameObjects.Graphics;
  private readonly letters: Phaser.GameObjects.Text[] = [];
  private readonly counter: Phaser.GameObjects.Text;
  private hits = 0;
  /** Ticks desde o último golpe do combo. */
  private sinceHit = 0;
  private final = false;

  constructor(
    scene: Phaser.Scene,
    depth: number,
    private readonly color: number,
  ) {
    this.g = scene.add.graphics().setDepth(depth);
    for (let i = 0; i < 2; i++) {
      this.letters.push(
        scene.add
          .text(0, 0, '', {
            fontFamily: 'sans-serif',
            fontSize: '20px',
            fontStyle: 'bold',
            color: '#ffffff',
          })
          .setOrigin(0.5)
          .setScale(0.45)
          .setDepth(depth + 1)
          .setVisible(false),
      );
    }
    this.counter = scene.add
      .text(0, 0, '', {
        fontFamily: 'sans-serif',
        fontSize: '30px',
        fontStyle: 'bold italic',
        color: '#ffd23f',
        stroke: '#1a0a0b',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setAngle(-8)
      .setDepth(depth + 1)
      .setVisible(false);
  }

  /** Um golpe do combo (`n`, a partir de 1); `final`: o arremesso, que fecha o combo. */
  hit(n: number, final: boolean): void {
    this.hits = n;
    this.sinceHit = 0;
    this.final = final;
  }

  /** O combo caiu no meio (quem segurava apanhou): o contador some. */
  drop(): void {
    if (!this.final) this.hits = 0;
  }

  /** Um tick do contador (fica um tempo depois do arremesso e apaga). */
  step(): void {
    this.sinceHit++;
    if (this.final && this.sinceHit > COUNTER_HOLD) {
      this.hits = 0;
      this.final = false;
    }
  }

  clear(): void {
    this.hits = 0;
    this.final = false;
    this.g.clear();
    for (const t of this.letters) t.setVisible(false);
    this.counter.setVisible(false);
  }

  /**
   * Desenha o comando centrado em (`x`, `y`) e o contador na frente do corpo, em
   * (`counterX`, `counterY`). `tick` faz o comando errado tremer.
   */
  draw(
    look: ReturnType<typeof commandLook>,
    x: number,
    y: number,
    facing: -1 | 1,
    tick: number,
    counterX: number,
    counterY: number,
  ): void {
    this.drawCommand(look, x, y, facing, tick);
    const text = hitsText(this.hits);
    this.counter.setVisible(text !== '');
    if (text === '') return;
    this.counter.setText(text);
    // cresce um pouco a cada golpe e dá um pulo quando entra um novo
    const pop = this.sinceHit < 4 ? 1.25 - this.sinceHit * 0.06 : 1;
    const grow = 0.42 + Math.min(this.hits, 12) * 0.025 + (this.final ? 0.08 : 0);
    this.counter.setScale(grow * pop);
    const fadeFrom = COUNTER_HOLD - COUNTER_FADE;
    this.counter.setAlpha(
      this.final && this.sinceHit > fadeFrom ? 1 - (this.sinceHit - fadeFrom) / COUNTER_FADE : 1,
    );
    this.counter.setPosition(counterX, counterY);
  }

  private drawCommand(
    look: ReturnType<typeof commandLook>,
    cx: number,
    cy: number,
    facing: -1 | 1,
    tick: number,
  ): void {
    const g = this.g;
    g.clear();
    for (const t of this.letters) t.setVisible(false);
    if (!look) return;
    const symbols = commandSymbols(facing);
    const width = symbols.length * SYMBOL + (symbols.length - 1) * GAP;
    const x0 = cx - width / 2 + (look.shake ? (tick % 2 === 0 ? 2 : -2) : 0);
    const r = SYMBOL / 2;
    g.setAlpha(look.alpha);
    let letter = 0;
    symbols.forEach((s, i) => {
      const x = x0 + r + i * (SYMBOL + GAP);
      const lit = i < look.lit;
      const ring = look.miss ? MISS : lit ? this.color : UNLIT;
      g.fillStyle(INK, 0.85);
      g.fillCircle(x, cy, r);
      g.lineStyle(1.5, ring, 1);
      g.strokeCircle(x, cy, r - 0.5);
      const ink = lit ? 0xffffff : UNLIT;
      if (s.kind === 'arrow') {
        drawArrow(g, x, cy, s.dir, r * 0.72, look.miss ? MISS : ink);
      } else {
        if (lit) {
          g.fillStyle(look.miss ? MISS : this.color, 0.9);
          g.fillCircle(x, cy, r - 2);
        }
        const t = this.letters[letter++];
        t?.setText(s.label)
          .setPosition(x, cy)
          .setColor(lit ? '#ffffff' : '#9aa0a6')
          .setAlpha(look.alpha)
          .setVisible(true);
      }
    });
    if (look.miss) {
      // o X grande de comando errado por cima de tudo
      const h = SYMBOL * 1.3;
      const w = h * 1.1;
      const mx = x0 + width / 2;
      g.lineStyle(5, INK, 1);
      g.lineBetween(mx - w, cy - h, mx + w, cy + h);
      g.lineBetween(mx - w, cy + h, mx + w, cy - h);
      g.lineStyle(3, MISS, 1);
      g.lineBetween(mx - w, cy - h, mx + w, cy + h);
      g.lineBetween(mx - w, cy + h, mx + w, cy - h);
    }
  }
}

/** Seta com haste e ponta, apontando para `dir` graus, dentro de um raio `size`. */
function drawArrow(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  dir: number,
  size: number,
  color: number,
): void {
  const a = (dir * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  // pontos com a seta apontando para a direita, girados para `dir`
  const pt = (px: number, py: number) => ({ x: x + px * c - py * s, y: y + px * s + py * c });
  const tip = pt(size, 0);
  const left = pt(size * 0.05, -size * 0.75);
  const right = pt(size * 0.05, size * 0.75);
  g.fillStyle(color, 1);
  g.fillTriangle(tip.x, tip.y, left.x, left.y, right.x, right.y);
  g.lineStyle(size * 0.42, color, 1);
  const tail = pt(-size, 0);
  const neck = pt(size * 0.1, 0);
  g.lineBetween(tail.x, tail.y, neck.x, neck.y);
}
