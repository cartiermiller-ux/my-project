import { Router, type IRouter } from "express";
import { db, productsTable, categoriesTable, cardsTable } from "@workspace/db";
import { eq, and, ilike, count, sql } from "drizzle-orm";
import {
  ListProductsQueryParams,
  CreateProductBody,
  GetProductParams,
  UpdateProductParams,
  UpdateProductBody,
  DeleteProductParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatProduct(p: typeof productsTable.$inferSelect, categoryName?: string | null, stock?: number) {
  return {
    id: p.id,
    name: p.name,
    categoryId: p.categoryId,
    categoryName: categoryName ?? null,
    price: parseFloat(p.price),
    originalPrice: p.originalPrice != null ? parseFloat(p.originalPrice) : null,
    description: p.description,
    imageUrl: p.imageUrl ?? null,
    featured: p.featured,
    stock: stock ?? 0,
    salesCount: p.salesCount,
    region: p.region ?? null,
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/products", async (req, res): Promise<void> => {
  const params = ListProductsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { categoryId, search, featured } = params.data;

  const conditions = [];
  if (categoryId != null) conditions.push(eq(productsTable.categoryId, categoryId));
  if (featured != null) conditions.push(eq(productsTable.featured, featured));
  if (search) conditions.push(ilike(productsTable.name, `%${search}%`));

  const products = await db
    .select()
    .from(productsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(productsTable.createdAt);

  const categories = await db.select().from(categoriesTable);
  const catMap = new Map(categories.map((c) => [c.id, c.name]));

  const stockCounts = await db
    .select({
      productId: cardsTable.productId,
      available: count(),
    })
    .from(cardsTable)
    .where(eq(cardsTable.sold, false))
    .groupBy(cardsTable.productId);
  const stockMap = new Map(stockCounts.map((s) => [s.productId, Number(s.available)]));

  res.json(
    products.map((p) =>
      formatProduct(p, catMap.get(p.categoryId), stockMap.get(p.id) ?? 0)
    )
  );
});

router.post("/products", async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { originalPrice, ...rest } = parsed.data;
  const [product] = await db
    .insert(productsTable)
    .values({
      ...rest,
      originalPrice: originalPrice != null ? String(originalPrice) : null,
      price: String(parsed.data.price),
    })
    .returning();

  res.status(201).json(formatProduct(product, null, 0));
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetProductParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, params.data.id));

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const [category] = await db
    .select()
    .from(categoriesTable)
    .where(eq(categoriesTable.id, product.categoryId));

  const [stockRow] = await db
    .select({ available: count() })
    .from(cardsTable)
    .where(and(eq(cardsTable.productId, product.id), eq(cardsTable.sold, false)));

  res.json(formatProduct(product, category?.name, Number(stockRow?.available ?? 0)));
});

router.patch("/products/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateProductParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { originalPrice, price, ...rest } = parsed.data;
  const updateData: Record<string, unknown> = { ...rest };
  if (price != null) updateData.price = String(price);
  if (originalPrice != null) updateData.originalPrice = String(originalPrice);

  const [product] = await db
    .update(productsTable)
    .set(updateData)
    .where(eq(productsTable.id, params.data.id))
    .returning();

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const [stockRow] = await db
    .select({ available: count() })
    .from(cardsTable)
    .where(and(eq(cardsTable.productId, product.id), eq(cardsTable.sold, false)));

  res.json(formatProduct(product, null, Number(stockRow?.available ?? 0)));
});

router.delete("/products/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteProductParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(productsTable).where(eq(productsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
