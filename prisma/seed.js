const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  await prisma.config.create({
    data: {
      spinCost: 50,
      title: "STAR COMEBACK",
      subtitle: "เริ่มต้นครั้งละ 50 Point",
    },
  });

  const items = [
    {
      name: "CAR SPLAID",
      imageUrl: "https://picsum.photos/seed/carsplaid/300/300",
      rarity: "gold",
      weight: 1,
      stock: 1,
    },
    {
      name: "FASHION NORMAL CARD x15",
      imageUrl: "https://picsum.photos/seed/fcard/300/300",
      rarity: "purple",
      weight: 20,
      stock: 9999,
    },
    {
      name: "SKIN NEKO BLACK",
      imageUrl: "https://picsum.photos/seed/neko/300/300",
      rarity: "purple",
      weight: 5,
      stock: 5,
    },
    {
      name: "JADE x80",
      imageUrl: "https://picsum.photos/seed/jade/300/300",
      rarity: "green",
      weight: 25,
      stock: 9999,
    },
    {
      name: "ARMOR x150",
      imageUrl: "https://picsum.photos/seed/armor/300/300",
      rarity: "purple",
      weight: 3,
      stock: 150,
    },
    {
      name: "RUBY x35",
      imageUrl: "https://picsum.photos/seed/ruby/300/300",
      rarity: "purple",
      weight: 18,
      stock: 9999,
    },
    {
      name: "VIBRANIUM x15",
      imageUrl: "https://picsum.photos/seed/vib/300/300",
      rarity: "red",
      weight: 8,
      stock: 500,
    },
    {
      name: "AMMO x180",
      imageUrl: "https://picsum.photos/seed/ammo/300/300",
      rarity: "bronze",
      weight: 30,
      stock: 9999,
    },
    {
      name: "DIAMOND x80",
      imageUrl: "https://picsum.photos/seed/diamond/300/300",
      rarity: "blue",
      weight: 12,
      stock: 2000,
    },
    {
      name: "WEAPON BOX x85",
      imageUrl: "https://picsum.photos/seed/wbox/300/300",
      rarity: "red",
      weight: 6,
      stock: 300,
    },
    {
      name: "FASHION GOLD CARD x12",
      imageUrl: "https://picsum.photos/seed/fgold/300/300",
      rarity: "gold",
      weight: 2,
      stock: 12,
    },
    {
      name: "CASH $45000",
      imageUrl: "https://picsum.photos/seed/cash/300/300",
      rarity: "silver",
      weight: 10,
      stock: 45,
    },
  ];
  for (const it of items) await prisma.item.create({ data: it });

  const bcrypt = require("bcryptjs");
  const hash = await bcrypt.hash("admin123", 10);
  await prisma.user.create({
    data: { username: "admin", passwordHash: hash, role: "admin", points: 0 },
  });

  console.log("Seeded. Admin = admin / admin123");
}

main().finally(() => prisma.$disconnect());
