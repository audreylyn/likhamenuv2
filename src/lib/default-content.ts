/**
 * Default Content for New Websites
 * Sample content to populate a new website with
 * Matching the structure expected by components (flattened config, correct array names)
 */

import { supabase } from "./supabase";

export const DEFAULT_WEBSITE_CONTENT = {
  hero: {
    id: "1",
    slides: [
      {
        id: 1,
        image:
          "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1920&q=80",
        title: "Welcome to Our Business",
        subtitle: "Quality Products & Services",
        order: 0,
      },
    ],
    button_text: "Get Started",
    button_link: "#contact",
    show_button: true,
    autoplay: true,
    autoplay_interval: 5000,
    show_navigation: true,
    show_indicators: true,
    parallax_enabled: true,
  },
  about: {
    id: "1",
    heading: "About Our Business",
    subheading: "CRAFTED WITH LOVE & QUALITY",
    description:
      "Welcome to our business, where quality meets innovation. Since our founding, we've been dedicated to providing the finest products and services using only the highest quality materials and expertise.",
    image_url:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80",
    image_position: "left",
    features: [
      {
        icon: "award",
        title: "Quality First",
        description: "We prioritize quality in everything we do",
      },
      {
        icon: "users",
        title: "Customer Focus",
        description: "Your satisfaction is our top priority",
      },
      {
        icon: "leaf",
        title: "Sustainable",
        description: "Committed to sustainable practices",
      },
    ],
    stats: [
      { label: "YEARS IN BUSINESS", value: "10+" },
      { label: "HAPPY CUSTOMERS", value: "1000+" },
    ],
  },
  whyChooseUs: {
    id: "1",
    heading: "Why Choose Us",
    subheading: "OUR PROMISE",
    reasons: [
      {
        icon: "award",
        title: "Expert Team",
        description:
          "Our experts bring years of experience and passion to every project.",
      },
      {
        icon: "leaf",
        title: "Quality Materials",
        description:
          "We source only the finest, high-quality materials for our work.",
      },
      {
        icon: "users",
        title: "Great Service",
        description:
          "Our friendly staff is dedicated to providing you with an exceptional experience.",
      },
    ],
    background_style: "light",
  },
  team: {
    config: {
      id: "1",
      heading: "Meet Our Team",
      subheading: "THE PEOPLE BEHIND THE MAGIC",
      layout: "grid",
      columns: 3,
      show_social_links: true,
    },
    members: [
      {
        id: "1",
        name: "John Smith",
        role: "Founder & CEO",
        image_url:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80",
        bio: "Leading our team with vision and passion.",
        social_links: { twitter: "#", linkedin: "#" },
      },
      {
        id: "2",
        name: "Jane Doe",
        role: "Operations Manager",
        image_url:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80",
        bio: "Ensuring smooth operations every day.",
        social_links: { linkedin: "#" },
      },
      {
        id: "3",
        name: "Mike Johnson",
        role: "Lead Specialist",
        image_url:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
        bio: "Expert craftsman with attention to detail.",
        social_links: { instagram: "#" },
      },
    ],
  },
  featuredProducts: {
    config: {
      id: "1",
      heading: "Our Top Picks",
      subheading: "FEATURED",
      max_items: 3,
      layout: "grid",
      show_add_to_cart: true,
    },
    products: [
      {
        id: "1",
        name: "Product One",
        description: "Our signature product with premium quality.",
        price: 250,
        image_url:
          "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&q=80",
        is_featured: true,
      },
      {
        id: "2",
        name: "Product Two",
        description: "A customer favorite with excellent value.",
        price: 180,
        image_url:
          "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&q=80",
        is_featured: true,
      },
      {
        id: "3",
        name: "Product Three",
        description: "Premium selection for discerning customers.",
        price: 320,
        image_url:
          "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&q=80",
        is_featured: true,
      },
    ],
  },
  menu: {
    config: {
      id: "1",
      heading: "Our Products",
      subheading:
        "Browse our complete selection of quality products and services",
      layout: "grid",
      show_images: true,
      show_add_to_cart: true,
    },
    categories: [
      { id: "cat1", name: "Category One", display_order: 1, is_visible: true },
      { id: "cat2", name: "Category Two", display_order: 2, is_visible: true },
      {
        id: "cat3",
        name: "Category Three",
        display_order: 3,
        is_visible: true,
      },
    ],
    items: [
      {
        id: "item1",
        name: "Item One",
        description: "Description of item one",
        price: 150,
        category_id: "cat1",
        image_url:
          "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&q=80",
        is_available: true,
        display_order: 1,
      },
      {
        id: "item2",
        name: "Item Two",
        description: "Description of item two",
        price: 200,
        category_id: "cat1",
        image_url:
          "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&q=80",
        is_available: true,
        display_order: 2,
      },
      {
        id: "item3",
        name: "Item Three",
        description: "Description of item three",
        price: 175,
        category_id: "cat2",
        image_url:
          "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&q=80",
        is_available: true,
        display_order: 1,
      },
    ],
  },
  reservation: {
    id: "1",
    heading: "Make a Reservation",
    subheading: "BOOK NOW",
    description: "Reserve your spot today. We look forward to serving you!",
    // background_image was in config, now where? component doesn't show it in types, maybe it's custom config?
    // preserving structure for flat props
    working_hours: {
      monday: { open: "09:00", close: "18:00", closed: false },
      tuesday: { open: "09:00", close: "18:00", closed: false },
      wednesday: { open: "09:00", close: "18:00", closed: false },
      thursday: { open: "09:00", close: "18:00", closed: false },
      friday: { open: "09:00", close: "18:00", closed: false },
      saturday: { open: "10:00", close: "16:00", closed: false },
      sunday: { open: "00:00", close: "00:00", closed: true },
    },
    max_party_size: 10,
    time_slot_interval: 30,
    require_phone: true,
    require_email: true,
  },
  testimonials: {
    config: {
      id: "1",
      heading: "Customer Reviews",
      subheading: "WHAT OUR CUSTOMERS SAY",
      layout: "slider",
      show_ratings: true,
      autoplay: true,
      items_per_view: 3,
    },
    items: [
      {
        id: "t1",
        customer_name: "Sarah M.",
        customer_role: "Regular Customer",
        testimonial_text:
          "Absolutely amazing service! The quality is outstanding and the team is so friendly.",
        rating: 5,
        is_featured: true,
      },
      {
        id: "t2",
        customer_name: "Michael R.",
        customer_role: "Business Owner",
        testimonial_text:
          "Professional, reliable, and always delivers on promises. Highly recommended!",
        rating: 5,
        is_featured: true,
      },
      {
        id: "t3",
        customer_name: "Emily L.",
        customer_role: "First-time Customer",
        testimonial_text:
          "Exceeded all my expectations. Will definitely be coming back!",
        rating: 5,
        is_featured: true,
      },
    ],
  },
  specialOffers: {
    config: {
      id: "1",
      heading: "Special Offers",
      subheading: "LIMITED TIME",
      layout: "grid",
      show_expiry_date: true,
    },
    offers: [
      {
        id: "o1",
        title: "New Customer Discount",
        description: "Get 10% off your first purchase!",
        discount_percentage: 10,
        valid_until: "2026-12-31",
        is_active: true,
      },
      {
        id: "o2",
        title: "Bundle Deal",
        description: "Buy 2, get 1 free on selected items",
        discount_text: "BUY 2 GET 1",
        valid_until: "2026-12-31",
        is_active: true,
      },
    ],
  },
  faq: {
    config: {
      id: "1",
      heading: "Frequently Asked Questions",
      subheading: "QUESTIONS?",
      layout: "accordion",
      show_categories: false,
    },
    items: [
      {
        id: "f1",
        question: "What are your hours of operation?",
        answer:
          "We're open Monday through Saturday, 9 AM to 6 PM. Closed on Sundays.",
        display_order: 1,
      },
      {
        id: "f2",
        question: "Do you offer delivery?",
        answer:
          "Yes! We offer delivery within the city limits. Contact us for details.",
        display_order: 2,
      },
      {
        id: "f3",
        question: "What payment methods do you accept?",
        answer:
          "We accept cash, credit cards, and digital payment methods like GCash and Maya.",
        display_order: 3,
      },
      {
        id: "f4",
        question: "How can I place a custom order?",
        answer:
          "Contact us through our website or give us a call to discuss your custom requirements.",
        display_order: 4,
      },
    ],
  },
  contact: {
    id: "1",
    heading: "Contact Us",
    subheading: "GET IN TOUCH",
    address: "123 Main Street, City, Country",
    phone: "+1 234 567 8900",
    email: "hello@example.com",
    show_contact_form: true,
    show_map: true,
    social_links: {
      instagram: "https://instagram.com",
      facebook: "https://facebook.com",
    },
  },
  instagramFeed: {
    id: "1",
    heading: "Instagram",
    subheading: "FOLLOW US",
    instagram_handle: "@yourbusiness",
    max_items: 6,
    layout: "grid",
    feed_items: [],
  },
  chatSupport: {
    id: "1",
    is_enabled: true,
    greeting_message: "Hi! How can we help you today?",
    position: "bottom-right",
    agent_name: "Support Agent",
  },
};

/**
 * Populate a website with default sample content
 */
export async function populateDefaultContent(websiteId: string): Promise<void> {
  try {
    console.log(`📋 Populating default content for website ${websiteId}...`);

    // Update website with default content
    // Cast to any to bypass strict JSONB type checking
    const db = supabase as any;
    const { error } = await db
      .from("websites")
      .update({
        content: DEFAULT_WEBSITE_CONTENT,
        updatedat: new Date().toISOString(),
      })
      .eq("id", websiteId);

    if (error) {
      throw new Error(`Failed to populate content: ${error.message}`);
    }

    console.log("✅ Successfully populated default content");
  } catch (error) {
    console.error("❌ Error populating content:", error);
    throw error;
  }
}
