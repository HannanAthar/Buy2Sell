// services/geminiService.js - Gemini AI service for intelligent query understanding
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Process user query with Gemini AI to extract intent, entities, and generate database query
 * @param {string} userQuery - The user's natural language query
 * @param {object} conversationContext - Previous conversation context
 * @returns {Promise<object>} Parsed query with intent, entities, and filters
 */
export async function processQueryWithGemini(userQuery, conversationContext = {}) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const systemPrompt = `
    USER QUERY: "${userQuery}"
    
    CLASSIFY THIS QUERY INTO ONE CATEGORY:
    
    1. PRODUCT_SEARCH - User wants to find products (e.g., "tote bag", "red shoes", "maria b suit")
    2. DESIGNER_INFO - User asks about designers (e.g., "tabeen zahra products", "highest rated designer")
    3. WEBSITE_INFO - User asks about website features/services (e.g., "how to join", "contact admin", "platform fees", "return policy")
    4. NON_WEBSITE - User asks unrelated questions (e.g., "how are you", "weather", "time", "jokes")
    
    Return ONLY JSON format:
    {
      "intent": "PRODUCT_SEARCH | DESIGNER_INFO | WEBSITE_INFO | NON_WEBSITE",
      "keywords": ["list", "of", "main", "keywords"],
      "requiresInstructions": true/false,
      "searchTerm": "original keywords if needed"
    }
    `;

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from response (handle markdown code blocks)
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '').trim();
    }

    const parsedQuery = JSON.parse(jsonText);

    // Normalize intent if needed
    if (parsedQuery.intent === 'NON_RELATED') parsedQuery.intent = 'NON_WEBSITE'; 

    // Ensure searchTerm is present for backward compatibility or ease of use
    if (!parsedQuery.searchTerm && parsedQuery.keywords) {
        parsedQuery.searchTerm = Array.isArray(parsedQuery.keywords) ? parsedQuery.keywords.join(' ') : parsedQuery.keywords;
    }

    console.log('[Gemini] Processed query:', {
      original: userQuery,
      parsed: parsedQuery
    });

    return parsedQuery;

  } catch (error) {
    console.error('[Gemini] Error processing query:', error);
    
    // Fallback to basic parsing
    return {
      intent: 'PRODUCT_SEARCH',
      searchTerm: userQuery,
      keywords: userQuery.split(' '),
      context: {}
    };
  }
}

/**
 * Use Gemini to understand and correct natural language queries
 */
export async function correctQueryWithGemini(query) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const prompt = `Correct spelling: "${query}" -> Return ONLY corrected text.`;
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    return query; 
  }
}

/**
 * Generate natural language response from query results
 */
export async function generateResponseWithGemini(userQuery, queryResult, intent) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `You are a helpful shopping assistant. Generate a natural, friendly response.
    User Query: "${userQuery}"
    Intent: ${intent}
    Results: ${JSON.stringify(queryResult, null, 2)}
    keep it concise.`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();

  } catch (error) {
    console.error('[Gemini] Error generating response:', error);
    return null; 
  }
}

// WEBSITE KNOWLEDGE BASE
const WEBSITE_KNOWLEDGE = `
BUY2SELL WEBSITE INFORMATION:

1. REGISTRATION PROCESS:
   - Designers: Click "Join as Designer" -> Fill registration form -> Submit portfolio -> Get verified -> Start selling designs
   - Resellers: Click "Join as Reseller" -> Submit business details -> Upload products -> Start reselling

2. CONTACT INFORMATION:
   - Email: support@buy2sell.com
   - Phone: +92-XXX-XXXXXXX
   - Live Chat: Available on website footer
   - Address: Lahore, Pakistan

3. PLATFORM FEES:
   - Designers: 15% commission per sale
   - Resellers: 10% commission per sale
   - Customers: No fees for buying

4. CUSTOM PRODUCTS:
   - Go to "Custom Design Studio" in menu
   - Choose product type (bag, dress, etc.)
   - Select materials and upload design
   - Get quote and place order

5. RETURN & SHIPPING:
   - 7-day return policy
   - Free shipping on orders above Rs. 5000
   - 3-7 days delivery in Pakistan

6. PAYMENT METHODS:
   - Credit/Debit Cards
   - Bank Transfer
   - JazzCash, EasyPaisa
   - Cash on Delivery
`;

export async function generateWebsiteInfoResponse(userQuery) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const infoPrompt = `
      WEBSITE KNOWLEDGE BASE:
      ${WEBSITE_KNOWLEDGE}
      
      USER QUESTION: "${userQuery}"
      
      INSTRUCTIONS:
      1. Answer using ONLY the information in WEBSITE KNOWLEDGE BASE
      2. Be specific and helpful
      3. If information is not available, say: "I don't have specific information about that. Please contact support@buy2sell.com"
      4. Keep response concise (3-5 sentences max)
      
      RESPONSE:
    `;
    const result = await model.generateContent(infoPrompt);
    return result.response.text();
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Please check our website FAQ for more details.";
  }
}

export async function generateRejectResponse() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const rejectPrompt = `
      User asked a non-website related question.
      
      Generate a polite response that:
      1. States you only help with Buy2Sell website
      2. Suggests website-related topics
      3. Example: "I specialize in Buy2Sell assistance. I can help you find products, designer information, or explain website features."
      
      Generate response:
    `;
    const result = await model.generateContent(rejectPrompt);
    return result.response.text();
  } catch (error) {
    return "I specialize in Buy2Sell assistance."; // Fallback
  }
}
