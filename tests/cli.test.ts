import { describe, expect, it } from "vitest";
import { CliApplication } from "../src/cli/CliApplication.js";
import { tokenize } from "../src/cli/Tokenizer.js";

describe("Day 2 CLI", () => {
  it("tokenizes quoted text and whitespace", () => {
    expect(tokenize('create text title 20 40 "My Diagram"')).toEqual([
      "create",
      "text",
      "title",
      "20",
      "40",
      "My Diagram",
    ]);
    expect(tokenize('read "D:\\diagrams\\my file.svg"')).toEqual([
      "read",
      "D:\\diagrams\\my file.svg",
    ]);
  });

  it("creates a nested flowchart and displays it", () => {
    const app = new CliApplication();

    expect(app.executeLine("init 800 600")).toEqual(["canvas 800x600 created"]);
    expect(app.executeLine("create g flowchart")).toEqual(["g#flowchart created"]);
    expect(app.executeLine("create rect start 120 100 160 60 #4a90d9 in flowchart")).toEqual([
      "rect#start created in g#flowchart",
    ]);
    expect(app.executeLine('create text label 155 135 "开始" in flowchart')).toEqual([
      "text#label created in g#flowchart",
    ]);

    const tree = app.executeLine("tree")[0];
    expect(tree).toContain("svg (800x600)");
    expect(tree).toContain("g#flowchart");
    expect(tree).toContain("rect#start  x=120 y=100 w=160 h=60 fill=#4a90d9");
    expect(tree).toContain('text#label  (155,135) "开始"');
  });

  it("moves, scales, and sets attributes", () => {
    const app = new CliApplication();
    app.executeLine("init");
    app.executeLine("create rect r1 10 20 100 50 red");

    expect(app.executeLine("move r1 5 -10")).toEqual(["rect#r1 moved by (5,-10)"]);
    expect(app.executeLine("scale r1 2")).toEqual(["rect#r1 scaled by 2"]);
    expect(app.executeLine("set r1 fill blue")).toEqual(["rect#r1 updated: fill=blue"]);
    expect(app.executeLine("set r1 stroke-width 2")).toEqual(["rect#r1 updated: stroke-width=2"]);

    const details = app.executeLine("show r1")[0];
    expect(details).toContain("parent=svg");
    expect(details).toContain("x=30 y=20 w=200 h=100");
    expect(details).toContain("fill=blue");
    expect(details).toContain("stroke-width=2");
  });

  it("lists complete command syntax in help", () => {
    const help = new CliApplication().executeLine("help")[0] ?? "";
    expect(help).toContain("create <type> <id> [params...] [in <containerId>]");
    expect(help).toContain("group <newGid> <id1> <id2>...");
    expect(help).toContain("addto <gid> <id>");
    expect(help).toContain("read <file.svg>");
    expect(help).toContain("undo, redo");
  });

  it("rejects invalid commands without changing the document", () => {
    const app = new CliApplication();

    expect(app.executeLine("tree")).toEqual(["error: no document. use 'init' or 'read' first"]);
    expect(app.executeLine("init")).toEqual(["canvas 800x600 created"]);
    expect(app.executeLine("create hexagon h1 0 0")).toEqual([
      "error: unknown shape type: hexagon (is the plugin loaded?)",
    ]);
    expect(app.executeLine("create rect r1 0 0 10 10")).toEqual(["rect#r1 created"]);
    expect(app.executeLine("create circle r1 0 0 5")).toEqual(["error: id already exists: r1"]);
    expect(app.executeLine("show r1")[0]).toContain("rect#r1");
  });
});
