/**
 * API Performance Benchmark Script
 * Tests response times and cache effectiveness
 */
import fetch from 'node-fetch';

const BASE_URL = process.env.API_URL || 'http://localhost:5000';

const endpoints = [
  { name: 'Products List', path: '/api/products' },
  { name: 'Products (Category)', path: '/api/products?category=shoes' },
  { name: 'Product Detail', path: '/api/products/675a12345678901234567890' }, // Replace with real ID
];

async function measureRequest(endpoint) {
  const start = Date.now();
  try {
    const response = await fetch(`${BASE_URL}${endpoint.path}`);
    const data = await response.json();
    const duration = Date.now() - start;
    
    return {
      endpoint: endpoint.name,
      path: endpoint.path,
      status: response.status,
      duration,
      cached: response.headers.get('x-cache') === 'HIT',
      productCount: data.products?.length || 0
    };
  } catch (error) {
    return {
      endpoint: endpoint.name,
      path: endpoint.path,
      error: error.message,
      duration: Date.now() - start
    };
  }
}

async function runBenchmark() {
  console.log('🚀 Starting API Benchmark...\n');
  console.log(`Base URL: ${BASE_URL}\n`);

  const results = [];

  for (const endpoint of endpoints) {
    console.log(`Testing: ${endpoint.name}...`);
    
    // First request (cold cache)
    const cold = await measureRequest(endpoint);
    cold.type = 'Cold';
    results.push(cold);
    console.log(`  Cold: ${cold.duration}ms`);
    
    // Wait a bit
    await new Promise(r => setTimeout(r, 100));
    
    // Second request (warm cache)
    const warm = await measureRequest(endpoint);
    warm.type = 'Warm';
    results.push(warm);
    console.log(`  Warm: ${warm.duration}ms`);
  }

  console.log('\n📊 Results Summary:\n');
  console.table(results.map(r => ({
    Endpoint: r.endpoint,
    Type: r.type,
    Duration: `${r.duration}ms`,
    Status: r.status || 'Error',
    Products: r.productCount || '-'
  })));

  // Calculate cache improvement
  const coldAvg = results.filter(r => r.type === 'Cold').reduce((a, b) => a + b.duration, 0) / endpoints.length;
  const warmAvg = results.filter(r => r.type === 'Warm').reduce((a, b) => a + b.duration, 0) / endpoints.length;
  const improvement = ((coldAvg - warmAvg) / coldAvg * 100).toFixed(1);

  console.log(`\n📈 Cache Improvement: ${improvement}%`);
  console.log(`   Cold avg: ${coldAvg.toFixed(0)}ms`);
  console.log(`   Warm avg: ${warmAvg.toFixed(0)}ms`);
}

runBenchmark().catch(console.error);
