// server/src/index.js
require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();

// ===== CORS & body =====
const allowOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({ origin: allowOrigins.length ? allowOrigins : true, credentials: true })
);
app.use(express.json({ limit: "2mb" }));

// inject prisma ให้ทุก route ใช้ได้ผ่าน req.prisma
app.use((req, _res, next) => {
  req.prisma = prisma;
  next();
});

// เสิร์ฟไฟล์อัปโหลด (บน Render ไฟล์เป็นชั่วคราว)
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// ===== Root & health =====
app.get("/", (_req, res) => res.send("API is running"));
app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

// ===== Routers =====
const authRouter = require("./routes/auth");
const itemsRouter = require("./routes/items");
const spinRouter = require("./routes/spin");
const adminRouter = require("./routes/admin");

app.use("/api/auth", authRouter);
app.use("/api/items", itemsRouter);
app.use("/api/spin", spinRouter);
app.use("/api/admin", adminRouter);

// ===== 404 & error =====
app.use((req, res, next) => {
  if (req.path.startsWith("/api/"))
    return res.status(404).json({ error: "Not found" });
  next();
});
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// ===== Start =====
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log("API running on", PORT));
