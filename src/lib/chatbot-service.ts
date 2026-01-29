/**
 * Chatbot Service
 * Handles integration with various chatbot providers
 * Each website can have its own chatbot configuration
 */

import { supabase, getWebsiteId } from './supabase';

export type ChatbotProvider = 'gemini';

export interface ChatbotConfig {
  provider: ChatbotProvider;
  apiKey?: string;
  botId?: string;
  webhookUrl?: string;
  config?: Record<string, any>;
  knowledgeBase?: string;
}

export interface ChatMessage {
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

/**
 * Get chatbot configuration for current website
 */
export async function getChatbotConfig(): Promise<ChatbotConfig | null> {
  try {
    const websiteId = await getWebsiteId();
    if (!websiteId) return null;

    const { data, error } = await supabase
      .from('chat_support_config')
      .select('chatbot_provider, chatbot_api_key, chatbot_bot_id, chatbot_webhook_url, chatbot_config, knowledge_base')
      .eq('website_id', websiteId)
      .single();

    if (error || !data) return null;

    // Knowledge base is now always from Google Sheets (Apps Script URL)
    let knowledgeBase = undefined;
    const kbUrl = data.knowledge_base;
    if (kbUrl && (kbUrl.startsWith('http://') || kbUrl.startsWith('https://'))) {
      // It's a Google Sheets Apps Script URL, fetch it with website parameter
      try {
        const websiteId = await getWebsiteId();
        // Get website subdomain from database to append to URL
        if (websiteId) {
          const { data: websiteData } = await supabase
            .from('websites')
            .select('subdomain')
            .eq('id', websiteId)
            .single();
          
          const website = websiteData?.subdomain || 'default';
          const sheetsUrl = `${kbUrl}${kbUrl.includes('?') ? '&' : '?'}website=${website}`;
          
          const response = await fetch(sheetsUrl);
          if (response.ok) {
            knowledgeBase = await response.text();
          } else {
            console.warn('Failed to fetch knowledge base from Google Sheets:', sheetsUrl);
          }
        }
      } catch (err) {
        console.error('Error fetching knowledge base from Google Sheets:', err);
      }
    }

    // Use environment variable for Gemini API key (same as AI content generation)
    const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || data.chatbot_api_key || undefined;

    return {
      provider: 'gemini' as ChatbotProvider,
      apiKey: geminiApiKey,
      botId: undefined,
      webhookUrl: undefined,
      config: (data.chatbot_config as Record<string, any>) || {},
      knowledgeBase: knowledgeBase,
    };
  } catch (error) {
    console.error('Error fetching chatbot config:', error);
    return null;
  }
}

/**
 * Send message to chatbot and get response
 */
export async function sendChatbotMessage(
  message: string,
  conversationId?: string
): Promise<string> {
  const config = await getChatbotConfig();
  
  if (!config) {
    return "I'm sorry, I'm having trouble connecting. Please try again later.";
  }

  // Only Gemini is supported now
  return handleGemini(message, config, conversationId);
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
  conversationId?: string
): Promise<string> {
  if (!config.apiKey) {
    console.error('Gemini: Missing apiKey');
    return "I'm sorry, I'm having trouble connecting. Please make sure the Gemini API key is configured.";
  }

  try {
    // Build system instruction with knowledge base if available
    let systemInstruction = config.config?.systemPrompt || 'You are a helpful customer support assistant for a business. Be friendly, concise, and accurate.';
    
    // If knowledge base exists, prepend it to system instruction
    if (config.knowledgeBase) {
      systemInstruction = `${systemInstruction}\n\nKnowledge Base:\n${config.knowledgeBase}\n\nUse the knowledge base above to answer questions accurately. If the information is not in the knowledge base, politely say you don't have that information and suggest contacting support directly.`;
    }

    // Use Gemini API via server proxy or direct API call
    const model = config.config?.model || 'gemini-2.5-flash';
    
    // Try to use server proxy first (if available), otherwise use direct API
    let apiUrl: string;
    let headers: Record<string, string>;
    let body: any;

    // Check if we have a server proxy endpoint
    const useProxy = window.location.hostname !== 'localhost' || import.meta.env.VITE_USE_GEMINI_PROXY === 'true';
    
    if (useProxy) {
      // Use server proxy (recommended for production)
      apiUrl = '/api/gemini';
      headers = {
        'Content-Type': 'application/json',
      };
      body = {
        model: model,
        contents: [
          {
            role: 'user',
            parts: [{ text: message }]
          }
        ],
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        generationConfig: {
          temperature: config.config?.temperature || 0.7,
          topK: config.config?.topK || 40,
          topP: config.config?.topP || 0.95,
          maxOutputTokens: config.config?.maxTokens || 500,
        }
      };
    } else {
      // Direct API call (for development)
      apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`;
      headers = {
        'Content-Type': 'application/json',
      };
      body = {
        contents: [
          {
            role: 'user',
            parts: [{ text: message }]
          }
        ],
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        generationConfig: {
          temperature: config.config?.temperature || 0.7,
          topK: config.config?.topK || 40,
          topP: config.config?.topP || 0.95,
          maxOutputTokens: config.config?.maxTokens || 500,
        }
      };
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Gemini API error: ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    
    // Extract response text from Gemini API response
    if (data.candidates && data.candidates.length > 0) {
      const candidate = data.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        return candidate.content.parts[0].text;
      }
    }
    
    return 'I received your message.';
  } catch (error) {
    console.error('Gemini error:', error);
    return "I'm sorry, I'm having trouble processing your message. Please try again later.";
  }
}

