# @dabrush/web

Integrated Canvas and React web library for Distortion-aware brushing.

This is the package most users should import. It wires a preprocessed DAB dataset to pointer/wheel events, animation, Canvas rendering, dot glyphs, image glyphs, and brush status callbacks.

## Install From GitHub

```bash
yarn add github:distortion-aware-brushing/web#main \
  github:distortion-aware-brushing/preprocess-js#main
# or
npm install github:distortion-aware-brushing/web#main \
  github:distortion-aware-brushing/preprocess-js#main
```

React users also need React 18 or later.

```bash
yarn add react react-dom
```

These packages are not published to npm yet. GitHub installation runs each package `prepare` script and builds `dist/` locally during install.

## Data Flow

You provide aligned high-dimensional data and low-dimensional coordinates.

```ts
hd: number[][]; // n x m
ld: number[][]; // n x 2
```

The low-dimensional coordinates must already exist. DAB preprocessing does not run PCA, UMAP, or t-SNE.

Typical flow:

```txt
HD/LD arrays, JSON, or CSV
  -> @dabrush/preprocess-js buildDabDataset()
  -> @dabrush/web BrushingCanvas or createBrushingCanvas()
```

For large datasets, run `dabrush-preprocess` in Python, save `dataset.json`, then pass that dataset directly to this package.

## React: Start From Arrays

```tsx
import { useMemo } from "react";
import { buildDabDataset } from "@dabrush/preprocess-js";
import { BrushingCanvas } from "@dabrush/web/react";

const hd = [
  [0.1, 0.2, 0.3],
  [0.8, 0.1, 0.4],
  [0.2, 0.9, 0.5]
];

const ld = [
  [120, 300],
  [180, 260],
  [90, 220]
];

export function App() {
  const dataset = useMemo(() => buildDabDataset({ hd, ld }), []);

  return (
    <BrushingCanvas
      dataset={dataset}
      implementation="original"
      technique="dab"
      width={620}
      height={620}
      painterRadius={34}
      pointSize={5}
      onBrushChange={(brushes) => console.log(brushes)}
    />
  );
}
```

Use `implementation="original"` for the faithful DAB interaction path, including hover-triggered relocation, continuous brushing relocation, lens animation, and image glyph rendering.

## React: Start From HD/LD JSON Files

For separate files, each JSON can be a plain `number[][]`.

```tsx
import { useEffect, useState } from "react";
import { buildDabDataset } from "@dabrush/preprocess-js";
import type { DabDataset } from "@dabrush/schema";
import { BrushingCanvas } from "@dabrush/web/react";

export function App() {
  const [dataset, setDataset] = useState<DabDataset | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/data/hd.json").then((response) => response.json()),
      fetch("/data/ld.json").then((response) => response.json())
    ]).then(([hd, ld]) => {
      setDataset(buildDabDataset({ hd, ld }));
    });
  }, []);

  if (!dataset) return null;

  return <BrushingCanvas dataset={dataset} implementation="original" width={620} height={620} />;
}
```

If you already have one preprocessed dataset JSON from Python, skip `buildDabDataset`.

```tsx
const dataset = await fetch("/data/dataset.json").then((response) => response.json());
```

## React: Start From HD/LD CSV Files

```tsx
import { buildDabDataset, parseHdLdCsv } from "@dabrush/preprocess-js";

const [hdCsv, ldCsv] = await Promise.all([
  fetch("/data/hd.csv").then((response) => response.text()),
  fetch("/data/ld.csv").then((response) => response.text())
]);

const raw = parseHdLdCsv(hdCsv, ldCsv, { hasHeader: true });
const dataset = buildDabDataset(raw);
```

## Plain Canvas

```ts
import { buildDabDataset } from "@dabrush/preprocess-js";
import { createBrushingCanvas } from "@dabrush/web";

const canvas = document.querySelector("canvas")!;
const dataset = buildDabDataset({ hd, ld });

const controller = createBrushingCanvas(canvas, dataset, {
  implementation: "original",
  technique: "dab",
  width: 620,
  height: 620,
  painterRadius: 34,
  pointSize: 5,
  onBrushChange: (brushes) => {
    console.log(brushes);
  }
});

// later
controller.addBrush();
controller.showOriginal?.();
controller.restoreBrushing?.();
controller.destroy();
```

## Image Glyphs

For image-like HD rows, such as flattened Fashion-MNIST `28 x 28` vectors, render each point as a monochrome glyph.

```tsx
<BrushingCanvas
  dataset={dataset}
  implementation="original"
  width={620}
  height={620}
  pointSize={16}
  pointGlyph={{
    type: "image",
    pixelWidth: 28,
    pixelHeight: 28,
    inverted: true,
    removeBackground: true
  }}
/>
```

With `inverted: true` and `removeBackground: true`, light image backgrounds become transparent and brushed point colors show through the glyph.

## Techniques

- `dab`: Distortion-aware brushing
- `sb`: Similarity brushing
- `mbb`: M-Ball brushing
- `ddb`: Data-driven brushing

## Main Options

```ts
type BrushingCanvasOptions = {
  implementation?: "original" | "engine";
  technique?: "dab" | "sb" | "mbb" | "ddb";
  width?: number;
  height?: number;
  painterRadius?: number;
  pointSize?: number;
  maxBrushes?: number;
  showGlobalDensity?: boolean;
  showLocalCloseness?: boolean;
  pointGlyph?: { type: "dot" } | {
    type: "image";
    pixelWidth: number;
    pixelHeight: number;
    inverted?: boolean;
    removeBackground?: boolean;
    backgroundThreshold?: number;
  };
  onBrushChange?: (brushes) => void;
  onFrame?: (frame) => void;
};
```

## Controller

`createBrushingCanvas` and the React `onReady` callback expose a controller.

```ts
controller.addBrush();
controller.setDataset(nextDataset);
controller.showOriginal?.();
controller.restoreBrushing?.();
controller.destroy();
```

## Choosing Preprocessing

- Use `@dabrush/preprocess-js` for browser-scale data, demos, and interactive uploads.
- Use `dabrush-preprocess` for larger CSV/NumPy/Python workflows, then load the generated dataset JSON in the browser.
