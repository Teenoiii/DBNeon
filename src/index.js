require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const app = express();

const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));


app.use(
  cors({
    origin: (origin, cb) => {
      const allowed = (process.env.CORS_ORIGIN || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      // allow tools like curl/postman (no origin)
      if (!origin) return cb(null, true);
      if (allowed.length === 0 || allowed.includes(origin))
        return cb(null, true);
      return cb(new Error("Not allowed by CORS: " + origin));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "2mb" }));

// Attach prisma to req for convenience
app.use((req, _res, next) => {
  req.prisma = prisma;
  next();
});

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/spin", require("./routes/spin"));
app.use("/api/items", require("./routes/items"));
app.use("/api/admin", require("./routes/admin"));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
