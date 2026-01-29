import { supabase, getWebsiteId } from './lib/supabase';

async function testConnection() {
  console.log('Testing Supabase connection...');
  
  const websiteId = await getWebsiteId();
  
  if (websiteId) {
    console.log('✅ Connected! Website ID:', websiteId);
  } else {
    console.error('❌ Connection failed');
  }
}

testConnection();