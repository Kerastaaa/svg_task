import type { Command } from "./Command.js";
import type { Shape } from "../domain/Shape.js";

export type ReorderDirection = "front" | "back";

export class ReorderCommand implements Command {
  private oldIndex: number | undefined;

  constructor(private readonly shape: Shape, private readonly direction: ReorderDirection) {}

  execute(): string {
    const parent = this.shape.parent;
    if (!parent) throw new Error(`shape has no parent: ${this.shape.id}`);
    this.oldIndex ??= parent.indexOf(this.shape);
    const targetIndex = this.direction === "front" ? parent.items.length : 0;
    parent.add(this.shape, targetIndex);
    return `${this.shape.kind}#${this.shape.id} moved to ${this.direction}`;
  }

  undo(): string {
    const parent = this.shape.parent;
    if (!parent || this.oldIndex === undefined) throw new Error("reorder command was not executed");
    parent.add(this.shape, this.oldIndex);
    return `${this.shape.kind}#${this.shape.id} z-order restored`;
  }
}
