import { GoogleGenerativeAI } from "@google/generative-ai";
import Product from '../models/Product.js';
import Designer from '../models/Designer.js';
import dotenv from 'dotenv';
dotenv.config();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// WEBSITE INFORMATION - PUT YOUR REAL INFO HERE
const WEBSITE_INFO = `
BUY2SELL PLATFORM DETAILED GUIDE:

=== 0. WHAT IS BUY2SELL? ===
Buy2Sell is a premier luxury fashion marketplace connecting Designers, Resellers, and Buyers in a secure environment. We specialize in authentic luxury branding, allowing users to buy and sell pre-loved items, shop from top designers, or create custom products.

=== 1. USER ROLES & DEFINITIONS ===
- **Buyer**: A user who browses and purchases products. No approval needed. Can shop for luxury items, custom products, and track orders.
- **Designer**: A creative professional who sells original fashion creations. Requires approval (Portfolio/CNIC). Gets a Virtual Showroom. Commission: 8-12%.
- **Reseller**: A user who sells pre-loved/used luxury items (closet cleanup). Requires approval (Wardrobe check/CNIC). Commission: 10-15%.
- **Admin**: The platform managers who verify products, approve accounts, and ensure quality control.

=== 2. KEY FEATURES & CONCEPTS ===
- **Custom Products (Design Studio)**: A feature allowing buyers to design their own t-shirts. You can add text, stickers, upload images, and even use AI to remove image backgrounds.
- **Escrow Payment System**: A security feature where the buyer's money is held safely by Buy2Sell (middleman) and only released to the seller AFTER the buyer receives and approves the product. This prevents fraud.
- **Virtual Showroom**: A dedicated profile page for Designers to showcase their collections professionally.

=== 3. HOW IT WORKS ===
1. **Browse & Buy**: Users find items from Designers or Resellers.
2. **Secure Payment**: Buyer pays, money goes to Escrow.
3. **Delivery**: Seller ships the item.
4. **Verification**: Buyer checks the item.
5. **Release**: Funds are released to the seller.

=== 4. POLICIES & PAYMENTS ===
- **Payment Methods**: Credit/Debit Cards, Bank Transfer, JazzCash/EasyPaisa, Cash on Delivery (COD).
- **Supports**: secure@buy2sell.com
`;

// MAIN CONTROLLER FUNCTION
export const processAIQuery = async (req, res) => {
  try {
    const { q } = req.body;
    const userMessage = q || "";

    console.log("Processing query:", userMessage);

    if (!userMessage || userMessage.trim().length < 2) {
      return res.json({
        success: true,
        type: 'text_only',
        message: 'Hello! How can I help you with Buy2Sell today?',
        products: [],
        showProducts: false
      });
    }

    // STEP 1: CLASSIFY INTENT
    let intentData = { intent: "PRODUCT_SEARCH", keywords: [] };

    // We prioritize manual classification for speed and reliability
    const manualIntent = classifyManually(userMessage);
    if (manualIntent !== "PRODUCT_SEARCH") {
      intentData.intent = manualIntent;
    } else {
      // Assume product search if it doesn't match website keywords
      intentData.keywords = userMessage.toLowerCase().split(" ").filter(w => w.length > 2);
    }

    console.log("Intent determined:", intentData.intent);

    let responseData;

    // STEP 2: HANDLE BASED ON INTENT
    if (intentData.intent === "WEBSITE_INFORMATION") {
      responseData = await handleWebsiteInfo(userMessage);
    }
    else if (intentData.intent === "NON_WEBSITE") {
      responseData = await handleNonWebsiteQuery();
    }
    else {
      // PRODUCT_SEARCH
      responseData = await handleProductSearch(intentData.keywords);
    }

    // Send response
    res.json({
      success: true,
      ...responseData
    });

  } catch (error) {
    console.error("Gemini API Error:", error);
    res.json({
      success: false,
      type: 'text_only',
      message: "I'm having trouble connecting right now. Please try again.",
      showProducts: false,
      products: []
    });
  }
};

// Helper: Manual Classification
function classifyManually(query) {
  const lowerQuery = query.toLowerCase();

  const websiteKeywords = [
    "how to", "join", "contact", "fee", "policy", "return",
    "shipping", "delivery", "register", "help", "support",
    "custom", "design", "admin", "reseller", "designer", "studio",
    "role", "escrow", "payment", "buy", "sell", "shop", "store",
    "hi", "hello", "hey", "greetings", "active", "work", "website",
    "what is", "who is", "platform", "rent", "renting"
  ];

  const nonWebsiteKeywords = [
    "weather", "joke", "funny", "who are you", "human"
  ];

  if (websiteKeywords.some(keyword => lowerQuery.includes(keyword))) {
    return "WEBSITE_INFORMATION";
  }

  if (nonWebsiteKeywords.some(keyword => lowerQuery.includes(keyword))) {
    return "NON_WEBSITE";
  }

  return "PRODUCT_SEARCH";
}

// Handler 1: WEBSITE INFORMATION
async function handleWebsiteInfo(userQuery) {
  const lowerQ = userQuery.toLowerCase();

  // --- RULE-BASED ANSWERS (Instant & Reliable) ---

  // 1. What is Buy2Sell?
  if (lowerQ.includes("buy2sell") || lowerQ.includes("website") || lowerQ.includes("platform")) {
    return {
      type: "text_only",
      message: "Buy2Sell is a premier luxury fashion marketplace connecting Designers, Resellers, and Buyers. We specialize in authentic luxury branding, enabling you to buy/sell pre-loved items, shop designer collections, rent outfits, or create custom products."
    };
  }

  // 2. Reseller Role
  if (lowerQ.includes("reseller")) {
    return {
      type: "text_only",
      message: "A Reseller is a user who sells pre-loved or used luxury items (like a closet cleanup). Registration requires wardrobe info and CNIC. Commission is 10-15% per sale."
    };
  }

  // 3. Designer Role
  if (lowerQ.includes("designer")) {
    return {
      type: "text_only",
      message: "A Designer is a creative professional selling original fashion creations. Registration requires a portfolio and CNIC. Designers get a dedicated Virtual Showroom. Commission is 8-12% per sale."
    };
  }

  // 4. Custom Products / Studio
  if (lowerQ.includes("custom") || lowerQ.includes("studio")) {
    return {
      type: "text_only",
      message: "Our Custom Design Studio allows buyers to design unique t-shirts! You can add text, stickers, upload images, and even use AI tools to remove backgrounds from your photos."
    };
  }

  // 5. Renting System (NEW)
  if (lowerQ.includes("rent") || lowerQ.includes("renting")) {
    return {
      type: "text_only",
      message: "Our Renting System allows you to wear luxury designer items for a special occasion (like weddings or parties) without paying the full price! You can rent items typically for 3 to 7 days. The payment is secured via Escrow."
    };
  }

  // 6. Escrow / Payment
  if (lowerQ.includes("escrow") || lowerQ.includes("payment") || lowerQ.includes("pay")) {
    return {
      type: "text_only",
      message: "We use a secure Escrow Payment System. Your payment is held safely by Buy2Sell and is ONLY released to the seller after you receive and approve the product. We accept Cards, Bank Transfer, JazzCash, and COD."
    };
  }

  // 7. How it works
  if (lowerQ.includes("work") || lowerQ.includes("process")) {
    return {
      type: "text_only",
      message: "Here's how Buy2Sell works:\n1. Browse & Buy/Rent items.\n2. Payment is held in Escrow (secure).\n3. Seller ships the item.\n4. You verify (or return if rented) the item.\n5. Funds are released to the seller."
    };
  }

  // 8. Greetings
  if (lowerQ.match(/\b(hi|hello|hey)\b/)) {
    return {
      type: "text_only",
      message: "Hello! I'm your Buy2Sell Assistant. I can help you with finding products, understanding our Reseller/Designer/Renting options, or checking order status. What do you need?"
    };
  }

  // --- FALLBACK TO AI FOR OTHER QUERIES ---
  const infoPrompt = `
  ROLE: You are the helpful and professional Buy2Sell AI Assistant.
  
  CONTEXT: The user is asking a question about the Buy2Sell platform.
  
  KNOWLEDGE BASE:
  ${WEBSITE_INFO}
  
  === CRITICAL INSTRUCTIONS ===
  1. **Identity**: You are the "Buy2Sell Assistant".
  2. **Tone**: specific, helpful, and concise (max 3 sentences).
  3. **Strict Scope**: If the user asks about the weather, general knowledge, or anything NOT related to Buy2Sell, politely decline.
  
  === USER QUESTION ===
  "${userQuery}"
  
  === RESPONSE (Text Only) ===
  Answer the user clearly based *strictly* on the Knowledge Base.
  `;

  try {
    const result = await model.generateContent(infoPrompt);
    const responseText = result.response.text();

    return {
      type: "text_only",
      message: responseText,
      showProducts: false,
      products: []
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      type: "text_only",
      message: "I can help with roles, payments, and finding products. Could you ask your question differently?",
      showProducts: false,
      products: []
    };
  }
}

// Handler 2: NON-WEBSITE QUERIES
async function handleNonWebsiteQuery() {
  return {
    type: "text_only",
    message: "I specialize in Buy2Sell! I can help you find luxury items, explain our Designer & Reseller roles, or check orders. How can I help with our platform today?",
    showProducts: false,
    products: []
  };
}

// Handler 3: PRODUCT SEARCH (ONLY when user wants products)
async function handleProductSearch(keywords) {
  if (!keywords || keywords.length === 0) {
    return {
      type: "text_only",
      message: "I can help you find products. Please tell me what you're looking for (e.g., bags, shoes, dresses).",
      showProducts: false,
      products: []
    };
  }

  const searchPattern = Array.isArray(keywords) ? keywords.join('|') : keywords;

  // Search database for relevant products
  const products = await Product.find({
    status: 'approved',
    isActive: true,
    $or: [
      { name: { $regex: searchPattern, $options: 'i' } },
      { category: { $regex: searchPattern, $options: 'i' } },
      { tags: { $in: Array.isArray(keywords) ? keywords : [keywords] } }
    ]
  })
    .select('name price stock images category sellerType sellerName listingType rentPrice averageRating description')
    .limit(4) // ONLY 4 PRODUCTS MAX!
    .lean();

  if (products.length === 0) {
    return {
      type: "text_only",
      message: `No products found matching "${Array.isArray(keywords) ? keywords.join(' ') : keywords}". Try searching for specific categories like "bags", "shoes", or "dresses".`,
      showProducts: false,
      products: []
    };
  }

  return {
    type: "products",
    message: `Found ${products.length} products matching your search:`,
    products: products.map(formatProduct),
    showProducts: true
  };
}

function formatProduct(p) {
  return {
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
    averageRating: p.averageRating || 0,
    sellerName: p.sellerName || 'Unknown'
  };
}
