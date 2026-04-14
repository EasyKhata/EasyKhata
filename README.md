# EasyKhata

EasyKhata is a mobile-first ledger app that helps users manage money operations across different workflows in one place:

- Small business bookkeeping
- Freelancer billing and collections
- Personal/household tracking
- Apartment/society accounting

The core value proposition is adaptive workflows by organization type while keeping a single app shell and a consistent experience.

## Tech Stack

- React + Vite
- Firebase Auth + Firestore + Cloud Functions
- Razorpay (UPI/subscription payment flow)

## Core Features

- Organization-aware dashboards and labels
- Income, expenses, invoices, khata-style records, and reminders
- Multi-organization support with active workspace switching
- Subscription and review-access gating
- Admin panel for user and payment request operations
- PDF invoice/report generation

## Project Structure

- `src/` - frontend app (screens, sections, context, utilities)
- `functions/` - Firebase Cloud Functions (payments, admin metrics, background jobs)
- `public/legal/` - legal policy pages (terms, privacy, refunds, data deletion)

## Local Development

Install dependencies:

`npm install`

Run dev server:

`npm run dev`

Build for production:

`npm run build`

Preview production build:

`npm run preview`

## Environment and Deployment Notes

- Frontend Firebase config is in `src/firebase.js`.
- Functions use Firebase secrets for Razorpay credentials:
  - `RAZORPAY_KEY_ID`
  - `RAZORPAY_KEY_SECRET`
  - `RAZORPAY_WEBHOOK_SECRET`
- Firestore access is enforced through `firestore.rules`.

## Product Positioning

EasyKhata is designed for users who do not fit a single accounting template. Instead of separate apps for home, freelancing, and business, EasyKhata adapts sections and terminology based on workspace type while preserving one familiar UI.
