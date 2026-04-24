"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";

export function ThemeToggle() {
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme } = useTheme();

    // useEffect only runs on the client, so now we can safely show the UI
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="w-10 h-10" aria-hidden="true" />;
    }

    const isDark = theme === "dark";

    return (
        <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="relative flex items-center justify-center w-12 h-12 rounded-full glass hover:bg-white/10 dark:hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            aria-label="Toggle Dark Mode"
        >
            <div className="relative w-6 h-6 flex items-center justify-center">
                <motion.div
                    initial={false}
                    animate={{
                        scale: isDark ? 1 : 0,
                        opacity: isDark ? 1 : 0,
                        rotate: isDark ? 0 : 90
                    }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 text-white"
                >
                    <Moon className="w-full h-full" />
                </motion.div>

                <motion.div
                    initial={false}
                    animate={{
                        scale: isDark ? 0 : 1,
                        opacity: isDark ? 0 : 1,
                        rotate: isDark ? -90 : 0
                    }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 text-slate-900"
                >
                    <Sun className="w-full h-full" />
                </motion.div>
            </div>
        </button>
    );
}
