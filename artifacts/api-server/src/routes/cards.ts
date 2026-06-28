import { Router, type IRouter } from "express";
import { db, cardsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  ListCardsQueryParams,
  CreateCardsBody,
  DeleteCardParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/cards", async (req, res): Promise<void> => {
  const params = ListCardsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const cards = await db
    .select()
    .from(cardsTable)
    .where(eq(cardsTable.productId, params.data.productId))
    .orderBy(cardsTable.createdAt);

  res.json(
    cards.map((c) => ({
      id: c.id,
      productId: c.productId,
      content: c.content,
      sold: c.sold,
      createdAt: c.createdAt.toISOString(),
    }))
  );
});

router.post("/cards", async (req, res): Promise<void> => {
  const parsed = CreateCardsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { productId, contents } = parsed.data;

  const rows = contents
    .filter((c) => c.trim().length > 0)
    .map((content) => ({ productId, content: content.trim() }));

  if (rows.length === 0) {
    res.status(400).json({ error: "No valid card contents provided" });
    return;
  }

  await db.insert(cardsTable).values(rows);

  res.status(201).json({ added: rows.length });
});

router.delete("/cards/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteCardParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(cardsTable).where(and(eq(cardsTable.id, params.data.id), eq(cardsTable.sold, false)));
  res.sendStatus(204);
});

export default router;
