export interface SceneContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  goto: (scene: Scene) => void;
}

export interface Scene {
  init?(ctx: SceneContext): void;
  update(dt: number, now: number): void;
  render(ctx: CanvasRenderingContext2D, now: number, dt: number): void;
  dispose?(): void;
}

export class SceneManager {
  private current: Scene | null = null;
  private base: { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D };
  private sceneCtx: SceneContext;

  constructor(ctx: { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D }) {
    this.base = ctx;
    this.sceneCtx = { ...this.base, goto: (scene: Scene) => this.set(scene) };
  }

  set(scene: Scene): void {
    if (this.current?.dispose) this.current.dispose();
    this.current = scene;
    this.current.init?.(this.sceneCtx);
  }

  update(dt: number, now: number): void {
    this.current?.update(dt, now);
  }

  render(now: number, dt: number): void {
    if (!this.current) return;
    this.current.render(this.base.ctx, now, dt);
  }
}
