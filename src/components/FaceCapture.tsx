import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw, Loader2, CheckCircle2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

type Props = {
  onCaptured: (file: File, previewUrl: string) => void;
  previewUrl?: string | null;
};

// Live camera face-capture. Forces a real-time selfie (no disk uploads),
// uses the browser FaceDetector API when available to verify a face is present.
export default function FaceCapture({ onCaptured, previewUrl }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [active, setActive] = useState(false);
  const [starting, setStarting] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [supportsDetection, setSupportsDetection] = useState(false);
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    setSupportsDetection(typeof (window as any).FaceDetector === "function");
    return () => stopStream();
  }, []);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setActive(false);
    setFaceDetected(false);
  };

  const startCamera = async () => {
    setStarting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setActive(true);
      if (typeof (window as any).FaceDetector === "function") {
        detectLoop();
      } else {
        setFaceDetected(true); // can't verify; allow capture
      }
    } catch (e: any) {
      toast.error(e?.message || "Could not access camera");
    } finally {
      setStarting(false);
    }
  };

  const detectLoop = async () => {
    const Detector = (window as any).FaceDetector;
    if (!Detector || !videoRef.current) return;
    const detector = new Detector({ fastMode: true, maxDetectedFaces: 1 });
    const tick = async () => {
      if (!streamRef.current || !videoRef.current) return;
      try {
        const faces = await detector.detect(videoRef.current);
        setFaceDetected(faces && faces.length > 0);
      } catch {
        setFaceDetected(true); // detector failed, fall back to permissive
      }
      if (streamRef.current) setTimeout(tick, 500);
    };
    tick();
  };

  const capture = async () => {
    if (!videoRef.current) return;
    if (supportsDetection && !faceDetected) {
      toast.error("No face detected — please face the camera clearly");
      return;
    }
    setCapturing(true);
    try {
      const v = videoRef.current;
      const size = Math.min(v.videoWidth, v.videoHeight);
      const sx = (v.videoWidth - size) / 2;
      const sy = (v.videoHeight - size) / 2;
      const canvas = document.createElement("canvas");
      canvas.width = 480;
      canvas.height = 480;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(v, sx, sy, size, size, 0, 0, 480, 480);
      const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), "image/jpeg", 0.9));
      const file = new File([blob], `face-${Date.now()}.jpg`, { type: "image/jpeg" });
      const url = URL.createObjectURL(blob);
      onCaptured(file, url);
      stopStream();
      toast.success("Face captured");
    } finally {
      setCapturing(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative rounded-xl overflow-hidden bg-secondary border border-border aspect-square w-full max-w-[260px] mx-auto">
        {previewUrl && !active ? (
          <img src={previewUrl} alt="Your face" className="w-full h-full object-cover" />
        ) : active ? (
          <>
            <video ref={videoRef} playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
            <div
              className={`absolute inset-4 rounded-full border-2 pointer-events-none transition-colors ${
                faceDetected ? "border-success" : "border-warning animate-pulse"
              }`}
            />
            {supportsDetection && (
              <div className="absolute top-2 left-2 right-2 text-center">
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full ${
                    faceDetected ? "bg-success/20 text-success" : "bg-warning/20 text-warning"
                  }`}
                >
                  {faceDetected ? (
                    <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Face detected</span>
                  ) : (
                    <span className="inline-flex items-center gap-1"><ShieldAlert className="h-3 w-3" /> Position your face</span>
                  )}
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-2 p-4 text-center">
            <Camera className="h-8 w-8" />
            <span className="text-xs">Live camera capture only — for security, we don't accept uploaded photos.</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 justify-center">
        {!active && (
          <Button type="button" variant="secondary" size="sm" onClick={startCamera} disabled={starting}>
            {starting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Camera className="h-4 w-4 mr-2" />}
            {previewUrl ? "Retake" : "Open Camera"}
          </Button>
        )}
        {active && (
          <>
            <Button type="button" variant="outline" size="sm" onClick={stopStream}>
              <RefreshCw className="h-4 w-4 mr-2" /> Cancel
            </Button>
            <Button type="button" size="sm" onClick={capture} disabled={capturing || (supportsDetection && !faceDetected)}>
              {capturing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Camera className="h-4 w-4 mr-2" />}
              Capture
            </Button>
          </>
        )}
      </div>
      {!supportsDetection && active && (
        <p className="text-[10px] text-muted-foreground text-center">
          Face detection not supported on this browser — please ensure your face is clearly visible before capturing.
        </p>
      )}
    </div>
  );
}
