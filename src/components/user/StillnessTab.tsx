import React, {useEffect, useState} from 'react';
import {Check, Pause, Play, RotateCcw} from 'lucide-react';
import {ReflectionWord} from '../../types/khul';

interface StillnessTabProps {
  intention: string;
  reflectionWords: ReflectionWord[];
  onSaveIntention: (value: string) => void;
}

export const StillnessTab: React.FC<StillnessTabProps> = ({
  intention,
  reflectionWords,
  onSaveIntention,
}) => {
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [draftIntention, setDraftIntention] = useState(intention);
  const [savedNotice, setSavedNotice] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  const elapsed = 60 - secondsLeft;
  const cycleSec = elapsed % 10;
  const guideLabel = !running
    ? secondsLeft === 0
      ? 'Session complete · Notice your stillness'
      : 'Press Begin for a quiet 60-second reset'
    : cycleSec < 4
      ? 'Inhale slowly (4s)'
      : cycleSec < 6
        ? 'Rest gently (2s)'
        : 'Exhale completely (4s)';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveIntention(draftIntention);
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 2500);
  };

  const activeWord = reflectionWords[wordIndex % reflectionWords.length];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#1F3A3D]">
          Stillness Corner
        </h1>
        <p className="mt-1 text-sm text-[#5B635E]">
          A distraction-free corner for sixty seconds of breath and intentional reflection.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Guided 1-Minute Breath Pacer */}
        <section className="lg:col-span-6 rounded-2xl bg-white border border-[#E7E1D6] p-6 sm:p-8 flex flex-col items-center justify-between text-center gap-6">
          <div className="space-y-1">
            <p className="text-xs font-medium text-[#4A6B5D]">4 – 2 – 4 Paced Breathing</p>
            <h2 className="text-lg font-semibold text-[#1F3A3D]">{guideLabel}</h2>
          </div>

          <div className="relative w-48 h-48 flex items-center justify-center">
            <div
              className={`absolute inset-0 rounded-full bg-[#F1931E]/20 ${
                running ? 'animate-khul-breathe-ring' : ''
              }`}
              aria-hidden="true"
            />
            <div
              className={`w-36 h-36 rounded-full bg-[#FAF8F5] border-2 border-[#F1931E] flex flex-col items-center justify-center ${
                running ? 'animate-khul-breathe' : ''
              }`}
            >
              <span className="font-mono text-3xl font-semibold tabular-nums text-[#1F3A3D]">
                0:{String(secondsLeft).padStart(2, '0')}
              </span>
              <span className="text-xs text-[#5B635E] mt-1">
                {running ? 'Breathing' : 'Ready'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (secondsLeft === 0) setSecondsLeft(60);
                setRunning((prev) => !prev);
              }}
              className="min-h-[44px] px-6 py-2.5 rounded-xl bg-[#F1931E] hover:bg-[#DF8312] text-[#1F3A3D] text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{running ? 'Pause' : secondsLeft === 0 ? 'Practice Again' : 'Begin 60s Reset'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRunning(false);
                setSecondsLeft(60);
              }}
              className="min-h-[44px] min-w-[44px] px-3 rounded-xl border border-[#DDD5C7] hover:bg-[#FAF8F5] text-[#49504C] inline-flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Reset timer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* Grounding Intention & Word Contemplation */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <section className="rounded-2xl bg-white border border-[#E7E1D6] p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[#1F3A3D]">
              Today&apos;s Grounding Intention
            </h2>
            <form onSubmit={handleSave} className="space-y-3">
              <textarea
                rows={3}
                value={draftIntention}
                onChange={(e) => setDraftIntention(e.target.value)}
                placeholder="Write a calm, honest intention for how you wish to meet today..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD5C7] bg-[#FAF8F5] text-sm text-[#2C302E] focus:outline-none focus:border-[#F1931E]"
              />
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-[#4A6B5D]">
                  {savedNotice ? (
                    <span className="inline-flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Saved to your device
                    </span>
                  ) : (
                    'Stored privately on this device'
                  )}
                </span>
                <button
                  type="submit"
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-[#1F3A3D] hover:bg-[#162B2D] text-[#FAF8F5] text-xs font-semibold transition-colors cursor-pointer"
                >
                  Save Intention
                </button>
              </div>
            </form>
          </section>

          {activeWord && (
            <section className="rounded-2xl bg-[#1F3A3D] text-[#FAF8F5] p-6 space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-2">
                <p className="text-xs font-medium text-[#F1931E]">Khul Word Contemplation</p>
                <h3 className="text-2xl font-semibold text-white">{activeWord.word}</h3>
                <p className="text-sm text-[#D6DED9] leading-relaxed">
                  {activeWord.reflection}
                </p>
              </div>
              <div className="pt-3 border-t border-white/15 flex items-center justify-between gap-4">
                <span className="text-xs text-[#C6D1CB]">{activeWord.practiceHint}</span>
                <button
                  type="button"
                  onClick={() => setWordIndex((i) => (i + 1) % reflectionWords.length)}
                  className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#F1931E] text-[#1F3A3D] text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Next Word
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
