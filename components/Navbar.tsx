import React, { useState, useEffect } from 'react';
import { Menu, X, Croissant, ShoppingCart, Upload } from 'lucide-react';
import { supabase, getWebsiteId } from '../src/lib/supabase';
import { EditableText } from '../src/components/editor/EditableText';
import { useEditor } from '../src/contexts/EditorContext';
import type { NavbarContent } from '../src/types/database.types';

interface NavbarProps {
  onOpenCart: () => void;
  cartItemCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCart, cartItemCount }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [navbarContent, setNavbarContent] = useState<NavbarContent | null>(null);
  const [loading, setLoading] = useState(true);
  const { isEditing, saveField } = useEditor();

  useEffect(() => {
    fetchNavbarContent();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchNavbarContent = async () => {
    try {
      const websiteId = await getWebsiteId();
      if (!websiteId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('navbar_content')
        .select('*')
        .eq('website_id', websiteId)
        .single();

      if (error) {
        // If no navbar content exists, create default
        if (error.code === 'PGRST116') {
          const { data: newData, error: insertError } = await supabase
            .from('navbar_content')
            .insert({
              website_id: websiteId,
              brand_name: 'The Golden Crumb',
              brand_logo_url: null,
              show_cart: true,
              sticky_nav: true,
              nav_items: [
                { label: 'Home', href: '#hero', order: 0 },
                { label: 'Menu', href: '#menu', order: 1 },
                { label: 'About', href: '#about', order: 2 },
                { label: 'Contact', href: '#contact', order: 3 }
              ],
              cta_button: {
                text: 'Reserve Table',
                href: '#reservation',
                variant: 'primary'
              }
            })
            .select()
            .single();

          if (insertError) throw insertError;
          setNavbarContent(newData as NavbarContent);
        } else {
          throw error;
        }
      } else {
        setNavbarContent(data as NavbarContent);
      }
    } catch (error) {
      console.error('Error fetching navbar content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = async () => {
    if (!navbarContent) return;
    
    const logoUrl = prompt('Enter logo image URL:', navbarContent.brand_logo_url || '');
    if (logoUrl !== null) {
      try {
        await saveField('navbar_content', 'brand_logo_url', logoUrl || null, navbarContent.id);
        setNavbarContent({ ...navbarContent, brand_logo_url: logoUrl || null });
      } catch (error) {
        console.error('Error saving logo:', error);
      }
    }
  };

  // Don't show brand name until data is loaded
  const brandName = navbarContent?.brand_name || '';
  const brandLogo = navbarContent?.brand_logo_url;
  const navItems = (navbarContent?.nav_items as any[]) || [
    { label: 'Home', href: '#hero', order: 0 },
    { label: 'Menu', href: '#menu', order: 1 },
    { label: 'About', href: '#about', order: 2 },
    { label: 'Contact', href: '#contact', order: 3 },
  ];

  // Show minimal navbar while loading (no brand name to prevent flash)
  if (loading || !navbarContent) {
    return (
      <nav className="fixed w-full z-40 bg-transparent py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0 flex items-center gap-2">
              <div className="p-2 rounded-full bg-white text-bakery-primary">
                <Croissant size={24} />
              </div>
              {/* Don't show brand name until loaded */}
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav
      className={`fixed w-full z-40 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-sm shadow-md py-2' : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer group">
            <div 
              className={`p-2 rounded-full transition-colors duration-300 relative ${scrolled ? 'bg-bakery-primary text-white' : 'bg-white text-bakery-primary'} ${isEditing ? 'cursor-pointer hover:ring-2 hover:ring-blue-500 rounded-full' : ''}`}
              onClick={isEditing ? handleLogoChange : undefined}
              title={isEditing ? 'Click to change logo' : ''}
            >
              {brandLogo ? (
                <img src={brandLogo} alt="Logo" className="w-6 h-6 object-contain" />
              ) : (
                <Croissant size={24} />
              )}
              {isEditing && (
                <div className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Upload size={12} />
                </div>
              )}
            </div>
            {isEditing && navbarContent ? (
              <EditableText
                value={brandName}
                onSave={async (newValue) => {
                  await saveField('navbar_content', 'brand_name', newValue, navbarContent.id);
                  setNavbarContent({ ...navbarContent, brand_name: newValue });
                }}
                tag="span"
                className={`font-serif text-2xl font-bold tracking-wide transition-colors duration-300 ${
                  scrolled ? 'text-bakery-dark' : 'text-white drop-shadow-md'
                }`}
              />
            ) : (
              <span className={`font-serif text-2xl font-bold tracking-wide transition-colors duration-300 ${
                scrolled ? 'text-bakery-dark' : 'text-white drop-shadow-md'
              }`}>
                {brandName}
              </span>
            )}
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((link: any, index: number) => {
              const linkName = link.label || link.name || 'Link';
              const linkHref = link.href || '#';
              
              return (
                <a
                  key={index}
                  href={isEditing ? '#' : linkHref}
                  onClick={isEditing ? (e) => e.preventDefault() : undefined}
                  className={`font-sans font-medium text-lg tracking-wide transition-colors duration-300 ${
                    scrolled 
                      ? 'text-bakery-dark hover:text-bakery-primary' 
                      : 'text-white/90 hover:text-white drop-shadow-sm'
                  }`}
                >
                  {isEditing && navbarContent ? (
                    <EditableText
                      value={linkName}
                      onSave={async (newValue) => {
                        const updatedNavItems = [...navItems];
                        updatedNavItems[index] = { ...updatedNavItems[index], label: newValue };
                        await saveField('navbar_content', 'nav_items', updatedNavItems, navbarContent.id);
                        setNavbarContent({ ...navbarContent, nav_items: updatedNavItems as any });
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
            <button
              onClick={onOpenCart}
              className={`flex items-center gap-2 px-5 py-2 rounded-full font-serif transition-all duration-300 shadow-lg group relative ${
                scrolled
                  ? 'bg-bakery-dark text-white hover:bg-bakery-primary'
                  : 'bg-white text-bakery-dark hover:bg-bakery-sand'
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
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            <button
              onClick={onOpenCart}
              className={`relative p-2 rounded-full transition-colors ${
                 scrolled ? 'bg-bakery-dark text-white' : 'bg-white text-bakery-dark'
              }`}
            >
              <ShoppingCart size={24} />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                  {cartItemCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`focus:outline-none transition-colors duration-300 ${
                scrolled ? 'text-bakery-dark hover:text-bakery-primary' : 'text-white hover:text-bakery-sand'
              }`}
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-bakery-cream shadow-lg border-t border-bakery-sand animate-in slide-in-from-top-2 duration-200">
          <div className="px-4 pt-2 pb-6 space-y-2">
            {navItems.map((link: any, index: number) => {
              const linkName = link.label || link.name || 'Link';
              const linkHref = link.href || '#';
              
              return (
                <a
                  key={index}
                  href={isEditing ? '#' : linkHref}
                  onClick={(e) => {
                    if (isEditing) {
                      e.preventDefault();
                    } else {
                      setIsOpen(false);
                    }
                  }}
                  className="block px-3 py-3 text-base font-medium text-bakery-dark hover:text-bakery-primary hover:bg-bakery-beige rounded-md transition-colors"
                >
                  {isEditing && navbarContent ? (
                    <EditableText
                      value={linkName}
                      onSave={async (newValue) => {
                        const updatedNavItems = [...navItems];
                        updatedNavItems[index] = { ...updatedNavItems[index], label: newValue };
                        await saveField('navbar_content', 'nav_items', updatedNavItems, navbarContent.id);
                        setNavbarContent({ ...navbarContent, nav_items: updatedNavItems as any });
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