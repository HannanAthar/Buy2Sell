// utils/chatbotUtils.js - Utility functions for chatbot AI assistant

// Intent classification based on message patterns
// Intent classification based on message patterns
export function classifyIntent(message) {
  const lowerMsg = message.toLowerCase().trim();
  
  // 0. Contextual Follow-ups (Handled in component, but we tag them here)
  if (lowerMsg.match(/^(how many|how much|price|cost|stock|available)$/i) ||
      lowerMsg.match(/^how many (are there|do you have)/i)) {
    return 'CONTEXT_FOLLOWUP';
  }

  // 0.5. Contextual follow-ups for ratings (e.g., "and lowest" after "highest")
  if (lowerMsg.match(/^(and|also|what about|how about)\s+(lowest|worst|poorest|least)/i) ||
      lowerMsg.match(/^(and|also)\s+(highest|best|top)/i)) {
    return 'CONTEXT_FOLLOWUP';
  }

  // 1. Customization (Specific keywords)
  if (lowerMsg.match(/custom|design my own|create|personalize|customize/i)) {
    return 'CUSTOMIZATION_HELP';
  }

  // 2. Registration (Specific keywords)
  if (lowerMsg.match(/register|sign up|create account|join|become a/i)) {
    return 'REGISTRATION_HELP';
  }

  // 3. Reseller Info
  if (lowerMsg.match(/reseller|pre-loved|secondhand|used|preloved/i)) {
    return 'RESELLER_INFO';
  }

  // 4. Specific Designer Rating Query (MUST come before TOP_RATED_DESIGNERS)
  // "what is the rating of [designer name]", "rating of [designer name]"
  if (lowerMsg.match(/(what is|what's|tell me|show me).*(the )?rating (of|for)/i) ||
      lowerMsg.match(/rating (of|for) [a-z\s_]+(designer)?$/i) ||
      lowerMsg.match(/^(the )?rating (of|for)/i)) {
    return 'DESIGNER_RATING_QUERY';
  }

  // 5. Lowest Rating Query (MUST come before TOP_RATED_DESIGNERS)
  if (lowerMsg.match(/(lowest|worst|poorest|least).*(designer|designers|rating)/i) ||
      lowerMsg.match(/(designer|designers).*(lowest|worst|poorest|least)/i) ||
      lowerMsg.match(/who (has|have) (the )?(lowest|worst|poorest|least) (rating|ratings)/i)) {
    return 'LOWEST_RATED_DESIGNERS';
  }

  // 6. Top-Rated Designers Query (highest/best)
  if (lowerMsg.match(/(top|best|highest|rated|rating).*(designer|designers)/i) ||
      lowerMsg.match(/(designer|designers).*(top|best|highest|rated|rating)/i) ||
      lowerMsg.match(/who (has|have) (the )?(highest|best|top) (rating|ratings)/i)) {
    return 'TOP_RATED_DESIGNERS';
  }

  // 7. Designer Product Search (MUST come before DESIGNER_INFO)
  // "designer bags", "designer shoes", "designer cloths", "give all designers bag"
  // These should return PRODUCTS by designers, not designer profiles
  if (lowerMsg.match(/designer\s+(bag|bags|shoe|shoes|sneaker|sneakers|cloth|cloths|clothing|dress|dresses|suit|suits|jacket|jackets|pant|pants|jogger|joggers|hoodie|hoodies)/i) ||
      lowerMsg.match(/(give|show|list|all)\s+(designers?|designer)\s+(bag|bags|shoe|shoes|sneaker|sneakers|cloth|cloths|clothing|dress|dresses|suit|suits|jacket|jackets|pant|pants|jogger|joggers|hoodie|hoodies)/i) ||
      lowerMsg.match(/any\s+designer\s+(bag|bags|shoe|shoes|sneaker|sneakers|cloth|cloths|clothing|dress|dresses|suit|suits|jacket|jackets|pant|pants|jogger|joggers|hoodie|hoodies)/i)) {
    return 'DESIGNER_PRODUCT_SEARCH';
  }

  // 8. List All Designers Query (MUST come before specific designer queries)
  // "any designers", "how many designers", "list designers", "show me designers"
  if (lowerMsg.match(/^(any|all|list|show|show me|give me)\s+designers?$/i) ||
      lowerMsg.match(/how many designers?/i) ||
      lowerMsg.match(/designers?\s+(are there|do you have|available)/i)) {
    return 'LIST_ALL_DESIGNERS';
  }

  // 8.5. Specific Designer Query (name + designer keyword)
  // "[name] designer", "designer [name]", "[name] - Designer"
  if (lowerMsg.match(/^[a-z\s_]+(designer|designers)$/i) ||
      lowerMsg.match(/^(designer|designers)\s+[a-z\s_]+$/i) ||
      lowerMsg.match(/[a-z\s_]+\s*-\s*(designer|designers)/i)) {
    return 'SPECIFIC_DESIGNER_QUERY';
  }

  // 8.6. Designer Info / Designer Products
  // "products of designer X", "designer X", "who made this", "give all designers"
  if (lowerMsg.match(/(designer|brand|created by|made by|from).*(designer|brand|collection)/i) ||
      lowerMsg.match(/products (of|by|from)/i)) {
    return 'DESIGNER_INFO';
  }

  // 9. Stock Availability Query (general "what's in stock")
  if (lowerMsg.match(/^(what'?s|what is|show me|list).*(in stock|available|stock right now)/i) ||
      lowerMsg.match(/what'?s in stock/i)) {
    return 'STOCK_AVAILABILITY_QUERY';
  }

  // 10. Stock Query (specific product)
  if (lowerMsg.match(/(available|in stock|out of stock|quantity|how many|do you have|got any|is there).*(product|item|jacket|shirt|shoe|bag|dress|jeans|coat|stock)/i) ||
      (lowerMsg.includes('stock') && !lowerMsg.match(/what'?s in stock/i))) {
    return 'PRODUCT_STOCK_QUERY';
  }

  // 11. Designer Products Query (specific designer)
  if (lowerMsg.match(/(products|items|designs).*(by|from|of)\s+[a-z\s]+/i) ||
      lowerMsg.match(/(show|list|what).*(products|items).*(by|from|of)\s+[a-z\s]+/i) ||
      lowerMsg.match(/^[a-z\s]+\s+(products|items|designs)$/i)) {
    return 'DESIGNER_PRODUCTS_QUERY';
  }

  // 12. Cheapest/Lowest Price Query
  if (lowerMsg.match(/(cheapest|lowest|most affordable|least expensive|budget).*(bag|shoe|sneaker|product|item|clothing|dress)/i) ||
      lowerMsg.match(/(how much are|what are|show me).*(cheapest|lowest|most affordable)/i)) {
    return 'CHEAPEST_PRODUCT_QUERY';
  }

  // 13. Highest Rated Product Query
  if (lowerMsg.match(/(highest|best|top|most).*rated.*(sneaker|shoe|bag|product|item)/i) ||
      lowerMsg.match(/(sneaker|shoe|bag|product).*(highest|best|top).*rated/i)) {
    return 'HIGHEST_RATED_PRODUCT_QUERY';
  }

  // 14. Price Query
  if (lowerMsg.match(/(price|cost|how much|worth).*(product|item|jacket|shirt|shoe|bag|dress)/i) ||
      lowerMsg.includes('price')) {
    return 'PRODUCT_PRICE_QUERY';
  }

  // 15. Compare Products
  if (lowerMsg.match(/compare|comparison|difference between/i)) {
    return 'PRODUCT_COMPARE';
  }

  // 16. DEFAULT FALLBACK: Product Search
  // If it's not a greeting or garbage, assume it's a search
  const greetings = ['hi', 'hello', 'hey', 'start', 'help', 'menu'];
  if (!greetings.includes(lowerMsg) && lowerMsg.length > 2) {
    return 'PRODUCT_SEARCH';
  }

  return 'GENERAL_INFO';
}

// Extract product keywords intelligently with spelling normalization
export function extractProductKeywords(message) {
  // First normalize spelling
  let normalizedMsg = normalizeQueryWithSpelling(message);
  let cleanMsg = normalizedMsg.toLowerCase();

  // 1. Remove common conversational/question phrases
  const phrasesToRemove = [
    'is the', 'is this', 'is there', 'do you have', 'i want', 'i need', 'looking for', 'show me', 'search for',
    'how much is', 'what is the price of', 'price of', 'cost of', 'tell me about', 'can you find',
    'available', 'in stock', 'stock of', 'how many', 'products of', 'products by', 'reseller',
    'do you sell', 'can i buy', 'where is', 'tell me', 'the stock of', 'compare', 'comparison',
    'give', 'give me', 'any', 'all', 'some'
  ];
  
  phrasesToRemove.forEach(phrase => {
    cleanMsg = cleanMsg.replace(new RegExp(`\\b${phrase}\\b`, 'gi'), '');
  });

  // 2. Remove stop words (but keep "designer" if it's part of product query)
  const stopWords = [
    'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 
    'please', 'help', 'hi', 'hello', 'hey', 'available', 'stock', 'price', 'cost', 'this', 'that', 'these', 'those'
  ];

  const words = cleanMsg.split(/\s+/);
  const keywords = words.filter(w => w.length > 1 && !stopWords.includes(w));

  // 3. Reconstruct query
  const query = keywords.join(' ').trim();
  console.log('[DEBUG] Extracted keywords:', query, 'from:', message);
  return query;
}

// Extract designer name from query
export function extractDesignerName(message) {
  let cleanMsg = message.toLowerCase();
  
  // Pattern: "products by X", "products from X", "X products", "X's products"
  const byPattern = message.match(/(?:products|items|designs).*(?:by|from|of)\s+([a-z\s_]+)/i);
  if (byPattern) {
    return byPattern[1].trim();
  }
  
  const possessivePattern = message.match(/([a-z\s_]+)'s?\s+(?:products|items|designs)/i);
  if (possessivePattern) {
    return possessivePattern[1].trim();
  }
  
  // Pattern: "What products does X have?"
  const doesPattern = message.match(/(?:what|which|show|list).*(?:products|items).*(?:does|has|have)\s+([a-z\s_]+)/i);
  if (doesPattern) {
    return doesPattern[1].trim();
  }
  
  // Remove common phrases
  const phrasesToRemove = [
    'designer', 'designers', 'products of', 'products by', 'products from',
    'tell me about', 'show me', 'who is', 'what is', 'the rating of', 'rating of',
    'what products does', 'which products', 'show products', 'list products',
    'has', 'have', 'does'
  ];
  
  phrasesToRemove.forEach(phrase => {
    cleanMsg = cleanMsg.replace(new RegExp(`\\b${phrase}\\b`, 'gi'), '');
  });
  
  // Remove stop words
  const stopWords = ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'this', 'that'];
  const words = cleanMsg.split(/\s+/);
  const keywords = words.filter(w => w.length > 1 && !stopWords.includes(w));
  
  return keywords.join(' ').trim();
}

// Extract price range from message with improved pattern matching
export function extractPriceRange(message) {
  // Pattern: "under X", "below X", "less than X", "upto X", "maximum X"
  const underMatch = message.match(/(?:under|below|less than|upto|up to|maximum|max)\s+(?:rs\.?\s*)?(\d+(?:,\d+)?)/i);
  
  // Pattern: "over X", "above X", "more than X", "minimum X", "min X"
  const overMatch = message.match(/(?:over|above|more than|minimum|min)\s+(?:rs\.?\s*)?(\d+(?:,\d+)?)/i);
  
  // Pattern: "between X and Y", "from X to Y", "X to Y"
  const rangeMatch = message.match(/(?:between|from)\s+(?:rs\.?\s*)?(\d+(?:,\d+)?)\s+(?:and|to)\s+(?:rs\.?\s*)?(\d+(?:,\d+)?)/i);
  const simpleRangeMatch = message.match(/(?:rs\.?\s*)?(\d+(?:,\d+)?)\s+to\s+(?:rs\.?\s*)?(\d+(?:,\d+)?)/i);
  
  // Pattern: "low in price range from X" - interpret as "under X" or clarify
  const lowFromMatch = message.match(/low\s+(?:in\s+)?price\s+range\s+(?:from|starting\s+at)\s+(?:rs\.?\s*)?(\d+(?:,\d+)?)/i);
  
  if (rangeMatch) {
    return {
      minPrice: parseInt(rangeMatch[1].replace(/,/g, '')),
      maxPrice: parseInt(rangeMatch[2].replace(/,/g, ''))
    };
  }
  
  if (simpleRangeMatch) {
    return {
      minPrice: parseInt(simpleRangeMatch[1].replace(/,/g, '')),
      maxPrice: parseInt(simpleRangeMatch[2].replace(/,/g, ''))
    };
  }
  
  if (underMatch) {
    return {
      maxPrice: parseInt(underMatch[1].replace(/,/g, '')) - 1 // "under 3000" means < 3000
    };
  }
  
  if (overMatch) {
    return {
      minPrice: parseInt(overMatch[1].replace(/,/g, '')) + 1 // "over 2000" means > 2000
    };
  }
  
  if (lowFromMatch) {
    // "low in price range from 2000" - interpret as "under 2000" or clarify
    // For now, treat as "under 2000"
    return {
      maxPrice: parseInt(lowFromMatch[1].replace(/,/g, '')) - 1
    };
  }
  
  return null;
}

// Spelling variation mapping for common typos (expanded)
const spellingVariations = {
  'loafers': ['loofers', 'lofers', 'loffers', 'loafer', 'loofers', 'lofer'],
  'lofers': ['loofers', 'loafers', 'loffers', 'loafer', 'lofer'], // Also map to lofers directly
  'sneakers': ['sneker', 'snicker', 'sniker', 'sneakar', 'sneekers', 'sneakers', 'snikers', 'sneekers'],
  'saree': ['sari', 'saaree', 'sharee', 'sare', 'sarees'],
  'joggers': ['jogers', 'jogger', 'jogar', 'joggers', 'joggers'],
  'designer': ['desiner', 'desginer', 'dezigner', 'designer', 'desinger'],
  'unstitched': ['unstitched', 'un stitched', 'un-stitched', 'unstitch'],
  'stitched': ['stitched', 'stiched', 'stiched'],
  'clothes': ['cloths', 'clothing', 'cloth', 'clothes'],
  'shoes': ['shoe', 'shoes', 'shooes', 'shoes'],
  'bags': ['bag', 'bags', 'baggs', 'bak'],
  'bag': ['bag', 'bags', 'baggs', 'bak'],
  'hannan': ['hanna', 'hannan', 'hannan_a', 'hannan a']
};

// Levenshtein distance for fuzzy matching
function levenshteinDistance(str1, str2) {
  const matrix = [];
  const len1 = str1.length;
  const len2 = str2.length;

  for (let i = 0; i <= len2; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len1; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len2; i++) {
    for (let j = 1; j <= len1; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[len2][len1];
}

// Find closest spelling match
function findClosestSpelling(word, maxDistance = 2) {
  const lowerWord = word.toLowerCase();
  
  // First check exact variations
  for (const [correct, variations] of Object.entries(spellingVariations)) {
    if (variations.some(v => v.toLowerCase() === lowerWord)) {
      return correct;
    }
  }
  
  // Then check fuzzy matching
  let bestMatch = null;
  let bestDistance = Infinity;
  
  for (const [correct, variations] of Object.entries(spellingVariations)) {
    for (const variation of variations) {
      const distance = levenshteinDistance(lowerWord, variation.toLowerCase());
      if (distance < bestDistance && distance <= maxDistance) {
        bestDistance = distance;
        bestMatch = correct;
      }
    }
    // Also check against the correct spelling itself
    const distance = levenshteinDistance(lowerWord, correct.toLowerCase());
    if (distance < bestDistance && distance <= maxDistance) {
      bestDistance = distance;
      bestMatch = correct;
    }
  }
  
  return bestMatch || word; // Return original if no close match
}

// Normalize query with spelling corrections
export function normalizeQueryWithSpelling(query) {
  const words = query.split(/\s+/);
  const normalizedWords = words.map(word => {
    // Remove punctuation for matching
    const cleanWord = word.replace(/[^\w]/g, '');
    if (cleanWord.length < 3) return word; // Skip very short words
    
    const corrected = findClosestSpelling(cleanWord);
    // Preserve original capitalization/punctuation if possible
    if (corrected !== cleanWord) {
      return word.replace(cleanWord, corrected);
    }
    return word;
  });
  
  return normalizedWords.join(' ');
}

// Extract account type from registration query
export function extractAccountType(message) {
  const lowerMsg = message.toLowerCase();
  
  if (lowerMsg.match(/designer|design|create.*original/i)) {
    return 'designer';
  }
  
  if (lowerMsg.match(/reseller|resell|pre-loved|secondhand|sell.*used/i)) {
    return 'reseller';
  }
  
  if (lowerMsg.match(/buyer|buy|shop|purchase/i)) {
    return 'buyer';
  }
  
  return null;
}

// Check if message contains PII (for security)
export function containsPII(text) {
  const cnicPattern = /\d{5}-\d{7}-\d/;
  const emailPattern = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
  const phonePattern = /(\+92|0)\d{10}/;
  
  return cnicPattern.test(text) || emailPattern.test(text) || phonePattern.test(text);
}

// Format currency
export function formatCurrency(amount) {
  return `Rs ${Number(amount).toLocaleString()}`;
}

// Generate follow-up suggestions based on context
export function generateSuggestions(intent, _data) {
  const suggestions = {
    PRODUCT_SEARCH: [
      'Show me more details',
      'Filter by price range',
      'Show designer products only',
      'Search for another product'
    ],
    PRODUCT_STOCK_QUERY: [
      'Show me similar items',
      'Check another size',
      'When will it be back in stock?'
    ],
    PRODUCT_PRICE_QUERY: [
      'Is there a discount?',
      'Show me cheaper options',
      'Is it customizable?'
    ],
    DESIGNER_INFO: [
      'Show their products',
      'Tell me about another designer',
      'How to become a designer?'
    ],
    TOP_RATED_DESIGNERS: [
      'Show me their products',
      'Who has the most reviews?',
      'Tell me about a specific designer'
    ],
    PRODUCT_COMPARE: [
      'Show me more details',
      'Check availability',
      'Compare prices'
    ],
    CUSTOMIZATION_HELP: [
      'Start custom design now',
      'Show me design examples',
      'What are the pricing options?'
    ],
    REGISTRATION_HELP: [
      'What documents do I need?',
      'How long is the approval process?',
      'Tell me about platform fees'
    ],
    GENERAL_INFO: [
      'Search for products',
      'How to buy on this platform?',
      'Tell me about custom designs'
    ]
  };
  
  return suggestions[intent] || suggestions.GENERAL_INFO;
}

// Platform data fetcher class
export class PlatformDataFetcher {
  constructor(baseURL = 'http://localhost:5000/api') {
    this.baseURL = baseURL;
  }
  
  async searchProducts(query, filters = {}) {
    try {
      const params = new URLSearchParams({ q: query || '' });
      
      // Add filters properly
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.category) params.append('category', filters.category);
      if (filters.sellerType) params.append('sellerType', filters.sellerType);
      if (filters.sellerId) params.append('sellerId', filters.sellerId);
      if (filters.sellerName) params.append('sellerName', filters.sellerName);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.minRating) params.append('minRating', filters.minRating);
      if (filters.inStockOnly) params.append('inStockOnly', 'true');
      
      const response = await fetch(`${this.baseURL}/chatbot/search?${params}`);
      return await response.json();
    } catch (error) {
      console.error('Product search error:', error);
      return { products: [], total: 0, error: error.message };
    }
  }
  
  async getProductDetails(productId) {
    try {
      const response = await fetch(`${this.baseURL}/chatbot/product/${productId}`);
      return await response.json();
    } catch (error) {
      console.error('Product details error:', error);
      return { error: error.message };
    }
  }
  
  async getDesignerInfo(designerId) {
    try {
      const response = await fetch(`${this.baseURL}/chatbot/designer/${designerId}`);
      return await response.json();
    } catch (error) {
      console.error('Designer info error:', error);
      return { error: error.message };
    }
  }
  
  async searchDesigners(query) {
    try {
      const params = new URLSearchParams({ q: query });
      const response = await fetch(`${this.baseURL}/chatbot/designers/search?${params}`);
      return await response.json();
    } catch (error) {
      console.error('Designer search error:', error);
      return { designers: [], error: error.message };
    }
  }

  async getAllDesigners() {
    try {
      const response = await fetch(`${this.baseURL}/chatbot/designers/all`);
      return await response.json();
    } catch (error) {
      console.error('Get all designers error:', error);
      return { designers: [], error: error.message };
    }
  }
  
  async getResellerInfo(resellerId) {
    try {
      const response = await fetch(`${this.baseURL}/chatbot/reseller/${resellerId}`);
      return await response.json();
    } catch (error) {
      console.error('Reseller info error:', error);
      return { error: error.message };
    }
  }
  
  async getCustomizationGuide() {
    try {
      const response = await fetch(`${this.baseURL}/chatbot/guides/customization`);
      return await response.json();
    } catch (error) {
      console.error('Customization guide error:', error);
      return { error: error.message };
    }
  }
  
  async getRegistrationGuide(accountType) {
    try {
      const response = await fetch(`${this.baseURL}/chatbot/guides/registration/${accountType}`);
      return await response.json();
    } catch (error) {
      console.error('Registration guide error:', error);
      return { error: error.message };
    }
  }

  async getTopRatedDesigners(limit = 10, minRating = 0, minReviews = 1, sort = 'highest') {
    try {
      const params = new URLSearchParams({ 
        limit: limit.toString(), 
        minRating: minRating.toString(), 
        minReviews: minReviews.toString(),
        sort: sort
      });
      const response = await fetch(`${this.baseURL}/chatbot/designers/top-rated?${params}`);
      return await response.json();
    } catch (error) {
      console.error('Top-rated designers error:', error);
      return { designers: [], error: error.message };
    }
  }

  async getProductStock(productId) {
    try {
      const response = await fetch(`${this.baseURL}/chatbot/product/${productId}/stock`);
      return await response.json();
    } catch (error) {
      console.error('Product stock error:', error);
      return { error: error.message };
    }
  }
}
