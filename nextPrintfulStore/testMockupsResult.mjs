import fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const apiKey = process.env.NEXT_PUBLIC_PRINTFUL_API_KEY;
const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.printful.com';

async function main() {
    const productRes = await fetch(`${baseUrl}/store/products/411438586`, { headers: { Authorization: `Bearer ${apiKey}` } });
    const pData = await productRes.json();
    const firstVariant = pData.result.sync_variants[0];
    
    // Check type of variant_id
    console.log("variant_id type:", typeof firstVariant.product.variant_id, "value:", firstVariant.product.variant_id);
}

main().catch(console.error);
