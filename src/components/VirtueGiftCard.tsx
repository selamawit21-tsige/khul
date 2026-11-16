import React from 'react';
import {Instagram, Send} from 'lucide-react';
import {VirtueCardTheme} from '../types/khul';

interface VirtueGiftCardProps {
  word: string;
  amharicWord: string;
  cardTheme?: VirtueCardTheme;
  logoUrl?: string;
  size?: 'sm' | 'md';
  isShuffling?: boolean;
}

const THEME_STYLES: Record<
  VirtueCardTheme,
  {
    bg: string;
    border: string;
    ink: string;
    subInk: string;
    rule: string;
  }
> = {
  yellow: {
    bg: 'bg-[#F4DF2B]',
    border: 'border-[#DCC416]',
    ink: 'text-[#1E221F]',
    subInk: 'text-[#2D332E]',
    rule: 'border-[#E2761B]',
  },
  green: {
    bg: 'bg-[#87B336]',
    border: 'border-[#6E9626]',
    ink: 'text-[#182214]',
    subInk: 'text-[#22301C]',
    rule: 'border-[#DD7A20]',
  },
  orange: {
    bg: 'bg-[#F2AE5C]',
    border: 'border-[#DB913B]',
    ink: 'text-[#1E221F]',
    subInk: 'text-[#2F312D]',
    rule: 'border-[#D96914]',
  },
};

export const VirtueGiftCard: React.FC<VirtueGiftCardProps> = ({
  word,
  amharicWord,
  cardTheme = 'yellow',
  logoUrl = '/assets/aistudio/khul_e2c6af73.jpg',
  size = 'md',
  isShuffling = false,
}) => {
  const styles = THEME_STYLES[cardTheme] ?? THEME_STYLES.yellow;
  const compact = size === 'sm';

  return (
    <div
      className={`w-full rounded-lg border shadow-[0_8px_22px_rgba(31,58,61,0.14)] select-none transition-all duration-150 ${
        styles.bg
      } ${styles.border} ${styles.ink} ${
        compact ? 'px-4 py-3' : 'px-5 sm:px-7 py-4 sm:py-5'
      } ${isShuffling ? 'scale-[0.98] -rotate-1' : 'scale-100 rotate-0'}`}
    >
      {/* Top Bar: ክሁል / የመሆን ክህሎት  |  (K)  |  Khul / Human Possibilities */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-3">
        <div className={`pb-1.5 border-b ${styles.rule} text-center`}>
          <p
            className={`font-bold leading-tight tracking-wide ${
              compact ? 'text-sm' : 'text-base sm:text-xl'
            }`}
          >
            ክሁል
          </p>
          <p
            className={`mt-0.5 font-medium leading-tight ${styles.subInk} ${
              compact ? 'text-[9px]' : 'text-[10px] sm:text-xs'
            }`}
          >
            የመሆን ክህሎት
          </p>
        </div>

        <div
          className={`rounded-full overflow-hidden border border-[#D96914]/50 bg-[#F1931E] flex items-center justify-center shrink-0 shadow-xs ${
            compact ? 'w-8 h-8' : 'w-10 h-10 sm:w-12 sm:h-12'
          }`}
        >
          <img
            src={logoUrl || '/assets/aistudio/khul_e2c6af73.jpg'}
            alt="Khul World Emblem"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>

        <div className={`pb-1.5 border-b ${styles.rule} text-center`}>
          <p
            className={`font-bold leading-tight tracking-wide ${
              compact ? 'text-sm' : 'text-base sm:text-xl'
            }`}
          >
            Khul
          </p>
          <p
            className={`mt-0.5 font-medium leading-tight ${styles.subInk} ${
              compact ? 'text-[9px]' : 'text-[10px] sm:text-xs'
            }`}
          >
            Human Possibilities
          </p>
        </div>
      </div>

      {/* Center Bilingual Virtue Word */}
      <div className={`text-center ${compact ? 'my-3.5' : 'my-5 sm:my-6'}`}>
        <h3
          className={`font-bold tracking-tight leading-tight ${
            compact ? 'text-2xl' : 'text-3xl sm:text-4xl'
          }`}
        >
          {word}
        </h3>
        <p
          className={`font-bold tracking-tight leading-tight mt-1 ${
            compact ? 'text-xl' : 'text-2xl sm:text-3xl'
          }`}
        >
          {amharicWord}
        </p>
      </div>

      {/* Bottom Contact Strip: +251 932 333382 | Khul Wellbeing Center | Social @Khulworld */}
      <div
        className={`pt-2 border-t ${styles.rule} flex flex-wrap items-center justify-between gap-x-3 gap-y-1 font-medium ${
          compact ? 'text-[9px]' : 'text-[10px] sm:text-xs'
        }`}
      >
        <span className="font-mono tabular-nums tracking-tight whitespace-nowrap">
          +251 932 333382
        </span>
        <span className="font-semibold tracking-tight whitespace-nowrap">
          Khul Wellbeing Center
        </span>
        <span className="inline-flex items-center gap-1 whitespace-nowrap">
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-[3px] bg-[#1E221F] text-white">
            <Send className="w-2.5 h-2.5" />
          </span>
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-[3px] bg-[#1E221F] text-white font-bold text-[10px] leading-none">
            f
          </span>
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-[3px] bg-[#1E221F] text-white">
            <Instagram className="w-2.5 h-2.5" />
          </span>
          <span className="ml-0.5 font-semibold">@Khulworld</span>
        </span>
      </div>
    </div>
  );
};
