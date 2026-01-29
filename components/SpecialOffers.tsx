import React, { useState, useEffect } from 'react';
import { Tag, Clock, ArrowRight, Image as ImageIcon } from 'lucide-react';
import { supabase, getWebsiteId } from '../src/lib/supabase';
import type { SpecialOffer, SpecialOffersConfig } from '../src/types/database.types';
import { EditableText } from '../src/components/editor/EditableText';
import { useEditor } from '../src/contexts/EditorContext';

export const SpecialOffers: React.FC = () => {
  const [config, setConfig] = useState<SpecialOffersConfig | null>(null);
  const [offers, setOffers] = useState<SpecialOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const { isEditing, saveField } = useEditor();

  useEffect(() => {
    fetchSpecialOffers();
  }, []);

  const fetchSpecialOffers = async () => {
    try {
      const websiteId = await getWebsiteId();
      if (!websiteId) return;

      const [configResult, offersResult] = await Promise.all([
        supabase
          .from('special_offers_config')
          .select('*')
          .eq('website_id', websiteId)
          .single(),
        supabase
          .from('special_offers')
          .select('*')
          .eq('website_id', websiteId)
          .eq('is_active', true)
          .order('display_order')
      ]);

      // If config doesn't exist, create default
      if (configResult.error) {
        if (configResult.error.code === 'PGRST116') {
          // No config found, create default
          const { data: newConfig, error: insertError } = await supabase
            .from('special_offers_config')
            .insert({
              website_id: websiteId,
              heading: 'Sweet Deals & Treats',
              subheading: 'Limited Time Only',
              layout: 'grid',
              show_expiry_date: true
            } as any)
            .select()
            .single();

          if (insertError) throw insertError;
          setConfig(newConfig as SpecialOffersConfig);
        } else {
          throw configResult.error;
        }
      } else {
        setConfig(configResult.data as SpecialOffersConfig);
      }

      if (offersResult.error) throw offersResult.error;
      setOffers(offersResult.data as SpecialOffer[]);
    } catch (error) {
      console.error('Error fetching special offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = async (offer: SpecialOffer) => {
    const newImageUrl = prompt('Enter new image URL:', offer.image_url || '');
    if (newImageUrl !== null && newImageUrl !== offer.image_url) {
      try {
        await saveField('special_offers', 'image_url', newImageUrl, offer.id);
        setOffers(offers.map(o => o.id === offer.id ? { ...o, image_url: newImageUrl } : o));
        alert('Image saved successfully!');
      } catch (error) {
        console.error('Error saving image:', error);
        alert('Failed to save image. Please try again.');
      }
    }
  };

  const handleClaimDeal = (offer: SpecialOffer) => {
    // Scroll to menu section to view/add items
    const menuSection = document.getElementById('menu');
    if (menuSection) {
      menuSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      // Fallback: scroll to top or show message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <section id="specialOffers" className="py-24 bg-bakery-primary/5 relative overflow-hidden flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bakery-primary mx-auto mb-4"></div>
          <p className="font-sans text-gray-600">Loading...</p>
        </div>
      </section>
    );
  }

  // Show section even if no offers, so user can add them
  if (!config) {
    return (
      <section id="specialOffers" className="py-24 bg-bakery-primary/5 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="font-sans text-gray-600">Special Offers section not configured. Please configure it in the admin panel.</p>
          </div>
        </div>
      </section>
    );
  }

  // Limit to 2 offers only
  const displayedOffers = offers.slice(0, 2);
  
  // If no offers but in edit mode, show empty state
  if (offers.length === 0 && !isEditing) return null;

  return (
    <section id="specialOffers" className="py-24 bg-bakery-primary/5 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-bakery-accent/10 rounded-br-full -z-10 opacity-50" />
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-bakery-primary/10 rounded-tl-full -z-10 opacity-50" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                {isEditing ? (
                  <EditableText
                    value={config.subheading || 'Limited Time Only'}
                    onSave={async (newValue) => {
                      await saveField('special_offers_config', 'subheading', newValue, config.id);
                      setConfig({ ...config, subheading: newValue });
                    }}
                    tag="span"
                    className="font-sans font-bold text-bakery-accent tracking-widest uppercase text-sm block mb-2"
                  />
                ) : (
                  <span className="font-sans font-bold text-bakery-accent tracking-widest uppercase text-sm block mb-2">
                    {config.subheading || 'Limited Time Only'}
                  </span>
                )}
                {isEditing ? (
                  <EditableText
                    value={config.heading}
                    onSave={async (newValue) => {
                      await saveField('special_offers_config', 'heading', newValue, config.id);
                      setConfig({ ...config, heading: newValue });
                    }}
                    tag="h2"
                    className="font-serif text-4xl md:text-5xl font-bold text-bakery-dark"
                  />
                ) : (
                  <h2 className="font-serif text-4xl md:text-5xl font-bold text-bakery-dark">
                    {config.heading}
                  </h2>
                )}
                <div className="w-24 h-1 bg-bakery-sand mx-auto rounded-full mt-6" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                {displayedOffers.map((offer) => (
                  <div key={offer.id} className="group relative overflow-hidden rounded-2xl shadow-xl h-96 cursor-pointer">
                    <img 
                        src={offer.image_url || "https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"} 
                        alt={offer.title} 
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    {isEditing && (
                      <div 
                        className="absolute bottom-4 left-4 cursor-pointer z-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleImageChange(offer);
                        }}
                        title="Click to change image"
                      >
                        <div className="bg-white/95 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2 shadow-lg hover:bg-white transition-colors border-2 border-blue-500">
                          <ImageIcon size={16} className="text-gray-700" />
                          <span className="text-gray-700 font-medium text-xs">Change Image</span>
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-bakery-dark/95 via-bakery-dark/40 to-transparent flex flex-col justify-end p-8 text-white">
                        {offer.valid_from && (
                          <div className="bg-bakery-accent w-fit px-3 py-1 rounded-full text-xs font-bold uppercase mb-4 flex items-center gap-1 shadow-sm">
                            <Clock size={12} />
                            {isEditing ? (
                              <EditableText
                                value={offer.valid_from}
                                onSave={async (newValue) => {
                                  await saveField('special_offers', 'valid_from', newValue, offer.id);
                                  setOffers(offers.map(o => o.id === offer.id ? { ...o, valid_from: newValue } : o));
                                }}
                                tag="span"
                              />
                            ) : (
                              offer.valid_from
                            )}
                          </div>
                        )}
                        {isEditing ? (
                          <EditableText
                            value={offer.title}
                            onSave={async (newValue) => {
                              await saveField('special_offers', 'title', newValue, offer.id);
                              setOffers(offers.map(o => o.id === offer.id ? { ...o, title: newValue } : o));
                            }}
                            tag="h3"
                            className="font-serif text-3xl font-bold mb-2"
                          />
                        ) : (
                          <h3 className="font-serif text-3xl font-bold mb-2">{offer.title}</h3>
                        )}
                        {isEditing ? (
                          <EditableText
                            value={offer.description || ''}
                            onSave={async (newValue) => {
                              await saveField('special_offers', 'description', newValue, offer.id);
                              setOffers(offers.map(o => o.id === offer.id ? { ...o, description: newValue } : o));
                            }}
                            tag="p"
                            multiline
                            className="font-sans text-bakery-sand mb-6 max-w-sm"
                          />
                        ) : (
                          <p className="font-sans text-bakery-sand mb-6 max-w-sm">{offer.description}</p>
                        )}
                        <div className="flex items-center justify-between border-t border-white/20 pt-4 mt-auto">
                            <div className="flex flex-col">
                                {offer.discount_percentage ? (
                                  <span className="text-sm text-gray-300">Save {offer.discount_percentage}%</span>
                                ) : offer.discount_amount ? (
                                  <span className="text-sm text-gray-300 line-through">₱{offer.discount_amount}</span>
                                ) : null}
                                {isEditing ? (
                                  <EditableText
                                    value={offer.discount_amount?.toString() || '0'}
                                    onSave={async (newValue) => {
                                      const amount = parseFloat(newValue) || 0;
                                      await saveField('special_offers', 'discount_amount', amount, offer.id);
                                      setOffers(offers.map(o => o.id === offer.id ? { ...o, discount_amount: amount } : o));
                                    }}
                                    tag="span"
                                    className="font-serif text-2xl font-bold text-white"
                                  />
                                ) : (
                                  <span className="font-serif text-2xl font-bold text-white">₱{offer.discount_amount || 0}</span>
                                )}
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isEditing) {
                                  handleClaimDeal(offer);
                                }
                              }}
                              className="bg-white text-bakery-dark px-6 py-2.5 rounded-full font-bold text-sm hover:bg-bakery-sand transition-colors flex items-center gap-2 shadow-lg group-hover:shadow-white/20"
                            >
                                {isEditing ? (
                                  <EditableText
                                    value="Claim Deal"
                                    onSave={async (newValue) => {
                                      // Could save button text if we add it to the schema
                                    }}
                                    tag="span"
                                  />
                                ) : (
                                  'Claim Deal'
                                )}
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                     </div>
                   </div>
                ))}
            </div>
            
            <div className="mt-12 text-center">
              <p className="text-bakery-dark/60 font-sans italic text-sm">
                *Offers valid while supplies last. Cannot be combined with other discounts.
              </p>
            </div>
        </div>
    </section>
  );
};