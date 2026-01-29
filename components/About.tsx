import React, { useEffect, useState } from 'react';
import { Heart, Wheat, Clock, Award, CheckCircle, Users, Leaf, Image as ImageIcon, ChefHat, Star, Shield, Sparkles, Flame, Coffee, Cake, Cookie, Utensils, ShoppingBag, Truck, Gift, Ribbon, Crown, Zap, Target, TrendingUp, ThumbsUp, Smile, Plus, X } from 'lucide-react';
import { supabase, getWebsiteId } from '../src/lib/supabase';
import type { AboutContent } from '../src/types/database.types';
import { EditableText } from '../src/components/editor/EditableText';
import { IconPicker } from '../src/components/editor/IconPicker';
import { useEditor } from '../src/contexts/EditorContext';
import { useWebsite } from '../src/contexts/WebsiteContext';

// Icon mapping - handles both kebab-case and camelCase
const iconMap: Record<string, any> = {
  heart: Heart,
  wheat: Wheat,
  clock: Clock,
  award: Award,
  'check-circle': CheckCircle,
  'checkcircle': CheckCircle,
  users: Users,
  leaf: Leaf,
  'chef-hat': ChefHat,
  'chefhat': ChefHat,
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

export const About: React.FC = () => {
  const [content, setContent] = useState<AboutContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [editingIconIndex, setEditingIconIndex] = useState<number | null>(null);
  const { isEditing, saveField } = useEditor();
  const { contentVersion } = useWebsite();

  useEffect(() => {
    fetchAboutContent();
  }, [contentVersion]); // Refetch when content version changes

  const fetchAboutContent = async () => {
    try {
      const websiteId = await getWebsiteId();
      if (!websiteId) return;

      const { data, error } = await supabase
        .from('about_content')
        .select('*')
        .eq('website_id', websiteId)
        .single();

      if (error) throw error;
      setContent(data as AboutContent);
    } catch (error) {
      console.error('Error fetching about content:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section id="about" className="py-24 bg-white relative overflow-hidden flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bakery-primary mx-auto mb-4"></div>
          <p className="font-sans text-gray-600">Loading...</p>
        </div>
      </section>
    );
  }

  if (!content) return null;

  const features = content.features as any[] || [];
  const stats = content.stats as any[] || [];

  const handleImageChange = async () => {
    const newImageUrl = prompt('Enter new image URL:', content.image_url || '');
    if (newImageUrl !== null && newImageUrl !== content.image_url) {
      try {
        await saveField('about_content', 'image_url', newImageUrl, content.id);
        setContent({ ...content, image_url: newImageUrl });
        alert('Image saved successfully!');
      } catch (error) {
        console.error('Error saving image:', error);
        alert('Failed to save image. Please try again.');
      }
    }
  };

  const handleIconSelect = async (iconName: string) => {
    if (editingIconIndex === null || !content) return;
    try {
      const updatedFeatures = [...features];
      updatedFeatures[editingIconIndex] = { ...updatedFeatures[editingIconIndex], icon: iconName };
      await saveField('about_content', 'features', updatedFeatures, content.id);
      setContent({ ...content, features: updatedFeatures as any });
    } catch (error) {
      console.error('Error saving icon:', error);
      alert('Failed to save icon. Please try again.');
    }
  };

  return (
    <section id="about" className="py-24 bg-white relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-bakery-cream rounded-bl-full -z-10 opacity-50"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-bakery-beige rounded-tr-full -z-10 opacity-50"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center gap-16">
          
          {/* Image Collage */}
          <div className="w-full md:w-1/2 relative">
            <div className="relative z-10">
                <img 
                  src={content.image_url || "https://lanecove.s3.ap-southeast-2.amazonaws.com/wp-content/uploads/2016/05/04233634/bakers-delight-goods.jpg"} 
                  alt={content.heading} 
                  className="rounded-lg shadow-2xl w-[85%] border-4 border-white"
                />
                {isEditing && (
                  <div 
                    className="absolute bottom-4 left-4 cursor-pointer z-50"
                    onClick={handleImageChange}
                    title="Click to change image"
                  >
                    <div className="bg-white/95 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-2 shadow-lg hover:bg-white transition-colors border-2 border-blue-500">
                      <ImageIcon size={20} className="text-gray-700" />
                      <span className="text-gray-700 font-medium text-sm">Change Image</span>
                    </div>
                  </div>
                )}
            </div>
            <div className="absolute -bottom-10 -right-4 z-20 w-[60%]">
                {(() => {
                  // Get secondary image from stats (stored as special entry with type 'secondary_image')
                  const secondaryImageStat = stats.find((s: any) => s.type === 'secondary_image');
                  const secondaryImageUrl = secondaryImageStat?.value || "https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80";
                  
                  return (
                    <>
                      <img 
                        src={secondaryImageUrl} 
                        alt="Fresh loaves" 
                        className="rounded-lg shadow-xl border-4 border-white"
                      />
                      {isEditing && (
                        <div 
                          className="absolute bottom-4 left-4 cursor-pointer z-50"
                          onClick={async () => {
                            const newImageUrl = prompt('Enter new image URL:', secondaryImageUrl);
                            if (newImageUrl !== null && newImageUrl !== secondaryImageUrl) {
                              try {
                                // Update or add secondary image to stats
                                const updatedStats = [...stats];
                                const existingIndex = updatedStats.findIndex((s: any) => s.type === 'secondary_image');
                                if (existingIndex >= 0) {
                                  updatedStats[existingIndex] = { type: 'secondary_image', value: newImageUrl };
                                } else {
                                  updatedStats.push({ type: 'secondary_image', value: newImageUrl });
                                }
                                await saveField('about_content', 'stats', updatedStats, content.id);
                                setContent({ ...content, stats: updatedStats as any });
                                alert('Image saved successfully!');
                              } catch (error) {
                                console.error('Error saving image:', error);
                                alert('Failed to save image. Please try again.');
                              }
                            }
                          }}
                          title="Click to change image"
                        >
                          <div className="bg-white/95 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2 shadow-lg hover:bg-white transition-colors border-2 border-blue-500">
                            <ImageIcon size={16} className="text-gray-700" />
                            <span className="text-gray-700 font-medium text-xs">Change Image</span>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
            </div>
            {/* Badge */}
            {(() => {
              // Filter out secondary_image from stats display
              const displayStats = stats.filter((s: any) => s.type !== 'secondary_image');
              if (displayStats.length === 0) {
                // Create default stat if none exists
                const defaultStats = [{ type: 'badge', value: '15+', label: 'YEARS OF EXPERIENCE' }];
                return (
                  <div className="absolute top-10 -left-6 z-30 bg-bakery-primary text-white p-6 rounded-full shadow-lg flex flex-col items-center justify-center h-28 w-28 text-center animate-bounce-slow transform hover:scale-105 transition-transform">
                    {isEditing ? (
                      <>
                        <EditableText
                          value={defaultStats[0].value}
                          onSave={async (newValue) => {
                            const updatedStats = [...stats, { type: 'badge', value: newValue, label: defaultStats[0].label }];
                            await saveField('about_content', 'stats', updatedStats, content.id);
                            setContent({ ...content, stats: updatedStats as any });
                          }}
                          tag="span"
                          className="font-serif font-bold text-2xl block"
                        />
                        <EditableText
                          value={defaultStats[0].label}
                          onSave={async (newValue) => {
                            const updatedStats = [...stats, { type: 'badge', value: defaultStats[0].value, label: newValue }];
                            await saveField('about_content', 'stats', updatedStats, content.id);
                            setContent({ ...content, stats: updatedStats as any });
                          }}
                          tag="span"
                          className="text-xs font-sans uppercase tracking-wider block"
                        />
                      </>
                    ) : (
                      <>
                        <span className="font-serif font-bold text-2xl">{defaultStats[0].value}</span>
                        <span className="text-xs font-sans uppercase tracking-wider">{defaultStats[0].label}</span>
                      </>
                    )}
                  </div>
                );
              }
              const badgeStat = displayStats[0];
              return (
                <div className="absolute top-10 -left-6 z-30 bg-bakery-primary text-white p-6 rounded-full shadow-lg flex flex-col items-center justify-center h-28 w-28 text-center animate-bounce-slow transform hover:scale-105 transition-transform">
                  {isEditing ? (
                    <>
                      <EditableText
                        value={badgeStat.value}
                        onSave={async (newValue) => {
                          const updatedStats = stats.map((s: any) => 
                            s.type === badgeStat.type ? { ...s, value: newValue } : s
                          );
                          await saveField('about_content', 'stats', updatedStats, content.id);
                          setContent({ ...content, stats: updatedStats as any });
                        }}
                        tag="span"
                        className="font-serif font-bold text-2xl block"
                      />
                      <EditableText
                        value={badgeStat.label}
                        onSave={async (newValue) => {
                          const updatedStats = stats.map((s: any) => 
                            s.type === badgeStat.type ? { ...s, label: newValue } : s
                          );
                          await saveField('about_content', 'stats', updatedStats, content.id);
                          setContent({ ...content, stats: updatedStats as any });
                        }}
                        tag="span"
                        className="text-xs font-sans uppercase tracking-wider block"
                      />
                    </>
                  ) : (
                    <>
                      <span className="font-serif font-bold text-2xl">{badgeStat.value}</span>
                      <span className="text-xs font-sans uppercase tracking-wider">{badgeStat.label}</span>
                    </>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Content */}
          <div className="w-full md:w-1/2 mt-12 md:mt-0">
            {content.subheading && (
              isEditing ? (
                <EditableText
                  value={content.subheading}
                  onSave={async (newValue) => {
                    await saveField('about_content', 'subheading', newValue, content.id);
                    setContent({ ...content, subheading: newValue });
                  }}
                  tag="span"
                  className="font-sans font-bold text-bakery-primary tracking-widest uppercase text-sm block"
                />
              ) : (
                <span className="font-sans font-bold text-bakery-primary tracking-widest uppercase text-sm">{content.subheading}</span>
              )
            )}
            {isEditing ? (
              <EditableText
                value={content.heading}
                onSave={async (newValue) => {
                  await saveField('about_content', 'heading', newValue, content.id);
                  setContent({ ...content, heading: newValue });
                }}
                tag="h2"
                className="font-serif text-4xl md:text-5xl font-bold text-bakery-dark mt-3 mb-6"
              />
            ) : (
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-bakery-dark mt-3 mb-6">
                {content.heading}
              </h2>
            )}
            {isEditing ? (
              <EditableText
                value={content.description}
                onSave={async (newValue) => {
                  await saveField('about_content', 'description', newValue, content.id);
                  setContent({ ...content, description: newValue });
                }}
                tag="p"
                multiline
                className="font-sans text-lg text-gray-600 mb-8 leading-relaxed whitespace-pre-line"
              />
            ) : (
              <p className="font-sans text-lg text-gray-600 mb-8 leading-relaxed whitespace-pre-line">
                {content.description}
              </p>
            )}

            <div className="grid grid-cols-2 gap-6 mb-8">
                {features.map((feature, index) => {
                  const IconComponent = iconMap[feature.icon] || Heart;
                  const handleIconClick = () => {
                    setEditingIconIndex(index);
                    setIconPickerOpen(true);
                  };

                  const handleDeleteFeature = async () => {
                    if (window.confirm('Are you sure you want to delete this feature?')) {
                      try {
                        const updatedFeatures = features.filter((_, i) => i !== index);
                        await saveField('about_content', 'features', updatedFeatures, content.id);
                        setContent({ ...content, features: updatedFeatures as any });
                      } catch (error) {
                        console.error('Error deleting feature:', error);
                        alert('Failed to delete feature. Please try again.');
                      }
                    }
                  };
                  
                  return (
                    <div key={index} className="flex flex-col gap-2 relative">
                        {isEditing && (
                          <button
                            onClick={handleDeleteFeature}
                            className="absolute -top-2 -right-2 z-10 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-lg"
                            title="Delete feature"
                          >
                            <X size={16} />
                          </button>
                        )}
                        <div 
                          className={`text-bakery-primary ${isEditing ? 'cursor-pointer hover:ring-2 hover:ring-blue-500 rounded-lg p-1 transition-all' : ''}`}
                          onClick={isEditing ? handleIconClick : undefined}
                          title={isEditing ? 'Click to change icon' : ''}
                        >
                            <IconComponent size={32} strokeWidth={1.5} />
                        </div>
                        {isEditing ? (
                          <EditableText
                            value={feature.title}
                            onSave={async (newValue) => {
                              const updatedFeatures = [...features];
                              updatedFeatures[index] = { ...updatedFeatures[index], title: newValue };
                              await saveField('about_content', 'features', updatedFeatures, content.id);
                              setContent({ ...content, features: updatedFeatures as any });
                            }}
                            tag="h4"
                            className="font-serif font-bold text-bakery-dark text-lg"
                          />
                        ) : (
                          <h4 className="font-serif font-bold text-bakery-dark text-lg">{feature.title}</h4>
                        )}
                        {isEditing ? (
                          <EditableText
                            value={feature.description}
                            onSave={async (newValue) => {
                              const updatedFeatures = [...features];
                              updatedFeatures[index] = { ...updatedFeatures[index], description: newValue };
                              await saveField('about_content', 'features', updatedFeatures, content.id);
                              setContent({ ...content, features: updatedFeatures as any });
                            }}
                            tag="p"
                            className="text-sm text-gray-500 font-sans"
                          />
                        ) : (
                          <p className="text-sm text-gray-500 font-sans">{feature.description}</p>
                        )}
                    </div>
                  );
                })}
                {isEditing && (
                  <button
                    onClick={async () => {
                      try {
                        const newFeature = {
                          icon: 'heart',
                          title: 'New Feature',
                          description: 'Feature description'
                        };
                        const updatedFeatures = [...features, newFeature];
                        await saveField('about_content', 'features', updatedFeatures, content.id);
                        setContent({ ...content, features: updatedFeatures as any });
                      } catch (error) {
                        console.error('Error adding feature:', error);
                        alert('Failed to add feature. Please try again.');
                      }
                    }}
                    className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-gray-500 hover:text-blue-600"
                    title="Add new feature"
                  >
                    <Plus size={32} />
                    <span className="text-sm font-medium">Add Feature</span>
                  </button>
                )}
            </div>
          </div>

        </div>
      </div>

      {/* Icon Picker Modal */}
      <IconPicker
        isOpen={iconPickerOpen}
        onClose={() => {
          setIconPickerOpen(false);
          setEditingIconIndex(null);
        }}
        onSelect={handleIconSelect}
        currentIcon={editingIconIndex !== null ? features[editingIconIndex]?.icon : undefined}
        availableIcons={['Heart', 'Wheat', 'Clock', 'Award', 'CheckCircle', 'Users', 'Leaf', 'ChefHat', 'Star', 'Shield', 'Sparkles', 'Flame', 'Coffee', 'Cake', 'Cookie', 'Utensils', 'ShoppingBag', 'Truck', 'Gift', 'Ribbon', 'Crown', 'Zap', 'Target', 'TrendingUp', 'ThumbsUp', 'Smile']}
      />
    </section>
  );
};