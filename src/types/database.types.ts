// =====================================================
// LikhaSiteWorks Database Types
// TypeScript types matching the database schema
// =====================================================

// =====================================================
// CORE WEBSITE TYPES
// =====================================================

export interface Website {
  id: string;
  subdomain: string;
  site_title: string;
  site_description?: string;
  logo_url?: string;
  favicon_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ThemeColors {
  primary: string;
  accent: string;
  cream: string;
  dark: string;
  light: string;
  text: string;
}

export interface ThemeFonts {
  serif: string;
  sans: string;
  mono: string;
}

export interface ThemeSpacing {
  containerMaxWidth: string;
  sectionPadding: string;
}

export interface ThemeBorderRadius {
  small: string;
  medium: string;
  large: string;
  full: string;
}

export interface ThemeConfig {
  colors: ThemeColors;
  fonts: ThemeFonts;
  spacing: ThemeSpacing;
  borderRadius: ThemeBorderRadius;
}

export interface WebsiteTheme {
  id: string;
  website_id: string;
  theme_config: ThemeConfig;
  custom_css?: string;
  created_at: string;
  updated_at: string;
}

export interface WebsiteSection {
  id: string;
  website_id: string;
  section_name: string;
  is_enabled: boolean;
  display_order: number;
  custom_config: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// =====================================================
// NAVBAR TYPES
// =====================================================

export interface NavItem {
  label: string;
  href: string;
  order: number;
}

export interface CTAButton {
  text: string;
  href: string;
  variant: 'primary' | 'secondary' | 'outline';
}

export interface NavbarContent {
  id: string;
  website_id: string;
  brand_name: string;
  brand_logo_url?: string;
  show_cart: boolean;
  sticky_nav: boolean;
  nav_items: NavItem[];
  cta_button: CTAButton;
  created_at: string;
  updated_at: string;
}

// =====================================================
// HERO TYPES
// =====================================================

export interface HeroSlide {
  id: number;
  image: string;
  title: string;
  subtitle: string;
  order: number;
}

export interface HeroContent {
  id: string;
  website_id: string;
  slides: HeroSlide[];
  button_text: string;
  button_link: string;
  show_button: boolean;
  autoplay: boolean;
  autoplay_interval: number;
  show_navigation: boolean;
  show_indicators: boolean;
  parallax_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// =====================================================
// ABOUT TYPES
// =====================================================

export interface AboutFeature {
  icon: string;
  title: string;
  description: string;
}

export interface AboutStat {
  label: string;
  value: string;
}

export interface AboutContent {
  id: string;
  website_id: string;
  heading: string;
  subheading?: string;
  description: string;
  image_url?: string;
  image_position: 'left' | 'right';
  features: AboutFeature[];
  stats: AboutStat[];
  created_at: string;
  updated_at: string;
}

// =====================================================
// WHY CHOOSE US TYPES
// =====================================================

export interface WhyChooseUsReason {
  icon: string;
  title: string;
  description: string;
}

export interface WhyChooseUsContent {
  id: string;
  website_id: string;
  heading: string;
  subheading?: string;
  reasons: WhyChooseUsReason[];
  background_style: 'light' | 'dark' | 'gradient';
  created_at: string;
  updated_at: string;
}

// =====================================================
// TEAM TYPES
// =====================================================

export interface SocialLinks {
  linkedin?: string;
  twitter?: string;
  instagram?: string;
  facebook?: string;
}

export interface TeamMember {
  id: string;
  website_id: string;
  name: string;
  role: string;
  bio?: string;
  image_url?: string;
  social_links: SocialLinks;
  display_order: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface TeamSectionConfig {
  id: string;
  website_id: string;
  heading: string;
  subheading?: string;
  layout: 'grid' | 'slider' | 'list';
  columns: number;
  show_social_links: boolean;
  created_at: string;
  updated_at: string;
}

// =====================================================
// PRODUCTS TYPES
// =====================================================

export interface Product {
  id: string;
  website_id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  category?: string;
  is_featured: boolean;
  is_available: boolean;
  display_order: number;
  badges: string[];
  nutritional_info: Record<string, any>;
  allergens?: string[];
  created_at: string;
  updated_at: string;
}

export interface FeaturedProductsConfig {
  id: string;
  website_id: string;
  heading: string;
  subheading?: string;
  max_items: number;
  layout: string;
  show_add_to_cart: boolean;
  created_at: string;
  updated_at: string;
}

// =====================================================
// MENU TYPES
// =====================================================

export interface MenuCategory {
  id: string;
  website_id: string;
  name: string;
  description?: string;
  icon?: string;
  display_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: string;
  website_id: string;
  category_id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_available: boolean;
  is_popular: boolean;
  display_order: number;
  tags?: string[];
  rating?: number;
  review_count?: number;
  created_at: string;
  updated_at: string;
}

export interface MenuSectionConfig {
  id: string;
  website_id: string;
  heading: string;
  subheading?: string;
  layout: 'tabs' | 'accordion' | 'grid';
  show_images: boolean;
  show_add_to_cart: boolean;
  created_at: string;
  updated_at: string;
}

// =====================================================
// RESERVATION TYPES
// =====================================================

export interface WorkingHours {
  monday: { open: string; close: string; closed: boolean };
  tuesday: { open: string; close: string; closed: boolean };
  wednesday: { open: string; close: string; closed: boolean };
  thursday: { open: string; close: string; closed: boolean };
  friday: { open: string; close: string; closed: boolean };
  saturday: { open: string; close: string; closed: boolean };
  sunday: { open: string; close: string; closed: boolean };
}

export interface ReservationFeature {
  icon: string;
  title: string;
  description: string;
}

export interface ReservationConfig {
  id: string;
  website_id: string;
  heading: string;
  subheading?: string;
  description?: string;
  features?: ReservationFeature[];
  working_hours: WorkingHours;
  max_party_size: number;
  time_slot_interval: number;
  require_phone: boolean;
  require_email: boolean;
  confirmation_message?: string;
  created_at: string;
  updated_at: string;
}

export interface Reservation {
  id: string;
  website_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  special_requests?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

// =====================================================
// TESTIMONIALS TYPES
// =====================================================

export interface Testimonial {
  id: string;
  website_id: string;
  customer_name: string;
  customer_role?: string;
  customer_image_url?: string;
  rating: number;
  testimonial_text: string;
  is_featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface TestimonialsConfig {
  id: string;
  website_id: string;
  heading: string;
  subheading?: string;
  layout: 'slider' | 'grid' | 'masonry';
  show_ratings: boolean;
  autoplay: boolean;
  items_per_view: number;
  created_at: string;
  updated_at: string;
}

// =====================================================
// SPECIAL OFFERS TYPES
// =====================================================

export interface SpecialOffer {
  id: string;
  website_id: string;
  title: string;
  description?: string;
  discount_percentage?: number;
  discount_amount?: number;
  promo_code?: string;
  image_url?: string;
  valid_from?: string;
  valid_until?: string;
  terms_conditions?: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface SpecialOffersConfig {
  id: string;
  website_id: string;
  heading: string;
  subheading?: string;
  layout: string;
  show_expiry_date: boolean;
  created_at: string;
  updated_at: string;
}

// =====================================================
// FAQ TYPES
// =====================================================

export interface FAQCategory {
  id: string;
  website_id: string;
  name: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface FAQ {
  id: string;
  website_id: string;
  category_id?: string;
  question: string;
  answer: string;
  display_order: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface FAQConfig {
  id: string;
  website_id: string;
  heading: string;
  subheading?: string;
  layout: 'accordion' | 'list' | 'grid';
  show_categories: boolean;
  created_at: string;
  updated_at: string;
}

// =====================================================
// CONTACT TYPES
// =====================================================

export interface ContactInfo {
  id: string;
  website_id: string;
  heading: string;
  subheading?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  google_maps_url?: string;
  social_links: SocialLinks & {
    youtube?: string;
  };
  show_contact_form: boolean;
  show_map: boolean;
  form_email_recipient?: string;
  created_at: string;
  updated_at: string;
}

export interface ContactSubmission {
  id: string;
  website_id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  created_at: string;
}

// =====================================================
// INSTAGRAM FEED TYPES
// =====================================================

export interface InstagramFeedItem {
  image_url: string;
  caption: string;
  post_url: string;
  likes: number;
}

export interface InstagramFeedConfig {
  id: string;
  website_id: string;
  heading: string;
  subheading?: string;
  instagram_handle?: string;
  instagram_url?: string;
  feed_items: InstagramFeedItem[];
  max_items: number;
  layout: string;
  created_at: string;
  updated_at: string;
}

// =====================================================
// FOOTER TYPES
// =====================================================

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

export interface FooterContent {
  id: string;
  website_id: string;
  about_text?: string;
  copyright_text?: string;
  footer_columns: FooterColumn[];
  show_social_links: boolean;
  show_newsletter: boolean;
  newsletter_heading?: string;
  newsletter_placeholder?: string;
  created_at: string;
  updated_at: string;
}

// =====================================================
// CHAT SUPPORT TYPES
// =====================================================

export interface ChatSupportConfig {
  id: string;
  website_id: string;
  is_enabled: boolean;
  greeting_message: string;
  offline_message?: string;
  position: 'bottom-right' | 'bottom-left';
  theme_color?: string;
  agent_name: string;
  agent_avatar_url?: string;
  working_hours: Record<string, any>;
  chatbot_provider?: 'gemini';
  chatbot_api_key?: string;
  chatbot_bot_id?: string;
  chatbot_webhook_url?: string;
  chatbot_config?: Record<string, any>;
  knowledge_base?: string;
  created_at: string;
  updated_at: string;
}

// =====================================================
// AI GENERATION TYPES
// =====================================================

export interface AIGenerationHistory {
  id: string;
  website_id: string;
  section_name: string;
  prompt: string;
  generated_content: Record<string, any>;
  model_used: string;
  tokens_used?: number;
  was_accepted: boolean;
  created_at: string;
}

// =====================================================
// COMPOSITE TYPES FOR FULL WEBSITE DATA
// =====================================================

export interface FullWebsiteData {
  website: Website;
  theme: WebsiteTheme;
  sections: WebsiteSection[];
  navbar: NavbarContent;
  hero: HeroContent;
  about: AboutContent;
  whyChooseUs: WhyChooseUsContent;
  team: {
    config: TeamSectionConfig;
    members: TeamMember[];
  };
  featuredProducts: {
    config: FeaturedProductsConfig;
    products: Product[];
  };
  menu: {
    config: MenuSectionConfig;
    categories: MenuCategory[];
    items: MenuItem[];
  };
  reservation: ReservationConfig;
  testimonials: {
    config: TestimonialsConfig;
    items: Testimonial[];
  };
  specialOffers: {
    config: SpecialOffersConfig;
    offers: SpecialOffer[];
  };
  faq: {
    config: FAQConfig;
    categories: FAQCategory[];
    items: FAQ[];
  };
  contact: ContactInfo;
  instagramFeed: InstagramFeedConfig;
  footer: FooterContent;
  chatSupport: ChatSupportConfig;
}

