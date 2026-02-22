import React, { useState, useEffect, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Upload,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";
import type { HeroContent, HeroSlide } from "../src/types/database.types";
import { EditableText } from "../src/components/editor/EditableText";
import { useEditor } from "../src/contexts/EditorContext";
import { useWebsite } from "../src/contexts/WebsiteContext";
import { supabase } from "../src/lib/supabase";
import { ConfirmationModal } from "../src/components/ConfirmationModal";
import { useToast } from "../src/components/Toast";

// Default hero content
const DEFAULT_HERO: HeroContent = {
  id: "1",
  website_id: "",
  slides: [
    {
      id: 1,
      image:
        "https://images.unsplash.com/photo-1509042239860-f550ce710b93?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
      title: "Welcome to The Golden Crumb",
      subtitle: "Freshly Baked Goodness",
      order: 0,
    },
  ],
  button_text: "Order Now",
  button_link: "#menu",
  show_button: true,
  autoplay: true,
  autoplay_interval: 5000,
  show_navigation: true,
  show_indicators: true,
  parallax_enabled: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const Hero: React.FC = () => {
  const [content, setContent] = useState<HeroContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const { isEditing, saveField } = useEditor();
  const { websiteData, loading: websiteLoading, contentVersion } = useWebsite();
  const { showToast } = useToast();
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>(null);

  const planId = websiteData?.marketing?.plan_id || 'basic';

  // Sync content from websiteData whenever it changes
  useEffect(() => {
    if (!websiteLoading) {
      setLoading(false);
      // Always update from websiteData when contentVersion changes
      if (websiteData?.content?.hero) {
        console.log('[Hero] Updating content from websiteData, version:', contentVersion, 'hero:', websiteData.content.hero);
        // Create a deep copy to ensure React detects changes
        setContent(JSON.parse(JSON.stringify(websiteData.content.hero)) as HeroContent);
      } else {
        console.log('[Hero] No hero content, using default');
        setContent(DEFAULT_HERO);
      }
    }
  }, [websiteData, websiteLoading, contentVersion]);

  const slides = (content?.slides as HeroSlide[]) || [];

  // Ensure current index is within bounds when slides change
  useEffect(() => {
    if (slides.length > 0 && current >= slides.length) {
      setCurrent(slides.length - 1);
    }
  }, [slides.length, current]);

  // Get the current slide with defensive check
  const currentSlide = slides[current] || slides[0];

  useEffect(() => {
    // Disable autoplay when editing
    if (isEditing || slides.length === 0 || !content?.autoplay) return;

    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, content.autoplay_interval || 5000);
    return () => clearInterval(timer);
  }, [slides.length, content?.autoplay, content?.autoplay_interval, isEditing]);

  const nextSlide = () => setCurrent((prev) => (prev + 1) % slides.length);
  const prevSlide = () =>
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const fileName = `hero-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

      const { data, error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('images').getPublicUrl(data.path);

      const updatedSlides = [...slides];
      updatedSlides[current] = { ...updatedSlides[current], image: urlData.publicUrl };
      await saveField("hero", "slides", updatedSlides);
      setContent({ ...content!, slides: updatedSlides });
    } catch (error: any) {
      console.error("Error uploading image:", error);
      showToast("Failed to upload image: " + (error.message || 'Unknown error'), 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleImageUrlChange = async () => {
    const slide = slides[current];
    if (!slide) return;
    
    const newImageUrl = prompt("Enter new image URL:", slide.image);
    if (newImageUrl && newImageUrl !== slide.image) {
      try {
        const updatedSlides = [...slides];
        updatedSlides[current] = { ...updatedSlides[current], image: newImageUrl };
        await saveField("hero", "slides", updatedSlides);
        setContent({ ...content!, slides: updatedSlides });
      } catch (error) {
        console.error("Error saving image:", error);
        showToast("Failed to save image. Please try again.", "error");
      }
    }
  };

  const handleAddSlide = async () => {
    if (!content) return;

    if (planId === 'basic' && slides.length >= 1) {
      showToast("Basic plan is limited to 1 slide. Upgrade to add more.", "warning");
      return;
    }

    try {
      // Generate a new ID (use max existing ID + 1, or Date.now() if no slides)
      const maxId =
        slides.length > 0 ? Math.max(...slides.map((s) => s.id || 0)) : 0;
      const newId = maxId + 1;

      // Get max order value
      const maxOrder =
        slides.length > 0 ? Math.max(...slides.map((s) => s.order || 0)) : -1;

      const newSlide: HeroSlide = {
        id: newId,
        image:
          "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1920",
        title: "New Slide Title",
        subtitle: "New slide subtitle",
        order: maxOrder + 1,
      };

      const updatedSlides = [...slides, newSlide];
      await saveField("hero", "slides", updatedSlides);
      setContent({ ...content!, slides: updatedSlides });

      // Switch to the new slide
      setCurrent(updatedSlides.length - 1);
    } catch (error) {
      console.error("Error adding slide:", error);
      showToast("Failed to add slide. Please try again.", "error");
    }
  };

  const handleDeleteSlide = async () => {
    if (!content || slides.length <= 1) {
      showToast("Cannot delete the last slide. You must have at least one slide.", "warning");
      return;
    }

    const slideToDelete = slides[current];
    if (!slideToDelete) return;

    setConfirmModal({
      isOpen: true,
      title: "Delete Slide",
      message: `Are you sure you want to delete this slide? "${slideToDelete.title}"`,
      onConfirm: async () => {
        try {
          const updatedSlides = slides.filter((_, idx) => idx !== current);

          // Reorder slides to maintain sequential order
          const reorderedSlides = updatedSlides.map((slide, idx) => ({
            ...slide,
            order: idx,
          }));

          await saveField("hero", "slides", reorderedSlides);
          setContent({ ...content!, slides: reorderedSlides });

          // Adjust current index if needed
          if (current >= updatedSlides.length) {
            setCurrent(updatedSlides.length - 1);
          }
          setConfirmModal(null);
        } catch (error) {
          setConfirmModal(null);
          console.error("Error deleting slide:", error);
          showToast("Failed to delete slide. Please try again.", "error");
        }
      }
    });
  };

  if (loading) {
    return (
      <section
        id="hero"
        className="relative h-[90vh] overflow-hidden bg-bakery-dark flex items-center justify-center"
      >
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="font-sans">Loading...</p>
        </div>
      </section>
    );
  }

  if (!content || slides.length === 0) {
    return (
      <section
        id="hero"
        className="relative h-[90vh] overflow-hidden bg-bakery-dark flex items-center justify-center"
      >
        <div className="text-white text-center">
          <p className="font-serif text-2xl">No content available</p>
        </div>
      </section>
    );
  }

  return (
    <section
      id="hero"
      className="relative h-[90vh] overflow-hidden bg-bakery-dark"
    >
      {/* Background - Parallax removed to fix hydration error */}
      <div className="absolute -top-[15%] left-0 w-full h-[130%] z-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 w-full h-full"
          >
            {/* Background Image with Overlay */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${currentSlide?.image || ''})` }}
            />
            <div className="absolute inset-0 bg-black/40" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Editor Controls - Outside background div for proper z-index */}
      {isEditing && (
        <div className="absolute bottom-24 left-4 flex flex-col gap-2 z-30">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />

          {/* Image Upload/URL Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="bg-white/95 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-2 shadow-lg hover:bg-white transition-colors border-2 border-blue-500 disabled:opacity-50"
              title="Upload background image"
            >
              {isUploading ? (
                <Loader2 size={20} className="text-gray-700 animate-spin" />
              ) : (
                <Upload size={20} className="text-gray-700" />
              )}
              <span className="text-gray-700 font-medium text-sm">
                {isUploading ? 'Uploading...' : 'Upload Image'}
              </span>
            </button>
            <button
              onClick={handleImageUrlChange}
              disabled={isUploading}
              className="bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg hover:bg-white transition-colors border-2 border-gray-300 disabled:opacity-50"
              title="Enter image URL"
            >
              <span className="text-gray-700 font-medium text-sm">URL</span>
            </button>
          </div>

          {/* Add/Delete Slide Buttons */}
          <div className="flex gap-2">
            {planId !== 'basic' && (
              <>
                <button
                  onClick={handleAddSlide}
                  className="bg-white/95 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-2 shadow-lg hover:bg-white transition-colors border-2 border-green-500"
                  title="Add a new slide"
                >
                  <Plus size={20} className="text-gray-700" />
                  <span className="text-gray-700 font-medium text-sm">
                    Add Slide
                  </span>
                </button>

                <button
                  onClick={handleDeleteSlide}
                  disabled={slides.length <= 1}
                  className="bg-white/95 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-2 shadow-lg hover:bg-white transition-colors border-2 border-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={
                    slides.length <= 1
                      ? "Cannot delete the last slide"
                      : "Delete current slide"
                  }
                >
                  <Trash2 size={20} className="text-gray-700" />
                  <span className="text-gray-700 font-medium text-sm">
                    Delete Slide
                  </span>
                </button>
              </>
            )}
            {planId === 'basic' && (
              <div className="bg-white/95 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg border-2 border-gray-300">
                <span className="text-gray-500 text-xs font-medium">
                  Upgrade for multiple slides
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="absolute inset-0 flex items-center justify-center text-center px-4 z-10 pointer-events-none">
        <div className="max-w-4xl mx-auto pointer-events-auto">
          <AnimatePresence mode={isEditing ? undefined : "wait"}>
            <motion.div
              key={isEditing ? "editing" : current}
              initial={isEditing ? undefined : { y: 20, opacity: 0 }}
              animate={isEditing ? {} : { y: 0, opacity: 1 }}
              exit={isEditing ? undefined : { y: -20, opacity: 0 }}
              transition={isEditing ? {} : { duration: 0.5, delay: 0.2 }}
            >
              {isEditing && currentSlide ? (
                <EditableText
                  value={currentSlide.title}
                  onSave={async (newValue) => {
                    const updatedSlides = [...slides];
                    updatedSlides[current] = {
                      ...updatedSlides[current],
                      title: newValue,
                    };
                    await saveField(
                      "hero",
                      "slides",
                      updatedSlides,
                      content.id,
                    );
                    setContent({ ...content, slides: updatedSlides as any });
                  }}
                  tag="h1"
                  className="font-serif text-5xl md:text-7xl font-bold text-white mb-6 drop-shadow-md"
                />
              ) : (
                <h1 className="font-serif text-5xl md:text-7xl font-bold text-white mb-6 drop-shadow-md">
                  {currentSlide?.title || ''}
                </h1>
              )}
              {isEditing && currentSlide ? (
                <EditableText
                  value={currentSlide.subtitle}
                  onSave={async (newValue) => {
                    const updatedSlides = [...slides];
                    updatedSlides[current] = {
                      ...updatedSlides[current],
                      subtitle: newValue,
                    };
                    await saveField(
                      "hero",
                      "slides",
                      updatedSlides,
                      content.id,
                    );
                    setContent({ ...content, slides: updatedSlides as any });
                  }}
                  tag="p"
                  multiline
                  className="font-sans text-xl md:text-2xl text-white mb-8 font-light tracking-wide drop-shadow-sm"
                />
              ) : (
                <p className="font-sans text-xl md:text-2xl text-bakery-cream mb-8 font-light tracking-wide drop-shadow-sm">
                  {currentSlide?.subtitle || ''}
                </p>
              )}
              {content.show_button && (
                <motion.a
                  href={content.button_link}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-block bg-bakery-primary hover:bg-bakery-accent text-white font-serif py-3 px-8 rounded-full text-lg shadow-lg transition-colors"
                >
                  {isEditing ? (
                    <EditableText
                      value={content.button_text}
                      onSave={async (newValue) => {
                        await saveField(
                          "hero",
                          "button_text",
                          newValue,
                          content.id,
                        );
                        setContent({ ...content, button_text: newValue });
                      }}
                      tag="span"
                      className="font-serif"
                    />
                  ) : (
                    content.button_text
                  )}
                </motion.a>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Controls */}
      {content.show_navigation && slides.length > 1 && (
        <div className="z-20 absolute inset-0 pointer-events-none">
          <button
            onClick={prevSlide}
            className="absolute left-4 top-[60%] -translate-y-1/2 bg-white/20 hover:bg-white/40 p-3 rounded-full text-white backdrop-blur-sm transition-all pointer-events-auto"
            aria-label="Previous slide"
          >
            <ChevronLeft size={32} />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-[60%] -translate-y-1/2 bg-white/20 hover:bg-white/40 p-3 rounded-full text-white backdrop-blur-sm transition-all pointer-events-auto"
            aria-label="Next slide"
          >
            <ChevronRight size={32} />
          </button>
        </div>
      )}

      {/* Indicators */}
      {content.show_indicators && slides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-3 z-20">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={`w-3 h-3 rounded-full transition-all ${idx === current ? "bg-white w-8" : "bg-white/50"
                }`}
            />
          ))}
        </div>
      )}

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
