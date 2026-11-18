import React, {useEffect, useState} from 'react';
import {ArrowRight, BellRing, Building2, Calendar, Flame, ShoppingBag, Sparkles} from 'lucide-react';
import {
  Announcement,
  CommunityMember,
  ServiceSubTab,
  UserTab,
  WednesdaySession,
  WeeklyGameConfig,
} from '../../types/khul';
import {PWAInstallButton} from '../PWAInstallButton';

interface HomeTabProps {
  member: CommunityMember;
  announcements: Announcement[];
  sessions: WednesdaySession[];
  weeklyGame: WeeklyGameConfig;
  checkedInToday: boolean;
  missedDays: number;
  onNavigateTab: (tab: UserTab, subTab?: ServiceSubTab) => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({
  member,
  announcements,
  sessions,
  weeklyGame,
  checkedInToday,
  missedDays,
  onNavigateTab,
}) => {
  const [breathSecond, setBreathSecond] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setBreathSecond((prev) => (prev + 1) % 10);
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const breathPhase =
    breathSecond < 4
      ? 'Breathe in gently'
      : breathSecond < 6
        ? 'Rest in stillness'
        : 'Release slowly';

  const firstName = member.name.split(' ')[0] || member.name;

  return (
    <div className="space-y-10">
      {/* Peaceful Entry Hero with 10-second breathing pulse */}
      <section className="rounded-2xl bg-white border border-[#E7E1D6] p-6 sm:p-8 lg:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-5">
            <p className="text-xs font-medium text-[#4A6B5D]">
              Khul World · Addis Ababa
            </p>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#1F3A3D] leading-tight text-balance">
              Take a deep breath, {firstName}. Welcome to your space.
            </h1>
            <p className="text-sm sm:text-base text-[#525A55] leading-relaxed max-w-xl">
              Step out of rush and noise. Anchor your week with Wednesday Kinet Hiwot
              circles, grounded self-engineering rituals, and your daily mindfulness streak.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => onNavigateTab('game')}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#F1931E] hover:bg-[#DF8312] text-[#1F3A3D] text-sm font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Flame className="w-4 h-4" />
                <span>
                  {checkedInToday
                    ? `${member.currentStreak}-Day Streak Complete`
                    : `Daily Practice · ${member.currentStreak}-Day Streak`}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('services', 'wednesday')}
                className="min-h-[44px] px-5 py-2.5 rounded-xl border border-[#D8D0C2] hover:bg-[#FAF8F5] text-[#1F3A3D] text-sm font-medium inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Reserve Wednesday Seat</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <PWAInstallButton variant="compact" />
            </div>
          </div>

          {/* 10-Second Breathing Pulse Visual */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center py-4">
            <div className="relative w-44 h-44 flex items-center justify-center">
              <div
                className="absolute inset-0 rounded-full bg-[#F1931E]/20 animate-khul-breathe-ring"
                aria-hidden="true"
              />
              <div
                className="w-32 h-32 rounded-full bg-gradient-to-br from-[#F1931E]/35 via-[#C88A55]/25 to-[#4A6B5D]/30 border border-[#F1931E]/40 flex flex-col items-center justify-center text-center p-4 animate-khul-breathe"
              >
                <span className="text-xs font-medium text-[#1F3A3D]">{breathPhase}</span>
                <span className="mt-1 font-mono text-xs tabular-nums text-[#4A6B5D]">
                  10s cycle
                </span>
              </div>
            </div>
            <p className="mt-2 text-xs text-[#5B635E]">
              Today&apos;s practice: <span className="font-medium text-[#1F3A3D]">{weeklyGame.title}</span>
            </p>
          </div>
        </div>
      </section>

      {!checkedInToday && (member.currentStreak > 0 || missedDays >= 1) && (
        <section
          aria-label="Daily streak reminder"
          className="rounded-2xl bg-[#FFF8EE] border border-[#F1931E]/60 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3">
            <BellRing className="w-5 h-5 text-[#C86D0A] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-[#1F3A3D]">
                {missedDays >= 1
                  ? 'You missed a day — your streak is ending! Come back for 2 quiet minutes today.'
                  : `Your ${member.currentStreak}-day streak is ending tonight — keep your rhythm alive!`}
              </p>
              <p className="text-xs text-[#5B635E]">
                One mindful pause resets the whole day. Open the Weekly Game to check off today&apos;s practice.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('game')}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-[#F1931E] hover:bg-[#DF8312] text-[#1F3A3D] text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
          >
            {missedDays >= 1 ? 'Restart Streak' : 'Keep Streak Alive'}
          </button>
        </section>
      )}

      {/* Quick Service Highlights */}
      <section aria-labelledby="pillars-heading" className="space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="pillars-heading" className="text-xl font-semibold text-[#1F3A3D]">
            Khul Pillars
          </h2>
          <button
            type="button"
            onClick={() => onNavigateTab('services', 'wednesday')}
            className="text-sm font-medium text-[#C86D0A] hover:text-[#1F3A3D] transition-colors whitespace-nowrap cursor-pointer"
          >
            Explore all services
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            type="button"
            onClick={() => onNavigateTab('services', 'wednesday')}
            className="text-left rounded-2xl bg-white border border-[#E7E1D6] hover:border-[#F1931E] p-5 transition-colors flex flex-col justify-between gap-4 cursor-pointer"
          >
            <div className="space-y-2">
              <Calendar className="w-5 h-5 text-[#F1931E]" />
              <h3 className="text-base font-semibold text-[#1F3A3D]">Wednesday Sessions</h3>
              <p className="text-xs text-[#5B635E] leading-relaxed">
                Weekly Kinet Hiwot circles at Bole Rwanda. Drop-in or monthly pass.
              </p>
            </div>
            <span className="text-xs font-semibold text-[#1F3A3D] inline-flex items-center gap-1">
              View 4 upcoming dates <ArrowRight className="w-3.5 h-3.5 text-[#F1931E]" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('game')}
            className="text-left rounded-2xl bg-white border border-[#E7E1D6] hover:border-[#F1931E] p-5 transition-colors flex flex-col justify-between gap-4 cursor-pointer"
          >
            <div className="space-y-2">
              <Sparkles className="w-5 h-5 text-[#4A6B5D]" />
              <h3 className="text-base font-semibold text-[#1F3A3D]">Khul Self-Engineering</h3>
              <p className="text-xs text-[#5B635E] leading-relaxed">
                Daily micro-practices, streak tracking, and reflection word draws.
              </p>
            </div>
            <span className="text-xs font-semibold text-[#1F3A3D] inline-flex items-center gap-1">
              Open Weekly Game <ArrowRight className="w-3.5 h-3.5 text-[#F1931E]" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('services', 'life')}
            className="text-left rounded-2xl bg-white border border-[#E7E1D6] hover:border-[#F1931E] p-5 transition-colors flex flex-col justify-between gap-4 cursor-pointer"
          >
            <div className="space-y-2">
              <ShoppingBag className="w-5 h-5 text-[#C88A55]" />
              <h3 className="text-base font-semibold text-[#1F3A3D]">Khul Life Store</h3>
              <p className="text-xs text-[#5B635E] leading-relaxed">
                Linen journals, highland Koseret teas, zafu cushions, and somatic tools.
              </p>
            </div>
            <span className="text-xs font-semibold text-[#1F3A3D] inline-flex items-center gap-1">
              Browse wellness catalog <ArrowRight className="w-3.5 h-3.5 text-[#F1931E]" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('services', 'corporate')}
            className="text-left rounded-2xl bg-white border border-[#E7E1D6] hover:border-[#F1931E] p-5 transition-colors flex flex-col justify-between gap-4 cursor-pointer"
          >
            <div className="space-y-2">
              <Building2 className="w-5 h-5 text-[#1F3A3D]" />
              <h3 className="text-base font-semibold text-[#1F3A3D]">Khul Corporate</h3>
              <p className="text-xs text-[#5B635E] leading-relaxed">
                Reset masterclasses, Flow retreats, and Elevate culture programs.
              </p>
            </div>
            <span className="text-xs font-semibold text-[#1F3A3D] inline-flex items-center gap-1">
              Request proposal <ArrowRight className="w-3.5 h-3.5 text-[#F1931E]" />
            </span>
          </button>
        </div>
      </section>

      {/* Every Wednesday Weekly Lineup */}
      <section aria-labelledby="wednesday-lineup-heading" className="space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <h2 id="wednesday-lineup-heading" className="text-xl font-semibold text-[#1F3A3D]">
              This Month&apos;s Wednesday Sessions
            </h2>
            <p className="text-xs text-[#5B635E]">
              Every Wednesday · 5:45 PM EAT at Khul Wholeness Center
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('services', 'wednesday')}
            className="text-sm font-medium text-[#C86D0A] hover:text-[#1F3A3D] transition-colors whitespace-nowrap cursor-pointer"
          >
            Reserve a seat
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sessions
            .filter((s) => s.published)
            .map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onNavigateTab('services', 'wednesday')}
                className="text-left rounded-2xl bg-white border border-[#E7E1D6] hover:border-[#F1931E] overflow-hidden transition-colors flex flex-col cursor-pointer"
              >
                {s.posterUrl && (
                  <div className="aspect-[4/3] w-full bg-[#1F3A3D] overflow-hidden border-b border-[#EFEAE0]">
                    <img
                      src={s.posterUrl}
                      alt={s.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                )}
                <div className="p-4 space-y-1.5">
                  <p className="text-xs text-[#C86D0A] font-medium">
                    {s.weekLabel ?? s.date}
                  </p>
                  <h3 className="text-sm font-semibold text-[#1F3A3D] leading-snug">
                    {s.title}
                  </h3>
                  <p className="text-xs text-[#5B635E] font-mono tabular-nums">
                    {s.date} · {s.time}
                  </p>
                </div>
              </button>
            ))}
        </div>
      </section>

      {/* Announcements & Mindful Reflections Feed */}
      <section aria-labelledby="feed-heading" className="space-y-4">
        <h2 id="feed-heading" className="text-xl font-semibold text-[#1F3A3D]">
          Announcements &amp; Mindful Reflections
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {announcements.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl bg-white border border-[#E7E1D6] p-6 flex flex-col justify-between gap-4"
            >
              <div className="space-y-2.5">
                <p className="text-xs text-[#5B635E]">
                  <span className="font-medium text-[#4A6B5D]">{item.category}</span>
                  <span aria-hidden="true"> · </span>
                  <span className="tabular-nums">{item.publishedAt}</span>
                </p>
                <h3 className="text-base font-semibold text-[#1F3A3D] leading-snug">
                  {item.title}
                </h3>
                <p className="text-sm text-[#49504C] leading-relaxed">{item.body}</p>
              </div>
              <p className="text-xs text-[#6B736E] pt-3 border-t border-[#F0EBE1]">
                Shared by {item.author}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};
