import { createClient } from '@supabase/supabase-js';

// Environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Error: Missing Supabase credentials. Ensure SUPABASE_URL and SUPABASE_ANON_KEY are set.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function keepAlive() {
    console.log(`Pinging Supabase at ${SUPABASE_URL}...`);

    try {
        // Simple query to wake up the database
        // We query the 'websites' table, selecting just one record
        const { data, error } = await supabase
            .from('websites')
            .select('id')
            .limit(1);

        if (error) {
            throw error;
        }

        console.log('✅ Keep-alive ping successful!');
        console.log(`Received ${data.length} row(s) from database.`);
    } catch (err) {
        console.error('❌ Keep-alive ping failed:', err.message);
        process.exit(1);
    }
}

keepAlive();
