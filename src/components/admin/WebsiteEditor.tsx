/**
 * Website Editor
 * Edit specific website settings, theme, and chat config
 * Uses JSONB structure - all data in websites table
 */

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import {
  ArrowLeft,
  Save,
  Palette,
  MessageCircle,
  Globe,
  Wand2,
  Lock,
} from "lucide-react";
import { populateDefaultContent } from "../../lib/default-content";

import { DEFAULT_THEMES } from "../../lib/themes";

export const WebsiteEditor: React.FC = () => {
  const { websiteId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [populating, setPopulating] = useState(false);
  const [website, setWebsite] = useState<any>(null);
  const [hasEmptyContent, setHasEmptyContent] = useState(false);

  // Password protection state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [storedPassword, setStoredPassword] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("warm-bakery");
  const [chatSupportEnabled, setChatSupportEnabled] = useState(false);
  const [greetingMessage, setGreetingMessage] = useState(
    "Hi! How can we help you today?",
  );
  const [chatbotConfigJson, setChatbotConfigJson] = useState(
    '{"model": "gemini-2.5-flash", "temperature": 0.7}',
  );
  const [knowledgeBaseSheetsUrl, setKnowledgeBaseSheetsUrl] = useState("");
  const [messengerPageId, setMessengerPageId] = useState("");

  // Contact form config state
  const [contactFormEnabled, setContactFormEnabled] = useState(false);
  const [contactFormAppsScriptUrl, setContactFormAppsScriptUrl] = useState("");
  const [contactFormClientId, setContactFormClientId] = useState("");

  // Get domain from environment variable or use default
  const domain = import.meta.env.VITE_DOMAIN || "likhasiteworks.studio";

  useEffect(() => {
    loadData();
  }, [websiteId]);

  const loadData = async () => {
    try {
      // Load website data (all from JSONB columns)
      const { data: websiteData, error: websiteError } = await supabase
        .from("websites")
        .select("*")
        .eq("id", websiteId)
        .single();

      if (websiteError) throw websiteError;
      setWebsite(websiteData);

      // Store password for verification
      setStoredPassword(websiteData.password || null);

      // Check if already authenticated via sessionStorage
      const authKey = `website_auth_${websiteId}`;
      const isAuth = sessionStorage.getItem(authKey) === "true";
      
      // If no password set, allow access
      if (!websiteData.password) {
        setIsAuthenticated(true);
      } else if (isAuth) {
        setIsAuthenticated(true);
      }

      // Check if content is empty (no sections initialized)
      const content = websiteData.content || {};
      const contentKeys = Object.keys(content).filter(
        (k) => k !== "chatSupport",
      );
      setHasEmptyContent(contentKeys.length === 0);

      // Populate form from website data
      setTitle(websiteData.title || "");
      setSubdomain(websiteData.subdomain || "");

      // Theme from theme JSONB
      const theme = websiteData.theme || {};
      setSelectedTheme(theme.preset || "warm-bakery");

      // Chat support from content.chatSupport JSONB
      const chatSupport = content.chatSupport || {};
      setChatSupportEnabled(chatSupport.enabled || false);
      setGreetingMessage(
        chatSupport.greeting_message || "Hi! How can we help you today?",
      );
      setChatbotConfigJson(
        JSON.stringify(
          chatSupport.config || { model: "gemini-2.5-flash", temperature: 0.7 },
          null,
          2,
        ),
      );
      setKnowledgeBaseSheetsUrl(
        import.meta.env.VITE_GOOGLE_SHEETS_KB_URL || "",
      );

      // Messenger from messenger JSONB
      const messenger = websiteData.messenger || {};
      setMessengerPageId(messenger.page_id || "");

      // Contact form config from contactformconfig JSONB
      const contactFormConfig = websiteData.contactformconfig || {};
      setContactFormEnabled(contactFormConfig.enabled || false);
      setContactFormAppsScriptUrl(
        contactFormConfig.appsScriptUrl ||
        import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL ||
        ""
      );
      setContactFormClientId(contactFormConfig.clientId || "");
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePopulateContent = async () => {
    if (!websiteId) return;

    const confirmed = window.confirm(
      "This will populate your website with sample content. You can edit all content later. Continue?",
    );
    if (!confirmed) return;

    setPopulating(true);
    try {
      await populateDefaultContent(websiteId);
      setHasEmptyContent(false);
      alert(
        "Sample content added successfully! You can now view and edit your website.",
      );
      // Reload website data
      await loadData();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setPopulating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Parse chatbot config
      let chatbotConfig = { model: "gemini-2.5-flash", temperature: 0.7 };
      try {
        chatbotConfig = JSON.parse(chatbotConfigJson);
      } catch (e) {
        console.warn("Invalid chatbot config JSON, using defaults");
      }

      // Get current content and update chatSupport
      const currentContent = website?.content || {};
      const updatedContent = {
        ...currentContent,
        chatSupport: {
          enabled: chatSupportEnabled,
          greeting_message: greetingMessage,
          config: chatbotConfig,
          knowledge_base_url: null, // Always use env variable
        },
      };

      // Get selected theme colors
      const themePreset =
        DEFAULT_THEMES.find((t) => t.id === selectedTheme) || DEFAULT_THEMES[0];
      const updatedTheme = {
        preset: selectedTheme,
        colors: themePreset.colors,
      };

      // Update messenger config
      const updatedMessenger = {
        page_id: messengerPageId || null,
      };

      // Update contact form config
      const updatedContactFormConfig = {
        enabled: contactFormEnabled,
        appsScriptUrl: null, // Always use env variable
        clientId: contactFormClientId || null,
      };

      // Update website with all JSONB data
      const { error: websiteError } = await supabase
        .from("websites")
        .update({
          title: title,
          subdomain: subdomain,
          theme: updatedTheme,
          content: updatedContent,
          messenger: updatedMessenger,
          contactformconfig: updatedContactFormConfig,
          updatedat: new Date().toISOString(),
        })
        .eq("id", websiteId);

      if (websiteError) throw websiteError;

      // Clear localStorage cache for this website
      if (subdomain) {
        localStorage.removeItem(`likhamenu_website_${subdomain}`);
      }

      alert("Website updated successfully!");
    } catch (error: any) {
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

  // Password protection screen
  if (!isAuthenticated && storedPassword) {
    const handlePasswordSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (passwordInput === storedPassword) {
        setIsAuthenticated(true);
        setPasswordError("");
        // Store authentication in sessionStorage for this session
        sessionStorage.setItem(`website_auth_${websiteId}`, "true");
      } else {
        setPasswordError("Incorrect password. Please try again.");
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock size={32} className="text-gray-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Password Required</h2>
            <p className="text-gray-600 mt-2">
              Enter the password to edit <strong>{website.title || website.subdomain}</strong>
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit}>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => {
                setPasswordInput(e.target.value);
                setPasswordError("");
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent mb-2"
              placeholder="Enter password"
              autoFocus
            />

            {passwordError && (
              <p className="text-sm text-red-600 mb-3">{passwordError}</p>
            )}

            <button
              type="submit"
              className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-medium mt-4"
            >
              Unlock & Edit
            </button>

            <button
              type="button"
              onClick={() => navigate("/admin/websites")}
              className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition mt-3"
            >
              Cancel
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate("/admin/websites")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} />
          Back to Websites
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          {title || "Untitled Website"}
        </h1>
        <p className="text-gray-600 mt-1">Edit website settings and theme</p>
      </div>

      {/* Empty Content Warning */}
      {hasEmptyContent && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-100 rounded-lg">
              <Wand2 size={24} className="text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-800 mb-1">
                Your website needs content
              </h3>
              <p className="text-sm text-amber-700 mb-4">
                This website doesn't have any section content yet. Click the
                button below to add sample content that you can customize later.
              </p>
              <button
                onClick={handlePopulateContent}
                disabled={populating}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-medium disabled:opacity-50"
              >
                {populating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Adding content...
                  </>
                ) : (
                  <>
                    <Wand2 size={18} />
                    Add Sample Content
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Form */}
      <div className="max-w-2xl space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe size={24} className="text-gray-700" />
            <h2 className="text-xl font-bold text-gray-900">
              Basic Information
            </h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subdomain
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={subdomain}
                  onChange={(e) =>
                    setSubdomain(
                      e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                    )
                  }
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="text-sm text-gray-500">.{domain}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Theme Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Palette size={24} className="text-gray-700" />
            <h2 className="text-xl font-bold text-gray-900">Theme</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Choose from 5 professional theme presets
          </p>

          <div className="grid grid-cols-1 gap-3">
            {DEFAULT_THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => setSelectedTheme(theme.id)}
                className={`p-4 rounded-lg border-2 transition text-left ${selectedTheme === theme.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                  }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{theme.name}</h3>
                  {selectedTheme === theme.id && (
                    <span className="px-2 py-1 bg-blue-500 text-white text-xs font-medium rounded-full">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  {theme.description}
                </p>
                <div className="flex gap-2">
                  {Object.entries(theme.colors)
                    .slice(0, 4)
                    .map(([key, value]) => (
                      <div
                        key={key}
                        className="w-8 h-8 rounded border border-gray-300"
                        style={{ backgroundColor: value }}
                        title={key}
                      />
                    ))}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Integrations */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle size={24} className="text-gray-700" />
            <h2 className="text-xl font-bold text-gray-900">Integrations</h2>
          </div>

          <div className="space-y-6">
            {/* Facebook Messenger */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Facebook Messenger Page ID
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Enter your Facebook Page ID or Username for checkout redirects.
              </p>
              <input
                type="text"
                value={messengerPageId}
                onChange={(e) => setMessengerPageId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your-page-id or 123456789012345"
              />
            </div>

            {/* Contact Form Email Integration */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Form Email Integration
                  </label>
                  <p className="text-xs text-gray-500">
                    Send contact form submissions via Google Apps Script.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setContactFormEnabled(!contactFormEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${contactFormEnabled ? "bg-green-600" : "bg-gray-300"
                    }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${contactFormEnabled ? "translate-x-6" : "translate-x-1"
                      }`}
                  />
                </button>
              </div>

              {contactFormEnabled && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
                  {/* Client ID */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Client ID
                    </label>
                    <input
                      type="text"
                      value={contactFormClientId}
                      onChange={(e) => setContactFormClientId(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="bakery"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Must match the ClientID in your Google Sheet's "Clients" tab.
                    </p>
                  </div>

                  {/* Status Indicator */}
                  <div className={`p-3 rounded-lg border ${contactFormClientId
                      ? "bg-green-50 border-green-200"
                      : "bg-yellow-50 border-yellow-200"
                    }`}>
                    <p className={`text-sm ${contactFormClientId
                        ? "text-green-800"
                        : "text-yellow-800"
                      }`}>
                      {contactFormClientId ? (
                        <>
                          <strong>✓ Configuration complete.</strong> Contact form submissions will be emailed.
                        </>
                      ) : (
                        <>
                          <strong>⚠ Configuration incomplete</strong>
                          <br />
                          Please provide the Client ID.
                        </>
                      )}
                    </p>
                  </div>

                  {/* Setup Guide Link */}
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>📖 Setup Guide</strong>
                      <br />
                      See{" "}
                      <a
                        href="/CONTACT_FORM_SETUP.md"
                        target="_blank"
                        className="underline hover:text-blue-600"
                      >
                        CONTACT_FORM_SETUP.md
                      </a>{" "}
                      for step-by-step instructions on setting up Google Apps Script email integration.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Support Toggle */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chat Support
                  </label>
                  <p className="text-xs text-gray-500">
                    Enable AI-powered chat widget on your website.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setChatSupportEnabled(!chatSupportEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${chatSupportEnabled ? "bg-blue-600" : "bg-gray-300"
                    }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${chatSupportEnabled ? "translate-x-6" : "translate-x-1"
                      }`}
                  />
                </button>
              </div>

              {/* Chatbot Configuration */}
              {chatSupportEnabled && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
                  {/* Greeting Message */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Greeting Message
                    </label>
                    <input
                      type="text"
                      value={greetingMessage}
                      onChange={(e) => setGreetingMessage(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Hi! How can we help you today?"
                    />
                  </div>

                  {/* Gemini Info */}
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>🤖 Using Google Gemini</strong>
                      <br />
                      API Key is loaded from{" "}
                      <code className="bg-white px-1 rounded">
                        VITE_GEMINI_API_KEY
                      </code>{" "}
                      environment variable.
                    </p>
                  </div>

                  {/* Advanced Config */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Advanced Config (JSON)
                    </label>
                    <textarea
                      value={chatbotConfigJson}
                      onChange={(e) => setChatbotConfigJson(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    />
                  </div>

                  {/* Knowledge Base Info */}
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-sm text-purple-800">
                      <strong>📚 Knowledge Base</strong>
                      <br />
                      Set globally via{" "}
                      <code className="bg-white px-1 rounded">
                        VITE_GOOGLE_SHEETS_KB_URL
                      </code>{" "}
                      in your .env file.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
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
      </div>
    </div>
  );
};
