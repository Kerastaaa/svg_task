import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { CliApplication } from "../src/cli/CliApplication.js";
import { SvgParser } from "../src/io/SvgParser.js";
import { SvgSerializer } from "../src/io/SvgSerializer.js";

const temporaryDirectories: string[] = [];

function makeDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), "svg-cli-"));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

describe("SVG file I/O", () => {
  it("round-trips all built-in shapes, nested groups, dimensions, and escaped text", () => {
    const parser = new SvgParser();
    const serializer = new SvgSerializer();
    const source = `<?xml version="1.0"?>
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200">
        <g id="scene" fill="navy">
          <rect id="r1" x="1.5" y="2" width="30" height="40" stroke="black"/>
          <circle id="c1" cx="40" cy="50" r="8" fill="red"/>
          <ellipse id="e1" cx="60" cy="70" rx="9" ry="5"/>
          <line id="l1" x1="0" y1="1" x2="2" y2="3" stroke="green"/>
          <text id="t1" x="10" y="20">A &amp; B</text>
          <g id="inner"><rect id="r2" x="4" y="5" width="6" height="7"/></g>
        </g>
      </svg>`;

    const first = parser.parse(source);
    expect(first.document.width).toBe(400);
    expect(first.document.height).toBe(200);
    expect(first.elementCount).toBe(8);
    expect(first.document.findById("r1")?.getAttribute("fill")).toBe("navy");
    expect(first.document.findById("t1")?.getAttribute("text")).toBe("A & B");

    const second = parser.parse(serializer.serialize(first.document));
    expect(second.document.width).toBe(400);
    expect(second.document.height).toBe(200);
    expect(second.elementCount).toBe(8);
    expect(second.document.findById("r2")?.parent?.id).toBe("inner");
    expect(second.document.findById("t1")?.getAttribute("text")).toBe("A & B");
  });

  it("assigns and reports unique ids for elements without ids", () => {
    const result = new SvgParser().parse(
      '<svg width="10" height="10"><rect x="0" y="0" width="1" height="1"/><g><circle cx="2" cy="2" r="1"/></g></svg>',
    );

    expect(result.warnings).toEqual([
      "warning: assigned id rect1 to unnamed <rect>",
      "warning: assigned id g1 to unnamed <g>",
      "warning: assigned id circle1 to unnamed <circle>",
    ]);
    expect(result.document.findById("rect1")).toBeDefined();
    expect(result.document.findById("circle1")?.parent?.id).toBe("g1");
  });

  it("does not let generated ids collide with explicit ids later in the file", () => {
    const result = new SvgParser().parse(
      '<svg><rect x="0" y="0" width="1" height="1"/><rect id="rect1" x="1" y="1" width="1" height="1"/></svg>',
    );
    expect(result.warnings).toEqual(["warning: assigned id rect2 to unnamed <rect>"]);
    expect(result.document.findById("rect1")).toBeDefined();
    expect(result.document.findById("rect2")).toBeDefined();
  });

  it("applies nested translate and uniform scale transforms", () => {
    const result = new SvgParser().parse(
      '<svg width="100" height="100"><g transform="translate(60,40)"><g transform="scale(0.8)"><rect id="r1" x="10" y="20" width="30" height="40"/></g></g></svg>',
    );
    const rect = result.document.findById("r1");
    expect(rect?.getAttribute("x")).toBe("68");
    expect(rect?.getAttribute("y")).toBe("56");
    expect(rect?.getAttribute("width")).toBe("24");
    expect(rect?.getAttribute("height")).toBe("32");
  });

  it("reads, saves to the remembered path, and blocks old history after successful I/O", () => {
    const directory = makeDirectory();
    const file = join(directory, "diagram.svg");
    writeFileSync(file, '<svg width="120" height="90"><rect id="r1" x="1" y="2" width="3" height="4"/></svg>');
    const app = new CliApplication();

    expect(app.executeLine(`read "${file}"`)).toEqual([`read ${file} (1 elements)`]);
    expect(app.executeLine("undo")).toEqual(["error: undo not allowed after io command"]);
    expect(app.executeLine("move r1 4 5")).toEqual(["rect#r1 moved by (4,5)"]);
    expect(app.executeLine("save")).toEqual([`saved to ${file} (1 elements)`]);
    expect(readFileSync(file, "utf8")).toContain('x="5" y="7"');
    expect(app.executeLine("undo")).toEqual(["error: undo not allowed after io command"]);
  });

  it("keeps the current document and history if a read fails", () => {
    const app = new CliApplication();
    app.executeLine("init");
    app.executeLine("create rect r1 0 0 10 10");

    expect(app.executeLine("read missing.svg")).toEqual(["error: cannot read file: missing.svg"]);
    expect(app.executeLine("undo")).toEqual(["rect#r1 creation undone"]);
  });

  it("reports invalid XML and duplicate IDs", () => {
    const parser = new SvgParser();
    expect(() => parser.parse("<svg><rect></svg>")).toThrow(/invalid SVG XML/);
    expect(() => parser.parse(
      '<svg><rect id="same" x="0" y="0" width="1" height="1"/><circle id="same" cx="1" cy="1" r="1"/></svg>',
    )).toThrow("id already exists: same");
  });

  it("rejects save without a path until a document has been read", () => {
    const app = new CliApplication();
    app.executeLine("init");
    expect(app.executeLine("save")).toEqual(["error: no file path specified; use 'save <file.svg>'"]);
  });
});
