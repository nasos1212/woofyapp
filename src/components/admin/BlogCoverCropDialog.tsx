import { useState, useRef, useCallback, useEffect } from "react";
import { ZoomIn, ZoomOut, Move } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";

interface BlogCoverCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob) => void;
  aspectRatio?: number; // width / height, default 16/9
}

export function BlogCoverCropDialog({
  open,
  onOpenChange,
  imageSrc,
  onCropComplete,
  aspectRatio = 16 / 9,
}: BlogCoverCropDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);

  const PREVIEW_WIDTH = 480;
  const PREVIEW_HEIGHT = Math.round(PREVIEW_WIDTH / aspectRatio);

  useEffect(() => {
    if (!imageSrc || !open) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    img.src = imageSrc;
    return () => {
      setImageLoaded(false);
    };
  }, [imageSrc, open]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !imageLoaded) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = PREVIEW_WIDTH;
    canvas.height = PREVIEW_HEIGHT;

    ctx.clearRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);

    const scale = Math.max(PREVIEW_WIDTH / img.width, PREVIEW_HEIGHT / img.height) * zoom;
    const w = img.width * scale;
    const h = img.height * scale;
    const x = (PREVIEW_WIDTH - w) / 2 + offset.x;
    const y = (PREVIEW_HEIGHT - h) / 2 + offset.y;

    ctx.drawImage(img, x, y, w, h);
  }, [zoom, offset, imageLoaded, PREVIEW_WIDTH, PREVIEW_HEIGHT]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handlePointerUp = () => setIsDragging(false);

  const handleCrop = () => {
    const img = imageRef.current;
    if (!img) return;

    const OUTPUT_WIDTH = 1600;
    const OUTPUT_HEIGHT = Math.round(OUTPUT_WIDTH / aspectRatio);
    const out = document.createElement("canvas");
    out.width = OUTPUT_WIDTH;
    out.height = OUTPUT_HEIGHT;
    const ctx = out.getContext("2d");
    if (!ctx) return;

    const scale = Math.max(OUTPUT_WIDTH / img.width, OUTPUT_HEIGHT / img.height) * zoom;
    const w = img.width * scale;
    const h = img.height * scale;
    const ratio = OUTPUT_WIDTH / PREVIEW_WIDTH;
    const x = (OUTPUT_WIDTH - w) / 2 + offset.x * ratio;
    const y = (OUTPUT_HEIGHT - h) / 2 + offset.y * ratio;

    ctx.drawImage(img, x, y, w, h);

    out.toBlob(
      (blob) => {
        if (blob) {
          onCropComplete(blob);
          onOpenChange(false);
        }
      },
      "image/webp",
      0.9
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adjust cover image</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          <div
            className="relative overflow-hidden rounded-lg border-2 border-primary/30 shadow-lg cursor-grab active:cursor-grabbing bg-muted touch-none select-none w-full"
            style={{ maxWidth: PREVIEW_WIDTH, aspectRatio: `${aspectRatio}` }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            <canvas ref={canvasRef} className="block w-full h-full touch-none" />
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm text-muted-foreground">Loading...</span>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Move className="w-3 h-3" /> Drag to reposition
          </p>

          <div className="flex items-center gap-3 w-full px-4 max-w-md">
            <ZoomOut className="w-4 h-4 text-muted-foreground shrink-0" />
            <Slider
              value={[zoom]}
              onValueChange={([v]) => setZoom(v)}
              min={1}
              max={4}
              step={0.05}
              className="flex-1"
            />
            <ZoomIn className="w-4 h-4 text-muted-foreground shrink-0" />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCrop} disabled={!imageLoaded}>
            Save crop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
