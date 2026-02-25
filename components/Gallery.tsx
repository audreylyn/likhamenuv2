import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, Plus, Trash2, ChevronLeft, ChevronRight, Star, StarOff,
  Image as ImageIcon, Upload, Maximize2
} from 'lucide-react';
import type {
  GalleryImage, GalleryCategory, GallerySectionConfig
} from '../src/types/database.types';
import { EditableText } from '../src/components/editor/EditableText';
import { EditableImage } from '../src/components/editor/EditableImage';
import { useEditor } from '../src/contexts/EditorContext';
import { useWebsite } from '../src/contexts/WebsiteContext';
import { ConfirmationModal } from '../src/components/ConfirmationModal';
import { useToast } from '../src/components/Toast';

const generateId = () => crypto.randomUUID?.() || Math.random().toString(36).substring(2, 9);

export const Gallery: React.FC = () => {
  const [config, setConfig] = useState<GallerySectionConfig | null>(null);
  const [categories, setCategories] = useState<GalleryCategory[]>([]);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [lightboxImage, setLightboxImage] = useState<GalleryImage | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>(null);
  const carouselTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const defaultsSavedRef = useRef(false);

  const { isEditing, saveField } = useEditor();
  const { websiteData, loading: websiteLoading } = useWebsite();
  const { showToast } = useToast();

  // --- Data Loading ---
  useEffect(() => {
    if (!websiteLoading && websiteData?.content?.gallery) {
      const galContent = websiteData.content.gallery as any;
      if (galContent.config) setConfig(galContent.config as GallerySectionConfig);
      if (galContent.categories) setCategories(galContent.categories as GalleryCategory[]);
      if (galContent.images) setImages(galContent.images as GalleryImage[]);
      setLoading(false);
    } else if (!websiteLoading) {
      const now = new Date().toISOString();
      const defaultConfig: GallerySectionConfig = {
        id: '1', website_id: '',
        heading: 'Gallery',
        subheading: 'A glimpse of our work and events',
        layout: 'grid', columns: 3,
        show_captions: true, show_carousel: true,
        carousel_autoplay: true, carousel_interval: 4000,
        created_at: now, updated_at: now,
      };
      const defaultCategories: GalleryCategory[] = [
        { id: 'gal-cat1', website_id: '', name: 'Events', display_order: 1, is_visible: true, created_at: now, updated_at: now },
        { id: 'gal-cat2', website_id: '', name: 'Food', display_order: 2, is_visible: true, created_at: now, updated_at: now },
        { id: 'gal-cat3', website_id: '', name: 'Setup', display_order: 3, is_visible: true, created_at: now, updated_at: now },
      ];
      const defaultImages: GalleryImage[] = [
        { id: 'gal1', website_id: '', src: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80', alt: 'Wedding reception', caption: 'Elegant wedding reception', category_id: 'gal-cat1', is_featured: true, display_order: 1, created_at: now, updated_at: now },
        { id: 'gal2', website_id: '', src: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=800&q=80', alt: 'Gourmet spread', caption: 'Buffet arrangement', category_id: 'gal-cat2', is_featured: true, display_order: 2, created_at: now, updated_at: now },
        { id: 'gal3', website_id: '', src: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80', alt: 'Decorations', caption: 'Themed party decorations', category_id: 'gal-cat3', is_featured: false, display_order: 3, created_at: now, updated_at: now },
        { id: 'gal4', website_id: '', src: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80', alt: 'Plated dish', caption: 'Signature plated dish', category_id: 'gal-cat2', is_featured: true, display_order: 4, created_at: now, updated_at: now },
        { id: 'gal5', website_id: '', src: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&q=80', alt: 'Birthday party', caption: 'Birthday party setup', category_id: 'gal-cat1', is_featured: false, display_order: 5, created_at: now, updated_at: now },
        { id: 'gal6', website_id: '', src: 'https://images.unsplash.com/photo-1478146059778-26028b07395a?w=800&q=80', alt: 'Table arrangement', caption: 'Elegant table arrangement', category_id: 'gal-cat3', is_featured: false, display_order: 6, created_at: now, updated_at: now },
      ];

      setConfig(defaultConfig);
      setCategories(defaultCategories);
      setImages(defaultImages);
      setLoading(false);

      // Auto-save defaults to database
      if (isEditing && !defaultsSavedRef.current) {
        defaultsSavedRef.current = true;
        (async () => {
          try {
            await saveField('gallery', 'config', defaultConfig);
            await saveField('gallery', 'categories', defaultCategories);
            await saveField('gallery', 'images', defaultImages);
            console.log('✅ Auto-saved default gallery content to database');
          } catch (err) {
            console.error('Failed to auto-save default gallery:', err);
          }
        })();
      }
    }
  }, [websiteData, websiteLoading, isEditing, saveField]);

  // --- Carousel ---
  const featuredImages = images.filter(img => img.is_featured);

  const startCarouselTimer = useCallback(() => {
    if (carouselTimerRef.current) clearInterval(carouselTimerRef.current);
    if (config?.carousel_autoplay && featuredImages.length > 1) {
      carouselTimerRef.current = setInterval(() => {
        setCarouselIndex(prev => (prev + 1) % featuredImages.length);
      }, config.carousel_interval || 4000);
    }
  }, [config?.carousel_autoplay, config?.carousel_interval, featuredImages.length]);

  useEffect(() => {
    startCarouselTimer();
    return () => { if (carouselTimerRef.current) clearInterval(carouselTimerRef.current); };
  }, [startCarouselTimer]);

  // Reset carousel index if featured images change
  useEffect(() => {
    if (carouselIndex >= featuredImages.length && featuredImages.length > 0) {
      setCarouselIndex(0);
    }
  }, [featuredImages.length, carouselIndex]);

  const goCarousel = (dir: number) => {
    setCarouselIndex(prev => {
      const next = prev + dir;
      if (next < 0) return featuredImages.length - 1;
      if (next >= featuredImages.length) return 0;
      return next;
    });
    startCarouselTimer();
  };

  // --- Filter ---
  const filteredImages = activeCategory === 'all'
    ? images
    : images.filter(img => img.category_id === activeCategory);

  // --- Helpers ---
  const saveImages = async (updated: GalleryImage[]) => {
    await saveField('gallery', 'images', updated);
    setImages(updated);
  };

  const handleDeleteImage = (img: GalleryImage) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Image',
      message: `Delete "${img.caption || img.alt || 'this image'}"?`,
      onConfirm: async () => {
        try {
          await saveImages(images.filter(i => i.id !== img.id));
          if (lightboxImage?.id === img.id) setLightboxImage(null);
          setConfirmModal(null);
        } catch {
          setConfirmModal(null);
          showToast('Failed to delete image.', 'error');
        }
      },
    });
  };

  const handleAddImage = async () => {
    if (categories.length === 0) {
      showToast('Please create a category first.', 'warning');
      return;
    }
    const now = new Date().toISOString();
    const maxOrder = images.length > 0 ? Math.max(...images.map(i => i.display_order || 0)) : 0;
    const newImg: GalleryImage = {
      id: generateId(),
      website_id: '',
      src: '',
      alt: 'New image',
      caption: '',
      category_id: categories[0].id,
      is_featured: false,
      display_order: maxOrder + 1,
      created_at: now,
      updated_at: now,
    };
    await saveImages([...images, newImg]);
  };

  const toggleFeatured = async (imgId: string) => {
    const updated = images.map(i =>
      i.id === imgId ? { ...i, is_featured: !i.is_featured } : i
    );
    await saveImages(updated);
  };

  // --- Lightbox navigation ---
  const lightboxList = filteredImages;
  const lightboxIdx = lightboxImage ? lightboxList.findIndex(i => i.id === lightboxImage.id) : -1;

  const goLightbox = (dir: number) => {
    if (lightboxIdx < 0) return;
    let next = lightboxIdx + dir;
    if (next < 0) next = lightboxList.length - 1;
    if (next >= lightboxList.length) next = 0;
    setLightboxImage(lightboxList[next]);
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxImage) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxImage(null);
      if (e.key === 'ArrowLeft') goLightbox(-1);
      if (e.key === 'ArrowRight') goLightbox(1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxImage, lightboxIdx]);

  // --- Render ---
  if (loading) {
    return (
      <section id="gallery" className="py-20 bg-bakery-cream relative flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bakery-primary mx-auto mb-4" />
          <p className="font-sans text-bakery-text/80">Loading gallery...</p>
        </div>
      </section>
    );
  }

  if (!config) return null;

  const categoryNames = ['all', ...categories.map(c => c.id)];
  const getCategoryName = (id: string) => id === 'all' ? 'All' : categories.find(c => c.id === id)?.name || id;

  return (
    <section id="gallery" className="py-20 bg-gradient-to-b from-bakery-light to-bakery-cream relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="text-center mb-12">
          {isEditing ? (
            <EditableText
              value={config.heading}
              onSave={async (v) => {
                const c = { ...config, heading: v };
                await saveField('gallery', 'config', c);
                setConfig(c);
              }}
              tag="h2"
              className="font-serif text-4xl md:text-5xl font-bold text-bakery-dark mb-4"
            />
          ) : (
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-bakery-dark mb-4">
              {config.heading}
            </h2>
          )}
          <div className="w-24 h-1 bg-bakery-primary mx-auto rounded-full" />
          {config.subheading && (
            isEditing ? (
              <EditableText
                value={config.subheading}
                onSave={async (v) => {
                  const c = { ...config, subheading: v };
                  await saveField('gallery', 'config', c);
                  setConfig(c);
                }}
                tag="p"
                multiline
                className="mt-4 text-bakery-dark/80 font-sans text-lg max-w-2xl mx-auto"
              />
            ) : (
              <p className="mt-4 text-bakery-dark/80 font-sans text-lg max-w-2xl mx-auto">
                {config.subheading}
              </p>
            )
          )}
        </div>

        {/* Featured Carousel */}
        {config.show_carousel && featuredImages.length > 0 && (
          <div className="relative mb-14 rounded-2xl overflow-hidden shadow-xl group">
            <div className="relative h-[350px] md:h-[450px]">
              {featuredImages.map((img, idx) => (
                <div
                  key={img.id}
                  className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${idx === carouselIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                >
                  <img
                    src={img.src || 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80'}
                    alt={img.alt || ''}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  {config.show_captions && img.caption && (
                    <div className="absolute bottom-6 left-6 right-6 z-20">
                      <p className="text-white font-serif text-xl md:text-2xl font-bold drop-shadow-lg">
                        {img.caption}
                      </p>
                    </div>
                  )}
                </div>
              ))}

              {/* Carousel Controls */}
              {featuredImages.length > 1 && (
                <>
                  <button
                    onClick={() => goCarousel(-1)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-white/20 backdrop-blur-sm hover:bg-white/40 text-white p-2.5 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100"
                    aria-label="Previous"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={() => goCarousel(1)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-white/20 backdrop-blur-sm hover:bg-white/40 text-white p-2.5 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100"
                    aria-label="Next"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}

              {/* Dots */}
              {featuredImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2">
                  {featuredImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => { setCarouselIndex(idx); startCarouselTimer(); }}
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${idx === carouselIndex ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/80'}`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              )}

              {/* Click to expand */}
              {featuredImages[carouselIndex] && (
                <button
                  onClick={() => setLightboxImage(featuredImages[carouselIndex])}
                  className="absolute top-4 right-4 z-30 bg-white/20 backdrop-blur-sm hover:bg-white/40 text-white p-2 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100"
                  aria-label="View full size"
                >
                  <Maximize2 size={18} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {categoryNames.map((catId) => {
            const isAll = catId === 'all';
            const catObj = categories.find(c => c.id === catId);
            return (
              <div key={catId} className="relative group/cat">
                {isEditing && !isAll && (
                  <button
                    onClick={() => {
                      setConfirmModal({
                        isOpen: true,
                        title: 'Delete Category',
                        message: `Delete "${getCategoryName(catId)}" category? Images in this category will remain but be uncategorized.`,
                        onConfirm: async () => {
                          try {
                            const nc = categories.filter(c => c.id !== catId);
                            await saveField('gallery', 'categories', nc);
                            setCategories(nc);
                            if (activeCategory === catId) setActiveCategory('all');
                            setConfirmModal(null);
                          } catch {
                            setConfirmModal(null);
                            showToast('Failed to delete category.', 'error');
                          }
                        },
                      });
                    }}
                    className="absolute -top-2 -right-2 z-10 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-lg opacity-0 group-hover/cat:opacity-100"
                  >
                    <X size={12} />
                  </button>
                )}
                <button
                  onClick={() => setActiveCategory(catId)}
                  className={`px-6 py-2 rounded-full font-serif font-bold text-lg capitalize transition-all duration-300 ${activeCategory === catId
                    ? 'bg-bakery-primary text-white shadow-md transform scale-105'
                    : 'bg-bakery-light text-bakery-dark border border-bakery-sand hover:border-bakery-primary hover:text-bakery-primary'
                    }`}
                >
                  {isEditing && !isAll && catObj ? (
                    <EditableText
                      value={catObj.name}
                      onSave={async (v) => {
                        const nc = categories.map(c => c.id === catObj.id ? { ...c, name: v } : c);
                        await saveField('gallery', 'categories', nc);
                        setCategories(nc);
                      }}
                      tag="span"
                    />
                  ) : (
                    getCategoryName(catId)
                  )}
                </button>
              </div>
            );
          })}
          {isEditing && (
            <button
              onClick={async () => {
                const name = prompt('Enter category name:', 'New Category');
                if (!name) return;
                const nc: GalleryCategory = {
                  id: generateId(), website_id: '', name,
                  display_order: categories.length,
                  is_visible: true,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                };
                const updated = [...categories, nc];
                await saveField('gallery', 'categories', updated);
                setCategories(updated);
              }}
              className="px-6 py-2 rounded-full font-serif font-bold text-lg bg-blue-500 text-white border-2 border-blue-600 hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <Plus size={18} /> Add Category
            </button>
          )}
        </div>

        {/* Image Grid */}
        <div className={`grid gap-4 ${config.columns === 2 ? 'grid-cols-1 sm:grid-cols-2' : config.columns === 4 ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
          {filteredImages.map((img) => (
            <div
              key={img.id}
              className="group/img relative rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 bg-bakery-light cursor-pointer"
            >
              {/* Image */}
              <div className="relative aspect-[4/3] overflow-hidden">
                {isEditing ? (
                  <EditableImage
                    src={img.src || ''}
                    alt={img.alt || 'Gallery image'}
                    onSave={async (newUrl) => {
                      const updated = images.map(i =>
                        i.id === img.id ? { ...i, src: newUrl } : i
                      );
                      await saveImages(updated);
                    }}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={img.src || 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80'}
                    alt={img.alt || ''}
                    className="w-full h-full object-cover transform group-hover/img:scale-105 transition-transform duration-500 ease-out"
                    loading="lazy"
                    onClick={() => setLightboxImage(img)}
                  />
                )}

                {/* Hover overlay (non-editing) */}
                {!isEditing && (
                  <div
                    onClick={() => setLightboxImage(img)}
                    className="absolute inset-0 bg-black/0 group-hover/img:bg-black/30 transition-all duration-300 flex items-center justify-center"
                  >
                    <Maximize2
                      size={28}
                      className="text-white opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 drop-shadow-lg"
                    />
                  </div>
                )}

                {/* Featured star (editor) */}
                {isEditing && (
                  <button
                    onClick={() => toggleFeatured(img.id)}
                    className={`absolute top-2 left-2 z-10 p-1.5 rounded-full shadow-lg transition-colors ${img.is_featured ? 'bg-yellow-400 text-white' : 'bg-white/80 text-gray-400 hover:text-yellow-400'}`}
                    title={img.is_featured ? 'Remove from carousel' : 'Add to carousel'}
                  >
                    {img.is_featured ? <Star size={14} /> : <StarOff size={14} />}
                  </button>
                )}

                {/* Category selector (editor) */}
                {isEditing && categories.length > 0 && (
                  <div className="absolute bottom-2 left-2 z-10">
                    <select
                      value={img.category_id}
                      onChange={async (e) => {
                        const updated = images.map(i =>
                          i.id === img.id ? { ...i, category_id: e.target.value } : i
                        );
                        await saveImages(updated);
                      }}
                      className="bg-white/90 backdrop-blur-sm text-bakery-dark text-xs font-bold rounded-lg px-2 py-1 border-none outline-none cursor-pointer shadow-md"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Delete (editor) */}
                {isEditing && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteImage(img); }}
                    className="absolute top-2 right-2 z-10 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg opacity-0 group-hover/img:opacity-100"
                    title="Delete image"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              {/* Caption */}
              {config.show_captions && (
                <div className="p-3">
                  {isEditing ? (
                    <EditableText
                      value={img.caption || ''}
                      onSave={async (v) => {
                        const updated = images.map(i =>
                          i.id === img.id ? { ...i, caption: v } : i
                        );
                        await saveImages(updated);
                      }}
                      tag="p"
                      className="font-sans text-sm text-bakery-text/80 leading-relaxed"
                    />
                  ) : (
                    img.caption && (
                      <p className="font-sans text-sm text-bakery-text/80 leading-relaxed">
                        {img.caption}
                      </p>
                    )
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Add Image Card (editor only) */}
          {isEditing && (
            <button
              onClick={handleAddImage}
              className="aspect-[4/3] rounded-xl border-2 border-dashed border-bakery-sand/60 hover:border-bakery-primary hover:bg-bakery-cream/60 transition-colors flex flex-col items-center justify-center gap-3 text-bakery-text/70 hover:text-bakery-primary"
              title="Add new image"
            >
              <Upload size={32} />
              <span className="text-sm font-medium">Add Image</span>
            </button>
          )}
        </div>

        {/* Empty state */}
        {filteredImages.length === 0 && !isEditing && (
          <div className="text-center py-16">
            <ImageIcon size={48} className="mx-auto mb-4 text-bakery-text/30" />
            <p className="font-sans text-bakery-text/50">No images in this category yet.</p>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-full transition-colors z-10"
            aria-label="Close"
          >
            <X size={24} />
          </button>

          {/* Nav arrows */}
          {lightboxList.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goLightbox(-1); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/25 text-white p-3 rounded-full transition-colors z-10"
                aria-label="Previous image"
              >
                <ChevronLeft size={28} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goLightbox(1); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/25 text-white p-3 rounded-full transition-colors z-10"
                aria-label="Next image"
              >
                <ChevronRight size={28} />
              </button>
            </>
          )}

          {/* Image */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-5xl max-h-[85vh] w-full flex flex-col items-center"
          >
            <img
              src={lightboxImage.src}
              alt={lightboxImage.alt || ''}
              className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg shadow-2xl"
            />
            {config.show_captions && lightboxImage.caption && (
              <p className="mt-4 text-white/90 font-serif text-lg text-center max-w-xl">
                {lightboxImage.caption}
              </p>
            )}
            {/* Counter */}
            {lightboxList.length > 1 && (
              <p className="mt-2 text-white/50 font-sans text-sm">
                {lightboxIdx + 1} / {lightboxList.length}
              </p>
            )}
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={!!confirmModal?.isOpen}
        title={confirmModal?.title}
        message={confirmModal?.message || ''}
        onClose={() => setConfirmModal(null)}
        onConfirm={confirmModal?.onConfirm || (() => { })}
      />
    </section>
  );
};
