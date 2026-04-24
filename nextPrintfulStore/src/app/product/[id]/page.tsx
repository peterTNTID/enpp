import { fetchProducts, fetchProductDetails } from "@/lib/api";
import ProductDetailsClient from "@/components/ProductDetailsClient";
import { notFound } from "next/navigation";

// Generate static routes for all products at build time
export async function generateStaticParams() {
    const products = await fetchProducts();
    return products.map((product) => ({
        id: product.id.toString(),
    }));
}

export default async function ProductPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const p = await params;
    const id = parseInt(p.id, 10);

    if (isNaN(id)) {
        notFound();
    }

    const product = await fetchProductDetails(id);

    if (!product) {
        notFound();
    }

    return <ProductDetailsClient product={product} />;
}
