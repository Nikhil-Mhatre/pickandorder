import type { RequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { HttpError } from "../middleware/error-handler.js";
import {
  createProductSchema,
  productIdSchema,
  updateProductSchema,
} from "../schemas/product.schema.js";
import { publishProductEvent } from "../events/product-events.js";

export const listProducts: RequestHandler = async (req, res) => {
  const page = Math.max(1, Number.parseInt(String(req.query.page ?? "1"), 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(String(req.query.limit ?? "20"), 10) || 20),
  );
  const category = typeof req.query.category === "string" ? req.query.category.trim() : undefined;
  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(category ? { category: { equals: category, mode: "insensitive" } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  res.json({
    data: items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
};

export const getProduct: RequestHandler = async (req, res) => {
  const id = productIdSchema.parse(req.params.id);
  const product = await prisma.product.findFirst({ where: { id, isActive: true } });
  if (!product) throw new HttpError(404, "Product not found");
  res.json({ data: product });
};

export const createProduct: RequestHandler = async (req, res) => {
  const input = createProductSchema.parse(req.body);
  const product = await prisma.product.create({
    data: {
      ...input,
      price: new Prisma.Decimal(input.price),
    },
  });
  publishProductEvent("product.created", product);
  res.status(201).json({ data: product });
};

export const updateProduct: RequestHandler = async (req, res) => {
  const id = productIdSchema.parse(req.params.id);
  const input = updateProductSchema.parse(req.body);
  const existing = await prisma.product.findFirst({ where: { id, isActive: true } });
  if (!existing) throw new HttpError(404, "Product not found");

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...input,
      ...(input.price !== undefined ? { price: new Prisma.Decimal(input.price) } : {}),
    },
  });
  publishProductEvent("product.updated", product);
  res.json({ data: product });
};

export const deleteProduct: RequestHandler = async (req, res) => {
  const id = productIdSchema.parse(req.params.id);
  const existing = await prisma.product.findFirst({ where: { id, isActive: true } });
  if (!existing) throw new HttpError(404, "Product not found");

  await prisma.product.update({ where: { id }, data: { isActive: false } });
  res.status(204).send();
};
