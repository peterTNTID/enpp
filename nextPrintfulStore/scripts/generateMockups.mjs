import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const apiKey = process.env.NEXT_PUBLIC_PRINTFUL_API_KEY;
const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.printful.com';

const PUBLIC_MOCKUPS_DIR = path.join(process.cwd(), 'public', 'mockups');
const REGISTRY_FILE = path.join(process.cwd(), 'public', 'mockups.json');

async function fetchProducts() {
    const res = await fetch(`${baseUrl}/store/products`, {
        headers: { Authorization: `Bearer ${apiKey}` }
    });
    if (!res.ok) throw new Error(`Failed to fetch products: ${res.statusText}`);
    const data = await res.json();
    return data.result;
}

async function fetchProduct(id) {
    const res = await fetch(`${baseUrl}/store/products/${id}`, {
        headers: { Authorization: `Bearer ${apiKey}` }
    });
    if (!res.ok) throw new Error(`Failed to fetch product ${id}: ${res.statusText}`);
    const data = await res.json();
    return data.result;
}

async function generateMockup(catalogId, variantId, placementFiles, format = 'png') {
    // Generate a mockup task
    const body = {
        format,
        variant_ids: [variantId],
        files: placementFiles,
        position: placementFiles[0].placement // Temporary fallback, but Printful API actually needs 'placement'
    };

    const res = await fetch(`${baseUrl}/mockup-generator/create-task/${catalogId}`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        const errorData = await res.json();
        console.error("Mockup task creation failed:", JSON.stringify(errorData, null, 2));
        throw new Error(`Failed to create mockup task: ${res.statusText}`);
    }

    const data = await res.json();
    const taskKey = data.result.task_key;
    console.log(`Task created: ${taskKey}. Polling for completion...`);

    // Poll for task completion
    return await pollMockupTask(taskKey);
}

async function pollMockupTask(taskKey, maxRetries = 20) {
    for (let i = 0; i < maxRetries; i++) {
        await new Promise(resolve => setTimeout(resolve, 3000)); // wait 3s

        const res = await fetch(`${baseUrl}/mockup-generator/task?task_key=${taskKey}`, {
            headers: { Authorization: `Bearer ${apiKey}` }
        });
        const data = await res.json();

        if (data.result.status === 'completed') {
            console.log(`Task ${taskKey} completed!`);
            return data.result.mockups;
        } else if (data.result.status === 'failed') {
            console.error(`Task ${taskKey} failed:`, data.result.error);
            throw new Error(`Task ${taskKey} failed`);
        }

        console.log(`Task ${taskKey} status: ${data.result.status}... waiting`);
    }
    throw new Error(`Task ${taskKey} timed out`);
}

async function downloadImage(url, filename) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch image: ${res.statusText}`);

    // We get response as array buffer
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const filePath = path.join(PUBLIC_MOCKUPS_DIR, filename);
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(filePath, buffer);
    return `/mockups/${filename}`;
}

async function main() {
    if (!apiKey) {
        console.error("NEXT_PUBLIC_PRINTFUL_API_KEY is missing in .env.local");
        process.exit(1);
    }

    await fs.promises.mkdir(PUBLIC_MOCKUPS_DIR, { recursive: true });
    let registry = {};
    if (fs.existsSync(REGISTRY_FILE)) {
        registry = JSON.parse(await fs.promises.readFile(REGISTRY_FILE, 'utf-8'));
    }

    console.log("Fetching all products...");
    const products = await fetchProducts();

    for (const p of products) {
        console.log(`\nProcessing ${p.name} (${p.id})...`);
        const productDetails = await fetchProduct(p.id);
        const variants = productDetails.sync_variants;

        if (!variants || variants.length === 0) continue;

        const isMug = p.name.toLowerCase().includes('mug');

        const firstVariant = variants[0];
        const catalogId = firstVariant.product.product_id;
        const variantId = firstVariant.product.variant_id;
        let filesList = [];

        // Find existing printfiles
        if (isMug) {
            // Usually mugs have a 'default' printfile
            const defaultFile = firstVariant.files.find(f => f.type === 'default');
            if (defaultFile) {
                // To get all mockups, we pass the printfile to the generator
                filesList.push({
                    placement: 'default',
                    image_url: defaultFile.preview_url || defaultFile.thumbnail_url,
                    position: {
                        area_width: 2700,
                        area_height: 1048,
                        width: 2700,
                        height: 1048,
                        top: 0,
                        left: 0
                    }
                });
            }
        } else {
            // Apparel
            // We want back mockups if back printfile exists
            const backFile = firstVariant.files.find(f => f.type === 'back');
            if (backFile) {
                filesList.push({
                    placement: 'back',
                    image_url: backFile.preview_url || backFile.thumbnail_url,
                    position: {
                        area_width: 1800,
                        area_height: 2400,
                        width: 1800,
                        height: 2400,
                        top: 0,
                        left: 0
                    }
                });
            }
        }

        if (filesList.length === 0 || !filesList[0].image_url) {
            console.log(`No applicable print files found for ${p.name}. Skipping.`);
            continue;
        }

        try {
            console.log(`Waiting 15 seconds to avoid rate limits...`);
            await new Promise(resolve => setTimeout(resolve, 15000));

            console.log(`Generating mockups for ${p.name}... placements: ${filesList.map(f => f.placement).join(', ')}`);
            const mockupsResult = await generateMockup(catalogId, variantId, filesList);
            console.log("Mockups Result:", JSON.stringify(mockupsResult, null, 2));

            let allMockupUrls = [];
            for (const item of mockupsResult) {
                // Determine if this item belongs to our variant
                const matchesVariant = item.variant_id === variantId || (item.variant_ids && item.variant_ids.includes(variantId));
                if (!matchesVariant) continue;

                if (item.mockup_url) allMockupUrls.push(item.mockup_url);

                if (isMug) {
                    if (item.mockups) {
                        for (const m of item.mockups) {
                            if (m.mockup_url) allMockupUrls.push(m.mockup_url);
                        }
                    }
                    if (item.extra) {
                        for (const ex of item.extra) {
                            if (ex.url) allMockupUrls.push(ex.url);
                        }
                    }
                } else if (item.extra) {
                    // For apparel we only want back mockups. Printful auto-generates front/sides anyway
                    for (const ex of item.extra) {
                        if (ex.title && ex.title.toLowerCase().includes('back') && ex.url) {
                            allMockupUrls.push(ex.url);
                        }
                    }
                }
            }

            if (allMockupUrls.length > 0) {
                if (!registry[p.id]) {
                    registry[p.id] = { urls: [] };
                }

                const timestamp = Math.floor(Date.now() / 1000);
                for (let i = 0; i < allMockupUrls.length; i++) {
                    const url = allMockupUrls[i];
                    const filename = `product_${p.id}_mockup_${i}_${timestamp}.jpg`;
                    console.log(`Downloading ${filename}...`);

                    const localPath = await downloadImage(url, filename);

                    // Add to registry without duplicates
                    if (!registry[p.id].urls.includes(localPath)) {
                        registry[p.id].urls.push(localPath);
                    }
                }

                // Restore custom mug mockup sorting
                if (p.id === 416047258 && registry[p.id].urls.length >= 3) {
                    const urls = registry[p.id].urls;
                    registry[p.id].urls = [urls[1], urls[0], urls[2], ...urls.slice(3)];
                } else if (p.id === 416047267 && registry[p.id].urls.length >= 3) {
                    const urls = registry[p.id].urls;
                    registry[p.id].urls = [urls[2], urls[0], urls[1], ...urls.slice(3)];
                }
            } else {
                console.log(`No mockups generated for ${p.name}.`);
            }
        } catch (error) {
            console.error(`Failed generating mockups for ${p.name}:`, error.message);
        }
    }

    // Save registry
    await fs.promises.writeFile(REGISTRY_FILE, JSON.stringify(registry, null, 2));
    console.log(`\nMockup generation complete! Registry saved to ${REGISTRY_FILE}`);
}

main().catch(console.error);
