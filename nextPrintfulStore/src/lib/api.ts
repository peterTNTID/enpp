export interface ProductVariant {
    id: number;
    product_id: number;
    name: string;
    size: string;
    color: string;
    price: string;
    currency: string;
    inStock: boolean;
    image_url?: string;
    donationAmount?: number; // Calculated dynamically from (profit - 5% running costs), rounded to nearest dollar
}

export interface ProductViewImage {
    url: string;
    title: string;
}

export interface SizeMeasurement {
    type_label: string;
    values: Array<{ size: string; value?: string; min_value?: string; max_value?: string }>;
}

export interface SizeTable {
    type: string;
    unit: string;
    description: string;
    image_url: string;
    image_description: string;
    measurements: SizeMeasurement[];
}

export interface ProductSizeGuide {
    available_sizes: string[];
    size_tables: SizeTable[];
}

export interface Product {
    id: number;
    name: string;
    description: string;
    thumbnail_url: string;
    variants?: ProductVariant[];
    viewImages?: ProductViewImage[];
    sizeGuide?: ProductSizeGuide;
}

const getApiKey = () => process.env.NEXT_PUBLIC_PRINTFUL_API_KEY || '';
const getBaseUrl = () => process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.printful.com';

const MOCK_PRODUCTS: Product[] = [
    {
        id: 1,
        name: 'Essential Cotton T-Shirt',
        description: 'A classic staple for every wardrobe. Made with organic cotton.',
        thumbnail_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    },
    {
        id: 2,
        name: 'Minimalist Canvas Totebag',
        description: 'Durable, eco-friendly, and stylishly simple.',
        thumbnail_url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    },
    {
        id: 3,
        name: 'Ceramic Coffee Mug',
        description: 'Handcrafted feel for your daily brew.',
        thumbnail_url: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    },
    {
        id: 4,
        name: 'Nordic Wool Throw',
        description: 'Warm, cozy, and perfectly textured.',
        thumbnail_url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b91d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    },
    {
        id: 5,
        name: 'Abstract Art Print',
        description: 'Modern art to elevate your living space.',
        thumbnail_url: 'https://images.unsplash.com/photo-1582201943021-e8e6443112bd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    },
];

export async function fetchProducts(): Promise<Product[]> {
    const apiKey = getApiKey();
    if (!apiKey) {
        console.warn('Warning: No NEXT_PUBLIC_PRINTFUL_API_KEY found. Using mock data.');
        return MOCK_PRODUCTS;
    }

    try {
        const res = await fetch(`${getBaseUrl()}/store/products`, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
        });

        if (!res.ok) {
            throw new Error(`Failed to load products: ${res.status}`);
        }

        const data = await res.json();

        // Load generated mockups from registry for thumbnails
        let registry: Record<string, any> = {};
        try {
            const registryRes = await fetch(`${getBaseUrl().replace('/api.printful.com', '')}/mockups.json`).catch(() => null);
            if (registryRes && registryRes.ok) {
                registry = await registryRes.json();
            } else {
                const fs = require('fs');
                const path = require('path');
                const registryPath = path.join(process.cwd(), 'public', 'mockups.json');
                if (fs.existsSync(registryPath)) {
                    registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
                }
            }
        } catch (e) {
            console.warn('Could not load mockups registry for thumbnails:', e);
        }

        const products = data.result.map((item: any) => {
            const isMug = item.name.toLowerCase().includes('mug');
            return {
                id: item.id,
                name: item.name,
                description: item.description || '',
                thumbnail_url: (isMug && registry[item.id]?.urls?.[0]) ? registry[item.id].urls[0] : item.thumbnail_url,
            };
        });

        const getSortWeight = (p: any) => {
            const name = p.name.toLowerCase();
            if (name.includes('mug')) return 1;
            if (name.includes('hoodie')) return 2;
            if (name.includes('t-shirt') || name.includes('t shirt') || name.includes('sleeve t')) return 3;
            return 4;
        };

        return products.sort((a: any, b: any) => getSortWeight(a) - getSortWeight(b));
    } catch (error) {
        console.error('Error fetching products:', error);
        return MOCK_PRODUCTS;
    }
}

export async function fetchProductDetails(id: number): Promise<Product | null> {
    const apiKey = getApiKey();
    if (!apiKey) {
        return MOCK_PRODUCTS.find((p) => p.id === id) || null;
    }

    try {
        const res = await fetch(`${getBaseUrl()}/store/products/${id}`, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
        });

        if (!res.ok) {
            throw new Error(`Failed to load product details: ${res.status}`);
        }

        const data = await res.json();
        const result = data.result;
        const productSync = result.sync_product;
        const syncVariantsRaw = result.sync_variants || [];

        // Load cached Printful catalog costs for donation calculation
        let costsCache: Record<string, number> = {};
        try {
            const fs = require('fs');
            const path = require('path');
            const costsPath = path.join(process.cwd(), 'src', 'data', 'costs.json');
            if (fs.existsSync(costsPath)) {
                costsCache = JSON.parse(fs.readFileSync(costsPath, 'utf8'));
            }
        } catch (e) {
            console.warn('Could not load costs registry for donation calculation:', e);
        }

        const uniqueViews: Record<string, ProductViewImage> = {};

        const isMug = productSync.name.toLowerCase().includes('mug');

        for (const v of syncVariantsRaw) {
            const files = v.files;
            if (files) {
                for (const f of files) {
                    const type = f.type;
                    const url = f.preview_url;

                    // For mugs, we only want the generated mockups, not the raw flat artwork, so skip 'preview' unless it's apparel
                    if (isMug && type === "preview") {
                        continue;
                    }

                    // Only collect actual mockups (previews) for the gallery
                    if (url && type === "preview" && !uniqueViews[url]) {
                        uniqueViews[url] = { url, title: 'View' };
                    }
                }
            }
        }

        // Load generated mockups from registry
        try {
            // During build/dev, we can read directly from the public folder
            const registryRes = await fetch(`${getBaseUrl().replace('/api.printful.com', '')}/mockups.json`).catch(() => null);
            let registry: Record<string, any> = {};
            if (registryRes && registryRes.ok) {
                registry = await registryRes.json();
            } else {
                // Fallback for server-side fetching during dev/build
                const fs = require('fs');
                const path = require('path');
                const registryPath = path.join(process.cwd(), 'public', 'mockups.json');
                if (fs.existsSync(registryPath)) {
                    registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
                }
            }

            if (registry[id] && registry[id].urls) {
                registry[id].urls.forEach((url: string, index: number) => {
                    if (!uniqueViews[url]) {
                        uniqueViews[url] = { url, title: `Mockup ${index + 1}` };
                    }
                });
            }
        } catch (e) {
            console.warn('Could not load mockups registry:', e);
        }

        // Fetch Size Guide Data using the first variant's catalog product ID
        let sizeGuide: ProductSizeGuide | undefined = undefined;
        const catalogId = syncVariantsRaw[0]?.product?.product_id;

        if (catalogId) {
            try {
                const sizeRes = await fetch(`${getBaseUrl()}/v2/catalog-products/${catalogId}/sizes`, {
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (sizeRes.ok) {
                    const sizeData = await sizeRes.json();
                    if (sizeData.data && !sizeData.error) {
                        sizeGuide = sizeData.data as ProductSizeGuide;
                    }
                }
            } catch (err) {
                console.warn(`Failed to fetch size guide for catalog product ${catalogId}:`, err);
            }
        }

        return {
            id: productSync.id,
            name: productSync.name,
            description: '', // Can expand to fetch detailed descriptions if available
            thumbnail_url: productSync.thumbnail_url,
            variants: syncVariantsRaw.map((v: any) => {
                let donationAmount = 0;

                const retailPrice = parseFloat(v.retail_price);
                const catalogCost = costsCache[v.variant_id];

                if (!isNaN(retailPrice) && catalogCost !== undefined) {
                    const profit = retailPrice - catalogCost;
                    const runningCosts = retailPrice * 0.05; // 5% deduction for running costs
                    donationAmount = Math.round(profit - runningCosts);
                }

                return {
                    id: v.id,
                    product_id: v.sync_product_id,
                    name: v.name,
                    size: v.size,
                    color: v.color,
                    price: v.retail_price,
                    currency: v.currency,
                    inStock: true, // simplified
                    image_url: v.files?.find((f: any) => f.type === 'preview')?.preview_url || v.files?.[0]?.preview_url,
                    donationAmount,
                };
            }),
            viewImages: Object.values(uniqueViews),
            sizeGuide,
        };
    } catch (error) {
        console.error('Error fetching product details:', error);
        return MOCK_PRODUCTS.find((p) => p.id === id) || null;
    }
}
