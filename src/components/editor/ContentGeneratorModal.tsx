/**
 * Content Generator Modal
 * AI-powered content generation directly from the editor
 */

import React, { useState } from 'react';
import { X, Sparkles, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { generateWebsiteContent, type AIContentRequest } from '../../lib/gemini-ai';
import { populateWebsiteFromAI } from '../../lib/populate-ai-content';
import { useWebsite } from '../../contexts/WebsiteContext';

interface ContentGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  websiteId: string;
  websiteTitle: string;
}

export const ContentGeneratorModal: React.FC<ContentGeneratorModalProps> = ({
  isOpen,
  onClose,
  websiteId,
  websiteTitle,
}) => {
  const { refreshContent } = useWebsite();
  const [generating, setGenerating] = useState(false);
  const [aiForm, setAiForm] = useState<AIContentRequest>({
    businessName: websiteTitle || '',
    businessType: '',
  });
  const [generationStatus, setGenerationStatus] = useState<{
    status: 'idle' | 'generating' | 'success' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!aiForm.businessName || !aiForm.businessType) {
      alert('Please fill in both business name and type');
      return;
    }

    setGenerating(true);
    setGenerationStatus({ status: 'generating', message: 'Generating content with AI...' });

    try {
      // Generate content using Gemini
      const generatedContent = await generateWebsiteContent(aiForm);
      
      setGenerationStatus({ status: 'generating', message: 'Saving content to database...' });
      
      // Populate website with generated content
      await populateWebsiteFromAI(websiteId, generatedContent);
      
      console.log('✅ Content saved to database, refreshing UI...');
      
      setGenerationStatus({ 
        status: 'success', 
        message: 'Content generated and saved successfully! Refreshing...' 
      });
      
      // Wait a moment for database to commit
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Refresh all components to show new content immediately
      refreshContent();
      
      // Close modal after showing success message
      setTimeout(() => {
        onClose();
        setGenerationStatus({ status: 'idle', message: '' });
        setAiForm({ businessName: websiteTitle || '', businessType: '' });
      }, 1500);
      
      // Force a page reload after modal closes to ensure all components refetch fresh data
      setTimeout(() => {
        console.log('🔄 Reloading page to show new content...');
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      console.error('Error generating content:', error);
      setGenerationStatus({ 
        status: 'error', 
        message: error.message || 'Failed to generate content. Please try again.' 
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleClose = () => {
    if (!generating) {
      onClose();
      setGenerationStatus({ status: 'idle', message: '' });
      setAiForm({ businessName: websiteTitle || '', businessType: '' });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <Sparkles size={24} className="text-purple-600" />
            <h2 className="text-xl font-bold text-gray-900">AI Content Generator</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={generating}
            className="p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border-2 border-purple-200 p-6">
            <p className="text-gray-700 mb-6">
              Enter your business name and type, and we will generate the full website content including 
              products, benefits, and testimonials for you using Google's Gemini AI.
            </p>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={aiForm.businessName}
                    onChange={(e) => setAiForm({ ...aiForm, businessName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="The Golden Crumb"
                    required
                    disabled={generating}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Type
                  </label>
                  <input
                    type="text"
                    value={aiForm.businessType}
                    onChange={(e) => setAiForm({ ...aiForm, businessType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Bakery, Restaurant, Cafe, etc."
                    required
                    disabled={generating}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={generating}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <>
                    <Loader size={20} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Generate Content
                  </>
                )}
              </button>
            </form>

            {/* Status Message */}
            {generationStatus.status !== 'idle' && (
              <div className={`mt-4 p-4 rounded-lg flex items-start gap-3 ${
                generationStatus.status === 'success' 
                  ? 'bg-green-50 border border-green-200' 
                  : generationStatus.status === 'error'
                  ? 'bg-red-50 border border-red-200'
                  : 'bg-blue-50 border border-blue-200'
              }`}>
                {generationStatus.status === 'success' ? (
                  <CheckCircle size={20} className="text-green-600 mt-0.5" />
                ) : generationStatus.status === 'error' ? (
                  <AlertCircle size={20} className="text-red-600 mt-0.5" />
                ) : (
                  <Loader size={20} className="text-blue-600 mt-0.5 animate-spin" />
                )}
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    generationStatus.status === 'success' 
                      ? 'text-green-800' 
                      : generationStatus.status === 'error'
                      ? 'text-red-800'
                      : 'text-blue-800'
                  }`}>
                    {generationStatus.message}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">What gets generated?</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-600 mt-0.5" />
                <span>Hero section with compelling headline and call-to-action</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-600 mt-0.5" />
                <span>About section with business description</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-600 mt-0.5" />
                <span>Why Choose Us section with key benefits</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-600 mt-0.5" />
                <span>Menu with categories and items</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-600 mt-0.5" />
                <span>Customer testimonials</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

