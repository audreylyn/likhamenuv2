/**
 * Populate website content from AI-generated data
 */

import { supabase } from "./supabase";
import type { GeneratedContent } from "./gemini-ai";

export async function populateWebsiteFromAI(
  websiteId: string,
  content: GeneratedContent,
) {
  try {
    console.log(`🤖 Populating website ${websiteId} with AI content...`);

    // 1. Fetch existing website content to merge
    const { data: website, error: fetchError } = await supabase
      .from("websites")
      .select("content, enabledsections")
      .eq("id", websiteId)
      .single();

    if (fetchError) throw fetchError;

    // Use type assertion to avoid strict type checks during migration
    const w = website as any;
    const currentContent = w?.content || {};

    // 2. Construct new content object
    const newContent = {
      ...currentContent,

      // Hero
      hero: {
        ...currentContent.hero,
        slides: [
          {
            id: 1,
            title: content.hero.title,
            subtitle: content.hero.subtitle,
            image:
              "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1920",
          },
        ],
        button_text: content.hero.buttonText,
        button_link: "#about",
        show_button: true,
        autoplay: true,
        autoplay_interval: 5000,
        show_navigation: true,
        show_indicators: true,
        parallax_enabled: false,
      },

      // About
      about: {
        ...currentContent.about,
        heading: content.about.heading,
        subheading: content.about.subheading,
        description: content.about.description,
        image_url:
          "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800",
        features: currentContent.about?.features || [],
        stats: currentContent.about?.stats || [],
      },

      // Why Choose Us
      whyChooseUs: {
        ...currentContent.whyChooseUs,
        heading: content.whyChooseUs.heading,
        subheading: content.whyChooseUs.subheading,
        reasons: content.whyChooseUs.reasons,
      },

      // Menu
      menu: {
        ...currentContent.menu,
        config: {
          ...currentContent.menu?.config,
          heading: content.menu.heading,
          subheading: content.menu.subheading,
        },
        categories: content.menu.categories.map((cat, index) => ({
          id: `cat-${Date.now()}-${index}`,
          name: cat.name,
          description: cat.description,
          is_visible: true,
          display_order: index,
        })),
        items: content.menu.items.map((item, index) => {
          // Find category ID by name
          const categoryIndex = content.menu.categories.findIndex(
            (c) => c.name === item.category,
          );
          const categoryId =
            categoryIndex >= 0
              ? `cat-${Date.now()}-${categoryIndex}`
              : "uncategorized";

          return {
            id: `item-${Date.now()}-${index}`,
            name: item.name,
            description: item.description,
            price: item.price,
            category_id: categoryId,
            is_available: true,
            display_order: index,
            image_url:
              "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800", // Placeholder
          };
        }),
      },

      // Testimonials
      testimonials: {
        ...currentContent.testimonials,
        config: {
          ...currentContent.testimonials?.config,
          heading: "What Our Customers Say",
          subheading: "Testimonials",
          show_ratings: true,
        },
        items: content.testimonials.map((t, index) => ({
          id: `test-${Date.now()}-${index}`,
          customer_name: t.customer_name,
          customer_role: t.customer_role,
          testimonial_text: t.testimonial_text,
          rating: t.rating,
          display_order: index,
          is_featured: index < 3,
        })),
      },
    };

    // 3. Update website record
    const { error: updateError } = await supabase
      .from("websites")
      // @ts-ignore
      .update({
        content: newContent,
        updatedat: new Date().toISOString(),
      } as any)
      .eq("id", websiteId);

    if (updateError) throw updateError;

    console.log("✅ Website content populated from AI successfully (JSONB)");
    console.log(
      `   - Hero, About, WhyChooseUs, Menu, and Testimonials updated.`,
    );
  } catch (error) {
    console.error("❌ Error populating website content:", error);
    throw error;
  }
}
