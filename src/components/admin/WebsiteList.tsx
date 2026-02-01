/**
 * Website List
 * Manage all websites (CRUD operations)
 * Uses JSONB structure - all data in websites table
 */

import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import {
  Globe,
  Plus,
  ExternalLink,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
  Loader,
} from "lucide-react";
import { buildWebsiteUrl } from "../../lib/website-detector";
import { initializeWebsiteContent } from "../../lib/initialize-website-content";

interface Website {
  id: string;
  title: string;
  subdomain: string;
  status: string;
  createdat: string;
}

// Default themes (matching WebsiteEditor)
const DEFAULT_THEMES = [
  {
    id: "warm-bakery",
    name: "Warm Bakery",
    colors: {
      primary: "#8B4513",
      accent: "#D2691E",
      cream: "#FFF8E7",
      dark: "#5D4037",
      light: "#FFFFFF",
      text: "#5D4037",
      beige: "#F5F5DC",
      sand: "#E6DCC3",
    },
  },
  {
    id: "modern-minimal",
    name: "Modern Minimal",
    colors: {
      primary: "#1a1a1a",
      accent: "#007bff",
      cream: "#f8f9fa",
      dark: "#1a1a1a",
      light: "#ffffff",
      text: "#1a1a1a",
      beige: "#e9ecef",
      sand: "#dee2e6",
    },
  },
  {
    id: "fresh-green",
    name: "Fresh & Green",
    colors: {
      primary: "#2E8B57",
      accent: "#3CB371",
      cream: "#F0FFF0",
      dark: "#1C4428",
      light: "#ffffff",
      text: "#1C4428",
      beige: "#E8F5E9",
      sand: "#C8E6C9",
    },
  },
  {
    id: "ocean-blue",
    name: "Ocean Blue",
    colors: {
      primary: "#1E90FF",
      accent: "#00CED1",
      cream: "#F0F8FF",
      dark: "#191970",
      light: "#ffffff",
      text: "#191970",
      beige: "#E3F2FD",
      sand: "#BBDEFB",
    },
  },
  {
    id: "sunset-warm",
    name: "Sunset Warm",
    colors: {
      primary: "#FF6B6B",
      accent: "#FFD93D",
      cream: "#FFF5EE",
      dark: "#8B0000",
      light: "#ffffff",
      text: "#8B0000",
      beige: "#FFEBEE",
      sand: "#FFCDD2",
    },
  },
];

// Section definitions
const SECTION_DEFINITIONS = [
  { name: "hero", label: "Hero Section" },
  { name: "about", label: "About Section" },
  { name: "whyChooseUs", label: "Why Choose Us" },
  { name: "team", label: "Team Section" },
  { name: "featuredProducts", label: "Featured Products" },
  { name: "menu", label: "Menu Section" },
  { name: "reservation", label: "Reservation" },
  { name: "testimonials", label: "Testimonials" },
  { name: "faq", label: "FAQ Section" },
  { name: "contact", label: "Contact Section" },
  { name: "instagramFeed", label: "Instagram Feed" },
  { name: "chatSupport", label: "Chat Support" },
];

export const WebsiteList: React.FC = () => {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [searchParams] = useSearchParams();
  const showNewForm = searchParams.get("new") === "true";

  // Get domain from environment variable or use default
  const domain = import.meta.env.VITE_DOMAIN || "likhasiteworks.studio";

  const [newWebsite, setNewWebsite] = useState({
    title: "",
    subdomain: "",
    selectedTheme: "warm-bakery",
  });

  // Default enabled sections (all sections)
  const [enabledSections, setEnabledSections] = useState<Set<string>>(
    new Set(SECTION_DEFINITIONS.map((s) => s.name)),
  );

  useEffect(() => {
    loadWebsites();
  }, []);

  const loadWebsites = async () => {
    try {
      const { data, error } = await supabase
        .from("websites")
        .select("id, title, subdomain, status, createdat")
        .order("createdat", { ascending: false });

      if (error) throw error;
      setWebsites(
        ((data as any[]) || []).map((w: any) => ({
          id: w.id,
          title: w.title || w.subdomain || "Untitled",
          subdomain: w.subdomain,
          status: w.status || "draft",
          createdat: w.createdat || new Date().toISOString(),
        })),
      );
    } catch (error) {
      console.error("Error loading websites:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (creating) return;

    setCreating(true);

    try {
      // Get theme colors
      const theme =
        DEFAULT_THEMES.find((t) => t.id === newWebsite.selectedTheme) ||
        DEFAULT_THEMES[0];

      // Generate unique ID
      const id = `${newWebsite.subdomain}-${Date.now()}`;

      const { error } = await (supabase.from("websites") as any).insert({
        id: id,
        title: newWebsite.title,
        subdomain: newWebsite.subdomain,
        status: "draft",
        theme: {
          preset: newWebsite.selectedTheme,
          colors: theme.colors,
        },
        enabledsections: Array.from(enabledSections),
        content: {},
        messenger: {},
        marketing: {},
        contactformconfig: {},
        assignededitors: [],
      });

      if (error) throw error;

      // Initialize website with sample content from golden-crumb template
      let contentInitialized = false;
      try {
        await initializeWebsiteContent(id, Array.from(enabledSections));
        contentInitialized = true;
      } catch (initError) {
        console.error("Warning: Could not initialize website content:", initError);
        // Continue anyway - website was created, content can be added later
      }

      if (contentInitialized) {
        alert("Website created successfully with sample content!");
      } else {
        alert("Website created! Note: Could not auto-populate content - you may need to add content manually or ensure a 'golden-crumb' template website exists.");
      }
      setNewWebsite({ title: "", subdomain: "", selectedTheme: "warm-bakery" });
      setEnabledSections(new Set(SECTION_DEFINITIONS.map((s) => s.name)));
      loadWebsites();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "published" ? "draft" : "published";

      const { error } = await (supabase
        .from("websites") as any)
        .update({
          status: newStatus,
          updatedat: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
      await loadWebsites();
    } catch (error: any) {
      console.error("Error toggling website status:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleDelete = async (id: string, subdomain: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${subdomain}"? This cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase.from("websites").delete().eq("id", id);

      if (error) throw error;
      await loadWebsites();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Websites</h1>
          <p className="text-gray-600 mt-1">Manage your websites</p>
        </div>
        <Link
          to="/admin/websites?new=true"
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
        >
          <Plus size={20} />
          New Website
        </Link>
      </div>

      {/* Create Form */}
      {showNewForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Create New Website
          </h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website Title
                </label>
                <input
                  type="text"
                  value={newWebsite.title}
                  onChange={(e) =>
                    setNewWebsite({ ...newWebsite, title: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
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
                    onChange={(e) =>
                      setNewWebsite({
                        ...newWebsite,
                        subdomain: e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, ""),
                      })
                    }
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900"
                    placeholder="my-bakery"
                    required
                  />
                  <span className="text-sm text-gray-500">.{domain}</span>
                </div>
              </div>
            </div>

            {/* Theme Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Theme
              </label>
              <div className="flex gap-2 flex-wrap">
                {DEFAULT_THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() =>
                      setNewWebsite({ ...newWebsite, selectedTheme: theme.id })
                    }
                    className={`px-4 py-2 rounded-lg border-2 transition ${newWebsite.selectedTheme === theme.id
                      ? "border-gray-900 bg-gray-100"
                      : "border-gray-200 hover:border-gray-300"
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: theme.colors.primary }}
                      />
                      <span className="text-sm">{theme.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Section Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enabled Sections
              </label>
              <div className="flex gap-2 flex-wrap">
                {SECTION_DEFINITIONS.map((section) => (
                  <button
                    key={section.name}
                    type="button"
                    onClick={() => {
                      const newSet = new Set(enabledSections);
                      if (newSet.has(section.name)) {
                        newSet.delete(section.name);
                      } else {
                        newSet.add(section.name);
                      }
                      setEnabledSections(newSet);
                    }}
                    className={`px-3 py-1 rounded-full text-sm transition ${enabledSections.has(section.name)
                      ? "bg-green-100 text-green-700 border border-green-300"
                      : "bg-gray-100 text-gray-600 border border-gray-200"
                      }`}
                  >
                    {section.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={creating}
                className="flex items-center gap-2 px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
              >
                {creating ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    Create Website
                  </>
                )}
              </button>
              <Link
                to="/admin/websites"
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      )}

      {/* Website Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {websites.map((website) => (
          <div
            key={website.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {website.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {website.subdomain}.{domain}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${website.status === "published"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600"
                    }`}
                >
                  {website.status}
                </span>
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <a
                  href={buildWebsiteUrl(website.subdomain)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition"
                >
                  <ExternalLink size={16} />
                  View
                </a>
                <Link
                  to={`/admin/websites/${website.id}`}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition"
                >
                  <Edit size={16} />
                  Edit
                </Link>
                <Link
                  to={`/admin/websites/${website.id}/content`}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition"
                >
                  <Sparkles size={16} />
                  AI
                </Link>
                <button
                  onClick={() => handleToggleStatus(website.id, website.status)}
                  className="flex items-center justify-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition"
                  title={
                    website.status === "published" ? "Unpublish" : "Publish"
                  }
                >
                  {website.status === "published" ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
                <button
                  onClick={() => handleDelete(website.id, website.subdomain)}
                  className="flex items-center justify-center gap-1 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {websites.length === 0 && (
        <div className="text-center py-12">
          <Globe size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No websites yet
          </h3>
          <p className="text-gray-500 mb-4">
            Create your first website to get started
          </p>
          <Link
            to="/admin/websites?new=true"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
          >
            <Plus size={20} />
            Create Website
          </Link>
        </div>
      )}
    </div>
  );
};
