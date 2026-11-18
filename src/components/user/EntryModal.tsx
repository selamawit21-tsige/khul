import React, {useEffect, useState} from 'react';
import {ShieldCheck, UserCheck, X} from 'lucide-react';
import {AppRole, BrandSettings, CommunityMember} from '../../types/khul';
import {KhulLogo} from '../KhulLogo';

interface EntryModalProps {
  open: boolean;
  brand: BrandSettings;
  member: CommunityMember;
  onUpdateProfile: (name: string, email: string) => void;
  onSelectRole: (role: AppRole) => void;
  onClose: () => void;
}

export const EntryModal: React.FC<EntryModalProps> = ({
  open,
  brand,
  member,
  onUpdateProfile,
  onSelectRole,
  onClose,
}) => {
  const [name, setName] = useState(member.name);
  const [email, setEmail] = useState(member.email);

  useEffect(() => {
    setName(member.name);
    setEmail(member.email);
  }, [member.name, member.email]);

  if (!open) return null;

  const handleEnterMember = () => {
    onUpdateProfile(name, email);
    onSelectRole('user');
    onClose();
  };

  const handleOpenAdminPortal = () => {
    onUpdateProfile(name, email);
    onSelectRole('admin');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="entry-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-[#FAF8F5] border border-[#E5DFD3] p-7 shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-[#5B635E] hover:bg-[#EFEAE0] cursor-pointer"
          aria-label="Close welcome screen"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <KhulLogo logoUrl={brand.logoUrl} size="xl" />
          <p className="mt-3 text-xs font-medium text-[#4A6B5D]">{brand.organizationName}</p>
          <h2 id="entry-modal-title" className="mt-1 text-2xl font-semibold text-[#1F3A3D]">
            Welcome to {brand.sanctuaryName}
          </h2>
          <p className="mt-1.5 text-xs text-[#5B635E]">
            Personalize your member profile or switch directly to the Admin Portal.
          </p>
        </div>

        <div className="mt-5 space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-[#49504C] mb-1">
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DDD5C7] bg-white text-sm text-[#2C302E] focus:outline-none focus:border-[#F1931E]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#49504C] mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DDD5C7] bg-white text-sm text-[#2C302E] focus:outline-none focus:border-[#F1931E]"
            />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleEnterMember}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#F1931E] hover:bg-[#DF8312] text-[#1F3A3D] text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            <span>Enter Member App</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdminPortal}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#1F3A3D] hover:bg-[#162B2D] text-[#FAF8F5] text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-[#F1931E]" />
            <span>Admin Portal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
