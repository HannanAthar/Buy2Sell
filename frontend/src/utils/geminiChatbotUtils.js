// utils/geminiChatbotUtils.js - Frontend utilities for Gemini-powered chatbot
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Process query using Gemini AI
 * @param {string} query - User query
 * @param {object} context - Conversation context
 * @returns {Promise<object>} AI-processed query results
 */
export async function processQueryWithAI(query, context = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}/chatbot/ai/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query,
        context: context
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('[Gemini Chatbot] Error:', error);
    throw error;
  }
}

/**
 * Format AI response for display
 * @param {object} aiData - Data from Gemini API
 * @returns {object} Formatted data for chatbot component
 */
export function formatAIResponse(aiData) {
  const { parsedQuery, results, aiResponse, spellingCorrections } = aiData;

  // Map results to chatbot format
  let formattedData = {
    intent: parsedQuery.intent,
    matchConfidence: parsedQuery.confidence || 'medium',
    spellingCorrections: spellingCorrections || {}
  };

  // Format based on result type
  if (results.type === 'text_only' || results.showProducts === false) {
    formattedData.products = [];
    formattedData.total = 0;
    formattedData.aiResponse = results.message;
  } else if (results.type === 'products') {
    formattedData.products = results.products || [];

    formattedData.total = results.total || 0;
    formattedData.priceFilterApplied = !!(parsedQuery.priceRange?.min || parsedQuery.priceRange?.max);
  } else if (results.type === 'designers') {
    formattedData.designers = results.designers || [];
    formattedData.total = results.total || 0;
  } else if (results.type === 'designer_products') {
    formattedData.designer = results.designer;
    formattedData.products = results.products || [];
    formattedData.total = results.total || 0;
    formattedData.products = results.products || [];
    formattedData.total = results.total || 0;
    formattedData.isStockQuery = true;
  } else if (results.type === 'website_info') { // NEW
    formattedData.products = [];
    formattedData.total = 0;
    // content handled by aiResponse
  } else if (results.type === 'informational') { // NEW
    formattedData.steps = results.steps;
    formattedData.guide = results.guide;
    formattedData.title = results.title;
  } else if (results.type === 'designer_info') { // NEW
    formattedData.designer = results.designer;
    formattedData.products = results.products || [];
    formattedData.total = results.products?.length || 0;
  } else if (results.type === 'reject') {
      // Just pass through, the aiResponse will handle the text
  }

  // Use AI-generated response or fallback to template
  formattedData.aiResponse = aiResponse;

  return formattedData;
}

