import React, { useState, useEffect } from "react";
import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  MessageCircle,
  Share2,
  X,
  Plus,
} from "lucide-react";
import { EditableText } from "../src/components/editor/EditableText";
import { useEditor } from "../src/contexts/EditorContext";
import { useWebsite } from "../src/contexts/WebsiteContext";
import type { FooterContent } from "../src/types/database.types";

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  icon: React.ReactNode;
}

export const Footer: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [brandName, setBrandName] = useState("");
  const [aboutText, setAboutText] = useState("");
  const [quickLinksTitle, setQuickLinksTitle] = useState("Quick Links");
  const [newsletterTitle, setNewsletterTitle] = useState("Contact Us");
  const [newsletterDescription, setNewsletterDescription] = useState(
    "123 Main Street, City, Country\n+1 234 567 8900",
  );
  const [copyrightText, setCopyrightText] = useState("");
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [footerContent, setFooterContent] = useState<FooterContent | null>(null);
  const { isEditing, saveField } = useEditor();
  const { websiteData, loading: websiteLoading, contentVersion } = useWebsite();

  useEffect(() => {
    if (!websiteLoading) {
      loadFooterData();
    }
  }, [websiteData, websiteLoading, contentVersion]);

  const loadFooterData = () => {
    setLoading(false);

    // Safety check - if no websiteData yet, don't crash
    if (!websiteData?.content) return;

    const navbarData = websiteData.content.navbar;
    const footerData = websiteData.content.footer;
    const contactData = websiteData.content.contact;
    const siteTitle = websiteData.website?.site_title;

    if (navbarData?.brand_name) {
      setBrandName(navbarData.brand_name);
    }

    if (footerData) {
      setFooterContent(footerData);
      if (footerData.about_text) setAboutText(footerData.about_text);
      if (footerData.copyright_text) {
        setCopyrightText(footerData.copyright_text);
      } else {
        // Fallback dynamic copyright if not explicitly saved
        const websiteName = siteTitle || (navbarData?.brand_name || "Website");
        setCopyrightText(`© ${new Date().getFullYear()} ${websiteName}. All rights reserved.`);
      }

      if (typeof footerData.newsletter_heading === "string") {
        setNewsletterTitle(footerData.newsletter_heading);
      }
      if (typeof footerData.newsletter_placeholder === "string") {
        setNewsletterDescription(footerData.newsletter_placeholder);
      }
    } else {
      // Defaults
      setAboutText("Bringing warmth to your day, one pastry at a time. Baked fresh daily with love and the finest ingredients.");
      const websiteName = siteTitle || (navbarData?.brand_name || "Website");
      setCopyrightText(`© ${new Date().getFullYear()} ${websiteName}. All rights reserved.`);
    }

    // Load social links from contact info
    if (contactData && contactData.social_links) {
      const links: SocialLink[] = [];
      const socials = contactData.social_links as any;
      if (socials.instagram)
        links.push({
          id: "1",
          platform: "Instagram",
          url: socials.instagram,
          icon: <Instagram size={24} />,
        });
      if (socials.facebook)
        links.push({
          id: "2",
          platform: "Facebook",
          url: socials.facebook,
          icon: <Facebook size={24} />,
        });
      if (socials.twitter)
        links.push({
          id: "3",
          platform: "Twitter",
          url: socials.twitter,
          icon: <Twitter size={24} />,
        });
      // We could add more if we map them or store them differently. 
      // For now this matches original logic.
      setSocialLinks(links);
    }
  };

  // Don't render footer until data is loaded to prevent flash
  if (loading && !brandName) {
    return null; // Or a loading spinner
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
                  // Save to navbar
                  await saveField("navbar", "brand_name", newValue);
                }}
                tag="h3"
                className="font-serif text-3xl font-bold text-white mb-4"
              />
            ) : (
              <h3 className="font-serif text-3xl font-bold text-white mb-4">
                {brandName}
              </h3>
            )}
            {isEditing ? (
              <EditableText
                value={aboutText}
                onSave={async (newValue) => {
                  setAboutText(newValue);
                  await saveField("footer", "about_text", newValue);
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
                  // Note: quickLinksTitle is state-only currently, not saved to DB in original code either?
                  // Should probably be saved to footer config if we want it persistent.
                  // For now, let's just keep it local state or assume it's hardcoded/not synced in original logic properly.
                  // Actually original code didn't save it. We can add it to footer content schema later if needed.
                }}
                tag="h4"
                className="font-serif text-xl font-bold text-white mb-6"
              />
            ) : (
              <h4 className="font-serif text-xl font-bold text-white mb-6">
                {quickLinksTitle}
              </h4>
            )}
            <ul className="space-y-3 font-sans">
              <li>
                <a
                  href={isEditing ? "#" : "#hero"}
                  onClick={isEditing ? (e) => e.preventDefault() : undefined}
                  className="hover:text-white transition-colors"
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href={isEditing ? "#" : "#menu"}
                  onClick={isEditing ? (e) => e.preventDefault() : undefined}
                  className="hover:text-white transition-colors"
                >
                  Menu
                </a>
              </li>
              <li>
                <a
                  href={isEditing ? "#" : "#about"}
                  onClick={isEditing ? (e) => e.preventDefault() : undefined}
                  className="hover:text-white transition-colors"
                >
                  About Us
                </a>
              </li>
              <li>
                <a
                  href={isEditing ? "#" : "#contact"}
                  onClick={isEditing ? (e) => e.preventDefault() : undefined}
                  className="hover:text-white transition-colors"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="text-center md:text-right">
            {isEditing ? (
              <EditableText
                value={newsletterTitle}
                onSave={async (newValue) => {
                  setNewsletterTitle(newValue);
                  await saveField("footer", "newsletter_heading", newValue);
                }}
                tag="h4"
                className="font-serif text-xl font-bold text-white mb-6"
              />
            ) : (
              <h4 className="font-serif text-xl font-bold text-white mb-6">
                {newsletterTitle}
              </h4>
            )}
            <div className="flex flex-col items-center md:items-end gap-4">
              {isEditing ? (
                <EditableText
                  value={newsletterDescription}
                  onSave={async (newValue) => {
                    setNewsletterDescription(newValue);
                    // Save as placeholder text or new field if we had one
                    await saveField("footer", "newsletter_placeholder", newValue);
                  }}
                  tag="p"
                  multiline
                  className="font-sans text-bakery-sand text-sm whitespace-pre-line text-center md:text-right"
                />
              ) : (
                <p className="font-sans text-bakery-sand text-sm whitespace-pre-line text-center md:text-right">
                  {newsletterDescription}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3 mt-2">
                {socialLinks.map((link) => (
                  <div key={link.id} className="relative group">
                    {isEditing && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete ${link.platform} link?`)) {
                            const newLinks = socialLinks.filter(
                              (l) => l.id !== link.id,
                            );
                            setSocialLinks(newLinks);
                            // Update core contact social links
                            const updatedSocials = { ...websiteData?.content?.contact?.social_links };
                            // Remove empty/deleted key
                            // Mapping platform name to key:
                            const key = link.platform.toLowerCase();
                            // This is tricky because UI list != fixed schema keys (instagram, facebook, twitter, linkedin, youtube).
                            // If it's a dynamic list, we might have issues sync back to fixed keys.
                            // But original code:
                            /*
                              if (socials.instagram) links.push(...)
                              if (socials.facebook) ...
                            */
                            // So we should only support deleting/updating known keys.
                            if (['instagram', 'facebook', 'twitter', 'linkedin', 'youtube'].includes(key)) {
                              updatedSocials[key] = null; // or empty string?
                              saveField('contact', 'social_links', updatedSocials);
                            }
                          }
                        }}
                        className="absolute -top-2 -right-2 z-10 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-lg opacity-0 group-hover:opacity-100"
                        title="Delete social link"
                      >
                        <X size={10} />
                      </button>
                    )}
                    <a
                      href={isEditing ? "#" : link.url}
                      target={isEditing ? undefined : "_blank"}
                      rel={isEditing ? undefined : "noopener noreferrer"}
                      onClick={async (e) => {
                        if (isEditing) {
                          e.preventDefault();
                          const newUrl = prompt(
                            `Enter ${link.platform} URL:`,
                            link.url,
                          );
                          if (newUrl !== null) {
                            const newLinks = socialLinks.map((l) =>
                              l.id === link.id ? { ...l, url: newUrl } : l,
                            );
                            setSocialLinks(newLinks);

                            const key = link.platform.toLowerCase();
                            // Update specific social key
                            const currentSocials = websiteData?.content?.contact?.social_links || {};
                            const updatedSocials = { ...currentSocials, [key]: newUrl };
                            await saveField('contact', 'social_links', updatedSocials);
                          }
                        }
                      }}
                      className="text-bakery-sand hover:text-white transition-colors"
                      title={
                        isEditing
                          ? `Click to edit ${link.platform} URL`
                          : link.platform
                      }
                    >
                      {link.icon}
                    </a>
                  </div>
                ))}
                {isEditing && (
                  <button
                    onClick={async () => {
                      const platform = prompt(
                        "Enter platform name (Instagram, Facebook, Twitter, LinkedIn, YouTube):",
                        "",
                      );
                      if (!platform) return;

                      let icon: React.ReactNode;
                      const platformLower = platform.toLowerCase();
                      let key = '';

                      if (
                        platformLower.includes("instagram") ||
                        platformLower.includes("ig")
                      ) {
                        icon = <Instagram size={24} />;
                        key = 'instagram';
                      } else if (
                        platformLower.includes("facebook") ||
                        platformLower.includes("fb")
                      ) {
                        icon = <Facebook size={24} />;
                        key = 'facebook';
                      } else if (
                        platformLower.includes("twitter") ||
                        platformLower.includes("x")
                      ) {
                        icon = <Twitter size={24} />;
                        key = 'twitter';
                      } else if (
                        platformLower.includes("linkedin") ||
                        platformLower.includes("linked")
                      ) {
                        icon = <Linkedin size={24} />;
                        key = 'linkedin';
                      } else if (
                        platformLower.includes("youtube") ||
                        platformLower.includes("yt")
                      ) {
                        icon = <Youtube size={24} />;
                        key = 'youtube';
                      } else {
                        // Not supported in strict schema?
                        alert("Only Instagram, Facebook, Twitter, LinkedIn, and YouTube are supported currently.");
                        return;
                      }

                      const url = prompt(`Enter ${platform} URL:`, "https://");
                      if (!url) return;

                      const newLink: SocialLink = {
                        id: Date.now().toString(),
                        platform,
                        url,
                        icon,
                      };
                      setSocialLinks([...socialLinks, newLink]);

                      // Save
                      const currentSocials = websiteData?.content?.contact?.social_links || {};
                      const updatedSocials = { ...currentSocials, [key]: url };
                      await saveField('contact', 'social_links', updatedSocials);
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
                    await saveField('footer', 'copyright_text', newValue);
                  }}
                  tag="p"
                  className="text-center"
                />
                <p className="text-xs text-bakery-sand/70">
                  Website by{" "}
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
                {copyrightText} | Website by{" "}
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