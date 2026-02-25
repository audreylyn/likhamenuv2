import React, { useState, useEffect } from "react";
import { Menu, X, Croissant, ShoppingCart, Upload } from "lucide-react";
import { EditableText } from "../src/components/editor/EditableText";
import { useEditor } from "../src/contexts/EditorContext";
import { useWebsite } from "../src/contexts/WebsiteContext";import { useToast } from '../src/components/Toast';
// Default navbar content
const DEFAULT_NAVBAR = {
  brand_name: "The Golden Crumb",
  brand_logo_url: null,
  show_cart: true,
  sticky_nav: true,
  nav_items: [
    { label: "Home", href: "#hero", order: 0 },
    { label: "Menu", href: "#menu", order: 1 },
    { label: "About", href: "#about", order: 2 },
    { label: "Payment", href: "#payment", order: 3 },
    { label: "Contact", href: "#contact", order: 4 },
  ],
  cta_button: {
    text: "Reserve Table",
    href: "#reservation",
    variant: "primary",
  },
};

interface NavbarProps {
  onOpenCart: () => void;
  cartItemCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCart,
  cartItemCount,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isEditing, saveField } = useEditor();
  const { websiteData, loading, sectionVisibility } = useWebsite();
  const { showToast } = useToast();

  // Get navbar content from websiteData.content.navbar
  const navbarContent = websiteData?.content?.navbar || DEFAULT_NAVBAR;
  const [localContent, setLocalContent] = useState(navbarContent);

  // Check for Basic Plan - hide navbar if true (except in editor?)
  // Requirement: "just bring back the navbar, but in basic only the home, menu same goes with quick links"
  const isBasicPlan = websiteData?.marketing?.plan_id === 'basic';

  // Show cart only if at least one ordering section (menu or featuredProducts) is enabled
  const showCart = !isBasicPlan && (sectionVisibility['menu'] || sectionVisibility['featuredProducts']);

  // Update local content when websiteData changes
  useEffect(() => {
    if (websiteData?.content?.navbar) {
      setLocalContent(websiteData.content.navbar);
    }
  }, [websiteData?.content?.navbar]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoFileInputRef = React.useRef<HTMLInputElement>(null);

  const handleLogoClick = () => {
    if (isEditing && logoFileInputRef.current) {
      logoFileInputRef.current.click();
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'warning');
      return;
    }

    // Validate file size (max 2MB for logos)
    if (file.size > 2 * 1024 * 1024) {
      showToast('Logo must be less than 2MB', 'warning');
      return;
    }

    setIsUploadingLogo(true);

    try {
      const { supabase } = await import('../src/lib/supabase');

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);

      // Save new logo URL
      if (isEditing) {
        setLocalContent(prev => ({ ...prev, brand_logo_url: publicUrl }));
        await saveField('navbar', 'brand_logo_url', publicUrl);
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      showToast('Failed to upload logo. Please try again.', 'error');
    } finally {
      setIsUploadingLogo(false);
      // Reset file input
      if (logoFileInputRef.current) {
        logoFileInputRef.current.value = '';
      }
    }
  };


  const brandName = localContent.brand_name || "";
  const brandLogo = localContent.brand_logo_url;

  // Filter nav items based on section visibility
  const rawNavItems = localContent.nav_items || DEFAULT_NAVBAR.nav_items;

  // Auto-inject nav items for enabled sections that have no nav link yet
  const sectionsNeedingAutoLink: { section: string; label: string; afterSection: string }[] = [
    { section: 'packages', label: 'Packages', afterSection: 'menu' },
    { section: 'gallery', label: 'Gallery', afterSection: 'packages' },
  ];

  let enrichedNavItems = [...rawNavItems];
  if (!isBasicPlan) {
    for (const auto of sectionsNeedingAutoLink) {
      const hasLink = enrichedNavItems.some((item: any) => (item.href || '').includes(`#${auto.section}`));
      if (!hasLink && sectionVisibility[auto.section]) {
        // Insert after the "afterSection" link, or at the end
        const afterIdx = enrichedNavItems.findIndex((item: any) => (item.href || '').includes(`#${auto.afterSection}`));
        const maxOrder = enrichedNavItems.reduce((max: number, item: any) => Math.max(max, item.order || 0), 0);
        const newItem = { label: auto.label, href: `#${auto.section}`, order: maxOrder + 1 };
        if (afterIdx >= 0) {
          enrichedNavItems.splice(afterIdx + 1, 0, newItem);
        } else {
          enrichedNavItems.push(newItem);
        }
      }
    }
  }

  const navItems = enrichedNavItems.filter((item: any) => {
    // Basic Plan Logic
    if (isBasicPlan) {
      return item.label === "Home" || item.label === "Menu";
    }

    // If editing, show all items so they can be edited? 
    // Or reflect actual visibility? Reflecting visibility seems better for WYSIWYG.
    // However, if user wants to edit a link that is hidden, they might need to see it.
    // But typically they enable the section first.

    const href = item.href || "";
    // If external link or not hash link, keep it
    if (!href.startsWith("#")) return true;

    const section = href.substring(1);
    // If section visibility is defined, use it. Otherwise (e.g. #unknown), keep it.
    if (sectionVisibility[section] !== undefined) {
      return sectionVisibility[section];
    }
    return true;
  }).map((item: any) => {
    if (isBasicPlan && item.label === "Menu") {
      return { ...item, href: "#catalogue" }; // Remap Menu to Catalogue for Basic Plan
    }
    return item;
  });



  // Show minimal navbar while loading
  if (loading) {
    return (
      <nav className="fixed w-full z-50 bg-transparent py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0 flex items-center gap-2">
              <div className="p-2 rounded-full bg-white text-bakery-primary">
                <Croissant size={24} />
              </div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${scrolled
        ? "bg-white/95 backdrop-blur-sm shadow-md py-2"
        : "bg-transparent py-6"
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer group">
            <div
              className={`p-2 rounded-full transition-colors duration-300 relative ${scrolled ? "bg-bakery-primary text-white" : "bg-white text-bakery-primary"} ${isEditing ? "cursor-pointer hover:ring-2 hover:ring-blue-500 rounded-full" : ""}`}
              onClick={handleLogoClick}
              title={isEditing ? "Click to upload logo" : ""}
            >
              {isUploadingLogo ? (
                <div className="animate-spin">
                  <Upload size={24} />
                </div>
              ) : brandLogo ? (
                <img
                  src={brandLogo}
                  alt="Logo"
                  className="w-6 h-6 object-contain"
                />
              ) : (
                <Croissant size={24} />
              )}
              {isEditing && !isUploadingLogo && (
                <div className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Upload size={12} />
                </div>
              )}
            </div>
            {/* Hidden file input */}
            {isEditing && (
              <input
                ref={logoFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
              />
            )}
            {isEditing ? (
              <EditableText
                value={brandName}
                onSave={async (newValue) => {
                  await saveField("navbar", "brand_name", newValue);
                  setLocalContent({ ...localContent, brand_name: newValue });
                }}
                tag="span"
                className={`font-serif text-2xl font-bold tracking-wide transition-colors duration-300 ${scrolled ? "text-bakery-dark" : "text-white drop-shadow-md"
                  }`}
              />
            ) : (
              <span
                className={`font-serif text-2xl font-bold tracking-wide transition-colors duration-300 ${scrolled ? "text-bakery-dark" : "text-white drop-shadow-md"
                  }`}
              >
                {brandName}
              </span>
            )}
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((link: any, index: number) => {
              const linkName = link.label || link.name || "Link";
              const linkHref = link.href || "#";

              return (
                <a
                  key={index}
                  href={isEditing ? "#" : linkHref}
                  onClick={isEditing ? (e) => e.preventDefault() : undefined}
                  className={`font-sans font-medium text-lg tracking-wide transition-colors duration-300 ${scrolled
                    ? "text-bakery-dark hover:text-bakery-primary"
                    : "text-white/90 hover:text-white drop-shadow-sm"
                    }`}
                >
                  {isEditing ? (
                    <EditableText
                      value={linkName}
                      onSave={async (newValue) => {
                        const updatedNavItems = [...navItems];
                        updatedNavItems[index] = {
                          ...updatedNavItems[index],
                          label: newValue,
                        };
                        await saveField("navbar", "nav_items", updatedNavItems);
                        setLocalContent({
                          ...localContent,
                          nav_items: updatedNavItems,
                        });
                      }}
                      tag="span"
                    />
                  ) : (
                    linkName
                  )}
                </a>
              );
            })}



            {/* Cart Button */}
            {showCart && (
              <button
                onClick={onOpenCart}
                className={`flex items-center gap-2 px-5 py-2 rounded-full font-serif transition-all duration-300 shadow-lg group relative ${scrolled
                  ? "bg-bakery-dark text-white hover:bg-bakery-primary"
                  : "bg-white text-bakery-dark hover:bg-bakery-sand"
                  }`}
              >
                <ShoppingCart size={20} />
                <span className="font-bold">Cart</span>
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                    {cartItemCount}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            {showCart && (
              <button
                onClick={onOpenCart}
                className={`relative p-2 rounded-full transition-colors ${scrolled
                  ? "bg-bakery-dark text-white"
                  : "bg-white text-bakery-dark"
                  }`}
              >
                <ShoppingCart size={24} />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                    {cartItemCount}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`focus:outline-none transition-colors duration-300 ${scrolled
                ? "text-bakery-dark hover:text-bakery-primary"
                : "text-white hover:text-bakery-sand"
                }`}
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-bakery-cream shadow-lg border-t border-bakery-sand animate-in slide-in-from-top-2 duration-200 z-40">
          <div className="px-4 pt-2 pb-6 space-y-2">
            {navItems.map((link: any, index: number) => {
              const linkName = link.label || link.name || "Link";
              const linkHref = link.href || "#";

              return (
                <a
                  key={index}
                  href={isEditing ? "#" : linkHref}
                  onClick={(e) => {
                    if (isEditing) {
                      e.preventDefault();
                    } else {
                      setIsOpen(false);
                    }
                  }}
                  className="block px-3 py-3 text-base font-medium text-bakery-dark hover:text-bakery-primary hover:bg-bakery-beige rounded-md transition-colors"
                >
                  {isEditing ? (
                    <EditableText
                      value={linkName}
                      onSave={async (newValue) => {
                        const updatedNavItems = [...navItems];
                        updatedNavItems[index] = {
                          ...updatedNavItems[index],
                          label: newValue,
                        };
                        await saveField("navbar", "nav_items", updatedNavItems);
                        setLocalContent({
                          ...localContent,
                          nav_items: updatedNavItems,
                        });
                      }}
                      tag="span"
                    />
                  ) : (
                    linkName
                  )}
                </a>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
};
