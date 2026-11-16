import React from 'react';
import {CheckCircle2, MapPin, X} from 'lucide-react';
import {SessionRegistration} from '../types/khul';

// Generates a crisp deterministic 21x21 QR-style matrix SVG from a passCode string
function buildQrMatrix(seedStr: string): boolean[][] {
  const size = 21;
  const grid: boolean[][] = Array.from({length: size}, () => Array(size).fill(false));

  const placeFinder = (r0: number, c0: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        grid[r0 + r][c0 + c] = isBorder || isCenter;
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  let hash = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    hash ^= seedStr.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= size - 8;
      const inBottomLeft = r >= size - 8 && c < 8;
      if (inTopLeft || inTopRight || inBottomLeft) continue;

      if (r === 6 || c === 6) {
        grid[r][c] = (r + c) % 2 === 0;
        continue;
      }

      hash ^= (r * 31 + c * 17) & 0xff;
      hash = Math.imul(hash, 16777619);
      grid[r][c] = (Math.abs(hash) % 10) > 4;
    }
  }

  return grid;
}

export const QRMatrixSVG: React.FC<{code: string; className?: string}> = ({
  code,
  className = 'w-40 h-40',
}) => {
  const matrix = buildQrMatrix(code);
  const size = matrix.length;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      role="img"
      aria-label={`Digital pass QR code ${code}`}
    >
      <rect width={size} height={size} fill="#FFFFFF" rx="1" />
      {matrix.map((row, r) =>
        row.map((filled, c) =>
          filled ? (
            <rect
              key={`${r}-${c}`}
              x={c}
              y={r}
              width={1}
              height={1}
              fill="#1F3A3D"
            />
          ) : null,
        ),
      )}
    </svg>
  );
};

interface QRPassModalProps {
  registration: SessionRegistration | null;
  venueName: string;
  onClose: () => void;
}

export const QRPassModal: React.FC<QRPassModalProps> = ({
  registration,
  venueName,
  onClose,
}) => {
  if (!registration) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-pass-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-[#FAF8F5] border border-[#E5DFD3] overflow-hidden shadow-2xl">
        <div className="bg-[#1F3A3D] text-[#FAF8F5] px-6 py-5 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-[#F1931E]">
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirmed Session Pass</span>
            </div>
            <h3 id="qr-pass-title" className="mt-1 text-xl font-semibold text-white">
              {registration.packageTier} Pass
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close pass"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center text-center">
          <div className="p-4 rounded-2xl bg-white border border-[#E5DFD3]">
            <QRMatrixSVG code={registration.passCode} className="w-44 h-44" />
          </div>
          <p className="mt-3 font-mono text-sm font-semibold tracking-wider text-[#1F3A3D] tabular-nums">
            {registration.passCode}
          </p>

          <div className="mt-5 w-full rounded-xl bg-white border border-[#E5DFD3] p-4 text-left space-y-2">
            <div className="flex justify-between text-xs text-[#5B635E]">
              <span>Member</span>
              <span className="font-semibold text-[#2C302E]">{registration.memberName}</span>
            </div>
            <div className="flex justify-between text-xs text-[#5B635E] gap-4">
              <span>Session</span>
              <span className="font-medium text-[#2C302E] text-right">
                {registration.sessionTitle}
              </span>
            </div>
            <div className="flex justify-between text-xs text-[#5B635E]">
              <span>Date</span>
              <span className="font-mono tabular-nums text-[#2C302E]">
                {registration.sessionDate}
              </span>
            </div>
            <div className="flex justify-between text-xs text-[#5B635E]">
              <span>Contribution</span>
              <span className="font-mono tabular-nums font-semibold text-[#1F3A3D]">
                {registration.amountEtb.toLocaleString()} ETB
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs text-[#5B635E]">
            <MapPin className="w-3.5 h-3.5 text-[#F1931E] shrink-0" />
            <span>{venueName} · Doors open 5:30 PM</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-5 w-full min-h-[44px] rounded-xl bg-[#F1931E] hover:bg-[#DF8312] text-[#1F3A3D] text-sm font-semibold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
