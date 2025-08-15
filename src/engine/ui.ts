import { gameWidth } from "./layout";

export type ButtonRect = { x: number; y: number; w: number; h: number };
export const HEADER_H = 100;

export type HeaderResult = {
  leftRect: ButtonRect | null;
  height: number; // header height (px)
};

export function drawHeader(
  ctx: CanvasRenderingContext2D,
  opts: {
    leftLabel?: string; // e.g., "やめる" / "戻る"
  } = {}
): HeaderResult {
  const gw = gameWidth();
  const H = HEADER_H;

  // bar
  ctx.fillStyle = "#0f1420";
  ctx.fillRect(0, 0, gw, H);

  let leftRect: ButtonRect | null = null;
  if (opts.leftLabel) {
    // button style
    ctx.font = "16px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto";
    const labelW = ctx.measureText(opts.leftLabel).width;
    const padX = 12;
    const padY = 6;
    const bw = Math.floor(labelW + padX * 2);
    const bh = 28;
    const bx = 16;
    const by = 16;
    ctx.fillStyle = "#1a2333";
    ctx.strokeStyle = "#2e6bff";
    ctx.lineWidth = 2;
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    ctx.fillStyle = "#e6e6e6";
    ctx.textBaseline = "middle";
    ctx.fillText(opts.leftLabel, Math.floor(bx + (bw - labelW) / 2), Math.floor(by + bh / 2));
    leftRect = { x: bx, y: by, w: bw, h: bh };
  }

  return { leftRect, height: H };
}
