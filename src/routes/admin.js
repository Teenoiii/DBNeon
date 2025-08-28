const express = require("express");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const router = express.Router();
const multer = require("multer");
const { v4: uuid } = require("uuid");
const path = require("path");

router.use(requireAuth); // มี JWT แล้ว
router.use(async (req, res, next) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ error: "admin only" });
  next();
});

// ----- CONFIG -----
router.get("/config", async (req, res) => {
  const config = await req.prisma.config.findFirst({ orderBy: { id: "desc" } });
  res.json({ config });
});

router.post("/config", async (req, res) => {
  const config = await req.prisma.config.upsert({
    where: { id: req.body.id || 1 },
    update: {
      spinCost: Number(req.body.spinCost || 50),
      title: req.body.title || null,
      subtitle: req.body.subtitle || null,
    },
    create: {
      spinCost: Number(req.body.spinCost || 50),
      title: req.body.title || null,
      subtitle: req.body.subtitle || null,
    },
  });
  res.json({ config });
});

// ----- ITEMS CRUD -----
router.get("/items", async (req, res) => {
  const items = await req.prisma.item.findMany({ orderBy: { id: "asc" } });
  res.json({ items });
});

router.post("/items", async (req, res) => {
  const payload = {
    name: req.body.name,
    imageUrl: req.body.imageUrl,
    rarity: req.body.rarity || "common",
    weight: Number(req.body.weight || 0),
    isEnabled: Boolean(req.body.isEnabled ?? true),
    stock:
      req.body.stock === null || req.body.stock === ""
        ? null
        : Number(req.body.stock),
  };
  const created = await req.prisma.item.create({ data: payload });
  res.json({ item: created });
});

router.put("/items/:id", async (req, res) => {
  const id = Number(req.params.id);
  const patch = {};
  ["name", "imageUrl", "rarity", "isEnabled"].forEach((k) => {
    if (req.body[k] !== undefined) patch[k] = req.body[k];
  });
  if (req.body.weight !== undefined) patch.weight = Number(req.body.weight);
  if (req.body.stock !== undefined) {
    patch.stock = req.body.stock === "" ? null : Number(req.body.stock);
  }
  const updated = await req.prisma.item.update({ where: { id }, data: patch });
  res.json({ item: updated });
});

router.delete("/items/:id", async (req, res) => {
  const id = Number(req.params.id);
  await req.prisma.item.delete({ where: { id } });
  res.json({ ok: true });
});

// ----- USERS (for dropdown) -----
router.get("/users", async (req, res) => {
  const users = await req.prisma.user.findMany({
    select: { id: true, username: true, points: true, role: true },
    orderBy: { id: "asc" },
  });
  res.json({ users });
});

// ----- GRANT POINTS + HISTORY -----
router.post("/grant-points", async (req, res) => {
  const userId = Number(req.body.userId);
  const amount = Number(req.body.amount);
  if (!userId || !amount)
    return res.status(400).json({ error: "userId/amount required" });

  const result = await req.prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { points: { increment: amount } },
    });
    const rec = await tx.pointsGrant.create({
      data: { userId, adminId: req.user.id, amount },
    });
    return rec;
  });

  res.json({ grant: result });
});

router.get("/grants", async (req, res) => {
  const rows = await req.prisma.pointsGrant.findMany({
    orderBy: { id: "desc" },
    include: {
      user: { select: { id: true, username: true } },
      admin: { select: { id: true, username: true } },
    },
    take: 200,
  });
  res.json({ grants: rows });
});

// ----- RATES (ตาม weight) -----
router.get("/rates", async (req, res) => {
  const items = await req.prisma.item.findMany({ where: { isEnabled: true } });
  const total = items.reduce((s, it) => s + (Number(it.weight) || 0), 0) || 1;
  const rows = items.map((it) => ({
    id: it.id,
    name: it.name,
    weight: it.weight,
    rarity: it.rarity,
    percent: Math.round(((Number(it.weight) || 0) / total) * 10000) / 100, // ทศนิยม 2 ตำแหน่ง
  }));
  res.json({ totalWeight: total, rates: rows });
});

// ----- SPIN HISTORY (ทั้งหมด) -----
router.get("/spins", async (req, res) => {
  const page = Number(req.query.page || 1);
  const size = Number(req.query.size || 50);
  const skip = (page - 1) * size;

  const [rows, count] = await Promise.all([
    req.prisma.spinHistory.findMany({
      orderBy: { id: "desc" },
      include: {
        user: { select: { id: true, username: true } },
        item: { select: { id: true, name: true } },
      },
      take: size,
      skip,
    }),
    req.prisma.spinHistory.count(),
  ]);

  res.json({ page, size, total: count, spins: rows });
});

// ---------- Upload config ----------
const storage = multer.diskStorage({
  destination: (req, file, cb) =>
    cb(null, path.join(__dirname, "..", "..", "uploads")),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    cb(null, `item_${uuid().slice(0, 8)}${ext || ".png"}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const ok = /image\/(png|jpg|jpeg|webp|gif)/i.test(file.mimetype);
    cb(ok ? null : new Error("Invalid file type"), ok);
  },
});

// ---------- POST /api/admin/upload ----------
router.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file" });
  const url = `${req.protocol}://${req.get("host")}/uploads/${
    req.file.filename
  }`;
  res.json({ url, filename: req.file.filename });
});

module.exports = router;
