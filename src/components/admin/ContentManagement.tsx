/**
 * Content Management Component
 * AI-powered content generation for websites
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { generateWebsiteContent, type AIContentRequest, listAvailableModels } from '../../lib/gemini-ai';
import { populateWebsiteFromAI } from '../../lib/populate-ai-content';
import { useWebsite } from '../../contexts/WebsiteContext';
import { ArrowLeft, Sparkles, Loader, CheckCircle, AlertCircle } from 'lucide-react';

export const ContentManagement: React.FC = () => {
  const { websiteId } = useParams();
  const navigate = useNavigate();
  const { refreshContent } = useWebsite();
  const [website, setWebsite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [aiForm, setAiForm] = useState<AIContentRequest>({
    businessName: '',
    businessType: '',
  });
  const [generationStatus, setGenerationStatus] = useState<{
    status: 'idle' | 'generating' | 'success' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });

  useEffect(() => {
    loadWebsite();
    // Debug: List available models (check console)
    // Uncomment the line below to see which models are available
    // listAvailableModels();
  }, [websiteId]);

  const loadWebsite = async () => {
    try {
      const { data, error } = await supabase
        .from('websites')
        .select('*')
        .eq('id', websiteId)
        .single();

      if (error) throw error;
      setWebsite(data);
      
      // Pre-fill form with website name
      if (data) {
        setAiForm({
          businessName: data.site_title || '',
          businessType: '',
        });
      }
    } catch (error) {
      console.error('Error loading website:', error);
    } finally {
      setLoading(false);
    }
    }

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
      await populateWebsiteFromAI(websiteId!, generatedContent);
      
      setGenerationStatus({ 
        status: 'success', 
        message: 'Content generated and saved successfully! Refreshing content...' 
      });
      
      // Refresh all components to show new content
      refreshContent();
      
      // Reset form
      setAiForm({ businessName: '', businessType: '' });
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

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!website) {
    return (
      <div className="p-8">
        <p className="text-red-600">Website not found</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/admin/websites')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} />
          Back to Websites
        </button>
        <h1 className="text-3xl font-bold text-gray-900">{website.site_title}</h1>
        <p className="text-gray-600 mt-1">AI Content Generation</p>
      </div>

      {/* AI Content Wizard */}
      <div className="max-w-3xl space-y-6">
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl shadow-sm border-2 border-purple-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles size={28} className="text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-900">AI Content Wizard</h2>
          </div>
          
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
  );
};

