import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { CliApplication } from "../src/cli/CliApplication.js";

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

describe("assignment acceptance session", () => {
  it("builds, edits, saves, and reads a nested flowchart", () => {
    const directory = mkdtempSync(join(tmpdir(), "svg-acceptance-"));
    temporaryDirectories.push(directory);
    const file = join(directory, "flowchart.svg");
    const app = new CliApplication();

    expect(app.executeLine("init 800 600")).toEqual(["canvas 800x600 created"]);
    app.executeLine("create g flowchart");
    app.executeLine("create g node1 in flowchart");
    app.executeLine("create rect start 120 100 160 60 #4a90d9 in node1");
    app.executeLine('create text start-label 155 135 "开始" in node1');
    app.executeLine("create g node2 in flowchart");
    app.executeLine("create rect process 520 100 160 60 #f5a623 in node2");
    app.executeLine('create text process-label 545 135 "处理数据" in node2');
    app.executeLine("create line arrow1 280 130 520 130 black in flowchart");

    const beforeMove = app.executeLine("tree")[0] ?? "";
    expect(beforeMove).toContain("g#flowchart");
    expect(beforeMove).toContain('text#process-label  (545,135) "处理数据"');
    expect(app.executeLine("move node2 0 100")).toEqual(["g#node2 moved by (0,100)"]);
    expect(app.executeLine("undo")).toEqual(["g#node2 move undone"]);
    expect(app.executeLine('set process-label text "处理数据 v2"')).toEqual([
      "text#process-label updated: text=处理数据 v2",
    ]);

    expect(app.executeLine(`save "${file}"`)).toEqual([`saved to ${file} (8 elements)`]);
    const svg = readFileSync(file, "utf8");
    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"');
    expect(svg).toContain("处理数据 v2");

    const loaded = new CliApplication();
    expect(loaded.executeLine(`read "${file}"`)).toEqual([`read ${file} (8 elements)`]);
    expect(loaded.executeLine("tree")[0]).toContain('text#process-label  (545,135) "处理数据 v2"');
  });

  it("keeps failed editing commands atomic and out of history", () => {
    const app = new CliApplication();
    app.executeLine("init");
    app.executeLine("create g outer");
    app.executeLine("create rect child 0 0 10 10 in outer");
    const before = app.executeLine("tree")[0];

    expect(app.executeLine("addto child outer")).toEqual(["error: not a container: child"]);
    expect(app.executeLine("group invalid outer child")).toEqual([
      "error: cannot group a container into its own descendant: outer",
    ]);
    expect(app.executeLine("tree")[0]).toBe(before);
    expect(app.executeLine("undo")).toEqual(["rect#child creation undone"]);
  });
});
