import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle, Plus, X } from 'lucide-react';
import { supabase, getWebsiteId } from '../src/lib/supabase';
import type { FAQ as FAQType, FAQConfig } from '../src/types/database.types';
import { EditableText } from '../src/components/editor/EditableText';
import { useEditor } from '../src/contexts/EditorContext';

export const FAQ: React.FC = () => {
  const [config, setConfig] = useState<FAQConfig | null>(null);
  const [faqs, setFaqs] = useState<FAQType[]>([]);
  const [loading, setLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { isEditing, saveField } = useEditor();

  useEffect(() => {
    fetchFAQData();
  }, []);

  const fetchFAQData = async () => {
    try {
      const websiteId = await getWebsiteId();
      if (!websiteId) return;

      // Fetch config
      const { data: configData, error: configError } = await supabase
        .from('faq_config')
        .select('*')
        .eq('website_id', websiteId)
        .single();

      if (configError) throw configError;
      setConfig(configData as FAQConfig);

      // Fetch FAQs
      const { data: faqsData, error: faqsError } = await supabase
        .from('faqs')
        .select('*')
        .eq('website_id', websiteId)
        .order('display_order');

      if (faqsError) throw faqsError;
      setFaqs(faqsData as FAQType[]);
    } catch (error) {
      console.error('Error fetching FAQ data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  if (loading) {
    return (
      <section id="faq" className="py-20 bg-white flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bakery-primary mx-auto mb-4"></div>
          <p className="font-sans text-gray-600">Loading...</p>
        </div>
      </section>
    );
  }

  if (!config || faqs.length === 0) return null;

  return (
    <section id="faq" className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-2 text-bakery-primary">
            <HelpCircle size={24} />
          </div>
          {isEditing ? (
            <EditableText
              value={config.heading}
              onSave={async (newValue) => {
                await saveField('faq_config', 'heading', newValue, config.id);
                setConfig({ ...config, heading: newValue });
              }}
              tag="h2"
              className="font-serif text-3xl md:text-4xl font-bold text-bakery-dark"
            />
          ) : (
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-bakery-dark">
              {config.heading}
            </h2>
          )}
          {config.subheading && (
            isEditing ? (
              <EditableText
                value={config.subheading}
                onSave={async (newValue) => {
                  await saveField('faq_config', 'subheading', newValue, config.id);
                  setConfig({ ...config, subheading: newValue });
                }}
                tag="p"
                multiline
                className="text-gray-600 mt-2"
              />
            ) : (
              <p className="text-gray-600 mt-2">{config.subheading}</p>
            )
          )}
          <div className="w-16 h-1 bg-bakery-sand mx-auto rounded-full mt-4" />
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const handleDeleteFAQ = async () => {
              if (window.confirm('Are you sure you want to delete this FAQ?')) {
                try {
                  const { error } = await supabase
                    .from('faqs')
                    .delete()
                    .eq('id', faq.id);
                  
                  if (error) throw error;
                  
                  // Remove from local state
                  setFaqs(faqs.filter(f => f.id !== faq.id));
                } catch (error) {
                  console.error('Error deleting FAQ:', error);
                  alert('Failed to delete FAQ. Please try again.');
                }
              }
            };

            return (
              <div 
                key={faq.id || index} 
                className="border border-bakery-sand/30 rounded-xl overflow-hidden bg-bakery-cream/20 relative"
              >
                {isEditing && (
                  <button
                    onClick={handleDeleteFAQ}
                    className="absolute top-2 right-2 z-10 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-lg"
                    title="Delete FAQ"
                  >
                    <X size={16} />
                  </button>
                )}
              <button
                onClick={() => !isEditing && toggleFAQ(index)}
                className="w-full flex items-center justify-between p-5 text-left focus:outline-none hover:bg-bakery-cream/50 transition-colors"
              >
                {isEditing ? (
                  <EditableText
                    value={faq.question}
                    onSave={async (newValue) => {
                      await saveField('faqs', 'question', newValue, faq.id);
                      setFaqs(faqs.map(f => f.id === faq.id ? { ...f, question: newValue } : f));
                    }}
                    tag="span"
                    className="font-serif font-bold text-lg text-bakery-dark"
                  />
                ) : (
                  <span className="font-serif font-bold text-lg text-bakery-dark">
                    {faq.question}
                  </span>
                )}
                {!isEditing && (
                  <motion.div
                    animate={{ rotate: openIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-bakery-primary"
                  >
                    <ChevronDown size={20} />
                  </motion.div>
                )}
              </button>

              <AnimatePresence>
                {(openIndex === index || isEditing) && (
                  <motion.div
                    initial={isEditing ? false : { height: 0, opacity: 0 }}
                    animate={isEditing ? {} : { height: "auto", opacity: 1 }}
                    exit={isEditing ? false : { height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className="p-5 pt-0 text-gray-600 font-sans leading-relaxed border-t border-bakery-sand/20">
                      {isEditing ? (
                        <EditableText
                          value={faq.answer}
                          onSave={async (newValue) => {
                            await saveField('faqs', 'answer', newValue, faq.id);
                            setFaqs(faqs.map(f => f.id === faq.id ? { ...f, answer: newValue } : f));
                          }}
                          tag="p"
                          multiline
                          className="text-gray-600 font-sans leading-relaxed"
                        />
                      ) : (
                        faq.answer
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            );
          })}
          {isEditing && (
            <button
              onClick={async () => {
                try {
                  const websiteId = await getWebsiteId();
                  if (!websiteId) {
                    alert('No website ID found. Please refresh the page.');
                    return;
                  }

                  // Get the highest display_order
                  const maxOrder = faqs.length > 0 
                    ? Math.max(...faqs.map(f => f.display_order || 0))
                    : -1;

                  // Insert new FAQ
                  const { data: newFAQ, error } = await supabase
                    .from('faqs')
                    .insert({
                      website_id: websiteId,
                      question: 'New Question',
                      answer: 'New Answer',
                      display_order: maxOrder + 1
                    })
                    .select()
                    .single();

                  if (error) throw error;

                  // Add to local state
                  setFaqs([...faqs, newFAQ as FAQType]);
                } catch (error) {
                  console.error('Error adding FAQ:', error);
                  alert('Failed to add FAQ. Please try again.');
                }
              }}
              className="w-full flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors text-gray-500 hover:text-blue-600 bg-white"
              title="Add new FAQ"
            >
              <Plus size={24} />
              <span className="text-sm font-medium">Add FAQ</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
};