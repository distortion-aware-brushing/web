import {
  createBrushingEngine,
  type BrushingEngine,
  type BrushingEngineOptions,
  type BrushingFrame
} from "@dabrush/engine";
import type { DabDataset } from "@dabrush/schema";
import { createOriginalBrushingCanvas } from "./originalController";

export type PointGlyph =
  | {
      type: "dot";
    }
  | {
      type: "image";
      pixelWidth: number;
      pixelHeight: number;
      inverted?: boolean;
      removeBackground?: boolean;
      backgroundThreshold?: number;
    };

export type BrushingCanvasOptions = BrushingEngineOptions & {
  implementation?: "engine" | "original";
  pointGlyph?: PointGlyph;
  background?: string;
  onBrushChange?: (brushes: BrushingFrame["brushes"]) => void;
  onFrame?: (frame: BrushingFrame) => void;
};

export type BrushingCanvasController = {
  engine: BrushingEngine;
  render: () => void;
  destroy: () => void;
  setDataset: (dataset: DabDataset) => void;
  addBrush: () => void;
  showOriginal?: () => void;
  restoreBrushing?: () => void;
};

type CanvasLike = HTMLCanvasElement & {
  getBoundingClientRect(): DOMRect;
};

function drawImageGlyph(
  ctx: CanvasRenderingContext2D,
  hdRow: number[],
  x: number,
  y: number,
  size: number,
  glyph: Extract<PointGlyph, { type: "image" }>,
  color: string,
  opacity: number
): void {
  const width = glyph.pixelWidth;
  const height = glyph.pixelHeight;
  const max = Math.max(...hdRow, 1);
  const cellW = size / width;
  const cellH = size / height;
  ctx.save();
  for (let row = 0; row < height; row += 1) {
    for (let column = 0; column < width; column += 1) {
      const value = hdRow[column + row * width] ?? 0;
      const normalized = value / max;
      let mask = normalized * 255;
      if (glyph.inverted) mask = 255 - mask;
      const alpha = ((255 - mask) / 255) * opacity;
      if (glyph.removeBackground && alpha <= (glyph.backgroundThreshold ?? 0.03)) continue;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.fillRect(x - size / 2 + column * cellW, y - size / 2 + row * cellH, Math.ceil(cellW), Math.ceil(cellH));
    }
  }
  ctx.restore();
}

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  frame: BrushingFrame,
  dataset: DabDataset,
  options: BrushingCanvasOptions = {}
): void {
  const glyph = options.pointGlyph ?? { type: "dot" as const };
  ctx.clearRect(0, 0, frame.width, frame.height);
  if (options.background) {
    ctx.fillStyle = options.background;
    ctx.fillRect(0, 0, frame.width, frame.height);
  }

  frame.points
    .slice()
    .sort((a, b) => Number(a.brushed) - Number(b.brushed))
    .forEach((point) => {
      if (glyph.type === "image") {
        drawImageGlyph(ctx, dataset.hd[point.index], point.x, point.y, point.size, glyph, point.color, point.opacity);
      } else {
        ctx.beginPath();
        ctx.arc(point.x, point.y, point.size, 0, Math.PI * 2);
        ctx.fillStyle = point.color;
        ctx.globalAlpha = point.opacity;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.closePath();
      }
      if (point.border) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, Math.max(point.size + 2, 5), 0, Math.PI * 2);
        ctx.strokeStyle = "#111827";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.closePath();
      }
    });

  if (frame.lens) {
    ctx.beginPath();
    ctx.arc(frame.lens.x, frame.lens.y, frame.lens.radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(220, 38, 38, ${frame.lens.opacity})`;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.closePath();
  }

  if (frame.region) {
    ctx.save();
    ctx.fillStyle = "rgba(22, 163, 74, 0.18)";
    if (frame.region.type === "rect") {
      ctx.fillRect(frame.region.x0, frame.region.y0, frame.region.x1 - frame.region.x0, frame.region.y1 - frame.region.y0);
    } else {
      const radius = Math.hypot(frame.region.x1 - frame.region.x0, frame.region.y1 - frame.region.y0);
      ctx.beginPath();
      ctx.arc(frame.region.x0, frame.region.y0, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.closePath();
    }
    ctx.restore();
  }

  if (frame.painter) {
    ctx.beginPath();
    ctx.arc(frame.painter.x, frame.painter.y, frame.painter.radius, 0, Math.PI * 2);
    ctx.fillStyle = frame.painter.erasing ? "rgba(220, 38, 38, 0.16)" : "rgba(22, 163, 74, 0.16)";
    ctx.fill();
    ctx.closePath();
  }
}

function pointerFromEvent(canvas: CanvasLike, event: PointerEvent | WheelEvent) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
    shiftKey: event.shiftKey
  };
}

export function createBrushingCanvas(
  canvas: HTMLCanvasElement,
  dataset: DabDataset,
  options: BrushingCanvasOptions = {}
): BrushingCanvasController {
  if (options.implementation === "original") {
    return createOriginalBrushingCanvas(canvas, dataset, options);
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not create a 2D canvas context.");
  }

  let currentDataset = dataset;
  let engine = createBrushingEngine(currentDataset, {
    ...options,
    width: options.width ?? canvas.width,
    height: options.height ?? canvas.height
  });

  const render = () => {
    const frame = engine.tick();
    renderFrame(ctx, frame, currentDataset, options);
    options.onFrame?.(frame);
  };

  const emit = () => {
    options.onBrushChange?.(engine.getBrushes());
  };

  const onPointerMove = (event: PointerEvent) => {
    engine.pointerMove(pointerFromEvent(canvas as CanvasLike, event));
    emit();
  };
  const onPointerDown = (event: PointerEvent) => {
    canvas.setPointerCapture?.(event.pointerId);
    engine.pointerDown(pointerFromEvent(canvas as CanvasLike, event));
    emit();
  };
  const onPointerUp = (event: PointerEvent) => {
    canvas.releasePointerCapture?.(event.pointerId);
    engine.pointerUp();
    emit();
  };
  const onWheel = (event: WheelEvent) => {
    event.preventDefault();
    engine.wheel(event.deltaY);
    emit();
  };

  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("wheel", onWheel, { passive: false });
  let animationFrame: number | undefined;
  const renderLoop = () => {
    render();
    if (typeof requestAnimationFrame !== "undefined") {
      animationFrame = requestAnimationFrame(renderLoop);
    }
  };
  renderLoop();

  return {
    get engine() {
      return engine;
    },
    render,
    addBrush: () => {
      engine.addBrush();
      emit();
    },
    destroy: () => {
      if (animationFrame !== undefined && typeof cancelAnimationFrame !== "undefined") {
        cancelAnimationFrame(animationFrame);
      }
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
    },
    setDataset: (nextDataset: DabDataset) => {
      currentDataset = nextDataset;
      engine = createBrushingEngine(currentDataset, {
        ...options,
        width: options.width ?? canvas.width,
        height: options.height ?? canvas.height
      });
      emit();
    }
  };
}
