/**
 * Chatbot Service
 * Handles integration with various chatbot providers
 * Each website can have its own chatbot configuration
 * Supports Gemini with Groq as fallback
 */

import { supabase, getWebsiteId } from "./supabase";

export type ChatbotProvider = "gemini" | "groq";

export interface ChatbotConfig {
  provider: ChatbotProvider;
  apiKey?: string;
  groqApiKey?: string;
  botId?: string;
  webhookUrl?: string;
  config?: Record<string, any>;
  knowledgeBase?: string;
}

export interface ChatMessage {
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

/**
 * Get chatbot configuration for current website
 * Now reads from websites.content.chatSupport JSONB
 */
export async function getChatbotConfig(): Promise<ChatbotConfig | null> {
  try {
    const websiteId = await getWebsiteId();
    if (!websiteId) return null;

    // Get chatbot config from websites.content.chatSupport JSONB
    const { data, error } = await supabase
      .from("websites")
      .select("content, subdomain")
      .eq("id", websiteId)
      .single();

    if (error || !data) return null;

    const content = (data.content as Record<string, any>) || {};
    const chatSupport = content.chatSupport || {};

    // Knowledge base is now always from Google Sheets (Apps Script URL)
    let knowledgeBase = undefined;
    const kbUrl = chatSupport.knowledge_base_url;
    if (
      kbUrl &&
      (kbUrl.startsWith("http://") || kbUrl.startsWith("https://"))
    ) {
      // It's a Google Sheets Apps Script URL, fetch it with website parameter
      try {
        const website = data.subdomain || "default";
        const sheetsUrl = `${kbUrl}${kbUrl.includes("?") ? "&" : "?"}website=${website}`;

        const response = await fetch(sheetsUrl);
        if (response.ok) {
          knowledgeBase = await response.text();
        } else {
          console.warn(
            "Failed to fetch knowledge base from Google Sheets:",
            sheetsUrl,
          );
        }
      } catch (err) {
        console.error("Error fetching knowledge base from Google Sheets:", err);
      }
    }

    // Use environment variable for Gemini API key (same as AI content generation)
    const geminiApiKey =
      import.meta.env.VITE_GEMINI_API_KEY || chatSupport.api_key || undefined;
    
    // Groq API key for fallback
    const groqApiKey = import.meta.env.VITE_GROQ_API_KEY || undefined;

    return {
      provider: "gemini" as ChatbotProvider,
      apiKey: geminiApiKey,
      groqApiKey: groqApiKey,
      botId: undefined,
      webhookUrl: undefined,
      config: chatSupport.config || {},
      knowledgeBase: knowledgeBase,
    };
  } catch (error) {
    console.error("Error fetching chatbot config:", error);
    return null;
  }
}

/**
 * Send message to chatbot and get response
 * Uses Gemini as primary, Groq as fallback
 */
export async function sendChatbotMessage(
  message: string,
  conversationId?: string,
): Promise<string> {
  const config = await getChatbotConfig();

  if (!config) {
    return "I'm sorry, I'm having trouble connecting. Please try again later.";
  }

  // Try Gemini first, then fall back to Groq
  try {
    return await handleGemini(message, config, conversationId);
  } catch (geminiError) {
    console.warn("Gemini failed, trying Groq fallback:", geminiError);
    
    if (config.groqApiKey) {
      try {
        return await handleGroq(message, config, conversationId);
      } catch (groqError) {
        console.error("Groq fallback also failed:", groqError);
        return "I'm sorry, I'm having trouble processing your message. Please try again later.";
      }
    }
    
    return "I'm sorry, I'm having trouble processing your message. Please try again later.";
  }
}

// Removed: Simple bot and Botpress - only Gemini is supported now

/**
 * Google Gemini integration
 * Documentation: https://ai.google.dev/docs
 * Free tier: High limits, $0 cost
 */
async function handleGemini(
  message: string,
  config: ChatbotConfig,
  conversationId?: string,
): Promise<string> {
  if (!config.apiKey) {
    console.error("Gemini: Missing apiKey");
    return "I'm sorry, I'm having trouble connecting. Please make sure the Gemini API key is configured.";
  }

  try {
    // Build system instruction with knowledge base if available
    let systemInstruction =
      config.config?.systemPrompt ||
      "You are a helpful customer support assistant for a business. Be friendly, concise, and accurate.";

    // If knowledge base exists, prepend it to system instruction
    if (config.knowledgeBase) {
      systemInstruction = `${systemInstruction}\n\nKnowledge Base:\n${config.knowledgeBase}\n\nUse the knowledge base above to answer questions accurately. If the information is not in the knowledge base, politely say you don't have that information and suggest contacting support directly.`;
    }

    // Use Gemini API via server proxy or direct API call
    const model = config.config?.model || "gemini-2.5-flash";

    // Try to use server proxy first (if available), otherwise use direct API
    let apiUrl: string;
    let headers: Record<string, string>;
    let body: any;

    // Check if we have a server proxy endpoint
    const useProxy =
      window.location.hostname !== "localhost" ||
      import.meta.env.VITE_USE_GEMINI_PROXY === "true";

    if (useProxy) {
      // Use server proxy (recommended for production)
      apiUrl = "/api/gemini";
      headers = {
        "Content-Type": "application/json",
      };
      body = {
        model: model,
        contents: [
          {
            role: "user",
            parts: [{ text: message }],
          },
        ],
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
        generationConfig: {
          temperature: config.config?.temperature || 0.7,
          topK: config.config?.topK || 40,
          topP: config.config?.topP || 0.95,
          maxOutputTokens: config.config?.maxTokens || 500,
        },
      };
    } else {
      // Direct API call (for development)
      apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`;
      headers = {
        "Content-Type": "application/json",
      };
      body = {
        contents: [
          {
            role: "user",
            parts: [{ text: message }],
          },
        ],
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
        generationConfig: {
          temperature: config.config?.temperature || 0.7,
          topK: config.config?.topK || 40,
          topP: config.config?.topP || 0.95,
          maxOutputTokens: config.config?.maxTokens || 500,
        },
      };
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Gemini API error: ${response.statusText} - ${JSON.stringify(errorData)}`,
      );
    }

    const data = await response.json();

    // Extract response text from Gemini API response
    if (data.candidates && data.candidates.length > 0) {
      const candidate = data.candidates[0];
      if (
        candidate.content &&
        candidate.content.parts &&
        candidate.content.parts.length > 0
      ) {
        return candidate.content.parts[0].text;
      }
    }

    return "I received your message.";
  } catch (error) {
    console.error("Gemini error:", error);
    throw error; // Re-throw to allow fallback to Groq
  }
}

/**
 * Groq API integration (fallback)
 * Documentation: https://console.groq.com/docs
 * Fast inference with Llama models
 */
async function handleGroq(
  message: string,
  config: ChatbotConfig,
  conversationId?: string,
): Promise<string> {
  if (!config.groqApiKey) {
    throw new Error("Groq: Missing API key");
  }

  try {
    // Build system instruction with knowledge base if available
    let systemInstruction =
      config.config?.systemPrompt ||
      "You are a helpful customer support assistant for a business. Be friendly, concise, and accurate.";

    if (config.knowledgeBase) {
      systemInstruction = `${systemInstruction}\n\nKnowledge Base:\n${config.knowledgeBase}\n\nUse the knowledge base above to answer questions accurately. If the information is not in the knowledge base, politely say you don't have that information and suggest contacting support directly.`;
    }

    const model = config.config?.groqModel || "llama-3.3-70b-versatile";

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.groqApiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: message },
        ],
        temperature: config.config?.temperature || 0.7,
        max_tokens: config.config?.maxTokens || 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Groq API error: ${response.statusText} - ${JSON.stringify(errorData)}`,
      );
    }

    const data = await response.json();

    if (data.choices && data.choices.length > 0) {
      return data.choices[0].message.content;
    }

    return "I received your message.";
  } catch (error) {
    console.error("Groq error:", error);
    throw error;
  }
}
