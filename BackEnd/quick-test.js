#!/usr/bin/env node

/**
 * Quick Test Script - Vérification des routes critiques
 * Usage: node quick-test.js
 * Prérequis: Le serveur doit tourner sur http://localhost:3000 ou /.env BACKEND_URL
 */

const http = require('http');

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:3000';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(color, symbol, message) {
  console.log(`${colors[color]}${symbol}${colors.reset} ${message}`);
}

async function testRoute(method, path, body = null, expectedStatus = [200, 201]) {
  return new Promise((resolve) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        const isSuccess = Array.isArray(expectedStatus) 
          ? expectedStatus.includes(res.statusCode)
          : res.statusCode === expectedStatus;
        
        let parsedBody = null;
        if (data) {
          try {
            parsedBody = JSON.parse(data);
          } catch (e) {
            // HTML ou autre format non-JSON
            parsedBody = { raw: data.substring(0, 100) };
          }
        }
        
        resolve({
          path,
          method,
          status: res.statusCode,
          success: isSuccess,
          body: parsedBody,
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        path,
        method,
        status: 0,
        success: false,
        error: err.message,
      });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function runTests() {
  console.log('\n🚀 Quick Backend Test Suite\n');
  console.log(`Testing: ${BASE_URL}\n`);
  
  const tests = [
    // Test 1: Server is running
    {
      name: 'Server health',
      test: () => testRoute('GET', '/', null, [200, 304]),
    },
    
    // Test 2: Validation Zod - Signup (devrait échouer sans données)
    {
      name: 'Zod validation (signup - should fail)',
      test: () => testRoute('POST', '/users/signup', {}, 400),
    },
    
    // Test 3: Validation Zod - Login (devrait échouer sans données)
    {
      name: 'Zod validation (login - should fail)',
      test: () => testRoute('POST', '/users/login', {}, 400),
    },
    
    // Test 4: Validation Zod - Shop cart add (devrait échouer sans données)
    {
      name: 'Zod validation (shop cart - should fail)',
      test: () => testRoute('POST', '/shop/cart/add', {}, 400),
    },
    
    // Test 5: Validation Zod - Shipping (devrait échouer sans données)
    {
      name: 'Zod validation (shipping - should fail)',
      test: () => testRoute('POST', '/shipping/validate-address', {}, 400),
    },
    
    // Test 6: 404 handler
    {
      name: '404 handler',
      test: () => testRoute('GET', '/route-inexistante', null, 404),
    },
    
    // Test 7: Shop GET (devrait fonctionner)
    {
      name: 'Shop GET products',
      test: () => testRoute('GET', '/shop', null, [200]),
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test.test();
      
      if (result.success) {
        log('green', '✅', `${test.name} - ${result.status}`);
        passed++;
      } else {
        log('red', '❌', `${test.name} - Expected success, got ${result.status}`);
        if (result.error) {
          log('red', '   ', `Error: ${result.error}`);
        }
        failed++;
      }
    } catch (err) {
      log('red', '❌', `${test.name} - Exception: ${err.message}`);
      failed++;
    }
  }

  console.log('\n' + '─'.repeat(50));
  console.log(`\n📊 Results: ${passed}/${tests.length} passed`);
  
  if (failed === 0) {
    log('green', '🎉', 'All tests passed!');
  } else {
    log('yellow', '⚠️', `${failed} test(s) failed`);
  }
  
  console.log('\n💡 Note: Ces tests vérifient uniquement:');
  console.log('   - Que le serveur répond');
  console.log('   - Que les validations Zod rejettent les mauvaises requêtes');
  console.log('   - Que le 404 handler fonctionne');
  console.log('\n   Pour des tests complets, utilisez Postman ou des tests unitaires.\n');
}

// Check if server is running first
http.get(BASE_URL, (res) => {
  runTests();
}).on('error', (err) => {
  log('red', '❌', 'Cannot connect to backend server!');
  console.log(`\n   Make sure the server is running on ${BASE_URL}`);
  console.log('   Run: npm run dev\n');
  process.exit(1);
});
