/**
 * Section Manager
 * Enable/disable sections for a website
 */

import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { getWebsiteId } from '../../lib/supabase';
import { getUserWebsites } from '../../lib/auth';
import { Save, RefreshCw, Globe, AlertCircle } from 'lucide-react';
import { clearSectionCache } from '../../lib/section-visibility';

interface Section {
  id: string;
  section_name: string;
  is_enabled: boolean;
  display_order: number;
}

const SECTION_DEFINITIONS = [
  { name: 'hero', label: 'Hero Section', description: 'Main banner/carousel at the top' },
  { name: 'about', label: 'About Section', description: 'About your business' },
  { name: 'whyChooseUs', label: 'Why Choose Us', description: 'Key features/benefits' },
  { name: 'team', label: 'Team Section', description: 'Team members' },
  { name: 'featuredProducts', label: 'Featured Products', description: 'Highlighted products' },
  { name: 'menu', label: 'Menu Section', description: 'Product menu' },
  { name: 'reservation', label: 'Reservation', description: 'Booking form' },
  { name: 'testimonials', label: 'Testimonials', description: 'Customer reviews' },
  { name: 'specialOffers', label: 'Special Offers', description: 'Promotions/deals' },
  { name: 'faq', label: 'FAQ Section', description: 'Frequently asked questions' },
  { name: 'contact', label: 'Contact Section', description: 'Contact information' },
  { name: 'instagramFeed', label: 'Instagram Feed', description: 'Social media feed' },
];

interface Website {
  id: string;
  site_title: string;
  subdomain: string;
}

export const SectionManager: React.FC = () => {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<string>('');
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWebsites();
  }, []);

  useEffect(() => {
    if (selectedWebsiteId) {
      loadSections(selectedWebsiteId);
    }
  }, [selectedWebsiteId]);

  const loadWebsites = async () => {
    try {
      setLoading(true);
      
      // For admins, fetch all websites (including inactive ones)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No user found');
        setLoading(false);
        return;
      }

      // Check if user is admin
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      let websitesList: Website[] = [];

      if (userProfile?.role === 'admin') {
        // Admins get ALL websites (including inactive)
        const { data, error } = await supabase
          .from('websites')
          .select('id, site_title, subdomain, is_active')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching websites:', error);
          throw error;
        }
        websitesList = data || [];
      } else {
        // Use the existing getUserWebsites for editors
        websitesList = await getUserWebsites();
      }

      console.log('Loaded websites:', websitesList);
      setWebsites(websitesList);
      setError(null);
      
      if (websitesList.length === 0) {
        setError('No websites found. Please create a website first.');
      }
      
      // If no website selected, try to get current website or select first one
      if (websitesList.length > 0 && !selectedWebsiteId) {
        const currentWebsiteId = await getWebsiteId();
        if (currentWebsiteId && websitesList.find(w => w.id === currentWebsiteId)) {
          setSelectedWebsiteId(currentWebsiteId);
        } else {
          setSelectedWebsiteId(websitesList[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading websites:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Error loading websites: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const loadSections = async (websiteId: string) => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('website_sections')
        .select('*')
        .eq('website_id', websiteId)
        .order('display_order');

      if (error) throw error;

      // Create sections for any missing ones
      const existingNames = new Set((data || []).map((s: Section) => s.section_name));
      const missingSections = SECTION_DEFINITIONS
        .filter(def => !existingNames.has(def.name))
        .map((def, index) => ({
          id: '',
          section_name: def.name,
          is_enabled: true,
          display_order: (data?.length || 0) + index,
        }));

      if (missingSections.length > 0) {
        // Insert missing sections
        const inserts = missingSections.map((s, idx) => ({
          website_id: websiteId,
          section_name: s.section_name,
          is_enabled: s.is_enabled,
          display_order: s.display_order,
        }));

        const { error: insertError } = await supabase
          .from('website_sections')
          .insert(inserts);

        if (insertError) throw insertError;

        // Reload sections
        const { data: newData, error: reloadError } = await supabase
          .from('website_sections')
          .select('*')
          .eq('website_id', websiteId)
          .order('display_order');

        if (reloadError) throw reloadError;
        setSections(newData || []);
      } else {
        setSections(data || []);
      }
    } catch (error) {
      console.error('Error loading sections:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (sectionName: string) => {
    setSections(prev => prev.map(s => 
      s.section_name === sectionName 
        ? { ...s, is_enabled: !s.is_enabled }
        : s
    ));
  };

  const handleSave = async () => {
    if (!selectedWebsiteId) {
      alert('Please select a website first');
      return;
    }

    setSaving(true);
    try {
      const websiteId = selectedWebsiteId;

      // Update all sections
      const updates = sections.map(section => ({
        id: section.id,
        is_enabled: section.is_enabled,
      }));

      for (const update of updates) {
        if (update.id) {
          const { error } = await supabase
            .from('website_sections')
            .update({ is_enabled: update.is_enabled })
            .eq('id', update.id);

          if (error) throw error;
        }
      }

      // Clear cache to refresh visibility
      clearSectionCache();
      
      alert('Sections updated successfully!');
    } catch (error: any) {
      console.error('Error saving sections:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const selectedWebsite = websites.find(w => w.id === selectedWebsiteId);

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Section Manager</h1>
            <p className="text-gray-600 mt-1">Enable or disable sections for specific websites</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !selectedWebsiteId}
            className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {saving ? (
              <>
                <RefreshCw size={20} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={20} />
                Save Changes
              </>
            )}
          </button>
        </div>

        {/* Website Selector */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="website-select" className="block text-sm font-medium text-gray-700">
              Select Website
            </label>
            <button
              onClick={loadWebsites}
              disabled={loading}
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
              title="Refresh websites list"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
          <div className="flex items-center gap-3">
            <Globe size={20} className="text-gray-400" />
            <select
              id="website-select"
              value={selectedWebsiteId}
              onChange={(e) => setSelectedWebsiteId(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
              <option value="">Choose a website...</option>
              {websites.map((website) => (
                <option key={website.id} value={website.id}>
                  {website.site_title} ({website.subdomain}) {website.is_active === false ? '(Inactive)' : ''}
                </option>
              ))}
            </select>
            {selectedWebsite && (
              <span className="text-sm text-gray-600">
                Managing: <strong>{selectedWebsite.site_title}</strong>
              </span>
            )}
          </div>
          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>
      </div>

      {!selectedWebsiteId ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Globe size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Website Selected</h3>
          <p className="text-gray-600">Please select a website from the dropdown above to manage its sections.</p>
        </div>
      ) : loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-200">
          {SECTION_DEFINITIONS.map((def) => {
            const section = sections.find(s => s.section_name === def.name);
            const isEnabled = section?.is_enabled ?? true;

            return (
              <div
                key={def.name}
                className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">{def.label}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      isEnabled 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {isEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{def.description}</p>
                </div>
                <button
                  onClick={() => toggleSection(def.name)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isEnabled ? 'bg-gray-900' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> Disabled sections will be hidden from the public website. 
              You can re-enable them at any time. Changes are saved per website.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

