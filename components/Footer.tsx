import React, { useState, useEffect } from 'react';
import { Facebook, Instagram, Twitter, Linkedin, Youtube, MessageCircle, Share2, Check, Loader2, X, Plus } from 'lucide-react';
import { EditableText } from '../src/components/editor/EditableText';
import { useEditor } from '../src/contexts/EditorContext';
import { supabase, getWebsiteId } from '../src/lib/supabase';
import type { FooterContent, NavbarContent } from '../src/types/database.types';

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  icon: React.ReactNode;
}

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [loading, setLoading] = useState(true);
  const [brandName, setBrandName] = useState('');
  const [aboutText, setAboutText] = useState('');
  const [quickLinksTitle, setQuickLinksTitle] = useState('Quick Links');
  const [newsletterTitle, setNewsletterTitle] = useState('Stay in the Loop');
  const [newsletterDescription, setNewsletterDescription] = useState('Join our newsletter for special offers.');
  const [copyrightText, setCopyrightText] = useState('');
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [footerContent, setFooterContent] = useState<FooterContent | null>(null);
  const { isEditing, saveField } = useEditor();

  useEffect(() => {
    loadFooterData();
  }, []);

  const loadFooterData = async () => {
    try {
      const websiteId = await getWebsiteId();
      if (!websiteId) {
        setLoading(false);
        return;
      }

      // Load website data for site title
      const { data: websiteData, error: websiteError } = await supabase
        .from('websites')
        .select('site_title')
        .eq('id', websiteId)
        .single();
      
      if (websiteError) {
        console.error('Error loading website data:', websiteError);
      }

      // Load navbar content for brand name (for display in footer)
      const { data: navbarData } = await supabase
        .from('navbar_content')
        .select('brand_name')
        .eq('website_id', websiteId)
        .single();

      // Load footer content
      const { data: footerData, error: footerError } = await supabase
        .from('footer_content')
        .select('*')
        .eq('website_id', websiteId)
        .single();

      if (navbarData?.brand_name) {
        setBrandName(navbarData.brand_name);
      }

      if (!footerError && footerData) {
        setFooterContent(footerData);
        if (footerData.about_text) setAboutText(footerData.about_text);
        // Always generate copyright text dynamically with current year and correct website name
        const websiteName = websiteData?.site_title || (navbarData?.brand_name || 'Website');
        const currentYear = new Date().getFullYear();
        // Always generate copyright text dynamically to ensure correct website name and year
        setCopyrightText(`© ${currentYear} ${websiteName}. All rights reserved.`);
        
        // Load social links from contact_info
        const { data: contactData } = await supabase
          .from('contact_info')
          .select('social_links')
          .eq('website_id', websiteId)
          .single();

        if (contactData && contactData.social_links) {
          const links: SocialLink[] = [];
          const socials = contactData.social_links as any;
          if (socials.instagram) links.push({ id: '1', platform: 'Instagram', url: socials.instagram, icon: <Instagram size={24} /> });
          if (socials.facebook) links.push({ id: '2', platform: 'Facebook', url: socials.facebook, icon: <Facebook size={24} /> });
          if (socials.twitter) links.push({ id: '3', platform: 'Twitter', url: socials.twitter, icon: <Twitter size={24} /> });
          setSocialLinks(links);
        }
      } else {
        // Set defaults only if no data exists
        if (!footerData) {
          setAboutText('Bringing warmth to your day, one pastry at a time. Baked fresh daily with love and the finest ingredients.');
          const websiteName = websiteData?.site_title || (navbarData?.brand_name || 'Website');
          setCopyrightText(`© ${new Date().getFullYear()} ${websiteName}. All rights reserved.`);
        }
      }
    } catch (error) {
      console.error('Error loading footer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    
    // Simulate API call
    setTimeout(() => {
      setStatus('success');
      setEmail('');
      // Reset back to idle after showing success message for a while (optional)
      // setTimeout(() => setStatus('idle'), 5000); 
    }, 1500);
  };

  // Don't render footer until data is loaded to prevent flash
  if (loading || !brandName) {
    return null;
  }

  return (
    <footer className="bg-bakery-dark text-bakery-beige pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          
          {/* Brand */}
          <div className="text-center md:text-left">
            {isEditing ? (
              <EditableText
                value={brandName}
                onSave={async (newValue) => {
                  setBrandName(newValue);
                  // Save to navbar_content
                  const websiteId = await getWebsiteId();
                  if (websiteId && footerContent) {
                    await saveField('navbar_content', 'brand_name', newValue);
                  }
                }}
                tag="h3"
                className="font-serif text-3xl font-bold text-white mb-4"
              />
            ) : (
              <h3 className="font-serif text-3xl font-bold text-white mb-4">{brandName}</h3>
            )}
            {isEditing ? (
              <EditableText
                value={aboutText}
                onSave={async (newValue) => {
                  setAboutText(newValue);
                }}
                tag="p"
                multiline
                className="font-sans text-bakery-sand max-w-xs mx-auto md:mx-0 leading-relaxed"
              />
            ) : (
              <p className="font-sans text-bakery-sand max-w-xs mx-auto md:mx-0 leading-relaxed">
                {aboutText}
              </p>
            )}
          </div>

          {/* Links */}
          <div className="text-center">
            {isEditing ? (
              <EditableText
                value={quickLinksTitle}
                onSave={async (newValue) => {
                  setQuickLinksTitle(newValue);
                }}
                tag="h4"
                className="font-serif text-xl font-bold text-white mb-6"
              />
            ) : (
              <h4 className="font-serif text-xl font-bold text-white mb-6">{quickLinksTitle}</h4>
            )}
            <ul className="space-y-3 font-sans">
              <li><a href={isEditing ? '#' : '#hero'} onClick={isEditing ? (e) => e.preventDefault() : undefined} className="hover:text-white transition-colors">Home</a></li>
              <li><a href={isEditing ? '#' : '#menu'} onClick={isEditing ? (e) => e.preventDefault() : undefined} className="hover:text-white transition-colors">Menu</a></li>
              <li><a href={isEditing ? '#' : '#about'} onClick={isEditing ? (e) => e.preventDefault() : undefined} className="hover:text-white transition-colors">About Us</a></li>
              <li><a href={isEditing ? '#' : '#contact'} onClick={isEditing ? (e) => e.preventDefault() : undefined} className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="text-center md:text-right">
            {isEditing ? (
              <EditableText
                value={newsletterTitle}
                onSave={async (newValue) => {
                  setNewsletterTitle(newValue);
                }}
                tag="h4"
                className="font-serif text-xl font-bold text-white mb-6"
              />
            ) : (
              <h4 className="font-serif text-xl font-bold text-white mb-6">{newsletterTitle}</h4>
            )}
            <div className="flex flex-col items-center md:items-end gap-4">
              {isEditing ? (
                <EditableText
                  value={newsletterDescription}
                  onSave={async (newValue) => {
                    setNewsletterDescription(newValue);
                  }}
                  tag="p"
                  className="font-sans text-bakery-sand text-sm"
                />
              ) : (
                <p className="font-sans text-bakery-sand text-sm">{newsletterDescription}</p>
              )}
              
              {status === 'success' ? (
                <div className="bg-green-500/20 border border-green-500/30 text-green-100 px-4 py-3 rounded-lg w-full max-w-xs flex items-center justify-center gap-2 animate-in fade-in slide-in-from-bottom-2">
                  <Check size={18} />
                  <span className="font-sans font-medium text-sm">Welcome to the family!</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex w-full max-w-xs relative">
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email" 
                    disabled={status === 'loading'}
                    className="bg-white/10 border border-white/20 rounded-l-lg px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:bg-white/20 w-full disabled:opacity-50 transition-colors"
                  />
                  <button 
                    type="submit"
                    disabled={status === 'loading'}
                    className="bg-bakery-primary hover:bg-bakery-accent text-white px-4 py-2 rounded-r-lg font-serif font-bold transition-colors disabled:opacity-70 disabled:cursor-not-allowed min-w-[80px] flex justify-center items-center"
                  >
                    {status === 'loading' ? <Loader2 size={20} className="animate-spin" /> : 'Join'}
                  </button>
                </form>
              )}
              
              <div className="flex flex-wrap items-center gap-3 mt-2">
                {socialLinks.map((link) => (
                  <div key={link.id} className="relative group">
                    {isEditing && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete ${link.platform} link?`)) {
                            setSocialLinks(socialLinks.filter(l => l.id !== link.id));
                          }
                        }}
                        className="absolute -top-2 -right-2 z-10 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-lg opacity-0 group-hover:opacity-100"
                        title="Delete social link"
                      >
                        <X size={10} />
                      </button>
                    )}
                    <a 
                      href={isEditing ? '#' : link.url} 
                      target={isEditing ? undefined : "_blank"}
                      rel={isEditing ? undefined : "noopener noreferrer"}
                      onClick={async (e) => {
                        if (isEditing) {
                          e.preventDefault();
                          const newUrl = prompt(`Enter ${link.platform} URL:`, link.url);
                          if (newUrl !== null) {
                            setSocialLinks(socialLinks.map(l => 
                              l.id === link.id ? { ...l, url: newUrl } : l
                            ));
                          }
                        }
                      }}
                      className="text-bakery-sand hover:text-white transition-colors"
                      title={isEditing ? `Click to edit ${link.platform} URL` : link.platform}
                    >
                      {link.icon}
                    </a>
                  </div>
                ))}
                {isEditing && (
                  <button
                    onClick={() => {
                      const platform = prompt('Enter platform name (Instagram, Facebook, Twitter, LinkedIn, YouTube, TikTok, Pinterest, WhatsApp, etc.):', '');
                      if (!platform) return;
                      
                      let icon: React.ReactNode;
                      const platformLower = platform.toLowerCase();
                      if (platformLower.includes('instagram') || platformLower.includes('ig')) {
                        icon = <Instagram size={24} />;
                      } else if (platformLower.includes('facebook') || platformLower.includes('fb')) {
                        icon = <Facebook size={24} />;
                      } else if (platformLower.includes('twitter') || platformLower.includes('x')) {
                        icon = <Twitter size={24} />;
                      } else if (platformLower.includes('linkedin') || platformLower.includes('linked')) {
                        icon = <Linkedin size={24} />;
                      } else if (platformLower.includes('youtube') || platformLower.includes('yt')) {
                        icon = <Youtube size={24} />;
                      } else if (platformLower.includes('tiktok') || platformLower.includes('tt')) {
                        icon = <MessageCircle size={24} />;
                      } else if (platformLower.includes('pinterest') || platformLower.includes('pin')) {
                        icon = <Share2 size={24} />;
                      } else if (platformLower.includes('whatsapp') || platformLower.includes('wa')) {
                        icon = <MessageCircle size={24} />;
                      } else {
                        // Default icon for unknown platforms
                        icon = <Share2 size={24} />;
                      }
                      
                      const newLink: SocialLink = {
                        id: Date.now().toString(),
                        platform,
                        url: '#',
                        icon
                      };
                      setSocialLinks([...socialLinks, newLink]);
                    }}
                    className="text-bakery-sand hover:text-white transition-colors border-2 border-dashed border-bakery-sand/50 rounded p-1 flex items-center justify-center"
                    title="Add social link"
                  >
                    <Plus size={20} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8">
          <div className="text-center text-sm font-sans text-bakery-sand">
            {isEditing ? (
              <div className="flex flex-col items-center gap-2">
                <EditableText
                  value={copyrightText}
                  onSave={async (newValue) => {
                    setCopyrightText(newValue);
                  }}
                  tag="p"
                  className="text-center"
                />
                <p className="text-xs text-bakery-sand/70">
                  Website by{' '}
                  <a 
                    href="https://www.likhasiteworks.studio/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-white hover:text-white transition-colors underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    LikhaSiteWorks
                  </a>
                </p>
              </div>
            ) : (
              <p>
                {copyrightText} | Website by{' '}
                <a 
                  href="https://www.likhasiteworks.studio/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white hover:text-white transition-colors underline"
                >
                  LikhaSiteWorks
                </a>
              </p>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};