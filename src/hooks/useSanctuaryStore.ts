import {useCallback, useEffect, useRef, useState} from 'react';
import {INITIAL_SANCTUARY_STATE} from '../data/initialData';
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
const BROADCAST_CHANNEL_NAME = 'khul_world_sync';

export function toLocalDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDaysToKey(dateKey: string, deltaDays: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  dt.setDate(dt.getDate() + deltaDays);
  return toLocalDateKey(dt);
}

export function diffDaysBetweenKeys(fromKey: string, toKey: string): number {
  const [y1, m1, d1] = fromKey.split('-').map(Number);
  const [y2, m2, d2] = toKey.split('-').map(Number);
  const dt1 = new Date(y1, (m1 || 1) - 1, d1 || 1);
  const dt2 = new Date(y2, (m2 || 1) - 1, d2 || 1);
  return Math.round((dt2.getTime() - dt1.getTime()) / (1000 * 60 * 60 * 24));
}

function getWeekdayIndexMon0(date = new Date()): number {
  return (date.getDay() + 6) % 7;
}

function buildDefaultStateWithDates(): SanctuaryState {
  const todayKey = toLocalDateKey();
  return {
    ...INITIAL_SANCTUARY_STATE,
    lastPracticeDate: addDaysToKey(todayKey, -1),
    streakStartDate: addDaysToKey(todayKey, -6),
  };
}

function loadInitialState(): SanctuaryState {
  const fallback = buildDefaultStateWithDates();
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<SanctuaryState>;
    const todayKey = toLocalDateKey();
    const normalizedSessions = Array.isArray(parsed.sessions)
      ? parsed.sessions.map((s) =>
          s.posterUrl === '/assets/aistudio/lebona_bf434e08.jpg'
            ? {...s, posterUrl: '/assets/aistudio/lebona_962b0ece.jpg'}
            : s,
        )
      : undefined;
    const lastPracticeDate =
      typeof parsed.lastPracticeDate === 'string' && parsed.lastPracticeDate
        ? parsed.lastPracticeDate
        : parsed.checkedInToday
          ? todayKey
          : fallback.lastPracticeDate;
    const checkedInToday = lastPracticeDate === todayKey;
    return {
      ...fallback,
      ...parsed,
      ...(normalizedSessions ? {sessions: normalizedSessions} : {}),
      lastPracticeDate,
      checkedInToday,
      brand: {...INITIAL_SANCTUARY_STATE.brand, ...(parsed.brand ?? {})},
      weeklyGame: {...INITIAL_SANCTUARY_STATE.weeklyGame, ...(parsed.weeklyGame ?? {})},
    };
  } catch {
    return fallback;
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

interface OperationsResponse {
  registrations: SessionRegistration[];
  orders: StoreOrder[];
  corporateInquiries: CorporateInquiry[];
}

export function useSanctuaryStore() {
  const [state, setState] = useState<SanctuaryState>(loadInitialState);
  const [cloudSynced, setCloudSynced] = useState(false);
  const [lastCloudSaveAt, setLastCloudSaveAt] = useState<string | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);

  const persistAndBroadcast = useCallback((nextState: SanctuaryState) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    } catch {
      // Ignore storage quota errors
    }
    try {
      channelRef.current?.postMessage({type: 'local-sync', state: nextState});
    } catch {
      // Ignore BroadcastChannel errors
    }
  }, []);

  const updateLocalState = useCallback(
    (updater: (prev: SanctuaryState) => SanctuaryState, shouldBroadcast = true) => {
      setState((prev) => {
        const next = updater(prev);
        if (shouldBroadcast) {
          persistAndBroadcast(next);
        } else {
          try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          } catch {
            // Ignore quota errors
          }
        }
        return next;
      });
    },
    [persistAndBroadcast],
  );

  // Sync across open browser tabs/windows immediately (Admin tab -> User tab)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ('BroadcastChannel' in window) {
      const ch = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channelRef.current = ch;
      ch.onmessage = (event) => {
        const msg = event.data as {type?: string; state?: SanctuaryState};
        if (msg?.type === 'local-sync' && msg.state) {
          setState(msg.state);
        }
      };
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) as SanctuaryState;
          setState(parsed);
        } catch {
          // ignore malformed JSON
        }
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('storage', onStorage);
      channelRef.current?.close();
      channelRef.current = null;
    };
  }, []);

  const apiRequest = useCallback(async (url: string, options?: RequestInit) => {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers as Record<string, string> | undefined),
      },
    });
    const contentType = res.headers.get('content-type') ?? '';
    if (!res.ok) {
      throw new Error(`Request failed (${res.status})`);
    }
    if (!contentType.includes('application/json')) {
      throw new Error('Non-JSON response');
    }
    return res.json();
  }, []);

  const fetchPublicState = useCallback(async () => {
    try {
      const [publicData, opsData] = await Promise.all([
        apiRequest('/api/public/state', {method: 'GET'}) as Promise<PublicStateResponse>,
        apiRequest('/api/admin/operations', {method: 'GET'}).catch(() => null) as Promise<OperationsResponse | null>,
      ]);

      updateLocalState((prev) => {
        const currentUserId = prev.currentUserId;
        const incomingById = new Map(publicData.members.map((m) => [m.id, m]));
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
          brand: publicData.brand ?? prev.brand,
          weeklyGame: publicData.weeklyGame ?? prev.weeklyGame,
          sessions: publicData.sessions.length > 0 ? publicData.sessions : prev.sessions,
          packages: publicData.packages.length > 0 ? publicData.packages : prev.packages,
          products: publicData.products.length > 0 ? publicData.products : prev.products,
          announcements:
            publicData.announcements.length > 0 ? publicData.announcements : prev.announcements,
          reflectionWords:
            publicData.reflectionWords.length > 0
              ? publicData.reflectionWords
              : prev.reflectionWords,
          members: mergedMembers.length > 0 ? mergedMembers : prev.members,
          ...(opsData
            ? {
                registrations:
                  opsData.registrations.length > 0 ? opsData.registrations : prev.registrations,
                orders: opsData.orders.length > 0 ? opsData.orders : prev.orders,
                corporateInquiries:
                  opsData.corporateInquiries.length > 0
                    ? opsData.corporateInquiries
                    : prev.corporateInquiries,
              }
            : {}),
        };
      }, false);
      setCloudSynced(true);
    } catch {
      // Gracefully operate with localStorage + BroadcastChannel when backend is unavailable
    }
  }, [apiRequest, updateLocalState]);

  // Load backend catalog & subscribe to live Admin -> User updates via SSE
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
          }
        } catch {
          // ignore malformed SSE pings
        }
      };
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void fetchPublicState();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      es?.close();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [fetchPublicState]);

  const currentUser =
    state.members.find((m) => m.id === state.currentUserId) ?? state.members[0];

  const todayKey = toLocalDateKey();
  const missedDays = state.lastPracticeDate
    ? Math.max(0, diffDaysBetweenKeys(state.lastPracticeDate, todayKey) - 1)
    : 0;

  const markSavedNow = useCallback(() => {
    setCloudSynced(true);
    setLastCloudSaveAt(new Date().toLocaleTimeString());
  }, []);

  const updateMemberName = useCallback(
    (name: string, email?: string) => {
      const cleanName = name.trim();
      if (!cleanName) return;
      updateLocalState((prev) => ({
        ...prev,
        members: prev.members.map((m) =>
          m.id === prev.currentUserId
            ? {...m, name: cleanName, email: email?.trim() || m.email}
            : m,
        ),
      }));
    },
    [updateLocalState],
  );

  const completeTodayPractice = useCallback((): ReflectionWord => {
    const pool = state.reflectionWords;
    const word =
      pool[Math.floor(Math.random() * pool.length)] ??
      INITIAL_SANCTUARY_STATE.reflectionWords[0];

    updateLocalState((prev) => {
      const activeTodayKey = toLocalDateKey();
      if (prev.checkedInToday && prev.lastPracticeDate === activeTodayKey) {
        return prev;
      }

      const todayLabel = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      const daysSinceLast = prev.lastPracticeDate
        ? diffDaysBetweenKeys(prev.lastPracticeDate, activeTodayKey)
        : 1;
      const didMissDay = daysSinceLast > 1;
      const todayWeekdayIdx = getWeekdayIndexMon0();

      const updatedMembers = prev.members.map((m) => {
        if (m.id !== prev.currentUserId) return m;
        const nextWeek = didMissDay
          ? Array.from({length: 7}, (_, idx) => idx === todayWeekdayIdx)
          : m.weekDaysCompleted.map((val, idx) => (idx === todayWeekdayIdx ? true : val));
        return {
          ...m,
          currentStreak: didMissDay ? 1 : m.currentStreak + 1,
          totalDaysPracticed: m.totalDaysPracticed + 1,
          weekDaysCompleted: nextWeek,
        };
      });

      return {
        ...prev,
        checkedInToday: true,
        lastPracticeDate: activeTodayKey,
        streakStartDate: didMissDay
          ? activeTodayKey
          : prev.streakStartDate ?? activeTodayKey,
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

    return word;
  }, [state.reflectionWords, updateLocalState]);

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

      updateLocalState((prev) => {
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
    [state.reflectionWords, updateLocalState],
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

      updateLocalState((prev) => ({
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
      }).catch(() => {});

      return registration;
    },
    [apiRequest, state.packages, state.sessions, updateLocalState],
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
      updateLocalState((prev) => ({
        ...prev,
        corporateInquiries: [inquiry, ...prev.corporateInquiries],
      }));

      void apiRequest('/api/corporate-inquiries', {
        method: 'POST',
        body: JSON.stringify(inquiry),
      }).catch(() => {});

      return inquiry;
    },
    [apiRequest, updateLocalState],
  );

  const addToBag = useCallback(
    (productId: string) => {
      updateLocalState((prev) => {
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
    },
    [updateLocalState],
  );

  const updateBagQuantity = useCallback(
    (productId: string, delta: number) => {
      updateLocalState((prev) => ({
        ...prev,
        bag: prev.bag
          .map((b) =>
            b.productId === productId ? {...b, quantity: b.quantity + delta} : b,
          )
          .filter((b) => b.quantity > 0),
      }));
    },
    [updateLocalState],
  );

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

      updateLocalState((prev) => ({
        ...prev,
        orders: [order, ...prev.orders],
        bag: [],
      }));

      void apiRequest('/api/orders', {
        method: 'POST',
        body: JSON.stringify(order),
      }).catch(() => {});

      return order;
    },
    [apiRequest, state.bag, state.products, updateLocalState],
  );

  const saveStillnessIntention = useCallback(
    (intention: string) => {
      updateLocalState((prev) => ({...prev, stillnessIntention: intention}));
    },
    [updateLocalState],
  );

  // --- ADMIN PORTAL ACTIONS (Instant Live Sync to User Pages + Cloud SQL Persistence) ---
  const upsertSession = useCallback(
    (session: WednesdaySession) => {
      updateLocalState((prev) => {
        const exists = prev.sessions.some((s) => s.id === session.id);
        return {
          ...prev,
          sessions: exists
            ? prev.sessions.map((s) => (s.id === session.id ? session : s))
            : [...prev.sessions, session],
        };
      });
      markSavedNow();
      void apiRequest(`/api/admin/sessions/${encodeURIComponent(session.id)}`, {
        method: 'PUT',
        body: JSON.stringify(session),
      }).catch(() => {});
    },
    [apiRequest, markSavedNow, updateLocalState],
  );

  const deleteSession = useCallback(
    (id: string) => {
      updateLocalState((prev) => ({
        ...prev,
        sessions: prev.sessions.filter((s) => s.id !== id),
      }));
      markSavedNow();
      void apiRequest(`/api/admin/sessions/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }).catch(() => {});
    },
    [apiRequest, markSavedNow, updateLocalState],
  );

  const updatePackagePricing = useCallback(
    (pkg: WednesdayPackage) => {
      updateLocalState((prev) => ({
        ...prev,
        packages: prev.packages.map((p) => (p.id === pkg.id ? pkg : p)),
      }));
      markSavedNow();
      void apiRequest(`/api/admin/packages/${encodeURIComponent(pkg.id)}`, {
        method: 'PUT',
        body: JSON.stringify(pkg),
      }).catch(() => {});
    },
    [apiRequest, markSavedNow, updateLocalState],
  );

  const updateBrandSettings = useCallback(
    (brandPatch: Partial<BrandSettings>) => {
      const merged = {...state.brand, ...brandPatch};
      updateLocalState((prev) => ({
        ...prev,
        brand: merged,
      }));
      markSavedNow();
      void apiRequest('/api/admin/brand', {
        method: 'PUT',
        body: JSON.stringify(merged),
      }).catch(() => {});
    },
    [apiRequest, markSavedNow, state.brand, updateLocalState],
  );

  const updateCorporateInquiryStatus = useCallback(
    (id: string, status: CorporateInquiry['status']) => {
      updateLocalState((prev) => ({
        ...prev,
        corporateInquiries: prev.corporateInquiries.map((inq) =>
          inq.id === id ? {...inq, status} : inq,
        ),
      }));
      markSavedNow();
      void apiRequest(`/api/admin/corporate-inquiries/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({status}),
      }).catch(() => {});
    },
    [apiRequest, markSavedNow, updateLocalState],
  );

  const upsertProduct = useCallback(
    (product: KhulProduct) => {
      updateLocalState((prev) => {
        const exists = prev.products.some((p) => p.id === product.id);
        return {
          ...prev,
          products: exists
            ? prev.products.map((p) => (p.id === product.id ? product : p))
            : [product, ...prev.products],
        };
      });
      markSavedNow();
      void apiRequest(`/api/admin/products/${encodeURIComponent(product.id)}`, {
        method: 'PUT',
        body: JSON.stringify(product),
      }).catch(() => {});
    },
    [apiRequest, markSavedNow, updateLocalState],
  );

  const toggleProductStock = useCallback(
    (id: string) => {
      const target = state.products.find((p) => p.id === id);
      if (!target) return;
      const next = {...target, inStock: !target.inStock};
      updateLocalState((prev) => ({
        ...prev,
        products: prev.products.map((p) => (p.id === id ? next : p)),
      }));
      markSavedNow();
      void apiRequest(`/api/admin/products/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(next),
      }).catch(() => {});
    },
    [apiRequest, markSavedNow, state.products, updateLocalState],
  );

  const updateOrderStatus = useCallback(
    (id: string, status: StoreOrder['status']) => {
      updateLocalState((prev) => ({
        ...prev,
        orders: prev.orders.map((o) => (o.id === id ? {...o, status} : o)),
      }));
      markSavedNow();
      void apiRequest(`/api/admin/orders/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({status}),
      }).catch(() => {});
    },
    [apiRequest, markSavedNow, updateLocalState],
  );

  const publishAnnouncement = useCallback(
    (payload: Omit<Announcement, 'id' | 'publishedAt'>) => {
      const item: Announcement = {
        ...payload,
        id: `ann-${Date.now()}`,
        publishedAt: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
      };
      updateLocalState((prev) => ({
        ...prev,
        announcements: [item, ...prev.announcements],
      }));
      markSavedNow();
      void apiRequest('/api/admin/announcements', {
        method: 'POST',
        body: JSON.stringify(item),
      }).catch(() => {});
    },
    [apiRequest, markSavedNow, updateLocalState],
  );

  const deleteAnnouncement = useCallback(
    (id: string) => {
      updateLocalState((prev) => ({
        ...prev,
        announcements: prev.announcements.filter((a) => a.id !== id),
      }));
      markSavedNow();
      void apiRequest(`/api/admin/announcements/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }).catch(() => {});
    },
    [apiRequest, markSavedNow, updateLocalState],
  );

  const updateWeeklyGame = useCallback(
    (weeklyGame: WeeklyGameConfig) => {
      updateLocalState((prev) => ({...prev, weeklyGame}));
      markSavedNow();
      void apiRequest('/api/admin/weekly-game', {
        method: 'PUT',
        body: JSON.stringify(weeklyGame),
      }).catch(() => {});
    },
    [apiRequest, markSavedNow, updateLocalState],
  );

  const upsertReflectionWord = useCallback(
    (word: ReflectionWord) => {
      updateLocalState((prev) => {
        const exists = prev.reflectionWords.some((w) => w.id === word.id);
        return {
          ...prev,
          reflectionWords: exists
            ? prev.reflectionWords.map((w) => (w.id === word.id ? word : w))
            : [word, ...prev.reflectionWords],
        };
      });
      markSavedNow();
      void apiRequest(`/api/admin/virtue-gifts/${encodeURIComponent(word.id)}`, {
        method: 'PUT',
        body: JSON.stringify(word),
      }).catch(() => {});
    },
    [apiRequest, markSavedNow, updateLocalState],
  );

  const deleteReflectionWord = useCallback(
    (id: string) => {
      updateLocalState((prev) => ({
        ...prev,
        reflectionWords: prev.reflectionWords.filter((w) => w.id !== id),
      }));
      markSavedNow();
      void apiRequest(`/api/admin/virtue-gifts/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }).catch(() => {});
    },
    [apiRequest, markSavedNow, updateLocalState],
  );

  const updateRegistrationStatus = useCallback(
    (id: string, attendanceStatus: SessionRegistration['attendanceStatus']) => {
      updateLocalState((prev) => ({
        ...prev,
        registrations: prev.registrations.map((r) =>
          r.id === id ? {...r, attendanceStatus} : r,
        ),
      }));
      markSavedNow();
      void apiRequest(`/api/admin/registrations/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({attendanceStatus}),
      }).catch(() => {});
    },
    [apiRequest, markSavedNow, updateLocalState],
  );

  const checkInByPassCode = useCallback(
    async (
      rawCode: string,
    ): Promise<{
      status: 'checked-in' | 'already-checked-in' | 'not-found';
      scannedCode: string;
      registration?: SessionRegistration;
    }> => {
      let cleanCode = rawCode.trim();
      if (cleanCode.startsWith('{')) {
        try {
          const parsed = JSON.parse(cleanCode) as {passCode?: string};
          if (parsed.passCode) cleanCode = parsed.passCode.trim();
        } catch {
          // keep raw string
        }
      }
      if (cleanCode.toUpperCase().startsWith('KHUL:PASS:')) {
        cleanCode = cleanCode.slice(10).trim();
      }
      if (!cleanCode) {
        return {status: 'not-found', scannedCode: ''};
      }

      const normalized = cleanCode.toUpperCase();
      const localMatch = state.registrations.find(
        (r) =>
          r.passCode.toUpperCase() === normalized || r.id.toUpperCase() === normalized,
      );

      if (localMatch) {
        const alreadyCheckedIn = localMatch.attendanceStatus === 'Checked In';
        const updatedReg: SessionRegistration = {
          ...localMatch,
          attendanceStatus: 'Checked In',
        };
        if (!alreadyCheckedIn) {
          updateLocalState((prev) => ({
            ...prev,
            registrations: prev.registrations.map((r) =>
              r.id === localMatch.id ? updatedReg : r,
            ),
          }));
          markSavedNow();
          void apiRequest(`/api/admin/registrations/${encodeURIComponent(localMatch.id)}`, {
            method: 'PATCH',
            body: JSON.stringify({attendanceStatus: 'Checked In'}),
          }).catch(() => {});
        }
        return {
          status: alreadyCheckedIn ? 'already-checked-in' : 'checked-in',
          scannedCode: localMatch.passCode,
          registration: updatedReg,
        };
      }

      // Check backend database in case attendee registered from another device
      try {
        const resp = (await apiRequest('/api/admin/registrations/check-in', {
          method: 'POST',
          body: JSON.stringify({passCode: cleanCode}),
        })) as {
          ok: boolean;
          alreadyCheckedIn?: boolean;
          registration?: SessionRegistration;
        };
        if (resp.ok && resp.registration) {
          const reg = resp.registration;
          updateLocalState((prev) => {
            const exists = prev.registrations.some((r) => r.id === reg.id);
            return {
              ...prev,
              registrations: exists
                ? prev.registrations.map((r) => (r.id === reg.id ? reg : r))
                : [reg, ...prev.registrations],
            };
          });
          markSavedNow();
          return {
            status: resp.alreadyCheckedIn ? 'already-checked-in' : 'checked-in',
            scannedCode: reg.passCode,
            registration: reg,
          };
        }
      } catch {
        // Not found in DB or offline
      }

      return {status: 'not-found', scannedCode: cleanCode};
    },
    [apiRequest, markSavedNow, state.registrations, updateLocalState],
  );

  const awardMemberBadge = useCallback(
    (memberId: string, badge: string) => {
      const cleanBadge = badge.trim();
      updateLocalState((prev) => ({
        ...prev,
        members: prev.members.map((m) =>
          m.id === memberId ? {...m, awardedBadge: cleanBadge || undefined} : m,
        ),
      }));
      markSavedNow();
      void apiRequest(`/api/admin/leaderboard/${encodeURIComponent(memberId)}/badge`, {
        method: 'PUT',
        body: JSON.stringify({badge: cleanBadge || null}),
      }).catch(() => {});
    },
    [apiRequest, markSavedNow, updateLocalState],
  );

  const resetDemoData = useCallback(() => {
    updateLocalState(() => buildDefaultStateWithDates());
    markSavedNow();
    void apiRequest('/api/admin/reset-defaults', {method: 'POST'})
      .then(() => fetchPublicState())
      .catch(() => {});
  }, [apiRequest, fetchPublicState, markSavedNow, updateLocalState]);

  return {
    state,
    currentUser,
    missedDays,
    cloudSynced,
    lastCloudSaveAt,
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
    checkInByPassCode,
    awardMemberBadge,
    resetDemoData,
  };
}
