// Test script to verify order creation works
// Run with: node test-order-creation.js

const testOrderData = {
  customer: {
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    telephone: '+359123456789',
    country: 'Bulgaria',
    city: 'Sofia'
  },
  delivery: {
    type: 'office',
    notes: 'Test order'
  },
  items: [
    {
      id: 'test-variant-id', // This should be a valid variant ID
      quantity: 1,
      size: 'M',
      price: 29.99
    }
  ],
  totals: {
    subtotal: 29.99,
    delivery: 4.50,
    total: 34.49
  }
};

console.log('Test order data:', JSON.stringify(testOrderData, null, 2));

// To test this, you would need to:
// 1. Apply the fix-rls-migration.sql to your Supabase database
// 2. Replace 'test-variant-id' with an actual variant ID from your database
// 3. Run the test against your deployed API endpoint
