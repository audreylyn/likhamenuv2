
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Read .env file manually
try {
    const envPath = path.resolve(__dirname, '.env');
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
} catch (e) {
    // If .env doesn't exist, maybe it is .env.local
    try {
        const envPath = path.resolve(__dirname, '.env.local');
        const envContent = fs.readFileSync(envPath, 'utf-8');
        envContent.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                process.env[key.trim()] = value.trim();
            }
        });
    } catch (err) {
        console.log('No .env or .env.local found or readable');
    }
}

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
    console.log('Available env keys:', Object.keys(process.env))
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function listBuckets() {
    const { data, error } = await supabase.storage.listBuckets()
    if (error) {
        console.error('Error listing buckets:', error)
    } else {
        console.log('Buckets:', JSON.stringify(data, null, 2))

        // Also try to list files in 'images' bucket to see if permissions allow it
        console.log('\nListing files in "images" bucket...')
        const { data: files, error: listError } = await supabase.storage.from('images').list()
        if (listError) {
            console.error('Error listing "images":', listError)
        } else {
            console.log(`Found ${files.length} files in "images" bucket.`)
            if (files.length > 0) console.log('Sample file:', files[0])
        }
    }
}

listBuckets()
