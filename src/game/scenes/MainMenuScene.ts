import type { Scene, SceneContext } from "../../engine/scene";
import { clear } from "../../lib/canvas";
import { Input } from "../../lib/input";
import { gameWidth, gameHeight } from "../../engine/layout";
import { LevelSelectScene } from "./LevelSelectScene";
import { UnderConstructionScene } from "./UnderConstructionScene";

type Option = {
  key: string;
  label: string;
  desc?: string;
  rect: { x: number; y: number; w: number; h: number };
  action: () => void;
};

export class MainMenuScene implements Scene {
  private input: Input;
  private ctx!: SceneContext;
  private options: Option[] = [];
  private prevPointerDown = false;

  constructor(input: Input) {
    this.input = input;
  }

  init(ctx: SceneContext): void {
    this.ctx = ctx;
    this.layout();
    this.prevPointerDown = this.input.pointer.down;
  }

  private layout(): void {
    const w = gameWidth();
    const h = gameHeight();
    const bw = Math.min(460, Math.floor(w * 0.8));
    const bh = 72;
    const cx = Math.floor((w - bw) / 2);
    const startY = Math.floor(h / 2) - (bh + 12);
    const gap = 16;
    this.options = [
      {
        key: "1",
        label: "単語当てゲーム",
        desc: "日本語のヒント→英単語を選択",
        rect: { x: cx, y: startY, w: bw, h: bh },
        action: () => this.ctx.goto(new LevelSelectScene(this.input)),
      },
      {
        key: "2",
        label: "（新作）ゲーム",
        desc: "工事中",
        rect: { x: cx, y: startY + (bh + gap), w: bw, h: bh },
        action: () => this.ctx.goto(new UnderConstructionScene(this.input)),
      },
    ];
  }

  private isInside(x: number, y: number, r: { x: number; y: number; w: number; h: number }): boolean {
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  }

  update(): void {
    const justClicked = this.input.pointer.down && !this.prevPointerDown;
    if (justClicked && this.input.pointer.x < gameWidth()) {
      for (const o of this.options) {
        if (this.isInside(this.input.pointer.x, this.input.pointer.y, o.rect)) {
          o.action();
          break;
        }
      }
    }
    if (this.input.keys.has("1")) this.options[0].action();
    if (this.input.keys.has("2")) this.options[1].action();
    this.prevPointerDown = this.input.pointer.down;
  }

  render(ctx: CanvasRenderingContext2D): void {
    clear(ctx, "#0b0d12");
    const w = gameWidth();
    const title = "メインメニュー";
    ctx.save();
    ctx.fillStyle = "#e6e6e6";
    ctx.font = "28px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
    ctx.fillText(title, Math.floor(w / 2 - ctx.measureText(title).width / 2), 80);
    ctx.restore();

    // buttons
    ctx.save();
    for (const o of this.options) {
      ctx.fillStyle = "#1a2333";
      ctx.strokeStyle = "#2e6bff";
      ctx.lineWidth = 2;
      ctx.fillRect(o.rect.x, o.rect.y, o.rect.w, o.rect.h);
      ctx.strokeRect(o.rect.x + 0.5, o.rect.y + 0.5, o.rect.w - 1, o.rect.h - 1);

      ctx.fillStyle = "#e6e6e6";
      ctx.font = "20px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
      const label = `${o.label}  (キー ${o.key})`;
      const tm = ctx.measureText(label);
      ctx.fillText(label, Math.floor(o.rect.x + (o.rect.w - tm.width) / 2), Math.floor(o.rect.y + o.rect.h / 2 - 8));

      if (o.desc) {
        ctx.fillStyle = "#9fb3d9";
        ctx.font = "14px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
        const d = o.desc;
        const dm = ctx.measureText(d);
        ctx.fillText(d, Math.floor(o.rect.x + (o.rect.w - dm.width) / 2), Math.floor(o.rect.y + o.rect.h / 2 + 14));
      }
    }
    ctx.restore();
  }
}
