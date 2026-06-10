# EasyKhata

EasyKhata is a mobile-first ledger app that helps users manage money operations across two workflows in one place:

- Small business bookkeeping, billing, and collections
- Apartment/society accounting

The app has two portals: the Admin Portal for owners/admins who manage a khata, and the Member Portal for invited non-admin users (residents, partners, viewers) who get scoped, mostly read-only access to a khata shared with them.

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

EasyKhata is designed for users who do not fit a single accounting template. Instead of separate apps for business and society management, EasyKhata adapts sections and terminology based on workspace type while preserving one familiar UI.
