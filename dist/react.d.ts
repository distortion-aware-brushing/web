import type { DabDataset } from "@dabrush/schema";
import { type BrushingCanvasController, type BrushingCanvasOptions } from "./index";
export type BrushingCanvasProps = BrushingCanvasOptions & {
    dataset: DabDataset;
    width?: number;
    height?: number;
    className?: string;
    style?: React.CSSProperties;
    onReady?: (controller: BrushingCanvasController) => void;
};
export declare function BrushingCanvas({ dataset, width, height, className, style, onReady, ...options }: BrushingCanvasProps): import("react/jsx-runtime").JSX.Element;
