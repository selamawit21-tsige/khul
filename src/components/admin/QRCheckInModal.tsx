import React, {useCallback, useEffect, useRef, useState} from 'react';
import jsQR from 'jsqr';
import {
  AlertCircle,
  Camera,
  CameraOff,
  CheckCircle2,
  QrCode,
  RefreshCw,
  ScanLine,
  Upload,
  X,
} from 'lucide-react';
import {SessionRegistration} from '../../types/khul';

export interface QRCheckInResult {
  status: 'checked-in' | 'already-checked-in' | 'not-found';
  scannedCode: string;
  registration?: SessionRegistration;
}

interface QRCheckInModalProps {
  open: boolean;
  registrations: SessionRegistration[];
  onCheckInPass: (rawCode: string) => Promise<QRCheckInResult>;
  onClose: () => void;
}

interface BarcodeDetectorLike {
  detect: (source: ImageBitmapSource) => Promise<Array<{rawValue?: string}>>;
}

declare global {
  interface Window {
    BarcodeDetector?: new (options?: {formats?: string[]}) => BarcodeDetectorLike;
  }
}

export const QRCheckInModal: React.FC<QRCheckInModalProps> = ({
  open,
  registrations,
  onCheckInPass,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastScannedRef = useRef<{code: string; at: number}>({code: '', at: 0});
  const processingRef = useRef(false);
  const detectingRef = useRef(false);
  const onCheckInPassRef = useRef(onCheckInPass);
  const barcodeDetectorRef = useRef<BarcodeDetectorLike | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  onCheckInPassRef.current = onCheckInPass;

  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<QRCheckInResult | null>(null);
  const [recentCheckIns, setRecentCheckIns] = useState<SessionRegistration[]>([]);

  const checkedInCount = registrations.filter(
    (r) => r.attendanceStatus === 'Checked In',
  ).length;

  useEffect(() => {
    if (typeof window !== 'undefined' && window.BarcodeDetector) {
      try {
        barcodeDetectorRef.current = new window.BarcodeDetector({formats: ['qr_code']});
      } catch {
        barcodeDetectorRef.current = null;
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    detectingRef.current = false;
    setCameraActive(false);
  }, []);

  const handleDecodedCode = useCallback(async (rawCode: string, force = false) => {
    const trimmed = rawCode.trim();
    if (!trimmed || processingRef.current) return;

    const now = Date.now();
    if (
      !force &&
      lastScannedRef.current.code === trimmed &&
      now - lastScannedRef.current.at < 2500
    ) {
      return;
    }
    lastScannedRef.current = {code: trimmed, at: now};

    processingRef.current = true;
    setProcessing(true);
    try {
      const res = await onCheckInPassRef.current(trimmed);
      setResult(res);
      if (res.registration && res.status === 'checked-in') {
        setRecentCheckIns((prev) => {
          const filtered = prev.filter((item) => item.id !== res.registration!.id);
          return [res.registration!, ...filtered].slice(0, 5);
        });
      }
    } finally {
      processingRef.current = false;
      setProcessing(false);
    }
  }, []);

  const decodeCanvasWithJsQR = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
  ): string | null => {
    // 1. Scan full frame
    const full = ctx.getImageData(0, 0, width, height);
    const fullHit = jsQR(full.data, full.width, full.height, {
      inversionAttempts: 'attemptBoth',
    });
    if (fullHit?.data) return fullHit.data;

    // 2. Scan center 65% crop (improves detection when QR fills viewfinder)
    const cropSize = Math.floor(Math.min(width, height) * 0.65);
    if (cropSize >= 120) {
      const sx = Math.floor((width - cropSize) / 2);
      const sy = Math.floor((height - cropSize) / 2);
      const center = ctx.getImageData(sx, sy, cropSize, cropSize);
      const centerHit = jsQR(center.data, center.width, center.height, {
        inversionAttempts: 'attemptBoth',
      });
      if (centerHit?.data) return centerHit.data;
    }

    return null;
  };

  const scanFrame = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !streamRef.current) return;

    if (
      !detectingRef.current &&
      !processingRef.current &&
      video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
      video.videoWidth > 0 &&
      video.videoHeight > 0
    ) {
      detectingRef.current = true;
      try {
        let decodedText: string | null = null;

        // Try native hardware-accelerated BarcodeDetector first when supported
        if (barcodeDetectorRef.current) {
          try {
            const codes = await barcodeDetectorRef.current.detect(video);
            decodedText = codes.find((c) => c.rawValue)?.rawValue ?? null;
          } catch {
            // Fall back to jsQR below
          }
        }

        // Fall back to jsQR software decoder
        if (!decodedText) {
          const maxDim = 960;
          const scale = Math.min(1, maxDim / Math.max(video.videoWidth, video.videoHeight));
          const targetW = Math.max(1, Math.round(video.videoWidth * scale));
          const targetH = Math.max(1, Math.round(video.videoHeight * scale));
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext('2d', {willReadFrequently: true});
          if (ctx) {
            ctx.drawImage(video, 0, 0, targetW, targetH);
            decodedText = decodeCanvasWithJsQR(ctx, targetW, targetH);
          }
        }

        if (decodedText) {
          await handleDecodedCode(decodedText, false);
        }
      } finally {
        detectingRef.current = false;
      }
    }

    if (streamRef.current) {
      rafRef.current = requestAnimationFrame(() => {
        void scanFrame();
      });
    }
  }, [handleDecodedCode]);

  const startCamera = useCallback(
    async (mode: 'environment' | 'user' = facingMode) => {
      setCameraError(null);
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError(
          'Live camera access is unavailable in this browser. Use Upload QR Image or enter the Pass Code below.',
        );
        return;
      }

      try {
        stopCamera();
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: {ideal: mode},
            width: {ideal: 1280},
            height: {ideal: 720},
          },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setCameraActive(true);
        rafRef.current = requestAnimationFrame(() => {
          void scanFrame();
        });
      } catch {
        setCameraError(
          'Camera permission was declined or no camera was detected. You can upload a QR screenshot or type the Pass Code below.',
        );
        setCameraActive(false);
      }
    },
    [facingMode, scanFrame, stopCamera],
  );

  // Only start/stop camera when modal opens/closes (never restart on registration updates)
  useEffect(() => {
    if (open) {
      setResult(null);
      lastScannedRef.current = {code: '', at: 0};
      void startCamera(facingMode);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSwitchCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    void startCamera(nextMode);
  };

  const handleUploadQrImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current ?? document.createElement('canvas');
        const maxDim = 1200;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d', {willReadFrequently: true});
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const decoded = decodeCanvasWithJsQR(ctx, canvas.width, canvas.height);
        if (decoded) {
          void handleDecodedCode(decoded, true);
        } else {
          setResult({
            status: 'not-found',
            scannedCode: 'No readable QR code found in image',
          });
        }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    void handleDecodedCode(manualCode, true).then(() => {
      setManualCode('');
    });
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-scanner-title"
    >
      <div className="w-full max-w-xl rounded-2xl bg-[#FAF8F5] border border-[#E5DFD3] overflow-hidden shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#1F3A3D] text-[#FAF8F5] px-6 py-4 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F1931E]/20 border border-[#F1931E]/40 flex items-center justify-center shrink-0">
              <ScanLine className="w-5 h-5 text-[#F1931E]" />
            </div>
            <div>
              <h2 id="qr-scanner-title" className="text-lg font-semibold text-white">
                QR Ticket Check-In Scanner
              </h2>
              <p className="text-xs text-[#C6D2CC]">
                Scan attendee pass to auto-mark attendance ·{' '}
                <span className="font-mono font-semibold text-[#F1931E] tabular-nums">
                  {checkedInCount}/{registrations.length} checked in
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
            aria-label="Close QR scanner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          {/* Camera Viewfinder - keep video mounted & visible (opacity-0 when inactive so play() never pauses on display:none) */}
          <div className="relative rounded-2xl overflow-hidden bg-[#122224] border border-[#2C4B4E] aspect-[4/3] max-h-64 w-full flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transition-opacity ${
                cameraActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            />
            <canvas ref={canvasRef} className="hidden" />

            {cameraActive ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="w-44 h-44 rounded-2xl border-2 border-[#F1931E] shadow-[0_0_0_9999px_rgba(18,34,36,0.35)] relative">
                  <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-medium text-white bg-[#1F3A3D]/90 px-2.5 py-0.5 rounded-md">
                    Hold QR pass steady inside frame
                  </span>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center space-y-3">
                <CameraOff className="w-8 h-8 text-[#F1931E] mx-auto" />
                <p className="text-xs text-[#D6DED9] leading-relaxed max-w-sm">
                  {cameraError ?? 'Starting camera scanner...'}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => void startCamera(facingMode)}
                    className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#F1931E] hover:bg-[#DF8312] text-[#1F3A3D] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Enable Camera</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload QR Image</span>
                  </button>
                </div>
              </div>
            )}

            {cameraActive && (
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSwitchCamera}
                  className="min-h-[34px] px-2.5 py-1 rounded-lg bg-black/55 hover:bg-black/75 text-white text-[11px] font-medium inline-flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Flip</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="min-h-[34px] px-2.5 py-1 rounded-lg bg-black/55 hover:bg-black/75 text-white text-[11px] font-medium inline-flex items-center gap-1 cursor-pointer"
                >
                  <Upload className="w-3 h-3" />
                  <span>Image</span>
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="min-h-[34px] px-2.5 py-1 rounded-lg bg-black/55 hover:bg-black/75 text-white text-[11px] font-medium inline-flex items-center gap-1 cursor-pointer"
                >
                  <CameraOff className="w-3 h-3" />
                  <span>Pause</span>
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleUploadQrImage}
              className="hidden"
            />
          </div>

          {/* Scan Result Banner */}
          {result && (
            <div
              className={`rounded-xl p-4 border flex items-start gap-3 ${
                result.status === 'checked-in'
                  ? 'bg-[#EEF4F0] border-[#4A6B5D]/40 text-[#1F3A3D]'
                  : result.status === 'already-checked-in'
                    ? 'bg-[#FFF5E8] border-[#F1931E]/50 text-[#1F3A3D]'
                    : 'bg-[#FBEAE8] border-[#C94A38]/40 text-[#7A2318]'
              }`}
            >
              {result.status === 'not-found' ? (
                <AlertCircle className="w-5 h-5 text-[#A23B2A] shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2
                  className={`w-5 h-5 shrink-0 mt-0.5 ${
                    result.status === 'checked-in' ? 'text-[#4A6B5D]' : 'text-[#C86D0A]'
                  }`}
                />
              )}

              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-sm font-semibold">
                  {result.status === 'checked-in' &&
                    `Checked In: ${result.registration?.memberName}`}
                  {result.status === 'already-checked-in' &&
                    `Already Checked In: ${result.registration?.memberName}`}
                  {result.status === 'not-found' && 'Pass Code Not Found'}
                </p>

                {result.registration ? (
                  <p className="text-xs text-[#49504C]">
                    <span className="font-mono font-semibold">{result.registration.passCode}</span>
                    <span aria-hidden="true"> · </span>
                    <span>{result.registration.packageTier} Pass</span>
                    <span aria-hidden="true"> · </span>
                    <span>{result.registration.sessionTitle}</span>
                  </p>
                ) : (
                  <p className="text-xs">
                    Scanned value:{' '}
                    <span className="font-mono font-semibold">{result.scannedCode}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Manual Pass Code Entry */}
          <form onSubmit={handleManualSubmit} className="space-y-2">
            <label className="block text-xs font-medium text-[#49504C]">
              Or enter / paste Pass Code manually
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <QrCode className="w-4 h-4 text-[#6B736E] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="e.g., KHUL-4821-MON"
                  className="w-full min-h-[42px] pl-9 pr-3.5 py-2 rounded-xl border border-[#DDD5C7] bg-white font-mono text-sm uppercase"
                />
              </div>
              <button
                type="submit"
                disabled={processing || !manualCode.trim()}
                className="min-h-[42px] px-4 py-2 rounded-xl bg-[#F1931E] hover:bg-[#DF8312] disabled:opacity-50 text-[#1F3A3D] text-xs font-semibold whitespace-nowrap cursor-pointer"
              >
                Check In
              </button>
            </div>
          </form>

          {/* Session Recent Door Check-ins */}
          {recentCheckIns.length > 0 && (
            <div className="rounded-xl bg-white border border-[#E7E1D6] p-3.5 space-y-2">
              <p className="text-xs font-semibold text-[#4A6B5D]">
                Scanned Just Now ({recentCheckIns.length})
              </p>
              <div className="divide-y divide-[#F4F0E8]">
                {recentCheckIns.map((item) => (
                  <div
                    key={item.id}
                    className="py-1.5 first:pt-0 last:pb-0 flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="font-medium text-[#1F3A3D] truncate">{item.memberName}</span>
                    <span className="font-mono text-[#5B635E] shrink-0">{item.passCode}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
