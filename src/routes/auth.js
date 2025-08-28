const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Missing fields" });
  const existing = await req.prisma.user.findUnique({ where: { username } });
  if (existing) return res.status(400).json({ error: "User exists" });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await req.prisma.user.create({
    data: { username, passwordHash },
  });
  res.json({ id: user.id });
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await req.prisma.user.findUnique({ where: { username } });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });
  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      points: user.points,
    },
  });
});

// GET /api/auth/me
router.get("/me", async (req, res) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.json({ user: null });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await req.prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, username: true, role: true, points: true },
    });
    res.json({ user });
  } catch {
    res.json({ user: null });
  }
});

module.exports = router;
