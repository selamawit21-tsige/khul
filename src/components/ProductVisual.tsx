import React, {useState} from 'react';
import {KhulProduct} from '../types/khul';

interface ProductVisualProps {
  product: KhulProduct;
  className?: string;
}

export const ProductVisual: React.FC<ProductVisualProps> = ({product, className = ''}) => {
  const [imgError, setImgError] = useState(false);

  if (product.customImageUrl && !imgError) {
    return (
      <div className={`w-full h-full bg-[#F7F4EE] flex items-center justify-center ${className}`}>
        <img
          src={product.customImageUrl}
          alt={product.name}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  return (
    <div
      className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-[#F3EFE6] to-[#E9E2D4] relative overflow-hidden ${className}`}
    >
      {product.visualKey === 'journal' && (
        <svg viewBox="0 0 180 135" className="w-36 h-28" aria-hidden="true">
          <rect x="44" y="18" width="92" height="100" rx="8" fill="#1F3A3D" />
          <rect x="52" y="18" width="84" height="100" rx="6" fill="#4A6B5D" />
          <rect x="44" y="18" width="12" height="100" rx="3" fill="#16292B" />
          <circle cx="94" cy="56" r="16" fill="#F1931E" />
          <path d="M87 64c4-6 10-6 14 0" stroke="#1F3A3D" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <rect x="74" y="84" width="40" height="4" rx="2" fill="#FAF8F5" opacity="0.8" />
          <rect x="82" y="92" width="24" height="3" rx="1.5" fill="#FAF8F5" opacity="0.5" />
        </svg>
      )}

      {product.visualKey === 'tea' && (
        <svg viewBox="0 0 180 135" className="w-36 h-28" aria-hidden="true">
          <rect x="56" y="34" width="68" height="80" rx="10" fill="#4A6B5D" />
          <rect x="52" y="26" width="76" height="14" rx="5" fill="#C88A55" />
          <rect x="64" y="54" width="52" height="40" rx="6" fill="#FAF8F5" />
          <circle cx="90" cy="70" r="9" fill="#F1931E" />
          <path d="M90 61c3 5 3 13 0 18M81 70c5-3 13-3 18 0" stroke="#1F3A3D" strokeWidth="1.8" strokeLinecap="round" />
          <rect x="74" y="84" width="32" height="3" rx="1.5" fill="#1F3A3D" opacity="0.7" />
        </svg>
      )}

      {product.visualKey === 'cushion' && (
        <svg viewBox="0 0 180 135" className="w-36 h-28" aria-hidden="true">
          <ellipse cx="90" cy="86" rx="58" ry="24" fill="#D5CCB8" />
          <ellipse cx="90" cy="72" rx="58" ry="24" fill="#EAE3D3" stroke="#C88A55" strokeWidth="2" />
          <ellipse cx="90" cy="72" rx="34" ry="13" fill="none" stroke="#4A6B5D" strokeWidth="1.5" strokeDasharray="4 3" />
          <circle cx="90" cy="72" r="5" fill="#F1931E" />
        </svg>
      )}

      {product.visualKey === 'chime' && (
        <svg viewBox="0 0 180 135" className="w-36 h-28" aria-hidden="true">
          <rect x="44" y="86" width="92" height="18" rx="6" fill="#7A5638" />
          <rect x="58" y="42" width="12" height="46" rx="4" fill="#C88A55" />
          <rect x="110" y="42" width="12" height="46" rx="4" fill="#C88A55" />
          <rect x="52" y="64" width="76" height="12" rx="6" fill="#F1931E" />
          <path d="M126 30l-28 24" stroke="#5B3F28" strokeWidth="4" strokeLinecap="round" />
          <circle cx="96" cy="56" r="6" fill="#1F3A3D" />
        </svg>
      )}

      {product.visualKey === 'book' && (
        <svg viewBox="0 0 180 135" className="w-36 h-28" aria-hidden="true">
          <rect x="48" y="20" width="86" height="96" rx="6" fill="#FAF8F5" stroke="#D5CCB8" strokeWidth="2" />
          <rect x="48" y="20" width="14" height="96" rx="3" fill="#F1931E" />
          <circle cx="96" cy="58" r="18" fill="none" stroke="#1F3A3D" strokeWidth="2.5" />
          <circle cx="96" cy="58" r="6" fill="#4A6B5D" />
          <rect x="74" y="88" width="44" height="4" rx="2" fill="#1F3A3D" />
          <rect x="82" y="96" width="28" height="3" rx="1.5" fill="#5B635E" />
        </svg>
      )}

      {(product.visualKey === 'candle' || product.visualKey === 'custom') && (
        <svg viewBox="0 0 180 135" className="w-36 h-28" aria-hidden="true">
          <rect x="64" y="50" width="52" height="62" rx="8" fill="#E8B968" />
          <ellipse cx="90" cy="50" rx="26" ry="7" fill="#F5D38E" />
          <path d="M90 25c5 7 7 13 0 19-7-6-5-12 0-19z" fill="#F1931E" />
          <rect x="72" y="72" width="36" height="22" rx="4" fill="#FAF8F5" />
          <rect x="78" y="80" width="24" height="3" rx="1.5" fill="#1F3A3D" />
        </svg>
      )}
    </div>
  );
};
