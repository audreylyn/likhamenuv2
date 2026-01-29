/**
 * Website List
 * Manage all websites (CRUD operations)
 */

import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Globe, Plus, ExternalLink, Edit, Trash2, Eye, EyeOff, Palette, Sparkles, Loader } from 'lucide-react';
import { buildWebsiteUrl } from '../../lib/website-detector';
import { initializeWebsiteContent } from '../../lib/initialize-website-content';

interface Website {
  id: string;
  site_title: string;
  subdomain: string;
  is_active: boolean;
  created_at: string;
  theme_preset_id: string | null;
}

export const WebsiteList: React.FC = () => {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [searchParams] = useSearchParams();
  const showNewForm = searchParams.get('new') === 'true';
  
  // Get domain from environment variable or use default
  const domain = import.meta.env.VITE_DOMAIN || 'likhasiteworks.studio';

  const [newWebsite, setNewWebsite] = useState({
    site_title: '',
    subdomain: '',
    theme_preset_id: '',
  });
  const [themePresets, setThemePresets] = useState<any[]>([]);
  
  // Section definitions with default enabled sections
  const SECTION_DEFINITIONS = [
    { name: 'hero', label: 'Hero Section', description: 'Main banner/carousel at the top' },
    { name: 'about', label: 'About Section', description: 'About your business' },
    { name: 'whyChooseUs', label: 'Why Choose Us', description: 'Key features/benefits' },
    { name: 'team', label: 'Team Section', description: 'Team members' },
    { name: 'featuredProducts', label: 'Featured Products', description: 'Highlighted products' },
    { name: 'menu', label: 'Menu Section', description: 'Product menu' },
    { name: 'reservation', label: 'Reservation', description: 'Booking form' },
    { name: 'testimonials', label: 'Testimonials', description: 'Customer reviews' },
    { name: 'faq', label: 'FAQ Section', description: 'Frequently asked questions' },
    { name: 'contact', label: 'Contact Section', description: 'Contact information' },
    { name: 'instagramFeed', label: 'Instagram Feed', description: 'Social media feed' },
  ];
  
  // Default enabled sections (all except specialOffers)
  const [enabledSections, setEnabledSections] = useState<Set<string>>(
    new Set(SECTION_DEFINITIONS.map(s => s.name))
  );

  useEffect(() => {
    loadWebsites();
    loadThemePresets();
  }, []);

  const loadThemePresets = async () => {
    try {
      const { data, error } = await supabase
        .from('theme_presets')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      
      if (error) throw error;
      setThemePresets(data || []);
      
      // Set default theme if available
      if (data && data.length > 0 && !newWebsite.theme_preset_id) {
        setNewWebsite({ ...newWebsite, theme_preset_id: data[0].id });
      }
    } catch (error) {
      console.error('Error loading theme presets:', error);
    }
  };

  const loadWebsites = async () => {
    try {
      const { data, error } = await supabase
        .from('websites')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWebsites(data || []);
    } catch (error) {
      console.error('Error loading websites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple clicks
    if (creating) return;
    
    setCreating(true);
    
    try {
      // Use selected theme or default
      let themeId = newWebsite.theme_preset_id;
      if (!themeId && themePresets.length > 0) {
        themeId = themePresets[0].id;
      }

      const { error, data } = await supabase
        .from('websites')
        .insert([{
          site_title: newWebsite.site_title,
          subdomain: newWebsite.subdomain,
          theme_preset_id: themeId,
          is_active: true,
        }])
        .select()
        .single();

      if (error) throw error;

      // Initialize default content for the new website
      if (data) {
        await initializeWebsiteContent(data.id, Array.from(enabledSections));
      }

      alert('Website created successfully!');
      setNewWebsite({ site_title: '', subdomain: '', theme_preset_id: themePresets[0]?.id || '' });
      setEnabledSections(new Set(SECTION_DEFINITIONS.map(s => s.name))); // Reset to default
      loadWebsites();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { data, error } = await supabase
        .from('websites')
        .update({ is_active: !currentStatus })
        .eq('id', id)
        .select();

      if (error) {
        console.error('Error toggling website status:', error);
        alert(`Error: ${error.message || 'Failed to update website status'}`);
        return;
      }

      // Reload websites to reflect the change
      await loadWebsites();
    } catch (error: any) {
      console.error('Error toggling website status:', error);
      alert(`Error: ${error.message || 'Failed to update website status'}`);
    }
  };

  const handleDelete = async (id: string, subdomain: string) => {
    if (!window.confirm(`Are you sure you want to delete "${subdomain}"? This cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('websites')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('Website deleted successfully!');
      loadWebsites();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Websites</h1>
          <p className="text-gray-600 mt-1">Manage all your websites</p>
        </div>
      </div>

      {/* Create New Website Form */}
      {showNewForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Website</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website Title
                  </label>
                  <input
                    type="text"
                    value={newWebsite.site_title}
                    onChange={(e) => setNewWebsite({ ...newWebsite, site_title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="My Bakery"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subdomain
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newWebsite.subdomain}
                      onChange={(e) => setNewWebsite({ ...newWebsite, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="my-bakery"
                      required
                    />
                    <span className="text-sm text-gray-500">.{domain}</span>
                  </div>
                </div>
              </div>
              
              {/* Theme Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Palette size={16} />
                  Color Scheme (Light Theme)
                </label>
                <div className="grid grid-cols-5 gap-3">
                  {themePresets.map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setNewWebsite({ ...newWebsite, theme_preset_id: theme.id })}
                      className={`p-3 rounded-lg border-2 transition text-left ${
                        newWebsite.theme_preset_id === theme.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex gap-1 mb-2">
                        {Object.values(theme.colors).slice(0, 4).map((color: any, idx) => (
                          <div
                            key={idx}
                            className="w-6 h-6 rounded border border-gray-300"
                            style={{ backgroundColor: color }}
                            title={Object.keys(theme.colors)[idx]}
                          />
                        ))}
                      </div>
                      <p className="text-xs font-medium text-gray-700">{theme.display_name}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Section Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Sparkles size={16} />
                  Enable Sections
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Select which sections to enable on your new website. All content will be copied, but only selected sections will be visible.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  {SECTION_DEFINITIONS.map((section) => {
                    const isEnabled = enabledSections.has(section.name);
                    return (
                      <label
                        key={section.name}
                        className={`flex items-start gap-3 p-3 bg-white rounded-lg border-2 cursor-pointer transition hover:border-blue-300 ${
                          isEnabled ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onChange={(e) => {
                            const newSet = new Set(enabledSections);
                            if (e.target.checked) {
                              newSet.add(section.name);
                            } else {
                              newSet.delete(section.name);
                            }
                            setEnabledSections(newSet);
                          }}
                          className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{section.label}</p>
                          <p className="text-xs text-gray-500">{section.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                  <span>
                    {enabledSections.size} of {SECTION_DEFINITIONS.length} sections enabled
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (enabledSections.size === SECTION_DEFINITIONS.length) {
                        setEnabledSections(new Set());
                      } else {
                        setEnabledSections(new Set(SECTION_DEFINITIONS.map(s => s.name)));
                      }
                    }}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {enabledSections.size === SECTION_DEFINITIONS.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={creating}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {creating ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Website'
                )}
              </button>
              <Link
                to="/admin/websites"
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      )}

      {/* Website List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">All Websites</h2>
          <Link
            to="/admin/websites?new=true"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
          >
            <Plus size={18} />
            New Website
          </Link>
        </div>

        {websites.length === 0 ? (
          <div className="p-12 text-center">
            <Globe size={64} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No websites yet</h3>
            <p className="text-gray-600 mb-6">Create your first website to get started</p>
            <Link
              to="/admin/websites?new=true"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              <Plus size={20} />
              Create Website
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {websites.map((website) => (
              <div key={website.id} className="p-6 hover:bg-gray-50 transition">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{website.site_title}</h3>
                      {website.is_active ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                          <Eye size={12} />
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full flex items-center gap-1">
                          <EyeOff size={12} />
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      <a
                        href={buildWebsiteUrl(website.subdomain)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {website.subdomain}.{domain}
                      </a>
                    </p>
                    <p className="text-xs text-gray-500">
                      Created {new Date(website.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/admin/websites/${website.id}`}
                      className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition"
                      title="Website Settings"
                    >
                      <Palette size={18} />
                    </Link>
                    <a
                      href={buildWebsiteUrl(website.subdomain)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition"
                      title="View Site"
                    >
                      <ExternalLink size={18} />
                    </a>
                    <a
                      href={buildWebsiteUrl(website.subdomain, '', 'editor')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                      title="Edit Site"
                    >
                      <Edit size={18} />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(website.id, website.is_active)}
                      className={`p-2 rounded-lg transition ${
                        website.is_active
                          ? 'text-orange-600 hover:bg-orange-100'
                          : 'text-green-600 hover:bg-green-100'
                      }`}
                      title={website.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {website.is_active ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <button
                      onClick={() => handleDelete(website.id, website.subdomain)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

