/**
 * Vercel Serverless Function
 * Proxies Gemini API requests (required - Google blocks browser requests)
 */

export default async function handler(req: any, res: any) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get API key from environment variable
    // Note: VITE_ prefix vars are only available client-side, use GEMINI_API_KEY in serverless functions
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'Gemini API key not configured. Set VITE_GEMINI_API_KEY in Vercel environment variables' 
      });
    }

    const { model = 'gemini-2.5-flash', ...body } = req.body;
    
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error: any) {
    console.error('Gemini proxy error:', error);
    res.status(500).json({ 
      error: 'Failed to proxy Gemini API request',
      message: error.message 
    });
  }
}

