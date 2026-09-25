import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a clean product URL using just the slug
 * Format: /shop/product-name-slug
 */
export function getProductUrl(product: { slug?: string | null; id: string; name: string }): string {
  // Use slug if available, otherwise fallback to ID for backward compatibility
  if (product.slug) {
    return `/shop/${product.slug}`;
  }
  // Fallback for products without slugs yet
  return `/shop/${product.id}`;
}
