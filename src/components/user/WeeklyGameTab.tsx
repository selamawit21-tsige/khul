import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Award, BellRing, Check, Flame, Gift, Shuffle, Sparkles, X} from 'lucide-react';
import {addDaysToKey, toLocalDateKey} from '../../hooks/useSanctuaryStore';
import {CommunityMember, ReflectionWord, WeeklyGameConfig} from '../../types/khul';
import {VirtueGiftCard} from '../VirtueGiftCard';

interface WeeklyGameTabProps {
  weeklyGame: WeeklyGameConfig;
  reflectionWords: ReflectionWord[];
  brandLogoUrl?: string;
  currentUser: CommunityMember;
  members: CommunityMember[];
  checkedInToday: boolean;
  missedDays: number;
  streakStartDate?: string;
  onCompletePractice: () => ReflectionWord;
  onDrawVirtueGift: (excludeIds?: string[]) => ReflectionWord;
}

const SHORT_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MOTIVATIONAL_REMINDERS = [
  {
    headline: 'Your streak is ending tonight — stay in your rhythm!',
    body: 'Two quiet minutes is all it takes to reset your nervous system. Small daily pauses build unshakable calm—keep going, you have come this far.',
    amharic: 'ትንሽ የየቀኑ እረፍት ታላቅ ሰላምን ይገነባል። የጀመርከውን ጉዞ ዛሬም ቀጥል!',
  },
  {
    headline: 'You missed a day — your streak is about to end!',
    body: 'Missing a day never erases your progress. Return for 1 minute of shaking and 1 minute of stillness right now—every breath is a fresh beginning (#ታደስኩ).',
    amharic: 'አንድ ቀን መቅረትህ ጉዞህን አያስቆመውም። አሁን ለሁለት ደቂቃ ተመልሰህ መንፈስህን አድስ!',
  },
];

function formatShortDay(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  return dt.toLocaleDateString('en-US', {weekday: 'short', month: 'short', day: 'numeric'});
}

export const WeeklyGameTab: React.FC<WeeklyGameTabProps> = ({
  weeklyGame,
  reflectionWords,
  brandLogoUrl,
  currentUser,
  members,
  checkedInToday,
  missedDays,
  streakStartDate,
  onCompletePractice,
  onDrawVirtueGift,
}) => {
  const [revealedWord, setRevealedWord] = useState<ReflectionWord | null>(null);
  const [boxWord, setBoxWord] = useState<ReflectionWord | null>(null);
  const [recentWordIds, setRecentWordIds] = useState<string[]>([]);
  const [isMixing, setIsMixing] = useState(false);
  const [mixPreviewIndex, setMixPreviewIndex] = useState(0);
  const [reminderSaved, setReminderSaved] = useState(false);
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

  // Build 7-day streak strip anchored to the user's actual start day and Today
  const streakDays = useMemo(() => {
    const todayKey = toLocalDateKey();
    const activePriorDays =
      missedDays >= 1 && !checkedInToday
        ? 0
        : checkedInToday
          ? Math.max(0, Math.min(6, currentUser.currentStreak - 1))
          : Math.max(0, Math.min(6, currentUser.currentStreak));

    const windowStartKey = addDaysToKey(todayKey, -activePriorDays);

    return Array.from({length: 7}, (_, idx) => {
      const dateKey = addDaysToKey(windowStartKey, idx);
      const [y, m, d] = dateKey.split('-').map(Number);
      const dt = new Date(y, (m || 1) - 1, d || 1);
      const dayLabel = SHORT_WEEKDAYS[dt.getDay()];
      const isToday = dateKey === todayKey;
      const isPastCompleted = idx < activePriorDays;
      const done = isPastCompleted || (isToday && checkedInToday);

      return {
        dateKey,
        dayLabel,
        isToday,
        done,
        dayNumber: idx + 1,
      };
    });
  }, [checkedInToday, currentUser.currentStreak, missedDays]);

  const displayedStartLabel = useMemo(() => {
    if (missedDays >= 1 && !checkedInToday) {
      return formatShortDay(toLocalDateKey());
    }
    const anchor = streakStartDate || streakDays[0]?.dateKey || toLocalDateKey();
    return formatShortDay(anchor);
  }, [checkedInToday, missedDays, streakDays, streakStartDate]);

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

  const handleEnableReminder = async () => {
    try {
      if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        await Notification.requestPermission();
      }
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('Khul World · Streak Reminder', {
          body: `${currentUser.currentStreak}-Day Streak: Take 2 mindful minutes before midnight so your streak stays alive!`,
        });
      }
    } catch {
      // Ignore notification API errors in restricted iframes
    }
    setReminderSaved(true);
    window.setTimeout(() => setReminderSaved(false), 5000);
  };

  const previewWord =
    reflectionWords[mixPreviewIndex % Math.max(1, reflectionWords.length)] ?? boxWord;
  const activeBoxCard = isMixing ? previewWord : boxWord;

  const activeReminder =
    missedDays >= 1 ? MOTIVATIONAL_REMINDERS[1] : MOTIVATIONAL_REMINDERS[0];

  return (
    <div className="space-y-8">
      {/* Motivational Streak-Ending Reminder Banner when practice hasn't been done today or was missed */}
      {!checkedInToday && (currentUser.currentStreak > 0 || missedDays >= 1) && (
        <section
          aria-label="Streak reminder"
          className={`rounded-2xl border p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            missedDays >= 1
              ? 'bg-[#FFF3E6] border-[#F1931E]'
              : 'bg-[#FFF9F0] border-[#E7C697]'
          }`}
        >
          <div className="flex items-start gap-3.5 max-w-2xl">
            <div className="w-10 h-10 rounded-xl bg-[#F1931E]/20 border border-[#F1931E]/50 flex items-center justify-center shrink-0 mt-0.5">
              <BellRing className="w-5 h-5 text-[#C86D0A]" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#C86D0A]">
                {missedDays >= 1
                  ? `Missed ${missedDays} ${missedDays === 1 ? 'Day' : 'Days'} · Streak Ending Alert`
                  : `${currentUser.currentStreak}-Day Streak Ending Tonight`}
              </p>
              <h2 className="text-base font-semibold text-[#1F3A3D]">
                {activeReminder.headline}
              </h2>
              <p className="text-xs sm:text-sm text-[#49504C] leading-relaxed">
                {activeReminder.body}
              </p>
              <p className="text-xs text-[#4A6B5D] font-medium">{activeReminder.amharic}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleComplete}
            disabled={isMixing}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#F1931E] hover:bg-[#DF8312] text-[#1F3A3D] text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Flame className="w-4 h-4" />
            <span>{missedDays >= 1 ? 'Restart Streak Today' : 'Save Streak Today'}</span>
          </button>
        </section>
      )}

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

                {/* Interactive Checklist Checkbox */}
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={checkedInToday}
                  disabled={checkedInToday || isMixing}
                  onClick={handleComplete}
                  className={`w-full text-left rounded-xl border p-3.5 flex items-start gap-3 transition-colors ${
                    checkedInToday
                      ? 'bg-[#EEF4F0] border-[#C6D8CC] cursor-default'
                      : 'bg-[#FAF8F5] border-[#EAE3D5] hover:border-[#F1931E] hover:bg-[#FFFDF9] cursor-pointer'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      checkedInToday
                        ? 'bg-[#4A6B5D] text-white'
                        : 'border-2 border-[#C8BFB0] bg-white'
                    }`}
                  >
                    {checkedInToday && <Check className="w-3.5 h-3.5" />}
                  </span>
                  <span className="text-xs sm:text-sm text-[#2C302E] font-medium">
                    {weeklyGame.checklistLabel}
                  </span>
                </button>
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

        {/* Duolingo-Style Streak Tracker Starting From User's Start Day */}
        <section className="lg:col-span-5 rounded-2xl bg-[#1F3A3D] text-[#FAF8F5] p-6 sm:p-8 flex flex-col justify-between gap-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-[#F1931E]">Mindful Consistency</p>
              <h2 className="mt-1 text-3xl font-bold font-mono tabular-nums text-white">
                {missedDays >= 1 && !checkedInToday ? 0 : currentUser.currentStreak}-Day Streak
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

          {/* 7-Day Streak Progress Starting From Streak Start Day */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 text-xs text-[#D6DED9]">
              <span className="font-medium">7-Day Rhythm</span>
              <span className="text-[11px] text-[#C6D1CB]">Started {displayedStartLabel}</span>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {streakDays.map((item) => (
                <div key={item.dateKey} className="flex flex-col items-center gap-1.5">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                      item.done
                        ? 'bg-[#F1931E] text-[#1F3A3D]'
                        : item.isToday
                          ? 'bg-white/15 text-[#F1931E] border-2 border-[#F1931E]'
                          : 'bg-white/10 text-[#A8B6AF] border border-white/15'
                    }`}
                  >
                    {item.done ? <Check className="w-4 h-4" /> : item.dayLabel.slice(0, 1)}
                  </div>
                  <span
                    className={`text-[11px] ${
                      item.isToday ? 'font-semibold text-[#F1931E]' : 'text-[#C6D1CB]'
                    }`}
                  >
                    {item.isToday ? 'Today' : item.dayLabel}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-white/15 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-[#D6DED9]">
              <span>Active Package: {currentUser.activePackage}</span>
              <span className="text-[#F1931E] font-medium">Monthly Reward Eligible</span>
            </div>

            {!checkedInToday && (
              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => void handleEnableReminder()}
                  className="min-h-[36px] px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-[#FAF8F5] text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <BellRing className="w-3.5 h-3.5 text-[#F1931E]" />
                  <span>
                    {reminderSaved
                      ? 'Reminder ready: Keep your flame alive!'
                      : 'Send Daily Streak Reminder'}
                  </span>
                </button>
              </div>
            )}
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
