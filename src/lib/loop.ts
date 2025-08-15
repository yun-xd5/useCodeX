/**
 * requestAnimationFrame ベースのループと FPS 計測
 */

export type LoopOptions = {
  /** 更新処理（秒単位の dt と ms の now を受け取る） */
  update: (dt: number, now: number) => void;
  /** 描画処理（ctx, now, dt, FPS を受け取る） */
  render: (
    ctx: CanvasRenderingContext2D,
    now: number,
    dt: number,
    stats: { fps: number }
  ) => void;
  /** 描画に使う 2D コンテキスト */
  ctx: CanvasRenderingContext2D;
  /** FPS の移動平均を取る秒数（既定: 0.25） */
  fpsWindow?: number;
};

export function createLoop(opts: LoopOptions) {
  const { update, render, ctx } = opts;
  const fpsWindow = Math.max(0.1, opts.fpsWindow ?? 0.25);
  let running = false;
  let rafId = 0;
  let last = performance.now();
  let acc = 0;
  let frames = 0;
  let fps = 0;

  function frame(now: number) {
    if (!running) return;
    const dt = Math.min(0.1, (now - last) / 1000); // 100ms で上限
    last = now;
    update(dt, now);
    render(ctx, now, dt, { fps });

    // FPS サンプリング（移動窓）
    acc += dt;
    frames += 1;
    if (acc >= fpsWindow) {
      fps = frames / acc;
      acc = 0;
      frames = 0;
    }

    rafId = requestAnimationFrame(frame);
  }

  return {
    /** ループ開始 */
    start() {
      if (running) return;
      running = true;
      last = performance.now();
      rafId = requestAnimationFrame(frame);
    },
    /** ループ停止 */
    stop() {
      running = false;
      cancelAnimationFrame(rafId);
    },
    /** 実行中フラグ */
    isRunning() {
      return running;
    },
  } as const;
}

