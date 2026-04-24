import { fetchProducts, fetchProductDetails, ProductVariant } from '@/lib/api';

const getApiKey = () => process.env.NEXT_PUBLIC_PRINTFUL_API_KEY || '';
const getBaseUrl = () => process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.printful.com';

interface PricingRow {
    productId: number;
    variantId: number;
    productName: string;
    variantName: string;
    thumbnail: string;
    retailPrice: number;
    cost: number;
    margin: number;
    marginPercent: number;
}

async function getPricingData(): Promise<PricingRow[]> {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("No API key available");

    const rows: PricingRow[] = [];

    // 1. Fetch all store products
    const res = await fetch(`${getBaseUrl()}/store/products`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        cache: 'no-store' // Always fetch fresh to get actual current prices
    });

    if (!res.ok) throw new Error("Failed to fetch products");
    const productsData = await res.json();
    const products = productsData.result || [];

    // 2. We deliberately do sequential/chunked fetching here to not blow rate limits on the Printful API on page load.
    for (const product of products) {
        try {
            const productDetailsRes = await fetch(`${getBaseUrl()}/store/products/${product.id}`, {
                headers: { Authorization: `Bearer ${apiKey}` },
                cache: 'no-store'
            });
            const detailsData = await productDetailsRes.json();
            const syncVariants = detailsData.result?.sync_variants || [];

            for (const sv of syncVariants) {
                const retailPrice = parseFloat(sv.retail_price) || 0;
                let cost = 0;

                try {
                    // Fetch catalog variance cost
                    const catalogRes = await fetch(`${getBaseUrl()}/products/variant/${sv.variant_id}`, {
                        headers: { Authorization: `Bearer ${apiKey}` },
                        cache: 'no-store'
                    });
                    const catalogData = await catalogRes.json();
                    cost = parseFloat(catalogData.result?.variant?.price) || 0;
                } catch (e) {
                    console.error("Failed to fetch catalog cost for", sv.variant_id, e);
                }

                const margin = retailPrice - cost;
                const marginPercent = retailPrice > 0 ? (margin / retailPrice) * 100 : 0;

                rows.push({
                    productId: product.id,
                    variantId: sv.id,
                    productName: product.name,
                    variantName: sv.name, // Usually contains size/color
                    thumbnail: sv.files?.find((f: any) => f.type === 'preview')?.thumbnail_url || product.thumbnail_url || '',
                    retailPrice,
                    cost,
                    margin,
                    marginPercent,
                });
            }
        } catch (e) {
            console.error("Failed to fetch product details for", product.id, e);
        }
    }

    return rows;
}

export default async function PricingDashboard() {
    let rows: PricingRow[] = [];
    let error = null;

    try {
        rows = await getPricingData();
    } catch (e: any) {
        error = e.message;
    }

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 p-8 pt-24 font-sans max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 text-gray-800 tracking-tight">Printful Store Pricing Dashboard</h1>

            {error ? (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 mb-8 rounded">
                    <p className="font-bold">Error Loading Data</p>
                    <p>{error}</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left align-middle">
                            <thead className="text-xs text-gray-600 uppercase bg-gray-100/50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-gray-700">Item</th>
                                    <th className="px-6 py-4 font-semibold text-gray-700">Product Name</th>
                                    <th className="px-6 py-4 font-semibold text-gray-700">Variant</th>
                                    <th className="px-6 py-4 font-semibold text-gray-700 text-right">Retail (AUD)</th>
                                    <th className="px-6 py-4 font-semibold text-gray-700 text-right">Printful Cost</th>
                                    <th className="px-6 py-4 font-semibold text-gray-700 text-right">Margin ($)</th>
                                    <th className="px-6 py-4 font-semibold text-gray-700 text-right">Margin (%)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {rows.map((row, idx) => (
                                    <tr key={`${row.productId}-${row.variantId}-${idx}`} className="hover:bg-gray-50/80 transition-colors">
                                        <td className="px-6 py-3 whitespace-nowrap">
                                            {row.thumbnail ? (
                                                <img src={row.thumbnail} alt={row.productName} className="w-12 h-12 rounded object-cover border border-gray-200 shadow-sm" />
                                            ) : (
                                                <div className="w-12 h-12 rounded bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 text-xs">No img</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-3 font-medium text-gray-800">{row.productName}</td>
                                        <td className="px-6 py-3 text-gray-600 truncate max-w-[200px]" title={row.variantName}>{row.variantName}</td>
                                        <td className="px-6 py-3 text-right font-medium">${row.retailPrice.toFixed(2)}</td>
                                        <td className="px-6 py-3 text-right text-gray-600">${row.cost.toFixed(2)}</td>
                                        <td className={`px-6 py-3 text-right font-semibold ${row.margin > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            ${row.margin.toFixed(2)}
                                        </td>
                                        <td className={`px-6 py-3 text-right font-semibold tracking-wide ${row.marginPercent > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {row.marginPercent.toFixed(1)}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {rows.length === 0 && (
                            <div className="p-8 text-center text-gray-500 italic">No products found.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
