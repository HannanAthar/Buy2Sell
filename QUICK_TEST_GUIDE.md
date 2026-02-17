# Quick Test Guide - Custom Design Backend Integration

## 🚀 Quick Start Testing (5 Minutes)

### Step 1: Test Custom Design Creation
1. Open browser and go to: `http://localhost:5173/custom-shirt-designer`
2. Click on any product (e.g., "Cotton Tee")
3. Add some design elements:
   - **Front Side:**
     - Click "Add Text" → Type "HELLO"
     - Click "Add Shapes" → Add a circle
     - Click "Add Templates" → Select any template
   - **Switch to Back:**
     - Click "BACK" button at top
     - Click "Add Text" → Type "WORLD"
4. Select a color: Try "Blue" or "Red"
5. Click "Add to Cart" button (top right)

### Step 2: Verify Backend Save
**Expected Console Output:**
```
🎨 Starting cart add process...
📸 Capturing design preview...
✅ Preview captured successfully
🛒 Sending to backend: {
  hasPreview: true,
  imageUrlsCount: 3,
  price: 1600,
  designDataKeys: ['front', 'back', 'color', 'capturedAt']
}
✅ Added to backend cart successfully
```

**Check MongoDB:**
1. Open MongoDB Compass
2. Connect to your database
3. Go to `carts` collection
4. Find your user's cart
5. Verify fields exist:
   - `isCustom: true`
   - `customPreview: "data:image/png;base64,..."`
   - `designData.front` (has text, shapes, decals)
   - `designData.back` (has text)
   - `productMeta.color: "blue"`

### Step 3: Place Order
1. Go to cart page: `http://localhost:5173/cart`
2. Verify custom design preview shows
3. Click "Proceed to Checkout"
4. Fill in shipping details
5. Select "Cash on Delivery"
6. Place Order

### Step 4: Check Admin Panel
1. Login as admin
2. Go to: `http://localhost:5173/admin`
3. Click "Orders" in sidebar
4. Find your order (should be at top)
5. Click "Manage" button

### Step 5: Verify Admin Features
**You should see:**
- ✅ Order details slide-out opens
- ✅ Custom design item has purple "🎨 Custom Design" badge
- ✅ Large preview image displays your design
- ✅ "Download Preview" button exists
- ✅ Grid showing 3 images (preview, front base, back base)
- ✅ Each image has its own download button
- ✅ Design Details panel shows:
  - Color: Blue (or whatever you selected)
  - Front Design: Text: "HELLO" Shapes(1) Templates(1)
  - Back Design: Text: "WORLD"
  - Created: [timestamp]

### Step 6: Test Downloads
1. Click "Download Preview" button
2. File downloads as PNG (e.g., `Cotton_Tee_Blue_preview_1733881234567.png`)
3. Open file - should show your complete design
4. Click download on other images
5. All should download successfully

---

## ✅ Success Criteria

Your integration is working if:
1. ✅ No errors in browser console
2. ✅ Toast shows "added to cart" success message
3. ✅ MongoDB has custom design data
4. ✅ Order appears in admin panel
5. ✅ Design preview shows in admin
6. ✅ Download buttons work
7. ✅ Design details are accurate

---

## 🐛 Common Issues & Fixes

### Issue: "Login required" error
**Fix:** Login to the application first
```
Go to /login → Enter credentials → Then try custom designer
```

### Issue: Preview not captured
**Fix:** Wait for page to fully load before adding to cart
```
Make sure shirt preview is visible on screen
Wait 1-2 seconds after making changes
Then click Add to Cart
```

### Issue: Images not in MongoDB
**Fix:** Check backend console for errors
```
Backend terminal should show:
POST /api/cart 200 [time]ms
```

### Issue: Can't see orders in admin
**Fix:** Ensure you're logged in as admin
```
Admin credentials should have role: "admin"
Check localStorage for token
```

### Issue: Download not working
**Fix:** Check browser settings
```
Allow downloads from localhost
Disable pop-up blocker
Try different browser
```

---

## 📊 What Data to Verify in MongoDB

### Cart Document:
```javascript
{
  "userId": "...",
  "items": [
    {
      "productId": "custom-1-1733881234567",
      "name": "Cotton Tee — Blue",
      "isCustom": true,
      "customPreview": "data:image/png;base64,iVBORw0KG...", // Look for this!
      "imageUrls": ["...", "...", "..."], // Should be array of 3
      "designData": {
        "front": {
          "text": { "value": "HELLO" }, // Your text
          "shapes": [{ "kind": "circle" }], // Your shape
          "decals": [{ "src": "/T-Designs/..." }] // Your template
        },
        "back": {
          "text": { "value": "WORLD" }
        },
        "color": "blue",
        "capturedAt": "2025-12-10T..."
      },
      "productMeta": {
        "color": "blue",
        "colorLabel": "Blue",
        "name": "Cotton Tee"
      }
    }
  ]
}
```

### Order Document:
Should have same structure in `items` array.

---

## 🎯 Quick Checklist

- [ ] Custom designer loads
- [ ] Can add text to front
- [ ] Can add shapes to front  
- [ ] Can add templates to front
- [ ] Can switch to back view
- [ ] Can add elements to back
- [ ] Can select different colors
- [ ] Add to cart shows toast
- [ ] Console shows success logs
- [ ] MongoDB has cart document
- [ ] Cart has `isCustom: true`
- [ ] Cart has `customPreview` base64 data
- [ ] Cart has `designData` object
- [ ] Can place order successfully
- [ ] Order appears in admin panel
- [ ] Order shows custom design badge
- [ ] Preview image displays
- [ ] Download button works
- [ ] Design details are correct
- [ ] All 3 images display
- [ ] Individual downloads work

---

## 🔍 Debugging Commands

### Check if backend is running:
```bash
# Backend should be on port 5000
curl http://localhost:5000/api/health
```

### Check MongoDB connection:
```bash
# In backend console, look for:
MongoDB connected: your-database-name
```

### Check cart in MongoDB:
```javascript
// In MongoDB Compass/Shell:
db.carts.find({ userId: ObjectId("your-user-id") })
```

### Check orders in MongoDB:
```javascript
// In MongoDB Compass/Shell:
db.orders.find().sort({ createdAt: -1 }).limit(1)
```

---

## 📞 Need Help?

If something isn't working:

1. **Check browser console** - Look for errors (F12)
2. **Check backend console** - Look for server errors
3. **Check MongoDB** - Verify data is saving
4. **Check network tab** - Ensure API calls succeed (F12 → Network)
5. **Clear cache** - Sometimes old data causes issues (Ctrl+Shift+Delete)
6. **Restart servers** - Stop and restart both frontend and backend

---

## 🎉 That's It!

If all checks pass, your custom design backend integration is working perfectly! 

Customers can now:
- ✅ Create custom designs
- ✅ Save them to cart
- ✅ Place orders

Admins can now:
- ✅ View all custom designs
- ✅ See front and back designs
- ✅ Download design images
- ✅ See all design details

**Everything is fully integrated with MongoDB!** 🚀
