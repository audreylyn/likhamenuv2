/**
 * Check specific tables that are showing 406 errors
 */

import { supabase, getWebsiteId } from './lib/supabase';

async function checkTables() {
  console.log('🔍 Checking problematic tables...\n');
  
  const websiteId = await getWebsiteId();
  console.log('Website ID:', websiteId, '\n');
  
  // Check featured_products_config
  console.log('1️⃣ Checking featured_products_config...');
  const { data: fpConfig, error: fpError } = await supabase
    .from('featured_products_config')
    .select('*')
    .eq('website_id', websiteId);
  
  if (fpError) {
    console.log('❌ Error:', fpError.message);
    console.log('   Code:', fpError.code);
    console.log('   Details:', fpError.details);
  } else {
    console.log('✅ Data:', fpConfig?.length || 0, 'rows');
    if (fpConfig && fpConfig.length > 0) {
      console.log('   First row:', fpConfig[0]);
    }
  }
  
  // Check menu_section_config
  console.log('\n2️⃣ Checking menu_section_config...');
  const { data: menuConfig, error: menuError } = await supabase
    .from('menu_section_config')
    .select('*')
    .eq('website_id', websiteId);
  
  if (menuError) {
    console.log('❌ Error:', menuError.message);
    console.log('   Code:', menuError.code);
    console.log('   Details:', menuError.details);
  } else {
    console.log('✅ Data:', menuConfig?.length || 0, 'rows');
    if (menuConfig && menuConfig.length > 0) {
      console.log('   First row:', menuConfig[0]);
    }
  }
  
  // Check if tables even exist
  console.log('\n3️⃣ Checking if tables exist in schema...');
  const { data: tables, error: tablesError } = await supabase
    .rpc('get_tables');
  
  if (tablesError) {
    console.log('   Note: Could not list tables (expected)');
  }
  
  // Try a direct query without filters
  console.log('\n4️⃣ Trying queries without filters...');
  
  const { data: fp2, error: fp2Error } = await supabase
    .from('featured_products_config')
    .select('*')
    .limit(1);
  
  console.log('featured_products_config (no filter):', fp2Error ? '❌ ' + fp2Error.message : '✅ ' + fp2?.length + ' rows');
  
  const { data: menu2, error: menu2Error } = await supabase
    .from('menu_section_config')
    .select('*')
    .limit(1);
  
  console.log('menu_section_config (no filter):', menu2Error ? '❌ ' + menu2Error.message : '✅ ' + menu2?.length + ' rows');
}

checkTables();

