import { z } from "zod";

// ==========================================
// 1. ORDER & CHECKOUT VALIDATORS
// ==========================================
export const ShippingAddressSchema = z.object({
  full_name: z.string().min(1, "Full name is required").max(100),
  phone: z.string().min(6, "Phone number is required").max(25),
  address_line1: z.string().min(3, "Street address is required").max(250),
  address_line2: z.string().max(250).optional().nullable(),
  city: z.string().min(1, "City is required").max(100),
  state: z.string().min(1, "State is required").max(100),
  postal_code: z.string().min(3, "Postal/PIN code is required").max(20),
  country: z.string().default("India"),
});

export const CheckoutOrderItemSchema = z.object({
  product: z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Product name is required"),
    slug: z.string().optional(),
    price: z.number().nonnegative("Price must be positive"),
    images: z.array(z.any()).optional(),
  }),
  quantity: z.number().int().positive("Quantity must be at least 1"),
  selectedVariant: z
    .object({
      name: z.string().optional(),
      color_hex: z.string().optional(),
    })
    .optional(),
});

export const CheckoutPayloadSchema = z.object({
  formData: z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("A valid email address is required"),
    phone: z.string().min(6, "Phone number is required"),
    address: z.string().min(3, "Delivery address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    postalCode: z.string().min(3, "PIN code is required"),
    paymentMethod: z.enum(["online", "cod"]).default("online"),
    giftWrap: z.boolean().optional(),
    specialInstructions: z.string().max(500).optional(),
  }),
  items: z.array(CheckoutOrderItemSchema).min(1, "Shopping bag cannot be empty"),
  subtotal: z.number().nonnegative(),
});

// ==========================================
// 2. CATEGORY VALIDATORS
// ==========================================
export const CategoryInputSchema = z.object({
  name: z.string().min(1, "Category name is required").max(100),
  slug: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  image_url: z.string().url("Invalid image URL").optional().or(z.literal("")),
});

// ==========================================
// 3. PRODUCT VALIDATORS
// ==========================================
export const ProductInputSchema = z.object({
  name: z.string().min(1, "Product title is required").max(200),
  slug: z.string().min(1).max(200),
  description: z.string().optional(),
  price: z.number().nonnegative("Price must be non-negative"),
  compare_at_price: z.number().nonnegative().optional().nullable(),
  sku: z.string().optional().nullable(),
  category_id: z.string().uuid("Invalid category UUID").optional().nullable(),
  status: z.enum(["draft", "active", "archived"]).default("active"),
  is_featured: z.boolean().default(false),
  is_best_seller: z.boolean().default(false),
  is_new_arrival: z.boolean().default(false),
  inventory_quantity: z.number().int().default(10),
});

// ==========================================
// 4. AUTH VALIDATORS
// ==========================================
export const LoginInputSchema = z.object({
  email: z.string().email("A valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const RegisterInputSchema = z.object({
  email: z.string().email("A valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  full_name: z.string().min(1, "Full name is required").max(100),
  phone: z.string().optional(),
});
