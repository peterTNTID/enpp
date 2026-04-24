"use client";

import { motion } from "framer-motion";
import { useState, useMemo, useEffect } from "react";
import type { Product, ProductVariant } from "@/lib/api";
import { ArrowLeft, ShoppingBag, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SizeGuideModal } from "@/components/SizeGuideModal";
import Link from "next/link";

interface ProductDetailsClientProps {
    product: Product;
}

export default function ProductDetailsClient({ product }: ProductDetailsClientProps) {
    // Aggregate available sizes and colors
    const variants = product.variants || [];

    const sizes = useMemo(() => {
        return Array.from(new Set(variants.map(v => v.size).filter(Boolean)));
    }, [variants]);

    const colors = useMemo(() => {
        return Array.from(new Set(variants.map(v => v.color).filter(Boolean)));
    }, [variants]);

    const [selectedSize, setSelectedSize] = useState<string>(sizes[0] || "");
    const [selectedColor, setSelectedColor] = useState<string>(colors[0] || "");
    const [isSizeModalOpen, setIsSizeModalOpen] = useState(false);

    // Find the exact variant based on selection to update image/price
    const selectedVariant = useMemo(() => {
        if (!variants.length) return null;
        return variants.find(v =>
            (!selectedSize || v.size === selectedSize) &&
            (!selectedColor || v.color === selectedColor)
        ) || variants[0];
    }, [variants, selectedSize, selectedColor]);

    // Main Display Image
    const [activeImage, setActiveImage] = useState<string>(
        selectedVariant?.image_url || product.thumbnail_url
    );

    // Update active image when variant color changes
    useEffect(() => {
        if (selectedVariant?.image_url) {
            setActiveImage(selectedVariant.image_url);
        }
    }, [selectedVariant]);

    // Gather all images (thumbnail + views + variant images if divergent)
    const allImages = useMemo(() => {
        const images = new Set<string>();
        if (product.thumbnail_url) images.add(product.thumbnail_url);
        product.viewImages?.forEach(v => images.add(v.url));
        variants.forEach(v => {
            if (v.image_url) images.add(v.image_url);
        });
        return Array.from(images);
    }, [product, variants]);

    const price = selectedVariant?.price || "N/A";
    const currency = selectedVariant?.currency || "USD";

    return (
        <main className="min-h-screen relative overflow-hidden flex flex-col py-12 px-6">
            {/* Background Decor */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--color-primary)] opacity-20 blur-[120px] rounded-full mix-blend-screen" />
                <div className="absolute top-[20%] right-[-10%] w-[30%] h-[30%] bg-[var(--color-secondary)] opacity-10 blur-[120px] rounded-full mix-blend-screen" />
            </div>

            <div className="relative z-10 w-full max-w-7xl mx-auto flex-1">
                <div className="flex justify-between items-center mb-10">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to Collection
                    </Link>

                    <ThemeToggle />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20">

                    {/* Images Section */}
                    <div className="flex flex-col gap-6">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                            className="glass rounded-3xl overflow-hidden aspect-square flex items-center justify-center p-8 relative"
                        >
                            <motion.img
                                key={activeImage}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.4 }}
                                src={activeImage}
                                alt={product.name}
                                className="w-full h-full object-contain mix-blend-multiply filter brightness-110"
                            />
                        </motion.div>

                        {/* Image Gallery */}
                        {allImages.length > 1 && (
                            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                                {allImages.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveImage(img)}
                                        className={`relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 transition-all duration-200 border-2 ${activeImage === img
                                            ? "border-[var(--color-primary)] opacity-100"
                                            : "border-transparent opacity-60 hover:opacity-100 bg-white/5"
                                            }`}
                                    >
                                        <img src={img} alt="Gallery view" className="w-full h-full object-cover mix-blend-multiply" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Details Section */}
                    <div className="flex flex-col justify-start">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-semibold uppercase tracking-wider mb-6">
                                <Sparkles className="w-3.5 h-3.5" />
                                Premium Quality
                            </div>

                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 leading-tight">
                                {product.name}
                            </h1>

                            <div className="text-3xl font-light text-[var(--color-text-secondary)] mb-2 flex items-baseline gap-2">
                                <span>{price}</span>
                                <span className="text-xl text-[var(--color-border)]">{currency}</span>
                            </div>

                            {selectedVariant?.donationAmount ? (
                                <p className="text-sm text-[var(--color-primary)] font-medium mb-8">
                                    Includes approx ${selectedVariant.donationAmount} to support The Dangar Island Community Hall
                                </p>
                            ) : null}

                            <div className="w-full h-px bg-gradient-to-r from-[var(--color-border)] to-transparent my-8" />

                            {/* Options */}
                            <div className="flex flex-col gap-6">

                                {/* Colors */}
                                {colors.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-medium text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
                                            Color <span className="text-[var(--color-text-primary)] ml-2">{selectedColor}</span>
                                        </h3>
                                        <div className="flex flex-wrap gap-3">
                                            {colors.map(color => (
                                                <button
                                                    key={color}
                                                    onClick={() => setSelectedColor(color)}
                                                    className={`px-6 py-3 rounded-xl border transition-all duration-200 font-medium ${selectedColor === color
                                                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-text-primary)]"
                                                        : "border-[var(--color-border)] hover:border-[var(--color-text-secondary)] text-[var(--color-text-secondary)]"
                                                        }`}
                                                >
                                                    {color}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Sizes */}
                                {sizes.length > 0 && (
                                    <div>
                                        <div className="flex justify-between items-center mb-3">
                                            <h3 className="text-sm font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                                                Size
                                            </h3>
                                            {product.sizeGuide && (
                                                <button
                                                    onClick={() => setIsSizeModalOpen(true)}
                                                    className="text-[var(--color-primary)] text-sm hover:underline font-medium"
                                                >
                                                    Size Guide
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                            {sizes.map(size => (
                                                <button
                                                    key={size}
                                                    onClick={() => setSelectedSize(size)}
                                                    className={`min-w-[4rem] px-4 py-3 rounded-xl border transition-all duration-200 font-medium text-center ${selectedSize === size
                                                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-text-primary)]"
                                                        : "border-[var(--color-border)] hover:border-[var(--color-text-secondary)] text-[var(--color-text-secondary)]"
                                                        }`}
                                                >
                                                    {size}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-12">
                                <button className="w-full bg-white text-black hover:bg-gray-100 flex items-center justify-center gap-3 py-4 rounded-2xl font-semibold text-lg transition-transform active:scale-[0.98]">
                                    <ShoppingBag className="w-5 h-5" />
                                    Add to Cart
                                </button>
                                <p className="text-center text-[var(--color-text-secondary)] text-sm mt-4">
                                    Payment flows will be added soon. Currently browse only.
                                </p>
                            </div>

                        </motion.div>
                    </div>

                </div>
            </div>
            {product.sizeGuide && (
                <SizeGuideModal
                    isOpen={isSizeModalOpen}
                    onClose={() => setIsSizeModalOpen(false)}
                    sizeGuide={product.sizeGuide}
                />
            )}
        </main>
    );
}
