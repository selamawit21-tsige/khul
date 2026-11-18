import {asc, desc, eq, ilike} from 'drizzle-orm';
import {INITIAL_SANCTUARY_STATE} from '../data/initialData.ts';
import type {
  Announcement,
  BrandSettings,
  CommunityMember,
  CorporateInquiry,
  KhulProduct,
  PackageTier,
  ProductCategory,
  ReflectionWord,
  SessionRegistration,
  StoreOrder,
  VirtueCardTheme,
  WednesdayPackage,
  WednesdaySession,
  WeeklyGameConfig,
} from '../types/khul.ts';
import {db} from './index.ts';
import {
  announcements,
  appConfig,
  corporateInquiries,
  khulProducts,
  leaderboardMembers,
  sessionRegistrations,
  storeOrders,
  users,
  virtueGifts,
  wednesdayPackages,
  wednesdaySessions,
} from './schema.ts';

let seedPromise: Promise<void> | null = null;

export async function ensureSeeded(forceOverwrite = false): Promise<void> {
  if (!forceOverwrite && seedPromise) {
    return seedPromise;
  }

  const run = async () => {
    try {
      if (!forceOverwrite) {
        const existingBrand = await db
          .select({key: appConfig.key})
          .from(appConfig)
          .where(eq(appConfig.key, 'brand'))
          .limit(1);
        if (existingBrand.length > 0) return;
      }

      await db
        .insert(appConfig)
        .values({
          key: 'brand',
          value: INITIAL_SANCTUARY_STATE.brand as unknown as Record<string, unknown>,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: appConfig.key,
          set: {
            value: INITIAL_SANCTUARY_STATE.brand as unknown as Record<string, unknown>,
            updatedAt: new Date(),
          },
        });

      await db
        .insert(appConfig)
        .values({
          key: 'weeklyGame',
          value: INITIAL_SANCTUARY_STATE.weeklyGame as unknown as Record<string, unknown>,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: appConfig.key,
          set: {
            value: INITIAL_SANCTUARY_STATE.weeklyGame as unknown as Record<string, unknown>,
            updatedAt: new Date(),
          },
        });

      for (const s of INITIAL_SANCTUARY_STATE.sessions) {
        await db
          .insert(wednesdaySessions)
          .values({
            id: s.id,
            weekLabel: s.weekLabel ?? null,
            title: s.title,
            theme: s.theme,
            description: s.description,
            date: s.date,
            time: s.time,
            facilitator: s.facilitator,
            venue: s.venue,
            mapLink: s.mapLink,
            capacity: s.capacity,
            registeredCount: s.registeredCount,
            priceEtb: s.priceEtb,
            published: s.published,
            posterUrl: s.posterUrl ?? null,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: wednesdaySessions.id,
            set: {
              weekLabel: s.weekLabel ?? null,
              title: s.title,
              theme: s.theme,
              description: s.description,
              date: s.date,
              time: s.time,
              facilitator: s.facilitator,
              venue: s.venue,
              mapLink: s.mapLink,
              capacity: s.capacity,
              registeredCount: s.registeredCount,
              priceEtb: s.priceEtb,
              published: s.published,
              posterUrl: s.posterUrl ?? null,
              updatedAt: new Date(),
            },
          });
      }

      for (const p of INITIAL_SANCTUARY_STATE.packages) {
        await db
          .insert(wednesdayPackages)
          .values({
            id: p.id,
            tier: p.tier,
            name: p.name,
            priceEtb: p.priceEtb,
            cadenceLabel: p.cadenceLabel,
            audienceLabel: p.audienceLabel,
            benefits: p.benefits,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: wednesdayPackages.id,
            set: {
              tier: p.tier,
              name: p.name,
              priceEtb: p.priceEtb,
              cadenceLabel: p.cadenceLabel,
              audienceLabel: p.audienceLabel,
              benefits: p.benefits,
              updatedAt: new Date(),
            },
          });
      }

      for (const prod of INITIAL_SANCTUARY_STATE.products) {
        await db
          .insert(khulProducts)
          .values({
            id: prod.id,
            name: prod.name,
            category: prod.category,
            priceEtb: prod.priceEtb,
            description: prod.description,
            inStock: prod.inStock,
            visualKey: prod.visualKey,
            customImageUrl: prod.customImageUrl ?? null,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: khulProducts.id,
            set: {
              name: prod.name,
              category: prod.category,
              priceEtb: prod.priceEtb,
              description: prod.description,
              inStock: prod.inStock,
              visualKey: prod.visualKey,
              customImageUrl: prod.customImageUrl ?? null,
              updatedAt: new Date(),
            },
          });
      }

      for (const a of INITIAL_SANCTUARY_STATE.announcements) {
        await db
          .insert(announcements)
          .values({
            id: a.id,
            title: a.title,
            category: a.category,
            body: a.body,
            publishedAt: a.publishedAt,
            author: a.author,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: announcements.id,
            set: {
              title: a.title,
              category: a.category,
              body: a.body,
              publishedAt: a.publishedAt,
              author: a.author,
              updatedAt: new Date(),
            },
          });
      }

      for (const rw of INITIAL_SANCTUARY_STATE.reflectionWords) {
        await db
          .insert(virtueGifts)
          .values({
            id: rw.id,
            word: rw.word,
            amharicWord: rw.amharicWord,
            reflection: rw.reflection,
            amharicReflection: rw.amharicReflection,
            practiceHint: rw.practiceHint,
            cardTheme: rw.cardTheme,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: virtueGifts.id,
            set: {
              word: rw.word,
              amharicWord: rw.amharicWord,
              reflection: rw.reflection,
              amharicReflection: rw.amharicReflection,
              practiceHint: rw.practiceHint,
              cardTheme: rw.cardTheme,
              updatedAt: new Date(),
            },
          });
      }

      for (const mem of INITIAL_SANCTUARY_STATE.members) {
        await db
          .insert(leaderboardMembers)
          .values({
            id: mem.id,
            name: mem.name,
            email: mem.email,
            activePackage: mem.activePackage,
            currentStreak: mem.currentStreak,
            totalDaysPracticed: mem.totalDaysPracticed,
            weekDaysCompleted: mem.weekDaysCompleted,
            awardedBadge: mem.awardedBadge ?? null,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: leaderboardMembers.id,
            set: {
              name: mem.name,
              activePackage: mem.activePackage,
              currentStreak: mem.currentStreak,
              totalDaysPracticed: mem.totalDaysPracticed,
              weekDaysCompleted: mem.weekDaysCompleted,
              awardedBadge: mem.awardedBadge ?? null,
              updatedAt: new Date(),
            },
          });
      }

      if (forceOverwrite) {
        for (const reg of INITIAL_SANCTUARY_STATE.registrations) {
          await db
            .insert(sessionRegistrations)
            .values({
              id: reg.id,
              ownerUid: null,
              memberName: reg.memberName,
              memberEmail: reg.memberEmail,
              memberPhone: reg.memberPhone,
              sessionId: reg.sessionId,
              sessionTitle: reg.sessionTitle,
              sessionDate: reg.sessionDate,
              packageTier: reg.packageTier,
              amountEtb: reg.amountEtb,
              passCode: reg.passCode,
              attendanceStatus: reg.attendanceStatus,
              createdAt: reg.createdAt,
              updatedAt: new Date(),
            })
            .onConflictDoNothing();
        }
        for (const ord of INITIAL_SANCTUARY_STATE.orders) {
          await db
            .insert(storeOrders)
            .values({
              id: ord.id,
              ownerUid: null,
              customerName: ord.customerName,
              customerPhone: ord.customerPhone,
              fulfillmentMethod: ord.fulfillmentMethod,
              deliveryAddress: ord.deliveryAddress ?? null,
              items: ord.items,
              totalEtb: ord.totalEtb,
              status: ord.status,
              createdAt: ord.createdAt,
              updatedAt: new Date(),
            })
            .onConflictDoNothing();
        }
        for (const inq of INITIAL_SANCTUARY_STATE.corporateInquiries) {
          await db
            .insert(corporateInquiries)
            .values({
              id: inq.id,
              ownerUid: null,
              organizationName: inq.organizationName,
              contactName: inq.contactName,
              contactEmail: inq.contactEmail,
              teamSize: inq.teamSize,
              programInterest: inq.programInterest,
              goals: inq.goals,
              status: inq.status,
              submittedAt: inq.submittedAt,
              updatedAt: new Date(),
            })
            .onConflictDoNothing();
        }
      }
    } catch (error) {
      seedPromise = null;
      console.error('Database seed failed:', error);
      throw new Error('Failed to initialize Khul World database defaults.', {cause: error});
    }
  };

  seedPromise = run();
  return seedPromise;
}

export async function getPublicCatalogState() {
  try {
    await ensureSeeded(false);

    const [
      configRows,
      sessionRows,
      packageRows,
      productRows,
      announcementRows,
      virtueRows,
      memberRows,
    ] = await Promise.all([
      db.select().from(appConfig),
      db.select().from(wednesdaySessions).orderBy(asc(wednesdaySessions.id)),
      db.select().from(wednesdayPackages),
      db.select().from(khulProducts).orderBy(asc(khulProducts.id)),
      db.select().from(announcements).orderBy(desc(announcements.id)),
      db.select().from(virtueGifts).orderBy(asc(virtueGifts.id)),
      db.select().from(leaderboardMembers),
    ]);

    const brandRow = configRows.find((r) => r.key === 'brand');
    const gameRow = configRows.find((r) => r.key === 'weeklyGame');

    const tierOrder: Record<PackageTier, number> = {Single: 1, Weekly: 2, Monthly: 3};
    const sortedPackages: WednesdayPackage[] = packageRows
      .map((p) => ({
        id: p.id,
        tier: p.tier as PackageTier,
        name: p.name,
        priceEtb: p.priceEtb,
        cadenceLabel: p.cadenceLabel,
        audienceLabel: p.audienceLabel,
        benefits: p.benefits,
      }))
      .sort((a, b) => (tierOrder[a.tier] ?? 9) - (tierOrder[b.tier] ?? 9));

    const mappedSessions: WednesdaySession[] = sessionRows.map((s) => ({
      id: s.id,
      weekLabel: s.weekLabel ?? undefined,
      title: s.title,
      theme: s.theme,
      description: s.description,
      date: s.date,
      time: s.time,
      facilitator: s.facilitator,
      venue: s.venue,
      mapLink: s.mapLink,
      capacity: s.capacity,
      registeredCount: s.registeredCount,
      priceEtb: s.priceEtb,
      published: s.published,
      posterUrl: s.posterUrl ?? undefined,
    }));

    const mappedProducts: KhulProduct[] = productRows.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category as ProductCategory,
      priceEtb: p.priceEtb,
      description: p.description,
      inStock: p.inStock,
      visualKey: p.visualKey as KhulProduct['visualKey'],
      customImageUrl: p.customImageUrl ?? undefined,
    }));

    const mappedAnnouncements: Announcement[] = announcementRows.map((a) => ({
      id: a.id,
      title: a.title,
      category: a.category as Announcement['category'],
      body: a.body,
      publishedAt: a.publishedAt,
      author: a.author,
    }));

    const mappedVirtues: ReflectionWord[] = virtueRows.map((v) => ({
      id: v.id,
      word: v.word,
      amharicWord: v.amharicWord,
      reflection: v.reflection,
      amharicReflection: v.amharicReflection,
      practiceHint: v.practiceHint,
      cardTheme: (v.cardTheme as VirtueCardTheme) || 'yellow',
    }));

    const mappedMembers: CommunityMember[] = memberRows.map((m) => ({
      id: m.id,
      name: m.name,
      email: '',
      activePackage: (m.activePackage as PackageTier) || 'Single',
      currentStreak: m.currentStreak,
      totalDaysPracticed: m.totalDaysPracticed,
      weekDaysCompleted: m.weekDaysCompleted,
      awardedBadge: m.awardedBadge ?? undefined,
    }));

    return {
      brand: (brandRow?.value as unknown as BrandSettings) ?? INITIAL_SANCTUARY_STATE.brand,
      weeklyGame:
        (gameRow?.value as unknown as WeeklyGameConfig) ?? INITIAL_SANCTUARY_STATE.weeklyGame,
      sessions: mappedSessions,
      packages: sortedPackages,
      products: mappedProducts,
      announcements: mappedAnnouncements,
      reflectionWords: mappedVirtues,
      members: mappedMembers,
    };
  } catch (error) {
    console.error('Database error in getPublicCatalogState:', error);
    throw new Error('Failed to load Khul World catalog.', {cause: error});
  }
}

export async function getOperationalData(params: {uid: string; isAdmin: boolean}) {
  try {
    const [regRows, orderRows, inqRows] = await Promise.all([
      params.isAdmin
        ? db.select().from(sessionRegistrations).orderBy(desc(sessionRegistrations.updatedAt))
        : db
            .select()
            .from(sessionRegistrations)
            .where(eq(sessionRegistrations.ownerUid, params.uid))
            .orderBy(desc(sessionRegistrations.updatedAt)),
      params.isAdmin
        ? db.select().from(storeOrders).orderBy(desc(storeOrders.updatedAt))
        : db
            .select()
            .from(storeOrders)
            .where(eq(storeOrders.ownerUid, params.uid))
            .orderBy(desc(storeOrders.updatedAt)),
      params.isAdmin
        ? db.select().from(corporateInquiries).orderBy(desc(corporateInquiries.updatedAt))
        : db
            .select()
            .from(corporateInquiries)
            .where(eq(corporateInquiries.ownerUid, params.uid))
            .orderBy(desc(corporateInquiries.updatedAt)),
    ]);

    return {
      registrations: regRows.map(
        (r): SessionRegistration => ({
          id: r.id,
          memberName: r.memberName,
          memberEmail: r.memberEmail,
          memberPhone: r.memberPhone,
          sessionId: r.sessionId,
          sessionTitle: r.sessionTitle,
          sessionDate: r.sessionDate,
          packageTier: r.packageTier as PackageTier,
          amountEtb: r.amountEtb,
          passCode: r.passCode,
          attendanceStatus: r.attendanceStatus as SessionRegistration['attendanceStatus'],
          createdAt: r.createdAt,
        }),
      ),
      orders: orderRows.map(
        (o): StoreOrder => ({
          id: o.id,
          customerName: o.customerName,
          customerPhone: o.customerPhone,
          fulfillmentMethod: o.fulfillmentMethod as StoreOrder['fulfillmentMethod'],
          deliveryAddress: o.deliveryAddress ?? undefined,
          items: o.items,
          totalEtb: o.totalEtb,
          status: o.status as StoreOrder['status'],
          createdAt: o.createdAt,
        }),
      ),
      corporateInquiries: inqRows.map(
        (c): CorporateInquiry => ({
          id: c.id,
          organizationName: c.organizationName,
          contactName: c.contactName,
          contactEmail: c.contactEmail,
          teamSize: c.teamSize,
          programInterest: c.programInterest,
          goals: c.goals,
          status: c.status as CorporateInquiry['status'],
          submittedAt: c.submittedAt,
        }),
      ),
    };
  } catch (error) {
    console.error('Database error in getOperationalData:', error);
    throw new Error('Failed to load member operations data.', {cause: error});
  }
}

export async function createRegistrationInDb(
  reg: SessionRegistration,
  ownerUid: string | null,
) {
  try {
    await db
      .insert(sessionRegistrations)
      .values({
        id: reg.id,
        ownerUid,
        memberName: reg.memberName,
        memberEmail: reg.memberEmail,
        memberPhone: reg.memberPhone,
        sessionId: reg.sessionId,
        sessionTitle: reg.sessionTitle,
        sessionDate: reg.sessionDate,
        packageTier: reg.packageTier,
        amountEtb: reg.amountEtb,
        passCode: reg.passCode,
        attendanceStatus: reg.attendanceStatus,
        createdAt: reg.createdAt,
        updatedAt: new Date(),
      })
      .onConflictDoNothing();

    const sessRows = await db
      .select()
      .from(wednesdaySessions)
      .where(eq(wednesdaySessions.id, reg.sessionId))
      .limit(1);

    if (sessRows.length > 0) {
      const s = sessRows[0];
      await db
        .update(wednesdaySessions)
        .set({
          registeredCount: Math.min(s.capacity, s.registeredCount + 1),
          updatedAt: new Date(),
        })
        .where(eq(wednesdaySessions.id, s.id));
    }

    if (ownerUid) {
      await db
        .update(users)
        .set({activePackage: reg.packageTier, updatedAt: new Date()})
        .where(eq(users.uid, ownerUid));
    }
  } catch (error) {
    console.error('Database error in createRegistrationInDb:', error);
    throw new Error('Failed to save session registration.', {cause: error});
  }
}

export async function createOrderInDb(order: StoreOrder, ownerUid: string | null) {
  try {
    await db.insert(storeOrders).values({
      id: order.id,
      ownerUid,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      fulfillmentMethod: order.fulfillmentMethod,
      deliveryAddress: order.deliveryAddress ?? null,
      items: order.items,
      totalEtb: order.totalEtb,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Database error in createOrderInDb:', error);
    throw new Error('Failed to create Khul Life order.', {cause: error});
  }
}

export async function createInquiryInDb(inq: CorporateInquiry, ownerUid: string | null) {
  try {
    await db.insert(corporateInquiries).values({
      id: inq.id,
      ownerUid,
      organizationName: inq.organizationName,
      contactName: inq.contactName,
      contactEmail: inq.contactEmail,
      teamSize: inq.teamSize,
      programInterest: inq.programInterest,
      goals: inq.goals,
      status: inq.status,
      submittedAt: inq.submittedAt,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Database error in createInquiryInDb:', error);
    throw new Error('Failed to submit corporate inquiry.', {cause: error});
  }
}

export async function saveBrandConfig(brand: BrandSettings) {
  try {
    await db
      .insert(appConfig)
      .values({
        key: 'brand',
        value: brand as unknown as Record<string, unknown>,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: appConfig.key,
        set: {
          value: brand as unknown as Record<string, unknown>,
          updatedAt: new Date(),
        },
      });
  } catch (error) {
    console.error('Database error in saveBrandConfig:', error);
    throw new Error('Failed to save brand configuration.', {cause: error});
  }
}

export async function saveWeeklyGameConfig(game: WeeklyGameConfig) {
  try {
    await db
      .insert(appConfig)
      .values({
        key: 'weeklyGame',
        value: game as unknown as Record<string, unknown>,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: appConfig.key,
        set: {
          value: game as unknown as Record<string, unknown>,
          updatedAt: new Date(),
        },
      });
  } catch (error) {
    console.error('Database error in saveWeeklyGameConfig:', error);
    throw new Error('Failed to save weekly game settings.', {cause: error});
  }
}

export async function upsertSessionInDb(s: WednesdaySession) {
  try {
    await db
      .insert(wednesdaySessions)
      .values({
        id: s.id,
        weekLabel: s.weekLabel ?? null,
        title: s.title,
        theme: s.theme,
        description: s.description,
        date: s.date,
        time: s.time,
        facilitator: s.facilitator,
        venue: s.venue,
        mapLink: s.mapLink,
        capacity: s.capacity,
        registeredCount: s.registeredCount,
        priceEtb: s.priceEtb,
        published: s.published,
        posterUrl: s.posterUrl ?? null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: wednesdaySessions.id,
        set: {
          weekLabel: s.weekLabel ?? null,
          title: s.title,
          theme: s.theme,
          description: s.description,
          date: s.date,
          time: s.time,
          facilitator: s.facilitator,
          venue: s.venue,
          mapLink: s.mapLink,
          capacity: s.capacity,
          registeredCount: s.registeredCount,
          priceEtb: s.priceEtb,
          published: s.published,
          posterUrl: s.posterUrl ?? null,
          updatedAt: new Date(),
        },
      });
  } catch (error) {
    console.error('Database error in upsertSessionInDb:', error);
    throw new Error('Failed to save Wednesday session.', {cause: error});
  }
}

export async function deleteSessionInDb(id: string) {
  try {
    await db.delete(wednesdaySessions).where(eq(wednesdaySessions.id, id));
  } catch (error) {
    console.error('Database error in deleteSessionInDb:', error);
    throw new Error('Failed to delete Wednesday session.', {cause: error});
  }
}

export async function upsertPackageInDb(p: WednesdayPackage) {
  try {
    await db
      .insert(wednesdayPackages)
      .values({
        id: p.id,
        tier: p.tier,
        name: p.name,
        priceEtb: p.priceEtb,
        cadenceLabel: p.cadenceLabel,
        audienceLabel: p.audienceLabel,
        benefits: p.benefits,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: wednesdayPackages.id,
        set: {
          tier: p.tier,
          name: p.name,
          priceEtb: p.priceEtb,
          cadenceLabel: p.cadenceLabel,
          audienceLabel: p.audienceLabel,
          benefits: p.benefits,
          updatedAt: new Date(),
        },
      });
  } catch (error) {
    console.error('Database error in upsertPackageInDb:', error);
    throw new Error('Failed to save package pricing.', {cause: error});
  }
}

export async function upsertProductInDb(p: KhulProduct) {
  try {
    await db
      .insert(khulProducts)
      .values({
        id: p.id,
        name: p.name,
        category: p.category,
        priceEtb: p.priceEtb,
        description: p.description,
        inStock: p.inStock,
        visualKey: p.visualKey,
        customImageUrl: p.customImageUrl ?? null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: khulProducts.id,
        set: {
          name: p.name,
          category: p.category,
          priceEtb: p.priceEtb,
          description: p.description,
          inStock: p.inStock,
          visualKey: p.visualKey,
          customImageUrl: p.customImageUrl ?? null,
          updatedAt: new Date(),
        },
      });
  } catch (error) {
    console.error('Database error in upsertProductInDb:', error);
    throw new Error('Failed to save product.', {cause: error});
  }
}

export async function insertAnnouncementInDb(a: Announcement) {
  try {
    await db
      .insert(announcements)
      .values({
        id: a.id,
        title: a.title,
        category: a.category,
        body: a.body,
        publishedAt: a.publishedAt,
        author: a.author,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: announcements.id,
        set: {
          title: a.title,
          category: a.category,
          body: a.body,
          publishedAt: a.publishedAt,
          author: a.author,
          updatedAt: new Date(),
        },
      });
  } catch (error) {
    console.error('Database error in insertAnnouncementInDb:', error);
    throw new Error('Failed to publish announcement.', {cause: error});
  }
}

export async function deleteAnnouncementInDb(id: string) {
  try {
    await db.delete(announcements).where(eq(announcements.id, id));
  } catch (error) {
    console.error('Database error in deleteAnnouncementInDb:', error);
    throw new Error('Failed to remove announcement.', {cause: error});
  }
}

export async function upsertVirtueGiftInDb(w: ReflectionWord) {
  try {
    await db
      .insert(virtueGifts)
      .values({
        id: w.id,
        word: w.word,
        amharicWord: w.amharicWord,
        reflection: w.reflection,
        amharicReflection: w.amharicReflection,
        practiceHint: w.practiceHint,
        cardTheme: w.cardTheme,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: virtueGifts.id,
        set: {
          word: w.word,
          amharicWord: w.amharicWord,
          reflection: w.reflection,
          amharicReflection: w.amharicReflection,
          practiceHint: w.practiceHint,
          cardTheme: w.cardTheme,
          updatedAt: new Date(),
        },
      });
  } catch (error) {
    console.error('Database error in upsertVirtueGiftInDb:', error);
    throw new Error('Failed to save Virtue Gift card.', {cause: error});
  }
}

export async function deleteVirtueGiftInDb(id: string) {
  try {
    await db.delete(virtueGifts).where(eq(virtueGifts.id, id));
  } catch (error) {
    console.error('Database error in deleteVirtueGiftInDb:', error);
    throw new Error('Failed to remove Virtue Gift card.', {cause: error});
  }
}

export async function updateRegistrationStatusInDb(
  id: string,
  attendanceStatus: SessionRegistration['attendanceStatus'],
) {
  try {
    await db
      .update(sessionRegistrations)
      .set({attendanceStatus, updatedAt: new Date()})
      .where(eq(sessionRegistrations.id, id));
  } catch (error) {
    console.error('Database error in updateRegistrationStatusInDb:', error);
    throw new Error('Failed to update attendance status.', {cause: error});
  }
}

export async function checkInRegistrationByPassCodeInDb(passCode: string): Promise<{
  found: boolean;
  alreadyCheckedIn: boolean;
  registration?: SessionRegistration;
}> {
  try {
    const cleanCode = passCode.trim();
    if (!cleanCode) {
      return {found: false, alreadyCheckedIn: false};
    }

    const rows = await db
      .select()
      .from(sessionRegistrations)
      .where(ilike(sessionRegistrations.passCode, cleanCode))
      .limit(1);

    if (rows.length === 0) {
      return {found: false, alreadyCheckedIn: false};
    }

    const row = rows[0];
    const alreadyCheckedIn = row.attendanceStatus === 'Checked In';

    if (!alreadyCheckedIn) {
      await db
        .update(sessionRegistrations)
        .set({attendanceStatus: 'Checked In', updatedAt: new Date()})
        .where(eq(sessionRegistrations.id, row.id));
    }

    return {
      found: true,
      alreadyCheckedIn,
      registration: {
        id: row.id,
        memberName: row.memberName,
        memberEmail: row.memberEmail,
        memberPhone: row.memberPhone,
        sessionId: row.sessionId,
        sessionTitle: row.sessionTitle,
        sessionDate: row.sessionDate,
        packageTier: row.packageTier as PackageTier,
        amountEtb: row.amountEtb,
        passCode: row.passCode,
        attendanceStatus: 'Checked In',
        createdAt: row.createdAt,
      },
    };
  } catch (error) {
    console.error('Database error in checkInRegistrationByPassCodeInDb:', error);
    throw new Error('Failed to check in registration by QR pass code.', {cause: error});
  }
}

export async function updateOrderStatusInDb(id: string, status: StoreOrder['status']) {
  try {
    await db
      .update(storeOrders)
      .set({status, updatedAt: new Date()})
      .where(eq(storeOrders.id, id));
  } catch (error) {
    console.error('Database error in updateOrderStatusInDb:', error);
    throw new Error('Failed to update order status.', {cause: error});
  }
}

export async function updateInquiryStatusInDb(
  id: string,
  status: CorporateInquiry['status'],
) {
  try {
    await db
      .update(corporateInquiries)
      .set({status, updatedAt: new Date()})
      .where(eq(corporateInquiries.id, id));
  } catch (error) {
    console.error('Database error in updateInquiryStatusInDb:', error);
    throw new Error('Failed to update corporate inquiry status.', {cause: error});
  }
}

export async function awardMemberBadgeInDb(memberId: string, badge: string | null) {
  try {
    await db
      .update(leaderboardMembers)
      .set({awardedBadge: badge, updatedAt: new Date()})
      .where(eq(leaderboardMembers.id, memberId));

    await db
      .update(users)
      .set({awardedBadge: badge, updatedAt: new Date()})
      .where(eq(users.uid, memberId));
  } catch (error) {
    console.error('Database error in awardMemberBadgeInDb:', error);
    throw new Error('Failed to award practitioner badge.', {cause: error});
  }
}
