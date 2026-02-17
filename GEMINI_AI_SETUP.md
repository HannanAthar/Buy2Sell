# Gemini AI Chatbot Integration - Setup Guide

## Overview

The Buy2Sell chatbot has been transformed to use Google's Gemini AI for intelligent query understanding. This eliminates manual data entry and enables true AI-powered natural language processing.

## Features

✅ **Automatic Query Understanding** - Gemini understands user intent without manual rules  
✅ **Spelling Correction** - Automatically corrects typos (e.g., "loofers" → "loafers")  
✅ **Context Awareness** - Remembers conversation context  
✅ **Natural Language Processing** - Understands complex queries like "cheapest red designer dress under 5000"  
✅ **Real-time Database Connection** - Queries your existing database directly  
✅ **Self-Learning** - Can learn from user interactions (future enhancement)  

## Setup Instructions

### 1. Install Dependencies

The `@google/generative-ai` package has been added to `backend/package.json`. Install it:

```bash
cd backend
npm install
```

### 2. Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

### 3. Configure Environment Variable

Add your Gemini API key to your `.env` file in the `backend` directory:

```env
GEMINI_API_KEY=your_api_key_here
```

### 4. Enable Gemini AI in Frontend

To enable the AI-powered chatbot, set the environment variable in your frontend `.env`:

```env
REACT_APP_USE_GEMINI_AI=true
```

Or set it to `false` to use the manual rule-based system (for backward compatibility).

### 5. Restart Your Servers

```bash
# Backend
cd backend
npm start

# Frontend
cd frontend
npm start
```

## How It Works

### Architecture

```
User Query → Gemini AI Processing → Database Query → Results → AI Response
```

### Query Processing Flow

1. **User sends query** (e.g., "loofers")
2. **Gemini AI processes query:**
   - Corrects spelling: "loofers" → "loafers"
   - Identifies intent: PRODUCT_SEARCH
   - Extracts entities: category=footwear, productType=loafers
   - Generates structured query
3. **Backend executes database query** based on Gemini's understanding
4. **Gemini generates natural language response** (optional)
5. **Frontend displays results** with AI-generated text

### Example Queries

| User Query | Gemini Understanding | Result |
|------------|---------------------|--------|
| "loofers" | Corrects to "loafers", searches footwear category | Shows "Premium Casual Lofers" |
| "any designers" | Intent: LIST_DESIGNERS | Lists all designers from database |
| "abdul designer" | Intent: DESIGNER_QUERY, designerName: "Abdul" | Shows Abdul's products |
| "cheapest sneakers" | Intent: CHEAPEST_QUERY, category: footwear, sortBy: price_asc | Shows sneakers sorted by price |
| "bags under 3000" | Intent: PRODUCT_SEARCH, category: bags, maxPrice: 3000 | Shows bags under Rs 3000 |

## API Endpoints

### New AI Endpoint

**POST** `/api/chatbot/ai/query`

**Request Body:**
```json
{
  "q": "user query text",
  "context": {
    "lastIntent": "PRODUCT_SEARCH",
    "lastQuery": "previous query"
  }
}
```

**Response:**
```json
{
  "success": true,
  "query": "loofers",
  "parsedQuery": {
    "intent": "PRODUCT_SEARCH",
    "searchTerm": "loafers",
    "category": "footwear",
    "productType": "loafers",
    "spellingCorrections": {"loofers": "loafers"},
    "confidence": "high"
  },
  "results": {
    "type": "products",
    "products": [...],
    "total": 1
  },
  "aiResponse": "I found Premium Casual Lofers..."
}
```

## Benefits Over Manual System

### Before (Manual System)
- ❌ Manual spelling corrections database
- ❌ Manual intent classification rules
- ❌ Manual category mappings
- ❌ Manual product data entry
- ❌ Requires updates for every new product

### After (Gemini AI System)
- ✅ Automatic spelling correction
- ✅ Automatic intent understanding
- ✅ Automatic category detection
- ✅ Direct database connection
- ✅ New products automatically searchable

## Troubleshooting

### Gemini API Not Working

1. **Check API Key:**
   ```bash
   # In backend/.env
   GEMINI_API_KEY=your_key_here
   ```

2. **Check API Quota:**
   - Free tier: 15 requests per minute
   - Check usage at [Google AI Studio](https://makersuite.google.com/)

3. **Fallback System:**
   - If Gemini fails, the system automatically falls back to the manual rule-based system
   - Check console logs for errors

### Enable/Disable AI

**To disable AI and use manual system:**
```env
REACT_APP_USE_GEMINI_AI=false
```

**To enable AI:**
```env
REACT_APP_USE_GEMINI_AI=true
```

## Cost Considerations

- **Free Tier:** 15 requests per minute
- **Paid Tier:** $0.00025 per 1K characters (very affordable)
- **Recommendation:** Start with free tier, upgrade if needed

## Future Enhancements

1. **Learning System:** Track successful queries and improve over time
2. **Conversation Memory:** Better context across multiple messages
3. **Recommendations:** AI-powered product recommendations
4. **Multi-language Support:** Automatic language detection and translation

## Support

For issues or questions:
1. Check console logs for error messages
2. Verify API key is set correctly
3. Ensure backend server is running
4. Check network connectivity to Google AI API

---

**Note:** The manual rule-based system remains available as a fallback. You can switch between systems using the `REACT_APP_USE_GEMINI_AI` environment variable.

