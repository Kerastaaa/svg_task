import { Shape } from "./Shape.js";
import { escapeSvg, optionalAttribute, parseNumberAttribute } from "./SvgText.js";

export class Text extends Shape {
  readonly kind = "text";

  constructor(
    id: string,
    public x: number,
    public y: number,
    public content: string,
    public fill?: string,
  ) {
    super(id);
  }

  move(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
  }

  scale(factor: number): void {
    if (!Number.isFinite(factor) || factor <= 0) throw new Error("scale factor must be positive");
    this.x *= factor;
    this.y *= factor;
  }

  setAttribute(name: string, value: string): void {
    if (name === "fill") this.fill = value;
    else if (name === "text") this.content = value;
    else if (name === "x") this.x = parseNumberAttribute(name, value);
    else if (name === "y") this.y = parseNumberAttribute(name, value);
    else throw new Error(`unknown attribute: ${name}`);
  }

  toSvg(indent = ""): string {
    return `${indent}<text id="${escapeSvg(this.id)}" x="${this.x}" y="${this.y}"${optionalAttribute("fill", this.fill)}>${escapeSvg(this.content)}</text>`;
  }
}
