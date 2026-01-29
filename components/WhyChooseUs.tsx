import React, { useEffect, useState } from 'react';
import { Leaf, Users, ChefHat, Clock, Heart, Award, CheckCircle, Wheat, Star, Shield, Sparkles, Flame, Coffee, Cake, Cookie, Utensils, ShoppingBag, Truck, Gift, Ribbon, Crown, Zap, Target, TrendingUp, ThumbsUp, Smile, Plus, X } from 'lucide-react';
import { supabase, getWebsiteId } from '../src/lib/supabase';
import type { WhyChooseUsContent } from '../src/types/database.types';
import { EditableText } from '../src/components/editor/EditableText';
import { IconPicker } from '../src/components/editor/IconPicker';
import { useEditor } from '../src/contexts/EditorContext';
import { useWebsite } from '../src/contexts/WebsiteContext';

// Icon mapping - handles both kebab-case and camelCase
const iconMap: Record<string, any> = {
  'chef-hat': ChefHat,
  chefhat: ChefHat,
  leaf: Leaf,
  users: Users,
  clock: Clock,
  heart: Heart,
  award: Award,
  'check-circle': CheckCircle,
  'checkcircle': CheckCircle,
  wheat: Wheat,
  star: Star,
  shield: Shield,
  sparkles: Sparkles,
  flame: Flame,
  coffee: Coffee,
  cake: Cake,
  cookie: Cookie,
  utensils: Utensils,
  'shopping-bag': ShoppingBag,
  'shoppingbag': ShoppingBag,
  truck: Truck,
  gift: Gift,
  ribbon: Ribbon,
  crown: Crown,
  zap: Zap,
  target: Target,
  'trending-up': TrendingUp,
  'trendingup': TrendingUp,
  'thumbs-up': ThumbsUp,
  'thumbsup': ThumbsUp,
  smile: Smile,
};

export const WhyChooseUs: React.FC = () => {
  const [content, setContent] = useState<WhyChooseUsContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [editingIconIndex, setEditingIconIndex] = useState<number | null>(null);
  const { isEditing, saveField } = useEditor();
  const { contentVersion } = useWebsite();

  useEffect(() => {
    fetchContent();
  }, [contentVersion]); // Refetch when content version changes

  const fetchContent = async () => {
    try {
      const websiteId = await getWebsiteId();
      if (!websiteId) return;

      const { data, error } = await supabase
        .from('why_choose_us_content')
        .select('*')
        .eq('website_id', websiteId)
        .single();

      if (error) throw error;
      setContent(data as WhyChooseUsContent);
    } catch (error) {
      console.error('Error fetching why choose us content:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section id="whyChooseUs" className="py-24 bg-bakery-beige relative flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bakery-primary mx-auto mb-4"></div>
          <p className="font-sans text-gray-600">Loading...</p>
        </div>
      </section>
    );
  }

  if (!content) return null;

  const reasons = content.reasons as any[] || [];

  return (
    <section id="whyChooseUs" className="py-24 bg-bakery-beige relative">
        {/* Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                {content.subheading && (
                  isEditing ? (
                    <EditableText
                      value={content.subheading}
                      onSave={async (newValue) => {
                        await saveField('why_choose_us_content', 'subheading', newValue, content.id);
                        setContent({ ...content, subheading: newValue });
                      }}
                      tag="span"
                      className="font-sans font-bold text-bakery-primary tracking-widest uppercase text-sm block mb-2"
                    />
                  ) : (
                    <span className="font-sans font-bold text-bakery-primary tracking-widest uppercase text-sm block mb-2">
                        {content.subheading}
                    </span>
                  )
                )}
                {isEditing ? (
                  <EditableText
                    value={content.heading}
                    onSave={async (newValue) => {
                      await saveField('why_choose_us_content', 'heading', newValue, content.id);
                      setContent({ ...content, heading: newValue });
                    }}
                    tag="h2"
                    className="font-serif text-4xl md:text-5xl font-bold text-bakery-dark mb-4"
                  />
                ) : (
                  <h2 className="font-serif text-4xl md:text-5xl font-bold text-bakery-dark mb-4">{content.heading}</h2>
                )}
                <div className="w-24 h-1 bg-bakery-primary mx-auto rounded-full mt-6" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {reasons.map((reason, index) => {
                  const IconComponent = iconMap[reason.icon] || ChefHat;
                  
                  const handleDeleteReason = async () => {
                    if (window.confirm('Are you sure you want to delete this reason?')) {
                      try {
                        const updatedReasons = reasons.filter((_, i) => i !== index);
                        await saveField('why_choose_us_content', 'reasons', updatedReasons, content.id);
                        setContent({ ...content, reasons: updatedReasons as any });
                      } catch (error) {
                        console.error('Error deleting reason:', error);
                        alert('Failed to delete reason. Please try again.');
                      }
                    }
                  };
                  
                  return (
                    <div key={index} className="bg-white p-10 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-bakery-sand/30 group relative">
                        {isEditing && (
                          <button
                            onClick={handleDeleteReason}
                            className="absolute -top-2 -right-2 z-10 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-lg"
                            title="Delete reason"
                          >
                            <X size={16} />
                          </button>
                        )}
                        <div 
                          className={`w-20 h-20 bg-bakery-cream rounded-full flex items-center justify-center text-bakery-primary mb-8 mx-auto group-hover:scale-110 transition-transform duration-300 ${isEditing ? 'cursor-pointer hover:ring-2 hover:ring-blue-500' : ''}`}
                          onClick={isEditing ? () => {
                            setEditingIconIndex(index);
                            setIconPickerOpen(true);
                          } : undefined}
                          title={isEditing ? 'Click to change icon' : ''}
                        >
                            <IconComponent size={32} strokeWidth={1.5} />
                        </div>
                        {isEditing ? (
                          <EditableText
                            value={reason.title}
                            onSave={async (newValue) => {
                              const updatedReasons = [...reasons];
                              updatedReasons[index] = { ...updatedReasons[index], title: newValue };
                              await saveField('why_choose_us_content', 'reasons', updatedReasons, content.id);
                              setContent({ ...content, reasons: updatedReasons as any });
                            }}
                            tag="h3"
                            className="font-serif text-2xl font-bold text-bakery-dark mb-4 text-center group-hover:text-bakery-primary transition-colors"
                          />
                        ) : (
                          <h3 className="font-serif text-2xl font-bold text-bakery-dark mb-4 text-center group-hover:text-bakery-primary transition-colors">{reason.title}</h3>
                        )}
                        {isEditing ? (
                          <EditableText
                            value={reason.description}
                            onSave={async (newValue) => {
                              const updatedReasons = [...reasons];
                              updatedReasons[index] = { ...updatedReasons[index], description: newValue };
                              await saveField('why_choose_us_content', 'reasons', updatedReasons, content.id);
                              setContent({ ...content, reasons: updatedReasons as any });
                            }}
                            tag="p"
                            multiline
                            className="font-sans text-gray-600 text-center leading-relaxed"
                          />
                        ) : (
                          <p className="font-sans text-gray-600 text-center leading-relaxed">
                              {reason.description}
                          </p>
                        )}
                    </div>
                  );
                })}
                {isEditing && (
                  <button
                    onClick={async () => {
                      try {
                        const newReason = {
                          icon: 'chef-hat',
                          title: 'New Reason',
                          description: 'Reason description'
                        };
                        const updatedReasons = [...reasons, newReason];
                        await saveField('why_choose_us_content', 'reasons', updatedReasons, content.id);
                        setContent({ ...content, reasons: updatedReasons as any });
                      } catch (error) {
                        console.error('Error adding reason:', error);
                        alert('Failed to add reason. Please try again.');
                      }
                    }}
                    className="flex flex-col items-center justify-center gap-2 p-10 border-2 border-dashed border-gray-300 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-colors text-gray-500 hover:text-blue-600 bg-white"
                    title="Add new reason"
                  >
                    <Plus size={32} />
                    <span className="text-sm font-medium">Add Reason</span>
                  </button>
                )}
            </div>
        </div>

        {/* Icon Picker Modal */}
        <IconPicker
          isOpen={iconPickerOpen}
          onClose={() => {
            setIconPickerOpen(false);
            setEditingIconIndex(null);
          }}
          onSelect={async (iconName: string) => {
            if (editingIconIndex === null) return;
            try {
              const updatedReasons = [...reasons];
              updatedReasons[editingIconIndex] = { ...updatedReasons[editingIconIndex], icon: iconName };
              await saveField('why_choose_us_content', 'reasons', updatedReasons, content.id);
              setContent({ ...content, reasons: updatedReasons as any });
            } catch (error) {
              console.error('Error saving icon:', error);
              alert('Failed to save icon. Please try again.');
            }
          }}
          currentIcon={editingIconIndex !== null ? reasons[editingIconIndex]?.icon : undefined}
          availableIcons={['ChefHat', 'Leaf', 'Users', 'Clock', 'Heart', 'Award', 'CheckCircle', 'Wheat', 'Star', 'Shield', 'Sparkles', 'Flame', 'Coffee', 'Cake', 'Cookie', 'Utensils', 'ShoppingBag', 'Truck', 'Gift', 'Ribbon', 'Crown', 'Zap', 'Target', 'TrendingUp', 'ThumbsUp', 'Smile']}
        />
    </section>
  );
};