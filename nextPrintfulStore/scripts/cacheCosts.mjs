import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').filter(Boolean).forEach(line => {
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
const DATA_DIR = path.join(__dirname, 'src', 'data');
const COSTS_FILE = path.join(DATA_DIR, 'costs.json');

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
            const waitTime = 61000;
            console.log(`    Rate limited (429) on ${url}. Waiting ${waitTime / 1000}s before retry...`);
            await delay(waitTime);
            continue;
        }

        throw new Error(`API Error ${res.status} on ${url}`);
    }
    throw new Error(`Exceeded max retries for ${url}`);
}

async function cacheCosts() {
    console.log("Starting to cache variant costs...");
    try {
        // Ensure data directory exists
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }

        // Load existing cache if any to avoid re-fetching unchanged variants, optional but good.
        let costsCache = {};
        if (fs.existsSync(COSTS_FILE)) {
            costsCache = JSON.parse(fs.readFileSync(COSTS_FILE, 'utf8'));
        }

        const productsData = await fetchWithRetry(`${BASE_URL}/store/products`);
        const products = productsData.result || [];
        console.log(`Found ${products.length} products.`);

        let cachedCount = 0;

        for (const product of products) {
            console.log(`Processing product: ${product.name} (ID: ${product.id})`);
            const detailsData = await fetchWithRetry(`${BASE_URL}/store/products/${product.id}`);
            const variants = detailsData.result?.sync_variants || [];

            for (const variant of variants) {
                if (!costsCache[variant.id]) {
                    try {
                        const catalogData = await fetchWithRetry(`${BASE_URL}/products/variant/${variant.variant_id}`);
                        const cost = parseFloat(catalogData.result?.variant?.price);

                        if (!isNaN(cost) && cost > 0) {
                            costsCache[variant.id] = cost;
                            cachedCount++;
                            console.log(`  Cached cost for variant ${variant.id}: $${cost.toFixed(2)}`);
                        }

                        await delay(500); // 0.5s delay to be safe
                    } catch (err) {
                        console.error(`  Failed to fetch cost for variant ${variant.id}:`, err.message);
                    }
                } else {
                    console.log(`  Cost for variant ${variant.id} already cached.`);
                }
            }
        }

        // Save to file
        fs.writeFileSync(COSTS_FILE, JSON.stringify(costsCache, null, 2));
        console.log(`\nFinished! Successfully cached ${cachedCount} new variant costs. Total cached: ${Object.keys(costsCache).length}`);
    } catch (err) {
        console.error("Fatal error:", err);
    }
}

cacheCosts();
