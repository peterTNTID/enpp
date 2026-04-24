import { fetchProducts } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Sparkles } from "lucide-react";

export default async function Home() {
  const products = await fetchProducts();

  return (
    <main className="min-h-screen relative overflow-hidden flex flex-col">
      {/* Background Decor */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--color-primary)] opacity-20 blur-[120px] rounded-full mix-blend-screen dark:opacity-20 opacity-40 transition-opacity" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--color-secondary)] opacity-20 blur-[120px] rounded-full mix-blend-screen dark:opacity-20 opacity-40 transition-opacity" />
      </div>

      {/* Header Actions */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-24 flex-1">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm font-medium mb-8 text-[var(--color-secondary)]">
            <Sparkles className="w-4 h-4" />
            <span>Premium Merchandise</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 pb-2 text-[var(--color-text-primary)]">
            Dangar Island Merch
          </h1>
          <p className="text-lg md:text-xl text-[var(--color-text-secondary)]">
            Exclusive apparel and accessories styled for the community.
            Browse our latest collection below.
          </p>
        </div>

        {/* Product Grid */}
        {products.length === 0 ? (
          <div className="text-center text-[var(--color-text-secondary)] py-20 glass rounded-2xl">
            No products available at the moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[var(--color-border)] py-8 mt-20 glass">
        <div className="max-w-7xl mx-auto px-6 text-center text-[var(--color-text-secondary)] text-sm">
          &copy; {new Date().getFullYear()} Dangar Island Merch. All rights reserved.
        </div>
      </footer>
    </main>
  );
}
