import React, { useState, useEffect, useRef } from 'react';
import { Tag, Clock, ArrowRight, Image as ImageIcon, Plus, Upload, Loader2, X, ShoppingBag, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react';
import type { SpecialOffer, SpecialOffersConfig } from '../src/types/database.types';
import { EditableText } from '../src/components/editor/EditableText';
import { useEditor } from '../src/contexts/EditorContext';
import { useWebsite } from '../src/contexts/WebsiteContext';
import { supabase } from '../src/lib/supabase';
import { MenuItem } from '../types';
import { ConfirmationModal } from '../src/components/ConfirmationModal';
import { useToast } from '../src/components/Toast';

// =====================================================
// COUNTDOWN TIMER COMPONENT
// =====================================================
interface CountdownTimerProps {
  targetDate: string;
  className?: string;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate, className = '' }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const difference = target - now;

      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000)
      });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (isExpired) return null;

  return (
    <div className={`flex gap-2 ${className}`}>
      {timeLeft.days > 0 && (
        <div className="bg-bakery-dark/80 backdrop-blur-sm px-2 py-1 rounded text-center min-w-[40px]">
          <span className="text-white font-bold text-sm block">{timeLeft.days}</span>
          <span className="text-white/70 text-[10px] uppercase">Days</span>
        </div>
      )}
      <div className="bg-bakery-dark/80 backdrop-blur-sm px-2 py-1 rounded text-center min-w-[40px]">
        <span className="text-white font-bold text-sm block">{String(timeLeft.hours).padStart(2, '0')}</span>
        <span className="text-white/70 text-[10px] uppercase">Hrs</span>
      </div>
      <div className="bg-bakery-dark/80 backdrop-blur-sm px-2 py-1 rounded text-center min-w-[40px]">
        <span className="text-white font-bold text-sm block">{String(timeLeft.minutes).padStart(2, '0')}</span>
        <span className="text-white/70 text-[10px] uppercase">Min</span>
      </div>
      <div className="bg-bakery-dark/80 backdrop-blur-sm px-2 py-1 rounded text-center min-w-[40px]">
        <span className="text-white font-bold text-sm block">{String(timeLeft.seconds).padStart(2, '0')}</span>
        <span className="text-white/70 text-[10px] uppercase">Sec</span>
      </div>
    </div>
  );
};

// =====================================================
// STATUS BADGE HELPERS
// =====================================================
type OfferStatus = 'coming_soon' | 'active' | 'expiring_soon' | 'expired';

const getOfferStatus = (offer: SpecialOffer): OfferStatus => {
  const now = new Date();

  if (offer.valid_from) {
    const validFrom = new Date(offer.valid_from);
    // Check if valid_from is a future date (not a text like "Limited Time")
    if (!isNaN(validFrom.getTime()) && validFrom > now) {
      return 'coming_soon';
    }
  }

  if (offer.valid_until) {
    const validUntil = new Date(offer.valid_until);
    if (!isNaN(validUntil.getTime())) {
      if (validUntil < now) return 'expired';
      // Expiring soon if less than 24 hours left
      const hoursLeft = (validUntil.getTime() - now.getTime()) / (1000 * 60 * 60);
      if (hoursLeft < 24) return 'expiring_soon';
    }
  }

  return 'active';
};

const StatusBadge: React.FC<{ status: OfferStatus }> = ({ status }) => {
  const styles = {
    coming_soon: 'bg-blue-500 text-white',
    active: 'bg-green-500 text-white',
    expiring_soon: 'bg-orange-500 text-white animate-pulse',
    expired: 'bg-gray-500 text-white'
  };

  const labels = {
    coming_soon: 'Coming Soon',
    active: 'Active',
    expiring_soon: 'Ends Soon!',
    expired: 'Expired'
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

// =====================================================
// MAIN COMPONENT
// =====================================================
interface SpecialOffersProps {
  addToCart?: (item: MenuItem) => void;
}

export const SpecialOffers: React.FC<SpecialOffersProps> = ({ addToCart }) => {
  const [config, setConfig] = useState<SpecialOffersConfig | null>(null);
  const [offers, setOffers] = useState<SpecialOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>(null);
  const { isEditing, saveField } = useEditor();
  const { websiteData, loading: websiteLoading } = useWebsite();
  const { showToast } = useToast();

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
      showToast('Failed to add offer. Please try again.', 'error');
    }
  };

  const handleDeleteOffer = async (offerId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Special Offer',
      message: 'Are you sure you want to delete this offer?',
      onConfirm: async () => {
        try {
          const newOffers = offers.filter(o => o.id !== offerId);
          await saveField('specialOffers', 'items', newOffers);
          setOffers(newOffers);
          setConfirmModal(null);
        } catch (error) {
          setConfirmModal(null);
          console.error('Error deleting offer:', error);
          showToast('Failed to delete offer. Please try again.', 'error');
        }
      }
    });
  };

  const handleClaimDeal = (offer: SpecialOffer) => {
    // If addToCart is available, add the offer as a cart item
    if (addToCart) {
      const menuItem: MenuItem = {
        id: parseInt(offer.id.slice(0, 8), 16) || Math.floor(Math.random() * 10000000),
        name: offer.title,
        description: offer.description || '',
        price: offer.discount_amount || 0,
        category: 'Special Offer' as any,
        image: offer.image_url || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
      };
      addToCart(menuItem);
      return;
    }

    // Fallback: scroll to menu section
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

  if (!config) {
    if (isEditing) {
      const initializeConfig = async () => {
        const defaultConfig: SpecialOffersConfig = {
          heading: 'Special Offers',
          subheading: 'Limited Time Only',
          show_timer: true,
          max_offers: 4
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

  // Filter offers: show all in edit mode, hide expired in public view
  const maxOffers = (config as any).max_offers || 4;
  const filteredOffers = offers.filter(offer => {
    if (isEditing) return true;
    const status = getOfferStatus(offer);
    return status !== 'expired' && offer.is_active;
  });
  const displayedOffers = filteredOffers.slice(0, maxOffers);

  // If no offers but in edit mode, show empty state
  if (offers.length === 0 && !isEditing) return null;

  // Empty state for public view
  if (displayedOffers.length === 0 && !isEditing) return null;

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

        {/* Carousel container for mobile, grid for desktop */}
        <div className="md:grid md:grid-cols-2 gap-8 lg:gap-12 flex overflow-x-auto snap-x snap-mandatory md:overflow-visible pb-4 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
          {displayedOffers.map((offer) => (
            <div key={offer.id} className="flex-shrink-0 w-[85vw] md:w-auto snap-center">
              <OfferCard
                offer={offer}
                offers={offers}
                setOffers={setOffers}
                isEditing={isEditing}
                saveField={saveField}
                onDelete={() => handleDeleteOffer(offer.id)}
                onClaimDeal={() => handleClaimDeal(offer)}
                showTimer={(config as any).show_timer}
                hasAddToCart={!!addToCart}
              />
            </div>
          ))}

          {/* Add Offer Button - show when editing */}
          {isEditing && offers.length < maxOffers && (
            <div className="flex-shrink-0 w-[85vw] md:w-auto snap-center">
              <button
                onClick={handleAddOffer}
                className="h-96 w-full rounded-2xl border-2 border-dashed border-bakery-sand/60 hover:border-bakery-primary hover:bg-bakery-cream/60 transition-colors flex flex-col items-center justify-center gap-4 p-8 bg-bakery-light/50 text-bakery-text/70 hover:text-bakery-primary"
              >
                <Plus size={48} className="opacity-50" />
                <span className="font-serif text-xl font-bold">Add Special Offer</span>
                <span className="text-sm opacity-70">Click to add a new offer</span>
              </button>
            </div>
          )}
        </div>

        {/* Empty state for editors */}
        {isEditing && offers.length === 0 && (
          <div className="text-center py-12 bg-bakery-light/30 rounded-xl border-2 border-dashed border-bakery-sand/40">
            <AlertCircle className="mx-auto text-bakery-text/40 mb-4" size={48} />
            <p className="text-bakery-text/60 font-sans mb-4">No special offers yet</p>
            <button
              onClick={handleAddOffer}
              className="px-6 py-3 bg-bakery-primary text-white rounded-full font-bold hover:bg-bakery-dark transition-colors inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Add Your First Offer
            </button>
          </div>
        )}

        <div className="mt-12 text-center">
          <p className="text-bakery-dark/60 font-sans italic text-sm">
            *Offers valid while supplies last. Cannot be combined with other discounts.
          </p>
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!confirmModal?.isOpen}
        title={confirmModal?.title}
        message={confirmModal?.message || ""}
        onClose={() => setConfirmModal(null)}
        onConfirm={confirmModal?.onConfirm || (() => { })}
      />
    </section>
  );
};

// =====================================================
// OFFER CARD COMPONENT
// =====================================================
const OfferCard: React.FC<{
  offer: SpecialOffer;
  offers: SpecialOffer[];
  setOffers: React.Dispatch<React.SetStateAction<SpecialOffer[]>>;
  isEditing: boolean;
  saveField: (section: string, field: string, value: any) => Promise<void>;
  onDelete: () => void;
  onClaimDeal: () => void;
  showTimer?: boolean;
  hasAddToCart?: boolean;
}> = ({ offer, offers, setOffers, isEditing, saveField, onDelete, onClaimDeal, showTimer, hasAddToCart }) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const status = getOfferStatus(offer);
  const { showToast } = useToast();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'warning');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be less than 5MB', 'warning');
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
      showToast('Failed to upload image. Please try again.', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };


  const isInactive = offer.is_active === false;

  return (
    <div className={`group relative overflow-hidden rounded-2xl shadow-xl h-96 cursor-pointer transition-all duration-300 hover:shadow-2xl ${status === 'expired' || isInactive ? 'opacity-60 grayscale' : ''}`}>
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

      {/* Inactive overlay - shown when is_active is false */}
      {isInactive && !isEditing && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-30">
          <span className="bg-gray-800 text-white px-6 py-3 rounded-xl font-bold text-lg uppercase tracking-wider">
            Not Available
          </span>
        </div>
      )}

      {/* Status Badge - only show in editing mode or for expiring/coming soon */}
      {(isEditing || status === 'expiring_soon' || status === 'coming_soon' || isInactive) && (
        <div className="absolute top-4 left-4 z-20">
          {isInactive && !isEditing ? (
            <div className="bg-gray-500 text-white px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1">
              <AlertCircle size={14} />
              Inactive
            </div>
          ) : (
            <StatusBadge status={status} />
          )}
        </div>
      )}

      {/* Edit controls */}
      {isEditing && !isUploading && (
        <div className="absolute top-4 right-4 flex gap-2 z-50">
          {/* Status Toggle */}
          <button
            onClick={async (e) => {
              e.stopPropagation();
              const currentStatus = offer.is_active !== false;
              const newOffers = offers.map(o => o.id === offer.id ? { ...o, is_active: !currentStatus } : o);
              await saveField('specialOffers', 'items', newOffers);
              setOffers(newOffers);
            }}
            className={`p-2 rounded-full shadow-lg transition-colors ${offer.is_active !== false
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : 'bg-gray-400 hover:bg-gray-500 text-white'
              }`}
            title={offer.is_active !== false ? 'Active - Click to deactivate' : 'Inactive - Click to activate'}
          >
            {offer.is_active !== false
              ? <ToggleRight size={16} />
              : <ToggleLeft size={16} />}
          </button>
          {/* Upload Button */}
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
          {/* Delete Button */}
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

      {/* Countdown Timer */}
      {showTimer && offer.valid_until && status !== 'expired' && (
        <div className="absolute top-14 left-4 z-20">
          <CountdownTimer targetDate={offer.valid_until} />
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
            {/* Original price (strikethrough) */}
            {offer.original_price && offer.original_price > (offer.discount_amount || 0) ? (
              isEditing ? (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-400">Was:</span>
                  <EditableText
                    value={offer.original_price?.toString() || '0'}
                    onSave={async (newValue) => {
                      const amount = parseFloat(newValue) || 0;
                      const newOffers = offers.map(o => o.id === offer.id ? { ...o, original_price: amount } : o);
                      await saveField('specialOffers', 'items', newOffers);
                      setOffers(newOffers);
                    }}
                    tag="span"
                    className="text-sm text-gray-300 line-through"
                  />
                </div>
              ) : (
                <span className="text-sm text-gray-300 line-through">₱{offer.original_price}</span>
              )
            ) : offer.discount_percentage ? (
              <span className="text-sm text-gray-300">Save {offer.discount_percentage}%</span>
            ) : isEditing ? (
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-400">Was:</span>
                <EditableText
                  value={offer.original_price?.toString() || '0'}
                  onSave={async (newValue) => {
                    const amount = parseFloat(newValue) || 0;
                    const newOffers = offers.map(o => o.id === offer.id ? { ...o, original_price: amount > 0 ? amount : undefined } : o);
                    await saveField('specialOffers', 'items', newOffers);
                    setOffers(newOffers);
                  }}
                  tag="span"
                  className="text-sm text-gray-300 line-through"
                />
              </div>
            ) : null}
            {/* Sale price */}
            {isEditing ? (
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-400">Now:</span>
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
              </div>
            ) : (
              <span className="font-serif text-2xl font-bold text-white">₱{offer.discount_amount || 0}</span>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!isEditing && status !== 'expired' && status !== 'coming_soon') {
                onClaimDeal();
              }
            }}
            disabled={status === 'expired' || status === 'coming_soon'}
            className="bg-white text-bakery-dark px-6 py-2.5 rounded-full font-bold text-sm hover:bg-bakery-sand transition-colors flex items-center gap-2 shadow-lg group-hover:shadow-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {hasAddToCart ? (
              <>
                <ShoppingBag size={16} />
                Add to Cart
              </>
            ) : (
              <>
                Claim Deal
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};