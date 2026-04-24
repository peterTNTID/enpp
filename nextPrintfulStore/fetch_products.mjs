import fs from 'fs';

const apiKey = process.env.NEXT_PUBLIC_PRINTFUL_API_KEY;
const baseUrl = 'https://api.printful.com';

async function fetchProducts() {
    const res = await fetch(`${baseUrl}/store/products`, {
        headers: { Authorization: `Bearer ${apiKey}` }
    });
    const data = await res.json();
    console.log("Products:", data.result.map(p => ({ id: p.id, name: p.name })));
    return data.result;
}

async function fetchProduct(id) {
    const res = await fetch(`${baseUrl}/store/products/${id}`, {
        headers: { Authorization: `Bearer ${apiKey}` }
    });
    const data = await res.json();
    return data.result;
}

async function main() {
    const products = await fetchProducts();
    // Find a mug and a garment
    const mug = products.find(p => p.name.toLowerCase().includes('mug'));
    const tShirt = products.find(p => p.name.toLowerCase().includes('t-shirt') || p.name.toLowerCase().includes('hoodie'));

    if (mug) {
        console.log(`\nFetching Mug: ${mug.name} (${mug.id})`);
        const mugDetails = await fetchProduct(mug.id);
        const files = mugDetails.sync_variants[0].files;
        console.log("Mug Files (first variant):");
        files.forEach(f => console.log(`- Type: ${f.type}, URL: ${f.preview_url}`));
    }

    if (tShirt) {
        console.log(`\nFetching Garment: ${tShirt.name} (${tShirt.id})`);
        const shirtDetails = await fetchProduct(tShirt.id);
        const files = shirtDetails.sync_variants[0].files;
        console.log("Garment Files (first variant):");
        files.forEach(f => console.log(`- Type: ${f.type}, URL: ${f.preview_url}`));
    }
}

main().catch(console.error);
