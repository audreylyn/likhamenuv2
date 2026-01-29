/**
 * Copy website content from source website to target website
 * Used to initialize new websites with content from golden-crumb
 */

import { supabase } from './supabase';

/**
 * Get the golden-crumb website ID
 */
async function getGoldenCrumbWebsiteId(): Promise<string | null> {
  const { data, error } = await supabase
    .from('websites')
    .select('id')
    .eq('subdomain', 'golden-crumb')
    .eq('is_active', true)
    .single();

  if (error || !data) {
    console.error('Error finding golden-crumb website:', error);
    return null;
  }

  return data.id;
}

/**
 * Copy all content from source website to target website
 * @param enabledSections - Optional array of section names to enable. If not provided, all sections except specialOffers will be enabled.
 */
export async function copyWebsiteContent(targetWebsiteId: string, sourceWebsiteId?: string, enabledSections?: string[]): Promise<void> {
  try {
    // If no source website provided, use golden-crumb as default
    const sourceId = sourceWebsiteId || await getGoldenCrumbWebsiteId();
    
    if (!sourceId) {
      throw new Error('Source website (golden-crumb) not found. Please ensure golden-crumb website exists.');
    }

    console.log(`📋 Copying content from website ${sourceId} to ${targetWebsiteId}...`);

    // 1. Copy website_themes
    const { data: themeData } = await supabase
      .from('website_themes')
      .select('*')
      .eq('website_id', sourceId)
      .single();

    if (themeData) {
      const { theme_config, custom_css } = themeData;
      await supabase.from('website_themes').upsert({
        website_id: targetWebsiteId,
        theme_config,
        custom_css,
      }, { onConflict: 'website_id' });
    }

    // 2. Copy website_sections (respect enabledSections parameter)
    const { data: sections } = await supabase
      .from('website_sections')
      .select('*')
      .eq('website_id', sourceId);

    if (sections && sections.length > 0) {
      const sectionsToInsert = sections.map(section => {
        let isEnabled = section.is_enabled;
        
        // If enabledSections array is provided, only enable sections in that array
        if (enabledSections !== undefined) {
          isEnabled = enabledSections.includes(section.section_name);
        } else {
          // Default behavior: disable specialOffers, enable everything else
          if (section.section_name === 'specialOffers') {
            isEnabled = false;
          }
        }
        
        return {
          website_id: targetWebsiteId,
          section_name: section.section_name,
          is_enabled: isEnabled,
          display_order: section.display_order,
          custom_config: section.custom_config,
        };
      });

      // Delete existing sections first
      await supabase.from('website_sections').delete().eq('website_id', targetWebsiteId);
      
      // Insert copied sections with proper enabled state
      await supabase.from('website_sections').insert(sectionsToInsert);
    }

    // 3. Copy navbar_content
    const { data: navbarData } = await supabase
      .from('navbar_content')
      .select('*')
      .eq('website_id', sourceId)
      .single();

    if (navbarData) {
      const { brand_name, brand_logo_url, show_cart, sticky_nav, nav_items, cta_button } = navbarData;
      await supabase.from('navbar_content').upsert({
        website_id: targetWebsiteId,
        brand_name,
        brand_logo_url,
        show_cart,
        sticky_nav,
        nav_items,
        cta_button,
      }, { onConflict: 'website_id' });
    }

    // 4. Copy hero_content
    const { data: heroData } = await supabase
      .from('hero_content')
      .select('*')
      .eq('website_id', sourceId)
      .single();

    if (heroData) {
      const { slides, button_text, button_link, show_button, autoplay, autoplay_interval, show_navigation, show_indicators, parallax_enabled } = heroData;
      await supabase.from('hero_content').upsert({
        website_id: targetWebsiteId,
        slides,
        button_text,
        button_link,
        show_button,
        autoplay,
        autoplay_interval,
        show_navigation,
        show_indicators,
        parallax_enabled,
      }, { onConflict: 'website_id' });
    }

    // 5. Copy about_content
    const { data: aboutData } = await supabase
      .from('about_content')
      .select('*')
      .eq('website_id', sourceId)
      .single();

    if (aboutData) {
      const { heading, subheading, description, image_url, image_position, features, stats } = aboutData;
      await supabase.from('about_content').upsert({
        website_id: targetWebsiteId,
        heading,
        subheading,
        description,
        image_url,
        image_position,
        features,
        stats,
      }, { onConflict: 'website_id' });
    }

    // 6. Copy why_choose_us_content
    const { data: whyChooseUsData } = await supabase
      .from('why_choose_us_content')
      .select('*')
      .eq('website_id', sourceId)
      .single();

    if (whyChooseUsData) {
      const { heading, subheading, reasons, background_style } = whyChooseUsData;
      await supabase.from('why_choose_us_content').upsert({
        website_id: targetWebsiteId,
        heading,
        subheading,
        reasons,
        background_style,
      }, { onConflict: 'website_id' });
    }

    // 7. Copy team_section_config
    const { data: teamConfigData } = await supabase
      .from('team_section_config')
      .select('*')
      .eq('website_id', sourceId)
      .single();

    if (teamConfigData) {
      const { heading, subheading, layout, columns, show_social_links } = teamConfigData;
      await supabase.from('team_section_config').upsert({
        website_id: targetWebsiteId,
        heading,
        subheading,
        layout,
        columns,
        show_social_links,
      }, { onConflict: 'website_id' });
    }

    // 8. Copy team_members
    const { data: teamMembers } = await supabase
      .from('team_members')
      .select('*')
      .eq('website_id', sourceId);

    if (teamMembers && teamMembers.length > 0) {
      // Delete existing team members
      await supabase.from('team_members').delete().eq('website_id', targetWebsiteId);
      
      const membersToInsert = teamMembers.map(member => ({
        website_id: targetWebsiteId,
        name: member.name,
        role: member.role,
        bio: member.bio,
        image_url: member.image_url,
        social_links: member.social_links,
        display_order: member.display_order,
        is_featured: member.is_featured,
      }));

      await supabase.from('team_members').insert(membersToInsert);
    }

    // 9. Copy menu_categories
    const { data: menuCategories } = await supabase
      .from('menu_categories')
      .select('*')
      .eq('website_id', sourceId);

    if (menuCategories && menuCategories.length > 0) {
      // Delete existing categories
      await supabase.from('menu_categories').delete().eq('website_id', targetWebsiteId);
      
      const categoriesToInsert = menuCategories.map(cat => ({
        website_id: targetWebsiteId,
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        display_order: cat.display_order,
      }));

      await supabase.from('menu_categories').insert(categoriesToInsert);
    }

    // 10. Copy menu_section_config
    const { data: menuConfigData } = await supabase
      .from('menu_section_config')
      .select('*')
      .eq('website_id', sourceId)
      .single();

    if (menuConfigData) {
      const { heading, subheading, layout, show_categories, show_filters } = menuConfigData;
      await supabase.from('menu_section_config').upsert({
        website_id: targetWebsiteId,
        heading,
        subheading,
        layout,
        show_categories,
        show_filters,
      }, { onConflict: 'website_id' });
    }

    // 11. Copy contact_info
    const { data: contactData } = await supabase
      .from('contact_info')
      .select('*')
      .eq('website_id', sourceId)
      .single();

    if (contactData) {
      const { heading, subheading, email, phone, address, city, state, zip_code, country, google_maps_url, facebook_messenger_id, social_links, show_contact_form, show_map, form_email_recipient } = contactData;
      await supabase.from('contact_info').upsert({
        website_id: targetWebsiteId,
        heading,
        subheading,
        email,
        phone,
        address,
        city,
        state,
        zip_code,
        country,
        google_maps_url,
        facebook_messenger_id,
        social_links,
        show_contact_form,
        show_map,
        form_email_recipient,
      }, { onConflict: 'website_id' });
    }

    // 12. Copy instagram_feed_config
    const { data: instagramData } = await supabase
      .from('instagram_feed_config')
      .select('*')
      .eq('website_id', sourceId)
      .single();

    if (instagramData) {
      const { heading, subheading, instagram_handle, instagram_url, feed_items, max_items, layout } = instagramData;
      await supabase.from('instagram_feed_config').upsert({
        website_id: targetWebsiteId,
        heading,
        subheading,
        instagram_handle,
        instagram_url,
        feed_items,
        max_items,
        layout,
      }, { onConflict: 'website_id' });
    }

    // 13. Copy footer_content
    const { data: footerData } = await supabase
      .from('footer_content')
      .select('*')
      .eq('website_id', sourceId)
      .single();

    if (footerData) {
      const { about_text, copyright_text, footer_columns, show_social_links, show_newsletter, newsletter_heading, newsletter_placeholder } = footerData;
      await supabase.from('footer_content').upsert({
        website_id: targetWebsiteId,
        about_text,
        copyright_text,
        footer_columns,
        show_social_links,
        show_newsletter,
        newsletter_heading,
        newsletter_placeholder,
      }, { onConflict: 'website_id' });
    }

    // 14. Copy testimonials_config
    const { data: testimonialsConfigData } = await supabase
      .from('testimonials_config')
      .select('*')
      .eq('website_id', sourceId)
      .single();

    if (testimonialsConfigData) {
      const { heading, subheading, layout, show_ratings, autoplay } = testimonialsConfigData;
      await supabase.from('testimonials_config').upsert({
        website_id: targetWebsiteId,
        heading,
        subheading,
        layout,
        show_ratings,
        autoplay,
      }, { onConflict: 'website_id' });
    }

    // 15. Copy testimonials
    const { data: testimonials } = await supabase
      .from('testimonials')
      .select('*')
      .eq('website_id', sourceId);

    if (testimonials && testimonials.length > 0) {
      // Delete existing testimonials
      await supabase.from('testimonials').delete().eq('website_id', targetWebsiteId);
      
      const testimonialsToInsert = testimonials.map(testimonial => ({
        website_id: targetWebsiteId,
        customer_name: testimonial.customer_name,
        customer_role: testimonial.customer_role,
        customer_image_url: testimonial.customer_image_url,
        rating: testimonial.rating,
        testimonial_text: testimonial.testimonial_text,
        display_order: testimonial.display_order,
        is_featured: testimonial.is_featured,
      }));

      await supabase.from('testimonials').insert(testimonialsToInsert);
    }

    // 16. Copy faq_config
    const { data: faqConfigData } = await supabase
      .from('faq_config')
      .select('*')
      .eq('website_id', sourceId)
      .single();

    if (faqConfigData) {
      const { heading, subheading, layout, show_categories } = faqConfigData;
      await supabase.from('faq_config').upsert({
        website_id: targetWebsiteId,
        heading,
        subheading,
        layout,
        show_categories,
      }, { onConflict: 'website_id' });
    }

    // 17. Copy faqs (including categories)
    const { data: faqCategories } = await supabase
      .from('faq_categories')
      .select('*')
      .eq('website_id', sourceId);

    if (faqCategories && faqCategories.length > 0) {
      await supabase.from('faq_categories').delete().eq('website_id', targetWebsiteId);
      
      const categoriesToInsert = faqCategories.map(cat => ({
        website_id: targetWebsiteId,
        name: cat.name,
        display_order: cat.display_order,
      }));

      const { data: insertedCategories } = await supabase
        .from('faq_categories')
        .insert(categoriesToInsert)
        .select();

      // Copy FAQs with category mapping
      const { data: faqs } = await supabase
        .from('faqs')
        .select('*')
        .eq('website_id', sourceId);

      if (faqs && faqs.length > 0 && insertedCategories) {
        await supabase.from('faqs').delete().eq('website_id', targetWebsiteId);
        
        const faqsToInsert = faqs.map(faq => {
          // Find matching category in new categories
          const oldCategory = faqCategories.find(cat => cat.id === faq.category_id);
          const newCategory = insertedCategories.find(cat => cat.name === oldCategory?.name);
          
          return {
            website_id: targetWebsiteId,
            category_id: newCategory?.id || null,
            question: faq.question,
            answer: faq.answer,
            display_order: faq.display_order,
            is_featured: faq.is_featured,
          };
        });

        await supabase.from('faqs').insert(faqsToInsert);
      }
    } else {
      // Copy FAQs without categories
      const { data: faqs } = await supabase
        .from('faqs')
        .select('*')
        .eq('website_id', sourceId);

      if (faqs && faqs.length > 0) {
        await supabase.from('faqs').delete().eq('website_id', targetWebsiteId);
        
        const faqsToInsert = faqs.map(faq => ({
          website_id: targetWebsiteId,
          category_id: null,
          question: faq.question,
          answer: faq.answer,
          display_order: faq.display_order,
          is_featured: faq.is_featured,
        }));

        await supabase.from('faqs').insert(faqsToInsert);
      }
    }

    // 18. Copy reservation_config
    const { data: reservationData } = await supabase
      .from('reservation_config')
      .select('*')
      .eq('website_id', sourceId)
      .single();

    if (reservationData) {
      const { heading, subheading, description, max_party_size, features, booking_instructions } = reservationData;
      await supabase.from('reservation_config').upsert({
        website_id: targetWebsiteId,
        heading,
        subheading,
        description,
        max_party_size,
        features,
        booking_instructions,
      }, { onConflict: 'website_id' });
    }

    // 19. Copy chat_support_config
    const { data: chatData } = await supabase
      .from('chat_support_config')
      .select('*')
      .eq('website_id', sourceId)
      .single();

    if (chatData) {
      const { greeting_message, offline_message, position, theme_color, agent_name, agent_avatar_url } = chatData;
      // Always set is_enabled to false by default for new websites
      await supabase.from('chat_support_config').upsert({
        website_id: targetWebsiteId,
        is_enabled: false, // Disabled by default
        greeting_message,
        offline_message,
        position,
        theme_color,
        agent_name,
        agent_avatar_url,
      }, { onConflict: 'website_id' });
    } else {
      // Create default chat support config with is_enabled = false
      await supabase.from('chat_support_config').upsert({
        website_id: targetWebsiteId,
        is_enabled: false, // Disabled by default
        greeting_message: 'Hi! How can we help you today?',
        agent_name: 'Support',
        position: 'bottom-right',
      }, { onConflict: 'website_id' });
    }

    // 20. Copy featured_products_config
    const { data: featuredProductsConfig } = await supabase
      .from('featured_products_config')
      .select('*')
      .eq('website_id', sourceId)
      .single();

    if (featuredProductsConfig) {
      const { heading, subheading, layout, max_items } = featuredProductsConfig;
      await supabase.from('featured_products_config').upsert({
        website_id: targetWebsiteId,
        heading,
        subheading,
        layout,
        max_items,
      }, { onConflict: 'website_id' });
    }

    // 21. Copy products (if any)
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('website_id', sourceId);

    if (products && products.length > 0) {
      await supabase.from('products').delete().eq('website_id', targetWebsiteId);
      
      const productsToInsert = products.map(product => ({
        website_id: targetWebsiteId,
        name: product.name,
        description: product.description,
        price: product.price,
        image_url: product.image_url,
        category: product.category,
        is_featured: product.is_featured,
        display_order: product.display_order,
      }));

      await supabase.from('products').insert(productsToInsert);
    }

    // 22. Copy special_offers_config and special_offers (but section will be disabled)
    // This way if user enables the section later, the data will be there
    const { data: specialOffersConfig } = await supabase
      .from('special_offers_config')
      .select('*')
      .eq('website_id', sourceId)
      .single();

    if (specialOffersConfig) {
      const { heading, subheading, layout, show_expiry_date } = specialOffersConfig;
      await supabase.from('special_offers_config').upsert({
        website_id: targetWebsiteId,
        heading,
        subheading,
        layout,
        show_expiry_date,
      }, { onConflict: 'website_id' });
    }

    // Copy special offers
    const { data: specialOffers } = await supabase
      .from('special_offers')
      .select('*')
      .eq('website_id', sourceId);

    if (specialOffers && specialOffers.length > 0) {
      await supabase.from('special_offers').delete().eq('website_id', targetWebsiteId);
      
      const offersToInsert = specialOffers.map(offer => ({
        website_id: targetWebsiteId,
        title: offer.title,
        description: offer.description,
        discount_percentage: offer.discount_percentage,
        discount_amount: offer.discount_amount,
        promo_code: offer.promo_code,
        image_url: offer.image_url,
        valid_from: offer.valid_from,
        valid_until: offer.valid_until,
        terms_conditions: offer.terms_conditions,
        is_active: offer.is_active,
        display_order: offer.display_order,
      }));

      await supabase.from('special_offers').insert(offersToInsert);
    }

    console.log('✅ Successfully copied all content from golden-crumb to new website');
  } catch (error) {
    console.error('❌ Error copying website content:', error);
    throw error;
  }
}

