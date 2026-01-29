/**
 * Gemini AI Integration
 * Using @google/generative-ai package (official Google package)
 * Adapted to match working implementation pattern
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

// @ts-ignore - Vite environment variable
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

export interface AIContentRequest {
  businessName: string;
  businessType: string;
}

export interface GeneratedContent {
  hero: {
    title: string;
    subtitle: string;
    buttonText: string;
  };
  about: {
    heading: string;
    subheading: string;
    description: string;
  };
  whyChooseUs: {
    heading: string;
    subheading: string;
    reasons: Array<{
      title: string;
      description: string;
      icon: string;
    }>;
  };
  menu: {
    heading: string;
    subheading: string;
    categories: Array<{
      name: string;
      description: string;
    }>;
    items: Array<{
      name: string;
      description: string;
      price: number;
      category: string;
    }>;
  };
  testimonials: Array<{
    customer_name: string;
    customer_role: string;
    testimonial_text: string;
    rating: number;
  }>;
}

export async function generateWebsiteContent(request: AIContentRequest): Promise<GeneratedContent> {
  if (!apiKey) {
    console.warn("[GeminiService] API Key is missing. Skipping AI content generation.");
    throw new Error('Gemini API key not configured. Please set VITE_GEMINI_API_KEY in your .env file');
  }

  const prompt = `Generate complete website content for a ${request.businessType} called "${request.businessName}".

Return ONLY a valid JSON object with this exact structure (no markdown, no code blocks, just pure JSON):

{
  "hero": {
    "title": "A compelling headline (max 10 words)",
    "subtitle": "A descriptive tagline (max 20 words)",
    "buttonText": "Call to action button text"
  },
  "about": {
    "heading": "About section heading",
    "subheading": "About section subheading",
    "description": "A detailed description of the business (3-4 sentences)"
  },
  "whyChooseUs": {
    "heading": "Why Choose Us heading",
    "subheading": "Why Choose Us subheading",
    "reasons": [
      {
        "title": "Reason title (3-5 words)",
        "description": "Reason description (1-2 sentences)",
        "icon": "chef-hat"
      }
    ]
  },
  "menu": {
    "heading": "Menu section heading",
    "subheading": "Menu section subheading",
    "categories": [
      {
        "name": "Category name",
        "description": "Category description"
      }
    ],
    "items": [
      {
        "name": "Item name",
        "description": "Item description (1 sentence)",
        "price": 15.99,
        "category": "Category name"
      }
    ]
  },
  "testimonials": [
    {
      "customer_name": "Customer full name",
      "customer_role": "Customer role/title",
      "testimonial_text": "Testimonial text (2-3 sentences)",
      "rating": 5
    }
  ]
}

Generate 3-4 reasons for whyChooseUs, 3-4 menu categories, 8-12 menu items, and 4-6 testimonials.`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Use gemini-2.5-flash or fallback to gemini-1.5-flash
    let model;
    try {
      model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    } catch {
      model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    }

    // Generate content with JSON response format
    const generationConfig = {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192, // Increased to handle larger responses
      responseMimeType: "application/json",
    };

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig,
    });

    const response = await result.response;
    let text = response.text();

    if (!text) {
      throw new Error('No content generated from Gemini API');
    }

    // Clean up the response - remove markdown code blocks if present
    text = text.trim();
    
    // Remove markdown code block markers if present
    if (text.startsWith('```json')) {
      text = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
    } else if (text.startsWith('```')) {
      text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Try to find JSON object in the response if it's wrapped in other text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      text = jsonMatch[0];
    }

    // Log the response for debugging (first 500 chars)
    console.log('📝 Gemini response preview:', text.substring(0, 500) + (text.length > 500 ? '...' : ''));

    // Parse JSON response with better error handling
    let parsedResponse: GeneratedContent;
    try {
      parsedResponse = JSON.parse(text) as GeneratedContent;
    } catch (parseError: any) {
      console.error('❌ JSON Parse Error:', parseError.message);
      console.error('📄 Response text (first 1000 chars):', text.substring(0, 1000));
      console.error('📄 Response length:', text.length);
      throw new Error(`Invalid JSON response from Gemini: ${parseError.message}. Response may be truncated.`);
    }

    console.log('✅ Successfully generated content using Gemini');
    return parsedResponse;
  } catch (error: any) {
    console.error('[GeminiService] Error generating website content:', error);
    
    // Provide helpful error messages
    if (error.message?.includes('API key')) {
      throw new Error('Invalid Gemini API key. Please check your VITE_GEMINI_API_KEY in .env file');
    }
    
    if (error.message?.includes('model')) {
      throw new Error('Gemini model not available. Please try again or check your API key permissions');
    }
    
    throw new Error(error.message || 'Failed to generate content. Please try again.');
  }
}

/**
 * Debug function: List all available models for your API key
 */
export async function listAvailableModels() {
  console.warn('listAvailableModels: Use gemini-2.5-flash or gemini-1.5-flash model.');
  return null;
}
