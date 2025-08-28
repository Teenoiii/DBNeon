// อยู่บนสุดตามโปรเจกต์คุณ
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();

app.use(
  cors({
    origin:
      (process.env.CORS_ORIGIN || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean) || true,
    credentials: true,
  })
);
app.use(express.json());

// ✅ root ให้ตอบข้อความธรรมดา
app.get("/", (_req, res) => {
  res.send("API is running");
});

// ✅ health-check เช็ค DB
app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

// (routes อื่น ๆ ของคุณ)

// start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log("API running on", PORT));
