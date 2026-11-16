import React, {useState} from 'react';
import {ArrowLeft, Lock, LogIn, LogOut, ShieldAlert} from 'lucide-react';
import {User} from 'firebase/auth';
import {BrandSettings} from '../../types/khul';
import {KhulLogo} from '../KhulLogo';

interface AdminGateProps {
  brand: BrandSettings;
  authUser: User | null;
  authReady: boolean;
  adminCheckDone: boolean;
  isAdmin: boolean;
  onSignIn: () => Promise<User>;
  onSignOut: () => Promise<void>;
  onExitAdmin: () => void;
}

export const AdminGate: React.FC<AdminGateProps> = ({
  brand,
  authUser,
  authReady,
  adminCheckDone,
  isAdmin,
  onSignIn,
  onSignOut,
  onExitAdmin,
}) => {
  const [busy, setBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setAuthError(null);
    setBusy(true);
    try {
      await onSignIn();
    } catch (err) {
      const code =
        err && typeof err === 'object' && 'code' in err
          ? String((err as {code?: unknown}).code ?? '')
          : '';
      if (code === 'auth/unauthorized-domain') {
        const host = typeof window !== 'undefined' ? window.location.hostname : 'this domain';
        setAuthError(
          `This deployed domain (${host}) is not authorized in Firebase Authentication yet. Add "${host}" under Firebase Console → Authentication → Settings → Authorized domains, then sign in again.`,
        );
      } else if (code === 'auth/popup-blocked') {
        setAuthError(
          'Your browser blocked the Google sign-in popup. Please allow popups for this site and click Sign In again.',
        );
      } else if (code === 'auth/popup-closed-by-user') {
        setAuthError('Sign-in popup was closed before completing login. Please try again.');
      } else {
        setAuthError(
          err instanceof Error
            ? err.message
            : 'Could not complete Google sign-in. Please allow popups and try again.',
        );
      }
    } finally {
      setBusy(false);
    }
  };

  if (!authReady || !adminCheckDone) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="rounded-2xl bg-white border border-[#E7E1D6] p-8 text-center space-y-3 max-w-sm w-full">
          <KhulLogo logoUrl={brand.logoUrl} size="lg" className="mx-auto" />
          <p className="text-sm font-medium text-[#1F3A3D]">Verifying Khul Admin access...</p>
        </div>
      </div>
    );
  }

  if (isAdmin) return null;

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white border border-[#E7E1D6] p-7 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <KhulLogo logoUrl={brand.logoUrl} size="lg" />
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C86D0A]">
            {authUser ? <ShieldAlert className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            <span>{authUser ? 'Admin Privileges Required' : 'Restricted Team Workspace'}</span>
          </div>
          <h1 className="text-2xl font-semibold text-[#1F3A3D]">
            {brand.organizationName} Admin Portal
          </h1>
          <p className="text-sm text-[#5B635E] leading-relaxed">
            {authUser
              ? 'This Google account does not have Khul Admin permissions. Only authorized Khul World administrators can publish sessions, edit prices, or manage orders.'
              : 'Sign in with an authorized Khul Admin Google account to publish updates directly to all member pages.'}
          </p>
        </div>

        {authUser && (
          <div className="rounded-xl bg-[#FAF8F5] border border-[#E7E1D6] p-4 text-xs space-y-1">
            <p className="text-[#5B635E]">Currently signed in as</p>
            <p className="font-semibold text-[#1F3A3D] break-all">{authUser.email}</p>
            <p className="font-mono text-[11px] text-[#6B736E] pt-1">
              UID: {authUser.uid}
            </p>
          </div>
        )}

        {authError && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-800">
            {authError}
          </div>
        )}

        <div className="space-y-3">
          <button
            type="button"
            disabled={busy}
            onClick={handleGoogleLogin}
            className="w-full min-h-[46px] px-5 py-2.5 rounded-xl bg-[#F1931E] hover:bg-[#DF8312] disabled:opacity-60 text-[#1F3A3D] text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>
              {busy
                ? 'Connecting to Google...'
                : authUser
                  ? 'Switch to Authorized Admin Account'
                  : 'Sign In with Google'}
            </span>
          </button>

          {authUser && (
            <button
              type="button"
              onClick={() => void onSignOut()}
              className="w-full min-h-[44px] px-4 py-2 rounded-xl border border-[#DDD5C7] hover:bg-[#FAF8F5] text-xs font-semibold text-[#49504C] inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          )}

          <button
            type="button"
            onClick={onExitAdmin}
            className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-[#1F3A3D] hover:bg-[#162B2D] text-[#FAF8F5] text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Member App</span>
          </button>
        </div>
      </div>
    </div>
  );
};
