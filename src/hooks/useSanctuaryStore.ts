import {useCallback, useEffect, useRef, useState} from 'react';
import {User, onAuthStateChanged} from 'firebase/auth';
import {INITIAL_SANCTUARY_STATE} from '../data/initialData';
import {
  PRIMARY_ADMIN_EMAIL,
  auth,
  signInWithGoogle,
  signOutUser,
} from '../firebase';
import {
  Announcement,
  BrandSettings,
  CommunityMember,
  CorporateInquiry,
  KhulProduct,
  PackageTier,
  ReflectionWord,
  SanctuaryState,
  SessionRegistration,
  StoreOrder,
  WednesdayPackage,
  WednesdaySession,
  WeeklyGameConfig,
} from '../types/khul';

const STORAGE_KEY = 'khul_sanctuary_state_v7';

export interface AdminRecordItem {
  uid: string;
  email: string;
  role: 'admin';
}

function loadInitialState(): SanctuaryState {
  if (typeof window === 'undefined') return INITIAL_SANCTUARY_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_SANCTUARY_STATE;
    const parsed = JSON.parse(raw) as Partial<SanctuaryState>;
    return {
      ...INITIAL_SANCTUARY_STATE,
      ...parsed,
      brand: {...INITIAL_SANCTUARY_STATE.brand, ...(parsed.brand ?? {})},
      weeklyGame: {...INITIAL_SANCTUARY_STATE.weeklyGame, ...(parsed.weeklyGame ?? {})},
    };
  } catch {
    return INITIAL_SANCTUARY_STATE;
  }
}

interface PublicStateResponse {
  brand: BrandSettings;
  weeklyGame: WeeklyGameConfig;
  sessions: WednesdaySession[];
  packages: WednesdayPackage[];
  products: KhulProduct[];
  announcements: Announcement[];
  reflectionWords: ReflectionWord[];
  members: CommunityMember[];
}

interface MeResponse {
  user: {
    uid: string;
    name: string;
    email: string;
    activePackage: PackageTier;
    currentStreak: number;
    totalDaysPracticed: number;
    weekDaysCompleted: boolean[];
    awardedBadge?: string;
    stillnessIntention: string;
    checkedInToday: boolean;
  };
  isAdmin: boolean;
  adminRecords: AdminRecordItem[];
  registrations: SessionRegistration[];
  orders: StoreOrder[];
  corporateInquiries: CorporateInquiry[];
}

export function useSanctuaryStore() {
  const [state, setState] = useState<SanctuaryState>(loadInitialState);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckDone, setAdminCheckDone] = useState(false);
  const [cloudSynced, setCloudSynced] = useState(false);
  const [lastCloudSaveAt, setLastCloudSaveAt] = useState<string | null>(null);
  const [adminRecords, setAdminRecords] = useState<AdminRecordItem[]>([]);

  const authUserRef = useRef<User | null>(null);

  // Persist local cache cleanly
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota errors cleanly
    }
  }, [state]);

  const getAuthHeaders = useCallback(async (userOverride?: User | null): Promise<Record<string, string>> => {
    const targetUser = userOverride !== undefined ? userOverride : authUserRef.current;
    if (!targetUser) return {};
    try {
      const token = await targetUser.getIdToken();
      return {Authorization: `Bearer ${token}`};
    } catch {
      return {};
    }
  }, []);

  const apiRequest = useCallback(
    async (
      url: string,
      options?: RequestInit & {requireToken?: boolean; userOverride?: User | null},
    ) => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options?.headers as Record<string, string> | undefined),
      };
      const authHeaders = await getAuthHeaders(options?.userOverride);
      Object.assign(headers, authHeaders);

      if (options?.requireToken && !headers.Authorization) {
        throw new Error('Authentication required');
      }

      const res = await fetch(url, {
        ...options,
        headers,
      });
      if (!res.ok) {
        let msg = `Request failed (${res.status})`;
        try {
          const data = (await res.json()) as {error?: string};
          if (data?.error) msg = data.error;
        } catch {
          // ignore
        }
        throw new Error(msg);
      }
      return res.json();
    },
    [getAuthHeaders],
  );

  const fetchPublicState = useCallback(async () => {
    try {
      const data = (await apiRequest('/api/public/state', {method: 'GET'})) as PublicStateResponse;
      setState((prev) => {
        const currentUserId = prev.currentUserId;
        const incomingById = new Map(data.members.map((m) => [m.id, m]));
        const existingCurrent = prev.members.find((m) => m.id === currentUserId);
        if (existingCurrent && !incomingById.has(existingCurrent.id)) {
          incomingById.set(existingCurrent.id, existingCurrent);
        }
        const mergedMembers = Array.from(incomingById.values()).map((m) => ({
          ...m,
          isCurrentUser: m.id === currentUserId,
        }));

        return {
          ...prev,
          brand: data.brand ?? prev.brand,
          weeklyGame: data.weeklyGame ?? prev.weeklyGame,
          sessions: data.sessions.length > 0 ? data.sessions : prev.sessions,
          packages: data.packages.length > 0 ? data.packages : prev.packages,
          products: data.products.length > 0 ? data.products : prev.products,
          announcements: data.announcements.length > 0 ? data.announcements : prev.announcements,
          reflectionWords:
            data.reflectionWords.length > 0 ? data.reflectionWords : prev.reflectionWords,
          members: mergedMembers.length > 0 ? mergedMembers : prev.members,
        };
      });
      setCloudSynced(true);
    } catch (error) {
      console.warn('Public state fetch failed, using cached state:', error);
    }
  }, [apiRequest]);

  const fetchAuthenticatedUserState = useCallback(
    async (user: User | null) => {
      if (!user || !user.emailVerified) {
        setIsAdmin(false);
        setAdminRecords([]);
        setAdminCheckDone(true);
        return;
      }

      const isPrimaryEmail =
        (user.email ?? '').toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase();

      try {
        const me = (await apiRequest('/api/me', {
          method: 'GET',
          requireToken: true,
          userOverride: user,
        })) as MeResponse;

        setIsAdmin(Boolean(me.isAdmin));
        setAdminRecords(me.adminRecords ?? []);
        setAdminCheckDone(true);

        setState((prev) => {
          const otherMembers = prev.members
            .filter((m) => m.id !== me.user.uid)
            .map((m) => ({...m, isCurrentUser: false}));

          const signedInMember: CommunityMember = {
            id: me.user.uid,
            name: me.user.name,
            email: me.user.email,
            activePackage: me.user.activePackage || 'Single',
            currentStreak: me.user.currentStreak ?? 1,
            totalDaysPracticed: me.user.totalDaysPracticed ?? 1,
            weekDaysCompleted:
              me.user.weekDaysCompleted ?? [false, false, false, false, false, false, false],
            awardedBadge: me.user.awardedBadge,
            isCurrentUser: true,
          };

          return {
            ...prev,
            currentUserId: me.user.uid,
            checkedInToday: me.user.checkedInToday || prev.checkedInToday,
            stillnessIntention: me.user.stillnessIntention || prev.stillnessIntention,
            members: [signedInMember, ...otherMembers],
            registrations: me.registrations,
            orders: me.orders,
            corporateInquiries: me.corporateInquiries,
          };
        });
        setCloudSynced(true);
      } catch (error) {
        console.warn('Authenticated sync failed:', error);
        setIsAdmin(isPrimaryEmail);
        setAdminCheckDone(true);
      }
    },
    [apiRequest],
  );

  // 1. Track Firebase Auth state and sync with Cloud SQL backend
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      authUserRef.current = user;
      setAuthUser(user);
      setAuthReady(true);

      if (!user) {
        setIsAdmin(false);
        setAdminRecords([]);
        setAdminCheckDone(true);
        return;
      }

      await fetchAuthenticatedUserState(user);
    });

    return () => unsub();
  }, [fetchAuthenticatedUserState]);

  // 2. Load Cloud SQL public catalog & subscribe to live Admin -> User updates via SSE
  useEffect(() => {
    void fetchPublicState();

    let es: EventSource | null = null;
    if (typeof EventSource !== 'undefined') {
      es = new EventSource('/api/events');
      es.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data) as {type?: string};
          if (parsed.type === 'state-updated') {
            void fetchPublicState();
            if (authUserRef.current?.emailVerified) {
              void fetchAuthenticatedUserState(authUserRef.current);
            }
          }
        } catch {
          // ignore malformed SSE pings
        }
      };
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void fetchPublicState();
        if (authUserRef.current?.emailVerified) {
          void fetchAuthenticatedUserState(authUserRef.current);
        }
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      es?.close();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [fetchAuthenticatedUserState, fetchPublicState]);

  const currentUser =
    state.members.find((m) => m.id === state.currentUserId) ?? state.members[0];

  const markSavedNow = useCallback(() => {
    setCloudSynced(true);
    setLastCloudSaveAt(new Date().toLocaleTimeString());
  }, []);

  const syncCloudDefaults = useCallback(
    async (forceOverwrite = false) => {
      if (!isAdmin) return;
      if (forceOverwrite) {
        await apiRequest('/api/admin/reset-defaults', {method: 'POST', requireToken: true});
      }
      await fetchPublicState();
      if (authUserRef.current?.emailVerified) {
        await fetchAuthenticatedUserState(authUserRef.current);
      }
      markSavedNow();
    },
    [apiRequest, fetchAuthenticatedUserState, fetchPublicState, isAdmin, markSavedNow],
  );

  const updateMemberName = useCallback(
    (name: string, email?: string) => {
      const cleanName = name.trim();
      if (!cleanName) return;
      setState((prev) => ({
        ...prev,
        members: prev.members.map((m) =>
          m.id === prev.currentUserId
            ? {...m, name: cleanName, email: email?.trim() || m.email}
            : m,
        ),
      }));

      if (authUserRef.current?.emailVerified) {
        void apiRequest('/api/member/profile', {
          method: 'POST',
          requireToken: true,
          body: JSON.stringify({
            name: cleanName,
            email: email?.trim(),
          }),
        }).catch((err) => console.warn('Profile save failed:', err));
      }
    },
    [apiRequest],
  );

  const completeTodayPractice = useCallback((): ReflectionWord => {
    const pool = state.reflectionWords;
    const word =
      pool[Math.floor(Math.random() * pool.length)] ??
      INITIAL_SANCTUARY_STATE.reflectionWords[0];

    setState((prev) => {
      if (prev.checkedInToday) return prev;
      const todayLabel = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      const updatedMembers = prev.members.map((m) => {
        if (m.id !== prev.currentUserId) return m;
        const nextWeek = [...m.weekDaysCompleted];
        nextWeek[6] = true;
        return {
          ...m,
          currentStreak: m.currentStreak + 1,
          totalDaysPracticed: m.totalDaysPracticed + 1,
          weekDaysCompleted: nextWeek,
        };
      });

      return {
        ...prev,
        checkedInToday: true,
        members: updatedMembers,
        collectedWords: [
          {
            id: `cw-${Date.now()}`,
            word: word.word,
            amharicWord: word.amharicWord,
            reflection: word.reflection,
            amharicReflection: word.amharicReflection,
            cardTheme: word.cardTheme,
            earnedAt: todayLabel,
          },
          ...prev.collectedWords,
        ],
      };
    });

    if (authUserRef.current?.emailVerified) {
      void apiRequest('/api/member/checkin', {
        method: 'POST',
        requireToken: true,
      }).catch((err) => console.warn('Check-in sync failed:', err));
    }

    return word;
  }, [apiRequest, state.reflectionWords]);

  const drawVirtueGift = useCallback(
    (excludeIds?: string[]): ReflectionWord => {
      const pool = state.reflectionWords;
      const recentSet = new Set(excludeIds ?? []);
      let candidates = pool.filter((w) => !recentSet.has(w.id));
      if (candidates.length === 0) {
        const lastId = excludeIds?.[excludeIds.length - 1];
        candidates = pool.length > 1 && lastId ? pool.filter((w) => w.id !== lastId) : pool;
      }
      const word =
        candidates[Math.floor(Math.random() * candidates.length)] ??
        INITIAL_SANCTUARY_STATE.reflectionWords[0];

      const todayLabel = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      setState((prev) => {
        const alreadyCollected = prev.collectedWords.some(
          (c) => c.word === word.word && c.earnedAt === todayLabel,
        );
        if (alreadyCollected) return prev;
        return {
          ...prev,
          collectedWords: [
            {
              id: `cw-${Date.now()}`,
              word: word.word,
              amharicWord: word.amharicWord,
              reflection: word.reflection,
              amharicReflection: word.amharicReflection,
              cardTheme: word.cardTheme,
              earnedAt: todayLabel,
            },
            ...prev.collectedWords,
          ],
        };
      });

      return word;
    },
    [state.reflectionWords],
  );

  const registerWednesdaySession = useCallback(
    (payload: {
      sessionId: string;
      packageTier: PackageTier;
      memberName: string;
      memberEmail: string;
      memberPhone: string;
    }): SessionRegistration | null => {
      const targetSession = state.sessions.find((s) => s.id === payload.sessionId);
      const targetPackage = state.packages.find((p) => p.tier === payload.packageTier);
      if (!targetSession) return null;

      const amountEtb =
        payload.packageTier === 'Single'
          ? targetSession.priceEtb
          : targetPackage?.priceEtb ?? targetSession.priceEtb;

      const passCode = `KHUL-${Math.floor(1000 + Math.random() * 9000)}-${payload.packageTier
        .slice(0, 3)
        .toUpperCase()}`;

      const regId = `reg-${Date.now()}`;
      const registration: SessionRegistration = {
        id: regId,
        memberName: payload.memberName.trim(),
        memberEmail: payload.memberEmail.trim(),
        memberPhone: payload.memberPhone.trim(),
        sessionId: targetSession.id,
        sessionTitle: targetSession.title,
        sessionDate: targetSession.date,
        packageTier: payload.packageTier,
        amountEtb,
        passCode,
        attendanceStatus: 'Confirmed',
        createdAt: new Date().toISOString().slice(0, 10),
      };

      setState((prev) => ({
        ...prev,
        registrations: [registration, ...prev.registrations],
        sessions: prev.sessions.map((s) =>
          s.id === targetSession.id
            ? {...s, registeredCount: Math.min(s.capacity, s.registeredCount + 1)}
            : s,
        ),
        members: prev.members.map((m) =>
          m.id === prev.currentUserId
            ? {
                ...m,
                name: payload.memberName.trim() || m.name,
                email: payload.memberEmail.trim() || m.email,
                activePackage: payload.packageTier,
              }
            : m,
        ),
      }));

      void apiRequest('/api/registrations', {
        method: 'POST',
        body: JSON.stringify(registration),
      }).catch((err) => console.warn('Registration save failed:', err));

      return registration;
    },
    [apiRequest, state.packages, state.sessions],
  );

  const submitCorporateInquiry = useCallback(
    (payload: {
      organizationName: string;
      contactName: string;
      contactEmail: string;
      teamSize: string;
      programInterest: string;
      goals: string;
    }): CorporateInquiry => {
      const inqId = `inq-${Date.now()}`;
      const inquiry: CorporateInquiry = {
        id: inqId,
        ...payload,
        status: 'New Inquiry',
        submittedAt: new Date().toISOString().slice(0, 10),
      };
      setState((prev) => ({
        ...prev,
        corporateInquiries: [inquiry, ...prev.corporateInquiries],
      }));

      void apiRequest('/api/corporate-inquiries', {
        method: 'POST',
        body: JSON.stringify(inquiry),
      }).catch((err) => console.warn('Corporate inquiry save failed:', err));

      return inquiry;
    },
    [apiRequest],
  );

  const addToBag = useCallback((productId: string) => {
    setState((prev) => {
      const existing = prev.bag.find((b) => b.productId === productId);
      if (existing) {
        return {
          ...prev,
          bag: prev.bag.map((b) =>
            b.productId === productId ? {...b, quantity: b.quantity + 1} : b,
          ),
        };
      }
      return {...prev, bag: [...prev.bag, {productId, quantity: 1}]};
    });
  }, []);

  const updateBagQuantity = useCallback((productId: string, delta: number) => {
    setState((prev) => ({
      ...prev,
      bag: prev.bag
        .map((b) =>
          b.productId === productId ? {...b, quantity: b.quantity + delta} : b,
        )
        .filter((b) => b.quantity > 0),
    }));
  }, []);

  const checkoutBag = useCallback(
    (payload: {
      customerName: string;
      customerPhone: string;
      fulfillmentMethod: 'Center Pickup (Bole Rwanda)' | 'Addis Delivery';
      deliveryAddress?: string;
    }): StoreOrder | null => {
      if (state.bag.length === 0) return null;
      const items = state.bag
        .map((b) => {
          const prod = state.products.find((p) => p.id === b.productId);
          if (!prod) return null;
          return {
            productId: prod.id,
            name: prod.name,
            quantity: b.quantity,
            priceEtb: prod.priceEtb,
          };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null);

      const totalEtb = items.reduce((sum, item) => sum + item.priceEtb * item.quantity, 0);
      const orderId = `ORD-${String(Math.floor(1000 + Math.random() * 9000))}`;
      const order: StoreOrder = {
        id: orderId,
        customerName: payload.customerName.trim(),
        customerPhone: payload.customerPhone.trim(),
        fulfillmentMethod: payload.fulfillmentMethod,
        deliveryAddress: payload.deliveryAddress?.trim(),
        items,
        totalEtb,
        status: 'Reserved',
        createdAt: new Date().toISOString().slice(0, 10),
      };

      setState((prev) => ({
        ...prev,
        orders: [order, ...prev.orders],
        bag: [],
      }));

      void apiRequest('/api/orders', {
        method: 'POST',
        body: JSON.stringify(order),
      }).catch((err) => console.warn('Order save failed:', err));

      return order;
    },
    [apiRequest, state.bag, state.products],
  );

  const saveStillnessIntention = useCallback(
    (intention: string) => {
      setState((prev) => ({...prev, stillnessIntention: intention}));
      if (authUserRef.current?.emailVerified) {
        void apiRequest('/api/member/profile', {
          method: 'POST',
          requireToken: true,
          body: JSON.stringify({stillnessIntention: intention}),
        }).catch((err) => console.warn('Intention save failed:', err));
      }
    },
    [apiRequest],
  );

  // --- PRIVILEGED ADMIN ACTIONS (Verified Admin Only -> Persisted in Cloud SQL -> Live SSE to User Pages) ---
  const upsertSession = useCallback(
    (session: WednesdaySession) => {
      if (!isAdmin) return;
      setState((prev) => {
        const exists = prev.sessions.some((s) => s.id === session.id);
        return {
          ...prev,
          sessions: exists
            ? prev.sessions.map((s) => (s.id === session.id ? session : s))
            : [...prev.sessions, session],
        };
      });
      void apiRequest(`/api/admin/sessions/${encodeURIComponent(session.id)}`, {
        method: 'PUT',
        requireToken: true,
        body: JSON.stringify(session),
      })
        .then(markSavedNow)
        .catch((err) => console.error('Save session failed:', err));
    },
    [apiRequest, isAdmin, markSavedNow],
  );

  const deleteSession = useCallback(
    (id: string) => {
      if (!isAdmin) return;
      setState((prev) => ({
        ...prev,
        sessions: prev.sessions.filter((s) => s.id !== id),
      }));
      void apiRequest(`/api/admin/sessions/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        requireToken: true,
      })
        .then(markSavedNow)
        .catch((err) => console.error('Delete session failed:', err));
    },
    [apiRequest, isAdmin, markSavedNow],
  );

  const updatePackagePricing = useCallback(
    (pkg: WednesdayPackage) => {
      if (!isAdmin) return;
      setState((prev) => ({
        ...prev,
        packages: prev.packages.map((p) => (p.id === pkg.id ? pkg : p)),
      }));
      void apiRequest(`/api/admin/packages/${encodeURIComponent(pkg.id)}`, {
        method: 'PUT',
        requireToken: true,
        body: JSON.stringify(pkg),
      })
        .then(markSavedNow)
        .catch((err) => console.error('Update package failed:', err));
    },
    [apiRequest, isAdmin, markSavedNow],
  );

  const updateBrandSettings = useCallback(
    (brandPatch: Partial<BrandSettings>) => {
      if (!isAdmin) return;
      const merged = {...state.brand, ...brandPatch};
      setState((prev) => ({
        ...prev,
        brand: merged,
      }));
      void apiRequest('/api/admin/brand', {
        method: 'PUT',
        requireToken: true,
        body: JSON.stringify(merged),
      })
        .then(markSavedNow)
        .catch((err) => console.error('Update brand failed:', err));
    },
    [apiRequest, isAdmin, markSavedNow, state.brand],
  );

  const updateCorporateInquiryStatus = useCallback(
    (id: string, status: CorporateInquiry['status']) => {
      if (!isAdmin) return;
      setState((prev) => ({
        ...prev,
        corporateInquiries: prev.corporateInquiries.map((inq) =>
          inq.id === id ? {...inq, status} : inq,
        ),
      }));
      void apiRequest(`/api/admin/corporate-inquiries/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        requireToken: true,
        body: JSON.stringify({status}),
      })
        .then(markSavedNow)
        .catch((err) => console.error('Update inquiry failed:', err));
    },
    [apiRequest, isAdmin, markSavedNow],
  );

  const upsertProduct = useCallback(
    (product: KhulProduct) => {
      if (!isAdmin) return;
      setState((prev) => {
        const exists = prev.products.some((p) => p.id === product.id);
        return {
          ...prev,
          products: exists
            ? prev.products.map((p) => (p.id === product.id ? product : p))
            : [product, ...prev.products],
        };
      });
      void apiRequest(`/api/admin/products/${encodeURIComponent(product.id)}`, {
        method: 'PUT',
        requireToken: true,
        body: JSON.stringify(product),
      })
        .then(markSavedNow)
        .catch((err) => console.error('Save product failed:', err));
    },
    [apiRequest, isAdmin, markSavedNow],
  );

  const toggleProductStock = useCallback(
    (id: string) => {
      if (!isAdmin) return;
      const target = state.products.find((p) => p.id === id);
      if (!target) return;
      const next = {...target, inStock: !target.inStock};
      setState((prev) => ({
        ...prev,
        products: prev.products.map((p) => (p.id === id ? next : p)),
      }));
      void apiRequest(`/api/admin/products/${encodeURIComponent(id)}`, {
        method: 'PUT',
        requireToken: true,
        body: JSON.stringify(next),
      })
        .then(markSavedNow)
        .catch((err) => console.error('Toggle product stock failed:', err));
    },
    [apiRequest, isAdmin, markSavedNow, state.products],
  );

  const updateOrderStatus = useCallback(
    (id: string, status: StoreOrder['status']) => {
      if (!isAdmin) return;
      setState((prev) => ({
        ...prev,
        orders: prev.orders.map((o) => (o.id === id ? {...o, status} : o)),
      }));
      void apiRequest(`/api/admin/orders/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        requireToken: true,
        body: JSON.stringify({status}),
      })
        .then(markSavedNow)
        .catch((err) => console.error('Update order status failed:', err));
    },
    [apiRequest, isAdmin, markSavedNow],
  );

  const publishAnnouncement = useCallback(
    (payload: Omit<Announcement, 'id' | 'publishedAt'>) => {
      if (!isAdmin) return;
      const item: Announcement = {
        ...payload,
        id: `ann-${Date.now()}`,
        publishedAt: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
      };
      setState((prev) => ({
        ...prev,
        announcements: [item, ...prev.announcements],
      }));
      void apiRequest('/api/admin/announcements', {
        method: 'POST',
        requireToken: true,
        body: JSON.stringify(item),
      })
        .then(markSavedNow)
        .catch((err) => console.error('Publish announcement failed:', err));
    },
    [apiRequest, isAdmin, markSavedNow],
  );

  const deleteAnnouncement = useCallback(
    (id: string) => {
      if (!isAdmin) return;
      setState((prev) => ({
        ...prev,
        announcements: prev.announcements.filter((a) => a.id !== id),
      }));
      void apiRequest(`/api/admin/announcements/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        requireToken: true,
      })
        .then(markSavedNow)
        .catch((err) => console.error('Delete announcement failed:', err));
    },
    [apiRequest, isAdmin, markSavedNow],
  );

  const updateWeeklyGame = useCallback(
    (weeklyGame: WeeklyGameConfig) => {
      if (!isAdmin) return;
      setState((prev) => ({...prev, weeklyGame}));
      void apiRequest('/api/admin/weekly-game', {
        method: 'PUT',
        requireToken: true,
        body: JSON.stringify(weeklyGame),
      })
        .then(markSavedNow)
        .catch((err) => console.error('Update weekly game failed:', err));
    },
    [apiRequest, isAdmin, markSavedNow],
  );

  const upsertReflectionWord = useCallback(
    (word: ReflectionWord) => {
      if (!isAdmin) return;
      setState((prev) => {
        const exists = prev.reflectionWords.some((w) => w.id === word.id);
        return {
          ...prev,
          reflectionWords: exists
            ? prev.reflectionWords.map((w) => (w.id === word.id ? word : w))
            : [word, ...prev.reflectionWords],
        };
      });
      void apiRequest(`/api/admin/virtue-gifts/${encodeURIComponent(word.id)}`, {
        method: 'PUT',
        requireToken: true,
        body: JSON.stringify(word),
      })
        .then(markSavedNow)
        .catch((err) => console.error('Save virtue gift failed:', err));
    },
    [apiRequest, isAdmin, markSavedNow],
  );

  const deleteReflectionWord = useCallback(
    (id: string) => {
      if (!isAdmin) return;
      setState((prev) => ({
        ...prev,
        reflectionWords: prev.reflectionWords.filter((w) => w.id !== id),
      }));
      void apiRequest(`/api/admin/virtue-gifts/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        requireToken: true,
      })
        .then(markSavedNow)
        .catch((err) => console.error('Delete virtue gift failed:', err));
    },
    [apiRequest, isAdmin, markSavedNow],
  );

  const updateRegistrationStatus = useCallback(
    (id: string, attendanceStatus: SessionRegistration['attendanceStatus']) => {
      if (!isAdmin) return;
      setState((prev) => ({
        ...prev,
        registrations: prev.registrations.map((r) =>
          r.id === id ? {...r, attendanceStatus} : r,
        ),
      }));
      void apiRequest(`/api/admin/registrations/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        requireToken: true,
        body: JSON.stringify({attendanceStatus}),
      })
        .then(markSavedNow)
        .catch((err) => console.error('Update registration failed:', err));
    },
    [apiRequest, isAdmin, markSavedNow],
  );

  const awardMemberBadge = useCallback(
    (memberId: string, badge: string) => {
      if (!isAdmin) return;
      const cleanBadge = badge.trim();
      setState((prev) => ({
        ...prev,
        members: prev.members.map((m) =>
          m.id === memberId ? {...m, awardedBadge: cleanBadge || undefined} : m,
        ),
      }));
      void apiRequest(`/api/admin/leaderboard/${encodeURIComponent(memberId)}/badge`, {
        method: 'PUT',
        requireToken: true,
        body: JSON.stringify({badge: cleanBadge || null}),
      })
        .then(markSavedNow)
        .catch((err) => console.error('Award badge failed:', err));
    },
    [apiRequest, isAdmin, markSavedNow],
  );

  const grantAdminByUid = useCallback(
    async (uid: string, email: string) => {
      if (!isAdmin) return;
      const cleanUid = uid.trim();
      const cleanEmail = email.trim();
      if (!cleanUid || !cleanEmail) return;
      const res = (await apiRequest('/api/admin/admins', {
        method: 'POST',
        requireToken: true,
        body: JSON.stringify({uid: cleanUid, email: cleanEmail}),
      })) as {record: AdminRecordItem};
      setAdminRecords((prev) => [
        ...prev.filter((r) => r.uid !== res.record.uid),
        res.record,
      ]);
      markSavedNow();
    },
    [apiRequest, isAdmin, markSavedNow],
  );

  const revokeAdminByUid = useCallback(
    async (uid: string) => {
      if (!isAdmin) return;
      await apiRequest(`/api/admin/admins/${encodeURIComponent(uid)}`, {
        method: 'DELETE',
        requireToken: true,
      });
      setAdminRecords((prev) => prev.filter((r) => r.uid !== uid));
      markSavedNow();
    },
    [apiRequest, isAdmin, markSavedNow],
  );

  const resetDemoData = useCallback(() => {
    setState(INITIAL_SANCTUARY_STATE);
    if (isAdmin) {
      void syncCloudDefaults(true);
    }
  }, [isAdmin, syncCloudDefaults]);

  return {
    state,
    currentUser,
    authUser,
    authReady,
    isAdmin,
    adminCheckDone,
    cloudSynced,
    lastCloudSaveAt,
    adminRecords,
    signInWithGoogle,
    signOutUser,
    syncCloudDefaults,
    grantAdminByUid,
    revokeAdminByUid,
    updateMemberName,
    completeTodayPractice,
    drawVirtueGift,
    registerWednesdaySession,
    submitCorporateInquiry,
    addToBag,
    updateBagQuantity,
    checkoutBag,
    saveStillnessIntention,
    upsertSession,
    deleteSession,
    updatePackagePricing,
    updateBrandSettings,
    updateCorporateInquiryStatus,
    upsertProduct,
    toggleProductStock,
    updateOrderStatus,
    publishAnnouncement,
    deleteAnnouncement,
    updateWeeklyGame,
    upsertReflectionWord,
    deleteReflectionWord,
    updateRegistrationStatus,
    awardMemberBadge,
    resetDemoData,
  };
}
