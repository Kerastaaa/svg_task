import { Shape } from "./Shape.js";
import { escapeSvg, optionalAttribute, parseNumberAttribute } from "./SvgText.js";

export class Rect extends Shape {
  readonly kind = "rect";

  constructor(
    id: string,
    public x: number,
    public y: number,
    public width: number,
    public height: number,
    public fill?: string,
  ) {
    super(id);
  }

  move(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
  }

  scale(factor: number): void {
    this.assertPositiveFactor(factor);
    this.x *= factor;
    this.y *= factor;
    this.width *= factor;
    this.height *= factor;
  }

  setAttribute(name: string, value: string): void {
    if (name === "fill") this.fill = value;
    else if (name === "x") this.x = parseNumberAttribute(name, value);
    else if (name === "y") this.y = parseNumberAttribute(name, value);
    else if (name === "width") this.width = parseNumberAttribute(name, value);
    else if (name === "height") this.height = parseNumberAttribute(name, value);
    else throw new Error(`unknown attribute: ${name}`);
  }

  toSvg(indent = ""): string {
    return `${indent}<rect id="${escapeSvg(this.id)}" x="${this.x}" y="${this.y}" width="${this.width}" height="${this.height}"${optionalAttribute("fill", this.fill)}/>`;
  }

  private assertPositiveFactor(factor: number): void {
    if (!Number.isFinite(factor) || factor <= 0) throw new Error("scale factor must be positive");
  }
}
