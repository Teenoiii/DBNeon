const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { weightedDraw } = require("../utils/draw");
const router = express.Router();

router.post("/", requireAuth, async (req, res) => {
  try {
    // 1) อ่าน config
    const cfg = await req.prisma.config.findFirst({ orderBy: { id: "desc" } });
    if (!cfg) {
      console.error("SPIN ERROR: No config row found");
      return res.status(500).json({ error: "Config not found" });
    }
    const spinCost = Number(cfg.spinCost ?? 50);

    // 2) อ่านผู้ใช้
    const user = await req.prisma.user.findUnique({
      where: { id: req.user.id },
    });
    if (!user) {
      console.error("SPIN ERROR: user not found", req.user);
      return res.status(401).json({ error: "User not found" });
    }
    if (user.points < spinCost) {
      return res.status(400).json({ error: "Not enough points" });
    }

    // 3) ดึงไอเท็มที่ใช้สุ่มได้
    const items = await req.prisma.item.findMany({
      where: {
        isEnabled: true,
        OR: [{ stock: null }, { stock: { gt: 0 } }],
      },
      orderBy: { id: "asc" },
    });
    if (!items.length) {
      console.error("SPIN ERROR: no available items");
      return res.status(400).json({ error: "No items available" });
    }

    // 4) สุ่มแบบถ่วงน้ำหนัก
    const drawn = weightedDraw(
      items.map((i) => ({ id: i.id, weight: Number(i.weight || 0) }))
    );
    if (!drawn) {
      console.error("SPIN ERROR: weightedDraw returned null");
      return res.status(500).json({ error: "Draw failed" });
    }
    const prize = items.find((i) => i.id === drawn.id);
    if (!prize) {
      console.error("SPIN ERROR: prize not found after draw", drawn);
      return res.status(500).json({ error: "Prize not found" });
    }

    // 5) ทำธุรกรรม
    const result = await req.prisma.$transaction(async (tx) => {
      // หักแต้ม
      await tx.user.update({
        where: { id: user.id },
        data: { points: { decrement: spinCost } },
      });

      // ลดสต็อกเฉพาะกรณีมีสต็อกจำกัด (ไม่ใช่ null)
      if (prize.stock !== null && prize.stock !== undefined) {
        await tx.item.update({
          where: { id: prize.id },
          data: { stock: { decrement: 1 } },
        });
      }

      // บันทึกประวัติ
      await tx.spinHistory.create({
        data: {
          userId: user.id,
          itemId: prize.id,
          spent: spinCost,
        },
      });

      // เอาคะแนนคงเหลือกลับไปให้หน้าเว็บ
      const refreshed = await tx.user.findUnique({
        where: { id: user.id },
        select: { points: true },
      });
      return { remainingPoints: refreshed.points };
    });

    // 6) ส่งผลลัพธ์
    res.json({
      prize: {
        id: prize.id,
        name: prize.name,
        imageUrl: prize.imageUrl,
        rarity: prize.rarity,
      },
      points: result.remainingPoints,
    });
  } catch (err) {
    console.error("SPIN ERROR (catch):", err);
    res.status(500).json({ error: "Internal error at /api/spin" });
  }
});

module.exports = router;
