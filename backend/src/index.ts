import express from "express";
import cors from "cors";
import { usersRouter } from "./routes/users.routes";
import { foodsRouter } from "./routes/foods.routes";
import { mealsRouter } from "./routes/meals.routes";
import { favoritesRouter } from "./routes/favorites.routes";
import { dashboardRouter } from "./routes/dashboard.routes";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/users", usersRouter);
app.use("/api/foods", foodsRouter);
app.use("/api/meals", mealsRouter);
app.use("/api/favorites", favoritesRouter);
app.use("/api/dashboard", dashboardRouter);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => console.log(`forme backend listening on http://localhost:${port}`));
