import fs from 'fs';
const apiKey = '***REMOVED***';
const baseUrl = 'https://api.printful.com';

async function fetchProduct(id) {
    const res = await fetch(`${baseUrl}/store/products/${id}`, {
        headers: { Authorization: `Bearer ${apiKey}` }
    });
    const data = await res.json();
    return data.result;
}

async function main() {
    const mugDetails = await fetchProduct(416047267);
    console.log(JSON.stringify(mugDetails.sync_product, null, 2));
}

main().catch(console.error);
