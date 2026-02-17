# Stripe Connect Escrow Implementation

This document describes the escrow-like payment flow implemented using Stripe Connect for the Buy2Sell marketplace.

## Overview

The escrow flow ensures that buyer payments are held by the platform until delivery confirmation, at which point funds are released to the seller. This protects both buyers and sellers in the marketplace.

## How It Works

### 1. Checkout Flow

When a buyer completes checkout with a card payment:
- A Stripe Checkout Session is created
- Customer pays to the **platform account** (not seller)
- PaymentIntent is created and captured
- Order is created with status: `PAID_HELD`

### 2. Funds Held in Escrow

After payment:
- Funds are held in the platform's Stripe account
- Order status: `PAID_HELD`
- PaymentIntent ID and seller's Connect account ID are stored
- **No transfer to seller yet**

### 3. Order Fulfillment Flow

1. **Seller ships**: Order status → `SHIPPED`
2. **Buyer receives**: Order status → `DELIVERED`
3. **Funds released**: Admin triggers release → `RELEASED`

### 4. Release Funds

When conditions are met (delivery confirmation, admin approval, or auto-release after X days):
- Transfer is created to seller's connected account
- Transfer ID is stored in order
- Order status → `RELEASED`
- Seller receives funds (via Stripe's payout schedule)

### 5. Dispute & Refund

If a dispute occurs:
- Order status → `DISPUTED`
- Funds remain held
- Admin can issue refund if needed → `REFUNDED`

## Database Schema Changes

### Order Model

Added fields to `payment` schema:
- `paymentIntentId`: Stripe PaymentIntent ID (charge on platform)
- `chargeId`: Stripe Charge ID (for reference)
- `transferId`: Stripe Transfer ID (when released to seller)
- `sellerConnectAccountId`: Seller's Stripe Connect account ID

Added status values:
- `PAID_HELD`: Payment received, funds held
- `SHIPPED`: Order shipped by seller
- `DELIVERED`: Order delivered to buyer
- `RELEASED`: Funds released to seller
- `DISPUTED`: Dispute opened
- `REFUNDED`: Refunded to buyer

### Designer & Reseller Models

Added fields:
- `stripeConnectAccountId`: Stripe Connect account ID
- `stripeConnectAccountStatus`: Account status (pending/restricted/enabled)

## API Endpoints

### Escrow Endpoints

#### Get Escrow Status
```
GET /api/escrow/status/:orderId
```
Returns escrow status and payment information for an order.

#### Release Funds
```
POST /api/escrow/release/:orderId
Auth: admin
```
Releases held funds to seller's connected account.

#### Refund Order
```
POST /api/escrow/refund/:orderId
Auth: admin
Body: { reason?, amount? } // amount is optional (partial refund)
```
Refunds payment to buyer (full or partial).

#### Dispute Order
```
POST /api/escrow/dispute/:orderId
Auth: admin, buyer
Body: { reason? }
```
Marks order as disputed, holds funds.

### Admin Endpoints

#### Create Stripe Connect Account
```
POST /api/admin/connect/create
Auth: admin
Body: { sellerId, sellerType: "designer" | "reseller" }
```
Creates a Stripe Connect Express account for a seller.

#### Get Connect Account Status
```
GET /api/admin/connect/status?sellerId=xxx&sellerType=designer
Auth: admin
```
Returns the status of a seller's Connect account.

#### Get Account Link (Onboarding)
```
GET /api/admin/connect/link?sellerId=xxx&sellerType=designer
Auth: admin
```
Returns onboarding URL for seller to complete Connect setup.

#### Get Escrow Orders
```
GET /api/admin/escrow/orders?status=PAID_HELD
Auth: admin
```
Returns all escrow orders, optionally filtered by status.

### Order Status Updates

#### Update Order Status
```
PATCH /api/orders/:id/status
Body: { status }
```

Valid transitions:
- **Seller**: Can update to `SHIPPED` or `processing`
- **Buyer**: Can update to `DELIVERED` or `DISPUTED`
- **Admin**: Can update to any valid status
- **Note**: `RELEASED` and `REFUNDED` must use dedicated endpoints

## Stripe Connect Setup

### 1. Seller Onboarding

1. Admin creates Connect account via API
2. Seller receives onboarding link
3. Seller completes Stripe onboarding (bank details, verification)
4. Account status becomes `enabled` when complete

### 2. Account Status

- `pending`: Account created but not fully set up
- `restricted`: Account needs attention (Stripe review)
- `enabled`: Account ready to receive transfers

## Environment Variables

Ensure these are set in `backend/.env`:

```env
STRIPE_SECRET_KEY=sk_test_...  # Your Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_...  # Webhook signing secret
FRONTEND_URL=http://localhost:5173  # Frontend URL for Connect redirects
```

## Payment Flow Details

### Checkout Session → PaymentIntent

The webhook handler (`stripeWebhook`) automatically:
1. Retrieves PaymentIntent from the session
2. Looks up seller's Connect account ID from first order item
3. Stores PaymentIntent ID and Connect account ID in order
4. Sets order status to `PAID_HELD`

### Transfer Flow

When releasing funds:
1. Validates order is in `PAID_HELD` or `DELIVERED` status
2. Validates seller's Connect account is enabled
3. Creates Stripe Transfer to seller's account
4. Updates order with transfer ID and status `RELEASED`

### Refund Flow

If refund is needed:
1. Creates Stripe Refund for the PaymentIntent
2. Updates order status to `REFUNDED`
3. Sends notification email to buyer

## Important Notes

### Multi-Seller Orders

**Current Limitation**: The implementation assumes one seller per order (uses first item's seller). For orders with multiple sellers:

- Option 1: Split orders by seller at checkout
- Option 2: Enhance to support multiple transfers per order (future enhancement)

### Platform Fees

Currently, the full order amount is transferred to seller. To add platform fees:

1. Calculate fee amount: `platformFee = orderTotal * feePercentage`
2. Transfer amount: `transferAmount = orderTotal - platformFee`
3. Platform keeps the difference

### Auto-Release

The current implementation requires manual release via API. To add auto-release:

1. Create a cron job or scheduled task
2. Check for orders in `DELIVERED` status older than X days
3. Call `/api/escrow/release/:orderId` for each

### Currency

Currently uses PKR (Pakistani Rupees). Ensure Stripe account supports PKR for transfers. If using different currency, update currency codes in:
- `stripeConnectService.js` (transfer creation)
- Order model (totals.currency)

## Testing

### Test Card (Stripe Test Mode)
- Card: `4242 4242 4242 4242`
- Any future expiry date
- Any CVC

### Test Flow

1. **Create Connect Account**:
   ```bash
   POST /api/admin/connect/create
   { "sellerId": "...", "sellerType": "designer" }
   ```

2. **Get Onboarding Link**:
   ```bash
   GET /api/admin/connect/link?sellerId=...&sellerType=designer
   ```
   Complete onboarding in Stripe dashboard

3. **Create Order** (via checkout):
   - Use test card
   - Order should have status `PAID_HELD`

4. **Update Status to SHIPPED**:
   ```bash
   PATCH /api/orders/:id/status
   { "status": "SHIPPED" }
   ```

5. **Update Status to DELIVERED**:
   ```bash
   PATCH /api/orders/:id/status
   { "status": "DELIVERED" }
   ```

6. **Release Funds**:
   ```bash
   POST /api/escrow/release/:orderId
   ```

7. **Verify in Stripe Dashboard**:
   - Payment should show in platform account
   - Transfer should show in seller's connected account

## Security Considerations

1. **Admin-only endpoints**: Release funds and refunds require admin authentication
2. **Status validation**: Prevents invalid status transitions
3. **Connect account validation**: Ensures account is enabled before transfer
4. **Webhook signature verification**: Validates Stripe webhook authenticity

## Future Enhancements

1. **Platform fees**: Deduct fees before transfer
2. **Multi-seller support**: Handle multiple transfers per order
3. **Auto-release**: Automatic release after delivery + time period
4. **Partial refunds**: Support partial order refunds
5. **Transfer reversals**: Handle failed transfers
6. **Email notifications**: Send emails for status changes
7. **Dashboard UI**: Admin UI for managing escrow orders
