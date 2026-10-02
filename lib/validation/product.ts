import { z } from "zod";

export const productImageSchema = z.object({
  id: z.string().optional(),
  product_id: z.string().optional(),
  cloudinary_public_id: z.string().optional().default(""),
  secure_url: z.string().min(1, "Image URL is required"),
  alt_text: z.string().optional().default(""),
  sort_order: z.number().optional().default(0),
});

export const productColorVariantSchema = z.object({
  id: z.string().default(() => `var_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`),
  name: z.string().min(1, "Color name is required"),
  color_hex: z.string().min(1, "Color code is required"),
  images: z.array(productImageSchema).default([]),
});

export const productSchema = z.object({
  name: z.string().min(1, "Product name is required").max(200),
  slug: z.string().optional(),
  short_description: z.string().optional().default(""),
  description: z.string().optional().default(""),
  price: z.coerce.number().positive("Price must be greater than 0"),
  compare_at_price: z.coerce.number().optional().nullable(),
  cost_price: z.coerce.number().min(0, "Cost price must be non-negative").optional().nullable(),
  sku: z.string().optional().default(""),
  stock: z.coerce.number().int().min(0).default(0),
  category_id: z.string().optional().default(""),
  is_best_seller: z.boolean().optional().default(false),
  is_new_arrival: z.boolean().optional().default(false),
  status: z.enum(["draft", "active", "archived"]).optional().default("active"),
  craftsmanship_heading: z.string().optional().nullable(),
  craftsmanship_details: z.string().optional().nullable(),
  craftsmanship_mode: z.enum(["bullets", "text"]).optional().default("bullets").nullable(),
  shipping_heading: z.string().optional().nullable(),
  shipping_customs: z.string().optional().nullable(),
  shipping_mode: z.enum(["bullets", "text"]).optional().default("text").nullable(),
  leather_heading: z.string().optional().nullable(),
  leather_care: z.string().optional().nullable(),
  leather_mode: z.enum(["bullets", "text"]).optional().default("text").nullable(),
  images: z.array(productImageSchema).optional().default([]),
  color_variants: z.array(productColorVariantSchema).optional().default([]),
});

export const productUpdateSchema = z.object({
  name: z.string().min(1, "Product name cannot be empty").max(200).optional(),
  slug: z.string().optional(),
  short_description: z.string().optional().default(""),
  description: z.string().optional().default(""),
  craftsmanship_heading: z.string().optional().nullable(),
  craftsmanship_details: z.string().optional().nullable(),
  craftsmanship_mode: z.enum(["bullets", "text"]).optional().nullable(),
  shipping_heading: z.string().optional().nullable(),
  shipping_customs: z.string().optional().nullable(),
  shipping_mode: z.enum(["bullets", "text"]).optional().nullable(),
  leather_heading: z.string().optional().nullable(),
  leather_care: z.string().optional().nullable(),
  leather_mode: z.enum(["bullets", "text"]).optional().nullable(),
  price: z.coerce.number().positive("Price must be greater than 0").optional(),
  compare_at_price: z.coerce.number().optional().nullable(),
  cost_price: z.coerce.number().min(0, "Cost price must be non-negative").optional().nullable(),
  sku: z.string().optional(),
  stock: z.coerce.number().int().min(0).optional(),
  category_id: z.string().optional(),
  is_best_seller: z.boolean().optional(),
  is_new_arrival: z.boolean().optional(),
  status: z.enum(["draft", "active", "archived"]).optional(),
  images: z.array(productImageSchema).optional(),
  color_variants: z.array(productColorVariantSchema).optional(),
});

export type ProductInput = z.infer<typeof productSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;

