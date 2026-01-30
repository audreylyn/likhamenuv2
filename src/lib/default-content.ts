/**
 * Default Content for New Websites
 * Sample content to populate a new website with
 */

export const DEFAULT_WEBSITE_CONTENT = {
  hero: {
    config: {
      heading: "Welcome to Our Business",
      subheading: "Quality Products & Services",
      cta_text: "Get Started",
      cta_link: "#contact",
      background_image:
        "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1920&q=80",
    },
  },
  about: {
    config: {
      tagline: "CRAFTED WITH LOVE & QUALITY",
      heading: "About Our Business",
      description:
        "Welcome to our business, where quality meets innovation. Since our founding, we've been dedicated to providing the finest products and services using only the highest quality materials and expertise.",
      years_badge: "10+",
      years_label: "YEARS IN BUSINESS",
      image_url:
        "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80",
    },
    features: [
      {
        icon: "Award",
        title: "Quality First",
        description: "We prioritize quality in everything we do",
      },
      {
        icon: "Users",
        title: "Customer Focus",
        description: "Your satisfaction is our top priority",
      },
      {
        icon: "Leaf",
        title: "Sustainable",
        description: "Committed to sustainable practices",
      },
    ],
  },
  whyChooseUs: {
    config: {
      tagline: "OUR PROMISE",
      heading: "Why Choose Us",
    },
    items: [
      {
        icon: "Award",
        title: "Expert Team",
        description:
          "Our experts bring years of experience and passion to every project.",
      },
      {
        icon: "Leaf",
        title: "Quality Materials",
        description:
          "We source only the finest, high-quality materials for our work.",
      },
      {
        icon: "Users",
        title: "Great Service",
        description:
          "Our friendly staff is dedicated to providing you with an exceptional experience.",
      },
    ],
  },
  team: {
    config: {
      tagline: "THE PEOPLE BEHIND THE MAGIC",
      heading: "Meet Our Team",
    },
    members: [
      {
        name: "John Smith",
        role: "Founder & CEO",
        image_url:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80",
        bio: "Leading our team with vision and passion.",
      },
      {
        name: "Jane Doe",
        role: "Operations Manager",
        image_url:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80",
        bio: "Ensuring smooth operations every day.",
      },
      {
        name: "Mike Johnson",
        role: "Lead Specialist",
        image_url:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
        bio: "Expert craftsman with attention to detail.",
      },
    ],
  },
  featuredProducts: {
    config: {
      tagline: "FEATURED",
      heading: "Our Top Picks",
      cta_text: "See all products",
      cta_link: "#menu",
    },
    items: [
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
      heading: "Our Products",
      subheading:
        "Browse our complete selection of quality products and services",
    },
    categories: [
      { id: "cat1", name: "Category One", display_order: 1 },
      { id: "cat2", name: "Category Two", display_order: 2 },
      { id: "cat3", name: "Category Three", display_order: 3 },
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
      },
      {
        id: "item2",
        name: "Item Two",
        description: "Description of item two",
        price: 200,
        category_id: "cat1",
        image_url:
          "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&q=80",
      },
      {
        id: "item3",
        name: "Item Three",
        description: "Description of item three",
        price: 175,
        category_id: "cat2",
        image_url:
          "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&q=80",
      },
    ],
  },
  reservation: {
    config: {
      tagline: "BOOK NOW",
      heading: "Make a Reservation",
      description: "Reserve your spot today. We look forward to serving you!",
      background_image:
        "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1920&q=80",
    },
  },
  testimonials: {
    config: {
      tagline: "WHAT OUR CUSTOMERS SAY",
      heading: "Customer Reviews",
      subheading: "Don't just take our word for it",
    },
    items: [
      {
        id: "t1",
        customer_name: "Sarah M.",
        customer_title: "Regular Customer",
        content:
          "Absolutely amazing service! The quality is outstanding and the team is so friendly.",
        rating: 5,
      },
      {
        id: "t2",
        customer_name: "Michael R.",
        customer_title: "Business Owner",
        content:
          "Professional, reliable, and always delivers on promises. Highly recommended!",
        rating: 5,
      },
      {
        id: "t3",
        customer_name: "Emily L.",
        customer_title: "First-time Customer",
        content:
          "Exceeded all my expectations. Will definitely be coming back!",
        rating: 5,
      },
    ],
  },
  specialOffers: {
    config: {
      tagline: "LIMITED TIME",
      heading: "Special Offers",
      subheading: "Don't miss out on these exclusive deals",
    },
    items: [
      {
        id: "o1",
        title: "New Customer Discount",
        description: "Get 10% off your first purchase!",
        discount_text: "10% OFF",
        valid_until: "2026-12-31",
      },
      {
        id: "o2",
        title: "Bundle Deal",
        description: "Buy 2, get 1 free on selected items",
        discount_text: "BUY 2 GET 1",
        valid_until: "2026-12-31",
      },
    ],
  },
  faq: {
    config: {
      tagline: "QUESTIONS?",
      heading: "Frequently Asked Questions",
    },
    items: [
      {
        id: "f1",
        question: "What are your hours of operation?",
        answer:
          "We're open Monday through Saturday, 9 AM to 6 PM. Closed on Sundays.",
      },
      {
        id: "f2",
        question: "Do you offer delivery?",
        answer:
          "Yes! We offer delivery within the city limits. Contact us for details.",
      },
      {
        id: "f3",
        question: "What payment methods do you accept?",
        answer:
          "We accept cash, credit cards, and digital payment methods like GCash and Maya.",
      },
      {
        id: "f4",
        question: "How can I place a custom order?",
        answer:
          "Contact us through our website or give us a call to discuss your custom requirements.",
      },
    ],
  },
  contact: {
    tagline: "GET IN TOUCH",
    heading: "Contact Us",
    address: "123 Main Street, City, Country",
    phone: "+1 234 567 8900",
    email: "hello@example.com",
    hours: [
      { days: "Monday - Friday", time: "9:00 AM - 6:00 PM" },
      { days: "Saturday", time: "10:00 AM - 4:00 PM" },
      { days: "Sunday", time: "Closed" },
    ],
  },
  instagramFeed: {
    config: {
      tagline: "FOLLOW US",
      heading: "Instagram",
      instagram_handle: "@yourbusiness",
    },
    posts: [],
  },
  chatSupport: {
    config: {
      enabled: true,
      greeting_message: "Hi! How can we help you today?",
      placeholder_text: "Type your message...",
    },
  },
};

import { supabase } from "./supabase";

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
