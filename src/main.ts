// アプリケーションのエントリポイント
// - Canvas のセットアップ（DPR 対応リサイズ）
// - 入力処理（ポインタ/キーボード）
// - 描画ループ（FPS 計測）

import { createCtx2D, fitCanvasToWindow, clear } from "./lib/canvas";
import { createLoop } from "./lib/loop";
import { Input } from "./lib/input";
import { SceneManager } from "./engine/scene";
import { LevelSelectScene } from "./game/scenes/LevelSelectScene";
import { DEBUG_PANEL_W, gameWidth, isDebugPanelEnabled, setDebugPanelEnabled } from "./engine/layout";

const canvas = document.getElementById("app") as HTMLCanvasElement | null;
if (!canvas) throw new Error("canvas#app が見つかりません");

const ctx = createCtx2D(canvas);
const input = new Input(canvas);

// 初期リサイズ & ウィンドウサイズ変化で更新
let dpr = fitCanvasToWindow(canvas, ctx);
window.addEventListener("resize", () => {
  dpr = fitCanvasToWindow(canvas, ctx);
});

// シーン管理
const sceneManager = new SceneManager({ canvas, ctx });
setDebugPanelEnabled(false);
sceneManager.set(new LevelSelectScene(input));

// 更新処理
let debugVisible = false;
let prevF4 = false;

function update(dt: number, now: number): void {
  // Toggle debug panel with F4 (edge)
  const f4 = input.keys.has("F4");
  if (f4 && !prevF4) {
    debugVisible = !debugVisible;
    setDebugPanelEnabled(debugVisible);
  }
  prevF4 = f4;

  sceneManager.update(dt, now);
}

// オーバーレイ（FPS 等）描画
function renderOverlay(ctx: CanvasRenderingContext2D, fps: number): void {
  ctx.save();
  if (isDebugPanelEnabled()) {
    // Draw right-side debug panel background
    const gx = gameWidth();
    ctx.fillStyle = "#0f1420";
    ctx.fillRect(gx, 0, DEBUG_PANEL_W, window.innerHeight);
    // Divider
    ctx.strokeStyle = "#1f2a3d";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(gx + 0.5, 0);
    ctx.lineTo(gx + 0.5, window.innerHeight);
    ctx.stroke();

    // Debug text inside the panel (Japanese labels)
    ctx.fillStyle = "#e6e6e6";
    ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
    ctx.textBaseline = "top";
    const pad = 10;
    const x = gx + pad;
    const lines = [
      `FPS: ${fps.toFixed(1)}`,
      `ポインタ: ${Math.round(input.pointer.x)}, ${Math.round(input.pointer.y)} ${
        input.pointer.down ? "(押下)" : ""
      }`,
      `DPR: ${dpr}`,
      `押下キー: ${[...input.keys].join(", ")}`,
    ];
    let y = pad;
    for (const line of lines) {
      ctx.fillText(line, x, y);
      y += 16;
    }
  }
  ctx.restore();
}

// 描画処理
function render(
  ctx: CanvasRenderingContext2D,
  now: number,
  dt: number,
  { fps }: { fps: number }
): void {
  clear(ctx, "#0b0d12");
  sceneManager.render(now, dt);

  // ポインタ表示（HUD）
  ctx.save();
  ctx.strokeStyle = input.pointer.down ? "#ff7a7a" : "#4cff85";
  ctx.beginPath();
  ctx.arc(input.pointer.x, input.pointer.y, 8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  renderOverlay(ctx, fps);
}

// タブ非表示時は省電力のため停止
const loop = createLoop({ update, render, ctx });
document.addEventListener("visibilitychange", () => {
  if (document.hidden) loop.stop();
  else {
    fitCanvasToWindow(canvas, ctx);
    loop.start();
  }
});

// 開始
loop.start();
