import { useEffect, useRef } from "react";
import type { DabDataset } from "@dabrush/schema";
import { createBrushingCanvas, type BrushingCanvasController, type BrushingCanvasOptions } from "./index";

export type BrushingCanvasProps = BrushingCanvasOptions & {
  dataset: DabDataset;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  onReady?: (controller: BrushingCanvasController) => void;
};

export function BrushingCanvas({
  dataset,
  width = 800,
  height = 800,
  className,
  style,
  onReady,
  ...options
}: BrushingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const controllerRef = useRef<BrushingCanvasController | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    controllerRef.current?.destroy();
    controllerRef.current = createBrushingCanvas(canvas, dataset, {
      ...options,
      width,
      height
    });
    onReady?.(controllerRef.current);
    return () => {
      controllerRef.current?.destroy();
      controllerRef.current = null;
    };
  }, [dataset, width, height, options.implementation, options.technique, options.painterRadius, options.pointSize, options.showGlobalDensity, options.showLocalCloseness]);

  return <canvas ref={canvasRef} width={width} height={height} className={className} style={style} />;
}
