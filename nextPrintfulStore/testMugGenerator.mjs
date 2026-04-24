import fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const apiKey = process.env.NEXT_PUBLIC_PRINTFUL_API_KEY;
const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.printful.com';

async function generateMockup(catalogId, variantId, placementFiles) {
    const body = {
        format: 'png',
        variant_ids: [variantId],
        files: placementFiles
    };

    const res = await fetch(`${baseUrl}/mockup-generator/create-task/${catalogId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    const data = await res.json();
    console.log("Task Create Response:", JSON.stringify(data, null, 2));
    const taskKey = data.result?.task_key;
    if (!taskKey) return null;

    for (let i = 0; i < 10; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const tRes = await fetch(`${baseUrl}/mockup-generator/task?task_key=${taskKey}`, { headers: { Authorization: `Bearer ${apiKey}` } });
        const tData = await tRes.json();
        
        if (tData.result?.status === 'completed') {
            return tData.result.mockups;
        } else if (tData.result?.status === 'failed') {
            throw new Error(`Task failed: ` + tData.result.error);
        }
    }
    return null;
}

async function main() {
    // Mug: 416047267
    const pRes = await fetch(`${baseUrl}/store/products/416047267`, { headers: { Authorization: `Bearer ${apiKey}` } });
    const pData = await pRes.json();
    
    const v = pData.result.sync_variants[0];
    const catalogId = v.product.product_id;
    const variantId = v.product.variant_id;
    
    console.log(`catalogId: ${catalogId}, variantId: ${variantId}`);
    
    // Default URL
    const file = v.files.find(f => f.type === 'default');
    
    const filesList = [{
        placement: 'default',
        image_url: file.preview_url || file.thumbnail_url,
        position: { area_width: 2700, area_height: 1048, width: 2700, height: 1048, top: 0, left: 0 }
    }];

    const mockups = await generateMockup(catalogId, variantId, filesList);
    console.log("MOCKUPS RESULT:", JSON.stringify(mockups, null, 2));
}

main().catch(console.error);
