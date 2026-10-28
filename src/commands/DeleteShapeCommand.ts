import type { Command } from "./Command.js";
import type { DocumentModel } from "../domain/Document.js";
import type { Group } from "../domain/Group.js";
import type { Shape } from "../domain/Shape.js";

export class DeleteShapeCommand implements Command {
  private shape: Shape | undefined;
  private parent: Group | undefined;
  private index: number | undefined;

  constructor(private readonly document: DocumentModel, private readonly id: string) {}

  execute(): string {
    const removed = this.document.remove(this.id);
    this.shape ??= removed.shape;
    this.parent ??= removed.parent;
    this.index ??= removed.index;
    return `${removed.shape.kind}#${removed.shape.id} deleted`;
  }

  undo(): string {
    if (!this.shape || !this.parent || this.index === undefined) throw new Error("delete command was not executed");
    this.parent.add(this.shape, this.index);
    return `${this.shape.kind}#${this.shape.id} restored`;
  }
}
