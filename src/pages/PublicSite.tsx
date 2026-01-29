/**
 * Public Site Page
 * The main public-facing website (moved from App.tsx)
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from '../../components/Navbar';
import { Hero } from '../../components/Hero';
import { Menu } from '../../components/Menu';
import { Contact } from '../../components/Contact';
import { Footer } from '../../components/Footer';
import { About } from '../../components/About';
import { Team } from '../../components/Team';
import { WhyChooseUs } from '../../components/WhyChooseUs';
import { Testimonials } from '../../components/Testimonials';
import { SpecialOffers } from '../../components/SpecialOffers';
import { FeaturedProducts } from '../../components/FeaturedProducts';
import { InstagramFeed } from '../../components/InstagramFeed';
import { Cart } from '../../components/Cart';
import { Reservation } from '../../components/Reservation';
import { FAQ } from '../../components/FAQ';
import { ChatSupport } from '../../components/ChatSupport';
import { CartItem, MenuItem } from '../types';
import { ConditionalSection } from '../components/ConditionalSection';
import { useWebsite } from '../contexts/WebsiteContext';

export const PublicSite: React.FC = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { loading, websiteData, currentWebsite } = useWebsite();

  // Handle hash navigation - scroll to section when hash is present
  // IMPORTANT: All hooks must be called before any conditional returns
  useEffect(() => {
    const handleHashNavigation = () => {
      const hash = window.location.hash;
      if (hash) {
        // Remove the # symbol
        const sectionId = hash.substring(1);
        
        // Wait a bit for content to load, then scroll
        const scrollToSection = () => {
          const element = document.getElementById(sectionId);
          if (element) {
            // Account for fixed navbar/header
            const headerOffset = 80;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });
          }
        };

        // Try immediately, then retry after a short delay if content is still loading
        scrollToSection();
        
        if (loading) {
          // If still loading, wait a bit more
          setTimeout(scrollToSection, 500);
        }
      }
    };

    // Handle initial hash on mount
    handleHashNavigation();

    // Handle hash changes
    window.addEventListener('hashchange', handleHashNavigation);

    // Also try scrolling after content loads
    if (!loading) {
      const timer = setTimeout(handleHashNavigation, 100);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('hashchange', handleHashNavigation);
      };
    }

    return () => {
      window.removeEventListener('hashchange', handleHashNavigation);
    };
  }, [loading]);

  const addToCart = (item: MenuItem) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: number) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: number, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    }));
  };

  const clearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      setCartItems([]);
    }
  };

  // Show loading state while website is being detected/loaded
  // This check must come AFTER all hooks are called
  if (loading || (!websiteData && currentWebsite)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading website...</p>
        </div>
      </div>
    );
  }

  // Show error if website not found or inactive
  if (!loading && !currentWebsite) {
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const siteParam = params.get('site') || params.get('website');
    
    // Check if website exists but is inactive
    const inactiveWebsite = typeof window !== 'undefined' ? sessionStorage.getItem('inactive_website') : null;
    
    if (inactiveWebsite || (siteParam && typeof window !== 'undefined' && sessionStorage.getItem('inactive_website'))) {
      const subdomain = inactiveWebsite || siteParam;
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Website Unavailable</h2>
            <p className="text-gray-600 mb-4">
              The website "{subdomain}" is currently unavailable. It has been temporarily deactivated.
            </p>
            <p className="text-sm text-gray-500">
              Please contact the website administrator if you believe this is an error.
            </p>
          </div>
        </div>
      );
    }
    
    // Website not found
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Website Not Found</h2>
          <p className="text-gray-600 mb-4">
            {siteParam 
              ? `The website "${siteParam}" was not found in the database.`
              : 'No website was detected. Please access the site with ?site=subdomain parameter.'}
          </p>
          <p className="text-sm text-gray-500">
            Make sure the website exists in your database and the subdomain is correct.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bakery-cream overflow-x-hidden">
      <Navbar 
        onOpenCart={() => setIsCartOpen(true)} 
        cartItemCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)} 
      />
      
      <Cart 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onRemove={removeFromCart}
        onUpdateQuantity={updateQuantity}
        onClear={clearCart}
      />

      <main>
        <ConditionalSection section="hero">
          <Hero />
        </ConditionalSection>
        <ConditionalSection section="about">
          <About />
        </ConditionalSection>
        <ConditionalSection section="whyChooseUs">
          <WhyChooseUs />
        </ConditionalSection>
        <ConditionalSection section="team">
          <Team />
        </ConditionalSection>
        <ConditionalSection section="featuredProducts">
          <FeaturedProducts addToCart={addToCart} />
        </ConditionalSection>
        <ConditionalSection section="menu">
          <Menu addToCart={addToCart} />
        </ConditionalSection>
        <ConditionalSection section="reservation">
          <Reservation />
        </ConditionalSection>
        <ConditionalSection section="testimonials">
          <Testimonials />
        </ConditionalSection>
        <ConditionalSection section="specialOffers">
          <SpecialOffers />
        </ConditionalSection>
        <ConditionalSection section="faq">
          <FAQ />
        </ConditionalSection>
        <ConditionalSection section="contact">
          <Contact />
        </ConditionalSection>
        <ConditionalSection section="instagramFeed">
          <InstagramFeed />
        </ConditionalSection>
      </main>
      <Footer />
      <ChatSupport />
    </div>
  );
};

