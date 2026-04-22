import { describe, expect, it } from "vitest";
import { createBrushingCanvas } from "../src";
import type { DabDataset } from "@dabrush/schema";

const dataset: DabDataset = {
  schemaVersion: "1.0",
  hd: [
    [0, 0],
    [1, 0]
  ],
  ld: [
    [0, 0],
    [1, 1]
  ],
  similarity: {
    format: "csr",
    metric: "snn",
    data: [1, 1],
    indices: [1, 0],
    indptr: [0, 1, 2],
    shape: [2, 2],
    params: { k: 1 }
  },
  knn: [[1], [0]]
};

function createFakeCanvas(): HTMLCanvasElement {
  const listeners = new Map<string, EventListener>();
  const context = {
    clearRect: () => undefined,
    fillRect: () => undefined,
    beginPath: () => undefined,
    arc: () => undefined,
    fill: () => undefined,
    stroke: () => undefined,
    closePath: () => undefined,
    save: () => undefined,
    restore: () => undefined,
    set fillStyle(_value: string) {},
    set strokeStyle(_value: string) {},
    set lineWidth(_value: number) {},
    set globalAlpha(_value: number) {},
    set globalCompositeOperation(_value: string) {}
  };
  return {
    width: 100,
    height: 100,
    style: { width: "100px", cursor: "", outline: "" },
    getContext: () => context,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }),
    addEventListener: (type: string, listener: EventListener) => listeners.set(type, listener),
    removeEventListener: (type: string) => listeners.delete(type)
  } as unknown as HTMLCanvasElement;
}

describe("@dabrush/web", () => {
  it("creates and destroys a canvas controller", () => {
    const controller = createBrushingCanvas(createFakeCanvas(), dataset, { width: 100, height: 100 });
    expect(controller.engine.getFrame().points).toHaveLength(2);
    controller.destroy();
  });

  it("creates and destroys an original canvas controller", () => {
    const controller = createBrushingCanvas(createFakeCanvas(), dataset, {
      implementation: "original",
      width: 100,
      height: 100
    });
    expect(controller.engine.getBrushes()).toHaveLength(1);
    controller.destroy();
  });
});
