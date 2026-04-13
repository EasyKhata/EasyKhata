# Automated Cost & Security Checks (README)

This script will help automate basic cost and security checks for your Vercel, Firebase, and Google accounts. For full automation, you may need to set up API access and/or use CLI tools. Below is a starter Node.js script and instructions.

---

## 1. Prerequisites
- Node.js installed
- Firebase CLI installed and authenticated (`npm install -g firebase-tools`)
- Vercel CLI installed and authenticated (`npm install -g vercel`)
- Google account: Use web dashboard for security checks (2FA, app passwords)

---

## 2. Script: Usage & Billing Alerts

Create a file named `scripts/check-usage.js` with the following content:

```js
// scripts/check-usage.js
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
```

---

## 3. How to Run

1. Place the script in `scripts/check-usage.js`.
2. Run with: `node scripts/check-usage.js`
3. Review the output for usage and security reminders.

---

## 4. Advanced Automation
- Set up cron jobs or GitHub Actions to run this script and email you results.
- Use Firebase and Vercel APIs for more granular usage/billing data.
- For Google, security checks are manual for now (visit the dashboard).

---

> This script provides a basic automation starting point. For full automation, consider integrating with APIs and notification services.
