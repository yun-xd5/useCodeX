import type { Vec2 } from "./math";

export class Camera2D {
  position: Vec2 = { x: 0, y: 0 };
  zoom = 1;

  begin(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(Math.floor(-this.position.x), Math.floor(-this.position.y));
  }

  end(ctx: CanvasRenderingContext2D): void {
    ctx.restore();
  }
}

