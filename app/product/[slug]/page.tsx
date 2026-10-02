import React from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { store } from "@/lib/data/store";
import { ProductDetailsClient } from "@/components/ProductDetailsClient";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await store.getProductBySlug(slug);

  if (!product) {
    return {
      title: "Silhouette Not Found | DNORA Luxury House",
    };
  }

  const firstImage = product.images?.[0]?.secure_url;

  return {
    title: `${product.name} | DNORA Luxury House`,
    description: product.description || `Handcrafted ${product.name} sculpted from Italian calfskin in Florence, Italy.`,
    openGraph: {
      title: product.name,
      description: product.description || `Handcrafted ${product.name} sculpted in Florence, Italy.`,
      images: firstImage ? [{ url: firstImage }] : [],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await store.getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  // Fetch related products (e.g. from same category or general collection)
  const allProducts = await store.getProducts({ status: "active" });
  const relatedProducts = allProducts.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <ProductDetailsClient
      product={product}
      relatedProducts={relatedProducts}
    />
  );
}
