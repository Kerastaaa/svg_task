import type { Command } from "./Command.js";
import type { DocumentModel } from "../domain/Document.js";
import type { Shape } from "../domain/Shape.js";

export class CreateShapeCommand implements Command {
  constructor(
    private readonly document: DocumentModel,
    private readonly shape: Shape,
    private readonly parentId?: string,
  ) {}

  execute(): string {
    this.document.add(this.shape, this.parentId);
    return this.parentId === undefined
      ? `${this.shape.kind}#${this.shape.id} created`
      : `${this.shape.kind}#${this.shape.id} created in g#${this.parentId}`;
  }

  undo(): string {
    this.document.remove(this.shape.id);
    return `${this.shape.kind}#${this.shape.id} creation undone`;
  }
}
