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
    public stroke?: string,
    public strokeWidth?: number,
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

  getAttribute(name: string): string | undefined {
    if (name === "fill") return this.fill;
    if (name === "stroke") return this.stroke;
    if (name === "stroke-width") return this.strokeWidth?.toString();
    if (name === "text") return this.content;
    if (name === "x") return this.x.toString();
    if (name === "y") return this.y.toString();
    throw new Error(`unknown attribute: ${name}`);
  }

  setAttribute(name: string, value: string | undefined): void {
    if (name === "fill") this.fill = value;
    else if (name === "stroke") this.stroke = value;
    else if (name === "stroke-width") this.strokeWidth = value === undefined ? undefined : parseNumberAttribute(name, value);
    else if (name === "text") {
      if (value === undefined) throw new Error("attribute cannot be removed: text");
      this.content = value;
    }
    else if (name === "x") this.x = parseNumberAttribute(name, value);
    else if (name === "y") this.y = parseNumberAttribute(name, value);
    else throw new Error(`unknown attribute: ${name}`);
  }

  toSvg(indent = ""): string {
    return `${indent}<text id="${escapeSvg(this.id)}" x="${this.x}" y="${this.y}"${optionalAttribute("fill", this.fill)}${optionalAttribute("stroke", this.stroke)}${optionalAttribute("stroke-width", this.strokeWidth)}>${escapeSvg(this.content)}</text>`;
  }
}
