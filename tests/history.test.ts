import { describe, expect, it } from "vitest";
import { CliApplication } from "../src/cli/CliApplication.js";

function run(app: CliApplication, command: string): string {
  return app.executeLine(command)[0] ?? "";
}

function expectOrder(text: string, ...ids: string[]): void {
  const positions = ids.map((id) => {
    const match = new RegExp(`#${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=\\s|$)`).exec(text);
    return match?.index ?? -1;
  });
  expect(positions.every((position) => position >= 0)).toBe(true);
  expect(positions).toEqual([...positions].sort((a, b) => a - b));
}

describe("Day 3 command history", () => {
  it("undoes and redoes create", () => {
    const app = new CliApplication();
    run(app, "init");
    run(app, "create rect r1 0 0 10 10");

    expect(run(app, "undo")).toBe("rect#r1 creation undone");
    expect(run(app, "show r1")).toBe("error: no such shape: r1");
    expect(run(app, "redo")).toBe("rect#r1 created");
    expect(run(app, "show r1")).toContain("rect#r1");
  });

  it("undoes and redoes move", () => {
    const app = new CliApplication();
    run(app, "init");
    run(app, "create rect r1 10 20 30 40");
    run(app, "move r1 5 -2");

    run(app, "undo");
    expect(run(app, "show r1")).toContain("x=10 y=20");
    run(app, "redo");
    expect(run(app, "show r1")).toContain("x=15 y=18");
  });

  it("removes a newly set optional attribute on undo", () => {
    const app = new CliApplication();
    run(app, "init");
    run(app, "create rect r1 0 0 10 10");
    run(app, "set r1 fill blue");
    expect(run(app, "show r1")).toContain("fill=blue");

    run(app, "undo");
    expect(run(app, "show r1")).not.toContain("fill=blue");
  });

  it("clears redo after a new edit", () => {
    const app = new CliApplication();
    run(app, "init");
    run(app, "create rect r1 0 0 10 10");
    run(app, "undo");
    run(app, "create circle c1 5 5 2");

    expect(run(app, "redo")).toBe("error: nothing to redo");
  });

  it("blocks history after init and canvas changes until the next edit", () => {
    const app = new CliApplication();
    run(app, "init");
    expect(run(app, "undo")).toBe("error: undo not allowed after io command");

    run(app, "create rect r1 0 0 10 10");
    run(app, "canvas 100 100");
    expect(run(app, "undo")).toBe("error: undo not allowed after io command");

    run(app, "create circle c1 5 5 2");
    expect(run(app, "undo")).toBe("circle#c1 creation undone");
  });

  it("restores a deleted subtree at its original index", () => {
    const app = new CliApplication();
    run(app, "init");
    run(app, "create rect before 0 0 1 1");
    run(app, "create g g1");
    run(app, "create rect child 1 1 2 2 in g1");
    run(app, "create rect after 2 2 3 3");
    run(app, "delete g1");

    expect(run(app, "tree")).not.toContain("#child");
    run(app, "undo");
    const tree = run(app, "tree");
    expectOrder(tree, "before", "g1", "after");
    expect(tree).toContain("#child");
  });

  it("groups siblings as one undo unit and restores exact order", () => {
    const app = new CliApplication();
    run(app, "init");
    run(app, "create rect a 0 0 1 1");
    run(app, "create rect b 0 0 1 1");
    run(app, "create rect c 0 0 1 1");
    run(app, "create rect d 0 0 1 1");
    run(app, "group pair b c");

    const grouped = run(app, "tree");
    expectOrder(grouped, "a", "pair", "b", "c", "d");
    run(app, "undo");
    const restored = run(app, "tree");
    expectOrder(restored, "a", "b", "c", "d");
    expect(restored).not.toContain("#pair");

    run(app, "undo");
    expect(run(app, "show d")).toBe("error: no such shape: d");
  });

  it("rejects grouping an ancestor with its descendant without changing state", () => {
    const app = new CliApplication();
    run(app, "init");
    run(app, "create g outer");
    run(app, "create rect child 0 0 1 1 in outer");
    const before = run(app, "tree");

    expect(run(app, "group invalid outer child")).toBe(
      "error: cannot group a container into its own descendant: outer",
    );
    expect(run(app, "tree")).toBe(before);
  });

  it("ungroups a nested group and restores it on undo", () => {
    const app = new CliApplication();
    run(app, "init");
    run(app, "create g outer");
    run(app, "create rect before 0 0 1 1 in outer");
    run(app, "create g inner in outer");
    run(app, "create rect a 0 0 1 1 in inner");
    run(app, "create rect b 0 0 1 1 in inner");
    run(app, "create rect after 0 0 1 1 in outer");

    run(app, "ungroup inner");
    expectOrder(run(app, "tree outer"), "before", "a", "b", "after");
    run(app, "undo");
    const restored = run(app, "tree outer");
    expectOrder(restored, "before", "inner", "a", "b", "after");
  });

  it("rejects ungrouping a top-level group", () => {
    const app = new CliApplication();
    run(app, "init");
    run(app, "create g scene");
    expect(run(app, "ungroup scene")).toBe("error: cannot ungroup top-level container: scene");
  });

  it("undoes addto to the original parent and index", () => {
    const app = new CliApplication();
    run(app, "init");
    run(app, "create rect a 0 0 1 1");
    run(app, "create rect b 0 0 1 1");
    run(app, "create g target");
    run(app, "create rect c 0 0 1 1");

    run(app, "addto target b");
    expect(run(app, "tree target")).toContain("#b");
    run(app, "undo");
    expectOrder(run(app, "tree"), "a", "b", "target", "c");
  });

  it("undoes front and back ordering", () => {
    const app = new CliApplication();
    run(app, "init");
    run(app, "create rect a 0 0 1 1");
    run(app, "create rect b 0 0 1 1");
    run(app, "create rect c 0 0 1 1");

    run(app, "front a");
    expectOrder(run(app, "tree"), "b", "c", "a");
    run(app, "undo");
    expectOrder(run(app, "tree"), "a", "b", "c");

    run(app, "back c");
    expectOrder(run(app, "tree"), "c", "a", "b");
    run(app, "undo");
    expectOrder(run(app, "tree"), "a", "b", "c");
  });
});
