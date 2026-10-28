import type { Command } from "./Command.js";
import type { Shape } from "../domain/Shape.js";

export class ScaleCommand implements Command {
  constructor(private readonly shape: Shape, private readonly factor: number) {
    if (!Number.isFinite(factor) || factor <= 0) throw new Error("scale factor must be positive");
  }

  execute(): string {
    this.shape.scale(this.factor);
    return `${this.shape.kind}#${this.shape.id} scaled by ${this.factor}`;
  }

  undo(): string {
    this.shape.scale(1 / this.factor);
    return `${this.shape.kind}#${this.shape.id} scale undone`;
  }
}
