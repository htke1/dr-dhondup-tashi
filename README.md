# Dr. Dhondup Tashi | Online Medical Consultations

A production-grade, mobile-first telemedicine web application built for **Dr. Dhondup Tashi**, Chief Medical Officer at Gaden Jangtse Hospital and 2023 Machik Dr. Bettegowda Scholar.

The platform provides a streamlined 5-step booking and consultation management system featuring online payments via Razorpay, instant video meeting room generation via Google Meet, automated Google Calendar synchronization, transactional emails via Resend, and an authenticated administrative portal for clinical intake and confidential prescription notes.

---

## 🌟 Key Features

* **Tibetan Aesthetic Design System:** Crafted with a curated palette (`#FAF7F2` ivory, `#7B2D3E` maroon, `#C47F3A` saffron gold) and responsive typography.
* **5-Step Booking Flow (`/book`):**
  1. **Date Selection:** 14-day rolling window with automated same-day cutoff (6:00 PM IST).
  2. **Slot Selection:** Daily 20-minute slots (7:00 PM, 7:20 PM, 7:40 PM IST).
  3. **Patient Intake:** Demographic details, contact info, language preference (English/Tibetan), and chief complaint.
  4. **Review & Pay:** Real-time 15-minute slot lock and Razorpay checkout modal.
  5. **Instant Confirmation:** Google Meet room link, Add to Google Calendar direct integration, booking reference ID, and clinical preparation instructions.
* **Razorpay Standard Web Checkout (`/checkout` & `/book`):**
  * Server-side order creation (`POST /api/create-order`).
  * Official Razorpay modal (`checkout.js`) with responsive event handling (`payment.failed`, user dismiss).
  * Cryptographic HMAC-SHA256 signature verification (`POST /api/verify-payment`).
  * Webhook listener (`POST /api/payments/webhook`) for asynchronous payment capture and refunds.
* **Google Calendar & Google Meet Integration:**
  * Automated generation of private Google Meet video rooms for each confirmed consultation.
  * Synchronized calendar events with automated reminders.
  * Automatic rescheduling patches and cancellation deletions.
* **Transactional Email Engine:**
  * Branded HTML templates for Patient Confirmation, Doctor Clinical Intake Notifications, 24-Hour Automated Reminders, Rescheduling, and Cancellations.
  * Cron endpoint (`GET/POST /api/cron/reminders`) protected by `CRON_SECRET`.
* **Physician Administrative Dashboard (`/admin`):**
  * Protected by HMAC-SHA256 signed session cookies (`/admin/login`).
  * Patient intake view, appointment status filter (`pending_payment`, `confirmed`, `completed`, `cancelled`).
  * Single-click Google Meet room launcher.
  * "Mark Completed" consultation action.
  * Encrypted Clinical Notes & Prescription upsert modal.
  * Schedule Override & Date Blocker for medical camps, surgeries, or travel.

---

## 🛠️ Technology Stack

* **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
* **Frontend:** React 19, TypeScript, Vanilla CSS design tokens & utilities
* **Database:** PostgreSQL / Supabase with Row Level Security (RLS) & concurrency constraints
* **Payments:** [Razorpay](https://razorpay.com/) Standard Web Checkout & Node SDK
* **Calendar & Video:** Google Calendar API v3 & Google Meet
* **Emails:** [Resend](https://resend.com/) & React Email layouts
* **Hosting:** [Vercel](https://vercel.com/)

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/htke1/dr-dhondup-tashi.git
cd dr-dhondup-tashi
npm install
```

### 2. Configure Environment Variables

Copy the template file to `.env.local`:

```bash
cp .env.example .env.local
```

Configure your credentials:

```ini
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Razorpay
RAZORPAY_KEY_ID=your_key_id
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret

# Supabase (Database & RLS)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google Calendar & Meet
GOOGLE_CLIENT_ID=your_oauth_client_id
GOOGLE_CLIENT_SECRET=your_oauth_client_secret
GOOGLE_REFRESH_TOKEN=your_refresh_token

# Resend Emails
RESEND_API_KEY=re_...
EMAIL_FROM="Dr. Dhondup Tashi" <consultations@drdhondup.com>
ADMIN_NOTIFICATION_EMAIL=drdhondup.tashi@gmail.com

# Admin Authentication
ADMIN_AUTH_SECRET=your_random_64_character_secret
ADMIN_EMAIL=drdhondup.tashi@gmail.com
```

### 3. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing

* **Full Booking Flow:** [http://localhost:3000/book](http://localhost:3000/book)
* **Razorpay Standard Checkout:** [http://localhost:3000/checkout](http://localhost:3000/checkout)
* **Physician Portal:** [http://localhost:3000/admin](http://localhost:3000/admin) (Login: `drdhondup.tashi@gmail.com` / `tashi2026`)
* **Type Checking:** `npx tsc --noEmit`
* **Production Build:** `npm run build`

---

## 📜 Database Schema & Concurrency

The SQL migration script is located at [`supabase/migrations/01_initial_schema.sql`](./supabase/migrations/01_initial_schema.sql).

* **Strict Double-Booking Protection:** Enforced via a PostgreSQL partial unique index on `(appointment_date, slot_time)` for active holds and confirmed slots.
* **RLS Policies:** Clinical consultation notes are accessible exclusively via the server-side service-role client and hidden from client-side queries.
* **15-Minute Expiry Lock:** Automatic cleanup of abandoned reservation holds.

---

## 📄 License & Confidentiality

© 2026 Dr. Dhondup Tashi. All rights reserved.
Protected medical software platform.
