"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { ProductSizeGuide, SizeTable } from "@/lib/api";
import { useState } from "react";

interface SizeGuideModalProps {
    isOpen: boolean;
    onClose: () => void;
    sizeGuide: ProductSizeGuide;
}

export function SizeGuideModal({ isOpen, onClose, sizeGuide }: SizeGuideModalProps) {
    const [activeTab, setActiveTab] = useState<number>(0);

    if (!sizeGuide || !sizeGuide.size_tables || sizeGuide.size_tables.length === 0) {
        return null;
    }

    const tables = sizeGuide.size_tables;
    const activeTable = tables[activeTab];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto glass rounded-3xl shadow-2xl bg-[var(--color-surface)]"
                    >
                        {/* Header */}
                        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-[var(--color-border)] glass rounded-t-3xl">
                            <h2 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
                                Size Guide
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-[var(--color-border)]/50 transition-colors text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] focus:outline-none"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Tabs */}
                        {tables.length > 1 && (
                            <div className="flex px-6 pt-6 gap-2 overflow-x-auto scrollbar-hide">
                                {tables.map((table, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveTab(idx)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeTab === idx
                                                ? "bg-[var(--color-primary)] text-white"
                                                : "bg-[var(--color-primary)]/10 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                                            }`}
                                    >
                                        {table.type === 'measure_yourself' ? 'Measure Yourself' :
                                            table.type === 'product_measure' ? 'Product Measurements' :
                                                table.type}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Body */}
                        <div className="p-6">
                            {activeTable && (
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

                                    {/* Info & Illustration Column */}
                                    <div className="md:col-span-4 flex flex-col gap-6">
                                        {activeTable.image_url && (
                                            <div className="bg-white/5 rounded-2xl p-4 flex justify-center items-center">
                                                <img
                                                    src={activeTable.image_url}
                                                    alt="Measurement guide illustration"
                                                    className="w-full max-w-[200px] h-auto object-contain mix-blend-multiply dark:mix-blend-normal dark:invert dark:opacity-80"
                                                />
                                            </div>
                                        )}

                                        <div className="text-[var(--color-text-secondary)] text-sm space-y-4">
                                            {/* We dangerously set HTML here because Printful returns actual HTML paragraphs */}
                                            {activeTable.description && (
                                                <div dangerouslySetInnerHTML={{ __html: activeTable.description }} className="prose-sm prose-p:mb-2 prose-strong:text-[var(--color-text-primary)]" />
                                            )}
                                            {activeTable.image_description && (
                                                <div dangerouslySetInnerHTML={{ __html: activeTable.image_description }} className="prose-sm mt-4 p-4 rounded-xl bg-[var(--color-border)]/20 prose-h6:font-semibold prose-h6:mb-1 prose-h6:text-[var(--color-text-primary)]" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Table Column */}
                                    <div className="md:col-span-8 overflow-x-auto pb-4">
                                        <div className="min-w-max border border-[var(--color-border)] rounded-2xl overflow-hidden">
                                            <table className="w-full text-sm text-left">
                                                <thead className="text-xs uppercase bg-[var(--color-border)]/30 text-[var(--color-text-secondary)]">
                                                    <tr>
                                                        <th scope="col" className="px-6 py-4 font-semibold text-[var(--color-text-primary)]">
                                                            Size ({activeTable.unit})
                                                        </th>
                                                        {activeTable.measurements.map((measure) => (
                                                            <th key={measure.type_label} scope="col" className="px-6 py-4 font-semibold">
                                                                {measure.type_label}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-[var(--color-border)]">
                                                    {sizeGuide.available_sizes.map((size) => (
                                                        <tr key={size} className="hover:bg-[var(--color-border)]/10 transition-colors">
                                                            <td className="px-6 py-4 font-medium text-[var(--color-text-primary)] whitespace-nowrap">
                                                                {size}
                                                            </td>
                                                            {activeTable.measurements.map((measure) => {
                                                                const matchingVal = measure.values.find(v => v.size === size);
                                                                let displayVal = "-";
                                                                if (matchingVal) {
                                                                    if (matchingVal.value) {
                                                                        displayVal = matchingVal.value;
                                                                    } else if (matchingVal.min_value && matchingVal.max_value) {
                                                                        displayVal = `${matchingVal.min_value} - ${matchingVal.max_value}`;
                                                                    }
                                                                }
                                                                return (
                                                                    <td key={`${measure.type_label}-${size}`} className="px-6 py-4 text-[var(--color-text-secondary)]">
                                                                        {displayVal}
                                                                    </td>
                                                                );
                                                            })}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
