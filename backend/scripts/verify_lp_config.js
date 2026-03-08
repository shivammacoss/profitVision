/**
 * LP Configuration Verification Script
 * 
 * Run this script on each broker platform to verify LP integration is configured correctly.
 * 
 * Usage: node scripts/verify_lp_config.js
 */

import crypto from 'crypto';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('\n========================================');
console.log('LP CONFIGURATION VERIFICATION');
console.log('========================================\n');

// Check environment variables
const LP_API_URL = process.env.LP_API_URL || '';
const LP_API_KEY = process.env.LP_API_KEY || '';
const LP_API_SECRET = process.env.LP_API_SECRET || '';
const LP_ENABLED = process.env.LP_ENABLED;
const CORECEN_WS_URL = process.env.CORECEN_WS_URL || '';

console.log('1. Environment Variables Check:');
console.log('--------------------------------');
console.log(`   LP_API_URL:     ${LP_API_URL || '❌ NOT SET'}`);
console.log(`   LP_API_KEY:     ${LP_API_KEY ? `✓ Set (${LP_API_KEY.substring(0, 15)}...)` : '❌ NOT SET'}`);
console.log(`   LP_API_SECRET:  ${LP_API_SECRET ? '✓ Set (hidden)' : '❌ NOT SET'}`);
console.log(`   LP_ENABLED:     ${LP_ENABLED || 'not set (defaults to false)'}`);
console.log(`   CORECEN_WS_URL: ${CORECEN_WS_URL || 'not set (will use LP_API_URL)'}`);

// Validation
const issues = [];

if (!LP_API_URL) {
  issues.push('LP_API_URL is not set - trades cannot be synced to Corecen');
}

if (!LP_API_KEY) {
  issues.push('LP_API_KEY is not set - authentication will fail');
}

if (!LP_API_SECRET) {
  issues.push('LP_API_SECRET is not set - HMAC signatures cannot be generated');
}

if (LP_API_URL && LP_API_URL.includes('localhost')) {
  issues.push('LP_API_URL points to localhost - ensure this is correct for production');
}

console.log('\n2. Configuration Status:');
console.log('------------------------');

if (issues.length === 0) {
  console.log('   ✓ All required environment variables are set');
} else {
  console.log('   ❌ Issues found:');
  issues.forEach(issue => console.log(`      - ${issue}`));
}

// Test HMAC signature generation
console.log('\n3. HMAC Signature Test:');
console.log('-----------------------');

if (LP_API_SECRET) {
  const timestamp = Date.now().toString();
  const method = 'POST';
  const path = '/api/v1/broker-api/trades/close';
  const body = JSON.stringify({ external_trade_id: 'test', close_price: 1.0 });
  
  const message = timestamp + method + path + body;
  const signature = crypto
    .createHmac('sha256', LP_API_SECRET)
    .update(message)
    .digest('hex');
  
  console.log(`   ✓ Signature generated successfully`);
  console.log(`   Sample signature: ${signature.substring(0, 32)}...`);
} else {
  console.log('   ❌ Cannot test - LP_API_SECRET not set');
}

// Test connection to Corecen
console.log('\n4. Connection Test:');
console.log('-------------------');

if (LP_API_URL) {
  const healthUrl = `${LP_API_URL}/api/v1/broker-api/trades/health`;
  console.log(`   Testing: ${healthUrl}`);
  
  try {
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10000)
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log(`   ✓ Connection successful`);
      console.log(`   Response: ${JSON.stringify(data)}`);
    } else {
      console.log(`   ❌ Connection failed`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(data)}`);
    }
  } catch (error) {
    console.log(`   ❌ Connection failed: ${error.message}`);
    if (error.message.includes('ECONNREFUSED')) {
      console.log('   → Corecen server may not be running or URL is incorrect');
    }
    if (error.message.includes('ENOTFOUND')) {
      console.log('   → DNS resolution failed - check LP_API_URL');
    }
  }
} else {
  console.log('   ❌ Cannot test - LP_API_URL not set');
}

// Test authenticated request
console.log('\n5. Authenticated Request Test:');
console.log('------------------------------');

if (LP_API_URL && LP_API_KEY && LP_API_SECRET) {
  const timestamp = Date.now().toString();
  const method = 'GET';
  const path = '/api/v1/broker-api/trades/stats';
  const body = '';
  
  const message = timestamp + method + path + body;
  const signature = crypto
    .createHmac('sha256', LP_API_SECRET)
    .update(message)
    .digest('hex');
  
  const url = `${LP_API_URL}${path}`;
  console.log(`   Testing: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': LP_API_KEY,
        'X-Timestamp': timestamp,
        'X-Signature': signature
      },
      signal: AbortSignal.timeout(10000)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log(`   ✓ Authenticated request successful`);
      console.log(`   Response: ${JSON.stringify(data)}`);
    } else {
      console.log(`   ❌ Authentication failed`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(data)}`);
      
      if (response.status === 401) {
        console.log('   → Check LP_API_KEY and LP_API_SECRET match Corecen configuration');
      }
    }
  } catch (error) {
    console.log(`   ❌ Request failed: ${error.message}`);
  }
} else {
  console.log('   ❌ Cannot test - missing credentials');
}

console.log('\n========================================');
console.log('VERIFICATION COMPLETE');
console.log('========================================\n');

if (issues.length > 0) {
  console.log('⚠️  Fix the issues above before trades can sync to Corecen.\n');
  process.exit(1);
} else {
  console.log('✓ Configuration appears correct.\n');
  process.exit(0);
}
