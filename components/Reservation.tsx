import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, CheckCircle, Heart, Wheat, Award, Leaf, ChefHat, Star, Shield, Sparkles, Flame, Coffee, Cake, Cookie, Utensils, ShoppingBag, Truck, Gift, Ribbon, Crown, Zap, Target, TrendingUp, ThumbsUp, Smile } from 'lucide-react';
import { ReservationFormState } from '../types';
import { supabase, getWebsiteId } from '../src/lib/supabase';
import type { ReservationConfig } from '../src/types/database.types';
import { EditableText } from '../src/components/editor/EditableText';
import { IconPicker } from '../src/components/editor/IconPicker';
import { useEditor } from '../src/contexts/EditorContext';
import { useWebsite } from '../src/contexts/WebsiteContext';

// Icon mapping - handles both kebab-case and camelCase
const iconMap: Record<string, any> = {
  calendar: Calendar,
  clock: Clock,
  users: Users,
  'check-circle': CheckCircle,
  checkcircle: CheckCircle,
  heart: Heart,
  wheat: Wheat,
  award: Award,
  leaf: Leaf,
  'chef-hat': ChefHat,
  chefhat: ChefHat,
  star: Star,
  shield: Shield,
  sparkles: Sparkles,
  flame: Flame,
  coffee: Coffee,
  cake: Cake,
  cookie: Cookie,
  utensils: Utensils,
  'shopping-bag': ShoppingBag,
  shoppingbag: ShoppingBag,
  truck: Truck,
  gift: Gift,
  ribbon: Ribbon,
  crown: Crown,
  zap: Zap,
  target: Target,
  'trending-up': TrendingUp,
  trendingup: TrendingUp,
  'thumbs-up': ThumbsUp,
  thumbsup: ThumbsUp,
  smile: Smile,
};

interface ReservationFeature {
  icon: string;
  title: string;
  description: string;
}

export const Reservation: React.FC = () => {
  const [config, setConfig] = useState<ReservationConfig | null>(null);
  const [features, setFeatures] = useState<ReservationFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [editingIconIndex, setEditingIconIndex] = useState<number | null>(null);
  const { isEditing, saveField } = useEditor();
  const { currentWebsite } = useWebsite();
  
  const [form, setForm] = useState<ReservationFormState>({
    date: '',
    time: '',
    guests: 2,
    name: '',
    phone: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const fetchReservationData = async () => {
      try {
        const websiteId = await getWebsiteId();
        if (!websiteId) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('reservation_config')
          .select('*')
          .eq('website_id', websiteId)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') throw error;

        if (data) {
          setConfig(data as ReservationConfig);
          // Parse features from JSONB or use defaults
          const featuresData = (data as any).features || [
            { icon: 'calendar', title: 'Flexible Booking', description: 'Book up to 30 days in advance. Cancellation is free up to 2 hours before.' },
            { icon: 'users', title: 'Large Groups', description: 'Planning a gathering? We can accommodate groups of up to 12 people.' }
          ];
          setFeatures(featuresData);
        } else {
          // Create default config
          const defaultConfig = {
            website_id: websiteId,
            heading: 'Join Us for an Unforgettable Brunch',
            subheading: 'Book a Table',
            description: "Whether it's a quiet morning coffee or a lively weekend brunch with friends, we have the perfect spot for you. Reserve your table in advance to skip the queue.",
            features: [
              { icon: 'calendar', title: 'Flexible Booking', description: 'Book up to 30 days in advance. Cancellation is free up to 2 hours before.' },
              { icon: 'users', title: 'Large Groups', description: 'Planning a gathering? We can accommodate groups of up to 12 people.' }
            ]
          };
          const { data: newConfig, error: insertError } = await supabase
            .from('reservation_config')
            .insert(defaultConfig as any)
            .select()
            .single();
          
          if (insertError) throw insertError;
          setConfig(newConfig as ReservationConfig);
          setFeatures(defaultConfig.features);
        }
      } catch (error) {
        console.error('Error fetching reservation config:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReservationData();
  }, [currentWebsite]);

  const handleIconSelect = async (iconName: string) => {
    if (editingIconIndex === null || !config) return;

    const updatedFeatures = [...features];
    updatedFeatures[editingIconIndex] = {
      ...updatedFeatures[editingIconIndex],
      icon: iconName
    };
    setFeatures(updatedFeatures);

    try {
      const { error } = await supabase
        .from('reservation_config')
        .update({ features: updatedFeatures })
        .eq('id', config.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating icon:', error);
      alert('Failed to save icon. Please try again.');
      setFeatures(features); // Revert on error
    }

    setIconPickerOpen(false);
    setEditingIconIndex(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    // Reset after 3 seconds for demo
    setTimeout(() => {
      setIsSubmitted(false);
      setForm({ date: '', time: '', guests: 2, name: '', phone: '' });
    }, 5000);
  };

  const today = new Date().toISOString().split('T')[0];

  if (loading) {
    return (
      <section id="reservation" className="py-24 bg-bakery-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">Loading...</div>
        </div>
      </section>
    );
  }

  if (!config) {
    return null;
  }

  return (
    <section id="reservation" className="py-24 bg-bakery-dark relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10" 
           style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Text Content */}
          <div className="text-white">
            {isEditing ? (
              <EditableText
                value={config.subheading || 'Book a Table'}
                onSave={async (newValue) => {
                  await saveField('reservation_config', 'subheading', newValue, config.id);
                  setConfig({ ...config, subheading: newValue });
                }}
                tag="span"
                className="font-sans font-bold text-bakery-accent tracking-widest uppercase text-sm mb-2 block"
              />
            ) : (
              <span className="font-sans font-bold text-bakery-accent tracking-widest uppercase text-sm mb-2 block">
                {config.subheading || 'Book a Table'}
              </span>
            )}
            {isEditing ? (
              <EditableText
                value={config.heading}
                onSave={async (newValue) => {
                  await saveField('reservation_config', 'heading', newValue, config.id);
                  setConfig({ ...config, heading: newValue });
                }}
                tag="h2"
                className="font-serif text-4xl md:text-5xl font-bold mb-6 leading-tight"
              />
            ) : (
              <h2 className="font-serif text-4xl md:text-5xl font-bold mb-6 leading-tight">
                {config.heading}
              </h2>
            )}
            {isEditing ? (
              <EditableText
                value={config.description || ''}
                onSave={async (newValue) => {
                  await saveField('reservation_config', 'description', newValue, config.id);
                  setConfig({ ...config, description: newValue });
                }}
                tag="p"
                multiline
                className="font-sans text-bakery-sand text-lg mb-8 leading-relaxed"
              />
            ) : (
              <p className="font-sans text-bakery-sand text-lg mb-8 leading-relaxed">
                {config.description}
              </p>
            )}
            
            <div className="space-y-6">
              {features.map((feature, index) => {
                const IconComponent = iconMap[feature.icon.toLowerCase()] || Calendar;
                return (
                  <div key={index} className="flex gap-4">
                    <div 
                      className="bg-white/10 p-3 rounded-lg text-bakery-accent h-fit cursor-pointer hover:bg-white/20 transition-colors relative"
                      onClick={() => {
                        if (isEditing) {
                          setEditingIconIndex(index);
                          setIconPickerOpen(true);
                        }
                      }}
                      title={isEditing ? 'Click to change icon' : ''}
                    >
                      <IconComponent size={24} />
                    </div>
                    <div className="flex-1">
                      {isEditing ? (
                        <EditableText
                          value={feature.title}
                          onSave={async (newValue) => {
                            const updatedFeatures = [...features];
                            updatedFeatures[index] = { ...updatedFeatures[index], title: newValue };
                            setFeatures(updatedFeatures);
                            await saveField('reservation_config', 'features', updatedFeatures, config.id);
                          }}
                          tag="h4"
                          className="font-serif font-bold text-xl mb-1"
                        />
                      ) : (
                        <h4 className="font-serif font-bold text-xl mb-1">{feature.title}</h4>
                      )}
                      {isEditing ? (
                        <EditableText
                          value={feature.description}
                          onSave={async (newValue) => {
                            const updatedFeatures = [...features];
                            updatedFeatures[index] = { ...updatedFeatures[index], description: newValue };
                            setFeatures(updatedFeatures);
                            await saveField('reservation_config', 'features', updatedFeatures, config.id);
                          }}
                          tag="p"
                          multiline
                          className="text-bakery-sand/80 font-sans text-sm"
                        />
                      ) : (
                        <p className="text-bakery-sand/80 font-sans text-sm">{feature.description}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reservation Form Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-10">
            {isSubmitted ? (
              <div className="text-center py-16 animate-in fade-in duration-500">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="text-green-600" size={40} />
                </div>
                <h3 className="font-serif text-3xl font-bold text-bakery-dark mb-4">Reservation Confirmed!</h3>
                <p className="text-gray-600 font-sans mb-2">
                  We look forward to seeing you, <span className="font-bold">{form.name}</span>.
                </p>
                <p className="text-sm text-gray-500">
                  A confirmation has been sent to your phone.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-bakery-dark mb-2 font-serif">Date</label>
                    <div className="relative">
                      <input 
                        type="date" 
                        required
                        min={today}
                        value={form.date}
                        onChange={(e) => setForm({...form, date: e.target.value})}
                        className="w-full px-4 py-3 bg-bakery-cream/30 border border-bakery-sand rounded-lg focus:ring-2 focus:ring-bakery-primary/30 focus:border-bakery-primary outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-bakery-dark mb-2 font-serif">Time</label>
                    <div className="relative">
                      <input 
                        type="time" 
                        required
                        min="07:00"
                        max="19:00"
                        value={form.time}
                        onChange={(e) => setForm({...form, time: e.target.value})}
                        className="w-full px-4 py-3 bg-bakery-cream/30 border border-bakery-sand rounded-lg focus:ring-2 focus:ring-bakery-primary/30 focus:border-bakery-primary outline-none transition-all"
                      />
                      <Clock className="absolute right-3 top-3 text-gray-400 pointer-events-none" size={18} />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-bakery-dark mb-2 font-serif">Number of Guests</label>
                  <select 
                    value={form.guests}
                    onChange={(e) => setForm({...form, guests: Number(e.target.value)})}
                    className="w-full px-4 py-3 bg-bakery-cream/30 border border-bakery-sand rounded-lg focus:ring-2 focus:ring-bakery-primary/30 focus:border-bakery-primary outline-none transition-all appearance-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                      <option key={num} value={num}>{num} {num === 1 ? 'Guest' : 'Guests'}</option>
                    ))}
                    <option value={11}>10+ (Call us)</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-bakery-dark mb-2 font-serif">Your Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Jane Doe"
                      value={form.name}
                      onChange={(e) => setForm({...form, name: e.target.value})}
                      className="w-full px-4 py-3 bg-bakery-cream/30 border border-bakery-sand rounded-lg focus:ring-2 focus:ring-bakery-primary/30 focus:border-bakery-primary outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-bakery-dark mb-2 font-serif">Phone Number</label>
                    <input 
                      type="tel" 
                      required
                      placeholder="(555) 000-0000"
                      value={form.phone}
                      onChange={(e) => setForm({...form, phone: e.target.value})}
                      className="w-full px-4 py-3 bg-bakery-cream/30 border border-bakery-sand rounded-lg focus:ring-2 focus:ring-bakery-primary/30 focus:border-bakery-primary outline-none transition-all"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-bakery-primary text-white font-serif font-bold text-lg py-4 rounded-xl hover:bg-bakery-accent transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {isEditing ? (
                    <EditableText
                      value="Confirm Reservation"
                      onSave={async (newValue) => {
                        // Could save button text if we add it to the schema
                      }}
                      tag="span"
                    />
                  ) : (
                    'Confirm Reservation'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
      
      {iconPickerOpen && (
        <IconPicker
          isOpen={iconPickerOpen}
          onClose={() => {
            setIconPickerOpen(false);
            setEditingIconIndex(null);
          }}
          onSelect={handleIconSelect}
        />
      )}
    </section>
  );
};