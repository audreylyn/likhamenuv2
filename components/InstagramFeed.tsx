import React, { useEffect, useState } from 'react';
import { Instagram, Heart, MessageCircle, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { supabase, getWebsiteId } from '../src/lib/supabase';
import type { InstagramFeedConfig, InstagramFeedItem } from '../src/types/database.types';
import { EditableText } from '../src/components/editor/EditableText';
import { useEditor } from '../src/contexts/EditorContext';

export const InstagramFeed: React.FC = () => {
  const [content, setContent] = useState<InstagramFeedConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const { isEditing, saveField } = useEditor();

  useEffect(() => {
    fetchInstagramFeed();
  }, []);

  const fetchInstagramFeed = async () => {
    try {
      const websiteId = await getWebsiteId();
      if (!websiteId) return;

      const { data, error } = await supabase
        .from('instagram_feed_config')
        .select('*')
        .eq('website_id', websiteId)
        .single();

      if (error) throw error;
      setContent(data as InstagramFeedConfig);
    } catch (error) {
      console.error('Error fetching Instagram feed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section id="instagramFeed" className="py-20 bg-bakery-cream flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bakery-primary mx-auto mb-4"></div>
          <p className="font-sans text-gray-600">Loading...</p>
        </div>
      </section>
    );
  }

  if (!content) return null;

  const posts = (content.feed_items as InstagramFeedItem[]) || [];

  return (
    <section id="instagramFeed" className="py-20 bg-bakery-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
          <div>
            {content.instagram_handle && (
              <div className="flex items-center gap-2 mb-2 text-bakery-accent">
                <Instagram size={20} />
                {isEditing ? (
                  <EditableText
                    value={content.instagram_handle}
                    onSave={async (newValue) => {
                      await saveField('instagram_feed_config', 'instagram_handle', newValue, content.id);
                      setContent({ ...content, instagram_handle: newValue });
                    }}
                    tag="span"
                    className="font-bold font-sans tracking-wider text-sm uppercase"
                  />
                ) : (
                  <span className="font-bold font-sans tracking-wider text-sm uppercase">{content.instagram_handle}</span>
                )}
              </div>
            )}
            {isEditing ? (
              <EditableText
                value={content.heading}
                onSave={async (newValue) => {
                  await saveField('instagram_feed_config', 'heading', newValue, content.id);
                  setContent({ ...content, heading: newValue });
                }}
                tag="h2"
                className="font-serif text-3xl md:text-4xl font-bold text-bakery-dark"
              />
            ) : (
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-bakery-dark">
                {content.heading}
              </h2>
            )}
            {content.subheading && (
              isEditing ? (
                <EditableText
                  value={content.subheading}
                  onSave={async (newValue) => {
                    await saveField('instagram_feed_config', 'subheading', newValue, content.id);
                    setContent({ ...content, subheading: newValue });
                  }}
                  tag="p"
                  className="text-gray-600 mt-2"
                />
              ) : (
                <p className="text-gray-600 mt-2">{content.subheading}</p>
              )
            )}
          </div>
          {content.instagram_url && (
            <a 
              href={isEditing ? '#' : content.instagram_url}
              onClick={isEditing ? (e) => {
                e.preventDefault();
                const newUrl = prompt('Enter Instagram profile URL:', content.instagram_url || '');
                if (newUrl !== null) {
                  saveField('instagram_feed_config', 'instagram_url', newUrl, content.id);
                  setContent({ ...content, instagram_url: newUrl });
                }
              } : undefined}
              target={isEditing ? undefined : "_blank"}
              rel={isEditing ? undefined : "noopener noreferrer"}
              className="flex items-center gap-2 text-bakery-primary font-bold font-serif border-b-2 border-bakery-primary pb-1 hover:text-bakery-dark transition-colors group"
            >
              <span>View Profile</span>
              <ExternalLink size={16} className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
            </a>
          )}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {posts.slice(0, content.max_items).map((post, index) => {
            const handleImageChange = async () => {
              const newImageUrl = prompt('Enter new image URL:', post.image_url || '');
              if (newImageUrl !== null && newImageUrl !== post.image_url) {
                try {
                  const updatedItems = posts.map((p, i) => 
                    i === index ? { ...p, image_url: newImageUrl } : p
                  );
                  await saveField('instagram_feed_config', 'feed_items', updatedItems, content.id);
                  setContent({ ...content, feed_items: updatedItems });
                  alert('Image saved successfully!');
                } catch (error) {
                  console.error('Error saving image:', error);
                  alert('Failed to save image. Please try again.');
                }
              }
            };

            return (
              <div
                key={index}
                className="group relative aspect-square overflow-hidden rounded-lg cursor-pointer shadow-md hover:shadow-xl transition-all duration-300"
              >
                {isEditing && (
                  <div 
                    className="absolute top-2 right-2 z-50 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleImageChange();
                    }}
                    title="Click to change image"
                  >
                    <div className="bg-white/95 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1 shadow-lg hover:bg-white transition-colors border-2 border-blue-500">
                      <ImageIcon size={14} className="text-gray-700" />
                    </div>
                  </div>
                )}
                <a
                  href={isEditing ? '#' : post.post_url}
                  onClick={isEditing ? (e) => {
                    e.preventDefault();
                    const newUrl = prompt('Enter post URL:', post.post_url || '');
                    if (newUrl !== null) {
                      const updatedItems = posts.map((p, i) => 
                        i === index ? { ...p, post_url: newUrl } : p
                      );
                      saveField('instagram_feed_config', 'feed_items', updatedItems, content.id);
                      setContent({ ...content, feed_items: updatedItems });
                    }
                  } : undefined}
                  target={isEditing ? undefined : "_blank"}
                  rel={isEditing ? undefined : "noopener noreferrer"}
                  className="block w-full h-full"
                >
                  <img 
                    src={post.image_url} 
                    alt={post.caption} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-bakery-dark/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-6 text-white backdrop-blur-[2px]">
                    <div className="flex items-center gap-2">
                      <Heart size={20} fill="white" />
                      {isEditing ? (
                        <EditableText
                          value={post.likes.toString()}
                          onSave={async (newValue) => {
                            const likes = parseInt(newValue) || 0;
                            const updatedItems = posts.map((p, i) => 
                              i === index ? { ...p, likes } : p
                            );
                            await saveField('instagram_feed_config', 'feed_items', updatedItems, content.id);
                            setContent({ ...content, feed_items: updatedItems });
                          }}
                          tag="span"
                          className="font-bold font-sans"
                        />
                      ) : (
                        <span className="font-bold font-sans">{post.likes}</span>
                      )}
                    </div>
                  </div>
                </a>
              </div>
            );
          })}
        </div>

        {/* Mobile CTA */}
        <div className="mt-8 text-center md:hidden">
            <p className="text-bakery-dark/70 font-sans mb-4">Share your moments with us #GoldenCrumbMoments</p>
        </div>

      </div>
    </section>
  );
};