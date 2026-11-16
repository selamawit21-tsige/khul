import React, {useMemo, useState} from 'react';
import {
  Check,
  Clock,
  ExternalLink,
  MapPin,
  Minus,
  Plus,
  ShoppingBag,
  Users,
  X,
} from 'lucide-react';
import {
  BagItem,
  BrandSettings,
  CommunityMember,
  CorporateProgram,
  KhulProduct,
  PackageTier,
  ProductCategory,
  ServiceSubTab,
  SessionRegistration,
  StoreOrder,
  WednesdayPackage,
  WednesdaySession,
} from '../../types/khul';
import {ProductVisual} from '../ProductVisual';
import {QRPassModal} from '../QRCodePass';

interface ServicesTabProps {
  activeSubTab: ServiceSubTab;
  onChangeSubTab: (sub: ServiceSubTab) => void;
  brand: BrandSettings;
  sessions: WednesdaySession[];
  packages: WednesdayPackage[];
  corporatePrograms: CorporateProgram[];
  products: KhulProduct[];
  bag: BagItem[];
  member: CommunityMember;
  onRegisterSession: (payload: {
    sessionId: string;
    packageTier: PackageTier;
    memberName: string;
    memberEmail: string;
    memberPhone: string;
  }) => SessionRegistration | null;
  onSubmitCorporateInquiry: (payload: {
    organizationName: string;
    contactName: string;
    contactEmail: string;
    teamSize: string;
    programInterest: string;
    goals: string;
  }) => void;
  onAddToBag: (productId: string) => void;
  onUpdateBagQuantity: (productId: string, delta: number) => void;
  onCheckoutBag: (payload: {
    customerName: string;
    customerPhone: string;
    fulfillmentMethod: 'Center Pickup (Bole Rwanda)' | 'Addis Delivery';
    deliveryAddress?: string;
  }) => StoreOrder | null;
}

export const ServicesTab: React.FC<ServicesTabProps> = ({
  activeSubTab,
  onChangeSubTab,
  brand,
  sessions,
  packages,
  corporatePrograms,
  products,
  bag,
  member,
  onRegisterSession,
  onSubmitCorporateInquiry,
  onAddToBag,
  onUpdateBagQuantity,
  onCheckoutBag,
}) => {
  // Wednesday booking state
  const publishedSessions = useMemo(
    () => sessions.filter((s) => s.published),
    [sessions],
  );
  const [bookingSessionId, setBookingSessionId] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<PackageTier>('Single');
  const [regName, setRegName] = useState(member.name);
  const [regEmail, setRegEmail] = useState(member.email);
  const [regPhone, setRegPhone] = useState('+251 911 248 910');
  const [confirmedPass, setConfirmedPass] = useState<SessionRegistration | null>(null);
  const [expandedPoster, setExpandedPoster] = useState<WednesdaySession | null>(null);

  // Corporate inquiry form state
  const [orgName, setOrgName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [teamSize, setTeamSize] = useState('25');
  const [programInterest, setProgramInterest] = useState(
    corporatePrograms[0]?.name ?? 'Reset — Executive & Team Masterclass',
  );
  const [goals, setGoals] = useState('');
  const [corporateSuccess, setCorporateSuccess] = useState<string | null>(null);

  // Store state
  const [categoryFilter, setCategoryFilter] = useState<'All' | ProductCategory>('All');
  const [bagOpen, setBagOpen] = useState(false);
  const [customerName, setCustomerName] = useState(member.name);
  const [customerPhone, setCustomerPhone] = useState('+251 911 248 910');
  const [fulfillmentMethod, setFulfillmentMethod] = useState<
    'Center Pickup (Bole Rwanda)' | 'Addis Delivery'
  >('Center Pickup (Bole Rwanda)');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<StoreOrder | null>(null);

  const bagCount = bag.reduce((sum, i) => sum + i.quantity, 0);
  const bagSubtotal = bag.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId);
    return sum + (product?.priceEtb ?? 0) * item.quantity;
  }, 0);

  const filteredProducts = useMemo(() => {
    if (categoryFilter === 'All') return products;
    return products.filter((p) => p.category === categoryFilter);
  }, [products, categoryFilter]);

  const activeBookingSession = publishedSessions.find((s) => s.id === bookingSessionId);

  const handleConfirmRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = bookingSessionId ?? publishedSessions[0]?.id;
    if (!targetId || !regName.trim()) return;
    const reg = onRegisterSession({
      sessionId: targetId,
      packageTier: selectedTier,
      memberName: regName,
      memberEmail: regEmail,
      memberPhone: regPhone,
    });
    if (reg) {
      setBookingSessionId(null);
      setConfirmedPass(reg);
    }
  };

  const handleCorporateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || !contactEmail.trim()) return;
    onSubmitCorporateInquiry({
      organizationName: orgName.trim(),
      contactName: contactName.trim() || 'HR / Leadership Team',
      contactEmail: contactEmail.trim(),
      teamSize,
      programInterest,
      goals: goals.trim() || 'Team wellbeing & mindful leadership program',
    });
    setCorporateSuccess(orgName.trim());
    setOrgName('');
    setContactName('');
    setContactEmail('');
    setGoals('');
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) return;
    const order = onCheckoutBag({
      customerName,
      customerPhone,
      fulfillmentMethod,
      deliveryAddress,
    });
    if (order) {
      setConfirmedOrder(order);
    }
  };

  return (
    <div className="space-y-8">
      {/* Services Sub-Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#1F3A3D]">
            Khul Services &amp; Offerings
          </h1>
          <p className="mt-1 text-sm text-[#5B635E]">
            Gatherings in Addis Ababa, organizational culture design, and mindful living tools.
          </p>
        </div>

        <div
          className="inline-flex items-center p-1 rounded-xl bg-[#EFEAE0] border border-[#E2DACB] self-start"
          role="tablist"
          aria-label="Khul Service Categories"
        >
          {(
            [
              {id: 'wednesday', label: 'Wednesday Programs'},
              {id: 'corporate', label: 'Khul Corporate'},
              {id: 'life', label: 'Khul Life Store'},
            ] as const
          ).map((tab) => {
            const active = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onChangeSubTab(tab.id)}
                className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[#F1931E] text-[#1F3A3D] font-semibold shadow-xs'
                    : 'text-[#49504C] hover:text-[#1F3A3D]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* A. WEDNESDAY PROGRAMS */}
      {activeSubTab === 'wednesday' && (
        <div className="space-y-8">
          {/* Interactive Venue & Directions Card */}
          <section className="rounded-2xl bg-[#1F3A3D] text-[#FAF8F5] p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <p className="text-xs font-medium text-[#F1931E]">
                  Weekly Venue · Kinet Hiwot &amp; Self-Engineering
                </p>
                <h2 className="text-xl sm:text-2xl font-semibold text-white">
                  {brand.venueName}
                </h2>
                <p className="text-sm text-[#D6DED9]">{brand.venueAddress}</p>
                <p className="text-xs text-[#B9C5BE] leading-relaxed pt-1">
                  {brand.venueDirections}
                </p>
              </div>
              <a
                href={brand.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] px-5 py-3 rounded-xl bg-[#F1931E] hover:bg-[#DF8312] text-[#1F3A3D] text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0"
              >
                <MapPin className="w-4 h-4" />
                <span>Open in Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </section>

          {/* Upcoming 4 Wednesday Sessions */}
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-[#1F3A3D]">
                Every Wednesday at Khul Wholeness Center
              </h2>
              <p className="mt-1 text-sm text-[#5B635E]">
                See what session is happening each week—tap any poster to view full details or reserve your seat.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {publishedSessions.map((session) => {
                const seatsLeft = Math.max(0, session.capacity - session.registeredCount);
                return (
                  <article
                    key={session.id}
                    className="rounded-2xl bg-white border border-[#E7E1D6] overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      {session.posterUrl && (
                        <button
                          type="button"
                          onClick={() => setExpandedPoster(session)}
                          className="block w-full aspect-[4/3] bg-[#1F3A3D] overflow-hidden border-b border-[#E7E1D6] group cursor-pointer"
                          aria-label={`View full poster for ${session.title}`}
                        >
                          <img
                            src={session.posterUrl}
                            alt={session.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover object-top group-hover:scale-[1.02] transition-transform duration-200"
                          />
                        </button>
                      )}

                      <div className="p-6 space-y-3">
                        <p className="text-xs text-[#5B635E]">
                          <span className="font-semibold text-[#C86D0A]">
                            {session.weekLabel ?? 'Wednesday Session'}
                          </span>
                          <span aria-hidden="true"> · </span>
                          <span className="font-mono tabular-nums">{session.date}</span>
                        </p>
                        <h3 className="text-lg font-semibold text-[#1F3A3D]">
                          {session.title}
                        </h3>
                        <p className="text-xs font-medium text-[#4A6B5D]">
                          {session.theme}
                        </p>
                        <p className="text-sm text-[#49504C] leading-relaxed">
                          {session.description}
                        </p>
                        <div className="pt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#5B635E]">
                          <span className="inline-flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-[#C88A55]" />
                            <span className="tabular-nums">{session.time}</span>
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-[#4A6B5D]" />
                            <span className="tabular-nums">
                              {seatsLeft} of {session.capacity} seats open
                            </span>
                          </span>
                          <span>Facilitator: {session.facilitator}</span>
                        </div>
                      </div>
                    </div>

                    <div className="px-6 pb-6 pt-4 border-t border-[#F0EBE1] flex items-center justify-between gap-4">
                      <div>
                        <span className="text-xs text-[#5B635E] block">Drop-in</span>
                        <span className="font-mono text-base font-semibold tabular-nums text-[#1F3A3D]">
                          {session.priceEtb.toLocaleString()} ETB
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={seatsLeft === 0}
                        onClick={() => {
                          setSelectedTier('Single');
                          setBookingSessionId(session.id);
                        }}
                        className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#F1931E] hover:bg-[#DF8312] disabled:opacity-45 text-[#1F3A3D] text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        {seatsLeft === 0 ? 'Session Full' : 'Reserve Seat'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {expandedPoster && expandedPoster.posterUrl && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
              role="dialog"
              aria-modal="true"
              aria-label={expandedPoster.title}
              onClick={() => setExpandedPoster(null)}
            >
              <div
                className="w-full max-w-2xl rounded-2xl bg-[#FAF8F5] border border-[#E5DFD3] overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E7E1D6]">
                  <div>
                    <p className="text-xs font-medium text-[#4A6B5D]">
                      {expandedPoster.weekLabel ?? expandedPoster.date}
                    </p>
                    <h3 className="text-base font-semibold text-[#1F3A3D]">
                      {expandedPoster.title}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpandedPoster(null)}
                    className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-[#5B635E] hover:bg-[#EFEAE0] cursor-pointer"
                    aria-label="Close poster"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="bg-[#161817] flex items-center justify-center max-h-[75vh] overflow-auto">
                  <img
                    src={expandedPoster.posterUrl}
                    alt={expandedPoster.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-auto max-h-[75vh] object-contain"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Packages: Single, Weekly, Monthly */}
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-[#1F3A3D]">
                Session Passes &amp; Packages
              </h2>
              <p className="mt-1 text-sm text-[#5B635E]">
                Choose a single drop-in or commit to weekly and monthly self-engineering rhythms.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {packages.map((pkg) => {
                const isMonthly = pkg.tier === 'Monthly';
                return (
                  <div
                    key={pkg.id}
                    className={`rounded-2xl p-6 flex flex-col justify-between gap-6 border ${
                      isMonthly
                        ? 'bg-[#FFFDF9] border-[#F1931E]'
                        : 'bg-white border-[#E7E1D6]'
                    }`}
                  >
                    <div className="space-y-3">
                      <p className="text-xs font-medium text-[#4A6B5D]">
                        {pkg.audienceLabel}
                      </p>
                      <h3 className="text-lg font-semibold text-[#1F3A3D]">{pkg.name}</h3>
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-2xl font-bold tabular-nums text-[#1F3A3D]">
                          {pkg.priceEtb.toLocaleString()} ETB
                        </span>
                        <span className="text-xs text-[#5B635E]">{pkg.cadenceLabel}</span>
                      </div>
                      <ul className="pt-2 space-y-2 text-sm text-[#49504C]">
                        {pkg.benefits.map((benefit, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-[#4A6B5D] shrink-0 mt-0.5" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTier(pkg.tier);
                        setBookingSessionId(publishedSessions[0]?.id ?? null);
                      }}
                      className={`w-full min-h-[44px] rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                        isMonthly
                          ? 'bg-[#F1931E] hover:bg-[#DF8312] text-[#1F3A3D]'
                          : 'bg-[#1F3A3D] hover:bg-[#162B2D] text-[#FAF8F5]'
                      }`}
                    >
                      Select {pkg.tier} Pass
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* B. KHUL CORPORATE */}
      {activeSubTab === 'corporate' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-5">
            <div>
              <h2 className="text-xl font-semibold text-[#1F3A3D]">
                Organizational Wellbeing &amp; Self-Engineering
              </h2>
              <p className="mt-1 text-sm text-[#5B635E]">
                Evidence-grounded nervous system resilience and mindful leadership designed for Ethiopian organizations.
              </p>
            </div>

            <div className="space-y-4">
              {corporatePrograms.map((prog) => (
                <article
                  key={prog.id}
                  className="rounded-2xl bg-white border border-[#E7E1D6] p-6 space-y-3"
                >
                  <p className="text-xs text-[#5B635E]">
                    <span className="font-medium text-[#4A6B5D]">{prog.duration}</span>
                    <span aria-hidden="true"> · </span>
                    <span>{prog.idealFor}</span>
                  </p>
                  <h3 className="text-lg font-semibold text-[#1F3A3D]">{prog.name}</h3>
                  <p className="text-sm text-[#49504C] leading-relaxed">{prog.summary}</p>
                  <ul className="pt-2 space-y-1.5 text-sm text-[#2C302E]">
                    {prog.outcomes.map((outcome, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-[#F1931E] shrink-0 mt-0.5" />
                        <span>{outcome}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setProgramInterest(prog.name)}
                      className="text-xs font-semibold text-[#C86D0A] hover:text-[#1F3A3D] transition-colors cursor-pointer"
                    >
                      Pre-select this program in inquiry form →
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 rounded-2xl bg-white border border-[#E7E1D6] p-6 sm:p-7 space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-[#1F3A3D]">
                Request Corporate Proposal / Book Discovery Call
              </h2>
              <p className="mt-1 text-xs text-[#5B635E]">
                Our corporate team in Addis Ababa responds within one business day.
              </p>
            </div>

            {corporateSuccess && (
              <div className="rounded-xl bg-[#EEF4F0] border border-[#C6D8CC] p-4 text-sm text-[#1F3A3D]">
                <p className="font-semibold">Inquiry received for {corporateSuccess}.</p>
                <p className="mt-1 text-xs text-[#4A6B5D]">
                  You can also view this request live inside the Admin Dashboard Control Panel.
                </p>
              </div>
            )}

            <form onSubmit={handleCorporateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#49504C] mb-1.5">
                  Organization Name
                </label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g., Dashen Innovation Group"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DDD5C7] bg-[#FAF8F5] text-sm text-[#2C302E] focus:outline-none focus:border-[#F1931E]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#49504C] mb-1.5">
                    Contact Name &amp; Role
                  </label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g., Meron HR Lead"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DDD5C7] bg-[#FAF8F5] text-sm text-[#2C302E] focus:outline-none focus:border-[#F1931E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#49504C] mb-1.5">
                    Work Email
                  </label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="hr@company.et"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DDD5C7] bg-[#FAF8F5] text-sm text-[#2C302E] focus:outline-none focus:border-[#F1931E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#49504C] mb-1.5">
                    Team Size
                  </label>
                  <input
                    type="number"
                    min="5"
                    required
                    value={teamSize}
                    onChange={(e) => setTeamSize(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DDD5C7] bg-[#FAF8F5] text-sm font-mono tabular-nums text-[#2C302E] focus:outline-none focus:border-[#F1931E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#49504C] mb-1.5">
                    Program Track
                  </label>
                  <select
                    value={programInterest}
                    onChange={(e) => setProgramInterest(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#DDD5C7] bg-[#FAF8F5] text-sm text-[#2C302E] focus:outline-none focus:border-[#F1931E]"
                  >
                    {corporatePrograms.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#49504C] mb-1.5">
                  Wellbeing &amp; Training Goals
                </label>
                <textarea
                  rows={3}
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  placeholder="Share team priorities (e.g., stress resilience, off-site facilitation, quarterly leadership clarity)..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD5C7] bg-[#FAF8F5] text-sm text-[#2C302E] focus:outline-none focus:border-[#F1931E]"
                />
              </div>

              <button
                type="submit"
                className="w-full min-h-[44px] rounded-xl bg-[#F1931E] hover:bg-[#DF8312] text-[#1F3A3D] text-sm font-semibold transition-colors cursor-pointer"
              >
                Submit Corporate Inquiry
              </button>
            </form>
          </div>
        </div>
      )}

      {/* C. KHUL LIFE STORE */}
      {activeSubTab === 'life' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                ['All', 'Journals & Books', 'Herbal Blends', 'Practice Tools', 'Atmosphere'] as const
              ).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-[#1F3A3D] text-[#FAF8F5]'
                      : 'bg-white border border-[#E7E1D6] text-[#49504C] hover:border-[#F1931E]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setBagOpen(true)}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#F1931E] hover:bg-[#DF8312] text-[#1F3A3D] text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="tabular-nums">
                Bag ({bagCount}) · {bagSubtotal.toLocaleString()} ETB
              </span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProducts.map((product) => (
              <article
                key={product.id}
                className="rounded-2xl bg-white border border-[#E7E1D6] overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-[4/3] w-full overflow-hidden border-b border-[#EFEAE0]">
                    <ProductVisual product={product} />
                  </div>
                  <div className="p-5 space-y-2">
                    <p className="text-xs text-[#5B635E]">
                      <span className="font-medium text-[#4A6B5D]">{product.category}</span>
                      <span aria-hidden="true"> · </span>
                      <span>{product.inStock ? 'Available' : 'Out of Stock'}</span>
                    </p>
                    <h3 className="text-base font-semibold text-[#1F3A3D]">
                      {product.name}
                    </h3>
                    <p className="text-sm text-[#49504C] leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-3 border-t border-[#F0EBE1] flex items-center justify-between gap-4">
                  <span className="font-mono text-base font-semibold tabular-nums text-[#1F3A3D]">
                    {product.priceEtb.toLocaleString()} ETB
                  </span>
                  <button
                    type="button"
                    disabled={!product.inStock}
                    onClick={() => {
                      onAddToBag(product.id);
                      setBagOpen(true);
                    }}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-[#F1931E] hover:bg-[#DF8312] disabled:bg-[#E7E1D6] disabled:text-[#7B827E] text-[#1F3A3D] text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {product.inStock ? 'Add to Bag' : 'Restocking Soon'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* Wednesday Registration Modal */}
      {bookingSessionId && activeBookingSession && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="booking-modal-title"
        >
          <div className="w-full max-w-lg rounded-2xl bg-[#FAF8F5] border border-[#E5DFD3] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-[#4A6B5D]">
                  Instant Session Pass
                </p>
                <h3 id="booking-modal-title" className="mt-1 text-xl font-semibold text-[#1F3A3D]">
                  Reserve Wednesday Session
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setBookingSessionId(null)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-[#5B635E] hover:bg-[#EFEAE0] cursor-pointer"
                aria-label="Close booking dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmRegistration} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#49504C] mb-1.5">
                  Choose Wednesday Session
                </label>
                <select
                  value={bookingSessionId}
                  onChange={(e) => setBookingSessionId(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#DDD5C7] bg-white text-sm text-[#2C302E] focus:outline-none focus:border-[#F1931E]"
                >
                  {publishedSessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.date} — {s.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#49504C] mb-1.5">
                  Select Pass Tier
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {packages.map((pkg) => (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setSelectedTier(pkg.tier)}
                      className={`min-h-[44px] p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                        selectedTier === pkg.tier
                          ? 'bg-[#F1931E]/15 border-[#F1931E] text-[#1F3A3D]'
                          : 'bg-white border-[#E2DACB] text-[#5B635E]'
                      }`}
                    >
                      <div className="text-xs font-semibold">{pkg.tier}</div>
                      <div className="font-mono text-xs tabular-nums mt-0.5">
                        {(pkg.tier === 'Single'
                          ? activeBookingSession.priceEtb
                          : pkg.priceEtb
                        ).toLocaleString()}{' '}
                        ETB
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#49504C] mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DDD5C7] bg-white text-sm text-[#2C302E] focus:outline-none focus:border-[#F1931E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#49504C] mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DDD5C7] bg-white text-sm text-[#2C302E] focus:outline-none focus:border-[#F1931E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#49504C] mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DDD5C7] bg-white text-sm text-[#2C302E] focus:outline-none focus:border-[#F1931E]"
                />
              </div>

              <button
                type="submit"
                className="w-full min-h-[48px] rounded-xl bg-[#F1931E] hover:bg-[#DF8312] text-[#1F3A3D] text-sm font-semibold transition-colors cursor-pointer"
              >
                Confirm Booking &amp; Generate QR Pass
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Khul Life Bag Drawer */}
      {bagOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bag-drawer-title"
        >
          <div className="w-full max-w-md bg-[#FAF8F5] h-full overflow-y-auto p-6 flex flex-col justify-between shadow-2xl border-l border-[#E5DFD3]">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#E7E1D6]">
                <h3 id="bag-drawer-title" className="text-lg font-semibold text-[#1F3A3D]">
                  Your Khul Life Bag
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setBagOpen(false);
                    setConfirmedOrder(null);
                  }}
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-[#5B635E] hover:bg-[#EFEAE0] cursor-pointer"
                  aria-label="Close bag"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {confirmedOrder ? (
                <div className="mt-6 rounded-2xl bg-white border border-[#E7E1D6] p-5 space-y-3">
                  <p className="text-xs font-medium text-[#4A6B5D]">Order Confirmed</p>
                  <h4 className="text-lg font-semibold text-[#1F3A3D]">
                    Reservation {confirmedOrder.id}
                  </h4>
                  <p className="text-sm text-[#49504C]">
                    Thank you, {confirmedOrder.customerName}. Your items are reserved for{' '}
                    <span className="font-medium text-[#1F3A3D]">
                      {confirmedOrder.fulfillmentMethod}
                    </span>
                    .
                  </p>
                  <p className="font-mono text-base font-semibold tabular-nums text-[#1F3A3D]">
                    Total: {confirmedOrder.totalEtb.toLocaleString()} ETB
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmedOrder(null);
                      setBagOpen(false);
                    }}
                    className="w-full min-h-[44px] rounded-xl bg-[#F1931E] text-[#1F3A3D] text-sm font-semibold cursor-pointer"
                  >
                    Continue Browsing
                  </button>
                </div>
              ) : bag.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <ShoppingBag className="w-8 h-8 text-[#C88A55] mx-auto" />
                  <p className="text-sm text-[#5B635E]">Your Khul Life bag is currently empty.</p>
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  {bag.map((item) => {
                    const product = products.find((p) => p.id === item.productId);
                    if (!product) return null;
                    return (
                      <div
                        key={item.productId}
                        className="flex items-center justify-between gap-3 pb-4 border-b border-[#EFEAE0]"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#1F3A3D] truncate">
                            {product.name}
                          </p>
                          <p className="font-mono text-xs tabular-nums text-[#5B635E]">
                            {product.priceEtb.toLocaleString()} ETB each
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => onUpdateBagQuantity(item.productId, -1)}
                            className="min-h-[36px] min-w-[36px] rounded-lg border border-[#DDD5C7] flex items-center justify-center text-[#1F3A3D] hover:bg-white cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-mono text-sm tabular-nums w-5 text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateBagQuantity(item.productId, 1)}
                            className="min-h-[36px] min-w-[36px] rounded-lg border border-[#DDD5C7] flex items-center justify-center text-[#1F3A3D] hover:bg-white cursor-pointer"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  <form onSubmit={handlePlaceOrder} className="pt-2 space-y-3.5">
                    <div>
                      <label className="block text-xs font-medium text-[#49504C] mb-1">
                        Your Name
                      </label>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DDD5C7] bg-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#49504C] mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DDD5C7] bg-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#49504C] mb-1">
                        Fulfillment
                      </label>
                      <select
                        value={fulfillmentMethod}
                        onChange={(e) =>
                          setFulfillmentMethod(
                            e.target.value as 'Center Pickup (Bole Rwanda)' | 'Addis Delivery',
                          )
                        }
                        className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-[#DDD5C7] bg-white text-sm"
                      >
                        <option value="Center Pickup (Bole Rwanda)">
                          Center Pickup (Bole Rwanda)
                        </option>
                        <option value="Addis Delivery">Addis Ababa Delivery</option>
                      </select>
                    </div>
                    {fulfillmentMethod === 'Addis Delivery' && (
                      <div>
                        <label className="block text-xs font-medium text-[#49504C] mb-1">
                          Delivery Area / Sub-city
                        </label>
                        <input
                          type="text"
                          required
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          placeholder="e.g., Kazanchis, near Jupiter Hotel"
                          className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#DDD5C7] bg-white text-sm"
                        />
                      </div>
                    )}

                    <div className="pt-3 border-t border-[#E7E1D6] flex items-center justify-between text-sm">
                      <span className="font-medium text-[#5B635E]">Order Total</span>
                      <span className="font-mono text-lg font-bold tabular-nums text-[#1F3A3D]">
                        {bagSubtotal.toLocaleString()} ETB
                      </span>
                    </div>

                    <button
                      type="submit"
                      className="w-full min-h-[48px] rounded-xl bg-[#F1931E] hover:bg-[#DF8312] text-[#1F3A3D] text-sm font-semibold transition-colors cursor-pointer"
                    >
                      Reserve Order
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Instant QR Digital Pass Modal */}
      <QRPassModal
        registration={confirmedPass}
        venueName={brand.venueName}
        onClose={() => setConfirmedPass(null)}
      />
    </div>
  );
};
