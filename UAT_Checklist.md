# User Acceptance Testing (UAT) Checklist

## 1. Responsive Implementation (Mobile First)

- [ ] **Navigation Bar**
  - [ ] Hamburger menu opens/closes smoothly on mobile.
  - [ ] Links in mobile menu are easily tappable (min 44px height).
  - [ ] Search bar behaves correctly on mobile (expands/collapses).
- [ ] **Product Grid**
  - [ ] 2 columns on mobile, 4 on desktop.
  - [ ] Images load lazily without layout shift.
  - [ ] No horizontal scrolling issues.
- [ ] **Product Details**
  - [ ] Images swipe or stack correctly on mobile.
  - [ ] "Add to Cart" button is sticky or easily accessible.
  - [ ] Quantity and Size selectors have 44px+ touch targets.
- [ ] **Cart & Checkout**
  - [ ] Cart summary is readable on small screens.
  - [ ] Checkout steps (Info > Payment > Review) are clearly visible.

## 2. Visual & Animation Polish

- [ ] **Animations**
  - [ ] Card flips (Designer/Reseller) are smooth (3D rotate).
  - [ ] Hover effects on buttons do not cause layout jitter.
  - [ ] Page transitions (if any) do not flash white.
- [ ] **Images**
  - [ ] All images use Cloudinary optimization (auto format).
  - [ ] Placeholders appear before images load.
  - [ ] No broken image icons.

## 3. Performance

- [ ] **Loading Speed**
  - [ ] Home page loads under 2 seconds on 4G.
  - [ ] Interaction to Next Paint (INP) feels instant.
- [ ] **Bundle Size**
  - [ ] Initial JS bundle is reasonable (code split active).

## 4. Security

- [ ] **Inputs**
  - [ ] Forms validate input (email, required fields).
  - [ ] XSS payloads (e.g. `<script>`) are escaped/sanitized.
- [ ] **Uploads**
  - [ ] Only image files (JPG, PNG, WEBP) are accepted.
  - [ ] Large files (>10MB) are rejected with error.

## 5. Functional Flows

- [ ] **Guest Checkout**
  - [ ] Can add to cart and checkout without login (if allowed) or prompted to login.
- [ ] **User Dashboard**
  - [ ] Can view Order History.
  - [ ] Can update profile settings.
