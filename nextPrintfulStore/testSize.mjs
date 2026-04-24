import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testFetch() {
    const apiKey = process.env.NEXT_PUBLIC_PRINTFUL_API_KEY;
    // Let's test a different product that is likely apparel (e.g. ID 416047266, 411438586)
    const res = await fetch(`https://api.printful.com/store/products/411438586`, {
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
    });

    const data = await res.json();
    console.log(JSON.stringify(data.result.sync_variants[0], null, 2));

    // Wait, let's see what catalog product ID we can pull out of a variant
    const catalogId = data.result.sync_variants[0].product.product_id;
    console.log("Catalog Product ID is:", catalogId);

    if (catalogId) {
        // According to Printful API V2, we need the catalog ID to get the size guide
        const sizeRes = await fetch(`https://api.printful.com/v2/catalog-products/${catalogId}/sizes`, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            }
        });
        const sizeData = await sizeRes.json();
        console.log("Size Data from V2:", JSON.stringify(sizeData, null, 2));
    }
}

testFetch();
