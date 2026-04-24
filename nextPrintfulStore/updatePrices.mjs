import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars from .env.local
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            process.env[match[1].trim()] = match[2].trim();
        }
    });
}

const API_KEY = process.env.NEXT_PUBLIC_PRINTFUL_API_KEY;
if (!API_KEY) {
    console.error("Missing NEXT_PUBLIC_PRINTFUL_API_KEY");
    process.exit(1);
}

const BASE_URL = 'https://api.printful.com';

const delay = ms => new Promise(res => setTimeout(res, ms));

async function fetchWithRetry(url, options = {}, maxRetries = 5) {
    const defaultHeaders = {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
    };

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const res = await fetch(url, {
            ...options,
            headers: { ...defaultHeaders, ...options.headers }
        });

        if (res.ok) {
            return res.json();
        }

        if (res.status === 429) {
            const waitTime = 61000; // Wait 61 seconds to clear the 1-minute bucket completely
            console.log(`    Rate limited (429) on ${url}. Waiting ${waitTime / 1000}s before retry...`);
            await delay(waitTime);
            continue;
        }

        throw new Error(`API Error ${res.status} on ${url}`);
    }
    throw new Error(`Exceeded max retries for ${url}`);
}


async function updatePrices() {
    console.log("Starting bulk pricing update with rate limit handling...");
    try {
        const productsData = await fetchWithRetry(`${BASE_URL}/store/products`);
        const products = productsData.result || [];
        console.log(`Found ${products.length} products.`);

        let updatedCount = 0;

        for (const product of products) {
            console.log(`Processing product: ${product.name} (ID: ${product.id})`);
            const detailsData = await fetchWithRetry(`${BASE_URL}/store/products/${product.id}`);
            const variants = detailsData.result?.sync_variants || [];

            for (const variant of variants) {
                try {
                    const catalogData = await fetchWithRetry(`${BASE_URL}/products/variant/${variant.variant_id}`);
                    const cost = parseFloat(catalogData.result?.variant?.price);

                    if (!isNaN(cost) && cost > 0) {
                        // Margin = (Retail - Cost) / Retail
                        // Retail * (1 - 0.15) = Cost -> Retail * 0.85 = Cost 
                        // Retail = Cost / 0.85
                        const exactRetail = cost / 0.85;

                        // Round UP to nearest dollar
                        const newRetail = Math.ceil(exactRetail);

                        const oldRetail = parseFloat(variant.retail_price);

                        if (oldRetail !== newRetail) {
                            console.log(`  Updating variant ${variant.id} (${variant.name}) - Cost: $${cost.toFixed(2)}, Old: $${oldRetail.toFixed(2)} -> New: $${newRetail.toFixed(2)}`);

                            await fetchWithRetry(`${BASE_URL}/store/variants/${variant.id}`, {
                                method: 'PUT',
                                body: JSON.stringify({
                                    retail_price: newRetail.toFixed(2)
                                })
                            });
                            updatedCount++;
                        } else {
                            console.log(`  Variant ${variant.id} (${variant.name}) already at correct price: $${newRetail.toFixed(2)}`);
                        }
                    }

                    await delay(500); // Base delay of 0.5s to be safe
                } catch (err) {
                    console.error(`  Failed to process variant ${variant.id}:`, err.message);
                }
            }
        }

        console.log(`\nFinished! Successfully updated ${updatedCount} variant prices.`);
    } catch (err) {
        console.error("Fatal error:", err);
    }
}

updatePrices();
