import type { Command } from "./Command.js";
import type { Shape } from "../domain/Shape.js";

export class SetAttributeCommand implements Command {
  private oldValue: string | undefined;
  private captured = false;

  constructor(
    private readonly shape: Shape,
    private readonly attribute: string,
    private readonly value: string,
  ) {}

  execute(): string {
    if (!this.captured) {
      this.oldValue = this.shape.getAttribute(this.attribute);
      this.captured = true;
    }
    this.shape.setAttribute(this.attribute, this.value);
    return `${this.shape.kind}#${this.shape.id} updated: ${this.attribute}=${this.value}`;
  }

  undo(): string {
    if (!this.captured) throw new Error("set command was not executed");
    this.shape.setAttribute(this.attribute, this.oldValue);
    return `${this.shape.kind}#${this.shape.id} attribute restored: ${this.attribute}`;
  }
}
