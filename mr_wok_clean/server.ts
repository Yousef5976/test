import express, { Request, Response, NextFunction } from "express";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";
import ExcelJS from "exceljs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JWT_SECRET = process.env.JWT_SECRET || "mrwok-secret-2026-change-in-production";

// ═══════════════════════════════════════════════════════════════
// DATABASE SETUP
// ═══════════════════════════════════════════════════════════════
const db = new Database("mrwok_orders.db");
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    passwordHash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin','cook','delivery')),
    displayName TEXT,
    phone TEXT,
    active INTEGER DEFAULT 1,
    createdAt TEXT DEFAULT (datetime('now')),
    createdBy TEXT
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    loginAt TEXT NOT NULL,
    logoutAt TEXT,
    ipAddress TEXT,
    available INTEGER DEFAULT 1,
    FOREIGN KEY(userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    orderRef TEXT UNIQUE NOT NULL,
    customerName TEXT,
    customerPhone TEXT,
    customerEmail TEXT,
    orderType TEXT,
    deliveryArea TEXT,
    streetAddress TEXT,
    buildingNumber TEXT,
    deliveryNotes TEXT,
    branchName TEXT,
    paymentMethod TEXT,
    customerLat REAL,
    customerLng REAL,
    subtotal REAL,
    deliveryFee REAL,
    total REAL,
    status TEXT DEFAULT 'PENDING',
    cookId TEXT,
    deliveryUserId TEXT,
    deliveryLat REAL,
    deliveryLng REAL,
    destination TEXT,
    acceptedByAt TEXT,
    preparedAt TEXT,
    pickedUpAt TEXT,
    deliveredAt TEXT,
    prepTimerStart TEXT,
    rating INTEGER,
    ratingComment TEXT,
    alertSent INTEGER DEFAULT 0,
    createdAt TEXT,
    updatedAt TEXT,
    FOREIGN KEY(cookId) REFERENCES users(id),
    FOREIGN KEY(deliveryUserId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orderId TEXT NOT NULL,
    orderRef TEXT NOT NULL,
    itemName TEXT,
    category TEXT,
    quantity INTEGER,
    unitPrice REAL,
    lineTotal REAL,
    FOREIGN KEY(orderId) REFERENCES orders(id)
  );

  CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orderRef TEXT NOT NULL,
    senderRole TEXT NOT NULL,
    senderId TEXT,
    senderName TEXT,
    message TEXT NOT NULL,
    sentAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS break_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL,
    sessionId TEXT,
    breakStart TEXT NOT NULL,
    breakEnd TEXT,
    FOREIGN KEY(userId) REFERENCES users(id)
  );
`);

// Safe migrations for existing databases
const migrations = [
  "ALTER TABLE sessions ADD COLUMN available INTEGER DEFAULT 1",
  "CREATE TABLE IF NOT EXISTS break_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, userId TEXT NOT NULL, sessionId TEXT, breakStart TEXT NOT NULL, breakEnd TEXT)",
  "ALTER TABLE orders ADD COLUMN customerLat REAL",
  "ALTER TABLE orders ADD COLUMN customerLng REAL",
];
for (const sql of migrations) {
  try { db.prepare(sql).run(); } catch { /* already exists */ }
}

// Seed admin if not exists
if (!db.prepare("SELECT id FROM users WHERE role='admin' LIMIT 1").get()) {
  db.prepare("INSERT INTO users (id,username,passwordHash,role,displayName,active) VALUES (?,?,?,?,?,1)")
    .run("ADM-001", "mr.wok", bcrypt.hashSync("1234", 10), "admin", "Mr. Wok Admin");
  console.log("✅ Admin seeded: mr.wok / 1234");
}

// ═══════════════════════════════════════════════════════════════
// PREPARED STATEMENTS
// ═══════════════════════════════════════════════════════════════
const stmts = {
  getUserByUsername: db.prepare("SELECT * FROM users WHERE username=? AND active=1"),
  getUserById:       db.prepare("SELECT * FROM users WHERE id=?"),
  getAllUsers:       db.prepare("SELECT id,username,role,displayName,phone,active,createdAt FROM users ORDER BY role,id"),
  insertUser:        db.prepare("INSERT INTO users (id,username,passwordHash,role,displayName,phone,active,createdBy) VALUES (@id,@username,@passwordHash,@role,@displayName,@phone,1,@createdBy)"),
  updateUserActive:  db.prepare("UPDATE users SET active=? WHERE id=?"),
  updateUserPass:    db.prepare("UPDATE users SET passwordHash=? WHERE id=?"),

  insertSession:     db.prepare("INSERT INTO sessions (id,userId,loginAt,ipAddress,available) VALUES (?,?,?,?,1)"),
  closeSession:      db.prepare("UPDATE sessions SET logoutAt=? WHERE userId=? AND logoutAt IS NULL"),
  getActiveSessions: db.prepare(`
    SELECT s.id, s.userId, s.loginAt, s.logoutAt, s.ipAddress,
           COALESCE(s.available, 1) as available,
           u.username, u.role, u.displayName, u.phone
    FROM sessions s JOIN users u ON s.userId=u.id
    WHERE s.logoutAt IS NULL ORDER BY s.loginAt DESC
  `),
  getSessionHistory: db.prepare(`
    SELECT s.id, s.userId, s.loginAt, s.logoutAt, s.ipAddress,
           COALESCE(s.available, 1) as available,
           u.username, u.role, u.displayName
    FROM sessions s JOIN users u ON s.userId=u.id
    ORDER BY s.loginAt DESC LIMIT 200
  `),

  insertOrder: db.prepare(`
    INSERT INTO orders (id,orderRef,customerName,customerPhone,customerEmail,orderType,
      deliveryArea,streetAddress,buildingNumber,deliveryNotes,branchName,paymentMethod,
      customerLat,customerLng,subtotal,deliveryFee,total,status,createdAt,updatedAt)
    VALUES (@id,@orderRef,@customerName,@customerPhone,@customerEmail,@orderType,
      @deliveryArea,@streetAddress,@buildingNumber,@deliveryNotes,@branchName,@paymentMethod,
      @customerLat,@customerLng,@subtotal,@deliveryFee,@total,'PENDING',@createdAt,@createdAt)
  `),
  insertItem: db.prepare("INSERT INTO order_items (orderId,orderRef,itemName,category,quantity,unitPrice,lineTotal) VALUES (@orderId,@orderRef,@itemName,@category,@quantity,@unitPrice,@lineTotal)"),
  getOrderByRef:      db.prepare("SELECT * FROM orders WHERE orderRef=?"),
  getOrderItems:      db.prepare("SELECT * FROM order_items WHERE orderId=?"),
  getAllOrders:        db.prepare("SELECT * FROM orders ORDER BY createdAt DESC"),
  getPendingOrders:   db.prepare("SELECT * FROM orders WHERE status='PENDING' ORDER BY createdAt ASC"),
  getReadyOrders:     db.prepare("SELECT * FROM orders WHERE status='READY_FOR_DELIVERY' ORDER BY preparedAt ASC"),
  updateOrderStatus:  db.prepare("UPDATE orders SET status=@status,updatedAt=@now WHERE orderRef=@orderRef"),
  cookAcceptOrder:    db.prepare("UPDATE orders SET status='ACCEPTED',cookId=@cookId,acceptedByAt=@now,prepTimerStart=@now,updatedAt=@now WHERE orderRef=@orderRef AND status='PENDING'"),
  cookPreparedOrder:  db.prepare("UPDATE orders SET status='READY_FOR_DELIVERY',preparedAt=@now,updatedAt=@now WHERE orderRef=@orderRef AND cookId=@cookId"),
  deliveryAccept:     db.prepare("UPDATE orders SET status='OUT_FOR_DELIVERY',deliveryUserId=@deliveryUserId,pickedUpAt=@now,updatedAt=@now WHERE orderRef=@orderRef AND status='READY_FOR_DELIVERY'"),
  deliveryComplete:   db.prepare("UPDATE orders SET status='DELIVERED',deliveredAt=@now,updatedAt=@now WHERE orderRef=@orderRef AND deliveryUserId=@deliveryUserId"),
  updateDeliveryLoc:  db.prepare("UPDATE orders SET deliveryLat=@lat,deliveryLng=@lng,updatedAt=@now WHERE orderRef=@orderRef"),
  updateRating:       db.prepare("UPDATE orders SET rating=@rating,ratingComment=@comment WHERE orderRef=@orderRef"),
  markAlertSent:      db.prepare("UPDATE orders SET alertSent=1 WHERE orderRef=@orderRef"),
  getUnalertedStale:  db.prepare("SELECT * FROM orders WHERE status='PENDING' AND alertSent=0 AND createdAt <= datetime('now','-5 minutes')"),
  insertChat:         db.prepare("INSERT INTO chat_messages (orderRef,senderRole,senderId,senderName,message) VALUES (@orderRef,@senderRole,@senderId,@senderName,@message)"),
  getChatByOrder:     db.prepare("SELECT * FROM chat_messages WHERE orderRef=? ORDER BY sentAt ASC"),
  getStats:           db.prepare(`
    SELECT COUNT(*) as totalOrders,
      COALESCE(SUM(total),0) as totalRevenue,
      COALESCE(AVG(total),0) as avgOrderValue,
      SUM(CASE WHEN status='PENDING' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status='ACCEPTED' THEN 1 ELSE 0 END) as accepted,
      SUM(CASE WHEN status='READY_FOR_DELIVERY' THEN 1 ELSE 0 END) as ready,
      SUM(CASE WHEN status='OUT_FOR_DELIVERY' THEN 1 ELSE 0 END) as outForDelivery,
      SUM(CASE WHEN status='DELIVERED' THEN 1 ELSE 0 END) as delivered,
      SUM(CASE WHEN status='CANCELLED' THEN 1 ELSE 0 END) as cancelled,
      SUM(CASE WHEN orderType='DELIVERY' THEN 1 ELSE 0 END) as deliveryOrders,
      SUM(CASE WHEN orderType='DINE_IN' THEN 1 ELSE 0 END) as dineInOrders,
      SUM(CASE WHEN orderType='TAKEAWAY' THEN 1 ELSE 0 END) as takeawayOrders,
      COALESCE(AVG(CASE WHEN rating IS NOT NULL THEN CAST(rating AS REAL) END),0) as avgRating
    FROM orders
  `),
  getTopItems: db.prepare("SELECT itemName,SUM(quantity) as totalSold,SUM(lineTotal) as revenue FROM order_items GROUP BY itemName ORDER BY totalSold DESC LIMIT 10"),
};

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
function now() { return new Date().toISOString(); }

function generateId(role: string): string {
  const prefix = role === 'cook' ? 'CCK' : role === 'delivery' ? 'DLV' : 'ADM';
  const existing = db.prepare("SELECT id FROM users WHERE role=? ORDER BY id DESC LIMIT 1").get(role) as any;
  let num = 1;
  if (existing) { const p = existing.id.split('-'); num = parseInt(p[1] || '0') + 1; }
  return `${prefix}-${String(num).padStart(3,'0')}`;
}

function makeToken(user: any): string {
  return jwt.sign({ id: user.id, role: user.role, username: user.username }, JWT_SECRET, { expiresIn: '8h' });
}

function authMiddleware(roles: string[] = []) {
  return (req: any, res: Response, next: NextFunction) => {
    const auth = req.headers.authorization;
    const queryToken = req.query?.token as string | undefined;
    const raw = auth?.startsWith('Bearer ') ? auth.slice(7) : queryToken;
    if (!raw) return res.status(401).json({ error: 'No token' });
    try {
      const decoded = jwt.verify(raw, JWT_SECRET) as any;
      if (roles.length && !roles.includes(decoded.role)) return res.status(403).json({ error: 'Forbidden' });
      req.user = decoded;
      next();
    } catch { res.status(401).json({ error: 'Invalid or expired token' }); }
  };
}

// Normalize timestamps to UTC Date object (handles both ISO and SQLite formats)
function toUTC(dt: string | null | undefined): Date | null {
  if (!dt) return null;
  try {
    if (dt.includes('T') && (dt.endsWith('Z') || dt.includes('+'))) return new Date(dt);
    return new Date(dt.replace(' ', 'T') + 'Z');
  } catch { return null; }
}

function fmtTime(dt: string | null | undefined): string {
  const d = toUTC(dt);
  if (!d || isNaN(d.getTime())) return '–';
  try { return d.toLocaleTimeString('en-EG', { hour:'2-digit', minute:'2-digit', hour12:true, timeZone:'Africa/Cairo' }); }
  catch { return d.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12:true }); }
}

function fmtFull(dt: string | null | undefined): string {
  const d = toUTC(dt);
  if (!d || isNaN(d.getTime())) return '–';
  try { return d.toLocaleString('en-EG', { timeZone:'Africa/Cairo', day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit', hour12:true }); }
  catch { return d.toLocaleString(); }
}

function diffMins(from: string | null | undefined, to: string | null | undefined): string {
  const f = toUTC(from), t = toUTC(to);
  if (!f || !t) return '–';
  try {
    const diff = Math.round((t.getTime() - f.getTime()) / 60000);
    if (diff < 0) return '–';
    const h = Math.floor(diff / 60), m = diff % 60;
    return h > 0 ? `${h}h ${m}m` : `${m} min`;
  } catch { return '–'; }
}

// ═══════════════════════════════════════════════════════════════
// SERVER
// ═══════════════════════════════════════════════════════════════
async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, { cors: { origin: "*" } });
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  app.use(express.json());
  app.use('/portals', express.static(path.join(__dirname, 'portals')));
  app.get('/admin',    (_req, res) => res.sendFile(path.join(__dirname, 'portals/admin.html')));
  app.get('/cook',     (_req, res) => res.sendFile(path.join(__dirname, 'portals/cook.html')));
  app.get('/delivery', (_req, res) => res.sendFile(path.join(__dirname, 'portals/delivery.html')));

  // ── AUTH ──────────────────────────────────────────────────────
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });
    const user = stmts.getUserByUsername.get(username) as any;
    if (!user || !bcrypt.compareSync(password, user.passwordHash))
      return res.status(401).json({ error: 'Invalid credentials' });
    stmts.closeSession.run(now(), user.id);
    const sessionId = Math.random().toString(36).substr(2, 12);
    stmts.insertSession.run(sessionId, user.id, now(), req.ip || '');
    res.json({ token: makeToken(user), user: { id: user.id, username: user.username, role: user.role, displayName: user.displayName, phone: user.phone } });
  });

  app.post('/api/auth/logout', authMiddleware(), (req: any, res: Response) => {
    stmts.closeSession.run(now(), req.user.id);
    db.prepare("UPDATE break_logs SET breakEnd=? WHERE userId=? AND breakEnd IS NULL").run(now(), req.user.id);
    res.json({ success: true });
  });

  app.get('/api/auth/me', authMiddleware(), (req: any, res: Response) => {
    const user = stmts.getUserById.get(req.user.id) as any;
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json({ id: user.id, username: user.username, role: user.role, displayName: user.displayName, phone: user.phone });
  });

  app.post('/api/auth/availability', authMiddleware(['cook','delivery']), (req: any, res: Response) => {
    const { available } = req.body;
    const n = now();
    const session = db.prepare("SELECT id FROM sessions WHERE userId=? AND logoutAt IS NULL LIMIT 1").get(req.user.id) as any;
    db.prepare("UPDATE sessions SET available=? WHERE userId=? AND logoutAt IS NULL").run(available ? 1 : 0, req.user.id);
    if (!available) {
      db.prepare("INSERT INTO break_logs (userId,sessionId,breakStart) VALUES (?,?,?)").run(req.user.id, session?.id || null, n);
    } else {
      db.prepare("UPDATE break_logs SET breakEnd=? WHERE userId=? AND breakEnd IS NULL").run(n, req.user.id);
    }
    io.to("admin_dashboard").emit("staff_availability", { userId: req.user.id, available });
    res.json({ success: true, available });
  });

  app.get('/api/auth/availability', authMiddleware(['cook','delivery']), (req: any, res: Response) => {
    const row = db.prepare("SELECT available FROM sessions WHERE userId=? AND logoutAt IS NULL LIMIT 1").get(req.user.id) as any;
    res.json({ available: row ? (row.available !== 0) : true });
  });

  // ── ADMIN: Users ──────────────────────────────────────────────
  app.get('/api/admin/users', authMiddleware(['admin']), (_req, res) => res.json(stmts.getAllUsers.all()));

  app.post('/api/admin/users', authMiddleware(['admin']), (req: any, res: Response) => {
    const { username, password, role, displayName, phone } = req.body;
    if (!username || !password || !['cook','delivery'].includes(role))
      return res.status(400).json({ error: 'Missing or invalid fields' });
    if (db.prepare("SELECT id FROM users WHERE username=?").get(username))
      return res.status(409).json({ error: 'Username already exists' });
    const id = generateId(role);
    stmts.insertUser.run({ id, username, passwordHash: bcrypt.hashSync(password, 10), role, displayName: displayName||username, phone: phone||'', createdBy: req.user.id });
    res.json({ success: true, id, username, role });
  });

  app.patch('/api/admin/users/:id/active', authMiddleware(['admin']), (req: Request, res: Response) => {
    stmts.updateUserActive.run(req.body.active ? 1 : 0, req.params.id);
    res.json({ success: true });
  });

  app.patch('/api/admin/users/:id/password', authMiddleware(['admin']), (req: Request, res: Response) => {
    if (!req.body.password) return res.status(400).json({ error: 'Missing password' });
    stmts.updateUserPass.run(bcrypt.hashSync(req.body.password, 10), req.params.id);
    res.json({ success: true });
  });

  // ── ADMIN: Sessions ───────────────────────────────────────────
  app.get('/api/admin/sessions/active',  authMiddleware(['admin']), (_req, res) => res.json(stmts.getActiveSessions.all()));
  app.get('/api/admin/sessions/history', authMiddleware(['admin']), (_req, res) => res.json(stmts.getSessionHistory.all()));

  // ── ORDERS: Customer ──────────────────────────────────────────
  app.post('/api/orders', (req: Request, res: Response) => {
    const order = req.body;
    const n = now();
    const orderRef = `MRW-${n.slice(0,10).replace(/-/g,'')}-${Math.floor(1000+Math.random()*9000)}`;
    const id = Math.random().toString(36).substr(2, 9);
    let subtotal = 0;
    (order.items||[]).forEach((i: any) => { subtotal += i.unitPrice * i.quantity; });
    const deliveryFee = order.orderType === 'DELIVERY' ? 25 : 0;
    const total = subtotal + deliveryFee;
    const newOrder = {
      id, orderRef,
      customerName: order.customerName||'', customerPhone: order.customerPhone||'',
      customerEmail: order.customerEmail||'', orderType: order.orderType||'DELIVERY',
      deliveryArea: order.deliveryArea||'', streetAddress: order.streetAddress||'',
      buildingNumber: order.buildingNumber||'', deliveryNotes: order.deliveryNotes||'',
      branchName: order.branchName||'', paymentMethod: order.paymentMethod||'CASH_ON_DELIVERY',
      customerLat: order.customerLat||null, customerLng: order.customerLng||null,
      subtotal, deliveryFee, total, createdAt: n,
    };
    stmts.insertOrder.run(newOrder);
    (order.items||[]).forEach((item: any) => {
      stmts.insertItem.run({ orderId:id, orderRef, itemName:item.itemName, category:item.category, quantity:item.quantity, unitPrice:item.unitPrice, lineTotal:item.unitPrice*item.quantity });
    });
    io.to('cook_portal').emit('new_order', { ...newOrder, items: order.items||[] });
    io.to('admin_dashboard').emit('new_order', { ...newOrder, items: order.items||[] });
    res.json({ success:true, orderRef, estimatedTime:'35-50 min', total });
  });

  app.get('/api/orders/:orderRef', (req: Request, res: Response) => {
    const order = stmts.getOrderByRef.get(req.params.orderRef) as any;
    if (!order) return res.status(404).json({ error:'Order not found' });
    res.json({ ...order, items: stmts.getOrderItems.all(order.id) });
  });

  // ── COOK ──────────────────────────────────────────────────────
  app.get('/api/cook/orders/pending', authMiddleware(['cook','admin']), (_req, res) => {
    res.json((stmts.getPendingOrders.all() as any[]).map(o => ({ ...o, items: stmts.getOrderItems.all(o.id) })));
  });

  app.get('/api/cook/orders/mine', authMiddleware(['cook']), (req: any, res: Response) => {
    const orders = db.prepare("SELECT * FROM orders WHERE cookId=? AND status='ACCEPTED' ORDER BY createdAt DESC").all(req.user.id) as any[];
    res.json(orders.map(o => ({ ...o, items: stmts.getOrderItems.all(o.id) })));
  });

  app.post('/api/cook/orders/:orderRef/accept', authMiddleware(['cook']), (req: any, res: Response) => {
    const result = stmts.cookAcceptOrder.run({ cookId: req.user.id, orderRef: req.params.orderRef, now: now() });
    if ((result as any).changes === 0) return res.status(409).json({ error:'Order already taken or not pending' });
    const order = stmts.getOrderByRef.get(req.params.orderRef) as any;
    io.to(req.params.orderRef).emit('order_status', { orderRef: req.params.orderRef, status:'ACCEPTED' });
    io.to('admin_dashboard').emit('order_updated', { orderRef: req.params.orderRef, status:'ACCEPTED', cookId: req.user.id });
    io.to('cook_portal').emit('order_taken', { orderRef: req.params.orderRef });
    res.json({ success:true, order });
  });

  app.post('/api/cook/orders/:orderRef/prepared', authMiddleware(['cook']), (req: any, res: Response) => {
    const result = stmts.cookPreparedOrder.run({ cookId: req.user.id, orderRef: req.params.orderRef, now: now() });
    if ((result as any).changes === 0) return res.status(409).json({ error:'Not your order or wrong status' });
    io.to(req.params.orderRef).emit('order_status', { orderRef: req.params.orderRef, status:'READY_FOR_DELIVERY' });
    io.to('admin_dashboard').emit('order_updated', { orderRef: req.params.orderRef, status:'READY_FOR_DELIVERY' });
    io.to('delivery_portal').emit('order_ready', stmts.getOrderByRef.get(req.params.orderRef));
    res.json({ success:true });
  });

  // ── DELIVERY ──────────────────────────────────────────────────
  app.get('/api/delivery/orders/ready', authMiddleware(['delivery','admin']), (_req, res) => {
    res.json((stmts.getReadyOrders.all() as any[]).map(o => ({ ...o, items: stmts.getOrderItems.all(o.id) })));
  });

  app.get('/api/delivery/orders/mine', authMiddleware(['delivery']), (req: any, res: Response) => {
    const orders = db.prepare("SELECT * FROM orders WHERE deliveryUserId=? AND status='OUT_FOR_DELIVERY'").all(req.user.id) as any[];
    res.json(orders.map(o => ({ ...o, items: stmts.getOrderItems.all(o.id) })));
  });

  app.post('/api/delivery/orders/:orderRef/accept', authMiddleware(['delivery']), (req: any, res: Response) => {
    const result = stmts.deliveryAccept.run({ deliveryUserId: req.user.id, orderRef: req.params.orderRef, now: now() });
    if ((result as any).changes === 0) return res.status(409).json({ error:'Order already taken or not ready' });
    const order = stmts.getOrderByRef.get(req.params.orderRef) as any;
    const delivUser = stmts.getUserById.get(req.user.id) as any;
    io.to(req.params.orderRef).emit('order_status', { orderRef: req.params.orderRef, status:'OUT_FOR_DELIVERY', deliveryPhone: delivUser?.phone||'' });
    io.to('admin_dashboard').emit('order_updated', { orderRef: req.params.orderRef, status:'OUT_FOR_DELIVERY', deliveryUserId: req.user.id });
    io.to('delivery_portal').emit('order_assigned', { orderRef: req.params.orderRef });
    res.json({ success:true, order });
  });

  app.post('/api/delivery/orders/:orderRef/delivered', authMiddleware(['delivery']), (req: any, res: Response) => {
    const result = stmts.deliveryComplete.run({ deliveryUserId: req.user.id, orderRef: req.params.orderRef, now: now() });
    if ((result as any).changes === 0) return res.status(409).json({ error:'Not your order' });
    io.to(req.params.orderRef).emit('order_status', { orderRef: req.params.orderRef, status:'DELIVERED' });
    io.to('admin_dashboard').emit('order_updated', { orderRef: req.params.orderRef, status:'DELIVERED' });
    res.json({ success:true });
  });

  // ── ADMIN: Orders & Stats ─────────────────────────────────────
  app.get('/api/admin/orders', authMiddleware(['admin']), (_req, res) => {
    res.json((stmts.getAllOrders.all() as any[]).map(o => ({ ...o, items: stmts.getOrderItems.all(o.id) })));
  });

  app.get('/api/admin/stats', authMiddleware(['admin']), (_req, res) => {
    res.json({ stats: stmts.getStats.get(), topItems: stmts.getTopItems.all() });
  });

  app.patch('/api/admin/orders/:orderRef/status', authMiddleware(['admin']), (req: Request, res: Response) => {
    const { status } = req.body;
    stmts.updateOrderStatus.run({ status, orderRef: req.params.orderRef, now: now() });
    io.to(req.params.orderRef).emit('order_status', { orderRef: req.params.orderRef, status });
    io.to('admin_dashboard').emit('order_updated', { orderRef: req.params.orderRef, status });
    res.json({ success:true });
  });

  // ── RATING ────────────────────────────────────────────────────
  app.post('/api/orders/:orderRef/rate', (req: Request, res: Response) => {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error:'Rating must be 1-5' });
    stmts.updateRating.run({ rating, comment: comment||'', orderRef: req.params.orderRef });
    io.to('admin_dashboard').emit('order_rated', { orderRef: req.params.orderRef, rating, comment: comment||'' });
    res.json({ success:true });
  });

  // ── CHAT ──────────────────────────────────────────────────────
  app.get('/api/chat/:orderRef', (req: Request, res: Response) => {
    res.json(stmts.getChatByOrder.all(req.params.orderRef));
  });

  // ── EXCEL EXPORT ──────────────────────────────────────────────
  app.get('/api/admin/export/excel', authMiddleware(['admin']), async (_req, res: Response) => {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Mr. Wok POS v3';
    wb.created = new Date();

    const styleHeader = (ws: ExcelJS.Worksheet, cols: any[], color = 'FFFF4500') => {
      ws.columns = cols;
      ws.getRow(1).eachCell(c => {
        c.fill = { type:'pattern', pattern:'solid', fgColor:{ argb:color } };
        c.font = { bold:true, color:{ argb:'FFFFFFFF' }, size:11 };
        c.alignment = { vertical:'middle', horizontal:'center' };
      });
      ws.getRow(1).height = 28;
    };

    // Staff name lookup
    const allStaff = db.prepare('SELECT id, displayName FROM users').all() as any[];
    const staffMap: Record<string, string> = {};
    allStaff.forEach((u: any) => { staffMap[u.id] = u.displayName || u.id; });

    const statusColors: Record<string, string> = {
      PENDING:'FFFFF3CD', ACCEPTED:'FFCCE5FF', READY_FOR_DELIVERY:'FFFFE0B2',
      OUT_FOR_DELIVERY:'FFFFE0B2', DELIVERED:'FFD4EDDA', CANCELLED:'FFF8D7DA',
    };

    // ── Sheet 1: Orders ──────────────────────────────────────────
    const ws1 = wb.addWorksheet('Orders', { views:[{ state:'frozen', ySplit:1 }] });
    styleHeader(ws1, [
      { header:'Order Ref',        key:'orderRef',        width:22 },
      { header:'Date Placed',      key:'datePlaced',      width:26 },
      { header:'Customer',         key:'customerName',    width:20 },
      { header:'Phone',            key:'customerPhone',   width:16 },
      { header:'Type',             key:'orderType',       width:13 },
      { header:'Area / Branch',    key:'location',        width:24 },
      { header:'Payment',          key:'paymentMethod',   width:20 },
      { header:'Cook',             key:'cookName',        width:18 },
      { header:'Driver',           key:'driverName',      width:18 },
      { header:'Total (EGP)',      key:'total',           width:14 },
      { header:'Status',           key:'status',          width:18 },
      { header:'Time Placed',      key:'timePlaced',      width:13 },
      { header:'Accepted At',      key:'acceptedAt',      width:13 },
      { header:'Prepared At',      key:'preparedAt',      width:13 },
      { header:'Picked Up At',     key:'pickedUpAt',      width:13 },
      { header:'Delivered At',     key:'deliveredAt',     width:13 },
      { header:'Wait for Cook',    key:'waitForCook',     width:14 },
      { header:'Prep Time',        key:'prepTime',        width:12 },
      { header:'Delivery Time',    key:'deliveryTime',    width:14 },
      { header:'Total Order Time', key:'totalTime',       width:16 },
      { header:'Rating',           key:'rating',          width:10 },
      { header:'Review',           key:'ratingComment',   width:32 },
    ]);

    const orders = stmts.getAllOrders.all() as any[];
    orders.forEach((o, i) => {
      const cookName   = o.cookId         ? (staffMap[o.cookId]         || o.cookId)         : '–';
      const driverName = o.deliveryUserId ? (staffMap[o.deliveryUserId] || o.deliveryUserId) : '–';
      const location   = o.orderType === 'DELIVERY'
        ? `${o.deliveryArea||''} – ${o.streetAddress||''}`
        : (o.branchName || '');

      const row = ws1.addRow({
        orderRef:      o.orderRef,
        datePlaced:    fmtFull(o.createdAt),
        customerName:  o.customerName  || '–',
        customerPhone: o.customerPhone || '–',
        orderType:     (o.orderType||'').replace(/_/g, ' '),
        location,
        paymentMethod: (o.paymentMethod||'').replace(/_/g, ' '),
        cookName,
        driverName,
        total:         o.total || 0,
        status:        o.status || '–',
        timePlaced:    fmtTime(o.createdAt),
        acceptedAt:    fmtTime(o.acceptedByAt),
        preparedAt:    fmtTime(o.preparedAt),
        pickedUpAt:    fmtTime(o.pickedUpAt),
        deliveredAt:   fmtTime(o.deliveredAt),
        waitForCook:   diffMins(o.createdAt,    o.acceptedByAt),
        prepTime:      diffMins(o.acceptedByAt, o.preparedAt),
        deliveryTime:  diffMins(o.pickedUpAt,   o.deliveredAt),
        totalTime:     diffMins(o.createdAt,    o.deliveredAt || o.preparedAt),
        rating:        o.rating ? '★'.repeat(o.rating)+'☆'.repeat(5-o.rating) : '–',
        ratingComment: o.ratingComment || '',
      });

      if (i % 2 === 0) row.eachCell(c => { c.fill = { type:'pattern', pattern:'solid', fgColor:{ argb:'FFF9F9F9' } }; });
      const sc = row.getCell('status');
      sc.fill = { type:'pattern', pattern:'solid', fgColor:{ argb: statusColors[o.status] || 'FFFFFFFF' } };
      sc.font = { bold:true };
      row.getCell('total').numFmt = '#,##0.00 "EGP"';
    });
    ws1.autoFilter = { from:{ row:1, column:1 }, to:{ row:1, column:22 } };

    // ── Sheet 2: Order Items ─────────────────────────────────────
    const ws2 = wb.addWorksheet('Order Items', { views:[{ state:'frozen', ySplit:1 }] });
    styleHeader(ws2, [
      { header:'Order Ref',   key:'orderRef',  width:22 },
      { header:'Item',        key:'itemName',  width:30 },
      { header:'Category',    key:'category',  width:16 },
      { header:'Qty',         key:'quantity',  width:8  },
      { header:'Unit Price',  key:'unitPrice', width:16 },
      { header:'Line Total',  key:'lineTotal', width:16 },
    ], 'FF1A1A2E');
    (db.prepare("SELECT * FROM order_items ORDER BY orderRef").all() as any[]).forEach((item, i) => {
      const row = ws2.addRow(item);
      if (i % 2 === 0) row.eachCell(c => { c.fill = { type:'pattern', pattern:'solid', fgColor:{ argb:'FFF9F9F9' } }; });
      row.getCell('unitPrice').numFmt = '#,##0.00 "EGP"';
      row.getCell('lineTotal').numFmt = '#,##0.00 "EGP"';
    });

    // ── Sheet 3: Employee Sessions ───────────────────────────────
    const ws3 = wb.addWorksheet('Employee Sessions');
    styleHeader(ws3, [
      { header:'ID',         key:'userId',      width:14 },
      { header:'Name',       key:'displayName', width:22 },
      { header:'Role',       key:'role',        width:12 },
      { header:'Login',      key:'loginAt',     width:24 },
      { header:'Logout',     key:'logoutAt',    width:24 },
      { header:'Duration',   key:'duration',    width:14 },
    ], 'FF2D6A4F');
    (stmts.getSessionHistory.all() as any[]).forEach((s, i) => {
      const row = ws3.addRow({
        userId:      s.userId,
        displayName: s.displayName || s.username,
        role:        s.role,
        loginAt:     fmtFull(s.loginAt),
        logoutAt:    s.logoutAt ? fmtFull(s.logoutAt) : 'Active',
        duration:    s.logoutAt ? diffMins(s.loginAt, s.logoutAt) : 'Active',
      });
      if (i % 2 === 0) row.eachCell(c => { c.fill = { type:'pattern', pattern:'solid', fgColor:{ argb:'FFF9F9F9' } }; });
    });

    // ── Sheet 4: Break Log ───────────────────────────────────────
    const ws4 = wb.addWorksheet('Break Log');
    styleHeader(ws4, [
      { header:'Staff ID',       key:'userId',      width:14 },
      { header:'Name',           key:'displayName', width:22 },
      { header:'Role',           key:'role',        width:12 },
      { header:'Break Start',    key:'breakStart',  width:24 },
      { header:'Break End',      key:'breakEnd',    width:24 },
      { header:'Break Duration', key:'duration',    width:16 },
    ], 'FF6A0DAD');

    const breakLogs = db.prepare(`
      SELECT b.*, u.displayName, u.role FROM break_logs b
      LEFT JOIN users u ON b.userId=u.id ORDER BY b.breakStart DESC
    `).all() as any[];

    if (!breakLogs.length) {
      ws4.addRow({ userId: 'No break records yet' });
    } else {
      breakLogs.forEach((b, i) => {
        const row = ws4.addRow({
          userId:      b.userId,
          displayName: b.displayName || b.userId,
          role:        b.role || '–',
          breakStart:  fmtFull(b.breakStart),
          breakEnd:    b.breakEnd ? fmtFull(b.breakEnd) : 'Still on break',
          duration:    b.breakEnd ? diffMins(b.breakStart, b.breakEnd) : 'Ongoing',
        });
        if (i % 2 === 0) row.eachCell(c => { c.fill = { type:'pattern', pattern:'solid', fgColor:{ argb:'FFF9F9F9' } }; });
      });

      // Summary per staff
      ws4.addRow({});
      const hdr = ws4.addRow({ userId:'SUMMARY BY STAFF MEMBER' });
      hdr.font = { bold:true, color:{ argb:'FF6A0DAD' } };

      const summary = db.prepare(`
        SELECT b.userId, u.displayName, u.role,
               COUNT(*) as totalBreaks,
               SUM(CASE WHEN b.breakEnd IS NOT NULL
                 THEN CAST((julianday(b.breakEnd)-julianday(b.breakStart))*1440 AS INTEGER)
                 ELSE 0 END) as totalMins
        FROM break_logs b LEFT JOIN users u ON b.userId=u.id
        GROUP BY b.userId ORDER BY u.displayName
      `).all() as any[];

      summary.forEach((s, i) => {
        const h = Math.floor((s.totalMins||0) / 60), m = (s.totalMins||0) % 60;
        const row = ws4.addRow({
          userId:      s.userId,
          displayName: s.displayName || s.userId,
          role:        s.role || '–',
          breakStart:  `${s.totalBreaks} break${s.totalBreaks !== 1 ? 's' : ''}`,
          breakEnd:    'Total break time →',
          duration:    h > 0 ? `${h}h ${m}m` : `${m} min`,
        });
        row.font = { bold:true };
        if (i % 2 === 0) row.eachCell(c => { c.fill = { type:'pattern', pattern:'solid', fgColor:{ argb:'FFE8D5F5' } }; });
      });
    }

    // ── Sheet 5: Summary Stats ───────────────────────────────────
    const ws5 = wb.addWorksheet('Summary');
    ws5.getColumn('A').width = 28; ws5.getColumn('B').width = 22;
    ws5.mergeCells('A1:B1');
    const tc = ws5.getCell('A1');
    tc.value = 'Mr. Wok — Report Summary';
    tc.font = { bold:true, size:16, color:{ argb:'FFFF4500' } };
    tc.alignment = { horizontal:'center' };
    ws5.getCell('A2').value = `Generated: ${fmtFull(now())}`;
    ws5.getCell('A2').font = { italic:true, color:{ argb:'FF888888' } };
    const sd = stmts.getStats.get() as any;
    const rows5: [string, any, string?][] = [
      ['Total Orders',    sd.totalOrders],
      ['Total Revenue',   sd.totalRevenue,   '#,##0.00 "EGP"'],
      ['Avg Order Value', sd.avgOrderValue,  '#,##0.00 "EGP"'],
      ['Avg Rating',      sd.avgRating ? sd.avgRating.toFixed(1)+' / 5' : 'N/A'],
      ['Pending',         sd.pending],
      ['Accepted',        sd.accepted],
      ['Ready',           sd.ready],
      ['Out for Delivery',sd.outForDelivery],
      ['Delivered',       sd.delivered],
      ['Cancelled',       sd.cancelled],
      ['Delivery Orders', sd.deliveryOrders],
      ['Dine-In Orders',  sd.dineInOrders],
      ['Takeaway Orders', sd.takeawayOrders],
    ];
    rows5.forEach(([l, v, f], i) => {
      ws5.getCell(`A${i+4}`).value = l; ws5.getCell(`A${i+4}`).font = { bold:true };
      ws5.getCell(`B${i+4}`).value = v;
      if (f) ws5.getCell(`B${i+4}`).numFmt = f;
    });

    const filename = `mrwok_report_${new Date().toISOString().slice(0,10)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    await wb.xlsx.write(res);
    res.end();
  });

  // ═══════════════════════════════════════════════════════════════
  // SOCKET.IO
  // ═══════════════════════════════════════════════════════════════
  io.on('connection', (socket: Socket) => {
    socket.on('join_tracking', (orderRef: string) => {
      socket.join(orderRef);
      const order = stmts.getOrderByRef.get(orderRef) as any;
      if (order) socket.emit('order_status', { orderRef, status: order.status, deliveryLat: order.deliveryLat, deliveryLng: order.deliveryLng });
    });

    socket.on('join_admin', (token: string) => {
      try { const d = jwt.verify(token, JWT_SECRET) as any; if (d.role === 'admin') socket.join('admin_dashboard'); } catch {}
    });

    socket.on('join_cook', (token: string) => {
      try { const d = jwt.verify(token, JWT_SECRET) as any; if (d.role === 'cook') { socket.join('cook_portal'); socket.data.userId = d.id; } } catch {}
    });

    socket.on('join_delivery', (token: string) => {
      try { const d = jwt.verify(token, JWT_SECRET) as any; if (d.role === 'delivery') { socket.join('delivery_portal'); socket.data.userId = d.id; } } catch {}
    });

    socket.on('delivery_location', (data: { orderRef: string, lat: number, lng: number, token: string }) => {
      try {
        jwt.verify(data.token, JWT_SECRET);
        stmts.updateDeliveryLoc.run({ lat: data.lat, lng: data.lng, orderRef: data.orderRef, now: now() });
        io.to(data.orderRef).emit('driver_location', { lat: data.lat, lng: data.lng });
        io.to('admin_dashboard').emit('driver_location_update', { orderRef: data.orderRef, lat: data.lat, lng: data.lng });
      } catch {}
    });

    socket.on('chat_message', (data: { orderRef: string, message: string, senderRole: string, senderId: string, senderName: string, token?: string }) => {
      try {
        if (!data.orderRef || !data.message) return;
        if (data.senderRole !== 'customer') {
          if (!data.token) return;
          jwt.verify(data.token, JWT_SECRET);
        }
        const msg = { orderRef: data.orderRef, senderRole: data.senderRole, senderId: data.senderId || 'customer', senderName: data.senderName || 'Customer', message: data.message.slice(0, 500) };
        stmts.insertChat.run(msg);
        const outMsg = { ...msg, sentAt: now() };
        io.to(data.orderRef).emit('chat_message', outMsg);
        if (data.senderRole === 'customer') io.to('delivery_portal').emit('chat_message', outMsg);
      } catch {}
    });
  });

  // 5-minute unaccepted order alert
  setInterval(() => {
    (stmts.getUnalertedStale.all() as any[]).forEach(order => {
      stmts.markAlertSent.run({ orderRef: order.orderRef });
      io.to('admin_dashboard').emit('order_alert', { orderRef: order.orderRef, message: `⚠️ Order ${order.orderRef} has no cook for 5+ minutes!` });
      io.to('cook_portal').emit('urgent_order', order);
    });
  }, 30000);

  // ── Vite Dev / Static Prod ─────────────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api') && !['/admin','/cook','/delivery'].includes(req.path))
        res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🍜  Mr. Wok v3  →  http://localhost:${PORT}`);
    console.log(`📊  Admin        →  http://localhost:${PORT}/admin  (mr.wok / 1234)`);
    console.log(`👨‍🍳  Cook         →  http://localhost:${PORT}/cook`);
    console.log(`🛵  Delivery     →  http://localhost:${PORT}/delivery\n`);
  });
}

startServer();
