/**
 * Populate website content from AI-generated data
 */

import { supabase } from './supabase';
import type { GeneratedContent } from './gemini-ai';

export async function populateWebsiteFromAI(websiteId: string, content: GeneratedContent) {
  try {
    // Update or create hero content
    const { data: heroData, error: heroError } = await supabase
      .from('hero_content')
      .select('id')
      .eq('website_id', websiteId)
      .maybeSingle();

    const heroUpdate = {
      slides: [{
        id: 1,
        title: content.hero.title,
        subtitle: content.hero.subtitle,
        image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1920'
      }],
      button_text: content.hero.buttonText,
      button_link: '#about',
      show_button: true,
      autoplay: true,
      autoplay_interval: 5000,
      show_navigation: true,
      show_indicators: true,
      parallax_enabled: false
    };

    if (heroData) {
      const { error } = await supabase
        .from('hero_content')
        .update(heroUpdate)
        .eq('id', heroData.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('hero_content')
        .insert({
          website_id: websiteId,
          ...heroUpdate
        });
      if (error) throw error;
    }

    // Update or create about content
    const { data: aboutData } = await supabase
      .from('about_content')
      .select('id')
      .eq('website_id', websiteId)
      .maybeSingle();

    const aboutUpdate = {
      heading: content.about.heading,
      subheading: content.about.subheading,
      description: content.about.description,
    };

    if (aboutData) {
      const { error } = await supabase
        .from('about_content')
        .update(aboutUpdate)
        .eq('id', aboutData.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('about_content')
        .insert({
          website_id: websiteId,
          ...aboutUpdate,
          image_url: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800'
        });
      if (error) throw error;
    }

    // Update or create why choose us
    const { data: whyChooseUsData } = await supabase
      .from('why_choose_us_content')
      .select('id')
      .eq('website_id', websiteId)
      .maybeSingle();

    const whyChooseUsUpdate = {
      heading: content.whyChooseUs.heading,
      subheading: content.whyChooseUs.subheading,
      reasons: content.whyChooseUs.reasons,
    };

    if (whyChooseUsData) {
      const { error } = await supabase
        .from('why_choose_us_content')
        .update(whyChooseUsUpdate)
        .eq('id', whyChooseUsData.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('why_choose_us_content')
        .insert({
          website_id: websiteId,
          ...whyChooseUsUpdate
        });
      if (error) throw error;
    }

    // Update or create menu config
    const { data: menuConfigData } = await supabase
      .from('menu_section_config')
      .select('id')
      .eq('website_id', websiteId)
      .maybeSingle();

    const menuConfigUpdate = {
      heading: content.menu.heading,
      subheading: content.menu.subheading,
    };

    if (menuConfigData) {
      const { error } = await supabase
        .from('menu_section_config')
        .update(menuConfigUpdate)
        .eq('id', menuConfigData.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('menu_section_config')
        .insert({
          website_id: websiteId,
          ...menuConfigUpdate
        });
      if (error) throw error;
    }

    // Get all existing categories first (single query)
    const { data: existingCategories } = await supabase
      .from('menu_categories')
      .select('id, name')
      .eq('website_id', websiteId);

    const existingCategoryMap = new Map(
      (existingCategories || []).map(cat => [cat.name, cat.id])
    );

    // Mark old categories as not visible (we're replacing them)
    const { error: markCategoriesError } = await supabase
      .from('menu_categories')
      .update({ is_visible: false })
      .eq('website_id', websiteId);
    if (markCategoriesError) {
      console.warn('Warning: Could not mark old categories as not visible:', markCategoriesError);
    }

    // Update existing categories and prepare new ones for insertion
    const categoriesToUpdate: Promise<any>[] = [];
    const categoriesToInsert = content.menu.categories
      .map((category, index) => {
        // If category exists, update it; otherwise insert new
        const existingId = existingCategoryMap.get(category.name);
        if (existingId) {
          // Queue update for existing category
          categoriesToUpdate.push(
            supabase
              .from('menu_categories')
              .update({
                description: category.description,
                is_visible: true,
                display_order: index,
              })
              .eq('id', existingId)
              .then(({ error }) => {
                if (error) {
                  console.warn(`Error updating category ${category.name}:`, error);
                  throw error;
                }
              })
          );
          return null; // Don't insert, already exists
        }
        return {
          website_id: websiteId,
          name: category.name,
          description: category.description,
          is_visible: true,
          display_order: index,
        };
      })
      .filter(cat => cat !== null) as any[];

    // Wait for all category updates to complete
    if (categoriesToUpdate.length > 0) {
      await Promise.all(categoriesToUpdate);
    }

    if (categoriesToInsert.length > 0) {
      const { data: newCategories, error: categoriesError } = await supabase
        .from('menu_categories')
        .insert(categoriesToInsert)
        .select('id, name');
      if (categoriesError) throw categoriesError;

      // Add new categories to map
      newCategories?.forEach(cat => {
        existingCategoryMap.set(cat.name, cat.id);
      });
    }

    // First, mark all existing menu items as unavailable (we're replacing them)
    const { error: markUnavailableError } = await supabase
      .from('menu_items')
      .update({ is_available: false })
      .eq('website_id', websiteId);
    if (markUnavailableError) {
      console.warn('Warning: Could not mark old menu items as unavailable:', markUnavailableError);
    }

    // Batch insert new menu items (much faster!)
    const itemsToInsert = content.menu.items
      .map((item, index) => {
        const categoryId = existingCategoryMap.get(item.category);
        if (!categoryId) {
          console.warn(`Category "${item.category}" not found for item "${item.name}"`);
          return null;
        }
        return {
          website_id: websiteId,
          name: item.name,
          description: item.description,
          price: item.price,
          category_id: categoryId,
          is_available: true,
          display_order: index,
        };
      })
      .filter(item => item !== null);

    if (itemsToInsert.length > 0) {
      const { error } = await supabase
        .from('menu_items')
        .insert(itemsToInsert);
      if (error) throw error;
    }

    // Initialize testimonials config if needed
    const { data: testimonialsConfigData } = await supabase
      .from('testimonials_config')
      .select('id')
      .eq('website_id', websiteId)
      .maybeSingle();

    if (!testimonialsConfigData) {
      const { error } = await supabase
        .from('testimonials_config')
        .insert({
          website_id: websiteId,
          heading: 'What Our Customers Say',
          subheading: 'Testimonials',
          show_ratings: true,
        });
      if (error) throw error;
    }

    // Batch insert testimonials (much faster!)
    const testimonialsToInsert = content.testimonials.map((testimonial, index) => ({
      website_id: websiteId,
      customer_name: testimonial.customer_name,
      customer_role: testimonial.customer_role,
      testimonial_text: testimonial.testimonial_text,
      rating: testimonial.rating,
      display_order: index,
    }));

    if (testimonialsToInsert.length > 0) {
      const { error } = await supabase
        .from('testimonials')
        .insert(testimonialsToInsert);
      if (error) throw error;
    }

    console.log('✅ Website content populated from AI successfully');
    console.log(`   - Hero content: ${heroData ? 'updated' : 'created'}`);
    console.log(`   - About content: ${aboutData ? 'updated' : 'created'}`);
    console.log(`   - Menu categories: ${categoriesToInsert.length} inserted`);
    console.log(`   - Menu items: ${itemsToInsert.length} inserted`);
    console.log(`   - Testimonials: ${testimonialsToInsert.length} inserted`);
  } catch (error) {
    console.error('❌ Error populating website content:', error);
    throw error;
  }
}

