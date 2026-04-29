import type { BrushStatus, BrushingFrame, BrushingTechnique } from "@dabrush/engine";
import type { DabDataset } from "@dabrush/schema";
import OriginalMultiDBrushing from "./original/MultiDBrushing";
import type { BrushingCanvasController, BrushingCanvasOptions } from "./index";

type OriginalStatus = Array<{ idx: string; points: number[]; color: string; isCurrent: boolean }>;

function normalizeStatus(status: OriginalStatus): BrushStatus[] {
  return status.map((brush) => ({
    id: Number(brush.idx),
    points: brush.points,
    color: brush.color,
    isCurrent: brush.isCurrent
  }));
}

function toOriginalPointStyle(options: BrushingCanvasOptions): Record<string, unknown> {
  if (options.pointGlyph?.type === "image") {
    return {
      style: "monochrome",
      size: options.pointSize ?? 18,
      inversed: options.pointGlyph.inverted ?? true,
      pixelWidth: options.pointGlyph.pixelWidth,
      pixelHeight: options.pointGlyph.pixelHeight,
      removeBackground: options.pointGlyph.removeBackground ?? true
    };
  }
  return {
    style: "dot",
    size: options.pointSize ?? 5
  };
}

export function createOriginalBrushingCanvas(
  canvas: HTMLCanvasElement,
  dataset: DabDataset,
  options: BrushingCanvasOptions = {}
): BrushingCanvasController {
  let currentDataset = dataset;
  let latestBrushes: BrushStatus[] = [];
  let instance: OriginalMultiDBrushing | undefined;

  const canvasSize = options.width ?? canvas.width;
  const technique = (options.technique ?? "dab") as BrushingTechnique;
  const pointRenderingStyle = toOriginalPointStyle(options);

  const mount = () => {
    instance = new OriginalMultiDBrushing(
      currentDataset,
      canvas,
      canvasSize,
      (status) => {
        latestBrushes = normalizeStatus(status);
        options.onBrushChange?.(latestBrushes);
      },
      pointRenderingStyle,
      options.showGlobalDensity ?? true,
      options.showLocalCloseness ?? true,
      technique,
      undefined,
      options.maxBrushes ?? 10
    );
    latestBrushes = normalizeStatus(instance.getEntireBrushingStatus());
    options.onBrushChange?.(latestBrushes);
  };

  mount();

  const controller = {
    get engine() {
      return {
        getBrushes: () => latestBrushes,
        getFrame: () =>
          ({
            mode: "inspect",
            technique,
            width: canvasSize,
            height: canvasSize,
            points: [],
            brushes: latestBrushes,
            seedPoints: []
          }) as BrushingFrame
      } as unknown as BrushingCanvasController["engine"];
    },
    render: () => undefined,
    addBrush: () => {
      instance?.addNewBrush();
      if (instance) {
        latestBrushes = normalizeStatus(instance.getEntireBrushingStatus());
        options.onBrushChange?.(latestBrushes);
      }
    },
    removeBrush: (id: number) => {
      instance?.removeBrush(id);
      if (instance) {
        latestBrushes = normalizeStatus(instance.getEntireBrushingStatus());
        options.onBrushChange?.(latestBrushes);
      }
    },
    showOriginal: () => {
      instance?.temporalReconstructInitialScatterplot();
    },
    restoreBrushing: () => {
      instance?.cancelTemporalReconstruction();
    },
    destroy: () => {
      instance?.unMount();
      instance = undefined;
    },
    setDataset: (nextDataset: DabDataset) => {
      instance?.unMount();
      currentDataset = nextDataset;
      mount();
    }
  };

  return controller;
}
