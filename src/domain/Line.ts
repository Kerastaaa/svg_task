import { Shape } from "./Shape.js";
import { escapeSvg, optionalAttribute, parseNumberAttribute } from "./SvgText.js";

export class Line extends Shape {
  readonly kind = "line";

  constructor(
    id: string,
    public x1: number,
    public y1: number,
    public x2: number,
    public y2: number,
    public stroke?: string,
    public fill?: string,
    public strokeWidth?: number,
  ) {
    super(id);
  }

  move(dx: number, dy: number): void {
    this.x1 += dx;
    this.y1 += dy;
    this.x2 += dx;
    this.y2 += dy;
  }

  scale(factor: number): void {
    this.assertPositiveFactor(factor);
    this.x1 *= factor;
    this.y1 *= factor;
    this.x2 *= factor;
    this.y2 *= factor;
  }

  getAttribute(name: string): string | undefined {
    if (name === "fill") return this.fill;
    if (name === "stroke") return this.stroke;
    if (name === "stroke-width") return this.strokeWidth?.toString();
    if (name === "x1") return this.x1.toString();
    if (name === "y1") return this.y1.toString();
    if (name === "x2") return this.x2.toString();
    if (name === "y2") return this.y2.toString();
    throw new Error(`unknown attribute: ${name}`);
  }

  setAttribute(name: string, value: string | undefined): void {
    if (name === "fill") this.fill = value;
    else if (name === "stroke") this.stroke = value;
    else if (name === "stroke-width") this.strokeWidth = value === undefined ? undefined : parseNumberAttribute(name, value);
    else if (name === "x1") this.x1 = parseNumberAttribute(name, value);
    else if (name === "y1") this.y1 = parseNumberAttribute(name, value);
    else if (name === "x2") this.x2 = parseNumberAttribute(name, value);
    else if (name === "y2") this.y2 = parseNumberAttribute(name, value);
    else throw new Error(`unknown attribute: ${name}`);
  }

  toSvg(indent = ""): string {
    return `${indent}<line id="${escapeSvg(this.id)}" x1="${this.x1}" y1="${this.y1}" x2="${this.x2}" y2="${this.y2}"${optionalAttribute("fill", this.fill)}${optionalAttribute("stroke", this.stroke)}${optionalAttribute("stroke-width", this.strokeWidth)}/>`;
  }

  private assertPositiveFactor(factor: number): void {
    if (!Number.isFinite(factor) || factor <= 0) throw new Error("scale factor must be positive");
  }
}
