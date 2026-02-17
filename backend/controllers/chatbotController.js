// controllers/chatbotController.js - Chatbot-specific endpoints for AI assistant
import Product from '../models/Product.js';
import Designer from '../models/Designer.js';
import Reseller from '../models/Reseller.js';

// PII Filtering Helper
function filterPII(data) {
  if (Array.isArray(data)) {
    return data.map(item => filterPII(item));
  }
  
  if (data && typeof data === 'object') {
    const filtered = { ...data };
    
    // Remove sensitive fields
    delete filtered.email;
    delete filtered.phone;
    delete filtered.cnic;
    delete filtered.password;
    delete filtered.resetPasswordToken;
    delete filtered.resetPasswordExpire;
    
    // Recursively filter nested objects
    Object.keys(filtered).forEach(key => {
      if (typeof filtered[key] === 'object') {
        filtered[key] = filterPII(filtered[key]);
      }
    });
    
    return filtered;
  }
  
  return data;
}

// PRODUCT SEARCH - Intelligent search with proper priority hierarchy
// Priority: 1. Exact ID/SKU → 2. Exact Name → 3. Normalized Name → 4. High-Confidence Fuzzy → 5. Category/Tag → 6. Related
export const searchProducts = async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice, sellerType, sellerId, limit = 5, sortBy, minRating, inStockOnly } = req.query;

    console.log(`[Chatbot Search] Query: "${q}"`);

    const baseQuery = {
      status: 'approved',
      isActive: true,
    };

    // Apply filters if provided (strict filtering)
    if (category) baseQuery.category = { $regex: category, $options: 'i' };
    if (sellerType && ['Designer', 'Reseller'].includes(sellerType)) {
      baseQuery.sellerType = sellerType;
    }
    if (sellerId) {
      baseQuery.sellerId = sellerId;
    }
    if (req.query.sellerName) {
      baseQuery.sellerName = { $regex: req.query.sellerName, $options: 'i' };
    }
    // Apply price filters STRICTLY - these are user requirements
    if (minPrice || maxPrice) {
      baseQuery.price = {};
      if (minPrice) baseQuery.price.$gte = Number(minPrice);
      if (maxPrice) baseQuery.price.$lte = Number(maxPrice);
    }
    if (inStockOnly === 'true') {
      baseQuery.stock = { $gt: 0 };
    }
    if (minRating) {
      baseQuery.averageRating = { $gte: Number(minRating) };
    }
    
    // Gender filter (supports single or array: ?gender=Men or ?gender[]=Men&gender[]=Women)
    if (req.query.gender) {
      if (Array.isArray(req.query.gender)) {
        baseQuery.gender = { $in: req.query.gender };
      } else {
        baseQuery.gender = req.query.gender;
      }
    }
    
    // Track if price filter was applied for response message
    const priceFilterApplied = !!(minPrice || maxPrice);
    
    // Category detection for common product types (with strict matching)
    const categoryMap = {
      'sneakers': { keywords: ['sneaker', 'sneakers', 'sniker', 'snicker', 'sneekers'], strict: true },
      'shoes': { keywords: ['shoe', 'shoes', 'footwear'], strict: false },
      'bags': { keywords: ['bag', 'bags', 'bak'], strict: true },
      'joggers': { keywords: ['jogger', 'joggers', 'jogers'], strict: true },
      'loafers': { keywords: ['loafer', 'loafers', 'loofers', 'lofers', 'lofer'], strict: true },
      'lofers': { keywords: ['loafer', 'loafers', 'loofers', 'lofers', 'lofer'], strict: true }, // Also handle lofers
      'clothing': { keywords: ['cloth', 'cloths', 'clothes', 'clothing', 'apparel'], strict: false },
      'dress': { keywords: ['dress', 'dresses'], strict: true },
      'suit': { keywords: ['suit', 'suits'], strict: true },
      'hoodie': { keywords: ['hoodie', 'hoodies', 'hoody'], strict: true }
    };
    
    // Detect category from query
    let detectedCategory = null;
    let isStrictCategory = false;
    if (q) {
      const queryLower = q.toLowerCase();
      for (const [cat, config] of Object.entries(categoryMap)) {
        if (config.keywords.some(k => queryLower.includes(k))) {
          detectedCategory = cat;
          isStrictCategory = config.strict;
          break;
        }
      }
    }
    
    // Use detected category or provided category
    const searchCategory = category || detectedCategory;
    if (searchCategory) {
      // For strict categories, only match products with that exact category keyword
      if (isStrictCategory) {
        const categoryConfig = categoryMap[searchCategory];
        const categoryRegex = categoryConfig.keywords.join('|');
        baseQuery.$or = [
          { name: { $regex: categoryRegex, $options: 'i' } },
          { category: { $regex: categoryRegex, $options: 'i' } },
          { tags: { $regex: categoryRegex, $options: 'i' } }
        ];
        // Remove the general category filter if we're using $or
        delete baseQuery.category;
      } else {
        baseQuery.category = { $regex: searchCategory, $options: 'i' };
      }
    }
    
    // If no query but filters exist, return filtered products
    if (!q || q.trim().length < 2) {
      if (sellerId || inStockOnly === 'true' || searchCategory) {
        let products = await Product.find(baseQuery)
          .select('name price stock images category sellerType sellerName listingType rentPrice averageRating ratingCount description tags')
          .lean();
        
        // Apply sorting
        if (sortBy === 'price_asc') {
          products.sort((a, b) => (a.price || 0) - (b.price || 0));
        } else if (sortBy === 'price_desc') {
          products.sort((a, b) => (b.price || 0) - (a.price || 0));
        } else if (sortBy === 'rating_desc') {
          products.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        }
        
        products = products.slice(0, Number(limit));
        
        const format = (p) => ({
          id: p._id.toString(),
          name: p.name,
          price: p.listingType === 'rent' ? (p.rentPrice || p.price) : p.price,
          listingType: p.listingType || 'sale',
          stock: p.stock || 0,
          status: (p.stock && p.stock > 0) ? 'in-stock' : 'out-of-stock',
          imageUrl: p.images?.[0] 
            ? (p.images[0].startsWith('/uploads/') || p.images[0].startsWith('http') 
                ? p.images[0]
                : `/uploads/${p.images[0]}`)
            : '/placeholder.svg',
          productPageUrl: `/product/${p._id}`,
          category: p.category,
          sellerType: p.sellerType,
          sellerName: p.sellerName || 'Unknown Seller',
          averageRating: p.averageRating || 0,
          ratingCount: p.ratingCount || 0
        });
        
        return res.json({
          success: true,
          products: products.map(format),
          similarProducts: [],
          total: products.length,
          query: q || 'all',
          searchType: 'filtered',
          matchConfidence: 'high',
          priceFilterApplied: priceFilterApplied
        });
      }
      return res.json({ products: [], total: 0, message: 'Please provide a search query with at least 2 characters' });
    }

    const query = q.trim();
    let products = [];
    let searchType = 'none';
    let matchConfidence = 'none';

    // Helper function to normalize query (remove punctuation, stop words)
    const normalizeQuery = (text) => {
      return text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ') // Remove punctuation
        .replace(/\b(the|a|an|is|are|was|were|in|on|at|to|for|of|with|by|from|this|that|these|those)\b/gi, '') // Remove stop words
        .replace(/\s+/g, ' ')
        .trim();
    };

    const normalizedQuery = normalizeQuery(query);
    const keywords = normalizedQuery.split(/\s+/).filter(w => w.length > 2);

    // STAGE 1: Exact Product ID/SKU Match (if query looks like an ID)
    if (query.match(/^[0-9a-fA-F]{24}$/) || query.match(/^[A-Z0-9-]+$/)) {
      const idMatch = await Product.findOne({
        ...baseQuery,
        $or: [
          { _id: query },
          { sku: query.toUpperCase() }
        ]
      })
      .select('name price stock images category sellerType sellerName listingType rentPrice averageRating ratingCount description tags')
      .lean();

      if (idMatch) {
        products = [idMatch];
        searchType = 'exact_id';
        matchConfidence = 'exact';
      }
    }

    // STAGE 2: Exact Product Name Match (case-insensitive, whole phrase)
    if (products.length === 0) {
      const exactNameMatch = await Product.find({
        ...baseQuery,
        name: { $regex: `^${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }
      })
      .limit(Number(limit))
      .select('name price stock images category sellerType sellerName listingType rentPrice averageRating ratingCount description tags')
      .lean();

      if (exactNameMatch.length > 0) {
        products = exactNameMatch;
        searchType = 'exact_name';
        matchConfidence = 'exact';
      }
    }

    // STAGE 3: Normalized Name Match (remove punctuation, stop words)
    if (products.length === 0 && normalizedQuery.length > 0) {
      // Build regex pattern from normalized keywords (all must be present)
      const normalizedPattern = keywords.map(k => `(?=.*${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`).join('');
      
      // Spelling variations for common typos
      const spellingVariations = {
        'loofers': ['loafers', 'lofers', 'lofer'],
        'loafers': ['lofers', 'loofers', 'lofer'],
        'lofers': ['loafers', 'loofers', 'lofer'],
        'sneekers': ['sneakers', 'snikers'],
        'snikers': ['sneakers', 'sneekers'],
        'hanna': ['hannan', 'hannan_a']
      };
      
      // Build search terms with variations
      const searchTerms = [...keywords];
      keywords.forEach(k => {
        const lowerK = k.toLowerCase();
        if (spellingVariations[lowerK]) {
          searchTerms.push(...spellingVariations[lowerK]);
        }
      });
      
      const searchPattern = searchTerms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
      
      const normalizedMatch = await Product.find({
        ...baseQuery,
        $or: [
          { name: { $regex: normalizedPattern, $options: 'i' } },
          { name: { $regex: normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
          { name: { $regex: searchPattern, $options: 'i' } },
          { description: { $regex: searchPattern, $options: 'i' } }
        ]
      })
      .limit(Number(limit) * 2) // Get more for scoring
      .select('name price stock images category sellerType sellerName listingType rentPrice averageRating ratingCount description tags')
      .lean();

      if (normalizedMatch.length > 0) {
        products = normalizedMatch;
        searchType = 'normalized';
        matchConfidence = 'high';
      }
    }

    // STAGE 4: High-Confidence Fuzzy Match with Relevance Scoring
    // This now searches across name, description, tags, and category
    if (products.length === 0 && keywords.length > 0) {
      // Build search query across multiple fields
      const searchFields = [
        { name: { $regex: keywords.join('|'), $options: 'i' } },
        { description: { $regex: keywords.join('|'), $options: 'i' } },
        { tags: { $regex: keywords.join('|'), $options: 'i' } },
        { category: { $regex: keywords.join('|'), $options: 'i' } }
      ];
      
      const fuzzyMatch = await Product.find({
        ...baseQuery,
        $or: searchFields
      })
      .limit(Number(limit) * 3) // Get more candidates for scoring
      .select('name price stock images category sellerType sellerName listingType rentPrice averageRating ratingCount description tags')
      .lean();

      if (fuzzyMatch.length > 0) {
        // Common brand names that should get high priority
        const brandNames = ['gucci', 'louis vuitton', 'prada', 'versace', 'chanel', 'dior', 'balenciaga', 'fendi', 'burberry', 'hermes'];
        
        // Score products by relevance: brand names, exact keyword matches, and description matches
        // Also apply penalties for irrelevant matches
        const scoredProducts = fuzzyMatch.map(p => {
          const nameLower = p.name.toLowerCase();
          const descriptionLower = (p.description || '').toLowerCase();
          const tagsLower = (p.tags || '').toLowerCase();
          const categoryLower = (p.category || '').toLowerCase();
          const queryLower = query.toLowerCase();
          let score = 0;
          
          // Check for negative keywords (words that should NOT be in results)
          // Example: "unstitched" query should penalize "stitched" products
          const negativeKeywords = [];
          if (queryLower.includes('unstitched')) {
            negativeKeywords.push('stitched');
          }
          if (queryLower.includes('stitched')) {
            negativeKeywords.push('unstitched');
          }
          
          // Apply penalties for negative keywords
          negativeKeywords.forEach(negative => {
            if (nameLower.includes(negative) || descriptionLower.includes(negative)) {
              score -= 100; // Heavy penalty for irrelevant matches
            }
          });
          
          // Check if query contains a brand name
          const queryHasBrand = brandNames.some(brand => queryLower.includes(brand));
          const nameHasBrand = brandNames.some(brand => nameLower.includes(brand));
          
          // If query has brand and product has same brand, very high score
          if (queryHasBrand && nameHasBrand) {
            const queryBrand = brandNames.find(brand => queryLower.includes(brand));
            const nameBrand = brandNames.find(brand => nameLower.includes(brand));
            if (queryBrand === nameBrand) {
              score += 200; // Brand match gets highest priority
            } else {
              score -= 50; // Different brand gets penalty
            }
          }
          
          // Exact keyword match in name (highest priority)
          keywords.forEach(k => {
            const keywordLower = k.toLowerCase();
            if (nameLower.includes(keywordLower)) {
              score += 30; // Base score for keyword in name
              // If keyword appears at start of product name, even higher score
              if (nameLower.startsWith(keywordLower)) score += 40;
              // If keyword is exact word match (not substring), highest score
              const words = nameLower.split(/\s+/);
              if (words.includes(keywordLower)) score += 50;
            }
            // Also check description and tags (lower priority but still relevant)
            if (descriptionLower.includes(keywordLower)) score += 10;
            if (tagsLower.includes(keywordLower)) score += 15;
            if (categoryLower.includes(keywordLower)) score += 5;
          });
          
          // Query as substring in name gets high bonus
          if (nameLower.includes(queryLower)) score += 60;
          
          // All keywords present in name gets bonus
          const allKeywordsInName = keywords.every(k => nameLower.includes(k.toLowerCase()));
          if (allKeywordsInName) score += 40;
          
          // Partial query match in description
          if (descriptionLower.includes(queryLower)) score += 20;
          
          return { ...p, relevanceScore: score };
        });
        
        // Sort by relevance score (highest first) and filter
        // Lower threshold to allow more results (including description matches)
        const filteredProducts = scoredProducts
          .sort((a, b) => b.relevanceScore - a.relevanceScore)
          .filter(p => p.relevanceScore > -50) // Exclude heavily penalized items
          .slice(0, Number(limit))
          .map(({ relevanceScore, ...p }) => p); // Remove score before returning
        
        if (filteredProducts.length > 0) {
          products = filteredProducts;
          searchType = 'fuzzy';
          // Determine confidence based on top score
          const topScore = scoredProducts[0]?.relevanceScore || 0;
          matchConfidence = topScore >= 50 ? 'high' : topScore >= 20 ? 'medium' : 'low';
        }
      }
    }

    // STAGE 5: Category/Tag-Based Match (only if above stages fail)
    // CRITICAL: More forgiving - match category keywords even if not in exact name
    if (products.length === 0 && keywords.length > 0) {
      // Expanded category keywords including variations
      const categoryKeywords = [
        'bag', 'bags', 'purse', 'tote', 'handbag',
        'shirt', 'tshirt', 't-shirt', 'tee', 'top',
        'dress', 'dresses',
        'jacket', 'jackets',
        'shoe', 'shoes', 'sneaker', 'sneakers', 'trainer', 'trainers', 'footwear',
        'jogger', 'joggers', 'track', 'sweatpants', 'pants',
        'pant', 'pants', 'trouser', 'trousers',
        'suit', 'suits',
        'kurta', 'kurtas',
        'shalwar', 'shalwars',
        'hoodie', 'hoodies', 'sweatshirt', 'sweatshirts',
        'sneaker', 'sneakers'
      ];
      
      const queryLower = query.toLowerCase();
      const hasCategoryKeyword = keywords.some(k => categoryKeywords.includes(k.toLowerCase())) || 
                                 categoryKeywords.some(cat => queryLower.includes(cat));
      
      if (hasCategoryKeyword || keywords.length === 1) { // Also allow single-word queries
        // More flexible: Search in name, description, category, and tags
        const searchConditions = [
          ...keywords.map(k => ({ name: { $regex: k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } })),
          ...keywords.map(k => ({ description: { $regex: k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } })),
          { category: { $regex: keywords.join('|'), $options: 'i' } },
          { tags: { $regex: keywords.join('|'), $options: 'i' } }
        ];
        
        const categoryMatch = await Product.find({
          ...baseQuery,
          $or: searchConditions
        })
        .limit(Number(limit) * 2) // Get more candidates for scoring
        .select('name price stock images category sellerType sellerName listingType rentPrice averageRating ratingCount description tags')
        .lean();

        if (categoryMatch.length > 0) {
          // Score products by relevance: exact name matches get highest priority
          // Also apply penalties for irrelevant matches
          const scoredProducts = categoryMatch.map(p => {
            const nameLower = p.name.toLowerCase();
            const descriptionLower = (p.description || '').toLowerCase();
            const queryLower = query.toLowerCase();
            let score = 0;
            
            // Check for negative keywords (words that should NOT be in results)
            const negativeKeywords = [];
            if (queryLower.includes('unstitched')) {
              negativeKeywords.push('stitched');
            }
            if (queryLower.includes('stitched')) {
              negativeKeywords.push('unstitched');
            }
            
            // Apply penalties for negative keywords
            negativeKeywords.forEach(negative => {
              if (nameLower.includes(negative) || descriptionLower.includes(negative)) {
                score -= 100; // Heavy penalty for irrelevant matches
              }
            });
            
            // Exact query match in name gets highest score
            if (nameLower.includes(queryLower)) {
              score += 100;
            }
            
            // Each keyword match in name
            keywords.forEach(k => {
              const keywordLower = k.toLowerCase();
              if (nameLower.includes(keywordLower)) {
                score += 20;
                // If keyword appears at start, bonus
                if (nameLower.startsWith(keywordLower)) score += 30;
                // If keyword is exact word match, highest bonus
                const words = nameLower.split(/\s+/);
                if (words.includes(keywordLower)) score += 40;
              }
            });
            
            // Category match gets lower score
            if (p.category && keywords.some(k => p.category.toLowerCase().includes(k.toLowerCase()))) {
              score += 5;
            }
            
            return { ...p, relevanceScore: score };
          });
          
          // Sort by relevance score and filter - exclude heavily penalized items
          const sortedProducts = scoredProducts
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .filter(p => p.relevanceScore > -50); // Exclude heavily penalized items (negative scores from penalties)
          
          if (sortedProducts.length > 0) {
            const topScore = sortedProducts[0].relevanceScore;
            products = sortedProducts
              .slice(0, Number(limit))
              .map(({ relevanceScore, ...p }) => p); // Remove score before returning
            
            searchType = 'category';
            matchConfidence = topScore >= 50 ? 'high' : topScore >= 10 ? 'medium' : 'low';
          }
        }
      }
    }

    // STAGE 6: Related Product Suggestions (ONLY if exact match found and user might want more)
    // DO NOT show unrelated products if no match found
    let similarProducts = [];
    if (products.length === 0) {
      // Don't show unrelated products - return empty with clear message
      searchType = 'no_match';
      matchConfidence = 'none';
      
      // Only show similar if query is very short or ambiguous
      // For specific queries like "electric car", don't show anything
      if (keywords.length <= 1 && !searchCategory) {
        // Very short query, might show some suggestions
        similarProducts = await Product.find(baseQuery)
          .sort({ createdAt: -1 })
          .limit(3)
          .select('name price stock images category sellerType sellerName listingType rentPrice averageRating ratingCount description tags')
          .lean();
      }
    } else if (products.length > 0 && matchConfidence === 'exact') {
      // Only show similar products if we found exact match and might want alternatives
      // This will be controlled by frontend - only show if user requests
      const foundCategory = products[0]?.category;
      const fallbackIds = products.map(p => p._id);
      
      if (foundCategory) {
        similarProducts = await Product.find({
          ...baseQuery,
          category: foundCategory,
          _id: { $nin: fallbackIds }
        })
        .sort({ createdAt: -1 })
        .limit(3)
        .select('name price stock images category sellerType sellerName listingType rentPrice averageRating ratingCount')
        .lean();
      }
    }

    // Helper to format product with rating information
    const format = (p) => ({
      id: p._id.toString(),
      name: p.name,
      price: p.listingType === 'rent' ? (p.rentPrice || p.price) : p.price,
      listingType: p.listingType || 'sale',
      stock: p.stock || 0,
      status: (p.stock && p.stock > 0) ? 'in-stock' : 'out-of-stock',
      imageUrl: p.images?.[0] 
        ? (p.images[0].startsWith('/uploads/') || p.images[0].startsWith('http') 
            ? p.images[0]
            : `/uploads/${p.images[0]}`)
        : '/placeholder.svg',
      productPageUrl: `/product/${p._id}`,
      category: p.category,
      sellerType: p.sellerType,
      sellerName: p.sellerName || 'Unknown Seller',
      averageRating: p.averageRating || 0,
      ratingCount: p.ratingCount || 0
    });

    // Apply sorting if specified
    let sortedProducts = products.map(format);
    if (sortBy === 'price_asc') {
      sortedProducts.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === 'price_desc') {
      sortedProducts.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortBy === 'rating_desc') {
      sortedProducts.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    }
    
    // Filter by category more strictly if strict category was detected
    if (isStrictCategory && searchCategory) {
      const categoryConfig = categoryMap[searchCategory];
      const categoryKeywords = categoryConfig.keywords;
      // Only include products that match the category keywords
      sortedProducts = sortedProducts.filter(p => {
        const nameLower = p.name.toLowerCase();
        const categoryLower = (p.category || '').toLowerCase();
        const tagsLower = (p.tags || '').toLowerCase();
        return categoryKeywords.some(k => 
          nameLower.includes(k) || 
          categoryLower.includes(k) ||
          tagsLower.includes(k)
        );
      });
    }
    
    res.json({
      success: true,
      products: sortedProducts,
      similarProducts: similarProducts.map(format),
      total: sortedProducts.length,
      query: q,
      searchType,
      matchConfidence,
      priceFilterApplied: priceFilterApplied,
      priceRange: minPrice || maxPrice ? { minPrice, maxPrice } : null,
      category: searchCategory
    });

  } catch (error) {
    console.error('Chatbot product search error:', error);
    res.status(500).json({ error: 'Failed to search products', products: [], total: 0 });
  }
};

// PRODUCT STOCK VERIFICATION - Get real-time stock status
export const getProductStock = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id)
      .select('name stock isActive status')
      .lean();

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const stock = product.stock || 0;
    const isAvailable = product.isActive && product.status === 'approved' && stock > 0;

    res.json({
      success: true,
      productId: id,
      productName: product.name,
      stock,
      isAvailable,
      status: isAvailable ? 'in-stock' : 'out-of-stock'
    });

  } catch (error) {
    console.error('Chatbot stock verification error:', error);
    res.status(500).json({ error: 'Failed to verify stock' });
  }
};

// PRODUCT DETAILS - Get specific product with full info
export const getProductDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id)
      .select('-__v')
      .lean();

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Filter PII and format
    const safeProduct = filterPII(product);
    
    const formattedProduct = {
      id: safeProduct._id.toString(),
      name: safeProduct.name,
      description: safeProduct.description,
      price: safeProduct.listingType === 'rent' ? (safeProduct.rentPrice || safeProduct.price) : safeProduct.price,
      originalPrice: safeProduct.originalPrice,
      listingType: safeProduct.listingType || 'sale',
      rentPrice: safeProduct.rentPrice,
      rentDuration: safeProduct.rentDuration,
      stock: safeProduct.stock || 0,
      status: (safeProduct.stock && safeProduct.stock > 0) ? 'in-stock' : 'out-of-stock',
      images: safeProduct.images?.map(img => `/uploads/${img}`) || [],
      category: safeProduct.category,
      size: safeProduct.size,
      color: safeProduct.color,
      material: safeProduct.material,
      sellerType: safeProduct.sellerType,
      sellerName: safeProduct.sellerName,
      productPageUrl: `/product/${safeProduct._id}`,
      isOnSale: safeProduct.isOnSale,
      salePrice: safeProduct.salePrice,
      condition: safeProduct.condition,
      averageRating: safeProduct.averageRating || 0,
      ratingCount: safeProduct.ratingCount || 0
    };

    res.json({
      success: true,
      product: formattedProduct
    });

  } catch (error) {
    console.error('Chatbot product details error:', error);
    res.status(500).json({ error: 'Failed to get product details' });
  }
};

// DESIGNER INFO - Get designer portfolio summary with ratings
export const getDesignerInfo = async (req, res) => {
  try {
    const { id } = req.params;

    const designer = await Designer.findById(id)
      .select('fullName bio location isActive averageRating ratingCount totalReviews')
      .lean();

    if (!designer) {
      return res.status(404).json({ error: 'Designer not found' });
    }

    // Count products
    const productsCount = await Product.countDocuments({
      sellerId: id,
      sellerType: 'Designer',
      status: 'approved',
      isActive: true
    });

    const activeListings = await Product.countDocuments({
      sellerId: id,
      sellerType: 'Designer',
      status: 'approved',
      isActive: true,
      stock: { $gt: 0 }
    });

    // Get product categories (specialties)
    const categories = await Product.distinct('category', {
      sellerId: id,
      sellerType: 'Designer',
      status: 'approved'
    });

    res.json({
      success: true,
      designer: {
        id: designer._id.toString(),
        name: designer.fullName,
        bio: designer.bio,
        location: designer.location,
        isActive: designer.isActive,
        productsCount,
        activeListings,
        specialties: categories,
        profileUrl: `/designer/${designer._id}`,
        averageRating: designer.averageRating || 0,
        ratingCount: designer.ratingCount || 0,
        totalReviews: designer.totalReviews || 0
      }
    });

  } catch (error) {
    console.error('Chatbot designer info error:', error);
    res.status(500).json({ error: 'Failed to get designer information' });
  }
};

// RESELLER INFO - Get reseller inventory summary
export const getResellerInfo = async (req, res) => {
  try {
    const { id } = req.params;

    const reseller = await Reseller.findById(id)
      .select('fullName bio location isActive')
      .lean();

    if (!reseller) {
      return res.status(404).json({ error: 'Reseller not found' });
    }

    // Count products
    const productsCount = await Product.countDocuments({
      sellerId: id,
      sellerType: 'Reseller',
      status: 'approved',
      isActive: true
    });

    const activeListings = await Product.countDocuments({
      sellerId: id,
      sellerType: 'Reseller',
      status: 'approved',
      isActive: true,
      stock: { $gt: 0 }
    });

    // Get product categories
    const categories = await Product.distinct('category', {
      sellerId: id,
      sellerType: 'Reseller',
      status: 'approved'
    });

    res.json({
      success: true,
      reseller: {
        id: reseller._id.toString(),
        name: reseller.fullName,
        bio: reseller.bio,
        location: reseller.location,
        isActive: reseller.isActive,
        productsCount,
        activeListings,
        categories,
        profileUrl: `/reseller/${reseller._id}`
      }
    });

  } catch (error) {
    console.error('Chatbot reseller info error:', error);
    res.status(500).json({ error: 'Failed to get reseller information' });
  }
};

// CUSTOMIZATION GUIDE - Step-by-step custom design instructions
export const getCustomizationGuide = async (req, res) => {
  try {
    const guide = {
      success: true,
      title: 'Custom Design Studio Guide',
      steps: [
        {
          step: 1,
          title: 'Access Custom Studio',
          instructions: 'Click "Custom Your Style" in the main navigation menu',
          buttonName: 'Custom Your Style',
          pageUrl: '/custom-design'
        },
        {
          step: 2,
          title: 'Choose Base Template',
          instructions: 'Select from pre-made shirt templates or start with a blank canvas',
          options: ['Pre-made Templates', 'Blank Canvas']
        },
        {
          step: 3,
          title: 'Customize Design',
          instructions: 'Use the design tools to personalize your shirt',
          tools: [
            'Add Text - Custom fonts, colors, and sizes',
            'Add Stickers - Pre-designed graphics and icons',
            'Add Shapes - Geometric shapes with custom colors',
            'Upload Images - Your own photos and logos',
            'AI Background Removal - Automatic image background removal'
          ]
        },
        {
          step: 4,
          title: 'Preview Your Design',
          instructions: 'Review your custom shirt from all angles using the 3D preview',
          feature: '360° Preview Available'
        },
        {
          step: 5,
          title: 'Add to Cart',
          instructions: 'Click "Add to Cart" button to proceed with your custom design',
          buttonName: 'Add to Cart'
        },
        {
          step: 6,
          title: 'Checkout',
          instructions: 'Complete your purchase through secure checkout process',
          note: 'Custom designs require 3-5 business days for production'
        }
      ],
      tips: [
        'Use high-resolution images for best print quality',
        'Preview your design before adding to cart',
        'Contact support for bulk custom orders',
        'Save your design for future modifications'
      ]
    };

    res.json(guide);

  } catch (error) {
    console.error('Chatbot customization guide error:', error);
    res.status(500).json({ error: 'Failed to get customization guide' });
  }
};

// REGISTRATION GUIDE - Account type specific signup instructions
export const getRegistrationGuide = async (req, res) => {
  try {
    const { type } = req.params; // 'buyer', 'designer', 'reseller'

    const guides = {
      buyer: {
        accountType: 'Buyer Account',
        description: 'Quick registration for shopping',
        requirements: [
          'Full Name',
          'Email Address',
          'Phone Number',
          'Location/Address'
        ],
        verificationRequired: false,
        approvalTime: 'Instant',
        steps: [
          'Click "Sign Up" button in navigation',
          'Select "Buyer" account type',
          'Fill in basic information (name, email, phone, location)',
          'Create secure password',
          'Verify email address',
          'Start shopping immediately!'
        ],
        benefits: [
          'Instant account activation',
          'Access to all products',
          'Secure escrow payments',
          'Order tracking',
          'Wishlist functionality'
        ],
        registrationUrl: '/register?type=buyer'
      },
      designer: {
        accountType: 'Designer Account',
        description: 'Sell your original designs and creations',
        requirements: [
          'Full Name',
          'Email Address',
          'Phone Number',
          'Business/Brand Information',
          'Portfolio (images of your work)',
          'CNIC for verification',
          'Bank account details for payments'
        ],
        verificationRequired: true,
        approvalTime: '2-5 business days',
        steps: [
          'Click "Sign Up" button',
          'Select "Designer" account type',
          'Fill in personal information',
          'Upload CNIC for verification',
          'Provide brand/business information',
          'Upload portfolio images',
          'Submit bank account details',
          'Wait for admin approval (2-5 days)',
          'Receive approval email',
          'Start listing your designs!'
        ],
        fees: {
          commission: '8-12%',
          description: 'Platform commission on sales'
        },
        benefits: [
          'Virtual showroom',
          'Reach luxury fashion buyers',
          'Secure escrow payments',
          'Marketing support',
          'Analytics dashboard'
        ],
        registrationUrl: '/register?type=designer'
      },
      reseller: {
        accountType: 'Reseller Account',
        description: 'Sell pre-loved luxury fashion items',
        requirements: [
          'Full Name',
          'Email Address',
          'Phone Number',
          'Wardrobe/Inventory Information',
          'CNIC for verification',
          'Bank account details for payments'
        ],
        verificationRequired: true,
        approvalTime: '2-5 business days',
        steps: [
          'Click "Sign Up" button',
          'Select "Reseller" account type',
          'Fill in personal information',
          'Upload CNIC for verification',
          'Provide wardrobe/inventory details',
          'Submit bank account details',
          'Wait for admin approval',
          'Receive approval email',
          'Start listing your pre-loved items!'
        ],
        fees: {
          commission: '10-15%',
          description: 'Platform commission on sales'
        },
        benefits: [
          'Sell authentic designer items',
          'Quality verification support',
          'Secure escrow payments',
          'Large buyer network',
          'Easy listing process'
        ],
        registrationUrl: '/register?type=reseller'
      }
    };

    const guide = guides[type?.toLowerCase()];

    if (!guide) {
      return res.status(400).json({
        error: 'Invalid account type',
        validTypes: ['buyer', 'designer', 'reseller']
      });
    }

    res.json({
      success: true,
      guide
    });

  } catch (error) {
    console.error('Chatbot registration guide error:', error);
    res.status(500).json({ error: 'Failed to get registration guide' });
  }
};

// SEARCH DESIGNERS - Find designers by name or specialty
// SEARCH DESIGNERS - Smart search with flexible matching
export const searchDesigners = async (req, res) => {
  try {
    const { q, limit = 5 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({ designers: [], total: 0 });
    }

    // Prepare flexible search pattern
    // Convert "Hannan A" -> "Hannan.*A" to match "Hannan_A" or "Hannan A"
    // Also handle underscores as spaces
    const flexiblePattern = q.trim().split(/[\s_]+/).join('[\\s_]*');
    
    // 1. Try flexible match on name
    const query = {
      isActive: true,
      $or: [
        { fullName: { $regex: flexiblePattern, $options: 'i' } },
        { fullName: { $regex: q.trim(), $options: 'i' } } // Fallback to raw query
      ]
    };

    let designers = await Designer.find(query)
      .limit(Number(limit))
      .select('fullName bio location averageRating ratingCount totalReviews')
      .lean();

    // 2. If no results, try broader match (any part of name)
    let searchType = 'flexible';
    if (designers.length === 0) {
      // Split into words and search independently
      const keywords = q.trim().split(/[\s_]+/).filter(w => w.length > 2);
      if (keywords.length > 0) {
        const keywordRegex = keywords.join('|');
        designers = await Designer.find({
          isActive: true,
          fullName: { $regex: keywordRegex, $options: 'i' }
        })
        .limit(3)
        .select('fullName bio location averageRating ratingCount totalReviews')
        .lean();
        searchType = 'broad';
      }
    }

    // Get "Similar Designers" if we only found broad matches or very few
    let similarDesigners = [];
    if (designers.length === 0 || searchType === 'broad') {
       // Just grab some active designers as discovery
       const existingIds = designers.map(d => d._id);
       similarDesigners = await Designer.find({
         isActive: true,
         _id: { $nin: existingIds }
       })
       .limit(3)
       .select('fullName bio location averageRating ratingCount totalReviews')
       .lean();
    }

    const processDesigners = async (list) => {
      return Promise.all(list.map(async (designer) => {
        const productsCount = await Product.countDocuments({
          sellerId: designer._id,
          sellerType: 'Designer',
          status: 'approved',
          isActive: true
        });
        const activeListings = await Product.countDocuments({
           sellerId: designer._id,
           sellerType: 'Designer',
           status: 'approved',
           isActive: true,
           stock: { $gt: 0 }
        });
        // Get specialties (categories)
        const specialties = await Product.distinct('category', {
            sellerId: designer._id,
            sellerType: 'Designer',
            status: 'approved'
        });

        return {
          id: designer._id.toString(),
          name: designer.fullName,
          bio: designer.bio,
          location: designer.location,
          productsCount,
          activeListings,
          specialties,
          profileUrl: `/designer/${designer._id}`,
          averageRating: designer.averageRating || 0,
          ratingCount: designer.ratingCount || 0,
          totalReviews: designer.totalReviews || 0
        };
      }));
    };

    const designersWithCounts = await processDesigners(designers);
    const similarWithCounts = await processDesigners(similarDesigners);

    res.json({
      success: true,
      designers: designersWithCounts,
      similarDesigners: similarWithCounts,
      total: designers.length
    });

  } catch (error) {
    console.error('Chatbot designer search error:', error);
    res.status(500).json({ error: 'Failed to search designers' });
  }
};

// GET ALL DESIGNERS - Returns all active designers
export const getAllDesigners = async (req, res) => {
  try {
    const { limit = 100 } = req.query;

    // Get all active designers
    const designers = await Designer.find({
      isActive: true
    })
      .limit(Number(limit))
      .select('fullName bio location averageRating ratingCount totalReviews')
      .sort({ fullName: 1 }) // Sort alphabetically
      .lean();

    // Process designers to add product counts
    const processDesigners = async (list) => {
      return Promise.all(list.map(async (designer) => {
        const productsCount = await Product.countDocuments({
          sellerId: designer._id,
          sellerType: 'Designer',
          status: 'approved',
          isActive: true
        });
        const activeListings = await Product.countDocuments({
           sellerId: designer._id,
           sellerType: 'Designer',
           status: 'approved',
           isActive: true,
           stock: { $gt: 0 }
        });
        // Get specialties (categories)
        const specialties = await Product.distinct('category', {
            sellerId: designer._id,
            sellerType: 'Designer',
            status: 'approved'
        });

        return {
          id: designer._id.toString(),
          name: designer.fullName,
          bio: designer.bio,
          location: designer.location,
          productsCount,
          activeListings,
          specialties,
          profileUrl: `/designer/${designer._id}`,
          averageRating: designer.averageRating || 0,
          ratingCount: designer.ratingCount || 0,
          totalReviews: designer.totalReviews || 0
        };
      }));
    };

    const designersWithCounts = await processDesigners(designers);

    res.json({
      success: true,
      designers: designersWithCounts,
      total: designersWithCounts.length
    });

  } catch (error) {
    console.error('Chatbot get all designers error:', error);
    res.status(500).json({ error: 'Failed to get all designers' });
  }
};

// GET TOP-RATED DESIGNERS - Returns designers sorted by rating (highest or lowest)
export const getTopRatedDesigners = async (req, res) => {
  try {
    const { limit = 10, minRating = 0, minReviews = 1, sort = 'highest' } = req.query;

    // Build query
    const query = {
      isActive: true,
      ratingCount: { $gte: Number(minReviews) } // Must have at least minReviews
    };
    
    // Only filter by minRating if sort is highest (for lowest, we want all ratings)
    if (sort === 'highest' && Number(minRating) > 0) {
      query.averageRating = { $gte: Number(minRating) };
    }

    // Determine sort order
    const sortOrder = sort === 'lowest' 
      ? { averageRating: 1, ratingCount: 1 } // Ascending for lowest
      : { averageRating: -1, ratingCount: -1 }; // Descending for highest

    // Find designers with minimum rating and review count
    const designers = await Designer.find(query)
      .select('fullName bio location averageRating ratingCount totalReviews')
      .sort(sortOrder)
      .limit(Number(limit))
      .lean();

    // Get product counts and active listings for each designer
    const designersWithStats = await Promise.all(
      designers.map(async (designer) => {
        const productsCount = await Product.countDocuments({
          sellerId: designer._id,
          sellerType: 'Designer',
          status: 'approved',
          isActive: true
        });

        const activeListings = await Product.countDocuments({
          sellerId: designer._id,
          sellerType: 'Designer',
          status: 'approved',
          isActive: true,
          stock: { $gt: 0 }
        });

        const specialties = await Product.distinct('category', {
          sellerId: designer._id,
          sellerType: 'Designer',
          status: 'approved'
        });

        return {
          id: designer._id.toString(),
          name: designer.fullName,
          bio: designer.bio,
          location: designer.location,
          productsCount,
          activeListings,
          specialties,
          profileUrl: `/designer/${designer._id}`,
          averageRating: designer.averageRating || 0,
          ratingCount: designer.ratingCount || 0,
          totalReviews: designer.totalReviews || 0
        };
      })
    );

    res.json({
      success: true,
      designers: designersWithStats,
      total: designersWithStats.length,
      sortOrder: sort,
      criteria: {
        minRating: Number(minRating),
        minReviews: Number(minReviews)
      }
    });

  } catch (error) {
    console.error('Chatbot top-rated designers error:', error);
    res.status(500).json({ error: 'Failed to get top-rated designers' });
  }
};

// SEARCH RESELLERS - Find resellers
export const searchResellers = async (req, res) => {
  try {
    const { q, limit = 5 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({ resellers: [], total: 0 });
    }

    const query = {
      isActive: true,
      fullName: { $regex: q, $options: 'i' }
    };

    const resellers = await Reseller.find(query)
      .limit(Number(limit))
      .select('fullName bio location')
      .lean();

    // Get product counts
    const resellersWithCounts = await Promise.all(
      resellers.map(async (reseller) => {
        const productsCount = await Product.countDocuments({
          sellerId: reseller._id,
          sellerType: 'Reseller',
          status: 'approved',
          isActive: true
        });

        return {
          id: reseller._id.toString(),
          name: reseller.fullName,
          bio: reseller.bio,
          location: reseller.location,
          productsCount,
          profileUrl: `/reseller/${reseller._id}`
        };
      })
    );

    res.json({
      success: true,
      resellers: resellersWithCounts,
      total: resellers.length
    });

  } catch (error) {
    console.error('Chatbot reseller search error:', error);
    res.status(500).json({ error: 'Failed to search resellers' });
  }
};
