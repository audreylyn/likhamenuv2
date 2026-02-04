import React, { useState, useEffect, useRef } from 'react';
import { Tag, Clock, ArrowRight, Image as ImageIcon, Plus, Upload, Loader2, X } from 'lucide-react';
import type { SpecialOffer, SpecialOffersConfig } from '../src/types/database.types';
import { EditableText } from '../src/components/editor/EditableText';
import { useEditor } from '../src/contexts/EditorContext';
import { useWebsite } from '../src/contexts/WebsiteContext';
import { supabase } from '../src/lib/supabase';

export const SpecialOffers: React.FC = () => {
  const [config, setConfig] = useState<SpecialOffersConfig | null>(null);
  const [offers, setOffers] = useState<SpecialOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const { isEditing, saveField } = useEditor();
  const { websiteData, loading: websiteLoading } = useWebsite();

  useEffect(() => {
    if (!websiteLoading && websiteData?.content?.specialOffers) {
      const spContent = websiteData.content.specialOffers;
      if (spContent.config) {
        setConfig(spContent.config as SpecialOffersConfig);
      }
      if (spContent.items) {
        setOffers(spContent.items as SpecialOffer[]);
      }
      setLoading(false);
    } else if (!websiteLoading) {
      // Default config if missing? Or just show nothing/loading
      setLoading(false);
    }
  }, [websiteData, websiteLoading]);

  const handleAddOffer = async () => {
    try {
      const newOffer: SpecialOffer = {
        id: crypto.randomUUID(),
        website_id: websiteData?.id || '',
        title: 'New Special Offer',
        description: 'Amazing deal! Click to edit this description.',
        image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        discount_percentage: null,
        discount_amount: 99,
        valid_from: 'Limited Time',
        valid_until: null,
        is_active: true,
        display_order: offers.length,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      const newOffers = [...offers, newOffer];
      await saveField('specialOffers', 'items', newOffers);
      setOffers(newOffers);
    } catch (error) {
      console.error('Error adding offer:', error);
      alert('Failed to add offer. Please try again.');
    }
  };

  const handleDeleteOffer = async (offerId: string) => {
    if (!window.confirm('Are you sure you want to delete this offer?')) return;
    try {
      const newOffers = offers.filter(o => o.id !== offerId);
      await saveField('specialOffers', 'items', newOffers);
      setOffers(newOffers);
    } catch (error) {
      console.error('Error deleting offer:', error);
      alert('Failed to delete offer. Please try again.');
    }
  };

  const handleClaimDeal = (offer: SpecialOffer) => {
    // Scroll to menu section to view/add items
    const menuSection = document.getElementById('menu');
    if (menuSection) {
      menuSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <section id="specialOffers" className="py-24 bg-bakery-primary/5 relative overflow-hidden flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bakery-primary mx-auto mb-4"></div>
          <p className="font-sans text-bakery-text/80">Loading...</p>
        </div>
      </section>
    );
  }

  // Show section even if no offers, so user can add them
  if (!config) {
    if (isEditing) {
      // Initialize default config and show add button
      const initializeConfig = async () => {
        const defaultConfig: SpecialOffersConfig = {
          heading: 'Special Offers',
          subheading: 'Limited Time Only',
          show_timer: true,
          max_offers: 2
        };
        await saveField('specialOffers', 'config', defaultConfig);
        setConfig(defaultConfig);
      };
      
      return (
        <section id="specialOffers" className="py-24 bg-bakery-primary/5 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-serif text-4xl font-bold text-bakery-dark mb-6">Special Offers</h2>
            <p className="text-bakery-text/70 mb-8">No special offers configured yet.</p>
            <button
              onClick={initializeConfig}
              className="px-6 py-3 bg-blue-500 text-white rounded-full font-bold hover:bg-blue-600 transition-colors flex items-center gap-2 mx-auto"
            >
              <Plus size={20} />
              Initialize Special Offers
            </button>
          </div>
        </section>
      )
    }
    return null;
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
                const newConfig = { ...config, subheading: newValue };
                await saveField('specialOffers', 'config', newConfig);
                setConfig(newConfig);
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
                const newConfig = { ...config, heading: newValue };
                await saveField('specialOffers', 'config', newConfig);
                setConfig(newConfig);
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
            <OfferCard
              key={offer.id}
              offer={offer}
              offers={offers}
              setOffers={setOffers}
              isEditing={isEditing}
              saveField={saveField}
              onDelete={() => handleDeleteOffer(offer.id)}
              onClaimDeal={() => handleClaimDeal(offer)}
            />
          ))}

          {/* Add Offer Button - show when editing and less than 2 offers */}
          {isEditing && offers.length < 2 && (
            <button
              onClick={handleAddOffer}
              className="h-96 rounded-2xl border-2 border-dashed border-bakery-sand/60 hover:border-bakery-primary hover:bg-bakery-cream/60 transition-colors flex flex-col items-center justify-center gap-4 p-8 bg-bakery-light/50 text-bakery-text/70 hover:text-bakery-primary"
            >
              <Plus size={48} className="opacity-50" />
              <span className="font-serif text-xl font-bold">Add Special Offer</span>
              <span className="text-sm opacity-70">Click to add a new offer</span>
            </button>
          )}
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

// Offer Card Component with file upload
const OfferCard: React.FC<{
  offer: SpecialOffer;
  offers: SpecialOffer[];
  setOffers: React.Dispatch<React.SetStateAction<SpecialOffer[]>>;
  isEditing: boolean;
  saveField: (section: string, field: string, value: any) => Promise<void>;
  onDelete: () => void;
  onClaimDeal: () => void;
}> = ({ offer, offers, setOffers, isEditing, saveField, onDelete, onClaimDeal }) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `offer-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

      const { data, error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('images').getPublicUrl(data.path);

      const newOffers = offers.map(o => o.id === offer.id ? { ...o, image_url: urlData.publicUrl } : o);
      await saveField('specialOffers', 'items', newOffers);
      setOffers(newOffers);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl shadow-xl h-96 cursor-pointer">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      <img
        src={offer.image_url || "https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"}
        alt={offer.title}
        className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${isUploading ? 'opacity-50' : ''}`}
      />

      {/* Loading overlay */}
      {isUploading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-40">
          <Loader2 className="animate-spin text-white" size={48} />
        </div>
      )}

      {/* Edit controls */}
      {isEditing && !isUploading && (
        <div className="absolute top-4 right-4 flex gap-2 z-50">
          <button
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg transition-colors"
            title="Upload new image"
          >
            <Upload size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-colors"
            title="Delete offer"
          >
            <X size={16} />
          </button>
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
                  const newOffers = offers.map(o => o.id === offer.id ? { ...o, valid_from: newValue } : o);
                  await saveField('specialOffers', 'items', newOffers);
                  setOffers(newOffers);
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
              const newOffers = offers.map(o => o.id === offer.id ? { ...o, title: newValue } : o);
              await saveField('specialOffers', 'items', newOffers);
              setOffers(newOffers);
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
              const newOffers = offers.map(o => o.id === offer.id ? { ...o, description: newValue } : o);
              await saveField('specialOffers', 'items', newOffers);
              setOffers(newOffers);
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
                  const newOffers = offers.map(o => o.id === offer.id ? { ...o, discount_amount: amount } : o);
                  await saveField('specialOffers', 'items', newOffers);
                  setOffers(newOffers);
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
                onClaimDeal();
              }
            }}
            className="bg-white text-bakery-dark px-6 py-2.5 rounded-full font-bold text-sm hover:bg-bakery-sand transition-colors flex items-center gap-2 shadow-lg group-hover:shadow-white/20"
          >
            Claim Deal
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};