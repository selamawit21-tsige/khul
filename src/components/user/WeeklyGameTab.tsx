import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Award, Check, Flame, Gift, Shuffle, Sparkles, X} from 'lucide-react';
import {CommunityMember, ReflectionWord, WeeklyGameConfig} from '../../types/khul';
import {VirtueGiftCard} from '../VirtueGiftCard';

interface WeeklyGameTabProps {
  weeklyGame: WeeklyGameConfig;
  reflectionWords: ReflectionWord[];
  brandLogoUrl?: string;
  currentUser: CommunityMember;
  members: CommunityMember[];
  checkedInToday: boolean;
  onCompletePractice: () => ReflectionWord;
  onDrawVirtueGift: (excludeIds?: string[]) => ReflectionWord;
}

const WEEK_DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const WeeklyGameTab: React.FC<WeeklyGameTabProps> = ({
  weeklyGame,
  reflectionWords,
  brandLogoUrl,
  currentUser,
  members,
  checkedInToday,
  onCompletePractice,
  onDrawVirtueGift,
}) => {
  const [revealedWord, setRevealedWord] = useState<ReflectionWord | null>(null);
  const [boxWord, setBoxWord] = useState<ReflectionWord | null>(null);
  const [recentWordIds, setRecentWordIds] = useState<string[]>([]);
  const [isMixing, setIsMixing] = useState(false);
  const [mixPreviewIndex, setMixPreviewIndex] = useState(0);
  const mixTimerRef = useRef<number | null>(null);
  const mixIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (mixTimerRef.current) window.clearTimeout(mixTimerRef.current);
      if (mixIntervalRef.current) window.clearInterval(mixIntervalRef.current);
    };
  }, []);

  const rankedMembers = useMemo(
    () =>
      [...members].sort(
        (a, b) =>
          b.currentStreak - a.currentStreak ||
          b.totalDaysPracticed - a.totalDaysPracticed,
      ),
    [members],
  );

  const userRank = rankedMembers.findIndex((m) => m.id === currentUser.id) + 1;

  const recordDrawnId = (id: string) => {
    setRecentWordIds((prev) => {
      const next = [...prev.filter((item) => item !== id), id];
      if (next.length >= reflectionWords.length) {
        return [id];
      }
      return next;
    });
  };

  const triggerVirtueMix = (finalWord: ReflectionWord, openModal: boolean) => {
    if (mixTimerRef.current) window.clearTimeout(mixTimerRef.current);
    if (mixIntervalRef.current) window.clearInterval(mixIntervalRef.current);

    recordDrawnId(finalWord.id);
    setIsMixing(true);
    setMixPreviewIndex(Math.floor(Math.random() * Math.max(1, reflectionWords.length)));

    mixIntervalRef.current = window.setInterval(() => {
      setMixPreviewIndex((prev) => (prev + 1) % Math.max(1, reflectionWords.length));
    }, 95);

    mixTimerRef.current = window.setTimeout(() => {
      if (mixIntervalRef.current) {
        window.clearInterval(mixIntervalRef.current);
        mixIntervalRef.current = null;
      }
      setIsMixing(false);
      setBoxWord(finalWord);
      if (openModal) {
        setRevealedWord(finalWord);
      }
    }, 850);
  };

  const handleComplete = () => {
    if (checkedInToday || isMixing) return;
    const word = onCompletePractice();
    triggerVirtueMix(word, true);
  };

  const handleOpenGiftBox = () => {
    if (isMixing) return;
    const excludeList = boxWord
      ? [...recentWordIds.filter((id) => id !== boxWord.id), boxWord.id]
      : recentWordIds;
    const word = onDrawVirtueGift(excludeList);
    triggerVirtueMix(word, false);
  };

  const previewWord =
    reflectionWords[mixPreviewIndex % Math.max(1, reflectionWords.length)] ?? boxWord;
  const activeBoxCard = isMixing ? previewWord : boxWord;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Active Weekly Challenge & Uploaded Practice Guide Visual */}
        <section className="lg:col-span-7 rounded-2xl bg-white border border-[#E7E1D6] overflow-hidden flex flex-col justify-between">
          <div className="grid grid-cols-1 md:grid-cols-12">
            {weeklyGame.imageUrl && (
              <div className="md:col-span-5 bg-[#FAF8F5] border-b md:border-b-0 md:border-r border-[#E7E1D6] flex items-center justify-center">
                <img
                  src={weeklyGame.imageUrl}
                  alt={weeklyGame.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full max-h-80 md:max-h-full object-cover object-top"
                />
              </div>
            )}

            <div
              className={`${
                weeklyGame.imageUrl ? 'md:col-span-7' : 'md:col-span-12'
              } p-6 sm:p-7 flex flex-col justify-between gap-5`}
            >
              <div className="space-y-3.5">
                <p className="text-xs text-[#5B635E]">
                  <span className="font-medium text-[#4A6B5D]">{weeklyGame.weekLabel}</span>
                  <span aria-hidden="true"> · </span>
                  <span>{weeklyGame.durationLabel}</span>
                </p>
                <h1 className="text-xl sm:text-2xl font-semibold text-[#1F3A3D] leading-snug">
                  {weeklyGame.title}
                </h1>
                <p className="text-sm text-[#49504C] leading-relaxed">
                  {weeklyGame.prompt}
                </p>

                <div className="rounded-xl bg-[#FAF8F5] border border-[#EAE3D5] p-3.5 flex items-start gap-3">
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                      checkedInToday
                        ? 'bg-[#4A6B5D] text-white'
                        : 'border border-[#C8BFB0] bg-white'
                    }`}
                  >
                    {checkedInToday && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <p className="text-xs sm:text-sm text-[#2C302E]">
                    {weeklyGame.checklistLabel}
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  disabled={checkedInToday || isMixing}
                  onClick={handleComplete}
                  className={`w-full min-h-[48px] px-4 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    checkedInToday
                      ? 'bg-[#EEF4F0] text-[#4A6B5D] border border-[#C6D8CC] cursor-default'
                      : 'bg-[#F1931E] hover:bg-[#DF8312] text-[#1F3A3D]'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {checkedInToday
                      ? "Today's Practice Completed"
                      : "Complete Today's Practice"}
                  </span>
                </button>
                <p className="text-xs text-[#5B635E]">{weeklyGame.rewardNote}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Duolingo-Style Streak Tracker */}
        <section className="lg:col-span-5 rounded-2xl bg-[#1F3A3D] text-[#FAF8F5] p-6 sm:p-8 flex flex-col justify-between gap-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-[#F1931E]">Mindful Consistency</p>
              <h2 className="mt-1 text-3xl font-bold font-mono tabular-nums text-white">
                {currentUser.currentStreak}-Day Streak
              </h2>
              <p className="mt-1 text-xs text-[#C6D1CB]">
                <span className="tabular-nums">{currentUser.totalDaysPracticed}</span> total
                days practiced · Rank #{userRank} in community
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#F1931E]/20 border border-[#F1931E]/40 flex items-center justify-center shrink-0">
              <Flame className="w-6 h-6 text-[#F1931E]" />
            </div>
          </div>

          {/* 7-day Mon-Sun Progress Bar */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-[#D6DED9]">This Week (Mon – Sun)</p>
            <div className="grid grid-cols-7 gap-2">
              {WEEK_DAY_LABELS.map((day, index) => {
                const done = currentUser.weekDaysCompleted[index];
                return (
                  <div key={day} className="flex flex-col items-center gap-2">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                        done
                          ? 'bg-[#F1931E] text-[#1F3A3D]'
                          : 'bg-white/10 text-[#A8B6AF] border border-white/15'
                      }`}
                    >
                      {done ? <Check className="w-4 h-4" /> : day.slice(0, 1)}
                    </div>
                    <span className="text-[11px] text-[#C6D1CB]">{day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-white/15 flex items-center justify-between text-xs text-[#D6DED9]">
            <span>Active Package: {currentUser.activePackage}</span>
            <span className="text-[#F1931E] font-medium">Monthly Reward Eligible</span>
          </div>
        </section>
      </div>

      {/* KHUL VIRTUE GIFT BOX (Authentic Physical Slip Layout in Yellow, Green, Orange + English & Amharic) */}
      <section
        aria-labelledby="virtue-box-heading"
        className="rounded-2xl bg-white border border-[#E7E1D6] p-6 sm:p-8"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-center">
          {/* Small Interactive Virtue Gift Box */}
          <div className="lg:col-span-5 flex flex-col items-center lg:items-start space-y-4">
            <div className="space-y-1.5 text-center lg:text-left">
              <p className="text-xs font-medium text-[#4A6B5D]">
                Post-Practice Virtue Gift · የበጎነት ስጦታ
              </p>
              <h2 id="virtue-box-heading" className="text-2xl font-semibold text-[#1F3A3D]">
                Khul Virtue Gift Box
              </h2>
              <p className="text-sm text-[#49504C] leading-relaxed">
                Click the Virtue Box to mix the yellow, green &amp; orange Khul cards and
                pop a new bilingual English &amp; Amharic word with its reflection thought.
              </p>
            </div>

            {/* Tactile Small Physical Box Visual holding Orange, Green, Yellow cards */}
            <button
              type="button"
              onClick={handleOpenGiftBox}
              disabled={isMixing}
              aria-label="Mix and open Khul Virtue Gift Box"
              className="group relative w-full max-w-[300px] pt-8 pb-2 px-3 rounded-2xl bg-[#FAF8F5] border border-[#E7E1D6] hover:border-[#F1931E] transition-all cursor-pointer"
            >
              {/* Stacked Peeking Cards inside the small box */}
              <div className="relative h-14 mx-4">
                <div
                  className={`absolute inset-x-3 top-0 h-11 rounded-md bg-[#F4DF2B] border border-[#DCC416] shadow-xs transition-transform duration-300 ${
                    isMixing ? '-translate-y-2 -rotate-6' : '-rotate-3 group-hover:-rotate-6'
                  }`}
                />
                <div
                  className={`absolute inset-x-1.5 top-2 h-11 rounded-md bg-[#87B336] border border-[#6E9626] shadow-xs transition-transform duration-300 ${
                    isMixing ? '-translate-y-3 rotate-6' : 'rotate-2 group-hover:rotate-5'
                  }`}
                />
                <div
                  className={`absolute inset-x-0 top-4 h-11 rounded-md bg-[#F2AE5C] border border-[#DB913B] shadow-xs transition-transform duration-300 ${
                    isMixing ? '-translate-y-4 -rotate-2' : 'rotate-0 group-hover:-translate-y-1'
                  }`}
                />
              </div>

              {/* Small Box Body */}
              <div className="relative z-10 rounded-xl bg-[#1F3A3D] text-[#FAF8F5] px-4 py-3.5 border-t-4 border-[#F1931E] shadow-md flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-left">
                  <div className="w-9 h-9 rounded-lg bg-[#F1931E] text-[#1F3A3D] flex items-center justify-center shrink-0">
                    {isMixing ? (
                      <Shuffle className="w-4 h-4 animate-spin" />
                    ) : (
                      <Gift className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">
                      {isMixing ? 'Mixing Cards...' : 'Khul Virtue Box'}
                    </p>
                    <p className="text-[11px] text-[#D6DED9]">
                      {isMixing ? 'በማዋሃድ ላይ...' : 'Tap to Mix & Pop · ይክፈቱ'}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#F1931E] text-[#1F3A3D] whitespace-nowrap">
                  {boxWord ? 'Next Card' : 'Open'}
                </span>
              </div>
            </button>
          </div>

          {/* Popped Khul Virtue Gift Slip + Thought */}
          <div className="lg:col-span-7">
            {!activeBoxCard ? (
              <div
                onClick={handleOpenGiftBox}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleOpenGiftBox();
                  }
                }}
                className="rounded-2xl border border-dashed border-[#D8CEBE] bg-[#FAF8F5] p-6 sm:p-8 text-center space-y-4 hover:border-[#F1931E] transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="w-6 h-4 rounded bg-[#F4DF2B] border border-[#DCC416]" />
                  <span className="w-6 h-4 rounded bg-[#87B336] border border-[#6E9626]" />
                  <span className="w-6 h-4 rounded bg-[#F2AE5C] border border-[#DB913B]" />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-semibold text-[#1F3A3D]">
                    Tap the Virtue Box to draw a Khul Gift Card
                  </p>
                  <p className="text-xs text-[#5B635E]">
                    የበጎነት ሳጥኑን ሲጫኑ የተለያዩ ቢጫ፣ አረንጓዴ እና ብርቱካናማ ካርዶችን አዋህዶ ያወጣል
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Physical Card Replica */}
                <VirtueGiftCard
                  word={activeBoxCard.word}
                  amharicWord={activeBoxCard.amharicWord}
                  cardTheme={activeBoxCard.cardTheme}
                  logoUrl={brandLogoUrl}
                  isShuffling={isMixing}
                />

                {/* Popped Thought in English & Amharic */}
                <div className="rounded-xl bg-[#FAF8F5] border border-[#E7E1D6] p-4 sm:p-5 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 text-xs text-[#5B635E]">
                    <span className="font-medium text-[#4A6B5D]">
                      {isMixing
                        ? 'Shuffling Virtue Deck · በማዋሃድ ላይ...'
                        : 'Today’s Virtue Thought · የእለቱ ሀሳብ'}
                    </span>
                    <button
                      type="button"
                      onClick={handleOpenGiftBox}
                      disabled={isMixing}
                      className="font-semibold text-[#C86D0A] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Shuffle className="w-3.5 h-3.5" />
                      <span>Mix Another Card</span>
                    </button>
                  </div>
                  <p className="text-sm sm:text-base font-medium text-[#1F3A3D] leading-relaxed">
                    &ldquo;{activeBoxCard.reflection}&rdquo;
                  </p>
                  <p className="text-sm text-[#49504C] leading-relaxed">
                    &ldquo;{activeBoxCard.amharicReflection}&rdquo;
                  </p>
                  <p className="pt-2 border-t border-[#EAE3D5] text-xs text-[#5B635E]">
                    <span className="font-semibold text-[#1F3A3D]">Practice:</span>{' '}
                    {activeBoxCard.practiceHint}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Community Streak Leaderboard */}
      <section className="rounded-2xl bg-white border border-[#E7E1D6] p-6 sm:p-7 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold text-[#1F3A3D]">
              Consistency Recognition Leaderboard
            </h2>
            <p className="text-xs text-[#5B635E]">
              Celebrating steady daily presence across the Khul Addis Ababa circle.
            </p>
          </div>
          <span className="text-xs font-medium text-[#4A6B5D]">
            Your Standing: #{userRank} of {rankedMembers.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#EFEAE0] text-xs text-[#5B635E]">
                <th className="py-3 pr-4 font-medium">Rank</th>
                <th className="py-3 pr-4 font-medium">Practitioner</th>
                <th className="py-3 pr-4 font-medium">Pass</th>
                <th className="py-3 pr-4 font-medium text-right">Active Streak</th>
                <th className="py-3 font-medium text-right">Total Days</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4F0E8] text-sm">
              {rankedMembers.map((m, idx) => {
                const isSelf = m.id === currentUser.id;
                return (
                  <tr key={m.id} className={isSelf ? 'bg-[#FFF8EE]' : ''}>
                    <td className="py-3 pr-4 font-mono tabular-nums text-xs text-[#5B635E]">
                      #{idx + 1}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="font-medium text-[#1F3A3D]">
                        {m.name} {isSelf && '(You)'}
                      </div>
                      {m.awardedBadge && (
                        <div className="text-xs text-[#C86D0A] inline-flex items-center gap-1 mt-0.5">
                          <Award className="w-3.5 h-3.5" />
                          <span>{m.awardedBadge}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-xs text-[#5B635E]">{m.activePackage}</td>
                    <td className="py-3 pr-4 text-right font-mono tabular-nums font-semibold text-[#1F3A3D]">
                      {m.currentStreak} days
                    </td>
                    <td className="py-3 text-right font-mono tabular-nums text-[#5B635E]">
                      {m.totalDaysPracticed}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Post-Streak Virtue Gift Celebration Modal */}
      {revealedWord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reflection-word-title"
        >
          <div className="w-full max-w-lg rounded-2xl bg-[#FAF8F5] border border-[#E7E1D6] p-6 sm:p-7 shadow-2xl relative space-y-5">
            <button
              type="button"
              onClick={() => setRevealedWord(null)}
              className="absolute top-4 right-4 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-[#49504C] hover:bg-[#EFEAE0] cursor-pointer"
              aria-label="Close virtue gift card"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1 pr-6">
              <p className="text-xs font-medium text-[#4A6B5D]">
                {currentUser.currentStreak}-Day Mindful Streak · Virtue Gift (የበጎነት ስጦታ)
              </p>
              <h3 id="reflection-word-title" className="text-lg font-semibold text-[#1F3A3D]">
                Your Popped Virtue Gift Card
              </h3>
            </div>

            <VirtueGiftCard
              word={revealedWord.word}
              amharicWord={revealedWord.amharicWord}
              cardTheme={revealedWord.cardTheme}
              logoUrl={brandLogoUrl}
            />

            <div className="rounded-xl bg-white border border-[#E7E1D6] p-4 space-y-2 text-left">
              <p className="text-sm font-medium text-[#1F3A3D] leading-relaxed">
                &ldquo;{revealedWord.reflection}&rdquo;
              </p>
              <p className="text-sm text-[#49504C] leading-relaxed">
                &ldquo;{revealedWord.amharicReflection}&rdquo;
              </p>
              <p className="pt-2 border-t border-[#F0EBE1] text-xs text-[#5B635E]">
                <span className="font-semibold text-[#C86D0A]">Carry into your day:</span>{' '}
                {revealedWord.practiceHint}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setRevealedWord(null)}
              className="w-full min-h-[44px] rounded-xl bg-[#1F3A3D] hover:bg-[#162B2D] text-[#FAF8F5] text-sm font-semibold transition-colors cursor-pointer"
            >
              Receive Virtue Gift · ስጦታውን ተቀበል
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
