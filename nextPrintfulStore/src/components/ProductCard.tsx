"use client";

import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import type { Product } from "@/lib/api";
import Link from "next/link";

interface ProductCardProps {
    product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3 }}
            className="glass rounded-2xl overflow-hidden group hover:glow transition-all duration-300 relative flex flex-col h-full"
        >
            <div className="relative aspect-square overflow-hidden bg-white/5">
                <motion.img
                    src={product.thumbnail_url}
                    alt={product.name}
                    className="object-cover w-full h-full mix-blend-multiply"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.4 }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            <div className="p-6 flex flex-col flex-1">
                <h3 className="text-xl font-semibold mb-2 line-clamp-2">{product.name}</h3>
                {product.description && (
                    <p className="text-[var(--color-text-secondary)] text-sm mb-4 line-clamp-2 flex-1">
                        {product.description}
                    </p>
                )}

                <div className="mt-auto flex flex-col pt-4 border-t border-[var(--color-border)]">
                    {product.variants?.[0]?.donationAmount ? (
                        <p className="text-xs text-[var(--color-primary)] font-medium mb-3 text-center">
                            Includes approx ${product.variants[0].donationAmount} to support The Dangar Island Community Hall
                        </p>
                    ) : null}
                    <Link
                        href={`/product/${product.id}`}
                        className="flex justify-center flex-1 items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full"
                    >
                        <ShoppingBag className="w-4 h-4" />
                        View Details
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}
