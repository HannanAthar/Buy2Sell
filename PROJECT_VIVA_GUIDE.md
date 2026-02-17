# Project Viva Guide: Buy2Sell

This document provides a comprehensive detailed explanation of the logic, libraries, and concepts used in the Buy2Sell project. It is designed to help you answer questions during your viva.

---

## 🚀 1. Technology Stack Overview

### Frontend (Client-Side)
*   **Framework:** React 18+ (JavaScript library for building user interfaces)
*   **Build Tool:** Vite (Fast build tool and development server)
*   **Styling:** Tailwind CSS (Utility-first CSS framework for rapid styling)
*   **Routing:** React Router DOM (Handles navigation between pages without reloading)
*   **State Management:** React Context API (Shared state across components like `ProductContext`)
*   **HTTP Client:** Axios (For sending requests to the Backend)
*   **Animations:** Framer Motion (Library for complex animations and transitions) & CSS Keyframes.
*   **Icons:** `lucide-react`, `react-icons`.
*   **Image Handling:** `html2canvas` (for capturing custom designs).
*   **Notifications:** `react-hot-toast` (for toast notifications).

### Backend (Server-Side)
*   **Runtime:** Node.js (JavaScript runtime environment)
*   **Framework:** Express.js (Web framework for handling API routes and middleware)
*   **Database:** MongoDB (NoSQL database) with Mongoose (ORM for modeling data)
*   **Authentication:** JWT (JSON Web Tokens) & Bcrypt (Password Hashing)
*   **Cloud Storage:** Cloudinary (For storing uploaded images) (via Multer)
*   **Payment:** Stripe (Payment processing)
*   **Email:** `nodemailer` (for sending emails).

---

## 🎨 2. Frontend Detailed Concepts

### **React Main Concepts**
1.  **Components:** The building blocks of the UI.
    *   *Functional Components:* We use modern functional components (e.g., `const Header = () => { ... }`).
    *   *Where:* `d:\Buy2Sell\frontend\src\components\` contains ~60 components.
2.  **Hooks:**
    *   `useState`: Managing local component state (e.g., form inputs, loading spinners).
    *   `useEffect`: Handling side effects (e.g., fetching data when a page loads, creating event listeners).
    *   `useContext`: Accessing global data (e.g., `ProductContext` for accessing the list of products anywhere).
    *   `useRef`: Accessing DOM elements directly (used in `CustomShirtDesigner` and hover effects).
3.  **Routing (`react-router-dom`):**
    *   We use `BrowserRouter` wrapped around the app.
    *   `Routes` and `Route` define which component to show for which URL (e.g., path `/login` -> shows `Login` component).
    *   `useNavigate`: A hook to programmatically redirect users (e.g., `navigate('/login')` after signup).

### **Styling & UI (Tailwind CSS)**
*   **Concept:** Instead of writing separate `.css` files, classes are applied directly in HTML.
*   **Common Patterns:**
    *   **Layout:** `flex`, `grid`, `items-center`, `justify-between`.
    *   **Spacing:** `p-4` (padding 1rem), `m-2` (margin 0.5rem), `gap-4`.
    *   **Colors:** `bg-emerald-500`, `text-gray-800`, `border-black/10`.
    *   **Responsiveness:** `md:flex` (flex only on medium screens and up), `hidden md:block` (hidden on mobile, block on desktop).
*   **Global Effects:** checked `index.css`
    *   **Glassmorphism:** `backdrop-blur`, `bg-white/50`.
    *   **Hover Bloom Effect:** A custom CSS implementation in `index.css` that tracks mouse position (`--mouse-x`, `--mouse-y`) to create a flashlight/bloom effect on hero sections.

### **Animations (Framer Motion)**
*   **Logic:** We use the `<motion.div>` component.
*   **Declarative Animation:** Instead of imperative JS, we describe the state.
    *   `initial={{ opacity: 0, y: 20 }}`: Start invisible and slightly lower.
    *   `animate={{ opacity: 1, y: 0 }}`: Move to visible and original position.
    *   `transition={{ duration: 0.5 }}`: Take 0.5 seconds.
*   **Where:** Page transitions (`AnimatePresence`), Modal popups, Hover scales on cards.

### **Custom Shirt Designer Logic (`CustomShirtDesigner.jsx`)**
*   **Canvas/DOM Manipulation:**
    *   The user adds images/text to a "Canvas" area (a `div`).
    *   We track their positions (x, y), scale, and rotation in React state.
*   **Exporting:**
    *   We use `html2canvas` to take a "screenshot" of that specific DOM element.
    *   This generates a base64 image string which is sent to the backend as the "Design".

---

## 🛠️ 3. Backend Detailed Concepts

### **Express.js & Middleware**
*   **Server Setup:** `index.js` initializes the Express app.
*   **Middleware:** Functions that run *in the middle* of the request flow.
    *   `cors`: Allows Frontend (port 5173) to talk to Backend (port 5000).
    *   `express.json()`: Parses incoming JSON bodies so we can use `req.body`.
    *   `errorHandler`: A custom middleware (`middlewares/errorHandler.js`) that catches errors from anywhere and sends a clean JSON response.
    *   `rateLimiter`: Prevents spam by limiting how many requests an IP can make.

### **Authentication (JWT & Bcrypt)**
*   **Registration:**
    1.  User submits password -> `bcrypt.hash(password, 10)` -> Store hash in DB.
*   **Login:**
    1.  User submits password -> `bcrypt.compare(input, hash)`.
    2.  If match -> Generate **JWT** (JSON Web Token).
    3.  Token contains: `{ id: user._id, role: 'designer' }`.
*   **Protection:**
    *   `authMiddleware.js`: Checks for the token in the `Authorization` header.
    *   It decodes it using the `JWT_SECRET`. If valid, it adds `req.user` to the request object.

### **Database (MongoDB & Mongoose)**
*   **Mongoose Models:** Define the structure of data.
    *   `User`, `Designer`, `Reseller`: Different collections for different user types.
    *   `Product`: Stores title, price, image URLs, category.
    *   `Order`: Stores buyer info, product list, total amount, status.
*   **Validation:** Mongoose handles validation (e.g., `required: true`, `unique: true`). We recently adjusted this to handle legacy data issues (Phone number validation).

### **Image Uploads (Cloudinary)**
*   **Flow:**
    1.  Frontend sends file (Multipart/Form-Data).
    2.  Backend `multer` middleware catches the file.
    3.  File is uploaded to **Cloudinary** (a cloud image hosting service).
    4.  Cloudinary returns a secure URL (https://...).
    5.  We save *only the URL* in our MongoDB database.

---

## 🧠 4. Key Workflows & Logic

### **1. Role-Based Navigation**
*   The app has distinct dashboards: `BuyerDashboard`, `DesignerDashboard`, `ResellerDashboard`.
*   Logic: Upon login, the backend response includes the user's `role`. The frontend redirects based on this role (`navigate('/designer/dashboard')`).
*   **Sidebar/Header:** These components conditionally render links based on the logged-in user's role.

### **2. Notification System**
*   **Library:** `react-hot-toast`.
*   **Logic:**
    *   We use `toast.success("Message")` or `toast.error("Message")`.
    *   The `<Toaster />` component in `App.jsx` listens for these events and displays the popup.
    *   *Recent Change:* Moved to "top-center" and increased duration to 4s for better visibility.

### **3. Order Logic**
*   **Cart:** Items are stored in `localStorage` or backend cart collection.
*   **Checkout:** User enters details -> Creates an Order document in MongoDB with status "Pending".
*   **Payment:** If using Stripe, a payment intent is created. If "COD" (Cash on Delivery), order is saved directly.

---

## 📊 5. Summary Codebase Stats (Estimated)
*   **Total Components:** ~70 Files.
*   **Backend Routes:** ~10 Route files (Auth, Products, Orders, Admin, etc.).
*   **Database Collections:** ~8 Core collections.

---

## 💡 Viva FAQs (Cheat Sheet)

**Q: Why did you use React instead of plain HTML/JS?**
**A:** React's component-based architecture allows us to reuse code (like the `ProductCard` or `Header`). The Virtual DOM ensures the app is fast and responsive, unlike reloading pages in plain HTML.

**Q: Explain how the Authentication works.**
**A:** We use **Stateless Authentication** with JWT. The server doesn't remember the user in memory (Session). Instead, it gives the user a valid "Token" (ID card). The user must bring this Token with every request. We verify the token's signature to ensure it's valid.

**Q: What is the most challenging part of this project?**
**A:** (Possible answers):
1.  **Role Management:** Handling three different types of users (Designer, Reseller, Buyer) with different permissions and dashboards.
2.  **Image Handling:** Managing file uploads efficiently using Cloudinary and linking them to database records.
3.  **Custom T-Shirt Designer:** Implementing the logic to manipulate images/text on a canvas and saving that design accurately.

**Q: How does the Frontend talk to the Backend?**
**A:** We use **Axios**. We have setup "Interceptors" in `api/axios.js`. This automatically attaches the User's Token to every request, so we don't have to write it manually every time we call an API.

## 🏗️ 2. Backend Architecture (Deep Dive)

The backend follows the **MVC (Model-View-Controller)** pattern, although in our API-only backend, the "View" is replaced by JSON responses.

### **A. How a Request Works (The Request-Response Cycle)**
When a user logs in:
1.  **Request:** Frontend sends `POST /api/auth/login` with `{ email, password }`.
2.  **Entry Point (`index.js`):** The server receives the request.
3.  **Global Middleware:**
    *   `cors()`: Checks if the request is from an allowed website.
    *   `express.json()`: Parses the raw bytes into a JavaScript Object (`req.body`).
    *   `helmet()`: Adds security headers.
    *   `rateLimit()`: Checks if the IP has made too many requests recently.
4.  **Router (`authRoutes.js`):** `app.use('/api/auth', authRoutes)` directs traffic to the correct file.
5.  **Controller (`authController.js`):** The specific function `loginUser` executes.
    *   Finds user in Database (Model).
    *   Compares Password (Bcrypt).
    *   Generates Token (JWT).
6.  **Response:** The server sends back JSON `{ token: "...", user: {...} }` and closes the connection.

### **B. Core Concepts & "Tough" Questions**

#### **1. CORS (Cross-Origin Resource Sharing)**
*   **Basic:** It allows our Frontend (port 5173) to talk to our Backend (port 5000). By default, browsers block this to prevent malicious sites from reading your data.
*   **Advanced:**
    *   **Preflight Requests (`OPTIONS`):** Before sending a complex request (like `POST` or one with custom headers), the browser sends a "Preflight" check. Our backend must reply "Yes, I accept POST from localhost:5173".
    *   **Credentials:** We set `credentials: true` in our CORS config. This is **critical** because it allows the browser to send **Cookies** (where we store the secure token) between domains. Without this, the cookie would be dropped.

#### **2. Middleware**
*   **Basic:** Functions that run *in the middle* of a request. They have access to `req` (Request), `res` (Response), and `next` (Function to move to the next step).
*   **Chain of Responsibility:**
    `Request -> Helmet -> CORS -> JSON Parser -> Auth Check -> Controller -> Response`
*   **Code Example:**
    ```javascript
    // authMiddleware.js
    export const protect = async (req, res, next) => {
        // 1. Check header/cookie for token
        if (!token) return res.status(401).json({ error: "Not authorized" });
        // 2. Move to the next function (the controller)
        next();
    };
    ```

#### **3. Authentication vs. Authorization**
*   **Authentication (Who are you?):** Verifying identity (e.g., Login with Password). We use **Bcrypt** to compare the input password with the stored *hash*.
*   **Authorization (What can you do?):** Verifying permissions.
    *   *Implementation:* Our `protect(['designer'])` middleware checks `req.user.role`. If a 'buyer' tries to access a 'designer' route, they get a 403 Forbidden error.

#### **4. JWT (JSON Web Tokens)**
*   **Structure:** Has 3 parts, separated by dots:
    1.  **Header:** Algorithm type (e.g., HS256).
    2.  **Payload:** Data (User ID, Role, Email). *Note: Never put passwords here, it's readable by anyone.*
    3.  **Signature:** The "seal". Created by hashing the Header + Payload + `JWT_SECRET` (stored deeply in `.env`).
*   **Security:** If a hacker changes the Payload (e.g., changes role to "admin"), the Signature won't match, and our server rejects it.
*   **Storage:** We store the token in an **HttpOnly Cookie**. This prevents XSS attacks (JavaScript cannot read this cookie), unlike `localStorage` which is vulnerable to malicious scripts.

#### **5. Database (Mongoose & Connection Pooling)**
*   **Models vs Schemas:**
    *   **Schema:** The "Blueprint" (structure, validation rules like `required: true`).
    *   **Model:** The "Constructor" used to interact with the DB (`User.find()`).
*   **Connection Pooling:**
    *   *Question:* "Does the server open a new connection for every user?"
    *   *Answer:* **No.** That would crash the DB. We use a **Pool** (configured in `index.js` with `maxPoolSize: 10`). The server keeps ~10 connections open and reuses them. It's like having 10 phone lines; when one call finishes, the line is free for the next person.

---

## 🎨 3. Frontend Architecture

### **A. Component Lifecycle (Hooks)**
*   **Mounting:** `useEffect(() => {}, [])`. Runs once when the component appears. Used for fetching data.
*   **Updating:** `useEffect(() => {}, [dependency])`. Runs whenever the `dependency` changes (e.g., refetch products when "Category" filter changes).
*   **Unmounting:** `useEffect(() => { return () => cleanup() }, [])`. Cleanup function runs when component disappears (e.g., stopping a timer).

### **B. Global State (Context API)**
Instead of "Prop Drilling" (passing data Parent -> Child -> Grandchild), we use Context.
*   `ProductContext`: Wraps the entire app. It fetches products *once* and provides them to `HomePage`, `ShopPage`, and `ProductDetail`. This avoids unnecessary API calls.

### **C. Custom Features**
*   **Custom Shirt Designer (`CustomShirtDesigner.jsx`):**
    *   uses `useRef` to directly grab the DOM element of the T-shirt.
    *   uses `html2canvas` library to "photograph" that DOM element.
    *   Converts the screenshot into a **Base64 String** (text representation of an image) to send to the backend.
*   **Optimistic UI:** When a user likes a product, we verify the update locally *immediately* (turn heart red) before the server even responds. If the server fails, we revert it. This makes the app feel instant.

---

## ❓ 4. Tough Viva Questions & Answers

**Q1: Why do you use `express.json()`?**
**A:** Node.js receives data in **streams** (chunks of bytes). `express.json()` is a body-parsing middleware that collects all these chunks, assembles them, and parses them into a usable JavaScript Object attached to `req.body`. Without it, `req.body` would be undefined.

**Q2: What is the difference between `PUT` and `PATCH`?**
**A:** `PUT` replaces the **entire** resource (if you send just name, it wipes email/phone). `PATCH` updates **only** the fields provided (partial update). We mostly use `PATCH` for profile updates to avoid accidentally erasing data.

**Q3: How do you handle passwords securely?**
**A:** We use **Bcrypt**. It uses **Salting** (adding a random string to the password before hashing) to prevent Rainbow Table attacks. We perform this in a Mongoose "Pre-save Hook" (`userSchema.pre('save')`) so it happens automatically before writing to the DB.

**Q4: Explain the `async/await` syntax.**
**A:** JavaScript is single-threaded. `async/await` is syntactic sugar over **Promises**. It allows us to write non-blocking code that *looks* synchronous. While `await User.find()` pauses the *function execution*, it does **not** block the main thread, allowing the server to handle other users' requests simultaneously.

**Q5: How does the server handle concurrent users?**
**A:** Node.js uses an **Event Loop**. It delegates heavy headers (like DB queries or file I/O) to the valid system kernel or thread pool. When the task is done, it triggers a callback (or resolves a Promise) to return data to the main thread. This allows regular Node.js to handle thousands of concurrent connections.

**Q6: What happens if the Backend crashes?**
**A:** We handle errors using a global **Error Handling Middleware** (`middlewares/errorHandler.js`). Every controller uses `try/catch` blocks. If an error occurs, it is passed to `next(err)`, which skips all other logic and goes straight to the error handler to send a safe JSON response, preventing the server process from exiting unexpectedly.

---

## 🤖 5. Chatbot Architecture (Hybrid AI)

The Buy2Sell Chatbot uses a **Hybrid Architecture** combining explicit Rule-Based Logic with Generative AI (Google Gemini). This ensures 100% accuracy for core platform questions while maintaining conversational flexibility.

### **A. Core Logic Flow (`geminiChatbotController.js`)**
1.  **Frontend Request:** The user sends a message (e.g., "What is a Reseller?").
2.  **Step 1: Rule-Based Pre-Check (The Safety Net):**
    *   The controller *first* scans the message for specific keywords (`reseller`, `designer`, `escrow`, `buy2sell`, `rent`).
    *   If a match is found (e.g., "Reseller"), it returns a **Hardcoded, Pre-defined Answer** immediately.
    *   *Why?* To prevent AI hallucinations. We cannot afford the AI making up its own definition of our platform's fees or policies. This guarantees accuracy.
3.  **Step 2: AI Intent Classification (Fall-back):**
    *   If no rule matches (e.g., "Find me red shoes"), the system determines the intent (Product Search vs. General Chat).
4.  **Step 3: Product Search (RAG - Retrieval Augmented Generation):**
    *   If the user wants products, we query MongoDB using regex matches against the `Product` collection.
    *   The results are formatted into UI Cards and sent back with `type: "products"`.
5.  **Step 4: Generative AI Response:**
    *   If it's a general question not covered by rules, we construct a prompt with our **Knowledge Base** (`WEBSITE_INFO`) and send it to **Google Gemini (gemini-2.0-flash)**.
    *   The AI acts as the "Buy2Sell Assistant" (Persona) and generates a helpful response.

### **B. Security**
*   **Backend Proxy:** The frontend *never* talks to Google directly. It talks to our backend (`/api/chatbot/query`).
*   **Key Protection:** The `GEMINI_API_KEY` is stored in `.env` on the server, ensuring it is never exposed to the client browser.

### **C. Viva QA for Chatbot**
*   **Q: Why standard AI wasn't enough?**
    *   **A:** LLMs (Large Language Models) can "hallucinate" (make up facts). For critical questions like "What is your commission rate?", we need strict accuracy. Rule-based logic provides that certainty.
*   **Q: How does it find products?**
    *   **A:** It doesn't "see" products visually. It extracts keywords from your sentence ("red shoes") and runs a MongoDB text search command (`$regex`) to find matching items.
