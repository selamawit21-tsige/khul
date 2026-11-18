import React, {useMemo} from 'react';
import QRCode from 'qrcode';
import {CheckCircle2, Download, MapPin, X} from 'lucide-react';
import {SessionRegistration} from '../types/khul';

// Generates a genuine ISO/IEC 18004 scannable QR code matrix using `qrcode`
function buildScannableQrMatrix(payload: string): boolean[][] {
  const qr = QRCode.create(payload || 'KHUL', {errorCorrectionLevel: 'M'});
  const size = qr.modules.size;
  const grid: boolean[][] = [];
  for (let r = 0; r < size; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < size; c++) {
      row.push(Boolean(qr.modules.get(r, c)));
    }
    grid.push(row);
  }
  return grid;
}

export const QRMatrixSVG: React.FC<{code: string; className?: string}> = ({
  code,
  className = 'w-40 h-40',
}) => {
  const matrix = useMemo(() => buildScannableQrMatrix(code), [code]);
  const size = matrix.length;
  const quietZone = 2;
  const totalSize = size + quietZone * 2;

  return (
    <svg
      viewBox={`0 0 ${totalSize} ${totalSize}`}
      className={className}
      shapeRendering="crispEdges"
      role="img"
      aria-label={`Scannable digital pass QR code ${code}`}
    >
      <rect width={totalSize} height={totalSize} fill="#FFFFFF" rx="1" />
      {matrix.map((row, r) =>
        row.map((filled, c) =>
          filled ? (
            <rect
              key={`${r}-${c}`}
              x={c + quietZone}
              y={r + quietZone}
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

  const isCheckedIn = registration.attendanceStatus === 'Checked In';

  const handleDownloadPass = async () => {
    try {
      const dataUrl = await QRCode.toDataURL(registration.passCode, {
        width: 512,
        margin: 3,
        color: {dark: '#1F3A3D', light: '#FFFFFF'},
      });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `khul-pass-${registration.passCode}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      // Ignore download failure on restricted browsers
    }
  };

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
              <span>{isCheckedIn ? 'Checked In at Door' : 'Confirmed Session Pass'}</span>
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
            <QRMatrixSVG code={registration.passCode} className="w-48 h-48" />
          </div>
          <p className="mt-3 font-mono text-sm font-semibold tracking-wider text-[#1F3A3D] tabular-nums">
            {registration.passCode}
          </p>
          <p className="mt-1 text-[11px] text-[#5B635E]">
            Show this QR ticket at the entrance for instant attendance check-in.
          </p>

          <div className="mt-4 w-full rounded-xl bg-white border border-[#E5DFD3] p-4 text-left space-y-2">
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
              <span>Attendance</span>
              <span
                className={`font-semibold ${
                  isCheckedIn ? 'text-[#4A6B5D]' : 'text-[#C86D0A]'
                }`}
              >
                {registration.attendanceStatus}
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

          <div className="mt-5 w-full flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleDownloadPass}
              className="min-h-[44px] px-4 rounded-xl border border-[#DDD5C7] bg-white hover:bg-[#F4F0E8] text-[#1F3A3D] text-xs font-semibold inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Save QR</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[44px] rounded-xl bg-[#F1931E] hover:bg-[#DF8312] text-[#1F3A3D] text-sm font-semibold transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
