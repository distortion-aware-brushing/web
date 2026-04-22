import { describe, expect, it } from "vitest";
import { findRelocationPositionsHull } from "../src/original/utils/dabLogic";

function distance(a: number[], b: number[]): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2);
}

function expectFinitePositions(positions: number[][]): void {
  positions.forEach((position) => {
    expect(Number.isFinite(position[0])).toBe(true);
    expect(Number.isFinite(position[1])).toBe(true);
  });
}

describe("gentle DAB relocation", () => {
  it("places lower HD-closeness brushed points farther from the center", () => {
    const currentLd = [
      [10, 0],
      [20, 0],
      [0, 10],
      [80, 0]
    ];
    const hull = [
      [-20, -20],
      [30, -20],
      [30, 20],
      [-20, 20]
    ];
    const closeness = [1, 0, 0.5, 0];
    const nextLd = findRelocationPositionsHull(new Set([0, 1, 2]), hull, currentLd, closeness, 100, 200);
    const center = [5, 0];

    expect(distance(nextLd[1], center)).toBeGreaterThan(distance(nextLd[0], center));
  });

  it("caps every target move to 30% of the painter radius", () => {
    const currentLd = [
      [10, 0],
      [20, 0],
      [0, 10],
      [80, 0]
    ];
    const hull = [
      [-20, -20],
      [30, -20],
      [30, 20],
      [-20, 20]
    ];
    const closeness = [1, 0, 0.5, 0];
    const painterRadius = 100;
    const nextLd = findRelocationPositionsHull(new Set([0, 1, 2]), hull, currentLd, closeness, painterRadius, 200);

    nextLd.forEach((position, index) => {
      expect(distance(position, currentLd[index])).toBeLessThanOrEqual(painterRadius * 0.3 + 1e-6);
    });
  });

  it("returns finite positions for empty and degenerate brushed groups", () => {
    const cases = [
      { seedPoints: new Set<number>(), hull: [] },
      { seedPoints: new Set([0]), hull: [[0, 0]] },
      {
        seedPoints: new Set([0, 1]),
        hull: [
          [0, 0],
          [10, 0]
        ]
      }
    ];
    const currentLd = [
      [0, 0],
      [10, 0],
      [Number.NaN, Number.POSITIVE_INFINITY]
    ];
    const closeness = [1, 0, 0.5];

    cases.forEach(({ seedPoints, hull }) => {
      const nextLd = findRelocationPositionsHull(seedPoints, hull, currentLd, closeness, 100, 200);
      expect(nextLd).toHaveLength(currentLd.length);
      expectFinitePositions(nextLd);
    });
  });
});
