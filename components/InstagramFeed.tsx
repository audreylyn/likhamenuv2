import React, { useEffect, useState, useRef } from 'react';
import { Instagram, Heart, ExternalLink, Image as ImageIcon, Plus, Upload, X, Loader2, Trash2 } from 'lucide-react';
import type { InstagramFeedConfig, InstagramFeedItem } from '../src/types/database.types';
import { EditableText } from '../src/components/editor/EditableText';
import { useEditor } from '../src/contexts/EditorContext';
import { useWebsite } from '../src/contexts/WebsiteContext';
import { supabase } from '../src/lib/supabase';

export const InstagramFeed: React.FC = () => {
  const [content, setContent] = useState<InstagramFeedConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const { isEditing, saveField } = useEditor();
  const { websiteData, loading: websiteLoading } = useWebsite();

  useEffect(() => {
    if (!websiteLoading && websiteData?.content?.instagramFeed) {
      setContent(websiteData.content.instagramFeed as InstagramFeedConfig);
      setLoading(false);
    } else if (!websiteLoading) {
      setLoading(false);
    }
  }, [websiteData, websiteLoading]);

  if (loading) {
    return (
      <section id="instagramFeed" className="py-20 bg-bakery-cream flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bakery-primary mx-auto mb-4"></div>
          <p className="font-sans text-bakery-text/80">Loading...</p>
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
                      const newContent = { ...content, instagram_handle: newValue };
                      await saveField('instagramFeed', 'instagram_handle', newValue);
                      setContent(newContent);
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
                  const newContent = { ...content, heading: newValue };
                  await saveField('instagramFeed', 'heading', newValue);
                  setContent(newContent);
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
                    const newContent = { ...content, subheading: newValue };
                    await saveField('instagramFeed', 'subheading', newValue);
                    setContent(newContent);
                  }}
                  tag="p"
                  className="text-bakery-text/80 mt-2"
                />
              ) : (
                <p className="text-bakery-text/80 mt-2">{content.subheading}</p>
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
                  const newContent = { ...content, instagram_url: newUrl };
                  saveField('instagramFeed', 'instagram_url', newUrl);
                  setContent(newContent);
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
          {posts.slice(0, content.max_items).map((post, postIndex) => (
            <InstagramPostCard
              key={postIndex}
              post={post}
              postIndex={postIndex}
              posts={posts}
              content={content}
              setContent={setContent}
              isEditing={isEditing}
              saveField={saveField}
            />
          ))}

          {/* Add New Post Button (when editing) */}
          {isEditing && (
            <AddPostButton posts={posts} content={content} setContent={setContent} saveField={saveField} />
          )}
        </div>

        {/* Mobile CTA */}
        <div className="mt-8 text-center md:hidden">
          <p className="text-bakery-dark/70 font-sans mb-4">Share your moments with us #GoldenCrumbMoments</p>
        </div>

      </div>
    </section>
  );
};

// Separate component for Instagram Post Card with file upload
const InstagramPostCard: React.FC<{
  post: InstagramFeedItem;
  postIndex: number;
  posts: InstagramFeedItem[];
  content: InstagramFeedConfig;
  setContent: React.Dispatch<React.SetStateAction<InstagramFeedConfig | null>>;
  isEditing: boolean;
  saveField: (section: string, field: string, value: any) => Promise<void>;
}> = ({ post, postIndex, posts, content, setContent, isEditing, saveField }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const fileName = `instagram-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

      const { data, error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('images').getPublicUrl(data.path);

      const updatedItems = posts.map((p, i) =>
        i === postIndex ? { ...p, image_url: urlData.publicUrl } : p
      );
      await saveField('instagramFeed', 'feed_items', updatedItems);
      setContent({ ...content, feed_items: updatedItems });
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
      setShowMenu(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Delete this Instagram post?')) return;
    try {
      const updatedItems = posts.filter((_, i) => i !== postIndex);
      await saveField('instagramFeed', 'feed_items', updatedItems);
      setContent({ ...content, feed_items: updatedItems });
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete post. Please try again.');
    }
  };

  return (
    <div className="group relative aspect-square overflow-visible rounded-lg cursor-pointer shadow-md hover:shadow-xl transition-all duration-300">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Upload button in edit mode */}
      {isEditing && !isUploading && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="absolute top-2 right-2 z-50 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg transition-colors"
        >
          <Upload size={14} />
        </button>
      )}

      {/* Options menu */}
      {showMenu && isEditing && (
        <div className="absolute top-12 right-2 z-[100] bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden min-w-[140px]">
          <button
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
          >
            <Upload size={16} />
            Upload Image
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeletePost();
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-red-100 text-red-600 flex items-center gap-2"
          >
            <Trash2 size={16} />
            Delete Post
          </button>
        </div>
      )}

      {/* Loading overlay */}
      {isUploading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg z-40">
          <Loader2 className="animate-spin text-white" size={32} />
        </div>
      )}

      <div className="w-full h-full overflow-hidden rounded-lg">
        {post.image_url ? (
          <img
            src={post.image_url}
            alt={post.caption}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <ImageIcon size={32} className="text-gray-400" />
          </div>
        )}

        {/* Overlay - only show on hover when not editing */}
        {!isEditing && (
          <a
            href={post.post_url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 bg-bakery-dark/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-6 text-white backdrop-blur-[2px]"
          >
            <div className="flex items-center gap-2">
              <Heart size={20} fill="white" />
              <span className="font-bold font-sans">{post.likes}</span>
            </div>
          </a>
        )}
      </div>
    </div>
  );
};

// Add Post Button Component
const AddPostButton: React.FC<{
  posts: InstagramFeedItem[];
  content: InstagramFeedConfig;
  setContent: React.Dispatch<React.SetStateAction<InstagramFeedConfig | null>>;
  saveField: (section: string, field: string, value: any) => Promise<void>;
}> = ({ posts, content, setContent, saveField }) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddPost = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const fileName = `instagram-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

      const { data, error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('images').getPublicUrl(data.path);

      const newPost: InstagramFeedItem = {
        id: Math.random().toString(36).substr(2, 9),
        image_url: urlData.publicUrl,
        post_url: '#',
        caption: '',
        likes: 0,
      };
      const updatedItems = [...posts, newPost];
      await saveField('instagramFeed', 'feed_items', updatedItems);
      setContent({ ...content, feed_items: updatedItems });
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to add post. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleAddPost}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="aspect-square rounded-lg border-2 border-dashed border-bakery-sand/60 hover:border-bakery-primary hover:bg-bakery-cream/60 transition-colors flex flex-col items-center justify-center gap-2 p-4 bg-bakery-light text-bakery-text/70 hover:text-bakery-primary group disabled:opacity-50"
        title="Add new Instagram post"
      >
        {isUploading ? (
          <Loader2 size={28} className="animate-spin" />
        ) : (
          <>
            <Plus size={28} className="group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium text-center">Add Post</span>
          </>
        )}
      </button>
    </>
  );
};