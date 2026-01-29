/**
 * Fast Chatbot Service - No Database Storage
 * Uses environment variables, caching, and static files
 * Much faster than database lookups
 */

import { detectWebsiteId, detectWebsiteSubdomain } from './website-detector';

export type ChatbotProvider = 'simple' | 'botpress' | 'gemini';

export interface ChatbotConfig {
  provider: ChatbotProvider;
  apiKey?: string;
  botId?: string;
  config?: Record<string, any>;
  knowledgeBase?: string;
  knowledgeBaseUrl?: string; // URL to fetch knowledge base from
}

// Cache for chatbot responses (in-memory)
const responseCache = new Map<string, { response: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Cache for knowledge base (in-memory)
const knowledgeBaseCache = new Map<string, { content: string; timestamp: number }>();
const KB_CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Get chatbot config from environment variables (NO DATABASE)
 * Much faster - no DB query needed
 */
export async function getChatbotConfigFast(): Promise<ChatbotConfig | null> {
  try {
    // Get provider from environment or default to 'gemini'
    const provider = (import.meta.env.VITE_CHATBOT_PROVIDER || 'gemini') as ChatbotProvider;
    
    // Get API keys from environment variables (NO DATABASE STORAGE)
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || 
                   import.meta.env.VITE_BOTPRESS_API_KEY || 
                   '';
    
    const botId = import.meta.env.VITE_BOTPRESS_BOT_ID || '';
    
    // Get knowledge base pattern from env (supports {website} placeholder)
    // Examples:
    // - /knowledge-bases/{website}.txt
    // - https://cdn.com/kb/{website}.txt
    // - /api/knowledge-base?website={website}
    const knowledgeBasePattern = import.meta.env.VITE_KNOWLEDGE_BASE_PATTERN || 
                                 import.meta.env.VITE_KNOWLEDGE_BASE_URL || 
                                 '/knowledge-bases/{website}.txt';
    
    // Get current website subdomain
    const websiteSubdomain = await detectWebsiteSubdomain();
    const website = websiteSubdomain || 'default';
    
    // Replace {website} placeholder with actual website subdomain
    const knowledgeBaseUrl = knowledgeBasePattern.replace('{website}', website);
    
    // Get config from env (JSON string)
    let config: Record<string, any> = {};
    if (import.meta.env.VITE_CHATBOT_CONFIG) {
      try {
        config = JSON.parse(import.meta.env.VITE_CHATBOT_CONFIG);
      } catch (e) {
        console.warn('Invalid VITE_CHATBOT_CONFIG JSON');
      }
    }

    return {
      provider,
      apiKey: apiKey || undefined,
      botId: botId || undefined,
      config,
      knowledgeBaseUrl: knowledgeBaseUrl || undefined,
    };
  } catch (error) {
    console.error('Error getting chatbot config:', error);
    return null;
  }
}

/**
 * Fetch knowledge base from URL (static file, CDN, or API)
 * Cached for 1 hour per website
 */
async function fetchKnowledgeBase(url: string): Promise<string> {
  // Check cache first (cached per website)
  const cached = knowledgeBaseCache.get(url);
  if (cached && Date.now() - cached.timestamp < KB_CACHE_TTL) {
    console.log(`📚 Using cached knowledge base: ${url}`);
    return cached.content;
  }

  try {
    console.log(`📥 Fetching knowledge base: ${url}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      // If specific website file not found, try default
      if (response.status === 404 && !url.includes('default')) {
        const defaultUrl = url.replace(/\/[^/]+\.txt$/, '/default.txt');
        console.log(`⚠️ Website-specific KB not found, trying default: ${defaultUrl}`);
        return fetchKnowledgeBase(defaultUrl);
      }
      throw new Error(`Failed to fetch knowledge base: ${response.statusText}`);
    }
    
    const content = await response.text();
    
    // Cache it (per website)
    knowledgeBaseCache.set(url, {
      content,
      timestamp: Date.now(),
    });
    
    console.log(`✅ Knowledge base loaded: ${url} (${content.length} chars)`);
    return content;
  } catch (error) {
    console.error(`❌ Error fetching knowledge base from ${url}:`, error);
    // Try default as fallback
    if (!url.includes('default')) {
      const defaultUrl = url.replace(/\/[^/]+\.txt$/, '/default.txt');
      console.log(`🔄 Trying default knowledge base: ${defaultUrl}`);
      try {
        return await fetchKnowledgeBase(defaultUrl);
      } catch (e) {
        // If default also fails, return empty
        return '';
      }
    }
    return '';
  }
}

/**
 * Send message to chatbot with caching
 * Much faster with response caching
 */
export async function sendChatbotMessageFast(
  message: string,
  conversationId?: string
): Promise<string> {
  const config = await getChatbotConfigFast();
  
  if (!config) {
    return "I'm sorry, I'm having trouble connecting. Please try again later.";
  }

  // Check response cache (for identical messages)
  const cacheKey = `${config.provider}-${message}`;
  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.response;
  }

  // Fetch knowledge base from Google Sheets if URL is provided
  let knowledgeBase = '';
  if (config.knowledgeBaseUrl) {
    // Get current website subdomain
    const websiteSubdomain = await detectWebsiteSubdomain();
    const website = websiteSubdomain || 'default';
    
    // Append website parameter to Google Sheets Apps Script URL
    const sheetsUrl = `${config.knowledgeBaseUrl}${config.knowledgeBaseUrl.includes('?') ? '&' : '?'}website=${website}`;
    
    knowledgeBase = await fetchKnowledgeBase(sheetsUrl);
  }

  let response: string;

  switch (config.provider) {
    case 'simple':
      response = handleSimpleBotFast(message, knowledgeBase);
      break;
    
    case 'botpress':
      response = await handleBotpressFast(message, config, conversationId);
      break;
    
    case 'gemini':
      response = await handleGeminiFast(message, config, conversationId, knowledgeBase);
      break;
    
    default:
      response = handleSimpleBotFast(message, knowledgeBase);
  }

  // Cache the response
  responseCache.set(cacheKey, {
    response,
    timestamp: Date.now(),
  });

  return response;
}

/**
 * Simple rule-based bot (fast, no API calls)
 */
function handleSimpleBotFast(message: string, knowledgeBase?: string): string {
  const lowerInput = message.toLowerCase();

  // If knowledge base exists, try to extract relevant info
  if (knowledgeBase) {
    const kbLower = knowledgeBase.toLowerCase();
    
    if (lowerInput.includes('hour') || lowerInput.includes('open') || lowerInput.includes('time')) {
      const hourMatch = kbLower.match(/hour[s]?[:\s]+([^\.\n]+)/i) || kbLower.match(/open[s]?[:\s]+([^\.\n]+)/i);
      if (hourMatch) {
        return hourMatch[1].trim() || "Please check our business hours.";
      }
    }
    
    if (lowerInput.includes('location') || lowerInput.includes('address') || lowerInput.includes('where')) {
      const locationMatch = kbLower.match(/location[:\s]+([^\.\n]+)/i) || kbLower.match(/address[:\s]+([^\.\n]+)/i);
      if (locationMatch) {
        return locationMatch[1].trim() || "Please check our location.";
      }
    }
  }

  // Fallback responses
  if (lowerInput.includes('menu') || lowerInput.includes('food') || lowerInput.includes('product')) {
    return "You can view our full selection in the Menu section above!";
  } else if (lowerInput.includes('delivery') || lowerInput.includes('order')) {
    return "We offer delivery services. Please check our delivery options in the menu.";
  }

  return "Thanks for your message! One of our team members will get back to you shortly.";
}

/**
 * Botpress integration (fast with caching)
 */
async function handleBotpressFast(
  message: string,
  config: ChatbotConfig,
  conversationId?: string
): Promise<string> {
  if (!config.botId || !config.apiKey) {
    return handleSimpleBotFast(message);
  }

  try {
    const apiUrl = `https://api.botpress.cloud/v1/chat/${config.botId}/messages`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        userId: conversationId || `user-${Date.now()}`,
        type: 'text',
        text: message,
        conversationId: conversationId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Botpress API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.responses?.[0]?.text || data.text || 'I received your message.';
  } catch (error) {
    console.error('Botpress error:', error);
    return handleSimpleBotFast(message);
  }
}

/**
 * Gemini integration (fast with server proxy)
 */
async function handleGeminiFast(
  message: string,
  config: ChatbotConfig,
  conversationId?: string,
  knowledgeBase?: string
): Promise<string> {
  if (!config.apiKey) {
    return handleSimpleBotFast(message, knowledgeBase);
  }

  try {
    // Build system instruction
    let systemInstruction = config.config?.systemPrompt || 
      'You are a helpful customer support assistant. Be friendly, concise, and accurate.';
    
    if (knowledgeBase) {
      systemInstruction = `${systemInstruction}\n\nKnowledge Base:\n${knowledgeBase}\n\nUse the knowledge base above to answer questions accurately.`;
    }

    const model = config.config?.model || 'gemini-2.5-flash';
    
    // Use server proxy (faster, API key hidden)
    const apiUrl = '/api/gemini';
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        contents: [{
          role: 'user',
          parts: [{ text: message }]
        }],
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        generationConfig: {
          temperature: config.config?.temperature || 0.7,
          maxOutputTokens: config.config?.maxTokens || 500,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    }
    
    return 'I received your message.';
  } catch (error) {
    console.error('Gemini error:', error);
    return handleSimpleBotFast(message, knowledgeBase);
  }
}

/**
 * Clear caches (useful for testing or when knowledge base updates)
 */
export function clearChatbotCache() {
  responseCache.clear();
  knowledgeBaseCache.clear();
}

