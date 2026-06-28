import { Router, type IRouter } from "express";
import { db, usersTable, ordersTable, productsTable, cardsTable } from "@workspace/db";
import { eq, count, sum, desc } from "drizzle-orm";
import {
  UpdateProfileBody,
  TopupBalanceBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.patch("/users/profile", async (req, res): Promise<void> => {
  const userId = req.session.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db
    .update(usersTable)
    .set(parsed.data)
    .where(eq(usersTable.id, userId))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    balance: parseFloat(user.balance),
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  });
});

router.post("/users/balance/topup", async (req, res): Promise<void> => {
  const userId = req.session.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const parsed = TopupBalanceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [current] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!current) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const newBalance = parseFloat(current.balance) + parsed.data.amount;

  const [user] = await db
    .update(usersTable)
    .set({ balance: String(newBalance) })
    .where(eq(usersTable.id, userId))
    .returning();

  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    balance: parseFloat(user.balance),
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  });
});

router.get("/admin/stats", async (_req, res): Promise<void> => {
  const [orderStats] = await db
    .select({
      totalOrders: count(),
      totalRevenue: sum(ordersTable.totalPrice),
    })
    .from(ordersTable);

  const [productStats] = await db.select({ total: count() }).from(productsTable);
  const [userStats] = await db.select({ total: count() }).from(usersTable);

  const [cardStats] = await db.select({ total: count() }).from(cardsTable);
  const [availableStats] = await db
    .select({ total: count() })
    .from(cardsTable)
    .where(eq(cardsTable.sold, false));

  const recentOrders = await db
    .select()
    .from(ordersTable)
    .orderBy(desc(ordersTable.createdAt))
    .limit(10);

  res.json({
    totalOrders: Number(orderStats?.totalOrders ?? 0),
    totalRevenue: parseFloat(String(orderStats?.totalRevenue ?? 0)),
    totalProducts: Number(productStats?.total ?? 0),
    totalUsers: Number(userStats?.total ?? 0),
    totalCards: Number(cardStats?.total ?? 0),
    availableCards: Number(availableStats?.total ?? 0),
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      userId: o.userId ?? null,
      productId: o.productId,
      productName: null,
      quantity: o.quantity,
      totalPrice: parseFloat(o.totalPrice),
      status: o.status,
      cardContents: o.cardContents ?? null,
      email: o.email ?? null,
      createdAt: o.createdAt.toISOString(),
    })),
  });
});

router.get("/admin/users", async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);
  res.json(
    users.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      balance: parseFloat(u.balance),
      role: u.role,
      createdAt: u.createdAt.toISOString(),
    }))
  );
});

export default router;
