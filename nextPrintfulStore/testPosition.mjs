import fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const apiKey = process.env.NEXT_PUBLIC_PRINTFUL_API_KEY;
const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.printful.com';

async function main() {
    const catalogId = 403; // Mug

    // We need to fetch the existing product to get its printfile URLs and variant id
    const productRes = await fetch(`${baseUrl}/store/products/416047267`, {
        headers: { Authorization: `Bearer ${apiKey}` }
    });
    const pData = await productRes.json();
    const firstVariant = pData.result.sync_variants[0];
    const mugFileUrl = firstVariant.files.find(f => f.type === 'default').preview_url;
    const variantId = firstVariant.product.variant_id; // This is the catalog variant ID

    const body = {
        format: 'png',
        variant_ids: [variantId],
        files: [
            {
                placement: 'default', // The placement from the sync product
                image_url: mugFileUrl,
                position: { // Printful sometimes requires this object for mugs
                    area_width: 2700,
                    area_height: 1048,
                    width: 2700,
                    height: 1048,
                    top: 0,
                    left: 0
                }
            }
        ]
    };

    console.log("Sending payload:", JSON.stringify(body, null, 2));

    const res = await fetch(`${baseUrl}/mockup-generator/create-task/${catalogId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
}

main().catch(console.error);
