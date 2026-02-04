import React, { useState, useEffect } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight, X, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Testimonial, TestimonialsConfig } from '../src/types/database.types';
import { EditableText } from '../src/components/editor/EditableText';
import { EditableImage } from '../src/components/editor/EditableImage';
import { useEditor } from '../src/contexts/EditorContext';
import { useWebsite } from '../src/contexts/WebsiteContext';

export const Testimonials: React.FC = () => {
  const [config, setConfig] = useState<TestimonialsConfig | null>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [visibleCards, setVisibleCards] = useState(3);
  const { isEditing, saveField } = useEditor();
  const { websiteData, loading: websiteLoading } = useWebsite();

  useEffect(() => {
    if (!websiteLoading && websiteData?.content?.testimonials) {
      const testimonialsContent = websiteData.content.testimonials;
      if (testimonialsContent.config) {
        setConfig(testimonialsContent.config as TestimonialsConfig);
      }
      if (testimonialsContent.items) {
        setTestimonials(testimonialsContent.items as Testimonial[]);
      }
      setLoading(false);
    } else if (!websiteLoading) {
      setLoading(false);
    }
  }, [websiteData, websiteLoading]);

  // Handle responsive visible cards
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setVisibleCards(1);
      } else if (window.innerWidth < 1024) {
        setVisibleCards(2);
      } else {
        setVisibleCards(3);
      }
    };

    handleResize(); // Init
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Disable carousel navigation when editing
  useEffect(() => {
    if (isEditing) {
      setIndex(0); // Reset to first when editing
    }
  }, [isEditing]);

  const maxIndex = Math.max(0, testimonials.length - visibleCards);
  const shouldShowSwiper = testimonials.length > visibleCards;

  const nextSlide = () => {
    setIndex((prev) => Math.min(prev + 1, maxIndex));
  };

  const prevSlide = () => {
    setIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleDeleteTestimonial = async (testimonialId: string) => {
    if (window.confirm('Are you sure you want to delete this testimonial?')) {
      try {
        const newTestimonials = testimonials.filter(t => t.id !== testimonialId);
        await saveField('testimonials', 'items', newTestimonials);
        setTestimonials(newTestimonials);
      } catch (error) {
        console.error('Error deleting testimonial:', error);
        alert('Failed to delete testimonial. Please try again.');
      }
    }
  };

  const handleAddTestimonial = async () => {
    try {
      // Get the highest display_order
      const maxOrder = testimonials.length > 0
        ? Math.max(...testimonials.map(t => t.display_order || 0))
        : -1;

      const newTestimonial: Testimonial = {
        id: crypto.randomUUID(),
        website_id: '',
        customer_name: 'New Customer',
        customer_role: 'Customer',
        testimonial_text: 'Great service and amazing products!',
        rating: 5,
        is_featured: false,
        display_order: maxOrder + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const newTestimonials = [...testimonials, newTestimonial];
      await saveField('testimonials', 'items', newTestimonials);
      setTestimonials(newTestimonials);
    } catch (error) {
      console.error('Error adding testimonial:', error);
      alert('Failed to add testimonial. Please try again.');
    }
  };

  if (loading) {
    return (
      <section id="testimonials" className="py-24 bg-bakery-dark text-bakery-beige relative overflow-hidden flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="font-sans text-white">Loading...</p>
        </div>
      </section>
    );
  }

  if (!config) return null;

  return (
    <section id="testimonials" className="py-24 bg-bakery-dark text-bakery-beige relative overflow-hidden">
      {/* Decorative subtle overlay */}
      <div className="absolute inset-0 bg-black/10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          {isEditing ? (
            <EditableText
              value={config.heading}
              onSave={async (newValue) => {
                const newConfig = { ...config, heading: newValue };
                await saveField('testimonials', 'config', newConfig);
                setConfig(newConfig);
              }}
              tag="h2"
              className="font-serif text-4xl md:text-5xl font-bold text-white mb-4"
            />
          ) : (
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-white mb-4">
              {config.heading}
            </h2>
          )}
          <div className="w-24 h-1 bg-bakery-accent mx-auto rounded-full mb-6" />
          {config.subheading && (
            isEditing ? (
              <EditableText
                value={config.subheading}
                onSave={async (newValue) => {
                  const newConfig = { ...config, subheading: newValue };
                  await saveField('testimonials', 'config', newConfig);
                  setConfig(newConfig);
                }}
                tag="p"
                multiline
                className="text-bakery-sand/80 font-sans text-lg max-w-2xl mx-auto"
              />
            ) : (
              <p className="text-bakery-sand/80 font-sans text-lg max-w-2xl mx-auto">
                {config.subheading}
              </p>
            )
          )}
        </div>

        {/* Carousel Container */}
        <div className="relative group">
          <div className={shouldShowSwiper ? "overflow-hidden" : ""}>
            <motion.div
              className="flex"
              initial={false}
              animate={shouldShowSwiper ? { x: `-${index * (100 / visibleCards)}%` } : { x: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial.id}
                  className="flex-shrink-0 px-4"
                  style={{ width: shouldShowSwiper ? `${100 / visibleCards}%` : `${100 / Math.min(testimonials.length, 3)}%` }}
                >
                  <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 relative hover:bg-white/10 transition-colors duration-300 h-full flex flex-col">
                    {isEditing && (
                      <button
                        onClick={() => handleDeleteTestimonial(testimonial.id)}
                        className="absolute top-4 right-4 z-10 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg"
                        title="Delete testimonial"
                      >
                        <X size={14} />
                      </button>
                    )}
                    <Quote className="absolute top-6 right-6 text-bakery-accent opacity-60" size={48} />

                    {config.show_ratings && testimonial.rating && (
                      <div className="flex gap-1 mb-6 text-bakery-accent">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} size={18} fill="currentColor" />
                        ))}
                      </div>
                    )}

                    {isEditing ? (
                      <EditableText
                        value={testimonial.testimonial_text}
                        onSave={async (newValue) => {
                          const newTestimonials = testimonials.map(t => t.id === testimonial.id ? { ...t, testimonial_text: newValue } : t);
                          await saveField('testimonials', 'items', newTestimonials);
                          setTestimonials(newTestimonials);
                        }}
                        tag="p"
                        multiline
                        className="font-serif text-lg italic text-white/90 mb-8 leading-relaxed flex-grow"
                      />
                    ) : (
                      <p className="font-serif text-lg italic text-white/90 mb-8 leading-relaxed flex-grow">
                        "{testimonial.testimonial_text}"
                      </p>
                    )}

                    <div className="flex items-center gap-4 mt-auto">
                      <div className="relative flex-shrink-0">
                        <EditableImage
                          src={testimonial.customer_image_url || `https://i.pravatar.cc/150?u=${testimonial.id}`}
                          alt={testimonial.customer_name}
                          onSave={async (newUrl) => {
                            const newTestimonials = testimonials.map(t =>
                              t.id === testimonial.id ? { ...t, customer_image_url: newUrl } : t
                            );
                            await saveField('testimonials', 'items', newTestimonials);
                            setTestimonials(newTestimonials);
                          }}
                          className="w-14 h-14 rounded-full object-cover border-2 border-bakery-primary"
                          containerClassName="w-14 h-14"
                          aspectRatio="square"
                        />
                      </div>
                      <div className="flex flex-col min-w-0">
                        {isEditing ? (
                          <EditableText
                            value={testimonial.customer_name}
                            onSave={async (newValue) => {
                              const newTestimonials = testimonials.map(t => t.id === testimonial.id ? { ...t, customer_name: newValue } : t);
                              await saveField('testimonials', 'items', newTestimonials);
                              setTestimonials(newTestimonials);
                            }}
                            tag="h4"
                            className="font-bold font-sans text-white text-base"
                          />
                        ) : (
                          <h4 className="font-bold font-sans text-white text-base">{testimonial.customer_name}</h4>
                        )}
                        {testimonial.customer_role && (
                          isEditing ? (
                            <EditableText
                              value={testimonial.customer_role}
                              onSave={async (newValue) => {
                                const newTestimonials = testimonials.map(t => t.id === testimonial.id ? { ...t, customer_role: newValue } : t);
                                await saveField('testimonials', 'items', newTestimonials);
                                setTestimonials(newTestimonials);
                              }}
                              tag="p"
                              className="text-sm text-bakery-sand"
                            />
                          ) : (
                            <p className="text-sm text-bakery-sand">{testimonial.customer_role}</p>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Controls - Only show if more than 3 testimonials */}
          {!isEditing && shouldShowSwiper && (
            <>
              <button
                onClick={prevSlide}
                disabled={index === 0}
                className={`absolute left-0 top-[60%] -translate-y-1/2 -translate-x-4 md:-translate-x-12 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-md transition-all disabled:opacity-30 disabled:cursor-not-allowed z-20 ${index === 0 ? 'hidden' : 'block'}`}
                aria-label="Previous testimonials"
              >
                <ChevronLeft size={24} />
              </button>

              <button
                onClick={nextSlide}
                disabled={index === maxIndex}
                className={`absolute right-0 top-[60%] -translate-y-1/2 translate-x-4 md:translate-x-12 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-md transition-all disabled:opacity-30 disabled:cursor-not-allowed z-20 ${index === maxIndex ? 'hidden' : 'block'}`}
                aria-label="Next testimonials"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}
        </div>

        {/* Indicators - Only show if more than 3 testimonials */}
        {shouldShowSwiper && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setIndex(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${index === idx ? 'w-8 bg-bakery-accent' : 'w-2 bg-white/30 hover:bg-white/50'
                  }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}

        {/* Add Testimonial Button */}
        {isEditing && (
          <div className="flex justify-center mt-8">
            <button
              onClick={handleAddTestimonial}
              className="px-6 py-3 bg-blue-500 text-white rounded-full font-serif font-bold text-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
              title="Add new testimonial"
            >
              <Plus size={20} />
              Add Testimonial
            </button>
          </div>
        )}
      </div>
    </section>
  );
};