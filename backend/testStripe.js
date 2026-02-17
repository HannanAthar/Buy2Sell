// Test Stripe Configuration
// Run this in backend directory: node testStripe.js

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Stripe from 'stripe';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

console.log('\n🔍 Testing Stripe Configuration...\n');

// Check environment variables
console.log('1. Environment Variables:');
console.log('   STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? `SET (${process.env.STRIPE_SECRET_KEY.substring(0, 12)}...)` : '❌ MISSING');
console.log('   STRIPE_WEBHOOK_SECRET:', process.env.STRIPE_WEBHOOK_SECRET ? `SET (${process.env.STRIPE_WEBHOOK_SECRET.substring(0, 12)}...)` : '❌ MISSING');
console.log('   FRONTEND_URL:', process.env.FRONTEND_URL || '❌ MISSING');

if (!process.env.STRIPE_SECRET_KEY) {
    console.log('\n❌ ERROR: STRIPE_SECRET_KEY is missing!');
    console.log('\n📝 To fix:');
    console.log('   1. Go to https://dashboard.stripe.com/test/apikeys');
    console.log('   2. Copy your "Secret key" (starts with sk_test_)');
    console.log('   3. Add to backend/.env file:');
    console.log('      STRIPE_SECRET_KEY=sk_test_your_key_here');
    process.exit(1);
}

// Test Stripe connection
console.log('\n2. Testing Stripe API Connection...');

try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2024-06-20',
    });

    const customers = await stripe.customers.list({ limit: 1 });
    console.log('   ✅ Stripe API connection successful!');
    console.log(`   📊 Account has ${customers.data.length >= 1 ? 'customers' : 'no customers yet'}`);

    // Test creating a checkout session
    console.log('\n3. Testing Checkout Session Creation...');

    const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: 'test@example.com',
        line_items: [
            {
                price_data: {
                    currency: 'pkr',
                    product_data: {
                        name: 'Test Product',
                    },
                    unit_amount: 100000, // Rs 1000
                },
                quantity: 1,
            },
        ],
        success_url: 'http://localhost:5173/checkout/success?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'http://localhost:5173/checkout?canceled=1',
    });

    console.log('   ✅ Test checkout session created successfully!');
    console.log('   🔗 Session ID:', session.id);
    console.log('   🔗 Checkout URL:', session.url);

    console.log('\n✅ ALL TESTS PASSED!');
    console.log('\n📋 Summary:');
    console.log('   - Stripe API key is valid');
    console.log('   - Can create checkout sessions');
    console.log('   - Ready to accept payments');

    console.log('\n💡 Next steps:');
    console.log('   1. Set up webhook endpoint (if not done):');
    console.log('      - Go to https://dashboard.stripe.com/test/webhooks');
    console.log('      - Add endpoint: http://localhost:5000/api/payments/webhook');
    console.log('      - Select event: checkout.session.completed');
    console.log('      - Copy the signing secret to STRIPE_WEBHOOK_SECRET in .env');
    console.log('   2. Test payment in your app');
    console.log('   3. Use test card: 4242 4242 4242 4242');

} catch (error) {
    console.log('   ❌ Stripe API Error:', error.message);
    console.log('\n📝 Possible issues:');
    console.log('   - Invalid API key');
    console.log('   - Network connection problem');
    console.log('   - Stripe account issue');
    console.log('\n🔧 To fix:');
    console.log('   1. Verify your Stripe API key at https://dashboard.stripe.com/test/apikeys');
    console.log('   2. Make sure you\'re using the TEST key (starts with sk_test_)');
    console.log('   3. Check your internet connection');
    process.exit(1);
}
