import fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const apiKey = process.env.NEXT_PUBLIC_PRINTFUL_API_KEY;
const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.printful.com';

async function fetchProduct(id) {
    const res = await fetch(`${baseUrl}/store/products/${id}`, {
        headers: { Authorization: `Bearer ${apiKey}` }
    });
    const data = await res.json();
    return data.result;
}

async function main() {
    const p = await fetchProduct(411438586);
    console.log(JSON.stringify(p.sync_variants[0].files, null, 2));
}

main().catch(console.error);
