import React, {useEffect, useMemo, useState} from 'react';
import {
  Award,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Cloud,
  Edit3,
  Flame,
  Megaphone,
  Plus,
  RotateCcw,
  ScanLine,
  Search,
  ShoppingBag,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react';
import {AdminTab, KhulProduct, ProductCategory, ReflectionWord, VirtueCardTheme, WednesdaySession} from '../../types/khul';
import {KhulLogo} from '../KhulLogo';
import {useSanctuaryStore} from '../../hooks/useSanctuaryStore';
import {QRCheckInModal} from './QRCheckInModal';

interface AdminDashboardProps {
  activeTab: AdminTab;
  onChangeTab: (tab: AdminTab) => void;
  store: ReturnType<typeof useSanctuaryStore>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  activeTab,
  onChangeTab,
  store,
}) => {
  const {state} = store;

  // Wednesday session editor state
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [sessionForm, setSessionForm] = useState<WednesdaySession>({
    id: '',
    weekLabel: 'Week 5 · Every Wednesday',
    title: '',
    theme: 'Self-Engineering',
    description: '',
    date: 'Wed, Dec 16, 2026',
    time: '5:45 PM EAT (11:45 Local)',
    facilitator: 'Yoftahe',
    venue: state.brand.venueName,
    mapLink: state.brand.googleMapsUrl,
    capacity: 28,
    registeredCount: 0,
    priceEtb: 650,
    published: true,
    posterUrl: '/assets/aistudio/astewlot_d3a57568.jpg',
  });

  // Venue & Logo branding state
  const [logoInput, setLogoInput] = useState(state.brand.logoUrl);
  const [venueNameInput, setVenueNameInput] = useState(state.brand.venueName);
  const [venueMapsInput, setVenueMapsInput] = useState(state.brand.googleMapsUrl);
  const [brandSavedMsg, setBrandSavedMsg] = useState(false);

  // Store product editor state
  const [productName, setProductName] = useState('');
  const [productCategory, setProductCategory] = useState<ProductCategory>('Practice Tools');
  const [productPrice, setProductPrice] = useState('1200');
  const [productDesc, setProductDesc] = useState('');
  const [productImage, setProductImage] = useState('');

  // Announcement form state
  const [annTitle, setAnnTitle] = useState('');
  const [annCategory, setAnnCategory] = useState<'Announcement' | 'Self-Awareness' | 'Community Update'>('Announcement');
  const [annAuthor, setAnnAuthor] = useState('Khul Team');
  const [annBody, setAnnBody] = useState('');

  // Weekly Game form state
  const [gameDraft, setGameDraft] = useState(state.weeklyGame);
  const [gameSaved, setGameSaved] = useState(false);
  const [sessionSavedMsg, setSessionSavedMsg] = useState(false);

  // Price drafts & save indicators for Packages and Store Products
  const [packagePriceDrafts, setPackagePriceDrafts] = useState<Record<string, string>>({});
  const [savedPackageId, setSavedPackageId] = useState<string | null>(null);
  const [productPriceDrafts, setProductPriceDrafts] = useState<Record<string, string>>({});
  const [savedProductId, setSavedProductId] = useState<string | null>(null);

  useEffect(() => {
    setGameDraft(state.weeklyGame);
  }, [state.weeklyGame]);

  useEffect(() => {
    setLogoInput(state.brand.logoUrl);
    setVenueNameInput(state.brand.venueName);
    setVenueMapsInput(state.brand.googleMapsUrl);
  }, [state.brand.logoUrl, state.brand.venueName, state.brand.googleMapsUrl]);

  // Reflection word form state
  const [wordText, setWordText] = useState('');
  const [wordAmharic, setWordAmharic] = useState('');
  const [wordReflection, setWordReflection] = useState('');
  const [wordAmharicReflection, setWordAmharicReflection] = useState('');
  const [wordHint, setWordHint] = useState('');
  const [wordTheme, setWordTheme] = useState<VirtueCardTheme>('yellow');

  // Registrations & Leaderboard filters
  const [regSearch, setRegSearch] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'checked-in' | 'awaiting'>('all');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'streak' | 'total'>('streak');
  const [badgeDrafts, setBadgeDrafts] = useState<Record<string, string>>({});

  const startEditSession = (session: WednesdaySession) => {
    setEditingSessionId(session.id);
    setSessionForm(session);
  };

  const resetSessionForm = () => {
    setEditingSessionId(null);
    setSessionForm({
      id: '',
      weekLabel: 'Week 5 · Every Wednesday',
      title: '',
      theme: 'Self-Engineering',
      description: '',
      date: 'Wed, Dec 16, 2026',
      time: '5:45 PM EAT (11:45 Local)',
      facilitator: 'Yoftahe',
      venue: state.brand.venueName,
      mapLink: state.brand.googleMapsUrl,
      capacity: 28,
      registeredCount: 0,
      priceEtb: 650,
      published: true,
      posterUrl: '/assets/aistudio/astewlot_d3a57568.jpg',
    });
  };

  const handleSaveSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionForm.title.trim()) return;
    store.upsertSession({
      ...sessionForm,
      id: editingSessionId || `wed-${Date.now()}`,
    });
    resetSessionForm();
    setSessionSavedMsg(true);
    window.setTimeout(() => setSessionSavedMsg(false), 3000);
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) return;
    const product: KhulProduct = {
      id: `prod-${Date.now()}`,
      name: productName.trim(),
      category: productCategory,
      priceEtb: Number(productPrice) || 950,
      description: productDesc.trim() || 'Mindful wellness crafted for daily Khul practice.',
      inStock: true,
      visualKey:
        productCategory === 'Journals & Books'
          ? 'journal'
          : productCategory === 'Herbal Blends'
            ? 'tea'
            : productCategory === 'Atmosphere'
              ? 'candle'
              : 'chime',
      customImageUrl: productImage.trim() || undefined,
    };
    store.upsertProduct(product);
    setProductName('');
    setProductDesc('');
    setProductImage('');
  };

  const handlePublishAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annBody.trim()) return;
    store.publishAnnouncement({
      title: annTitle.trim(),
      category: annCategory,
      author: annAuthor.trim() || 'Khul Team',
      body: annBody.trim(),
    });
    setAnnTitle('');
    setAnnBody('');
  };

  const handleAddWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wordText.trim() || !wordReflection.trim()) return;
    const newWord: ReflectionWord = {
      id: `rw-${Date.now()}`,
      word: wordText.trim(),
      amharicWord: wordAmharic.trim() || wordText.trim(),
      reflection: wordReflection.trim(),
      amharicReflection: wordAmharicReflection.trim() || wordReflection.trim(),
      practiceHint: wordHint.trim() || 'Pause for three slow breaths when you notice this word.',
      cardTheme: wordTheme,
    };
    store.upsertReflectionWord(newWord);
    setWordText('');
    setWordAmharic('');
    setWordReflection('');
    setWordAmharicReflection('');
    setWordHint('');
  };

  const filteredRegistrations = useMemo(() => {
    const q = regSearch.trim().toLowerCase();
    return state.registrations.filter((r) => {
      if (attendanceFilter === 'checked-in' && r.attendanceStatus !== 'Checked In') {
        return false;
      }
      if (attendanceFilter === 'awaiting' && r.attendanceStatus === 'Checked In') {
        return false;
      }
      if (!q) return true;
      return (
        r.memberName.toLowerCase().includes(q) ||
        r.sessionTitle.toLowerCase().includes(q) ||
        r.passCode.toLowerCase().includes(q)
      );
    });
  }, [state.registrations, regSearch, attendanceFilter]);

  const checkedInCount = useMemo(
    () => state.registrations.filter((r) => r.attendanceStatus === 'Checked In').length,
    [state.registrations],
  );

  const sortedLeaderboard = useMemo(
    () =>
      [...state.members].sort((a, b) =>
        sortBy === 'streak'
          ? b.currentStreak - a.currentStreak || b.totalDaysPracticed - a.totalDaysPracticed
          : b.totalDaysPracticed - a.totalDaysPracticed || b.currentStreak - a.currentStreak,
      ),
    [state.members, sortBy],
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Admin Left Workspace Sidebar */}
      <aside className="lg:col-span-3 rounded-2xl bg-white border border-[#E7E1D6] p-4 space-y-5 lg:sticky lg:top-24">
        <div className="px-2 pt-1 flex items-center gap-3">
          <KhulLogo logoUrl={state.brand.logoUrl} size="sm" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-[#4A6B5D]">Khul Control Panel</p>
            <p className="text-sm font-semibold text-[#1F3A3D] truncate">Team Operations</p>
          </div>
        </div>

        <nav className="space-y-1" aria-label="Admin sections">
          {(
            [
              {id: 'wednesdays', label: 'Wednesdays & Passes', icon: Calendar},
              {id: 'corporate', label: 'Corporate Inquiries', icon: Building2},
              {id: 'store', label: 'Khul Life Store', icon: ShoppingBag},
              {id: 'content', label: 'Content, Game & Brand', icon: Megaphone},
              {id: 'registrations', label: 'Registrations & Streaks', icon: Users},
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChangeTab(item.id)}
                className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-left text-sm font-medium flex items-center gap-3 transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#F1931E] text-[#1F3A3D] font-semibold'
                    : 'text-[#49504C] hover:bg-[#FAF8F5] hover:text-[#1F3A3D]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => {
            onChangeTab('registrations');
            setScannerOpen(true);
          }}
          className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#1F3A3D] hover:bg-[#162B2D] text-[#FAF8F5] text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <ScanLine className="w-4 h-4 text-[#F1931E] shrink-0" />
          <span>Scan QR Ticket</span>
        </button>

        <div className="pt-4 border-t border-[#F0EBE1] px-2 space-y-2">
          <div className="rounded-xl bg-[#FAF8F5] border border-[#E7E1D6] p-2.5 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#4A6B5D]">
              <Cloud className="w-3.5 h-3.5" />
              <span>{store.cloudSynced ? 'Live Cloud Sync On' : 'Syncing with Cloud...'}</span>
            </div>
            <p className="text-[11px] text-[#5B635E]">
              {store.lastCloudSaveAt
                ? `Last saved at ${store.lastCloudSaveAt}`
                : 'Saves push live to all user pages'}
            </p>
          </div>
          <div className="flex justify-between text-xs text-[#5B635E]">
            <span>Published Sessions</span>
            <span className="font-mono tabular-nums font-semibold text-[#1F3A3D]">
              {state.sessions.filter((s) => s.published).length}
            </span>
          </div>
          <div className="flex justify-between text-xs text-[#5B635E]">
            <span>Corporate Inquiries</span>
            <span className="font-mono tabular-nums font-semibold text-[#1F3A3D]">
              {state.corporateInquiries.length}
            </span>
          </div>
          <div className="flex justify-between text-xs text-[#5B635E]">
            <span>Store Orders</span>
            <span className="font-mono tabular-nums font-semibold text-[#1F3A3D]">
              {state.orders.length}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setPackagePriceDrafts({});
              setProductPriceDrafts({});
              store.resetDemoData();
            }}
            className="mt-2 w-full min-h-[38px] px-3 py-1.5 rounded-xl border border-[#E2DACB] hover:bg-[#FAF8F5] text-xs font-medium text-[#5B635E] inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Sync &amp; Reset Defaults</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Workspace */}
      <div className="lg:col-span-9 space-y-6">
        {/* 1. WEDNESDAY SESSIONS & PACKAGES */}
        {activeTab === 'wednesdays' && (
          <div className="space-y-6">
            <section className="rounded-2xl bg-white border border-[#E7E1D6] p-6 space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl font-semibold text-[#1F3A3D]">
                    {editingSessionId ? 'Edit Wednesday Program' : 'Create / Publish Wednesday Program'}
                  </h1>
                  <p className="text-xs text-[#5B635E]">
                    Changes publish immediately to the User Wednesday Programs screen.
                  </p>
                </div>
                {editingSessionId ? (
                  <button
                    type="button"
                    onClick={resetSessionForm}
                    className="text-xs font-medium text-[#C86D0A] hover:underline cursor-pointer"
                  >
                    Cancel editing
                  </button>
                ) : (
                  sessionSavedMsg && (
                    <span className="text-xs font-medium text-[#4A6B5D] inline-flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Saved &amp; live on User Page
                    </span>
                  )
                )}
              </div>

              <form onSubmit={handleSaveSession} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#49504C] mb-1">
                      Session Title
                    </label>
                    <input
                      type="text"
                      required
                      value={sessionForm.title}
                      onChange={(e) => setSessionForm({...sessionForm, title: e.target.value})}
                      placeholder="e.g., Kinet Hiwot: Stillness in Motion"
                      className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-[#DDD5C7] bg-[#FAF8F5] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#49504C] mb-1">
                      Theme
                    </label>
                    <input
                      type="text"
                      required
                      value={sessionForm.theme}
                      onChange={(e) => setSessionForm({...sessionForm, theme: e.target.value})}
                      className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-[#DDD5C7] bg-[#FAF8F5] text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#49504C] mb-1">
                      Date
                    </label>
                    <input
                      type="text"
                      required
                      value={sessionForm.date}
                      onChange={(e) => setSessionForm({...sessionForm, date: e.target.value})}
                      className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-[#DDD5C7] bg-[#FAF8F5] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#49504C] mb-1">
                      Time
                    </label>
                    <input
                      type="text"
                      required
                      value={sessionForm.time}
                      onChange={(e) => setSessionForm({...sessionForm, time: e.target.value})}
                      className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-[#DDD5C7] bg-[#FAF8F5] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#49504C] mb-1">
                      Facilitator
                    </label>
                    <input
                      type="text"
                      required
                      value={sessionForm.facilitator}
                      onChange={(e) =>
                        setSessionForm({...sessionForm, facilitator: e.target.value})
                      }
                      className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-[#DDD5C7] bg-[#FAF8F5] text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#49504C] mb-1">
                      Seat Capacity
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={sessionForm.capacity}
                      onChange={(e) =>
                        setSessionForm({...sessionForm, capacity: Number(e.target.value) || 28})
                      }
                      className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-[#DDD5C7] bg-[#FAF8F5] text-sm font-mono tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#49504C] mb-1">
                      Drop-In Price (ETB)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={sessionForm.priceEtb}
                      onChange={(e) =>
                        setSessionForm({
                          ...sessionForm,
                          priceEtb: e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)),
                        })
                      }
                      className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-[#DDD5C7] bg-[#FAF8F5] text-sm font-mono tabular-nums"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 min-h-[42px] cursor-pointer text-sm text-[#1F3A3D]">
                      <input
                        type="checkbox"
                        checked={sessionForm.published}
                        onChange={(e) =>
                          setSessionForm({...sessionForm, published: e.target.checked})
                        }
                        className="w-4 h-4 accent-[#F1931E]"
                      />
                      <span>Published to Members</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#49504C] mb-1">
                      Week Label
                    </label>
                    <input
                      type="text"
                      value={sessionForm.weekLabel ?? ''}
                      onChange={(e) => setSessionForm({...sessionForm, weekLabel: e.target.value})}
                      placeholder="e.g., Week 1 · Every Wednesday"
                      className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-[#DDD5C7] bg-[#FAF8F5] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#49504C] mb-1">
                      Poster Image Path / URL
                    </label>
                    <input
                      type="text"
                      value={sessionForm.posterUrl ?? ''}
                      onChange={(e) => setSessionForm({...sessionForm, posterUrl: e.target.value})}
                      placeholder="/assets/aistudio/..."
                      className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-[#DDD5C7] bg-[#FAF8F5] text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#49504C] mb-1">
                    Session Description
                  </label>
                  <textarea
                    rows={2}
                    value={sessionForm.description}
                    onChange={(e) =>
                      setSessionForm({...sessionForm, description: e.target.value})
                    }
                    placeholder="Brief grounded overview of the Wednesday practice..."
                    className="w-full px-3.5 py-2 rounded-xl border border-[#DDD5C7] bg-[#FAF8F5] text-sm"
                  />
                </div>

                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#F1931E] hover:bg-[#DF8312] text-[#1F3A3D] text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{editingSessionId ? 'Save Session Changes' : 'Publish Session'}</span>
                </button>
              </form>
            </section>

            {/* Existing Sessions List */}
            <section className="rounded-2xl bg-white border border-[#E7E1D6] p-6 space-y-4">
              <h2 className="text-lg font-semibold text-[#1F3A3D]">
                Scheduled Wednesday Programs
              </h2>
              <div className="divide-y divide-[#F0EBE1]">
                {state.sessions.map((s) => (
                  <div
                    key={s.id}
                    className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {s.posterUrl && (
                        <img
                          src={s.posterUrl}
                          alt={s.title}
                          referrerPolicy="no-referrer"
                          className="w-16 h-12 rounded-lg object-cover border border-[#E7E1D6] shrink-0"
                        />
                      )}
                      <div className="space-y-1 min-w-0">
                        <p className="text-xs text-[#5B635E]">
                          <span className="font-medium text-[#C86D0A]">{s.weekLabel ?? 'Wednesday'}</span>
                          <span aria-hidden="true"> · </span>
                          <span className="font-mono tabular-nums">{s.date}</span>
                          <span aria-hidden="true"> · </span>
                          <span>{s.facilitator}</span>
                          <span aria-hidden="true"> · </span>
                          <span className="font-mono tabular-nums">
                            {s.registeredCount}/{s.capacity} seats
                          </span>
                          <span aria-hidden="true"> · </span>
                          <span>{s.published ? 'Published' : 'Draft'}</span>
                        </p>
                        <h3 className="text-sm font-semibold text-[#1F3A3D] truncate">{s.title}</h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEditSession(s)}
                        className="min-h-[40px] px-3 py-1.5 rounded-xl border border-[#DDD5C7] hover:bg-[#FAF8F5] text-xs font-medium text-[#1F3A3D] inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => store.deleteSession(s.id)}
                        className="min-h-[40px] min-w-[40px] rounded-xl border border-[#DDD5C7] hover:bg-red-50 text-[#5B635E] hover:text-red-700 flex items-center justify-center cursor-pointer"
                        aria-label={`Delete ${s.title}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Package Pricing Editor */}
            <section className="rounded-2xl bg-white border border-[#E7E1D6] p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-[#1F3A3D]">
                    Weekly &amp; Monthly Package Pricing (ETB)
                  </h2>
                  <p className="text-xs text-[#5B635E]">
                    Enter a new ETB price and click Save to update the User Services page.
                  </p>
                </div>
                {savedPackageId === 'all' && (
                  <span className="text-xs font-medium text-[#4A6B5D] inline-flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Saved &amp; live on User Page
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {state.packages.map((pkg) => {
                  const draftValue = packagePriceDrafts[pkg.id] ?? String(pkg.priceEtb);
                  const isSaved = savedPackageId === pkg.id;
                  return (
                    <div
                      key={pkg.id}
                      className="rounded-xl bg-[#FAF8F5] border border-[#E7E1D6] p-4 space-y-3"
                    >
                      <div>
                        <p className="text-xs font-medium text-[#4A6B5D]">{pkg.tier} Pass</p>
                        <p className="text-sm font-semibold text-[#1F3A3D]">{pkg.name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          value={draftValue}
                          onChange={(e) =>
                            setPackagePriceDrafts({
                              ...packagePriceDrafts,
                              [pkg.id]: e.target.value,
                            })
                          }
                          aria-label={`${pkg.name} price in ETB`}
                          className="w-full min-h-[40px] px-3 py-1.5 rounded-lg border border-[#DDD5C7] bg-white font-mono text-sm tabular-nums"
                        />
                        <span className="text-xs font-medium text-[#5B635E] shrink-0">ETB</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const parsed = Math.max(0, Number(draftValue) || 0);
                          store.updatePackagePricing({...pkg, priceEtb: parsed});
                          setPackagePriceDrafts((prev) => {
                            const next = {...prev};
                            delete next[pkg.id];
                            return next;
                          });
                          setSavedPackageId(pkg.id);
                          window.setTimeout(() => setSavedPackageId(null), 2500);
                        }}
                        className="w-full min-h-[38px] px-3 py-1.5 rounded-lg bg-[#1F3A3D] hover:bg-[#162B2D] text-[#FAF8F5] text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {isSaved ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#F1931E]" />
                            <span>Saved on User Page</span>
                          </>
                        ) : (
                          <span>Save Price</span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="pt-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    for (const pkg of state.packages) {
                      const raw = packagePriceDrafts[pkg.id];
                      if (raw !== undefined) {
                        store.updatePackagePricing({
                          ...pkg,
                          priceEtb: Math.max(0, Number(raw) || 0),
                        });
                      }
                    }
                    setPackagePriceDrafts({});
                    setSavedPackageId('all');
                    window.setTimeout(() => setSavedPackageId(null), 2500);
                  }}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-[#F1931E] hover:bg-[#DF8312] text-[#1F3A3D] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save All Package Prices</span>
                </button>
              </div>
            </section>
          </div>
        )}

        {/* 2. CORPORATE INQUIRIES */}
        {activeTab === 'corporate' && (
          <section className="rounded-2xl bg-white border border-[#E7E1D6] p-6 space-y-5">
            <div>
              <h1 className="text-xl font-semibold text-[#1F3A3D]">
                Khul Corporate Training Inquiries
              </h1>
              <p className="text-xs text-[#5B635E]">
                Organizations requesting Reset, Flow, or Elevate wellbeing programs.
              </p>
            </div>

            {state.corporateInquiries.length === 0 ? (
              <p className="text-sm text-[#5B635E]">No corporate inquiries yet.</p>
            ) : (
              <div className="divide-y divide-[#F0EBE1]">
                {state.corporateInquiries.map((inq) => (
                  <div
                    key={inq.id}
                    className="py-5 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 max-w-2xl">
                      <p className="text-xs text-[#5B635E]">
                        <span className="font-medium text-[#4A6B5D]">
                          {inq.programInterest}
                        </span>
                        <span aria-hidden="true"> · </span>
                        <span className="font-mono tabular-nums">{inq.teamSize} staff</span>
                        <span aria-hidden="true"> · </span>
                        <span className="tabular-nums">{inq.submittedAt}</span>
                      </p>
                      <h2 className="text-base font-semibold text-[#1F3A3D]">
                        {inq.organizationName}
                      </h2>
                      <p className="text-xs text-[#5B635E]">
                        Contact: {inq.contactName} ({inq.contactEmail})
                      </p>
                      <p className="text-sm text-[#49504C]">{inq.goals}</p>
                    </div>

                    <div className="shrink-0">
                      <select
                        value={inq.status}
                        onChange={(e) =>
                          store.updateCorporateInquiryStatus(
                            inq.id,
                            e.target.value as typeof inq.status,
                          )
                        }
                        aria-label={`Update status for ${inq.organizationName}`}
                        className="min-h-[42px] px-3.5 py-2 rounded-xl border border-[#DDD5C7] bg-[#FAF8F5] text-xs font-semibold text-[#1F3A3D]"
                      >
                        <option value="New Inquiry">New Inquiry</option>
                        <option value="Discovery Scheduled">Discovery Scheduled</option>
                        <option value="Proposal Sent">Proposal Sent</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 3. KHUL LIFE STORE MANAGER */}
        {activeTab === 'store' && (
          <div className="space-y-6">
            <section className="rounded-2xl bg-white border border-[#E7E1D6] p-6 space-y-4">
              <h1 className="text-xl font-semibold text-[#1F3A3D]">
                Add Khul Life Wellness Product
              </h1>
              <form onSubmit={handleAddProduct} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#49504C] mb-1">
                      Product Name
                    </label>
                    <input
                      type="text"
                      required
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="e.g., Somatic Lavender Eye Pillow"
                      className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-[#DDD5C7] bg-[#FAF8F5] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#49504C] mb-1">
                      Category
                    </label>
                    <select
                      value={productCategory}
                      onChange={(e) =>
                        setProductCategory(e.target.value as ProductCategory)
                      }
                      className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#DDD5C7] bg-[#FAF8F5] text-sm"
                    >
                      <option value="Journals & Books">Journals &amp; Books</option>
                      <option value="Herbal Blends">Herbal Blends</option>
                      <option value="Practice Tools">Practice Tools</option>
                      <option value="Atmosphere">Atmosphere</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#49504C] mb-1">
                      Price (ETB)
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={productPrice}
                      onChange={(e) => setProductPrice(e.target.value)}
                      className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-[#DDD5C7] bg-[#FAF8F5] text-sm font-mono tabular-nums"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#49504C] mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={productDesc}
                      onChange={(e) => setProductDesc(e.target.value)}
                      placeholder="Concise description of materials and mindfulness use..."
                      className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-[#DDD5C7] bg-[#FAF8F5] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#49504C] mb-1">
                      Product Photo Path / URL (optional)
                    </label>
                    <input
                      type="text"
                      value={productImage}
                      onChange={(e) => setProductImage(e.target.value)}
                      placeholder="/assets/aistudio/..."
                      className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-[#DDD5C7] bg-[#FAF8F5] text-sm"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-[#F1931E] hover:bg-[#DF8312] text-[#1F3A3D] text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Product to Store</span>
                </button>
              </form>
            </section>

            {/* Inventory Table */}
            <section className="rounded-2xl bg-white border border-[#E7E1D6] p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-[#1F3A3D]">Catalog &amp; Stock Control</h2>
                  <p className="text-xs text-[#5B635E]">
                    Update any product price and click Save to publish it to the Khul Life Store.
                  </p>
                </div>
                {savedProductId === 'all' && (
                  <span className="text-xs font-medium text-[#4A6B5D] inline-flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Store prices saved &amp; live
                  </span>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#EFEAE0] text-xs text-[#5B635E]">
                      <th className="py-2.5 pr-4 font-medium">Product</th>
                      <th className="py-2.5 pr-4 font-medium">Category</th>
                      <th className="py-2.5 pr-4 font-medium text-right">Price (ETB)</th>
                      <th className="py-2.5 text-right font-medium">Stock Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F4F0E8] text-sm">
                    {state.products.map((p) => {
                      const draftPrice = productPriceDrafts[p.id] ?? String(p.priceEtb);
                      const isSaved = savedProductId === p.id;
                      return (
                        <tr key={p.id}>
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-3">
                              {p.customImageUrl && (
                                <img
                                  src={p.customImageUrl}
                                  alt={p.name}
                                  referrerPolicy="no-referrer"
                                  className="w-10 h-10 rounded-lg object-cover border border-[#E7E1D6] shrink-0"
                                />
                              )}
                              <span className="font-medium text-[#1F3A3D]">{p.name}</span>
                            </div>
                          </td>
                          <td className="py-3 pr-4 text-xs text-[#5B635E]">{p.category}</td>
                          <td className="py-3 pr-4 text-right font-mono tabular-nums">
                            <div className="inline-flex items-center justify-end gap-2">
                              <input
                                type="number"
                                min="0"
                                value={draftPrice}
                                onChange={(e) =>
                                  setProductPriceDrafts({
                                    ...productPriceDrafts,
                                    [p.id]: e.target.value,
                                  })
                                }
                                aria-label={`Price for ${p.name}`}
                                className="w-24 text-right px-2.5 py-1.5 rounded-lg border border-[#E2DACB] bg-[#FAF8F5] text-xs font-mono tabular-nums"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const parsed = Math.max(0, Number(draftPrice) || 0);
                                  store.upsertProduct({...p, priceEtb: parsed});
                                  setProductPriceDrafts((prev) => {
                                    const next = {...prev};
                                    delete next[p.id];
                                    return next;
                                  });
                                  setSavedProductId(p.id);
                                  window.setTimeout(() => setSavedProductId(null), 2200);
                                }}
                                className="min-h-[34px] px-3 py-1 rounded-lg bg-[#1F3A3D] hover:bg-[#162B2D] text-[#FAF8F5] text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                              >
                                {isSaved ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-[#F1931E]" />
                                    <span>Saved</span>
                                  </>
                                ) : (
                                  <span>Save</span>
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              type="button"
                              onClick={() => store.toggleProductStock(p.id)}
                              className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                                p.inStock
                                  ? 'bg-[#EEF4F0] text-[#4A6B5D]'
                                  : 'bg-[#FBEAE8] text-[#A23B2A]'
                              }`}
                            >
                              {p.inStock ? 'In Stock' : 'Out of Stock'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="pt-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    for (const p of state.products) {
                      const raw = productPriceDrafts[p.id];
                      if (raw !== undefined) {
                        store.upsertProduct({
                          ...p,
                          priceEtb: Math.max(0, Number(raw) || 0),
                        });
                      }
                    }
                    setProductPriceDrafts({});
                    setSavedProductId('all');
                    window.setTimeout(() => setSavedProductId(null), 2500);
                  }}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-[#F1931E] hover:bg-[#DF8312] text-[#1F3A3D] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save All Store Prices</span>
                </button>
              </div>
            </section>

            {/* Customer Orders */}
            <section className="rounded-2xl bg-white border border-[#E7E1D6] p-6 space-y-4">
              <h2 className="text-lg font-semibold text-[#1F3A3D]">Customer Store Orders</h2>
              <div className="divide-y divide-[#F0EBE1]">
                {state.orders.map((order) => (
                  <div
                    key={order.id}
                    className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <p className="text-xs text-[#5B635E]">
                        <span className="font-mono font-semibold text-[#1F3A3D]">
                          {order.id}
                        </span>
                        <span aria-hidden="true"> · </span>
                        <span>{order.customerName}</span>
                        <span aria-hidden="true"> · </span>
                        <span>{order.customerPhone}</span>
                      </p>
                      <p className="text-sm text-[#2C302E]">
                        {order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                      </p>
                      <p className="text-xs text-[#5B635E]">
                        {order.fulfillmentMethod}
                        {order.deliveryAddress ? ` (${order.deliveryAddress})` : ''} ·{' '}
                        <span className="font-mono font-semibold text-[#1F3A3D] tabular-nums">
                          {order.totalEtb.toLocaleString()} ETB
                        </span>
                      </p>
                    </div>
                    <select
                      value={order.status}
                      onChange={(e) =>
                        store.updateOrderStatus(
                          order.id,
                          e.target.value as typeof order.status,
                        )
                      }
                      aria-label={`Order status for ${order.id}`}
                      className="min-h-[40px] px-3 py-1.5 rounded-xl border border-[#DDD5C7] bg-[#FAF8F5] text-xs font-semibold text-[#1F3A3D]"
                    >
                      <option value="Reserved">Reserved</option>
                      <option value="Ready for Pickup">Ready for Pickup</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* 4. CONTENT, WEEKLY GAME, REFLECTION WORDS & BRAND LOGO */}
        {activeTab === 'content' && (
          <div className="space-y-6">
            {/* Announcements Publisher */}
            <section className="rounded-2xl bg-white border border-[#E7E1D6] p-6 space-y-4">
              <h1 className="text-xl font-semibold text-[#1F3A3D]">
                Publish Announcement / Mindful Reflection
              </h1>
              <form onSubmit={handlePublishAnnouncement} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    placeholder="Headline..."
                    className="sm:col-span-2 min-h-[42px] px-3.5 py-2 rounded-xl border border-[#DDD5C7] bg-[#FAF8F5] text-sm"
                  />
                  <select
                    value={annCategory}
                    onChange={(e) =>
                      setAnnCategory(e.target.value as typeof annCategory)
                    }
                    className="min-h-[42px] px-3 py-2 rounded-xl border border-[#DDD5C7] bg-[#FAF8F5] text-sm"
                  >
                    <option value="Announcement">Announcement</option>
                    <option value="Self-Awareness">Self-Awareness</option>
                    <option value="Community Update">Community Update</option>
                  </select>
                </div>
                <textarea
                  rows={2}
                  required
                  value={annBody}
                  onChange={(e) => setAnnBody(e.target.value)}
                  placeholder="Write a calm update or self-engineering reflection for the Home Feed..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#DDD5C7] bg-[#FAF8F5] text-sm"
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <input
                    type="text"
                    value={annAuthor}
                    onChange={(e) => setAnnAuthor(e.target.value)}
                    placeholder="Author name"
                    className="min-h-[40px] px-3 py-1.5 rounded-xl border border-[#DDD5C7] bg-[#FAF8F5] text-xs"
                  />
                  <button
                    type="submit"
                    className="min-h-[42px] px-5 py-2 rounded-xl bg-[#F1931E] hover:bg-[#DF8312] text-[#1F3A3D] text-sm font-semibold cursor-pointer"
                  >
                    Publish to Home Feed
                  </button>
                </div>
              </form>

              <div className="pt-4 border-t border-[#F0EBE1] divide-y divide-[#F4F0E8]">
                {state.announcements.map((a) => (
                  <div key={a.id} className="py-3 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs text-[#5B635E]">
                        {a.category} · {a.publishedAt}
                      </p>
                      <p className="text-sm font-semibold text-[#1F3A3D]">{a.title}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => store.deleteAnnouncement(a.id)}
                      className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-[#5B635E] hover:text-red-700 cursor-pointer"
                      aria-label={`Delete ${a.title}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Weekly Game Editor */}
            <section className="rounded-2xl bg-white border border-[#E7E1D6] p-6 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold text-[#1F3A3D]">
                  Weekly Game Challenge Manager
                </h2>
                {gameSaved && (
                  <span className="text-xs font-medium text-[#4A6B5D] inline-flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Updated live
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={gameDraft.weekLabel}
                  onChange={(e) => setGameDraft({...gameDraft, weekLabel: e.target.value})}
                  className="min-h-[42px] px-3.5 py-2 rounded-xl border border-[#DDD5C7] bg-[#FAF8F5] text-sm"
                />
                <input
                  type="text"
                  value={gameDraft.title}
                  onChange={(e) => setGameDraft({...gameDraft, title: e.target.value})}
                  className="min-h-[42px] px-3.5 py-2 rounded-xl border border-[#DDD5C7] bg-[#FAF8F5] text-sm font-medium"
                />
              </div>
              <textarea
                rows={2}
                value={gameDraft.prompt}
                onChange={(e) => setGameDraft({...gameDraft, prompt: e.target.value})}
                className="w-full px-3.5 py-2 rounded-xl border border-[#DDD5C7] bg-[#FAF8F5] text-sm"
              />
              <input
                type="text"
                value={gameDraft.checklistLabel}
                onChange={(e) =>
                  setGameDraft({...gameDraft, checklistLabel: e.target.value})
                }
                placeholder="Checklist prompt..."
                className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-[#DDD5C7] bg-[#FAF8F5] text-sm"
              />
              <input
                type="text"
                value={gameDraft.imageUrl ?? ''}
                onChange={(e) => setGameDraft({...gameDraft, imageUrl: e.target.value})}
                placeholder="Weekly Game Poster Path / URL"
                className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-[#DDD5C7] bg-[#FAF8F5] text-sm"
              />
              <button
                type="button"
                onClick={() => {
                  store.updateWeeklyGame(gameDraft);
                  setGameSaved(true);
                  window.setTimeout(() => setGameSaved(false), 2500);
                }}
                className="min-h-[42px] px-5 py-2 rounded-xl bg-[#1F3A3D] hover:bg-[#162B2D] text-[#FAF8F5] text-sm font-semibold cursor-pointer"
              >
                Save Active Weekly Game
              </button>
            </section>

            {/* Virtue Gift Bank Manager */}
            <section className="rounded-2xl bg-white border border-[#E7E1D6] p-6 space-y-4">
              <h2 className="text-lg font-semibold text-[#1F3A3D]">
                Virtue Gift Bank ({state.reflectionWords.length} Cards · English &amp; Amharic)
              </h2>
              <form onSubmit={handleAddWord} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  value={wordText}
                  onChange={(e) => setWordText(e.target.value)}
                  placeholder="English Virtue (e.g., Serenity)"
                  className="min-h-[42px] px-3.5 py-2 rounded-xl border border-[#DDD5C7] bg-[#FAF8F5] text-sm"
                />
                <input
                  type="text"
                  value={wordAmharic}
                  onChange={(e) => setWordAmharic(e.target.value)}
                  placeholder="Amharic Virtue (e.g., ሰላም)"
                  className="min-h-[42px] px-3.5 py-2 rounded-xl border border-[#DDD5C7] bg-[#FAF8F5] text-sm"
                />
                <select
                  value={wordTheme}
                  onChange={(e) => setWordTheme(e.target.value as VirtueCardTheme)}
                  className="min-h-[42px] px-3 py-2 rounded-xl border border-[#DDD5C7] bg-[#FAF8F5] text-sm"
                >
                  <option value="yellow">Yellow Card</option>
                  <option value="green">Green Card</option>
                  <option value="orange">Orange Card</option>
                </select>
                <input
                  type="text"
                  required
                  value={wordReflection}
                  onChange={(e) => setWordReflection(e.target.value)}
                  placeholder="English reflection thought..."
                  className="sm:col-span-3 min-h-[42px] px-3.5 py-2 rounded-xl border border-[#DDD5C7] bg-[#FAF8F5] text-sm"
                />
                <input
                  type="text"
                  value={wordAmharicReflection}
                  onChange={(e) => setWordAmharicReflection(e.target.value)}
                  placeholder="Amharic reflection thought..."
                  className="sm:col-span-3 min-h-[42px] px-3.5 py-2 rounded-xl border border-[#DDD5C7] bg-[#FAF8F5] text-sm"
                />
                <input
                  type="text"
                  value={wordHint}
                  onChange={(e) => setWordHint(e.target.value)}
                  placeholder="Practical daily hint..."
                  className="sm:col-span-2 min-h-[42px] px-3.5 py-2 rounded-xl border border-[#DDD5C7] bg-[#FAF8F5] text-sm"
                />
                <button
                  type="submit"
                  className="min-h-[42px] px-4 py-2 rounded-xl bg-[#F1931E] hover:bg-[#DF8312] text-[#1F3A3D] text-sm font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Add Virtue Gift</span>
                </button>
              </form>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {state.reflectionWords.map((rw) => (
                  <div
                    key={rw.id}
                    className={`rounded-xl p-3.5 flex items-start justify-between gap-3 border ${
                      rw.cardTheme === 'yellow'
                        ? 'bg-[#F4DF2B]/35 border-[#DCC416]'
                        : rw.cardTheme === 'green'
                          ? 'bg-[#87B336]/25 border-[#6E9626]'
                          : 'bg-[#F2AE5C]/30 border-[#DB913B]'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#1F3A3D]">
                        {rw.word} · {rw.amharicWord}
                      </p>
                      <p className="text-xs text-[#2C302E] mt-1">{rw.reflection}</p>
                      <p className="text-xs text-[#49504C] mt-1">{rw.amharicReflection}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => store.deleteReflectionWord(rw.id)}
                      className="min-h-[34px] min-w-[34px] flex items-center justify-center rounded-lg text-[#5B635E] hover:text-red-700 shrink-0 cursor-pointer"
                      aria-label={`Remove ${rw.word}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Brand Logo & Venue Customization */}
            <section className="rounded-2xl bg-white border border-[#E7E1D6] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[#1F3A3D]">
                  Brand Logo &amp; Venue Settings
                </h2>
                {brandSavedMsg && (
                  <span className="text-xs font-medium text-[#4A6B5D]">Saved</span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#49504C] mb-1">
                    Custom Logo URL (leave default or clear for SVG lotus fallback)
                  </label>
                  <input
                    type="text"
                    value={logoInput}
                    onChange={(e) => setLogoInput(e.target.value)}
                    className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-[#DDD5C7] bg-[#FAF8F5] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#49504C] mb-1">
                    Venue Name
                  </label>
                  <input
                    type="text"
                    value={venueNameInput}
                    onChange={(e) => setVenueNameInput(e.target.value)}
                    className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-[#DDD5C7] bg-[#FAF8F5] text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-[#49504C] mb-1">
                    Google Maps Link
                  </label>
                  <input
                    type="url"
                    value={venueMapsInput}
                    onChange={(e) => setVenueMapsInput(e.target.value)}
                    className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-[#DDD5C7] bg-[#FAF8F5] text-sm"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    store.updateBrandSettings({
                      logoUrl: logoInput.trim(),
                      venueName: venueNameInput.trim() || state.brand.venueName,
                      googleMapsUrl: venueMapsInput.trim() || state.brand.googleMapsUrl,
                    });
                    setBrandSavedMsg(true);
                    window.setTimeout(() => setBrandSavedMsg(false), 2500);
                  }}
                  className="min-h-[42px] px-5 py-2 rounded-xl bg-[#F1931E] text-[#1F3A3D] text-sm font-semibold cursor-pointer"
                >
                  Update Branding
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const def = '/assets/aistudio/khul_e2c6af73.jpg';
                    setLogoInput(def);
                    store.updateBrandSettings({logoUrl: def});
                  }}
                  className="min-h-[42px] px-4 py-2 rounded-xl border border-[#DDD5C7] text-xs font-medium text-[#49504C] cursor-pointer"
                >
                  Restore Default Khul Logo
                </button>
              </div>
            </section>
          </div>
        )}

        {/* 5. REGISTRATIONS & STREAK LEADERBOARD */}
        {activeTab === 'registrations' && (
          <div className="space-y-6">
            {/* Registrations Table */}
            <section className="rounded-2xl bg-white border border-[#E7E1D6] p-6 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl font-semibold text-[#1F3A3D]">
                    Wednesday Registrations &amp; Attendance
                  </h1>
                  <p className="text-xs text-[#5B635E]">
                    Scan a guest&apos;s QR ticket at the entrance to automatically mark them Checked In on the attendance list.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="relative flex-1 sm:flex-initial">
                    <Search className="w-4 h-4 text-[#6B736E] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="search"
                      value={regSearch}
                      onChange={(e) => setRegSearch(e.target.value)}
                      placeholder="Search member or pass..."
                      className="min-h-[40px] pl-9 pr-3.5 py-1.5 rounded-xl border border-[#DDD5C7] bg-[#FAF8F5] text-xs w-full sm:w-56"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setScannerOpen(true)}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-[#F1931E] hover:bg-[#DF8312] text-[#1F3A3D] text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <ScanLine className="w-4 h-4" />
                    <span>Scan QR Pass</span>
                  </button>
                </div>
              </div>

              {/* Attendance Filter & Live Tally */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="inline-flex p-1 rounded-xl bg-[#EFEAE0]">
                  {(
                    [
                      {id: 'all', label: `All (${state.registrations.length})`},
                      {id: 'checked-in', label: `Checked In (${checkedInCount})`},
                      {
                        id: 'awaiting',
                        label: `Awaiting (${Math.max(0, state.registrations.length - checkedInCount)})`,
                      },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setAttendanceFilter(tab.id)}
                      className={`min-h-[34px] px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                        attendanceFilter === tab.id
                          ? 'bg-white text-[#1F3A3D] shadow-xs'
                          : 'text-[#5B635E] hover:text-[#1F3A3D]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <span className="text-xs font-medium text-[#4A6B5D] inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="font-mono tabular-nums">{checkedInCount}</span> attended
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#EFEAE0] text-xs text-[#5B635E]">
                      <th className="py-2.5 pr-4 font-medium">Member</th>
                      <th className="py-2.5 pr-4 font-medium">Session</th>
                      <th className="py-2.5 pr-4 font-medium">Package</th>
                      <th className="py-2.5 pr-4 font-medium">Pass Code</th>
                      <th className="py-2.5 text-right font-medium">Attendance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F4F0E8] text-sm">
                    {filteredRegistrations.map((reg) => {
                      const isCheckedIn = reg.attendanceStatus === 'Checked In';
                      return (
                        <tr key={reg.id}>
                          <td className="py-3 pr-4">
                            <div className="font-medium text-[#1F3A3D]">{reg.memberName}</div>
                            <div className="text-xs text-[#5B635E]">{reg.memberPhone}</div>
                          </td>
                          <td className="py-3 pr-4">
                            <div className="text-xs font-medium text-[#2C302E] max-w-[220px] truncate">
                              {reg.sessionTitle}
                            </div>
                            <div className="text-xs text-[#5B635E] font-mono tabular-nums">
                              {reg.sessionDate}
                            </div>
                          </td>
                          <td className="py-3 pr-4 text-xs font-medium text-[#4A6B5D]">
                            {reg.packageTier}
                          </td>
                          <td className="py-3 pr-4 font-mono text-xs tabular-nums text-[#1F3A3D]">
                            {reg.passCode}
                          </td>
                          <td className="py-3 text-right">
                            <div className="inline-flex items-center justify-end gap-2">
                              {!isCheckedIn && (
                                <button
                                  type="button"
                                  onClick={() => store.updateRegistrationStatus(reg.id, 'Checked In')}
                                  className="min-h-[34px] px-2.5 py-1 rounded-lg bg-[#EEF4F0] hover:bg-[#DDECE2] text-[#2F5944] text-xs font-semibold cursor-pointer"
                                >
                                  Check In
                                </button>
                              )}
                              <select
                                value={reg.attendanceStatus}
                                onChange={(e) =>
                                  store.updateRegistrationStatus(
                                    reg.id,
                                    e.target.value as typeof reg.attendanceStatus,
                                  )
                                }
                                aria-label={`Attendance for ${reg.memberName}`}
                                className={`min-h-[36px] px-2.5 py-1 rounded-lg border text-xs font-medium ${
                                  isCheckedIn
                                    ? 'border-[#4A6B5D]/40 bg-[#EEF4F0] text-[#2F5944]'
                                    : 'border-[#DDD5C7] bg-[#FAF8F5] text-[#1F3A3D]'
                                }`}
                              >
                                <option value="Confirmed">Confirmed</option>
                                <option value="Checked In">Checked In</option>
                                <option value="Pending">Pending</option>
                              </select>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Streak & Winner Tracker */}
            <section className="rounded-2xl bg-white border border-[#E7E1D6] p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-[#1F3A3D]">
                    Streak &amp; Winner Tracker
                  </h2>
                  <p className="text-xs text-[#5B635E]">
                    Sort practitioners by active streak or total days to award Weekly/Monthly prizes.
                  </p>
                </div>

                <div className="inline-flex p-1 rounded-xl bg-[#EFEAE0]">
                  <button
                    type="button"
                    onClick={() => setSortBy('streak')}
                    className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                      sortBy === 'streak'
                        ? 'bg-[#F1931E] text-[#1F3A3D]'
                        : 'text-[#5B635E]'
                    }`}
                  >
                    Sort: Active Streak
                  </button>
                  <button
                    type="button"
                    onClick={() => setSortBy('total')}
                    className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                      sortBy === 'total'
                        ? 'bg-[#F1931E] text-[#1F3A3D]'
                        : 'text-[#5B635E]'
                    }`}
                  >
                    Sort: Total Days
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#EFEAE0] text-xs text-[#5B635E]">
                      <th className="py-2.5 pr-4 font-medium">Practitioner</th>
                      <th className="py-2.5 pr-4 font-medium">Package</th>
                      <th className="py-2.5 pr-4 font-medium text-right">Active Streak</th>
                      <th className="py-2.5 pr-4 font-medium text-right">Total Days</th>
                      <th className="py-2.5 text-right font-medium">Prize Recognition</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F4F0E8] text-sm">
                    {sortedLeaderboard.map((m) => (
                      <tr key={m.id}>
                        <td className="py-3 pr-4">
                          <div className="font-medium text-[#1F3A3D]">{m.name}</div>
                          {m.awardedBadge && (
                            <div className="text-xs text-[#C86D0A] inline-flex items-center gap-1">
                              <Award className="w-3.5 h-3.5" />
                              <span>{m.awardedBadge}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 pr-4 text-xs text-[#5B635E]">
                          {m.activePackage}
                        </td>
                        <td className="py-3 pr-4 text-right font-mono tabular-nums font-semibold text-[#1F3A3D]">
                          <span className="inline-flex items-center gap-1">
                            <Flame className="w-3.5 h-3.5 text-[#F1931E]" />
                            {m.currentStreak}d
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-right font-mono tabular-nums text-[#5B635E]">
                          {m.totalDaysPracticed}d
                        </td>
                        <td className="py-3 text-right">
                          <div className="inline-flex items-center gap-2 justify-end">
                            <input
                              type="text"
                              value={
                                badgeDrafts[m.id] ??
                                m.awardedBadge ??
                                'November Zafu Winner'
                              }
                              onChange={(e) =>
                                setBadgeDrafts({...badgeDrafts, [m.id]: e.target.value})
                              }
                              aria-label={`Prize title for ${m.name}`}
                              className="w-36 min-h-[34px] px-2.5 py-1 rounded-lg border border-[#DDD5C7] bg-[#FAF8F5] text-xs"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                store.awardMemberBadge(
                                  m.id,
                                  badgeDrafts[m.id] ??
                                    m.awardedBadge ??
                                    'November Zafu Winner',
                                )
                              }
                              className="min-h-[34px] px-3 py-1 rounded-lg bg-[#1F3A3D] hover:bg-[#162B2D] text-[#FAF8F5] text-xs font-semibold cursor-pointer"
                            >
                              Award
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </div>
      <QRCheckInModal
        open={scannerOpen}
        registrations={state.registrations}
        onCheckInPass={store.checkInByPassCode}
        onClose={() => setScannerOpen(false)}
      />
    </div>
  );
};
