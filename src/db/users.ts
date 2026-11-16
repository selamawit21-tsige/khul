import {eq} from 'drizzle-orm';
import {db} from './index.ts';
import {admins, leaderboardMembers, users} from './schema.ts';

export async function getOrCreateUser(params: {
  uid: string;
  email: string;
  name?: string;
  role?: 'admin' | 'member';
}) {
  try {
    const cleanName = params.name?.trim() || params.email.split('@')[0] || 'Khul Member';
    const result = await db
      .insert(users)
      .values({
        uid: params.uid,
        email: params.email,
        name: cleanName,
        role: params.role ?? 'member',
        activePackage: 'Single',
        currentStreak: 1,
        totalDaysPracticed: 1,
        weekDaysCompleted: [false, false, false, false, false, false, false],
        stillnessIntention: '',
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: params.email,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database error in getOrCreateUser:', error);
    throw new Error('Failed to synchronize user profile.', {cause: error});
  }
}

export async function listAdmins() {
  try {
    return await db.select().from(admins);
  } catch (error) {
    console.error('Database error in listAdmins:', error);
    throw new Error('Failed to load administrators.', {cause: error});
  }
}

export async function grantAdmin(uid: string, email: string) {
  try {
    const rows = await db
      .insert(admins)
      .values({uid, email, role: 'admin'})
      .onConflictDoUpdate({
        target: admins.uid,
        set: {email, role: 'admin'},
      })
      .returning();
    return rows[0];
  } catch (error) {
    console.error('Database error in grantAdmin:', error);
    throw new Error('Failed to grant admin privileges.', {cause: error});
  }
}

export async function revokeAdmin(uid: string) {
  try {
    await db.delete(admins).where(eq(admins.uid, uid));
  } catch (error) {
    console.error('Database error in revokeAdmin:', error);
    throw new Error('Failed to revoke admin privileges.', {cause: error});
  }
}

export async function updateMemberProfileInDb(params: {
  uid: string;
  name?: string;
  email?: string;
  stillnessIntention?: string;
}) {
  try {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.uid, params.uid))
      .limit(1);

    if (existing.length === 0) return null;
    const current = existing[0];
    const nextName = params.name?.trim() || current.name;
    const nextEmail = params.email?.trim() || current.email;
    const nextIntention =
      params.stillnessIntention !== undefined
        ? params.stillnessIntention
        : current.stillnessIntention;

    const updated = await db
      .update(users)
      .set({
        name: nextName,
        email: nextEmail,
        stillnessIntention: nextIntention,
        updatedAt: new Date(),
      })
      .where(eq(users.uid, params.uid))
      .returning();

    await db
      .insert(leaderboardMembers)
      .values({
        id: params.uid,
        name: nextName,
        email: nextEmail,
        activePackage: current.activePackage,
        currentStreak: current.currentStreak,
        totalDaysPracticed: current.totalDaysPracticed,
        weekDaysCompleted: current.weekDaysCompleted,
        awardedBadge: current.awardedBadge,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: leaderboardMembers.id,
        set: {
          name: nextName,
          email: nextEmail,
          updatedAt: new Date(),
        },
      });

    return updated[0];
  } catch (error) {
    console.error('Database error in updateMemberProfileInDb:', error);
    throw new Error('Failed to save profile settings.', {cause: error});
  }
}

export async function checkInUserTodayInDb(uid: string) {
  try {
    const todayIso = new Date().toISOString().slice(0, 10);
    const existing = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    if (existing.length === 0) return null;
    const current = existing[0];
    if (current.checkedInDate === todayIso) {
      return current;
    }

    const nextWeek = Array.isArray(current.weekDaysCompleted)
      ? [...current.weekDaysCompleted]
      : [false, false, false, false, false, false, false];
    nextWeek[6] = true;

    const updated = await db
      .update(users)
      .set({
        currentStreak: current.currentStreak + 1,
        totalDaysPracticed: current.totalDaysPracticed + 1,
        weekDaysCompleted: nextWeek,
        checkedInDate: todayIso,
        updatedAt: new Date(),
      })
      .where(eq(users.uid, uid))
      .returning();

    const row = updated[0];
    await db
      .insert(leaderboardMembers)
      .values({
        id: row.uid,
        name: row.name,
        email: row.email,
        activePackage: row.activePackage,
        currentStreak: row.currentStreak,
        totalDaysPracticed: row.totalDaysPracticed,
        weekDaysCompleted: row.weekDaysCompleted,
        awardedBadge: row.awardedBadge,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: leaderboardMembers.id,
        set: {
          name: row.name,
          activePackage: row.activePackage,
          currentStreak: row.currentStreak,
          totalDaysPracticed: row.totalDaysPracticed,
          weekDaysCompleted: row.weekDaysCompleted,
          updatedAt: new Date(),
        },
      });

    return row;
  } catch (error) {
    console.error('Database error in checkInUserTodayInDb:', error);
    throw new Error('Failed to record daily check-in.', {cause: error});
  }
}
