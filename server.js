import express from "express";
import cors from "cors";
import { config } from "./config.js";
import comicRouter from "./routes/comic.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "ComicCraft API",
    time: new Date().toISOString()
  });
});

app.use("/api/comic", comicRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Unexpected server error." });
});

app.listen(config.port, () => {
  console.log(`ComicCraft API running at http://localhost:${config.port}`);
});
