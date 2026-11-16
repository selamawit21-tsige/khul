import 'dotenv/config';
import express, {Response} from 'express';
import path from 'path';
import {fileURLToPath} from 'url';
import {
  awardMemberBadgeInDb,
  createInquiryInDb,
  createOrderInDb,
  createRegistrationInDb,
  deleteAnnouncementInDb,
  deleteSessionInDb,
  deleteVirtueGiftInDb,
  ensureSeeded,
  getOperationalData,
  getPublicCatalogState,
  insertAnnouncementInDb,
  saveBrandConfig,
  saveWeeklyGameConfig,
  updateInquiryStatusInDb,
  updateOrderStatusInDb,
  updateRegistrationStatusInDb,
  upsertPackageInDb,
  upsertProductInDb,
  upsertSessionInDb,
  upsertVirtueGiftInDb,
} from './src/db/repository.ts';
import {
  checkInUserTodayInDb,
  getOrCreateUser,
  grantAdmin,
  listAdmins,
  revokeAdmin,
  updateMemberProfileInDb,
} from './src/db/users.ts';
import {
  AuthRequest,
  optionalAuth,
  requireAdmin,
  requireAuth,
} from './src/middleware/auth.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({limit: '1mb'}));

// SSE subscribers for instant Admin -> User live updates
const sseClients = new Set<Response>();

function broadcastStateUpdate(reason: string) {
  const payload = `data: ${JSON.stringify({type: 'state-updated', reason, at: Date.now()})}\n\n`;
  for (const res of sseClients) {
    try {
      res.write(payload);
    } catch {
      sseClients.delete(res);
    }
  }
}

app.get('/api/events', (_req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();
  res.write(`data: ${JSON.stringify({type: 'connected'})}\n\n`);
  sseClients.add(res);

  const keepAlive = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      clearInterval(keepAlive);
      sseClients.delete(res);
    }
  }, 25000);

  _req.on('close', () => {
    clearInterval(keepAlive);
    sseClients.delete(res);
  });
});

// Public Catalog & Weekly Game State
app.get('/api/public/state', async (_req, res) => {
  try {
    const data = await getPublicCatalogState();
    res.json(data);
  } catch (error) {
    console.error('GET /api/public/state failed:', error);
    res.status(500).json({error: 'Unable to load Khul World content right now.'});
  }
});

// Current Signed-In User, Role & Scoped Operational Records
app.get('/api/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const firebaseUser = req.user!;
    const isAdmin = Boolean(req.isAdminUser);
    const dbUser = await getOrCreateUser({
      uid: firebaseUser.uid,
      email: firebaseUser.email ?? '',
      name: firebaseUser.name,
      role: isAdmin ? 'admin' : 'member',
    });
    const operational = await getOperationalData({
      uid: firebaseUser.uid,
      isAdmin,
    });
    const adminRecords = isAdmin ? await listAdmins() : [];
    const todayIso = new Date().toISOString().slice(0, 10);

    res.json({
      user: {
        uid: dbUser.uid,
        name: dbUser.name,
        email: dbUser.email,
        activePackage: dbUser.activePackage,
        currentStreak: dbUser.currentStreak,
        totalDaysPracticed: dbUser.totalDaysPracticed,
        weekDaysCompleted: dbUser.weekDaysCompleted,
        awardedBadge: dbUser.awardedBadge ?? undefined,
        stillnessIntention: dbUser.stillnessIntention,
        checkedInToday: dbUser.checkedInDate === todayIso,
      },
      isAdmin,
      adminRecords,
      ...operational,
    });
  } catch (error) {
    console.error('GET /api/me failed:', error);
    res.status(500).json({error: 'Unable to synchronize your member profile.'});
  }
});

// Authenticated Member Actions
app.post('/api/member/profile', requireAuth, async (req: AuthRequest, res) => {
  try {
    const {name, email, stillnessIntention} = req.body as {
      name?: string;
      email?: string;
      stillnessIntention?: string;
    };
    const updated = await updateMemberProfileInDb({
      uid: req.user!.uid,
      name,
      email,
      stillnessIntention,
    });
    broadcastStateUpdate('member-profile');
    res.json({user: updated});
  } catch (error) {
    console.error('POST /api/member/profile failed:', error);
    res.status(500).json({error: 'Unable to save profile updates.'});
  }
});

app.post('/api/member/checkin', requireAuth, async (req: AuthRequest, res) => {
  try {
    const updated = await checkInUserTodayInDb(req.user!.uid);
    broadcastStateUpdate('member-checkin');
    res.json({user: updated});
  } catch (error) {
    console.error('POST /api/member/checkin failed:', error);
    res.status(500).json({error: 'Unable to save daily check-in.'});
  }
});

// Member Submissions (supports guest or signed-in member; associates ownerUid when signed in)
app.post('/api/registrations', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const reg = req.body;
    await createRegistrationInDb(reg, req.user?.uid ?? null);
    broadcastStateUpdate('registration');
    res.status(201).json({ok: true, registration: reg});
  } catch (error) {
    console.error('POST /api/registrations failed:', error);
    res.status(500).json({error: 'Unable to register for session.'});
  }
});

app.post('/api/orders', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const order = req.body;
    await createOrderInDb(order, req.user?.uid ?? null);
    broadcastStateUpdate('order');
    res.status(201).json({ok: true, order});
  } catch (error) {
    console.error('POST /api/orders failed:', error);
    res.status(500).json({error: 'Unable to place Khul Life order.'});
  }
});

app.post('/api/corporate-inquiries', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const inquiry = req.body;
    await createInquiryInDb(inquiry, req.user?.uid ?? null);
    broadcastStateUpdate('corporate-inquiry');
    res.status(201).json({ok: true, inquiry});
  } catch (error) {
    console.error('POST /api/corporate-inquiries failed:', error);
    res.status(500).json({error: 'Unable to submit corporate inquiry.'});
  }
});

// Privileged Admin Endpoints -> Sync Live to All Connected User Pages
app.put('/api/admin/brand', requireAdmin, async (req, res) => {
  try {
    await saveBrandConfig(req.body);
    broadcastStateUpdate('brand');
    res.json({ok: true});
  } catch (error) {
    console.error('PUT /api/admin/brand failed:', error);
    res.status(500).json({error: 'Unable to update brand settings.'});
  }
});

app.put('/api/admin/weekly-game', requireAdmin, async (req, res) => {
  try {
    await saveWeeklyGameConfig(req.body);
    broadcastStateUpdate('weekly-game');
    res.json({ok: true});
  } catch (error) {
    console.error('PUT /api/admin/weekly-game failed:', error);
    res.status(500).json({error: 'Unable to update weekly game.'});
  }
});

app.put('/api/admin/sessions/:id', requireAdmin, async (req, res) => {
  try {
    await upsertSessionInDb({...req.body, id: req.params.id});
    broadcastStateUpdate('sessions');
    res.json({ok: true});
  } catch (error) {
    console.error('PUT /api/admin/sessions failed:', error);
    res.status(500).json({error: 'Unable to save Wednesday session.'});
  }
});

app.delete('/api/admin/sessions/:id', requireAdmin, async (req, res) => {
  try {
    await deleteSessionInDb(req.params.id);
    broadcastStateUpdate('sessions');
    res.json({ok: true});
  } catch (error) {
    console.error('DELETE /api/admin/sessions failed:', error);
    res.status(500).json({error: 'Unable to delete Wednesday session.'});
  }
});

app.put('/api/admin/packages/:id', requireAdmin, async (req, res) => {
  try {
    await upsertPackageInDb({...req.body, id: req.params.id});
    broadcastStateUpdate('packages');
    res.json({ok: true});
  } catch (error) {
    console.error('PUT /api/admin/packages failed:', error);
    res.status(500).json({error: 'Unable to update package pricing.'});
  }
});

app.put('/api/admin/products/:id', requireAdmin, async (req, res) => {
  try {
    await upsertProductInDb({...req.body, id: req.params.id});
    broadcastStateUpdate('products');
    res.json({ok: true});
  } catch (error) {
    console.error('PUT /api/admin/products failed:', error);
    res.status(500).json({error: 'Unable to save product.'});
  }
});

app.post('/api/admin/announcements', requireAdmin, async (req, res) => {
  try {
    await insertAnnouncementInDb(req.body);
    broadcastStateUpdate('announcements');
    res.status(201).json({ok: true});
  } catch (error) {
    console.error('POST /api/admin/announcements failed:', error);
    res.status(500).json({error: 'Unable to publish announcement.'});
  }
});

app.delete('/api/admin/announcements/:id', requireAdmin, async (req, res) => {
  try {
    await deleteAnnouncementInDb(req.params.id);
    broadcastStateUpdate('announcements');
    res.json({ok: true});
  } catch (error) {
    console.error('DELETE /api/admin/announcements failed:', error);
    res.status(500).json({error: 'Unable to remove announcement.'});
  }
});

app.put('/api/admin/virtue-gifts/:id', requireAdmin, async (req, res) => {
  try {
    await upsertVirtueGiftInDb({...req.body, id: req.params.id});
    broadcastStateUpdate('virtue-gifts');
    res.json({ok: true});
  } catch (error) {
    console.error('PUT /api/admin/virtue-gifts failed:', error);
    res.status(500).json({error: 'Unable to save Virtue Gift card.'});
  }
});

app.delete('/api/admin/virtue-gifts/:id', requireAdmin, async (req, res) => {
  try {
    await deleteVirtueGiftInDb(req.params.id);
    broadcastStateUpdate('virtue-gifts');
    res.json({ok: true});
  } catch (error) {
    console.error('DELETE /api/admin/virtue-gifts failed:', error);
    res.status(500).json({error: 'Unable to delete Virtue Gift card.'});
  }
});

app.patch('/api/admin/registrations/:id', requireAdmin, async (req, res) => {
  try {
    await updateRegistrationStatusInDb(req.params.id, req.body.attendanceStatus);
    broadcastStateUpdate('registrations');
    res.json({ok: true});
  } catch (error) {
    console.error('PATCH /api/admin/registrations failed:', error);
    res.status(500).json({error: 'Unable to update attendance status.'});
  }
});

app.patch('/api/admin/orders/:id', requireAdmin, async (req, res) => {
  try {
    await updateOrderStatusInDb(req.params.id, req.body.status);
    broadcastStateUpdate('orders');
    res.json({ok: true});
  } catch (error) {
    console.error('PATCH /api/admin/orders failed:', error);
    res.status(500).json({error: 'Unable to update order status.'});
  }
});

app.patch('/api/admin/corporate-inquiries/:id', requireAdmin, async (req, res) => {
  try {
    await updateInquiryStatusInDb(req.params.id, req.body.status);
    broadcastStateUpdate('corporate-inquiries');
    res.json({ok: true});
  } catch (error) {
    console.error('PATCH /api/admin/corporate-inquiries failed:', error);
    res.status(500).json({error: 'Unable to update corporate inquiry.'});
  }
});

app.put('/api/admin/leaderboard/:id/badge', requireAdmin, async (req, res) => {
  try {
    await awardMemberBadgeInDb(req.params.id, req.body.badge || null);
    broadcastStateUpdate('leaderboard');
    res.json({ok: true});
  } catch (error) {
    console.error('PUT /api/admin/leaderboard failed:', error);
    res.status(500).json({error: 'Unable to award practitioner badge.'});
  }
});

app.post('/api/admin/admins', requireAdmin, async (req, res) => {
  try {
    const {uid, email} = req.body as {uid: string; email: string};
    const record = await grantAdmin(uid.trim(), email.trim());
    res.status(201).json({record});
  } catch (error) {
    console.error('POST /api/admin/admins failed:', error);
    res.status(500).json({error: 'Unable to grant admin privileges.'});
  }
});

app.delete('/api/admin/admins/:uid', requireAdmin, async (req, res) => {
  try {
    await revokeAdmin(req.params.uid);
    res.json({ok: true});
  } catch (error) {
    console.error('DELETE /api/admin/admins failed:', error);
    res.status(500).json({error: 'Unable to revoke admin privileges.'});
  }
});

app.post('/api/admin/reset-defaults', requireAdmin, async (_req, res) => {
  try {
    await ensureSeeded(true);
    broadcastStateUpdate('reset-defaults');
    res.json({ok: true});
  } catch (error) {
    console.error('POST /api/admin/reset-defaults failed:', error);
    res.status(500).json({error: 'Unable to restore Khul World defaults.'});
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const {createServer: createViteServer} = await import('vite');
    const vite = await createViteServer({
      server: {middlewareMode: true},
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Khul World server running on http://0.0.0.0:${PORT}`);
  });
}

void startServer();
