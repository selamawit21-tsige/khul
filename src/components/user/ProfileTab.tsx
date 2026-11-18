import React, {useState} from 'react';
import {Award, Flame, QrCode, ShoppingBag, User} from 'lucide-react';
import {
  BrandSettings,
  CollectedWordEntry,
  CommunityMember,
  SessionRegistration,
  StoreOrder,
} from '../../types/khul';
import {PWAInstallButton} from '../PWAInstallButton';
import {QRPassModal} from '../QRCodePass';

interface ProfileTabProps {
  member: CommunityMember;
  brand: BrandSettings;
  registrations: SessionRegistration[];
  orders: StoreOrder[];
  collectedWords: CollectedWordEntry[];
  onOpenEntryScreen: () => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  member,
  brand,
  registrations,
  orders,
  collectedWords,
  onOpenEntryScreen,
}) => {
  const [activePassId, setActivePassId] = useState<string | null>(null);
  const activePass = registrations.find((r) => r.id === activePassId) ?? null;

  const memberRegistrations = registrations.filter(
    (r) =>
      r.memberEmail.toLowerCase() === member.email.toLowerCase() ||
      r.memberName.toLowerCase() === member.name.toLowerCase(),
  );

  const memberOrders = orders.filter(
    (o) => o.customerName.toLowerCase() === member.name.toLowerCase(),
  );

  return (
    <div className="space-y-8">
      {/* Member Identity & Active Package Summary */}
      <section className="rounded-2xl bg-white border border-[#E7E1D6] p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#F1931E]/20 border border-[#F1931E]/40 flex items-center justify-center shrink-0">
              <User className="w-7 h-7 text-[#1F3A3D]" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-[#1F3A3D]">{member.name}</h1>
              <p className="text-sm text-[#5B635E]">
                {member.email} · {member.activePackage} Pass
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <PWAInstallButton variant="compact" />
            <button
              type="button"
              onClick={onOpenEntryScreen}
              className="min-h-[40px] px-4 py-2 rounded-xl border border-[#DDD5C7] hover:bg-[#FAF8F5] text-xs font-semibold text-[#1F3A3D] cursor-pointer"
            >
              Edit Profile / Welcome Screen
            </button>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-[#F0EBE1] grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-[#5B635E]">Active Package</p>
            <p className="mt-1 text-lg font-semibold text-[#1F3A3D]">
              {member.activePackage} Pass
            </p>
          </div>
          <div>
            <p className="text-xs text-[#5B635E]">Active Streak</p>
            <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-[#1F3A3D] inline-flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-[#F1931E]" />
              {member.currentStreak} days
            </p>
          </div>
          <div>
            <p className="text-xs text-[#5B635E]">Total Days Practiced</p>
            <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-[#1F3A3D]">
              {member.totalDaysPracticed} days
            </p>
          </div>
          <div>
            <p className="text-xs text-[#5B635E]">Collected Words</p>
            <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-[#1F3A3D]">
              {collectedWords.length} cards
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Registered Wednesday Passes */}
        <section className="lg:col-span-7 rounded-2xl bg-white border border-[#E7E1D6] p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#1F3A3D]">
            My Wednesday Session Passes
          </h2>
          {memberRegistrations.length === 0 ? (
            <p className="text-sm text-[#5B635E]">
              You have not reserved a Wednesday session yet.
            </p>
          ) : (
            <div className="divide-y divide-[#F0EBE1]">
              {memberRegistrations.map((reg) => (
                <div
                  key={reg.id}
                  className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <p className="text-xs text-[#5B635E]">
                      <span className="font-medium text-[#4A6B5D]">{reg.packageTier} Pass</span>
                      <span aria-hidden="true"> · </span>
                      <span className="font-mono tabular-nums">{reg.sessionDate}</span>
                      <span aria-hidden="true"> · </span>
                      <span>{reg.attendanceStatus}</span>
                    </p>
                    <h3 className="text-sm font-semibold text-[#1F3A3D]">{reg.sessionTitle}</h3>
                    <p className="font-mono text-xs text-[#5B635E] tabular-nums">
                      Code: {reg.passCode} · {reg.amountEtb.toLocaleString()} ETB
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActivePassId(reg.id)}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#F1931E] hover:bg-[#DF8312] text-[#1F3A3D] text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 self-start sm:self-center cursor-pointer"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Show QR Pass</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Khul Life Orders */}
        <section className="lg:col-span-5 rounded-2xl bg-white border border-[#E7E1D6] p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#1F3A3D]">Khul Life Orders</h2>
          {memberOrders.length === 0 ? (
            <div className="py-4 text-sm text-[#5B635E] flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#C88A55]" />
              <span>No wellness product orders yet.</span>
            </div>
          ) : (
            <div className="divide-y divide-[#F0EBE1]">
              {memberOrders.map((order) => (
                <div key={order.id} className="py-3.5 first:pt-0 last:pb-0 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-semibold text-[#1F3A3D]">
                      {order.id}
                    </span>
                    <span className="font-medium text-[#4A6B5D]">{order.status}</span>
                  </div>
                  <p className="text-xs text-[#5B635E]">
                    {order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                  </p>
                  <div className="flex items-center justify-between text-xs text-[#5B635E]">
                    <span>{order.fulfillmentMethod}</span>
                    <span className="font-mono font-semibold tabular-nums text-[#1F3A3D]">
                      {order.totalEtb.toLocaleString()} ETB
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Collected Reflection Words Gallery */}
      <section className="rounded-2xl bg-white border border-[#E7E1D6] p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-[#1F3A3D]">
            Collected Reflection Words
          </h2>
          {member.awardedBadge && (
            <span className="text-xs font-semibold text-[#C86D0A] inline-flex items-center gap-1">
              <Award className="w-4 h-4" />
              {member.awardedBadge}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collectedWords.map((entry) => {
            const themeBg =
              entry.cardTheme === 'yellow'
                ? 'bg-[#F4DF2B] border-[#DCC416] text-[#1E221F]'
                : entry.cardTheme === 'green'
                  ? 'bg-[#87B336] border-[#6E9626] text-[#182214]'
                  : 'bg-[#F2AE5C] border-[#DB913B] text-[#1E221F]';
            return (
              <article
                key={entry.id}
                className={`rounded-xl p-4 space-y-2 border ${themeBg}`}
              >
                <div className="flex items-baseline justify-between gap-2 pb-1.5 border-b border-[#D96914]/45">
                  <h3 className="text-base font-bold">
                    {entry.word}
                    {entry.amharicWord ? ` · ${entry.amharicWord}` : ''}
                  </h3>
                  <span className="text-[11px] opacity-80 tabular-nums shrink-0">
                    {entry.earnedAt}
                  </span>
                </div>
                <p className="text-xs leading-relaxed font-medium">
                  &ldquo;{entry.reflection}&rdquo;
                </p>
                {entry.amharicReflection && (
                  <p className="text-xs leading-relaxed opacity-90">
                    &ldquo;{entry.amharicReflection}&rdquo;
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <QRPassModal
        registration={activePass}
        venueName={brand.venueName}
        onClose={() => setActivePassId(null)}
      />
    </div>
  );
};
