// server/src/index.js
require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();

// ====== Core middleware ======
const allowOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowOrigins.length ? allowOrigins : true,
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.set("trust proxy", 1); // เผื่ออยู่หลัง proxy อย่าง Render

// inject prisma ให้ทุก route ใช้ผ่าน req.prisma
app.use((req, _res, next) => {
  req.prisma = prisma;
  next();
});

// เสิร์ฟไฟล์อัปโหลด (หมายเหตุ: บน Render เป็นไฟล์ชั่วคราว)
const uploadsDir = path.join(__dirname, "..", "..", "uploads");
app.use("/uploads", express.static(uploadsDir));

// ====== Health & Root ======
app.get("/", (_req, res) => {
  res.send("API is running");
});

app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

// ====== Routers ======
const authRouter = require("./auth");
const itemsRouter = require("./items");
const spinRouter = require("./spin");
const adminRouter = require("./admin");

app.use("/api/auth", authRouter);
app.use("/api/items", itemsRouter);
app.use("/api/spin", spinRouter);
app.use("/api/admin", adminRouter);

// ====== 404 & Error handler ======
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "Not found" });
  }
  return next();
});

app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// ====== Start ======
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log("API running on", PORT));
