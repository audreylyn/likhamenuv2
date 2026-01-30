/**
 * Database Connection Test Script
 * Run this to verify your database is set up correctly
 */

import { supabase, getWebsiteId } from './lib/supabase';

async function testDatabase() {
  console.log('🧪 Testing Supabase Database Connection (JSONB Schema)\n');
  console.log('='.repeat(50));

  // Test 1: Connection
  console.log('\n📡 Test 1: Supabase Connection');
  try {
    const { data, error } = await supabase.from('websites').select('count', { count: 'exact', head: true });
    if (error) throw error;
    console.log('✅ Connected to Supabase successfully');
  } catch (error: any) {
    console.log('❌ Connection failed:', error.message);
    console.log('\n⚠️  Check your API credentials in src/lib/supabase.ts');
    return;
  }

  // Test 2: Website ID
  console.log('\n🏢 Test 2: Website ID');
  const websiteId = await getWebsiteId();
  if (websiteId) {
    console.log('✅ Website ID found:', websiteId);
  } else {
    console.log('❌ No website ID found');
    console.log('\n⚠️  Run database-schema.sql in Supabase');
    return;
  }

  // Test 3: Website Data
  console.log('\n📊 Test 3: Website Data & Structure');
  const { data: website, error: websiteError } = await supabase
    .from('websites')
    .select('*')
    .eq('id', websiteId)
    .single();

  if (websiteError || !website) {
    console.log('❌ Error fetching website data:', websiteError?.message);
    return;
  }

  console.log(`✅ Website loaded: ${website.title}`);

  // Test 4: Content Data
  console.log('\n📝 Test 4: JSONB Content');
  const content = website.content as any;
  const sections = [
    'hero',
    'about',
    'team',
    'testimonials',
    'faq',
    'contact',
    'menu'
  ];

  if (!content) {
    console.log('❌ No content JSON found in website record');
    return;
  }

  let allSectionsExist = true;
  for (const section of sections) {
    if (content[section]) {
      console.log(`  ✅ ${section} - Present`);
    } else {
      console.log(`  ❌ ${section} - Missing`);
      allSectionsExist = false;
    }
  }

  if (allSectionsExist) {
    console.log('\n🎉 JSONB structure looks good!');
  } else {
    console.log('\n⚠️  Some sections are missing from the content JSON.');
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('\n🎉 Database tests completed.');
  console.log('\n' + '='.repeat(50));
}

// Run the test
testDatabase().catch((error) => {
  console.error('\n💥 Fatal error:', error);
  console.log('\n⚠️  Check your Supabase configuration and try again.');
});

