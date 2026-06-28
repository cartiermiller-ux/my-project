import { Router, type IRouter } from "express";
import { db, ordersTable, cardsTable, productsTable, usersTable } from "@workspace/db";
import { eq, and, inArray, desc } from "drizzle-orm";
import {
  CreateOrderBody,
  GetOrderParams,
  ListAllOrdersQueryParams,
} from "@workspace/api-zod";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

function formatOrder(o: typeof ordersTable.$inferSelect, productName?: string | null) {
  return {
    id: o.id,
    userId: o.userId ?? null,
    productId: o.productId,
    productName: productName ?? null,
    quantity: o.quantity,
    totalPrice: parseFloat(o.totalPrice),
    status: o.status,
    cardContents: o.cardContents ?? null,
    email: o.email ?? null,
    createdAt: o.createdAt.toISOString(),
  };
}

router.get("/orders", async (req, res): Promise<void> => {
  const userId = req.session.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const orders = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.userId, userId))
    .orderBy(desc(ordersTable.createdAt));

  const productIds = [...new Set(orders.map((o) => o.productId))];
  const products = productIds.length > 0
    ? await db.select().from(productsTable).where(inArray(productsTable.id, productIds))
    : [];
  const productMap = new Map(products.map((p) => [p.id, p.name]));

  res.json(orders.map((o) => formatOrder(o, productMap.get(o.productId))));
});

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = req.session.userId;
  const { productId, quantity, email } = parsed.data;

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId));
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const availableCards = await db
    .select()
    .from(cardsTable)
    .where(and(eq(cardsTable.productId, productId), eq(cardsTable.sold, false)))
    .limit(quantity);

  if (availableCards.length < quantity) {
    res.status(400).json({ error: "Insufficient stock" });
    return;
  }

  const totalPrice = parseFloat(product.price) * quantity;

  if (userId) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    if (parseFloat(user.balance) < totalPrice) {
      res.status(400).json({ error: "Insufficient balance" });
      return;
    }
    await db
      .update(usersTable)
      .set({ balance: String(parseFloat(user.balance) - totalPrice) })
      .where(eq(usersTable.id, userId));
  }

  const cardIds = availableCards.map((c) => c.id);
  await db
    .update(cardsTable)
    .set({ sold: true })
    .where(inArray(cardsTable.id, cardIds));

  await db
    .update(productsTable)
    .set({ salesCount: product.salesCount + quantity })
    .where(eq(productsTable.id, productId));

  const cardContents = availableCards.map((c) => c.content).join("\n");

  const [order] = await db
    .insert(ordersTable)
    .values({
      userId: userId ?? null,
      productId,
      quantity,
      totalPrice: String(totalPrice),
      status: "completed",
      cardContents,
      email: email ?? null,
    })
    .returning();

  res.status(201).json(formatOrder(order, product.name));
});

router.get("/orders/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetOrderParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, params.data.id));
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, order.productId));

  res.json(formatOrder(order, product?.name));
});

router.get("/admin/orders", async (req, res): Promise<void> => {
  const params = ListAllOrdersQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const limitVal = params.data.limit ?? 50;

  const orders = await db
    .select()
    .from(ordersTable)
    .orderBy(desc(ordersTable.createdAt))
    .limit(limitVal);

  const productIds = [...new Set(orders.map((o) => o.productId))];
  const products = productIds.length > 0
    ? await db.select().from(productsTable).where(inArray(productsTable.id, productIds))
    : [];
  const productMap = new Map(products.map((p) => [p.id, p.name]));

  res.json(orders.map((o) => formatOrder(o, productMap.get(o.productId))));
});

export default router;
