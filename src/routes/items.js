const express = require("express");
const { requireAuth } = require("../middleware/auth");
const router = express.Router();

// Public: list enabled items for UI
router.get("/", async (req, res) => {
  const items = await req.prisma.item.findMany({
    where: { isEnabled: true },
    orderBy: { id: "asc" },
  });
  res.json({ items });
});

// User: recent spin history
router.get("/history", requireAuth, async (req, res) => {
  const spins = await req.prisma.spinHistory.findMany({
    where: { userId: req.user.id },
    include: { item: true },
    orderBy: { id: "desc" },
    take: 20,
  });
  res.json({ spins });
});

// ✅ ล้างประวัติการสุ่มของผู้ใช้ปัจจุบัน
router.delete("/history", requireAuth, async (req, res) => {
  try {
    const result = await req.prisma.spinHistory.deleteMany({
      where: { userId: req.user.id },
    });
    res.json({ deleted: result.count });
  } catch (err) {
    console.error("DELETE /items/history error:", err);
    res.status(500).json({ error: "ล้างประวัติไม่สำเร็จ" });
  }
});

module.exports = router;
