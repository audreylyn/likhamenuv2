/**
 * Check specific tables that are showing 406 errors
 * Standalone script that loads .env manually
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES modules shim for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env manually
const loadEnv = () => {
  try {
    console.log('CWD:', process.cwd());
    const envPath = path.resolve(process.cwd(), '.env');
    console.log('Loading .env from:', envPath);

    if (!fs.existsSync(envPath)) {
      console.log('❌ .env file not found');
      return {};
    }

    const envContent = fs.readFileSync(envPath, 'utf-8');
    const env: Record<string, string> = {};
    // Split on both LF and CRLF
    envContent.split(/\r?\n/).forEach(rawLine => {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) return;
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        env[key] = value;
      }
    });
    console.log('Loaded keys:', Object.keys(env));
    return env;
  } catch (e) {
    console.error('Error loading .env', e);
    return {};
  }
};

const env = loadEnv();
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_KEY = env.VITE_SUPABASE_ANON_KEY;
const DOMAIN = env.VITE_DOMAIN || 'golden-crumb'; // Default/Fallback

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials in .env');
  console.error('   URL:', SUPABASE_URL);
  // Don't log key strictly, but check if it's there
  console.error('   Key present:', !!SUPABASE_KEY);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkTables() {
  console.log('🔍 Checking database connection and structure...\n');
  console.log(`Using Supabase URL: ${SUPABASE_URL}`);

  // 1. Check websites table
  console.log('\n1️⃣ Checking websites table...');
  // Try to find a website, preferably the one matching the domain/subdomain

  const { data: websites, error: websiteError } = await supabase
    .from('websites')
    .select('*')
    .limit(1);

  if (websiteError) {
    console.log('❌ Error connecting to websites table:', websiteError.message);
    if (websiteError.code) console.log('   Code:', websiteError.code);
    return; // Stop if basic connection fails
  }

  if (!websites || websites.length === 0) {
    console.log('⚠️  Connection successful, but "websites" table is empty.');
    console.log('   (This is expected if no sites are created yet)');
  } else {
    const website = websites[0];
    const websiteContent = website.content;
    const websiteEnabledSections = website.enabledsections;

    console.log(`✅ Connection successful! Found website: "${website.title || 'Untitled'}" (ID: ${website.id})`);
    console.log('   Status:', website.status);

    // Check JSONB content
    console.log('\n2️⃣ Checking JSONB content structure...');

    if (!websiteContent) {
      console.log('❌ Content field is null or empty');
    } else {
      console.log('✅ Content field exists');
      const content = websiteContent;
      console.log('   - Hero:', content.hero ? '✅ Present' : '❌ Missing');
      console.log('   - Menu:', content.menu ? '✅ Present' : '❌ Missing');
      console.log('   - Contact:', content.contact ? '✅ Present' : '❌ Missing');
    }

    if (!websiteEnabledSections) {
      console.log('❌ enabledSections field is null or empty');
    } else {
      console.log('✅ enabledSections:', Array.isArray(websiteEnabledSections) ? websiteEnabledSections.join(', ') : websiteEnabledSections);
    }
  }

  // 3. Check contact_submissions table
  console.log('\n3️⃣ Checking contact_submissions table...');
  const { error: submissionsError } = await supabase
    .from('contact_submissions')
    .select('count', { count: 'exact', head: true });

  if (submissionsError) {
    if (submissionsError.code === '42P01') {
      console.log('❌ Table contact_submissions DOES NOT EXIST in the database.');
      console.log('   Action: Please run the SQL in database-schema.sql');
    } else if (submissionsError.code === '42501') {
      console.log('⚠️  Table contact_submissions exists (Permission denied - expected for anon check)');
    } else {
      console.log('❌ Error checking contact_submissions:', submissionsError.message);
    }
  } else {
    console.log('✅ Table contact_submissions exists and is accessible');
  }
}

checkTables();
