import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw, Loader2, CheckCircle2, ShieldAlert, Upload } from "lucide-react";
import { toast } from "sonner";

type Props = {
  onCaptured: (file: File, previewUrl: string) => void;
  previewUrl?: string | null;
};

/**
 * Live camera face-capture with graceful fallbacks:
 *   1. Open camera with getUserMedia.
 *   2. If FaceDetector API exists, draw a "face detected" indicator (advisory only).
 *   3. If camera is unavailable OR FaceDetector is missing, allow a photo upload —
 *      we still validate the file is an image and isn't empty, so mechanics are
 *      never blocked from onboarding because of browser limitations.
 */
export default function FaceCapture({ onCaptured, previewUrl }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [active, setActive] = useState(false);
  const [starting, setStarting] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [supportsDetection, setSupportsDetection] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

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
    setCameraError(null);
    try {
      // Pre-check permission where supported (non-fatal if it isn't).
      try {
        if ("permissions" in navigator) {
          const status = await (navigator as any).permissions.query({ name: "camera" as PermissionName });
          if (status.state === "denied") {
            setCameraError("Camera blocked. Enable camera permission in your browser settings.");
            setStarting(false);
            return;
          }
        }
      } catch { /* permissions.query may not support 'camera' on all browsers */ }

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
        setFaceDetected(true);
      }
    } catch (err: any) {
      const name = err?.name || "";
      if (name === "NotAllowedError" || name === "SecurityError") {
        setCameraError("Camera permission denied. Allow camera access in your browser settings.");
      } else if (name === "NotFoundError" || name === "OverconstrainedError") {
        setCameraError("No camera found on this device.");
      } else if (name === "NotReadableError") {
        setCameraError("Camera is already in use by another app. Close it and try again.");
      } else {
        setCameraError(err?.message || "Could not access camera. You can upload a photo instead.");
      }
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
        setFaceDetected(true);
      }
      if (streamRef.current) setTimeout(tick, 500);
    };
    tick();
  };

  const capture = async () => {
    if (!videoRef.current) return;
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

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please choose an image file"); return; }
    if (file.size === 0) { toast.error("This file is empty"); return; }
    if (file.size > 8 * 1024 * 1024) { toast.error("Image is larger than 8 MB"); return; }

    // Best-effort face check on uploaded image (advisory only — never blocks).
    if (typeof (window as any).FaceDetector === "function") {
      try {
        const img = new Image();
        const url = URL.createObjectURL(file);
        await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(); img.src = url; });
        const det = new (window as any).FaceDetector({ fastMode: true, maxDetectedFaces: 2 });
        const faces = await det.detect(img);
        URL.revokeObjectURL(url);
        if (!faces || faces.length === 0) {
          toast.error("No face detected in the photo — please upload a clear selfie");
          return;
        }
        if (faces.length > 1) {
          toast.error("Photo must contain only one person");
          return;
        }
      } catch { /* fall through — accept the photo */ }
    }

    const url = URL.createObjectURL(file);
    onCaptured(file, url);
    toast.success("Photo uploaded");
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
            <span className="text-xs">Live selfie preferred — upload a clear photo if your camera isn't available.</span>
          </div>
        )}
      </div>

      {cameraError && (
        <p className="text-[11px] text-destructive text-center max-w-[260px] mx-auto">{cameraError}</p>
      )}

      <div className="flex flex-wrap gap-2 justify-center">
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
            <Button type="button" size="sm" onClick={capture} disabled={capturing}>
              {capturing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Camera className="h-4 w-4 mr-2" />}
              Capture
            </Button>
          </>
        )}
        {!active && (
          <>
            <Button type="button" variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" /> Upload photo
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={handleUpload}
            />
          </>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground text-center">
        {supportsDetection
          ? "Face detection is enabled — ensure your face is clearly visible."
          : "Face detection isn't supported in this browser — please use a clear front-facing photo of just yourself."}
      </p>
    </div>
  );
}
