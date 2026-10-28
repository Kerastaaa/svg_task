import type { Command } from "./Command.js";
import type { Shape } from "../domain/Shape.js";

export class MoveCommand implements Command {
  constructor(private readonly shape: Shape, private readonly dx: number, private readonly dy: number) {}

  execute(): string {
    this.shape.move(this.dx, this.dy);
    return `${this.shape.kind}#${this.shape.id} moved by (${this.dx},${this.dy})`;
  }

  undo(): string {
    this.shape.move(-this.dx, -this.dy);
    return `${this.shape.kind}#${this.shape.id} move undone`;
  }
}
