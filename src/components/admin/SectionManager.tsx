/**
 * Section Manager
 * Enable/disable sections for a website
 * Uses JSONB enabledsections array in websites table
 */

import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { getWebsiteId } from "../../lib/supabase";
import { getUserWebsites } from "../../lib/auth";
import { Save, RefreshCw, Globe, AlertCircle } from "lucide-react";
import { clearSectionCache } from "../../lib/section-visibility";
import { useToast } from "../Toast";

const SECTION_DEFINITIONS = [
  {
    name: "hero",
    label: "Hero Section",
    description: "Main banner/carousel at the top",
  },
  { name: "about", label: "About Section", description: "About your business" },
  {
    name: "whyChooseUs",
    label: "Why Choose Us",
    description: "Key features/benefits",
  },
  { name: "team", label: "Team Section", description: "Team members" },
  {
    name: "featuredProducts",
    label: "Featured Products",
    description: "Highlighted products",
  },
  { name: "menu", label: "Menu Section", description: "Product menu" },
  {
    name: "catalogue",
    label: "Catalogue",
    description: "Product showcase (No ordering)",
  },
  { name: "reservation", label: "Reservation", description: "Booking form" },
  {
    name: "testimonials",
    label: "Testimonials",
    description: "Customer reviews",
  },
  {
    name: "specialOffers",
    label: "Special Offers",
    description: "Promotions/deals",
  },
  {
    name: "faq",
    label: "FAQ Section",
    description: "Frequently asked questions",
  },
  {
    name: "payment",
    label: "Payment Options",
    description: "GCash QR code & bank details",
  },
  {
    name: "contact",
    label: "Contact Section",
    description: "Contact information",
  },
  {
    name: "instagramFeed",
    label: "Instagram Feed",
    description: "Social media feed",
  },
  {
    name: "footer",
    label: "Footer",
    description: "Page footer with links",
  },
  {
    name: "chatSupport",
    label: "Chat Support",
    description: "Live chat widget",
  },
];

interface Website {
  id: string;
  title: string;
  subdomain: string;
  status: string;
}

export const SectionManager: React.FC = () => {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<string>("");
  const [enabledSections, setEnabledSections] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

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

      // Get user from auth
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.error("No user found");
        setLoading(false);
        return;
      }

      // Check if user is admin from user_metadata
      const isAdmin = user.user_metadata?.role === "admin";
      let websitesList: Website[] = [];

      if (isAdmin) {
        // Admins get ALL websites
        const { data, error } = await supabase
          .from("websites")
          .select("id, title, subdomain, status")
          .order("createdat", { ascending: false });

        if (error) {
          console.error("Error fetching websites:", error);
          throw error;
        }
        websitesList = ((data as any[]) || []).map((w: any) => ({
          id: w.id,
          title: w.title || w.subdomain,
          subdomain: w.subdomain,
          status: w.status || "draft",
        }));
      } else {
        // Use the existing getUserWebsites for editors
        const userWebsites = await getUserWebsites();
        websitesList = userWebsites.map((w: any) => ({
          id: w.id,
          title: w.title || w.subdomain,
          subdomain: w.subdomain,
          status: w.status || "draft",
        }));
      }

      console.log("Loaded websites:", websitesList);
      setWebsites(websitesList);
      setError(null);

      if (websitesList.length === 0) {
        setError("No websites found. Please create a website first.");
      }

      // If no website selected, try to get current website or select first one
      if (websitesList.length > 0 && !selectedWebsiteId) {
        const currentWebsiteId = await getWebsiteId();
        if (
          currentWebsiteId &&
          websitesList.find((w) => w.id === currentWebsiteId)
        ) {
          setSelectedWebsiteId(currentWebsiteId);
        } else {
          setSelectedWebsiteId(websitesList[0].id);
        }
      }
    } catch (error) {
      console.error("Error loading websites:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setError(`Error loading websites: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const loadSections = async (websiteId: string) => {
    try {
      setLoading(true);

      // Get enabledsections from the websites table (JSONB array)
      const { data, error } = await supabase
        .from("websites")
        .select("enabledsections")
        .eq("id", websiteId)
        .single();

      if (error) throw error;

      // enabledsections is a JSONB array of section names
      const sections = data ? ((data as any).enabledsections as string[]) : [];

      // If empty array, default to all sections enabled
      if (sections.length === 0) {
        setEnabledSections(SECTION_DEFINITIONS.map((s) => s.name));
      } else {
        setEnabledSections(sections);
      }
    } catch (error) {
      console.error("Error loading sections:", error);
      // On error, default to all sections enabled
      setEnabledSections(SECTION_DEFINITIONS.map((s) => s.name));
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (sectionName: string) => {
    setEnabledSections((prev) => {
      if (prev.includes(sectionName)) {
        // Remove section
        return prev.filter((s) => s !== sectionName);
      } else {
        // Add section
        return [...prev, sectionName];
      }
    });
  };

  const handleSave = async () => {
    if (!selectedWebsiteId) {
      showToast("Please select a website first", "warning");
      return;
    }

    setSaving(true);
    try {
      // Update enabledsections JSONB array in websites table
      const { error } = await (supabase.from("websites") as any)
        .update({
          enabledsections: enabledSections,
          updatedat: new Date().toISOString(),
        })
        .eq("id", selectedWebsiteId);

      if (error) throw error;

      // Clear cache to refresh visibility
      clearSectionCache();

      // Also clear localStorage cache for the website
      const selectedWebsite = websites.find(w => w.id === selectedWebsiteId);
      if (selectedWebsite?.subdomain) {
        localStorage.removeItem(`likhamenu_website_${selectedWebsite.subdomain}`);
      }

      showToast("Sections updated successfully! Refresh the public site to see changes.", "success");
    } catch (error: any) {
      console.error("Error saving sections:", error);
      showToast(`Error: ${error.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading && websites.length === 0) {
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

  const selectedWebsite = websites.find((w) => w.id === selectedWebsiteId);

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Section Manager
            </h1>
            <p className="text-gray-600 mt-1">
              Enable or disable sections for specific websites
            </p>
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
            <label
              htmlFor="website-select"
              className="block text-sm font-medium text-gray-700"
            >
              Select Website
            </label>
            <button
              onClick={loadWebsites}
              disabled={loading}
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
              title="Refresh websites list"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
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
                  {website.title} ({website.subdomain}){" "}
                  {website.status !== "published" ? `(${website.status})` : ""}
                </option>
              ))}
            </select>
            {selectedWebsite && (
              <span className="text-sm text-gray-600">
                Managing: <strong>{selectedWebsite.title}</strong>
              </span>
            )}
          </div>
          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle
                size={20}
                className="text-red-600 flex-shrink-0 mt-0.5"
              />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>
      </div>

      {!selectedWebsiteId ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Globe size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Website Selected
          </h3>
          <p className="text-gray-600">
            Please select a website from the dropdown above to manage its
            sections.
          </p>
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
                const isEnabled = enabledSections.includes(def.name);

                return (
                  <div
                    key={def.name}
                    className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {def.label}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${isEnabled
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                            }`}
                        >
                          {isEnabled ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {def.description}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleSection(def.name)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isEnabled ? "bg-gray-900" : "bg-gray-300"
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isEnabled ? "translate-x-6" : "translate-x-1"
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
              <strong>Tip:</strong> Disabled sections will be hidden from the
              public website. You can re-enable them at any time. Changes are
              saved per website.
            </p>
          </div>
        </>
      )}
    </div>
  );
};
