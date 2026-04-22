import type { DabDataset } from "@dabrush/schema";

export default class MultiDBrushing {
  constructor(
    preprocessed: DabDataset,
    canvasDom: HTMLCanvasElement,
    canvasSize: number,
    statusUpdateCallback: (status: Array<{ idx: string; points: number[]; color: string; isCurrent: boolean }>) => void,
    pointRenderingStyle: Record<string, unknown>,
    showGlobalDensity?: boolean,
    showLocalCloseness?: boolean,
    technique?: string,
    techniqueStyle?: Record<string, unknown>,
    maxBrushNum?: number,
    frameRate?: number,
    maxOpacity?: number,
    minOpacity?: number
  );
  unMount(): void;
  addNewBrush(): void;
  temporalReconstructInitialScatterplot(): void;
  cancelTemporalReconstruction(): void;
  getEntireBrushingStatus(): Array<{ idx: string; points: number[]; color: string; isCurrent: boolean }>;
}
