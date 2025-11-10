#!/usr/bin/env node
// Script: Register a restaurant brand then create a restaurant under it
// Usage: node scripts/test-brand-flow.js
// Requires service running at http://localhost:3001

import fetch from 'node-fetch';

const BASE = process.env.BASE_URL || 'http://localhost:3001';

async function main() {
  try {
    const brandPayload = {
      email: `brand_${Date.now()}@example.com`,
      password: 'owner123',
      username: `branduser_${Date.now()}`,
      name: 'Demo Brand',
      logo_url: 'https://example.com/logo.png'
    };

    console.log('➡️  Register brand...');
    const regRes = await fetch(`${BASE}/api/auth/register/restaurant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(brandPayload)
    });
    const regJson = await regRes.json();
    if (!regRes.ok) {
      console.error('❌ Brand registration failed:', regJson);
      process.exit(1);
    }
    const token = regJson.data.token;
    const brandId = regJson.data.restaurantBrand._id;
    console.log('✅ Brand registered:', { brandId, email: brandPayload.email });

    // Create restaurant under brand
    const restaurantPayload = {
      name: 'Demo Restaurant - Branch 1',
      address: '123 Demo Street, HCM',
      phone: '0909009001',
      restaurant_id: `REST-${Date.now()}`
    };
    console.log('➡️  Create restaurant under brand...');
    const restRes = await fetch(`${BASE}/api/brands/${brandId}/restaurants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(restaurantPayload)
    });
    const restJson = await restRes.json();
    if (!restRes.ok) {
      console.error('❌ Restaurant creation failed:', restJson);
      process.exit(1);
    }
    console.log('✅ Restaurant created (PENDING):', {
      restaurantId: restJson.data.restaurant._id,
      status: restJson.data.restaurant.status
    });

    console.log('\nSummary');
    console.log({
      brand: { id: brandId, email: brandPayload.email },
      restaurant: { id: restJson.data.restaurant._id, status: restJson.data.restaurant.status }
    });
    console.log('\nNext (optional): Use PATCH /api/restaurants/:id/status with x-admin-secret to APPROVE.');
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

main();
