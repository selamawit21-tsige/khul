import React, {useEffect, useState} from 'react';
import {
  Compass,
  Eye,
  Flame,
  Home,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  User,
  Wind,
} from 'lucide-react';
import {AdminDashboard} from './components/admin/AdminDashboard';
import {KhulLogo} from './components/KhulLogo';
import {OfflineIndicator} from './components/OfflineIndicator';
import {EntryModal} from './components/user/EntryModal';
import {HomeTab} from './components/user/HomeTab';
import {ProfileTab} from './components/user/ProfileTab';
import {ServicesTab} from './components/user/ServicesTab';
import {StillnessTab} from './components/user/StillnessTab';
import {WeeklyGameTab} from './components/user/WeeklyGameTab';
import {useSanctuaryStore} from './hooks/useSanctuaryStore';
import {AdminTab, AppRole, ServiceSubTab, UserTab} from './types/khul';

function getInitialRoleFromLocation(): AppRole {
  if (typeof window === 'undefined') return 'user';
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const params = new URLSearchParams(window.location.search);
  if (path === '/admin' || hash === '#admin' || params.get('admin') === '1') {
    return 'admin';
  }
  return 'user';
}

export default function App() {
  const store = useSanctuaryStore();
  const {state, currentUser} = store;

  const [role, setRole] = useState<AppRole>(getInitialRoleFromLocation);
  const [userTab, setUserTab] = useState<UserTab>('home');
  const [serviceSubTab, setServiceSubTab] = useState<ServiceSubTab>('wednesday');
  const [adminTab, setAdminTab] = useState<AdminTab>('wednesdays');
  const [entryOpen, setEntryOpen] = useState(false);

  // Sync URL cleanly when switching between Member App and Admin Portal
  useEffect(() => {
    const targetPath = role === 'admin' ? '/admin' : '/';
    if (window.location.pathname !== targetPath) {
      window.history.replaceState(null, '', targetPath);
    }
  }, [role]);

  const handleNavigateUserTab = (tab: UserTab, subTab?: ServiceSubTab) => {
    setUserTab(tab);
    if (subTab) {
      setServiceSubTab(subTab);
    }
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  const userNavItems: {id: UserTab; label: string; shortLabel: string; icon: typeof Home}[] = [
    {id: 'home', label: 'Home', shortLabel: 'Home', icon: Home},
    {id: 'services', label: 'Services', shortLabel: 'Services', icon: Compass},
    {id: 'game', label: 'Weekly Game', shortLabel: 'Game', icon: Flame},
    {id: 'stillness', label: 'Stillness', shortLabel: 'Stillness', icon: Wind},
    {id: 'profile', label: 'My Profile', shortLabel: 'Profile', icon: User},
  ];

  const adminNavItems: {id: AdminTab; label: string; shortLabel: string; icon: typeof Home}[] = [
    {id: 'wednesdays', label: 'Wednesdays', shortLabel: 'Sessions', icon: LayoutDashboard},
    {id: 'corporate', label: 'Corporate', shortLabel: 'Corporate', icon: Compass},
    {id: 'store', label: 'Khul Life', shortLabel: 'Store', icon: Sparkles},
    {id: 'content', label: 'Content & Game', shortLabel: 'Content', icon: Wind},
    {id: 'registrations', label: 'Registrations', shortLabel: 'Members', icon: User},
  ];

  const showAdminWorkspace = role === 'admin';

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#2C302E]">
      {/* Top Bar Contract: 3 clean zones separated by gap-8 */}
      <header className="sticky top-0 z-30 h-14 md:h-16 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#E7E1D6]">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark + Khul World Logo */}
          <button
            type="button"
            onClick={() => {
              if (role === 'user') {
                handleNavigateUserTab('home');
              } else {
                setAdminTab('wednesdays');
              }
            }}
            className="flex items-center gap-2.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <KhulLogo logoUrl={state.brand.logoUrl} size="sm" />
            <span className="font-display text-base sm:text-lg font-semibold tracking-tight text-[#1F3A3D]">
              {showAdminWorkspace ? `${state.brand.sanctuaryName} Admin` : state.brand.sanctuaryName}
            </span>
          </button>

          {/* Zone 2: 5 concise single-line text nav links (Desktop) */}
          <nav
            className="hidden md:flex items-center gap-7 text-sm font-medium"
            aria-label={showAdminWorkspace ? 'Admin Navigation' : 'Member Navigation'}
          >
            {showAdminWorkspace
              ? adminNavItems.map((item) => {
                  const active = adminTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setAdminTab(item.id)}
                      className={`py-1 whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
                        active
                          ? 'border-[#F1931E] text-[#1F3A3D] font-semibold'
                          : 'border-transparent text-[#5B635E] hover:text-[#1F3A3D]'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })
              : userNavItems.map((item) => {
                  const active = userTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNavigateUserTab(item.id)}
                      className={`py-1 whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
                        active
                          ? 'border-[#F1931E] text-[#1F3A3D] font-semibold'
                          : 'border-transparent text-[#5B635E] hover:text-[#1F3A3D]'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
          </nav>

          {/* Zone 3: Quick View Switcher / Member Profile */}
          <div className="flex items-center gap-2.5 shrink-0">
            {showAdminWorkspace ? (
              <button
                type="button"
                onClick={() => setRole('user')}
                className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#F1931E] hover:bg-[#DF8312] text-[#1F3A3D] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Eye className="w-4 h-4 shrink-0" />
                <span>View User Page</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setEntryOpen(true)}
                  className="min-h-[40px] px-3 py-2 rounded-xl border border-[#DDD5C7] hover:bg-white text-[#1F3A3D] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-[#4A6B5D] shrink-0" />
                  <span>{currentUser.name.split(' ')[0]}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#1F3A3D] hover:bg-[#162B2D] text-[#FAF8F5] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-[#F1931E] shrink-0" />
                  <span>Admin Portal</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-24 md:pb-12">
        {role === 'admin' ? (
          <AdminDashboard
            activeTab={adminTab}
            onChangeTab={setAdminTab}
            store={store}
          />
        ) : (
          <>
            {userTab === 'home' && (
              <HomeTab
                member={currentUser}
                announcements={state.announcements}
                sessions={state.sessions}
                weeklyGame={state.weeklyGame}
                checkedInToday={state.checkedInToday}
                onNavigateTab={handleNavigateUserTab}
              />
            )}

            {userTab === 'services' && (
              <ServicesTab
                activeSubTab={serviceSubTab}
                onChangeSubTab={setServiceSubTab}
                brand={state.brand}
                sessions={state.sessions}
                packages={state.packages}
                corporatePrograms={state.corporatePrograms}
                products={state.products}
                bag={state.bag}
                member={currentUser}
                onRegisterSession={store.registerWednesdaySession}
                onSubmitCorporateInquiry={store.submitCorporateInquiry}
                onAddToBag={store.addToBag}
                onUpdateBagQuantity={store.updateBagQuantity}
                onCheckoutBag={store.checkoutBag}
              />
            )}

            {userTab === 'game' && (
              <WeeklyGameTab
                weeklyGame={state.weeklyGame}
                reflectionWords={state.reflectionWords}
                brandLogoUrl={state.brand.logoUrl}
                currentUser={currentUser}
                members={state.members}
                checkedInToday={state.checkedInToday}
                onCompletePractice={store.completeTodayPractice}
                onDrawVirtueGift={store.drawVirtueGift}
              />
            )}

            {userTab === 'stillness' && (
              <StillnessTab
                intention={state.stillnessIntention}
                reflectionWords={state.reflectionWords}
                onSaveIntention={store.saveStillnessIntention}
              />
            )}

            {userTab === 'profile' && (
              <ProfileTab
                member={currentUser}
                brand={state.brand}
                registrations={state.registrations}
                orders={state.orders}
                collectedWords={state.collectedWords}
                onOpenEntryScreen={() => setEntryOpen(true)}
              />
            )}
          </>
        )}
      </main>

      {/* Quiet Footer with direct Admin Portal switch */}
      <footer className="border-t border-[#E7E1D6] py-6 px-4 sm:px-8 pb-20 md:pb-6 text-xs text-[#6B736E]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>
            {state.brand.organizationName} · {state.brand.venueName}
          </span>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => setEntryOpen(true)}
              className="text-[#1F3A3D] font-medium hover:text-[#C86D0A] transition-colors cursor-pointer"
            >
              Account &amp; Profile
            </button>
            <button
              type="button"
              onClick={() => setRole(role === 'admin' ? 'user' : 'admin')}
              className="text-[#5B635E] hover:text-[#1F3A3D] inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{role === 'admin' ? 'View User Page' : 'Admin Portal'}</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar (Fixed 5-Tab Thumb Zone, h-16) */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-[#FAF8F5]/95 backdrop-blur-md border-t border-[#E7E1D6]"
        aria-label="Mobile navigation"
      >
        <div className="grid grid-cols-5 h-full items-center">
          {(showAdminWorkspace ? adminNavItems : userNavItems).map((item) => {
            const Icon = item.icon;
            const active = showAdminWorkspace
              ? adminTab === item.id
              : userTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (showAdminWorkspace) {
                    setAdminTab(item.id as AdminTab);
                  } else {
                    handleNavigateUserTab(item.id as UserTab);
                  }
                }}
                className={`h-full flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                  active ? 'text-[#1F3A3D]' : 'text-[#6B736E]'
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${active ? 'text-[#F1931E]' : 'text-[#6B736E]'}`}
                />
                <span
                  className={`text-[10px] tracking-tight whitespace-nowrap ${
                    active ? 'font-semibold text-[#1F3A3D]' : 'font-medium'
                  }`}
                >
                  {item.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <EntryModal
        open={entryOpen}
        brand={state.brand}
        member={currentUser}
        onUpdateProfile={store.updateMemberName}
        onSelectRole={setRole}
        onClose={() => setEntryOpen(false)}
      />

      <OfflineIndicator />
    </div>
  );
}
