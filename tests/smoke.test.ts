import { describe, expect, it } from "vitest";
import { Circle } from "../src/domain/Circle.js";
import { DocumentModel } from "../src/domain/Document.js";
import { Group } from "../src/domain/Group.js";
import { Rect } from "../src/domain/Rect.js";
import { Text } from "../src/domain/Text.js";

describe("Day 1 domain model", () => {
  it("creates a default document", () => {
    const document = new DocumentModel();
    expect(document.width).toBe(800);
    expect(document.height).toBe(600);
  });

  it("rejects invalid canvas dimensions", () => {
    expect(() => new DocumentModel(0, 600)).toThrow("canvas dimensions must be positive numbers");
  });

  it("adds and finds shapes by id", () => {
    const document = new DocumentModel();
    const rect = new Rect("r1", 10, 20, 100, 50, "red");
    document.add(rect);

    expect(document.findById("r1")).toBe(rect);
    expect(rect.parent).toBe(document.root);
  });

  it("maintains parent-child relationships", () => {
    const document = new DocumentModel();
    const group = new Group("node1");
    const label = new Text("label1", 20, 30, "hello");

    document.add(group);
    document.add(label, "node1");

    expect(group.items).toEqual([label]);
    expect(label.parent).toBe(group);

    const removed = document.remove("label1");
    expect(removed.parent).toBe(group);
    expect(removed.index).toBe(0);
    expect(label.parent).toBeNull();
  });

  it("rejects duplicate ids", () => {
    const document = new DocumentModel();
    document.add(new Rect("same", 0, 0, 10, 10));

    expect(() => document.add(new Circle("same", 5, 5, 2))).toThrow("id already exists: same");
  });

  it("rejects a non-container parent", () => {
    const document = new DocumentModel();
    document.add(new Rect("r1", 0, 0, 10, 10));

    expect(() => document.add(new Text("t1", 0, 0, "text"), "r1")).toThrow("not a container: r1");
  });

  it("prevents cyclic groups", () => {
    const outer = new Group("outer");
    const inner = new Group("inner");
    outer.add(inner);

    expect(() => inner.add(outer)).toThrow("cannot create a cyclic shape tree");
  });

  it("moves a group through the composite interface", () => {
    const group = new Group("g1");
    const rect = new Rect("r1", 10, 20, 100, 50);
    const circle = new Circle("c1", 30, 40, 5);
    group.add(rect);
    group.add(circle);

    group.move(5, -10);

    expect([rect.x, rect.y]).toEqual([15, 10]);
    expect([circle.cx, circle.cy]).toEqual([35, 30]);
  });
});
