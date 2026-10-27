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

  setAttribute(name: string, value: string): void {
    if (name === "fill") this.fill = value;
    else if (name === "cx") this.cx = parseNumberAttribute(name, value);
    else if (name === "cy") this.cy = parseNumberAttribute(name, value);
    else if (name === "rx") this.rx = parseNumberAttribute(name, value);
    else if (name === "ry") this.ry = parseNumberAttribute(name, value);
    else throw new Error(`unknown attribute: ${name}`);
  }

  toSvg(indent = ""): string {
    return `${indent}<ellipse id="${escapeSvg(this.id)}" cx="${this.cx}" cy="${this.cy}" rx="${this.rx}" ry="${this.ry}"${optionalAttribute("fill", this.fill)}/>`;
  }

  private assertPositiveFactor(factor: number): void {
    if (!Number.isFinite(factor) || factor <= 0) throw new Error("scale factor must be positive");
  }
}
