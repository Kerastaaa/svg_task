import { Shape } from "./Shape.js";
import { escapeSvg, optionalAttribute, parseNumberAttribute } from "./SvgText.js";

export class Ellipse extends Shape {
  readonly kind = "ellipse";

  constructor(
    id: string,
    public cx: number,
    public cy: number,
    public rx: number,
    public ry: number,
    public fill?: string,
    public stroke?: string,
    public strokeWidth?: number,
  ) {
    super(id);
  }

  move(dx: number, dy: number): void {
    this.cx += dx;
    this.cy += dy;
  }

  scale(factor: number): void {
    this.assertPositiveFactor(factor);
    this.cx *= factor;
    this.cy *= factor;
    this.rx *= factor;
    this.ry *= factor;
  }

  getAttribute(name: string): string | undefined {
    if (name === "fill") return this.fill;
    if (name === "stroke") return this.stroke;
    if (name === "stroke-width") return this.strokeWidth?.toString();
    if (name === "cx") return this.cx.toString();
    if (name === "cy") return this.cy.toString();
    if (name === "rx") return this.rx.toString();
    if (name === "ry") return this.ry.toString();
    throw new Error(`unknown attribute: ${name}`);
  }

  setAttribute(name: string, value: string | undefined): void {
    if (name === "fill") this.fill = value;
    else if (name === "stroke") this.stroke = value;
    else if (name === "stroke-width") this.strokeWidth = value === undefined ? undefined : parseNumberAttribute(name, value);
    else if (name === "cx") this.cx = parseNumberAttribute(name, value);
    else if (name === "cy") this.cy = parseNumberAttribute(name, value);
    else if (name === "rx") this.rx = parseNumberAttribute(name, value);
    else if (name === "ry") this.ry = parseNumberAttribute(name, value);
    else throw new Error(`unknown attribute: ${name}`);
  }

  toSvg(indent = ""): string {
    return `${indent}<ellipse id="${escapeSvg(this.id)}" cx="${this.cx}" cy="${this.cy}" rx="${this.rx}" ry="${this.ry}"${optionalAttribute("fill", this.fill)}${optionalAttribute("stroke", this.stroke)}${optionalAttribute("stroke-width", this.strokeWidth)}/>`;
  }

  private assertPositiveFactor(factor: number): void {
    if (!Number.isFinite(factor) || factor <= 0) throw new Error("scale factor must be positive");
  }
}
