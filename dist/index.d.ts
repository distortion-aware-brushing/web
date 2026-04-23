import { type BrushingEngine, type BrushingEngineOptions, type BrushingFrame } from "@dabrush/engine";
import type { DabDataset } from "@dabrush/schema";
export type PointGlyph = {
    type: "dot";
} | {
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
export declare function renderFrame(ctx: CanvasRenderingContext2D, frame: BrushingFrame, dataset: DabDataset, options?: BrushingCanvasOptions): void;
export declare function createBrushingCanvas(canvas: HTMLCanvasElement, dataset: DabDataset, options?: BrushingCanvasOptions): BrushingCanvasController;
