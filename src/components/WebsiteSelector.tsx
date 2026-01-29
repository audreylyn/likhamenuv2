/**
 * Website Selector Component
 * For development: allows selecting website when on localhost
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserWebsites } from '../lib/auth';
import { buildWebsiteUrl } from '../lib/website-detector';
import { Globe, ExternalLink } from 'lucide-react';

export const WebsiteSelector: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [websites, setWebsites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWebsite, setSelectedWebsite] = useState<string>('');

  useEffect(() => {
    // If not authenticated, redirect to login
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }

    // If authenticated, load websites
    if (user) {
      loadWebsites();
    }
  }, [user, authLoading, navigate]);

  const loadWebsites = async () => {
    try {
      const data = await getUserWebsites();
      setWebsites(data);
      
      // Pre-select first website if available
      if (data.length > 0) {
        setSelectedWebsite(data[0].subdomain);
      }
    } catch (error) {
      console.error('Error loading websites:', error);
    } finally {
      setLoading(false);
    }
  };

  const goToWebsite = (mode: 'public' | 'editor') => {
    if (!selectedWebsite) return;
    
    const url = buildWebsiteUrl(selectedWebsite, '', mode);
    window.location.href = url;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (websites.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No Websites Found</h1>
          <p className="text-gray-600 mb-6">You don't have access to any websites yet.</p>
          <a href="/admin" className="inline-block px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition">
            Go to Admin
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-2xl w-full mx-auto p-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <Globe className="w-16 h-16 text-gray-900 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Select Website</h1>
            <p className="text-gray-600">Choose a website to view or edit</p>
          </div>

          {/* Website Selector */}
          <div className="mb-6">
            <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
              Website
            </label>
            <select
              id="website"
              value={selectedWebsite}
              onChange={(e) => setSelectedWebsite(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-900 focus:border-transparent text-lg"
            >
              <option value="">Select a website...</option>
              {websites.map((website) => (
                <option key={website.id} value={website.subdomain}>
                  {website.site_title} ({website.subdomain})
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => goToWebsite('public')}
              disabled={!selectedWebsite}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-gray-900 text-gray-900 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              <ExternalLink size={20} />
              View Site
            </button>
            <button
              onClick={() => goToWebsite('editor')}
              disabled={!selectedWebsite}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              <ExternalLink size={20} />
              Edit Site
            </button>
          </div>

          {/* Info */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 text-center">
              <strong>Development Mode:</strong> Using ?site= parameter for subdomain simulation
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

