// standardize-responses.js
// Script to replace "result:" with "success:" in response objects
const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  './routes/users.js',
  './routes/shop.js',
  './routes/payments.js',
  './routes/top3.js',
  './routes/shipping.js',
  './routes/cart-reservation.js',
  './routes/payment-confirmed.js',
  './middlewares/authRateLimit.js',
  './middlewares/validateZod.js',
];

let totalReplacements = 0;

filesToUpdate.forEach(filePath => {
  try {
    const fullPath = path.join(__dirname, filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⏭️  Skip: ${filePath} (not found)`);
      return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;

    // Replace patterns
    content = content.replace(/result:\s*true/g, 'success: true');
    content = content.replace(/result:\s*false/g, 'success: false');
    content = content.replace(/result,/g, 'success,');
    content = content.replace(/\{\s*result\s*:/g, '{ success:');

    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content, 'utf8');
      const count = (originalContent.match(/result:/g) || []).length;
      totalReplacements += count;
      console.log(`✅ ${filePath}: ${count} replacements`);
    } else {
      console.log(`⏭️  ${filePath}: No changes needed`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
});

console.log(`\n🎉 Total replacements: ${totalReplacements}`);
console.log('\n⚠️  Remember to update your frontend to use "success" instead of "result"!');
