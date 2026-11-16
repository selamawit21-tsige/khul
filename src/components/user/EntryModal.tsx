import React, {useEffect, useState} from 'react';
import {LogIn, LogOut, ShieldCheck, UserCheck, X} from 'lucide-react';
import {User} from 'firebase/auth';
import {AppRole, BrandSettings, CommunityMember} from '../../types/khul';
import {KhulLogo} from '../KhulLogo';

interface EntryModalProps {
  open: boolean;
  brand: BrandSettings;
  member: CommunityMember;
  authUser: User | null;
  isAdmin: boolean;
  onUpdateProfile: (name: string, email: string) => void;
  onSignIn: () => Promise<User>;
  onSignOut: () => Promise<void>;
  onSelectRole: (role: AppRole) => void;
  onClose: () => void;
}

export const EntryModal: React.FC<EntryModalProps> = ({
  open,
  brand,
  member,
  authUser,
  isAdmin,
  onUpdateProfile,
  onSignIn,
  onSignOut,
  onSelectRole,
  onClose,
}) => {
  const [name, setName] = useState(member.name);
  const [email, setEmail] = useState(member.email);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    setName(member.name);
    setEmail(authUser?.email || member.email);
  }, [member.name, member.email, authUser?.email]);

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

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    try {
      await onSignIn();
    } finally {
      setSigningIn(false);
    }
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
            Personalize your member profile or sign in with Google to sync passes and streaks across devices.
          </p>
        </div>

        {/* Google Account Connection */}
        <div className="mt-5 rounded-xl bg-white border border-[#E5DFD3] p-3.5 flex items-center justify-between gap-3">
          {authUser ? (
            <>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-[#4A6B5D]">
                  {isAdmin ? 'Verified Khul Admin' : 'Signed-in Member'}
                </p>
                <p className="text-xs font-semibold text-[#1F3A3D] truncate">{authUser.email}</p>
              </div>
              <button
                type="button"
                onClick={() => void onSignOut()}
                className="min-h-[36px] px-3 py-1.5 rounded-lg border border-[#DDD5C7] hover:bg-[#FAF8F5] text-xs font-medium text-[#49504C] inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#1F3A3D]">Sync with Google</p>
                <p className="text-[11px] text-[#5B635E]">
                  Save QR passes, orders &amp; admin access
                </p>
              </div>
              <button
                type="button"
                disabled={signingIn}
                onClick={() => void handleGoogleSignIn()}
                className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-[#1F3A3D] hover:bg-[#162B2D] text-[#FAF8F5] text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-[#F1931E]" />
                <span>{signingIn ? 'Connecting...' : 'Sign In'}</span>
              </button>
            </>
          )}
        </div>

        <div className="mt-4 space-y-3.5">
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
