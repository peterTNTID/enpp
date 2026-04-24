import fs from 'fs';
const apiKey = '***REMOVED***';
const baseUrl = 'https://api.printful.com';

async function main() {
    // 1. Get the store product for mug to find its catalog_product_id
    let res = await fetch(`${baseUrl}/store/products/416047267`, { headers: { Authorization: `Bearer ${apiKey}` } });
    let data = await res.json();
    let catalogId = data.result.sync_variants[0].product.product_id;
    console.log(`Mug Catalog ID: ${catalogId}`);

    // 2. Query Mockup Generator templates for this catalog ID
    res = await fetch(`${baseUrl}/mockup-generator/templates/${catalogId}`, { headers: { Authorization: `Bearer ${apiKey}` } });
    data = await res.json();

    if (data.result && data.result.variant_mapping) {
        console.log("Mockup Templates:", JSON.stringify(data.result.templates.map(t => ({
            template_id: t.template_id,
            image_url: t.image_url,
            title: t.title
        })), null, 2));
    } else {
        console.log("Response:", JSON.stringify(data, null, 2));
    }
}

main().catch(console.error);
