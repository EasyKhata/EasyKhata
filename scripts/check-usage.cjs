// scripts/check-usage.cjs
const { execSync } = require('child_process');

console.log('--- Firebase Project Usage (last 24h) ---');
try {
  execSync('firebase projects:list', { stdio: 'inherit' });
} catch (e) {
  console.log('Firebase CLI not authenticated or not installed.');
}

console.log('\n--- Vercel Project Usage ---');
try {
  execSync('vercel usage', { stdio: 'inherit' });
} catch (e) {
  console.log('Vercel CLI not authenticated or not installed.');
}

console.log('\n--- Google Account Security ---');
console.log('Check https://myaccount.google.com/security for 2FA and app password status.');
