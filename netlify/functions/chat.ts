import { Handler } from '@netlify/functions';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API safely with the backend environment variable
const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export const handler: Handler = async (event, context) => {
  // 1. Allow only POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    // 2. Validate API Key configuration
    if (!genAI) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Gemini API key is missing in Netlify environment variables.' }),
      };
    }

    // 3. Parse incoming user message
    const { message } = JSON.parse(event.body || '{}');
    if (!message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Message payload is required' }),
      };
    }

    // 4. Call Gemini Model (using gemini-pro or your chosen model)
    // To this:
    // Update this line exactly to:
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(message);
    const responseText = result.response.text();

    // 5. Return response to your frontend React app
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ response: responseText }),
    };

  } catch (error: any) {
    console.error('Backend Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal Server Error', 
        details: error.message || error 
      }),
    };
  }
};