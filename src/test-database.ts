/**
 * Database Connection Test Script
 * Run this to verify your database is set up correctly
 */

import { supabase, getWebsiteId } from './lib/supabase';

async function testDatabase() {
  console.log('🧪 Testing Supabase Database Connection\n');
  console.log('=' . repeat(50));
  
  // Test 1: Connection
  console.log('\n📡 Test 1: Supabase Connection');
  try {
    const { data, error } = await supabase.from('websites').select('count');
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
    console.log('\n⚠️  Run seed-golden-crumb.sql in Supabase');
    return;
  }
  
  // Test 3: Tables Exist
  console.log('\n📊 Test 3: Required Tables');
  const tables = [
    'hero_content',
    'about_content',
    'team_members',
    'testimonials',
    'faqs',
    'contact_info',
    'instagram_feed_config',
    'featured_products_config',
    'menu_section_config'
  ];
  
  let allTablesExist = true;
  for (const table of tables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('count')
        .limit(1);
      
      if (error) {
        console.log(`  ❌ ${table} - Missing`);
        allTablesExist = false;
      } else {
        console.log(`  ✅ ${table} - Exists`);
      }
    } catch (error) {
      console.log(`  ❌ ${table} - Error`);
      allTablesExist = false;
    }
  }
  
  if (!allTablesExist) {
    console.log('\n⚠️  Some tables are missing. Run database-schema.sql in Supabase');
    return;
  }
  
  // Test 4: Data Exists
  console.log('\n📝 Test 4: Content Data');
  
  const { data: hero, error: heroError } = await supabase
    .from('hero_content')
    .select('*')
    .eq('website_id', websiteId)
    .single();
  
  if (heroError || !hero) {
    console.log('  ❌ Hero content - No data');
    console.log('\n⚠️  Run seed-golden-crumb.sql in Supabase');
  } else {
    const slides = hero.slides as any[];
    console.log(`  ✅ Hero content - ${slides?.length || 0} slides`);
  }
  
  const { data: about, error: aboutError } = await supabase
    .from('about_content')
    .select('*')
    .eq('website_id', websiteId)
    .single();
  
  if (aboutError || !about) {
    console.log('  ❌ About content - No data');
  } else {
    console.log(`  ✅ About content - "${about.heading}"`);
  }
  
  const { data: team, error: teamError } = await supabase
    .from('team_members')
    .select('count')
    .eq('website_id', websiteId);
  
  if (teamError || !team) {
    console.log('  ❌ Team members - No data');
  } else {
    console.log(`  ✅ Team members - ${team.length} members`);
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('\n🎉 All tests passed! Your database is ready!');
  console.log('\nYou can now run: npm run dev');
  console.log('\n' + '='.repeat(50));
}

// Run the test
testDatabase().catch((error) => {
  console.error('\n💥 Fatal error:', error);
  console.log('\n⚠️  Check your Supabase configuration and try again.');
});

