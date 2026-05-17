# DEATHFEAR — Freelance Payment Recovery SaaS

## Product Requirements Document (PRD)
### Version 1.1 — Full Production Build

---

# 1. EXECUTIVE SUMMARY

**DeathFear** is a subscription-based SaaS platform that helps freelancers recover unpaid invoices from clients. It automates the awkward, time-consuming process of payment follow-up — from friendly reminders to legal escalation — all in the freelancer's authentic voice.

**Tagline:** *"Never chase a payment again. DeathFear handles the conversations, you handle the work."*

**Business Model:** Subscription (Free + Premium tiers), Monthly & Annual billing

**Brand Identity Note:** The name "DeathFear" reflects the dread of unpaid invoices that haunts every freelancer. The visual identity contrasts this edgy name with a clean, professional, trustworthy interface — purple primary (#8B5CF6) conveys confidence without aggression. Copy tone is empathetic and empowering, not threatening. The goal is to make the freelancer feel supported, not aggressive.

---

# 2. PROBLEM & SOLUTION

## 2.1 Problem Statement

Freelancers — designers, developers, copywriters, consultants — are routinely owed money by clients who simply don't pay on time. The average freelancer has 2–4 unpaid invoices at any moment. Chasing payment feels awkward and kills client relationships. No tool does this end-to-end: send the invoice → auto-remind at 7, 14, 30 days → escalate to a formal notice letter → generate a small claims filing guide — all in the freelancer's voice, not a robot's.

## 2.2 Solution

A web-based platform (desktop-first, responsive) that provides:

| Feature | Description |
|---------|-------------|
| Invoice Creation & Tracking | Create, send, and track invoices |
| Automated Reminder Engine | Multi-touch sequences with escalating tones |
| AI Tone Adaptation | Reminders written in the freelancer's voice using LLM |
| Client Payment Dashboard | At-a-glance view of who paid and who hasn't |
| Legal Escalation | Generate formal notice letters and small claims guides |
| Subscription Management | Free & Premium tiers with Stripe/PayPal/UPI billing |
| Client Invoice Portal | Secure, tokenized page where clients view invoices and pay online |

---

# 3. TARGET AUDIENCE

| Persona | Description |
|---------|-------------|
| **The Solo Freelancer** | Independent designer, developer, writer — 1-5 active clients, limited legal knowledge |
| **The Agency Owner** | Runs a small agency (2-10 people), needs to chase payments for team |
| **The Consultant** | High-value project-based work, professional reputation matters |

**Key Demographics:**
- Age: 25–45
- Tech-savviness: Moderate to High
- Pain point: Highly uncomfortable with financial confrontation
- Geography: Global (English-language focused initially, USD-only for v1)

---

# 4. TECH STACK SPECIFICATION

## 4.1 Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.2.x (App Router) | React framework with SSR/SSG |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.4.x | Utility-first styling |
| shadcn/ui | Latest | Component library (Radix primitives) |
| React Hook Form | Latest | Form handling |
| Zod | 3.23.x | Schema validation |
| TanStack Query | 5.50.x | Server state management |
| date-fns | 3.6.x | Date utilities |
| lucide-react | 0.400.x | Icons |
| recharts | 2.12.0 (exact) | Charts (pinned to avoid API breaks) |
| react-day-picker | Latest | Date picker (used via shadcn's Calendar+Popover pattern) |

**shadcn/ui Init Configuration:**
```bash
npx shadcn@latest init
# Style: New York
# Base color: Zinc
# CSS variables: Yes
# React Server Components: Yes
# Import alias: @/
```

**Server vs Client Components Strategy:**
- **Server Components (default):** Landing page, invoice list (initial fetch), settings pages (read), client detail (read), admin pages
- **Client Components (where interactivity is needed):** Dashboard (charts), invoice form, client form, reminder editor, subscription UI, settings forms, client portal
- **Pattern:** Pages are Server Components that wrap interactive islands as Client Components. TanStack Query providers at the app layout level.

## 4.2 Backend

| Technology | Purpose |
|------------|---------|
| Next.js API Routes | API endpoints (App Router route handlers) |
| Prisma ORM | Database ORM and migrations |
| PostgreSQL 15+ | Primary database |
| NextAuth.js (Auth.js) v5 | Authentication — **JWT strategy** (no DB sessions, simpler for serverless) |
| Resend | Email delivery for reminders and notifications |
| OpenAI API | AI-powered tone adjustment for reminder messages |
| Stripe API | Payment processing for subscriptions + credit cards |
| PayPal REST API | Payment processing for subscriptions |
| Razorpay API | UPI AutoPay (eMandate) for recurring subscription payments |
| Vercel Blob | File storage for avatar, logo, and invoice PDF uploads |

**Auth Session Strategy:** JWT (database `sessions` table not used). PrismaAdapter still required for OAuth account/providers linking.

**Timezone Handling:** All dates stored in UTC. Display converted to user's local timezone via browser `Intl.DateTimeFormat`. The daily reminder cron at 08:00 UTC covers most global timezones during waking hours. `nextReminderDate` comparisons use `CURRENT_DATE` in UTC (database timezone). No per-user timezone setting in v1.

## 4.3 Infrastructure

| Service | Purpose |
|---------|---------|
| Vercel | Hosting (Next.js optimized) — **Vercel Pro tier required** (100MB serverless limit accommodates PDF generation) |
| Vercel Blob | File storage for avatars, logos, PDF exports |
| Vercel KV / Upstash | Rate limiting + caching |
| Neon / Supabase | Managed PostgreSQL |
| Resend | Transactional email (requires domain verification: configure SPF + DKIM for `deathear.app` in Resend dashboard). Run `npx react-email dev` in development to preview email templates locally |
| Stripe | Subscription billing |
| GitHub | Source control + CI/CD |
| Inngest | Cron jobs + background queues + dead letter queue |

**Inngest Serve Endpoint:** `/api/inngest` (must be added to API route list). Run `npx inngest-cli dev` locally for development.

---

# 5. DATABASE SCHEMA

## 5.1 Entity Relationship Diagram (Text)

```
User ──has──> Account (OAuth accounts)
User ──has──> Session (Auth sessions)
User ──has──> Subscription
User ──has──> many Client
User ──has──> many Invoice
User ──has──> many ToneSample (AI voice samples)
User ──has──> many NotificationLog
User ──belongs_to──> SubscriptionPlan

Client ──has──> many Invoice
Invoice ──has──> one InvoiceShare (tokenized client access)
Invoice ──has──> many Reminder
Invoice ──has──> one LegalEscalation

Reminder (belongs_to Invoice)
LegalEscalation (belongs_to Invoice)
InvoiceShare (belongs_to Invoice, unique token)
```

## 5.2 Tables

### users

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default uuid_generate_v4() | |
| email | VARCHAR(255) | UNIQUE, NOT NULL | |
| emailVerified | TIMESTAMP | nullable | |
| name | VARCHAR(255) | nullable | Display name |
| image | TEXT | nullable | Avatar URL |
| hashedPassword | VARCHAR(255) | nullable | null for OAuth-only accounts |
| role | VARCHAR(50) | NOT NULL, default 'user' | "user" or "admin" |
| stripeCustomerId | VARCHAR(255) | UNIQUE, nullable | Stripe customer reference |
| paymentLink | TEXT | nullable | Freelancer's preferred payment link (PayPal.me, Stripe payment link, etc.) |
| darkMode | VARCHAR(20) | NOT NULL, default 'system' | "light", "dark", "system" |
| deletedAt | TIMESTAMP | nullable | Soft delete: if set, user is considered deleted |
| createdAt | TIMESTAMP | NOT NULL, default NOW() | |
| updatedAt | TIMESTAMP | NOT NULL, default NOW() | |

**Indexes:** `role`, `email`

### accounts (NextAuth.js)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| userId | UUID | FK → users.id, NOT NULL | |
| type | VARCHAR(255) | NOT NULL | "oauth" or "credentials" |
| provider | VARCHAR(255) | NOT NULL | "google", "github", etc. |
| providerAccountId | VARCHAR(255) | NOT NULL | |
| refresh_token | TEXT | nullable | |
| access_token | TEXT | nullable | |
| expires_at | INTEGER | nullable | |
| token_type | VARCHAR(255) | nullable | |
| scope | VARCHAR(255) | nullable | |
| id_token | TEXT | nullable | |
| session_state | VARCHAR(255) | nullable | |
| UNIQUE(provider, providerAccountId) | | | |

**Indexes:** `userId`

### sessions (NextAuth.js)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| sessionToken | VARCHAR(255) | UNIQUE, NOT NULL | |
| userId | UUID | FK → users.id, NOT NULL | |
| expires | TIMESTAMP | NOT NULL | |

**Indexes:** `userId`, `sessionToken`

### verification_tokens (NextAuth.js)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| identifier | VARCHAR(255) | NOT NULL | |
| token | VARCHAR(255) | UNIQUE, NOT NULL | |
| expires | TIMESTAMP | NOT NULL | |
| UNIQUE(identifier, token) | | | |

### subscription_plans

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| name | VARCHAR(100) | NOT NULL | "Free", "Premium" |
| slug | VARCHAR(50) | UNIQUE, NOT NULL | "free", "premium" |
| description | TEXT | nullable | |
| priceMonthly | DECIMAL(10,2) | NOT NULL | Price in USD (0 for free) |
| priceAnnual | DECIMAL(10,2) | NOT NULL | Price in USD (0 for free) |
| stripePriceIdMonthly | VARCHAR(255) | nullable | Stripe price ID for monthly |
| stripePriceIdAnnual | VARCHAR(255) | nullable | Stripe price ID for annual |
| paypalPlanIdMonthly | VARCHAR(255) | nullable | PayPal plan ID for monthly |
| paypalPlanIdAnnual | VARCHAR(255) | nullable | PayPal plan ID for annual |
| razorpayPlanId | VARCHAR(255) | nullable | Razorpay plan ID for UPI AutoPay |
| invoicesPerMonth | INTEGER | NOT NULL | Max invoices allowed per month (0 = unlimited) |
| clientsAllowed | INTEGER | NOT NULL | Max clients (0 = unlimited) |
| aiToneEnabled | BOOLEAN | NOT NULL, default false | AI tone adjustment |
| legalEscalationEnabled | BOOLEAN | NOT NULL, default false | Legal letter generation |
| prioritySupport | BOOLEAN | NOT NULL, default false | |
| features | JSONB | NOT NULL, default '[]' | Array of feature strings |
| isActive | BOOLEAN | NOT NULL, default true | |
| sortOrder | INTEGER | NOT NULL, default 0 | Display ordering |
| createdAt | TIMESTAMP | NOT NULL, default NOW() | |

### subscriptions

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| userId | UUID | FK → users.id, UNIQUE, NOT NULL | One subscription per user |
| planId | UUID | FK → subscription_plans, NOT NULL | Current plan |
| status | VARCHAR(50) | NOT NULL | "active", "canceled", "past_due", "trialing", "incomplete", "incomplete_expired" |
| billingInterval | VARCHAR(20) | NOT NULL | "monthly" or "annual" |
| paymentProvider | VARCHAR(20) | NOT NULL | "stripe", "paypal", "razorpay" |
| stripeSubscriptionId | VARCHAR(255) | UNIQUE, nullable | Stripe subscription reference |
| paypalSubscriptionId | VARCHAR(255) | UNIQUE, nullable | PayPal subscription reference |
| razorpaySubscriptionId | VARCHAR(255) | UNIQUE, nullable | Razorpay UPI AutoPay reference |
| currentPeriodStart | TIMESTAMP | NOT NULL | |
| currentPeriodEnd | TIMESTAMP | NOT NULL | |
| canceledAt | TIMESTAMP | nullable | |
| invoicesUsedThisMonth | INTEGER | NOT NULL, default 0 | |
| lastInvoiceResetAt | TIMESTAMP | NOT NULL, default NOW() | |
| createdAt | TIMESTAMP | NOT NULL, default NOW() | |
| updatedAt | TIMESTAMP | NOT NULL, default NOW() | |

**Indexes:** `userId`, `stripeSubscriptionId`, `paypalSubscriptionId`, `razorpaySubscriptionId`, `status`

### clients

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| userId | UUID | FK → users.id, NOT NULL | Owner freelancer |
| name | VARCHAR(255) | NOT NULL | |
| email | VARCHAR(255) | NOT NULL | |
| company | VARCHAR(255) | nullable | |
| phone | VARCHAR(50) | nullable | |
| notes | TEXT | nullable | |
| totalInvoiced | DECIMAL(12,2) | NOT NULL, default 0 | Running total |
| totalPaid | DECIMAL(12,2) | NOT NULL, default 0 | Running total |
| paymentStatus | VARCHAR(50) | NOT NULL, default 'none' | "none", "paid", "partial", "overdue", "collections" |
| lastInvoiceDate | TIMESTAMP | nullable | |
| createdAt | TIMESTAMP | NOT NULL, default NOW() | |
| updatedAt | TIMESTAMP | NOT NULL, default NOW() | |
| UNIQUE(userId, email) | | | One client entry per email per user |

**Indexes:** `userId`, `paymentStatus`, `email`

### invoices

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| userId | UUID | FK → users.id, NOT NULL | Owner |
| clientId | UUID | FK → clients.id, NOT NULL | |
| invoiceNumber | VARCHAR(50) | NOT NULL | Auto-generated via sequence (see §6.5.2) |
| title | VARCHAR(255) | NOT NULL | Description of work |
| amount | DECIMAL(12,2) | NOT NULL | Total amount |
| currency | VARCHAR(3) | NOT NULL, default 'USD' | USD-only for v1 |
| status | VARCHAR(50) | NOT NULL, default 'draft' | "draft", "sent", "viewed", "overdue", "paid", "partially_paid", "canceled" |
| dueDate | DATE | NOT NULL | |
| sentDate | DATE | nullable | When invoice was first sent |
| paidDate | DATE | nullable | |
| paidAmount | DECIMAL(12,2) | NOT NULL, default 0 | Amount actually received |
| notes | TEXT | nullable | Internal notes (not sent to client) |
| terms | TEXT | nullable | Payment terms shown on invoice |
| lineItems | JSONB | NOT NULL, default '[]' | Array of {description, quantity, rate, amount} |
| reminderSequence | JSONB | NOT NULL, default '[]' | Array of reminder objects (tone, sentAt, message) |
| currentReminderStep | INTEGER | NOT NULL, default 0 | Which step in the sequence |
| nextReminderDate | DATE | nullable | When to send next reminder |
| reminderEnabled | BOOLEAN | NOT NULL, default true | |
| reminderPaused | BOOLEAN | NOT NULL, default false | Paused after partial payment |
| deletedAt | TIMESTAMP | nullable | Soft delete |
| createdAt | TIMESTAMP | NOT NULL, default NOW() | |
| updatedAt | TIMESTAMP | NOT NULL, default NOW() | |
| UNIQUE(userId, invoiceNumber) | | | |

**Indexes:** `userId`, `clientId`, `status`, `nextReminderDate`, `dueDate`, `createdAt`

### invoice_shares

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| invoiceId | UUID | FK → invoices.id, UNIQUE, NOT NULL | |
| token | VARCHAR(64) | UNIQUE, NOT NULL | Crypto-random token for client access |
| expiresAt | TIMESTAMP | nullable | null = never expires |
| lastViewedAt | TIMESTAMP | nullable | |
| viewCount | INTEGER | NOT NULL, default 0 | |
| createdAt | TIMESTAMP | NOT NULL, default NOW() | |

**Indexes:** `token` (unique lookup), `invoiceId`

### reminders

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| invoiceId | UUID | FK → invoices.id, NOT NULL | |
| stepNumber | INTEGER | NOT NULL | 1, 2, 3, 4, etc. |
| tone | VARCHAR(50) | NOT NULL | "casual", "formal", "informal", "legal" |
| daysAfterDueDate | INTEGER | NOT NULL | 7, 14, 21, 30 |
| subject | VARCHAR(500) | NOT NULL | Email subject line |
| message | TEXT | NOT NULL | Email body |
| wasAIGenerated | BOOLEAN | NOT NULL, default false | Whether AI generated this |
| wasEditedByUser | BOOLEAN | NOT NULL, default false | Whether user edited before send |
| sentAt | TIMESTAMP | nullable | When sent |
| openedAt | TIMESTAMP | nullable | When client opened |
| deliveryStatus | VARCHAR(50) | NOT NULL, default 'pending' | "pending", "sent", "delivered", "bounced", "opened" |
| errorMessage | TEXT | nullable | If delivery failed, store error |
| retryCount | INTEGER | NOT NULL, default 0 | Number of retry attempts |
| createdAt | TIMESTAMP | NOT NULL, default NOW() | |

**Indexes:** `invoiceId`, `sentAt`, `deliveryStatus`

### tone_samples

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| userId | UUID | FK → users.id, NOT NULL | |
| originalText | TEXT | NOT NULL | The freelancer's sample writing |
| context | VARCHAR(255) | nullable | E.g., "How I normally email clients" |
| isActive | BOOLEAN | NOT NULL, default true | |
| createdAt | TIMESTAMP | NOT NULL, default NOW() | |
| updatedAt | TIMESTAMP | NOT NULL, default NOW() | |

**Indexes:** `userId`, `isActive`

### legal_escalations

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| invoiceId | UUID | FK → invoices.id, UNIQUE, NOT NULL | |
| userId | UUID | FK → users.id, NOT NULL | |
| formalLetterGenerated | BOOLEAN | NOT NULL, default false | |
| formalLetterContent | TEXT | nullable | Generated demand letter |
| formalLetterSentAt | TIMESTAMP | nullable | |
| smallClaimsGuideGenerated | BOOLEAN | NOT NULL, default false | |
| smallClaimsGuideContent | TEXT | nullable | Jurisdiction-specific guide |
| smallClaimsGuideState | VARCHAR(100) | nullable | User's state/country |
| status | VARCHAR(50) | NOT NULL, default 'not_started' | "not_started", "letter_generated", "letter_sent", "small_claims_guide_generated", "resolved" |
| createdAt | TIMESTAMP | NOT NULL, default NOW() | |
| updatedAt | TIMESTAMP | NOT NULL, default NOW() | |

**Indexes:** `userId`, `invoiceId`, `status`

### notification_logs (email notifications)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| userId | UUID | FK → users.id, NOT NULL | |
| type | VARCHAR(50) | NOT NULL | "reminder_sent", "invoice_paid", "subscription_renewed", "trial_ending", "reminder_bounced", "invoice_viewed", etc. |
| email | VARCHAR(255) | NOT NULL | Recipient email |
| subject | VARCHAR(500) | NOT NULL | |
| body | TEXT | NOT NULL | |
| metadata | JSONB | nullable | Additional context |
| deliveryStatus | VARCHAR(50) | NOT NULL, default 'sent' | |
| resendId | VARCHAR(255) | nullable | Resend API response ID |
| errorMessage | TEXT | nullable | |
| createdAt | TIMESTAMP | NOT NULL, default NOW() | |

**Indexes:** `userId`, `type`, `deliveryStatus`, `createdAt`

### in_app_notifications (in-app unread count)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| userId | UUID | FK → users.id, NOT NULL | |
| type | VARCHAR(50) | NOT NULL | "invoice_viewed", "payment_received", "reminder_bounced", "subscription_expiring" |
| title | VARCHAR(255) | NOT NULL | Short display text |
| body | TEXT | nullable | Optional detail |
| link | VARCHAR(500) | nullable | Route to navigate to (e.g., "/app/invoices/abc123") |
| isRead | BOOLEAN | NOT NULL, default false | |
| createdAt | TIMESTAMP | NOT NULL, default NOW() | |

**Indexes:** `userId`, `isRead`, `createdAt`

### Soft Delete Implementation

Tables with soft delete (`users`, `invoices`):
- `deletedAt` column set to `NOW()` on "delete"
- Prisma middleware automatically filters `WHERE deletedAt IS NULL` for all queries
- Admin panel shows a "Show deleted" toggle that bypasses the filter
- User deletion also creates `in_app_notification` for all affected reminders
- Permanent purge runs monthly via cron job

---

# 6. FEATURE SPECIFICATIONS

## 6.1 Authentication System

### 6.1.1 Sign Up / Login

**Pages:**
- `/auth/signin` — Login page
- `/auth/signup` — Registration page
- `/auth/error` — Error display page
- `/auth/verify-request` — Email verification notice

**Providers:**
1. Email + Password (credentials provider)
   - Password requirements: minimum 8 characters, at least 1 uppercase, 1 number
   - Email verification via magic link (Resend)
   - Rate limiting: 5 attempts per 15 minutes per email
2. Google OAuth
   - Scope: email, profile
3. GitHub OAuth
   - Scope: read:user, user:email

**Flow:**
1. User visits `/auth/signup`
2. Options: "Continue with Google", "Continue with GitHub", or "Sign up with Email"
3. Email signup: enter email → create password → verification email sent → click link → redirect to `/onboarding`
4. OAuth signup: redirect to provider → authorize → callback → check if user exists → if new, redirect to `/onboarding`

**Social Login Account Linking:**
- If a user signs up with Google (email@example.com) and later signs in with GitHub (same verified email), the accounts are linked automatically (matched by email)
- If emails don't match, they remain separate accounts. Future: add manual account linking in settings.

**Password Reset Flow:**
- "Forgot Password?" link on `/auth/signin` → enter email → Resend sends magic link → click link → set new password
- Uses Resend email template `password-reset.tsx`
- Token expires in 1 hour
- Rate limited: 1 request per 5 minutes per email

**Middleware Behavior:**
- Protected routes: `/app/*`, `/api/*` (except auth endpoints, webhooks)
- Redirect unauthenticated users to `/auth/signin`
- Redirect authenticated users away from `/auth/*`
- Admin routes `/admin/*` protected by role check (`user.role === 'admin'`)

### 6.1.2 Admin User Seeding

On first deploy, seed an admin user via Prisma seed script:
```typescript
// prisma/seed.ts
const adminEmail = process.env.ADMIN_EMAIL || 'admin@deathear.app';
const adminPassword = process.env.ADMIN_PASSWORD || 'changeme123!';

// Create admin user with role 'admin'
await prisma.user.create({
  data: {
    email: adminEmail,
    name: 'DeathFear Admin',
    role: 'admin',
    hashedPassword: await bcrypt.hash(adminPassword, 12),
  },
});

// Create default subscription plans
await prisma.subscriptionPlan.createMany({
  data: [
    {
      name: 'Free',
      slug: 'free',
      priceMonthly: 0,
      priceAnnual: 0,
      invoicesPerMonth: 3,
      clientsAllowed: 5,
      aiToneEnabled: false,
      legalEscalationEnabled: false,
      prioritySupport: false,
      features: ['3 invoices/month', '5 clients', 'Basic templates', 'Email support'],
      sortOrder: 0,
    },
    {
      name: 'Premium',
      slug: 'premium',
      priceMonthly: 19.00,
      priceAnnual: 190.00,
      invoicesPerMonth: 0, // unlimited
      clientsAllowed: 0, // unlimited
      aiToneEnabled: true,
      legalEscalationEnabled: true,
      prioritySupport: true,
      features: ['Unlimited invoices', 'Unlimited clients', 'AI tone adaptation', 'Legal escalation', 'Priority support', 'Analytics'],
      sortOrder: 1,
    },
  ],
});
```

### 6.1.3 Onboarding Flow

**Route:** `/onboarding`

**Steps:**
1. **Welcome** — Brief intro to DeathFear (+ "Built for freelancers by freelancers")
2. **Tone Sample** — Collect writing sample for AI voice cloning
   - Textarea: "Write a short email or message in the way you typically communicate with clients. This helps us match your voice."
   - Placeholder example provided
   - **Minimum length:** 100 characters (enforced on the client and server)
   - Skip button available → system uses professional default templates with no AI adaptation
   - If sample is provided and user is on Free plan, the sample is saved but AI tone generation is gated behind Premium
3. **First Client** — Optional quick-add form: Name, Email, Company
4. **Subscription Selection** — Free vs Premium comparison table
   - If Free selected → new user gets a **Free subscription** (created automatically), redirect to `/app/dashboard`
   - If Premium selected → redirect to `/app/subscribe`
   - Subscription selection can be **skipped entirely**: user defaults to Free plan, can upgrade later

## 6.2 Landing Page

**Route:** `/` (public)

**Sections:**
1. **Hero** — Headline, subheading, CTA button ("Start Free →")
   - Background: gradient or subtle animated element
2. **Problem** — "You did the work. Getting paid shouldn't be the harder part."
   - Stats: "Freelancers spend 20+ hours per year chasing payments"
   - Visual: invoice timeline showing escalation
3. **How It Works** — 3-step process
   - Step 1: Create & Send Invoice
   - Step 2: DeathFear Auto-Reminds (with escalating tone)
   - Step 3: Get Paid (or escalate legally)
4. **Features** — Grid of feature cards
   - Automated Reminders
   - AI Voice Matching
   - Client Dashboard
   - Legal Escalation
   - Smart Templates
   - Analytics
5. **Pricing** — Side-by-side comparison: Free vs Premium
   - Free: 3 invoices/month, 5 clients, basic templates, email support
   - Premium: Unlimited invoices, unlimited clients, AI tone, legal escalation, priority support
   - Monthly & Annual pricing shown
6. **Footer** — Links, social, legal

**Components:**
- Navigation bar (Logo, Features, Pricing, Login, Get Started button)
- Feature card component
- Pricing card component
- CTA section
- Footer

## 6.3 Application Shell

**Layout:** `/app/(dashboard)/layout.tsx`

**Components:**
- **Sidebar** (collapsible on mobile):
  - Logo + Brand name
  - Nav items:
    - Dashboard (icon: LayoutDashboard)
    - Invoices (icon: FileText)
    - Clients (icon: Users)
    - Reminder Sequences (icon: Bell)
    - Legal Escalation (icon: Scale)
    - Settings (icon: Settings)
  - Subscription badge (Free / Premium)
  - User avatar + name at bottom
- **Top bar**:
  - Mobile menu toggle (hamburger)
  - Breadcrumb
  - Notification bell (with unread count)
  - Create Invoice button (primary CTA)
- **Main content area** (padding: p-6)

## 6.4 Dashboard

**Route:** `/app/dashboard`

**Components & Data:**

1. **Stats Cards** (4 cards in a grid)
   - Total outstanding: SUM of unpaid invoices amount (currency formatted)
   - Overdue invoices: COUNT where status = 'overdue' (red accent)
   - Paid this month: SUM where paidDate is this month (green accent)
   - Active reminders: COUNT where nextReminderDate is not null (blue accent)

2. **Recent Invoices** (table, last 5 invoices)
   - Columns: Invoice #, Client, Amount, Status (badge), Due Date, Actions
   - Status badges: draft (gray), sent (blue), viewed (yellow), overdue (red), paid (green)
   - Actions: View, Send Reminder (if overdue), Mark Paid

3. **Payment Status Chart** (pie/donut chart using recharts)
   - Segments: Paid, Overdue, Pending, Draft

4. **Upcoming Reminders** (list, next 5 upcoming)
   - Invoice #, Client, Days until reminder, Tone

5. **Quick Actions** card:
   - "Create New Invoice" button
   - "Add New Client" button
   - "Send Bulk Reminders" button (Premium feature)

## 6.5 Invoice Management

### 6.5.1 Invoice List

**Route:** `/app/invoices`

**Features:**
- Search by invoice number, client name, or amount
- Filter by status (draft, sent, overdue, paid, canceled)
- Sort by date, amount, status
- Pagination (10 per page)
- Bulk actions: Select invoices → Send reminders, Mark as paid, Delete

**Implementation Details:**
- **Search:** **Server-side** via Prisma `WHERE { client: { name: { contains: query, mode: 'insensitive' } } }` (PostgreSQL case-insensitive). Debounced 300ms input.
- **Filter:** **Server-side** via Prisma `WHERE { status: { in: selectedFilters } }`. Filters stored as **URL search params** (e.g., `/app/invoices?status=overdue&sort=amount_desc`) so they're shareable/persist on navigation.
- **Sort:** **Server-side** via Prisma `orderBy`. Default: `createdAt DESC`. Options: `amount_asc`, `amount_desc`, `dueDate_asc`, `dueDate_desc`, `createdAt_desc`, `createdAt_asc`.
- **Pagination:** **Server-side** cursor-based (for large datasets) OR offset-based (simpler, fine for <10k invoices). Use offset with `skip`/`take`.
- **Bulk Actions:** Checkbox column on the left. When 1+ selected, a sticky bottom action bar appears: "Send Reminder" (opens tone selector), "Mark as Paid" (opens batch date modal), "Delete" (confirmation dialog). "Select All" checkbox selects all items on current page (not all pages).

**Table Columns:**
| Column | Description |
|--------|-------------|
| ☐ (checkbox) | Bulk select |
| Invoice # | Clickable, links to detail |
| Client | Name + company |
| Amount | Formatted currency |
| Status | Color-coded badge |
| Due Date | Relative (3 days ago, Tomorrow, etc.) + overdue indicator |
| Sent | Checkmark if sent |
| Paid | Date or "-" |
| Actions | View, Send Reminder, More (dropdown) |

### 6.5.2 Create / Edit Invoice

**Route:** `/app/invoices/new` and `/app/invoices/[id]/edit`

**Form Fields:**
1. **Client Selection**
   - Dropdown of existing clients + "Add New Client" button
   - Or type to search
2. **Invoice Details**
   - Title/Description of work (text input, required)
   - Invoice Number (auto-generated, editable: "DF-{YEAR}-{SEQUENTIAL}")
     - **Counter mechanism:** Use a `user_invoice_counters` table row that's atomically incremented within a Prisma transaction to prevent race conditions under concurrent requests:
       ```prisma
       model UserInvoiceCounter {
         id         String   @id @default(uuid())
         userId     String   @unique
         year       Int
         counter    Int      @default(0)
       }
       ```
       Then within a transaction:
       ```typescript
       const { counter } = await prisma.userInvoiceCounter.upsert({
         where: { userId },
         create: { userId, year: currentYear, counter: 1 },
         update: { counter: { increment: 1 } },
       });
       const invoiceNumber = `DF-${currentYear}-${String(counter).padStart(4, '0')}`;
       ```
     - Example: For user's first invoice in 2025 → "DF-2025-0001"
     - **Invoice archival:** Invoices with status "paid" and `paidDate` older than 12 months are automatically archived. Archived invoices are hidden from the main invoice list by default (filter toggle: "Show archived"). The archive process runs monthly via cron and moves them out of the active query scope (sets `deletedAt` in v1 as a soft-archive mechanism). Only admins can permanently delete archived invoices.
   - **Form Draft Persistence:** Invoice form data is saved to `localStorage` every 30 seconds while editing. If the user navigates away, data is restored on return with a banner: "Draft restored from {time ago}. Continue editing or discard." Cleared on successful save. localStorage key: `deathear_invoice_draft_{userId}`. Only applies to the create form, not edit.
   - Issue Date (date picker, default today)
   - Due Date (date picker)
   - Payment Terms (dropdown: "Net 15", "Net 30", "Net 60", "Due on Receipt", Custom)
3. **Line Items** (dynamic array)
   - Description (text)
   - Quantity (number, default 1)
   - Rate (currency input)
   - Amount (calculated: quantity × rate)
   - Add Line Item button
4. **Subtotal + Tax**
   - Subtotal (auto-calculated)
   - Tax Rate (% or fixed amount)
   - Discount (% or fixed amount)
   - Total (auto-calculated)
5. **Notes & Terms**
   - Notes (textarea, optional — shown to client)
   - Internal notes (textarea, optional — not shown)
6. **Reminder Settings**
   - Toggle: Enable automated reminders (default: on)
   - First reminder: X days after due (default: 7)
   - Reminder frequency: X days (default: 7)
   - Tone progression:
     - Step 1: Casual (friendly nudge)
     - Step 2: Formal (professional reminder)
     - Step 3: Informal (direct, personal)
     - Step 4: Legal (final notice)
   - Customize tone per step (click to edit message)
   - AI Tone toggle (Premium only — "Use AI to match my voice")
   - **Reminder scheduling for existing overdue invoices:** If reminders are enabled on an invoice that is already past due, the first reminder is sent immediately (on save), then subsequent reminders follow the normal frequency interval. The tone starts at the appropriate step based on how overdue the invoice is: 1–7 days overdue → Step 1 (Casual), 8–14 days → Step 2 (Formal), 15–21 days → Step 3 (Informal), 22+ days → Step 4 (Legal).
7. **Save & Actions**
   - "Save as Draft" button
   - "Save & Send" button (sends invoice + starts reminder sequence)

**Validation (Zod Schema):**
```typescript
const invoiceSchema = z.object({
  clientId: z.string().uuid(),
  title: z.string().min(1, "Title is required").max(255),
  invoiceNumber: z.string().min(1).max(50),
  issueDate: z.date(),
  dueDate: z.date().min(z.date(), "Due date must be in the future"),
  paymentTerms: z.enum(["net15", "net30", "net60", "due_on_receipt", "custom"]),
  lineItems: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().positive(),
    rate: z.number().positive(),
    amount: z.number().positive(),
  })).min(1, "At least one line item is required"),
  taxRate: z.number().min(0).max(100).optional().default(0),
  discountPercent: z.number().min(0).max(100).optional().default(0),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  reminderEnabled: z.boolean().default(true),
  reminderFirstAfterDays: z.number().min(1).default(7),
  reminderFrequencyDays: z.number().min(1).default(7),
});
```

### 6.5.3 Invoice Detail / View

**Route:** `/app/invoices/[id]`

**Sections:**
1. **Header** — Invoice #, Status badge, Actions dropdown (Edit, Send, Delete, Duplicate)
2. **Invoice Preview** — Rendered invoice (printable, PDF downloadable)
   - Header: Logo (if set), Invoice #, Date, Due Date
   - Bill To: Client name, company, email
   - Line items table
   - Totals section
   - Notes
3. **Timeline / Activity Log**
   - Invoice created
   - Invoice sent (with date)
   - Reminder 1 sent (date, tone, delivery status)
   - Reminder 2 sent...
   - Invoice viewed (if client opened via share link)
   - Payment received (date, amount)
4. **Reminder Sequence** (visual timeline or flow chart)
   - Each step: Tone, Status (pending/sent/delivered/opened), Scheduled date
   - "Send Now" button for pending steps
   - "Edit Message" button (opens modal with message preview + AI regenerate)
   - **Pause Reminders** button when `reminderPaused` is true due to partial payment
5. **Payment Section**
   - "Mark as Paid" button (opens modal: date, amount, payment method)
   - **Partial Payment Support:** User can mark a partial payment. When this happens:
     - `paidAmount` is updated but invoice status remains "partially_paid"
     - `reminderPaused` is set to true (reminders pause automatically)
     - The reminder sequence is paused for 14 days to allow for remaining payment
     - If no further payment received in 14 days, `reminderPaused` flips back to false and reminders resume
     - User can manually resume reminders at any time
   - Payment history

### 6.5.4 Invoice PDF Generation

**Library:** `@react-pdf/renderer` (v4.x)

**Important — Serverless Compatibility:**
- Use `@react-pdf/renderer` on the server via API route. The library is ~5MB which fits within Vercel Pro's 100MB limit.
- **Font registration:** Inter font must be registered via `Font.register()` with the `.ttf` files hosted in `/public/fonts/` (download Inter from Google Fonts and bundle).
- **Logo images:** Server-side PDF generation cannot load external URLs. Logo is fetched server-side via `fetch()` and converted to base64 data URI, or stored in the `invoice` record as a base64 string.
- **API Route:** `GET /api/invoices/[id]/pdf` → returns `Content-Type: application/pdf` with the generated PDF buffer.

**Spec:**
- Clean, professional design
- Includes: Logo (if set, as base64), Invoice #, Dates, Client info, Line items, Totals, Notes, Payment terms
- "DeathFear" watermark in footer (light gray, rotated)
- **Filename:** `invoice-{invoiceNumber}.pdf` (e.g., `invoice-DF-2025-0001.pdf`)
- Download button in invoice detail view triggers a `window.open()` to the PDF API route

### 6.5.5 Client Invoice Portal (Tokenized Access)

**Route:** `/invoice/[token]` (public, no auth required)

**Purpose:** Allow clients to view, pay, and track invoices without needing a DeathFear account.

**Flow:**
1. When an invoice is sent, an `invoice_shares` record is created with a crypto-random 64-character token
2. The "View Invoice" link in reminder emails is: `https://deathear.app/invoice/{token}`
3. Clients visit this URL, see the invoice rendered for printing
4. **Page layout:**
   - Clean, minimal layout (no DeathFear sidebar/nav — just the invoice)
   - Header: "Invoice from {freelancerName}" with freelancer's company/logo
   - Invoice details: number, dates, line items, totals
   - Status bar: "This invoice is [status]" with dates
   - "Pay Now" button (if unpaid/overdue) → links to freelancer's preferred payment method (or a future payment collection feature)
5. When a client views the page, `lastViewedAt` and `viewCount` are updated, and the invoice status changes to "viewed"
6. The freelancer gets a notification: "{clientName} viewed invoice {number}"

**Token Security:**
- Tokens generated via `crypto.randomBytes(32).toString('hex')` (64 hex chars)
- Tokens are one-way: no API exposes the token, it's only in the email link
- Optional expiry: freelancer can set "Link expires in 30 days" in invoice settings
- No sensitive data exposed: only invoice details (no freelancer's other clients, no payment account details)

---

## 6.6 Client Management

### 6.6.1 Client List

**Route:** `/app/clients`

**Features:**
- Search by name, email, company
- Filter by payment status (paid, overdue, none)
- Sort by name, total invoiced, last invoice date
- Free plan: limited to 5 clients (hides "Add Client" button when at limit)

**Table Columns:**
| Column | Description |
|--------|-------------|
| Name | + company below |
| Email | Clickable → mailto: |
| Total Invoiced | Sum of all invoices |
| Total Paid | Sum of paid invoices |
| Balance | Outstanding amount |
| Status | Badge: Good Standing, Overdue, Collections |
| Last Invoice | Date |
| Actions | View, New Invoice, Send Reminder |

### 6.6.2 Client Detail

**Route:** `/app/clients/[id]`

**Sections:**
1. **Client Info Card** — Name, email, company, phone, notes
2. **Payment Summary** — Total invoiced, total paid, balance, invoice count
3. **Payment History Chart** — Bar chart showing payments over time
4. **Invoice History** — Table of all invoices for this client
5. **Quick Actions** — New Invoice, Send Reminder (with tone selector)

### 6.6.3 Add / Edit Client

**Modal or Page:**
- Name (required)
- Email (required, validated)
- Company (optional)
- Phone (optional)
- Notes (optional textarea)

## 6.7 Reminder Engine (Core Feature)

### 6.7.1 Default Reminder Sequence

When an invoice is sent, the following default sequence is created:

| Step | Days Past Due | Tone | Subject Example |
|------|---------------|------|-----------------|
| 1 | 7 | Casual | "Quick heads up about invoice {#}" |
| 2 | 14 | Formal | "Payment Reminder: Invoice {#} Due" |
| 3 | 21 | Informal | "Hey [Name], just following up on invoice {#}" |
| 4 | 30 | Legal | "Final Notice: Invoice {#} — Outstanding Balance" |

### 6.7.2 Reminder Message Templates

**Tone: Casual (Step 1)**
```
Subject: Quick heads up about invoice {invoiceNumber}

Hi {clientName},

Hope you're doing well! Just wanted to gently remind you that invoice {invoiceNumber} for {amount} was due on {dueDate}.

If it's already been paid, please ignore this message — and thank you! If not, no worries at all, just a friendly nudge.

Let me know if you have any questions.

Best,
{senderName}
```

**Tone: Formal (Step 2)**
```
Subject: Payment Reminder: Invoice {invoiceNumber}

Dear {clientName},

This is a reminder that Invoice {invoiceNumber} in the amount of {amount} was due on {dueDate} and remains unpaid.

We kindly request that payment be made at your earliest convenience. If you have already sent payment, please disregard this notice.

Please refer to the attached invoice for payment details.

Sincerely,
{senderName}
{senderCompany}
```

**Tone: Informal (Step 3)**
```
Subject: Following up on invoice {invoiceNumber}

Hey {clientName},

I'm just following up on invoice {invoiceNumber} ({amount}) which is now {daysOverdue} days past due.

I really need to get this sorted so I can close out the books. Can you please take care of this by the end of the week?

Thanks,
{senderName}
```

**Tone: Legal (Step 4)**
```
Subject: FINAL NOTICE: Invoice {invoiceNumber} — {daysOverdue} Days Overdue

{clientName},

This is a formal notification that Invoice {invoiceNumber} in the amount of {amount} is now {daysOverdue} days past due.

If payment is not received within 7 days, we will have no choice but to pursue legal action, which may include:

1. Filing a formal demand letter
2. Reporting to credit bureaus
3. Pursuing the claim in small claims court

Please remit payment immediately to avoid escalation.

{senderName}
```

### 6.7.3 AI Tone Adaptation (Premium Feature)

**Flow:**
1. User provides writing sample(s) during onboarding or in Settings
2. When AI tone is enabled, the system:
   a. Sends the base template + the user's tone sample to OpenAI API
   b. Prompt: "Rewrite the following reminder in the style and voice of the user's sample. Keep the same meaning and urgency level ({tone}). Return only the rewritten message."
   c. Shows the AI-generated version to the user for review
   d. User can: Accept, Edit, or Regenerate
3. Once accepted, the AI version is saved as the reminder message for that step
4. The system learns: stores accepted rewrites to improve future generations

**Cost & Usage Limits:**
- OpenAI API cost for AI tone generation is **baked into the Premium subscription** ($19/mo)
- Each Premium user gets **50 AI tone generations per month** (covers ~12 invoices × 4 reminders = 48 generations)
- If a user exceeds 50 generations, they receive a notification: "You've used your AI generations for this month. They'll reset on {date}." Can upgrade or wait.
- Heavy usage beyond 50/mo costs DeathFear ~$1–$2/user at current OpenAI pricing — the cap prevents abuse while covering normal usage
- Monthly cap resets with billing cycle
- **Rate limit fallback:** If OpenAI API returns a 429 (rate limited) or 5xx error, the system falls back to the pre-written template without AI adaptation. The reminder is still sent. An error is logged and the freelancer is notified via in-app notification.

**OpenAI Configuration:**
```typescript
const generateAIReminder = async (
  sampleText: string,
  templateMessage: string,
  tone: 'casual' | 'formal' | 'informal' | 'legal'
) => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a writing assistant. Rewrite the given reminder message in the user's voice.
          - Tone level: ${tone}
          - Match the user's writing style, vocabulary, and sentence structure from their sample.
          - Keep all key information (invoice number, amount, dates, urgency).
          - Do not add placeholders the user didn't provide.
          - Return ONLY the rewritten message, no explanations.`
        },
        {
          role: 'user',
          content: `Here is a sample of how the user writes:\n\n${sampleText}\n\n---\n\nHere is the reminder to rewrite:\n\n${templateMessage}`
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0]?.message?.content || templateMessage;
  } catch (error) {
    // On any OpenAI error (rate limit, timeout, 5xx), fall back to template
    console.error('OpenAI API error:', error);
    return templateMessage;
  }
};
```

### 6.7.4 Sending Logic (Cron Job)

**Mechanism:** Inngest (preferred) or Vercel Cron Jobs

**Schedule:** Runs daily at 08:00 UTC

**Query:**
```sql
SELECT i.*, u.email as user_email, u.name as user_name,
       c.email as client_email, c.name as client_name
FROM invoices i
JOIN users u ON i.user_id = u.id
JOIN clients c ON i.client_id = c.id
WHERE i.reminder_enabled = true
  AND i.reminder_paused = false
  AND i.status IN ('sent', 'viewed', 'overdue', 'partially_paid')
  AND i.next_reminder_date = CURRENT_DATE
  AND i.current_reminder_step < 4
```

**Per invoice:**
1. Get the reminder config for the current step
2. If AI tone enabled for user → generate AI version
3. Send email via Resend with reminder template
4. Update reminder record: set sentAt, deliveryStatus = 'sent'
5. Increment currentReminderStep
6. Calculate nextReminderDate = today + reminderFrequencyDays
7. If all steps completed → check if legal escalation should be triggered

**Error Recovery:**
- Each reminder stores `retryCount` and `errorMessage`
- If Resend returns an error (not a bounce), retry up to 3 times with exponential backoff (5 min, 15 min, 60 min)
- After 3 failures, set `deliveryStatus = 'failed'`, log error, notify the freelancer via in-app notification
- If email bounces (Resend webhook `email.bounced`), set `deliveryStatus = 'bounced'`, notify freelancer, pause reminders for that invoice
- Inngest automatically retries failed jobs with configurable backoff
- Dead letter queue: after 5 failures, escalate to admin manual review

**Resend Email Configuration:**
```typescript
// lib/email.ts
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendReminderEmail({
  to,
  subject,
  html,
  from = 'DeathFear <reminders@deathear.app>',
  replyTo,
}: {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}) {
  const response = await resend.emails.send({
    from,
    to: [to],
    subject,
    html,
    replyTo, // Set to freelancer's email so client replies go to the freelancer
    tags: [{ name: 'category', value: 'reminder' }],
  });

  return response;
}
```

**Email Reply Handling:**
- `replyTo` is always set to the freelancer's email address
- When a client replies to a reminder, the email goes directly to the freelancer's inbox
- DeathFear does NOT intercept or store email replies (out of scope for v1)
- Future: Inbound email parsing via Resend's inbound email feature to auto-detect "I'll pay" vs disputes

**Email Tracking:**
- Use Resend's built-in open tracking
- Webhook endpoint `/api/webhooks/resend` to update deliveryStatus and openedAt

### 6.7.5 Free Plan Enforcement

- When a Free plan user creates an invoice:
  1. Check `subscription.invoicesUsedThisMonth` against `subscription_plan.invoicesPerMonth`
  2. If at limit, show a paywall modal: "You've used all 3 invoices this month. Upgrade to Premium for unlimited invoices."
  3. Options: Upgrade to Premium, or wait until next billing cycle
- Invoice count resets monthly via cron job (`manageSubscriptions()` resets `invoicesUsedThisMonth = 0` and `lastInvoiceResetAt = NOW()`)
- Client limit enforced similarly in the "Add Client" flow

---

## 6.8 Legal Escalation (Premium Feature)

### 6.8.1 Formal Demand Letter

**Route:** `/app/invoices/[id]/legal`

**Trigger:** After all 4 reminder steps complete, or user manually triggers

**Pause/Cancel:**
- User can **pause** legal escalation at any time (sets status to "paused", no further letters sent)
- User can **cancel** legal escalation entirely (sets status to "canceled", removes it from the escalation dashboard)
- Pausing does not delete any already-generated letters — they remain accessible in the timeline
- Canceling does delete draft letters (but not sent ones)
- Both actions are reversible: "resume" unpauses, new trigger restarts canceled escalations

**Content Generation:**
- Pre-built template for formal demand letter
- AI-enhanced version available (Premium)
- Include: Invoice details, payment history, warning of legal action, final payment deadline

**Template Structure:**
```
[Date]

VIA EMAIL

[Client Name]
[Client Company]
[Client Email]

Re: FINAL DEMAND FOR PAYMENT — Invoice [Number]

Dear [Client Name],

This letter serves as a formal demand for payment of the outstanding balance of [Amount] for services rendered as detailed in Invoice [Number], dated [Invoice Date].

Despite multiple reminders sent on [list dates], the amount remains unpaid and is now [Days] days past due.

UNLESS PAYMENT IS RECEIVED IN FULL within 7 calendar days from the date of this letter, we will take the following actions without further notice:

1. File a claim in [State/County] Small Claims Court
2. Report this debt to credit reporting agencies
3. Pursue all available legal remedies to collect the amount owed

We prefer to resolve this matter amicably, but we are prepared to pursue all legal options if necessary.

Please remit payment via [payment methods] immediately.

Sincerely,

[Sender Name]
[Sender Company]
```

### 6.8.2 Small Claims Filing Guide

**Route:** `/app/invoices/[id]/legal`

**Pre-built Legal Templates Storage:**
- A JSON file `data/small-claims-data.json` bundled with the app contains jurisdiction data
- Structure:
```json
{
  "USA": {
    "Alabama": {
      "maxClaimAmount": 6000,
      "filingFee": 99,
      "courtName": "Alabama Small Claims Court",
      "formName": "Statement of Claim (Small Claims)",
      "formUrl": "https://...",
      "serverOptions": ["Certified Mail", "Sheriff"],
      "notes": "No attorney required. 30-day appeal window."
    },
    ...
  },
  "UK": { ... },
  "Canada": { ... },
  "Australia": { ... }
}
```
- This file is created manually by the DeathFear team pre-launch (or populated via a legal data API in v2)

**Generation:**
- User inputs: State/Country, amount owed, client's location
- System generates jurisdiction-specific guide

**Scope & Limitations (v1):**
- **Supported jurisdictions:** USA (all 50 states + DC), UK, Canada (by province), Australia (by state)
- **Generation method:** Pre-written templates with state-specific variable insertion (filing fees, court names, form names) — NOT AI-generated legal advice
- **Disclaimer displayed on every guide:** "This guide is for informational purposes only and does not constitute legal advice. Consult with a licensed attorney for advice specific to your situation." This disclaimer is also shown on the legal escalation page itself, not just the generated document.
- **Unsupported jurisdictions:** Show message: "Small claims guide is not yet available for your jurisdiction. We recommend consulting with a local attorney."
- Future: Partner with legal APIs for live jurisdiction data

**Guide Sections:**
1. Eligibility Check — Amount thresholds for small claims (state-specific)
2. Court Locator — Nearest small claims court (based on zip/postal code)
3. Required Forms — List with links to official court websites
4. Filing Instructions — Step-by-step (generalized per state)
5. Serving the Defendant — Process options per state
6. Court Date Preparation — What to bring (checklist)
7. Judgment Enforcement — If you win, next steps

---

## 6.9 Subscription & Billing

### 6.9.1 Subscription Plans

**Free Plan (no trial — always free):**
- 3 invoices per month
- 5 clients tracked
- Basic reminder templates (no AI)
- Email support
- All 4 tones available with pre-written templates

**Premium Plan (no trial — paid from day 1):**
- Free plan users can upgrade to Premium at any time
- No free trial period in v1 (simplifies billing). Future: 7-day free trial for Premium.
- Unlimited invoices
- Unlimited clients
- AI tone adaptation
- Legal escalation (demand letters + small claims guides)
- Priority support
- Analytics & reporting

**Pricing (configurable via admin):**
- Free: $0/month
- Premium Monthly: $19/month
- Premium Annual: $190/year (save ~$38)
- **Multi-currency:** v1 is USD-only. All prices, amounts, and invoices use USD. Future versions may add multi-currency.

### 6.9.2 Subscription Flow

**Route:** `/app/subscribe`

1. User sees plan comparison
2. Selects Premium → Monthly or Annual
3. Payment method selection: Credit Card (Stripe), PayPal, UPI AutoPay
4. If Stripe → hosted Checkout page
5. If PayPal → PayPal billing agreement flow
6. If UPI → Razorpay UPI AutoPay (eMandate) flow
7. Webhook handles subscription creation
8. User redirected to `/app/dashboard` with success toast

### 6.9.3 UPI Integration (Razorpay AutoPay / eMandate)

**Provider:** Razorpay

**Important:** Recurring subscriptions via UPI require **eMandate (AutoPay)**, NOT one-time UPI payments.

**Flow:**
1. Freelancer selects "UPI AutoPay" as payment method
2. Razorpay creates a subscription with `plan_id` (monthly or annual)
3. Freelancer enters UPI ID (e.g., `user@paytm` or `user@upi`)
4. Razorpay initiates eMandate — freelancer authorizes recurring debit
5. On first successful payment → subscription activated
6. Monthly/Annual recurring payments happen automatically via UPI AutoPay
7. Webhook `subscription.charged` and `subscription.completed` events handled by `/api/webhooks/razorpay`
8. If payment fails → subscription.status = "past_due" → retry logic (3 attempts, 48h apart) → if all fail, cancel subscription

**UI:**
- UPI ID input field with validation
- Status indicator during mandate setup
- Link to Razorpay's hosted page for mandate authorization if direct UPI fails

### 6.9.4 Subscription Transitions

**Free → Premium Upgrade:**
1. All existing data (invoices, clients, tone samples, reminders) remains intact
2. Invoice and client limits are lifted immediately upon successful payment
3. AI tone adaptation is unlocked — existing tone samples become usable
4. Legal escalation is unlocked — existing overdue invoices can trigger escalation
5. No data migration needed — simply update the user's `planId` and set `status = 'active'`
6. Proration: For mid-cycle upgrades, charge the full Premium monthly price (no proration in v1 to keep billing simple). The user can cancel within 7 days for a full refund.

**Premium → Free Downgrade (user-initiated or due to payment failure):**
1. At end of current billing period, switch plan. No immediate downgrade (user keeps Premium until period ends).
2. When downgrade takes effect:
   - AI tone adaptation disabled (existing AI-generated reminders stay in place, but new ones use templates)
   - Legal escalation disabled (active escalations are paused, not deleted)
   - Invoice and client counts are checked against Free limits
   - If user exceeds Free limits: they can still view existing invoices/clients, but cannot create new ones until under the limit
   - In-app notification: "Your plan has been downgraded to Free. Some features are now limited."
3. **Payment failure handling:** Retry logic runs for 7 days (3 attempts: day 1, day 3, day 7). After all failures fail, subscription is moved to `canceled` status and the downgrade flow above is triggered.

**Monthly → Annual (or vice versa):**
1. User switches billing interval in subscription settings
2. For Monthly → Annual: charge the annual price after confirming. New billing cycle starts.
3. For Annual → Monthly: the annual subscription remains active until the end of the paid period, then switches to monthly
4. Proration: Not supported in v1. The switch happens at the next billing cycle.

## 6.10 Settings

**Route:** `/app/settings`

### Sections:

1. **Profile**
   - Name, email (verified, change triggers verification)
   - Avatar upload (max 2MB, PNG/JPG/WebP, recommended 256×256px)
   - Company name, website

2. **Tone Samples** (Premium)
   - List of saved writing samples
   - Add new sample (textarea, max 2000 characters)
   - "Use my tone for all reminders" toggle
   - Test tone button: "Generate sample reminder with my voice"

3. **Reminder Defaults**
   - Default reminder schedule (days between reminders)
   - Default tone progression order
   - Default enable/disable
   - Quiet hours (don't send between X and Y)

4. **Invoice Settings**
   - Default payment terms
   - Default currency (USD only in v1)
   - Invoice number prefix (default: "DF")
   - Logo upload (max 5MB, PNG/SVG preferred, max 512×512px)

5. **Notifications**
   - Email me when: Invoice paid, Reminder bounces, Client opens invoice, Subscription renews
   - Digest frequency: Instant, Daily, Weekly

6. **Billing**
   - Current plan display
   - Upgrade / Downgrade / Cancel
   - Payment history
   - Download invoices/receipts

7. **API Keys** (Future, scaffold UI)
   - Create/manage API keys for integrations

## 6.11 Admin Dashboard

**Route:** `/admin` (role-protected, `user.role === 'admin'` check in middleware)

**Access Control:**
- `/admin/*` layout checks `session.user.role === 'admin'`
- If non-admin user tries to access: redirect to `/app/dashboard` with error toast "Access denied"
- API routes also check role server-side (never trust client-side checks alone)

### Sections:

1. **Overview**
   - Total users (Free vs Premium)
   - MRR (Monthly Recurring Revenue)
   - Invoices created/sent/paid (aggregate)
   - Emails sent today/this month
   - Failed cron jobs requiring manual review (dead letter queue count)

2. **Users**
   - Table: Name, Email, Plan, Status, Joined date, Role
   - Actions: View, Impersonate (dev only), Suspend, Delete, Change role (promote to admin / demote to user)
   - Search + filters

3. **Subscriptions**
   - Table: User, Plan, Status, Next billing date, Payment provider
   - Manual subscription management: force cancel, refund, extend trial

4. **Plans**
   - CRUD for subscription_plans table
   - Edit pricing, features, limits
   - Preview changes before saving

5. **Email Logs**
   - Table: notification_logs
   - Filter by user, type, status
   - View email body
   - Search by email address

6. **Failed Jobs** (dead letter queue)
   - List failed cron jobs with error details
   - Retry / Dismiss buttons

---

# 7. API ROUTE DESIGN

## 7.1 Route Structure

```
/api/auth/*          — NextAuth.js (automatic)
/api/webhooks/stripe — Stripe webhook handler
/api/webhooks/paypal — PayPal webhook handler
/api/webhooks/razorpay — Razorpay webhook handler
/api/webhooks/resend — Resend webhook (email tracking)

/api/invoices
  GET    /api/invoices          — List user's invoices (paginated, filterable)
  POST   /api/invoices          — Create invoice
  GET    /api/invoices/[id]     — Get invoice detail
  PUT    /api/invoices/[id]     — Update invoice
  DELETE /api/invoices/[id]     — Delete invoice
  POST   /api/invoices/[id]/send        — Send invoice
  POST   /api/invoices/[id]/mark-paid   — Mark as paid (supports partial)
  POST   /api/invoices/[id]/send-reminder — Send custom reminder
  GET    /api/invoices/[id]/pdf         — Generate/download PDF

/api/clients
  GET    /api/clients           — List user's clients
  POST   /api/clients           — Create client
  GET    /api/clients/[id]      — Get client detail
  PUT    /api/clients/[id]      — Update client
  DELETE /api/clients/[id]      — Delete client

/api/reminders
  POST   /api/reminders/generate-ai — Generate AI tone version
  PUT    /api/reminders/[id]        — Update reminder message
  POST   /api/reminders/[id]/pause  — Pause reminder sequence
  POST   /api/reminders/[id]/resume — Resume reminder sequence

/api/legal
  POST   /api/legal/generate-letter   — Generate formal demand letter
  POST   /api/legal/generate-guide    — Generate small claims guide
  GET    /api/legal/[invoiceId]       — Get legal escalation status

/api/subscriptions
  GET    /api/subscriptions/plans      — List available plans
  POST   /api/subscriptions/create     — Create checkout session
  GET    /api/subscriptions/current    — Get current subscription
  POST   /api/subscriptions/cancel     — Cancel subscription
  POST   /api/subscriptions/update     — Change plan/interval

/api/settings
  GET    /api/settings            — Get user settings
  PUT    /api/settings            — Update user settings
  POST   /api/settings/tone-sample — Add tone sample
  DELETE /api/settings/tone-sample/[id] — Remove tone sample

/api/admin
  GET    /api/admin/stats           — Dashboard statistics
  GET    /api/admin/users           — List all users
  PUT    /api/admin/users/[id]      — Update user (suspend, change role, etc.)
  GET    /api/admin/plans           — List subscription plans
  POST   /api/admin/plans           — Create/update plan
  GET    /api/admin/email-logs      — View email logs
  GET    /api/admin/failed-jobs     — View dead letter queue
  POST   /api/admin/failed-jobs/[id]/retry — Retry failed job

# Client-facing (no auth)
/api/share/[token]     — Get invoice data by share token (public)
```

## 7.2 API Response Format

```typescript
// Success response
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "perPage": 10, "total": 42 } // for paginated
}

// Error response
{
  "success": false,
  "error": {
    "code": "INVOICE_NOT_FOUND",
    "message": "The invoice with the provided ID was not found."
  }
}
```

## 7.3 Authentication

All `/api/*` routes (except auth, webhooks, and public /api/share/* endpoints) require authentication.

```typescript
// middleware.ts
export { auth as middleware } from "@/auth";
export const config = {
  matcher: ["/api/:path*", "/app/:path*"],
};
```

## 7.4 Rate Limiting

| Endpoint Group | Limit | Window | Scope |
|----------------|-------|--------|-------|
| Standard API (`/api/invoices/*`, `/api/clients/*`, etc.) | 100 req/min | 1 minute | Per user |
| AI Generation (`/api/reminders/generate-ai`) | 10 req/min | 1 minute | Per user |
| Auth endpoints (`/api/auth/*`) | 5 req/15min | 15 minutes | Per email |
| Share endpoints (`/api/share/*`) | 30 req/min | 1 minute | Per IP |
| Webhooks (`/api/webhooks/*`) | Unrestricted | — | IP whitelist |

**Implementation:** Vercel KV + Upstash Ratelimit or a simple in-memory map with token bucket.

```typescript
// lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const standardApi = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, "1 m"),
  analytics: true,
  prefix: "ratelimit:standard",
});

export const aiApi = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  analytics: true,
  prefix: "ratelimit:ai",
});
```

---

# 8. EMAIL TEMPLATES (React Email)

All emails sent via Resend with React Email templates. Templates use Tailwind-compatible React Email components.

## 8.1 Invoice Sent

**To:** Client
**Subject:** Invoice {invoiceNumber} from {senderName}
**Template Components:**
- Container with DeathFear header branding
- "Hi {clientName}" greeting
- Invoice summary card: Invoice #, Amount, Due Date, Status
- "View Invoice" button (links to `/invoice/{token}`)
- Payment instructions text
- Footer with sender details

**React Email Component (structure):**
```tsx
// emails/invoice-sent.tsx
export const InvoiceSentEmail = ({
  clientName,
  invoiceNumber,
  amount,
  dueDate,
  senderName,
  invoiceUrl,
}: {
  clientName: string;
  invoiceNumber: string;
  amount: string;
  dueDate: string;
  senderName: string;
  invoiceUrl: string;
}) => (
  <Html>
    <Head />
    <Preview>Invoice {invoiceNumber} from {senderName}</Preview>
    <Body>
      <Container>
        <Heading>Invoice from {senderName}</Heading>
        <Text>Hi {clientName},</Text>
        <Text>You've received a new invoice:</Text>
        <Card>
          <Row><strong>Invoice:</strong> {invoiceNumber}</Row>
          <Row><strong>Amount:</strong> {amount}</Row>
          <Row><strong>Due Date:</strong> {dueDate}</Row>
        </Card>
        <Button href={invoiceUrl}>View Invoice</Button>
        <Text>Or copy this link: {invoiceUrl}</Text>
        <Hr />
        <Text>Sent via DeathFear</Text>
      </Container>
    </Body>
  </Html>
);
```

## 8.2 Reminder Email

**To:** Client
**Subject:** Dynamic based on tone
**Template Components:**
- Header with DeathFear branding + escalation indicator (Step X/4)
- Reminder message body (dynamic, AI or template)
- Invoice summary card
- "View Invoice" button (links to `/invoice/{token}`)
- Payment link/button (if using Stripe Payment Links or future payment collection)
- Footer: "Sent via DeathFear on behalf of {senderName}. Replies go directly to {senderEmail}."

## 8.3 Payment Confirmation

**To:** Freelancer
**Subject:** Payment received — Invoice {invoiceNumber}
**Content:** {clientName} has paid {amount} of {totalAmount}. View receipt.
**Components:**
- Green success indicator
- Amount paid, remaining balance (if partial)
- "View Invoice" button → `/app/invoices/[id]`
- "Send Thank You" quick action button (opens compose)

## 8.4 Invoice Viewed

**To:** Freelancer
**Subject:** {clientName} viewed invoice {invoiceNumber}
**Content:** Your client opened invoice {invoiceNumber}. They're on it!
**Components:**
- Status indicator: viewed
- Open time
- "View Invoice" button → `/app/invoices/[id]`

## 8.5 Subscription Notifications

**To:** Freelancer
**Subjects:**
- "Welcome to DeathFear Premium!" (with getting started checklist)
- "Your DeathFear subscription has been renewed" (with receipt link)
- "Your DeathFear trial ends in 3 days" (with upgrade CTA)
- "Your subscription has been canceled" (with survey link)
- "Payment failed — update your billing information" (with retry link)

## 8.6 Email Bounce Notification

**To:** Freelancer
**Subject:** Reminder email bounced for {clientName}
**Content:** The reminder for invoice {invoiceNumber} was not delivered to {clientEmail}. This usually means the email address is invalid or the recipient's server rejected it.
**Actions:** Update client email, pause reminders, retry

---

# 9. ERROR BOUNDARIES

All app routes must have Next.js error boundaries to prevent full-page crashes:

- **`/app/(dashboard)/error.tsx`** — Dashboard-wide error boundary. Shows "Something went wrong on our end. We're on it." with retry button + link to dashboard.
- **`/app/(dashboard)/invoices/error.tsx`** — Invoices section error boundary.
- **`/app/(dashboard)/clients/error.tsx`** — Clients section error boundary.
- **`/admin/error.tsx`** — Admin section error boundary (different message: "Admin panel error. Contact support.").
- **Global 404 (`/not-found.tsx`)** — Custom 404 page with DeathFear branding.

Each error boundary:
1. Logs the error via `console.error` (or Sentry in production)
2. Shows a user-friendly message (no stack traces to users)
3. Provides a "Try again" button that calls `reset()`
4. After 3 consecutive errors, shows "This keeps failing. Go back to dashboard." link instead of retry button

---

# 9. UI / UX SPECIFICATIONS

## 9.1 Design System

**Colors:**
```css
--primary: 262 83% 58%;      /* Purple (#8B5CF6) — Bold, confident */
--primary-foreground: 0 0% 100%;
--secondary: 220 14% 96%;     /* Light gray */
--destructive: 0 84% 60%;     /* Red for overdue/errors */
--success: 142 71% 45%;       /* Green for paid */
--warning: 38 92% 50%;        /* Amber for warnings */
--background: 0 0% 100%;
--foreground: 220 10% 10%;
--muted: 220 14% 96%;
--muted-foreground: 220 9% 46%;
--card: 0 0% 100%;
--card-foreground: 220 10% 10%;
--border: 220 13% 91%;
--ring: 262 83% 58%;
```

**Typography:**
- Font: Inter (sans-serif)
- Headings: Inter Semi-Bold
- Body: Inter Regular
- Monospace: JetBrains Mono (for code/dollar amounts)

**Spacing:**
- Base unit: 4px
- Consistent padding: p-6 for page content

**Dark Mode:** Optional, use next-themes with Toggle in settings

**Brand Voice in UI:**
- Copy is empathetic and direct: "We've got your back" not "Our platform empowers"
- Error messages are human: "Something went wrong on our end. We're on it." not "Error 500 occurred"
- Empty states are encouraging: "No invoices yet. Let's create your first one →" with illustration

## 9.2 Component Library

Use shadcn/ui components:
- Button (variants: default, secondary, destructive, outline, ghost, link)
- Card
- Input
- Select
- Textarea
- Table
- Badge (variants for status)
- Dialog / Modal
- Dropdown Menu
- Popover
- Sheet (mobile sidebar)
- Tabs
- Toast / Sonner
- Avatar
- Skeleton (loading states)

## 9.3 Animations & Micro-interactions

- Page transitions: Framer Motion fade + slide
- Button hover: scale(1.02) + shadow
- Card hover: subtle lift + border highlight
- Toast notifications: slide in from top-right
- Loading skeletons: shimmer animation
- Status badge: color transition on change
- Sidebar collapse: smooth width transition

## 9.4 Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 640px | Single column, bottom nav or hamburger |
| Tablet | 640–1024px | Sidebar collapsed, 2-column grids |
| Desktop | > 1024px | Full sidebar, multi-column grids |

## 9.5 Accessibility (WCAG 2.1 AA)

**Minimum Compliance Standards:**
- **Color contrast:** All text meets WCAG AA ratio (4.5:1 for normal text, 3:1 for large text)
- **Keyboard navigation:** All interactive elements reachable and operable via keyboard (Tab, Enter, Escape)
- **Focus indicators:** Visible focus rings on all interactive elements (use shadcn/ui's built-in ring styles)
- **Screen reader support:**
  - All icons have `aria-hidden="true"` and text labels where needed
  - Forms have proper `<label>` elements (not placeholders as labels)
  - Dynamic content updates use `aria-live` regions
  - Status changes (e.g., "Invoice sent") announced via `role="status"`
- **Semantic HTML:** Use proper heading hierarchy (h1 > h2 > h3), `<nav>`, `<main>`, `<aside>`
- **Error announcements:** Form errors use `aria-describedby` to associate error messages with inputs
- **Skip to content:** Hidden "Skip to main content" link at top of each page
- **Testing:** Run axe DevTools on all pages before shipping

---

# 10. ERROR HANDLING

## 10.1 User-Facing Errors

| Scenario | Message | Action |
|----------|---------|--------|
| Network error | "Something went wrong. Please try again." | Retry button |
| Payment failed | "Payment was declined. Please try a different payment method." | Change method button |
| Invoice not found | "Invoice not found. It may have been deleted." | Go back button |
| Rate limited | "Too many attempts. Please try again in {minutes}." | Timer countdown |
| Subscription expired | "Your subscription has expired. Renew to continue using premium features." | Renew button |
| Free plan limit | "You've hit the free plan limit. Upgrade for unlimited access." | Upgrade button |
| Validation error | Inline field errors with specific messages | Field highlight |
| Email bounced | "This email address appears to be invalid. Please check and update." | Edit client button |
| Premium feature on free plan | "This feature requires a Premium plan." | Upgrade button + feature highlight |

## 10.2 Backend Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHORIZED | 401 | Not authenticated |
| FORBIDDEN | 403 | Not authorized for this action |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 422 | Input validation failed |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Unexpected server error |
| PAYMENT_REQUIRED | 402 | Premium feature on free plan |
| CONFLICT | 409 | Duplicate resource |
| PLAN_LIMIT_EXCEEDED | 403 | Free plan limit reached (invoices/clients) |
| PAYMENT_FAILED | 402 | Payment processing failed |

---

# 11. BACKGROUND JOBS / CRON

## 11.1 Daily Reminder Check

**Schedule:** Every day at 08:00 UTC
**Engine:** Inngest (with automatic retries + observability)
**Function:** `checkAndSendReminders()`
**What it does:**
1. Query all invoices where nextReminderDate = today AND reminderEnabled = true AND reminderPaused = false
2. For each, generate reminder (AI or template)
3. Send email via Resend
4. Update reminder status
5. Increment step count, calculate next date
6. Log in notification_logs
7. On failure: retry up to 3 times with exponential backoff, then move to dead letter queue

## 11.2 Invoice Status Auto-Update

**Schedule:** Every day at 00:00 UTC
**Function:** `updateOverdueInvoices()`
**What it does:**
1. Query all invoices where dueDate < today AND status = 'sent'
2. Update status to 'overdue'
3. If no reminder sent yet, schedule first reminder

## 11.3 Subscription Management

**Schedule:** Every hour
**Function:** `manageSubscriptions()`
**What it does:**
1. Check for subscriptions about to expire (notify at 7, 3, 1 days before)
2. Check for failed payments (past_due status, notify user, retry logic)
3. Clean up incomplete/expired subscriptions (> 30 days in incomplete status)
4. Reset invoice counts for Free plan users (monthly — set invoicesUsedThisMonth = 0)

## 11.4 Partial Payment Reminder Resume

**Schedule:** Every day at 00:00 UTC
**Function:** `resumePausedReminders()`
**What it does:**
1. Find invoices where reminderPaused = true AND updatedAt < 14 days ago
2. Set reminderPaused = false (auto-resume reminders after 14-day grace period)
3. Notify freelancer: "Reminders have resumed for invoice {number}"

## 11.5 Email Delivery Tracking

**Trigger:** Webhook from Resend
**Function:** `handleResendWebhook(event)`
**What it does:**
1. Update reminder deliveryStatus based on event type
2. Update openedAt when email_opened event received
3. Handle bounced emails:
   - Set deliveryStatus = 'bounced'
   - Log error in notification_logs
   - Set invoice.reminderPaused = true
   - Notify freelancer with bounce notification
4. Handle complaints (spam reports):
   - Immediately pause all reminders for that invoice
   - Notify freelancer urgently

## 11.6 Error Recovery & Dead Letter Queue

**Storage:** `failed_jobs` table or Inngest built-in dead letter queue

```sql
CREATE TABLE failed_jobs (
  id UUID PRIMARY KEY,
  job_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMP NOT NULL DEFAULT NOW(),
  status VARCHAR(20) NOT NULL DEFAULT 'failed', -- 'failed', 'retrying', 'resolved'
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**Flow:**
1. If a cron job fails after all retries → insert into failed_jobs
2. Admin panel shows dead letter queue count in header + dedicated section
3. Admin can "Retry" or "Dismiss" each failed job
4. Retry attempt resets the job with original payload

## 11.7 Cron Job Overlap Prevention

All Inngest cron jobs must include overlap protection to prevent concurrent runs:

- Set `concurrency: 1` on each Inngest cron function
- Example:
```typescript
// jobs/send-reminders.ts
import { inngest } from '@/lib/inngest';

export const checkAndSendReminders = inngest.createFunction(
  { id: 'send-reminders', concurrency: 1 },
  { cron: 'TZ=UTC 0 8 * * *' },
  async ({ step }) => {
    // job logic
  }
);
```
- If a job takes longer than its interval, the next scheduled run is skipped (not queued).
- Skipped runs are logged for admin awareness in the admin dashboard.
- This prevents email storms and database contention during high-volume periods.

---

# 12. PRIVACY & COMPLIANCE

## 12.1 GDPR Compliance

Since DeathFear handles EU user data (even if USD-only, EU users may sign up):

| Requirement | Implementation |
|-------------|----------------|
| Data processing consent | Checkbox on signup: "I agree to the Terms and Privacy Policy" |
| Data collected disclosure | Privacy Policy lists: name, email, invoice data, payment method type (not full details), email open/click data |
| Right to deletion | Settings → "Delete my account" → deletes user, clients, invoices, reminders, tone samples (anonymizes notification_logs) |
| Data portability | Settings → "Download my data" → exports all invoices, clients, settings as JSON |
| Cookie consent | Minimal cookie banner (only essential cookies for auth + optional analytics) |
| Data retention | Notification logs retained 12 months. Reminder delivery status retained 24 months. Active invoices retained until deleted. |
| Email tracking consent | Footer in every email: "We track opens to notify your freelancer. Opens are not shared with third parties." |
| DPA (Data Processing Agreement) | Include link in settings/privacy page |

## 12.2 Data Retention Policy

| Data Type | Retention Period | Notes |
|-----------|-----------------|-------|
| Active user accounts | Indefinite (until deleted) | |
| Deleted user accounts | 30 days (soft delete) | Full purge after 30 days |
| Invoices (active) | Indefinite | |
| Invoices (deleted) | 90 days (soft delete) | Full purge after 90 days |
| Notification logs | 12 months | Used for delivery analytics |
| Reminder delivery status | 24 months | For proof of delivery in legal disputes |
| Email open/click data | 12 months | Aggregate after 12 months |
| Payment records | 7 years (tax compliance) | Stored in Stripe/PayPal, DeathFear stores only subscription ID references |

---

# 13. SECURITY CONSIDERATIONS

| Concern | Implementation |
|---------|---------------|
| Password storage | bcrypt (12 rounds) via NextAuth.js |
| Session management | JWT stored in httpOnly cookies |
| CSRF | Next.js built-in CSRF protection |
| XSS | React's built-in sanitization, no dangerouslySetInnerHTML |
| Rate limiting | Upstash Ratelimit or Vercel KV for API routes (see section 7.4) |
| SQL injection | Prisma ORM prevents raw SQL injection |
| API auth | NextAuth.js middleware on all /api/* routes |
| Payment data | Stripe.js — never touch raw card numbers |
| Email auth | Resend API key in env variables |
| Webhook verification | Verify Stripe/PayPal/Razorpay signatures using their respective SDK verification methods (`stripe.webhooks.constructEvent()`, PayPal `verifyWebhookSignature()`, Razorpay webhook secret HMAC) |
| Webhook idempotency | All webhook handlers must store processed webhook IDs (from `stripe-event-id`, PayPal `transmission-id`, Razorpay `event_id`) and skip duplicates within 5 minutes to prevent double-billing on retries |
| Share token security | Crypto-random 64-char hex tokens, no API exposes tokens |
| Data isolation | All queries scoped to userId (row-level security via Prisma) |
| Admin access | Role check server-side in middleware AND route handlers |

---

# 14. ENVIRONMENT VARIABLES

```bash
# Authentication
AUTH_SECRET=
AUTH_URL=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=

# Database
DATABASE_URL=

# Email (Resend)
RESEND_API_KEY=
RESEND_FROM_EMAIL=reminders@deathear.app

# AI (OpenAI)
OPENAI_API_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PREMIUM_MONTHLY_PRICE_ID=
STRIPE_PREMIUM_ANNUAL_PRICE_ID=

# PayPal
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_WEBHOOK_ID=

# UPI (Razorpay)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# Admin seeding (first deploy only)
ADMIN_EMAIL=
ADMIN_PASSWORD=

# Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=DeathFear
```

---

# 15. FILE STRUCTURE

```
deathear/
├── .env.local
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── vitest.config.ts               # Test configuration
├── playwright.config.ts            # E2E test configuration
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── public/
│   ├── logo.svg
│   ├── favicon.ico
│   └── og-image.png
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root layout (providers)
│   │   ├── page.tsx                      # Landing page
│   │   ├── not-found.tsx                 # Custom 404
│   │   ├── globals.css                   # Global styles
│   │   ├── invoice/
│   │   │   └── [token]/page.tsx          # Client invoice portal (public)
│   │   ├── auth/
│   │   │   ├── signin/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   ├── error/page.tsx
│   │   │   └── verify-request/page.tsx
│   │   ├── onboarding/page.tsx
│   │   ├── app/
│   │   │   ├── error.tsx                 # Dashboard-wide error boundary
│   │   │   ├── (dashboard)/
│   │   │   │   ├── layout.tsx            # App shell (sidebar + topbar)
│   │   │   │   ├── error.tsx             # Dashboard-wide error boundary
│   │   │   │   ├── dashboard/page.tsx
│   │   │   │   ├── invoices/
│   │   │   │   │   ├── error.tsx         # Invoices section error boundary
│   │   │   │   │   ├── page.tsx          # Invoice list
│   │   │   │   │   ├── new/page.tsx      # Create invoice
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── page.tsx      # Invoice detail
│   │   │   │   │       ├── edit/page.tsx # Edit invoice
│   │   │   │   │       └── legal/page.tsx# Legal escalation
│   │   │   │   ├── clients/
│   │   │   │   │   ├── error.tsx         # Clients section error boundary
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [id]/page.tsx
│   │   │   │   ├── reminders/page.tsx    # Reminder sequences overview
│   │   │   │   ├── settings/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── billing/page.tsx
│   │   │   │   └── subscribe/page.tsx
│   │   │   └── layout.tsx               # Auth guard wrapper
│   │   ├── admin/
│   │   │   ├── error.tsx                # Admin section error boundary
│   │   │   ├── layout.tsx               # Admin layout + role check
│   │   │   ├── page.tsx                 # Admin dashboard
│   │   │   ├── users/page.tsx
│   │   │   ├── subscriptions/page.tsx
│   │   │   ├── plans/page.tsx
│   │   │   ├── email-logs/page.tsx
│   │   │   └── failed-jobs/page.tsx
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── webhooks/
│   │       │   ├── stripe/route.ts
│   │       │   ├── paypal/route.ts
│   │       │   ├── razorpay/route.ts
│   │       │   └── resend/route.ts
│   │       ├── share/[token]/route.ts    # Client portal API
│   │       ├── invoices/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       ├── route.ts
│   │       │       ├── send/route.ts
│   │       │       ├── mark-paid/route.ts
│   │       │       ├── send-reminder/route.ts
│   │       │       └── pdf/route.ts
│   │       ├── clients/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       ├── reminders/
│   │       │   ├── generate-ai/route.ts
│   │       │   └── [id]/
│   │       │       ├── route.ts
│   │       │       ├── pause/route.ts
│   │       │       └── resume/route.ts
│   │       ├── legal/
│   │       │   ├── generate-letter/route.ts
│   │       │   ├── generate-guide/route.ts
│   │       │   └── [invoiceId]/route.ts
│   │       ├── subscriptions/
│   │       │   ├── plans/route.ts
│   │       │   ├── create/route.ts
│   │       │   ├── current/route.ts
│   │       │   ├── cancel/route.ts
│   │       │   └── update/route.ts
│   │       ├── settings/
│   │       │   ├── route.ts
│   │       │   └── tone-sample/
│   │       │       ├── route.ts
│   │       │       └── [id]/route.ts
│   │       └── admin/
│   │           ├── stats/route.ts
│   │           ├── users/
│   │           │   ├── route.ts
│   │           │   └── [id]/route.ts
│   │           ├── plans/route.ts
│   │           ├── email-logs/route.ts
│   │           └── failed-jobs/
│   │               ├── route.ts
│   │               └── [id]/retry/route.ts
│   ├── components/
│   │   ├── ui/                          # shadcn/ui components
│   │   ├── landing/                     # Landing page components
│   │   │   ├── hero.tsx
│   │   │   ├── problem.tsx
│   │   │   ├── how-it-works.tsx
│   │   │   ├── features.tsx
│   │   │   ├── pricing.tsx
│   │   │   ├── cta.tsx
│   │   │   └── footer.tsx
│   │   ├── dashboard/
│   │   │   ├── stats-cards.tsx
│   │   │   ├── recent-invoices.tsx
│   │   │   ├── payment-chart.tsx
│   │   │   ├── upcoming-reminders.tsx
│   │   │   └── quick-actions.tsx
│   │   ├── invoices/
│   │   │   ├── invoice-form.tsx
│   │   │   ├── invoice-table.tsx
│   │   │   ├── invoice-preview.tsx
│   │   │   ├── invoice-status-badge.tsx
│   │   │   ├── reminder-timeline.tsx
│   │   │   ├── line-items-editor.tsx
│   │   │   └── partial-payment-modal.tsx
│   │   ├── clients/
│   │   │   ├── client-form.tsx
│   │   │   ├── client-table.tsx
│   │   │   └── client-detail.tsx
│   │   ├── reminders/
│   │   │   ├── reminder-sequence.tsx
│   │   │   ├── reminder-editor.tsx
│   │   │   └── ai-tone-preview.tsx
│   │   ├── subscription/
│   │   │   ├── plan-card.tsx
│   │   │   ├── payment-method-selector.tsx
│   │   │   ├── upi-input.tsx
│   │   │   └── plan-limit-modal.tsx
│   │   ├── client-portal/
│   │   │   ├── invoice-view.tsx
│   │   │   └── client-payment-button.tsx
│   │   ├── admin/
│   │   │   ├── user-table.tsx
│   │   │   ├── stats-overview.tsx
│   │   │   └── failed-jobs-list.tsx
│   │   └── shared/
│   │       ├── app-shell.tsx
│   │       ├── sidebar.tsx
│   │       ├── topbar.tsx
│   │       ├── empty-state.tsx
│   │       ├── loading-skeleton.tsx
│   │       └── pagination.tsx
│   ├── lib/
│   │   ├── auth.ts                      # NextAuth.js configuration
│   │   ├── db.ts                        # Prisma client singleton
│   │   ├── email.ts                     # Resend email functions
│   │   ├── stripe.ts                    # Stripe client
│   │   ├── paypal.ts                    # PayPal client
│   │   ├── razorpay.ts                  # Razorpay/UPI client
│   │   ├── openai.ts                    # OpenAI client
│   │   ├── invoice.ts                   # Invoice generation utils
│   │   ├── reminder.ts                  # Reminder scheduling logic
│   │   ├── pdf.ts                       # PDF generation
│   │   ├── rate-limit.ts                # Rate limiting middleware
│   │   ├── share-token.ts               # Token generation + verification
│   │   └── utils.ts                     # Shared utilities
│   ├── schemas/
│   │   ├── invoice.ts                   # Zod schemas for invoices
│   │   ├── client.ts                    # Zod schemas for clients
│   │   ├── settings.ts                  # Zod schemas for settings
│   │   └── subscription.ts              # Zod schemas for subscriptions
│   ├── types/
│   │   ├── invoice.ts
│   │   ├── client.ts
│   │   ├── subscription.ts
│   │   ├── reminder.ts
│   │   └── api.ts
│   ├── jobs/
│   │   ├── send-reminders.ts
│   │   ├── update-overdue.ts
│   │   ├── manage-subscriptions.ts
│   │   └── resume-paused-reminders.ts
│   └── middleware.ts                    # Auth middleware
├── emails/                              # React Email templates
│   ├── invoice-sent.tsx
│   ├── reminder-email.tsx
│   ├── payment-confirmation.tsx
│   ├── invoice-viewed.tsx
│   ├── email-bounced.tsx
│   └── subscription/
│       ├── welcome.tsx
│       ├── renewal.tsx
│       ├── trial-ending.tsx
│       ├── canceled.tsx
│       └── payment-failed.tsx
├── tests/
│   ├── unit/
│   │   ├── invoice.test.ts
│   │   ├── reminder.test.ts
│   │   └── utils.test.ts
│   ├── integration/
│   │   ├── api-invoices.test.ts
│   │   ├── api-clients.test.ts
│   │   └── auth.test.ts
│   └── e2e/
│       ├── auth-flow.spec.ts
│       ├── invoice-flow.spec.ts
│       └── reminder-flow.spec.ts
└── scripts/
    ├── seed.ts
    └── dev.sh
```

---

# 16. PACKAGES TO INSTALL

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "next-auth": "5.0.0-beta.25",
    "@auth/prisma-adapter": "^2.7.0",
    "@prisma/client": "^5.x",
    "resend": "^4.0.0",
    "stripe": "^16.0.0",
    "@stripe/stripe-js": "^4.0.0",
    "@paypal/paypal-js": "^8.0.0",
    "razorpay": "^2.9.0",
    "openai": "^4.0.0",
    "zod": "^3.23.0",
    "react-hook-form": "^7.52.0",
    "@hookform/resolvers": "^3.9.0",
    "tailwindcss": "^3.4.0",
    "tailwindcss-animate": "^1.0.7",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "lucide-react": "^0.400.0",
    "date-fns": "^3.6.0",
    "@tanstack/react-query": "^5.50.0",
    "recharts": "^2.12.0",
    "framer-motion": "^11.3.0",
    "next-themes": "^0.3.0",
    "sonner": "^1.5.0",
    "@react-pdf/renderer": "^4.0.0",
    "react-email": "^3.0.0",
    "inngest": "^3.19.0",
    "@upstash/ratelimit": "^2.0.0",
    "@upstash/redis": "^1.34.0",
    "bcryptjs": "^2.4.3",
    "uuid": "^10.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.x",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "typescript": "^5.5.0",
    "prisma": "^5.x",
    "eslint": "^8.0.0",
    "eslint-config-next": "^14.2.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "@types/bcryptjs": "^2.4.0",
    "@types/uuid": "^10.0.0",
    "vitest": "^2.0.0",
    "@playwright/test": "^1.45.0",
    "axe-playwright": "^2.0.0"
  }
}
```

---

# 17. TESTING STRATEGY

## 17.1 Test Framework

| Type | Tool | Location | Coverage Target |
|------|------|----------|-----------------|
| Unit tests | Vitest | `tests/unit/` | 80%+ for lib/ functions |
| Integration tests | Vitest + Supertest | `tests/integration/` | All API routes |
| E2E tests | Playwright | `tests/e2e/` | All critical user flows |
| Accessibility | axe-playwright | `tests/e2e/` | All pages WCAG AA pass |

## 17.2 Unit Tests

**What to test:**
- `lib/invoice.ts` — invoice total calculation, tax/discount logic, line item validation
- `lib/reminder.ts` — next reminder date calculation, tone selection, sequence construction
- `lib/share-token.ts` — token generation, expiry checks
- `lib/rate-limit.ts` — rate limit window calculation
- All Zod schemas — valid/invalid inputs

## 17.3 Integration Tests

**What to test:**
- All API route handlers (happy path + error cases)
- Auth middleware (authenticated, unauthenticated, wrong role)
- Database queries via Prisma (CRUD operations)
- Webhook signature verification

## 17.4 E2E Tests (Playwright)

**Critical Flows:**
1. **Auth flow:** Sign up → verify email → log in → log out
2. **Onboarding:** New user → set up tone sample → create first client
3. **Invoice flow:** Create invoice → send → view → mark paid
4. **Reminder flow:** Create overdue invoice → verify reminder scheduled → send reminder manually
5. **Client portal:** Share invoice link → client views → verify "viewed" status
6. **Subscription flow:** Free user → hit limit → upgrade to Premium → verify features unlocked

## 17.5 CI Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npx prisma generate
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run lint
      - run: npm run type-check
```

---

# 18. IMPLEMENTATION ORDER (Build Sequence)

This is the recommended order for AI agents to build DeathFear. Each phase is self-contained and builds on the previous.

## Phase 1: Foundation (Day 1–2)
1. Initialize Next.js project with TypeScript + Tailwind
2. Set up Prisma + PostgreSQL schema + migrations
3. Configure NextAuth.js with credentials + Google + GitHub
4. Create auth pages (signin, signup)
5. Set up middleware for route protection + admin role check
6. Set up Vitest + basic test structure
7. Deploy base to Vercel (empty app shell)

## Phase 2: App Shell & Landing (Day 2–3)
8. Build landing page (hero, problem, how it works, features, pricing)
9. Build app shell layout (sidebar, topbar, responsive)
10. Create shared components (empty state, skeletons, error states)
11. Set up TanStack Query provider

## Phase 3: Clients & Invoices (Day 3–5)
12. Build client management (CRUD, list, detail)
13. Build invoice creation form (with line items, validation)
14. Build invoice list (search, filter, sort, pagination)
15. Build invoice detail view (preview, timeline)
16. Implement invoice PDF generation
17. Implement "Send Invoice" action
18. Build client invoice portal (tokenized `/invoice/[token]` page)
19. Implement partial payment modal + logic

## Phase 4: Dashboard & Analytics (Day 5–6)
20. Build dashboard with stats cards
21. Add recent invoices table
22. Add payment chart (recharts)
23. Add upcoming reminders widget

## Phase 5: Reminder Engine (Day 6–8)
24. Build default reminder templates for all 4 tones
25. Build AI tone adaptation (OpenAI integration)
26. Build reminder sequence UI (timeline, edit, send now, pause/resume)
27. Implement Inngest cron job for automated reminder sending
28. Implement Resend email integration with reply-to
29. Build email tracking (open rates, bounces)
30. Implement email bounce handling + freelancer notification
31. Build failed jobs system + admin dead letter queue

## Phase 6: Legal Escalation (Day 8–9)
32. Build formal demand letter generation
33. Build small claims filing guide (USA 50 states + UK + Canada + Australia)
34. Add legal disclaimer to all generated documents
35. Build legal escalation UI

## Phase 7: Subscriptions & Billing (Day 9–12)
36. Create subscription plans in DB (seed script)
37. Build Stripe subscription integration (checkout, webhooks)
38. Build PayPal subscription integration
39. Build Razorpay UPI AutoPay (eMandate) integration
40. Build subscription UI (pricing page, manage subscription)
41. Build subscription gating (free vs premium checks)
42. Build free plan limit enforcement (invoice cap, client cap, paywall modals)

## Phase 8: Settings & Polish (Day 12–13)
43. Build settings pages (profile, tone samples, defaults, notifications, billing)
44. Add theme toggle (light/dark)
45. Add loading states and animations
46. Add toast notifications for all actions

## Phase 9: Admin Panel (Day 13–14)
47. Build admin dashboard with stats
48. Build user management (CRUD, role change, suspend)
49. Build subscription management
50. Build email log viewer
51. Build plan CRUD interface
52. Build failed jobs viewer + retry/dismiss

## Phase 10: GDPR, Accessibility & Compliance (Day 14–15)
53. Add cookie consent banner
54. Add Privacy Policy + Terms of Service pages
55. Add data deletion + data export functionality in settings
56. Run axe DevTools on all pages and fix accessibility issues
57. Add skip-to-content link and aria labels
58. Add data retention notice in footer of transactional emails

## Phase 11: Testing & CI (Day 15–16)
59. Write unit tests for core lib functions (80%+ coverage)
60. Write integration tests for all API routes
61. Write Playwright E2E tests for critical user flows
62. Set up GitHub Actions CI pipeline
63. Set up Vercel preview deployments

## Phase 12: Production Deployment (Day 16–17)
64. Production environment configuration
65. Stripe/PayPal/Razorpay webhook testing (local with Stripe CLI)
66. Email template testing (Resend preview)
67. Vercel production deploy
68. Domain + SSL configuration
69. Monitoring setup (Vercel Analytics + Sentry)
70. Final QA pass + security review

---

# 19. KEY DESIGN DECISIONS

| Decision | Choice | Rationale |
|----------|--------|-----------|
| State management | TanStack Query | Server-state focused, caching, background refetching |
| Form handling | React Hook Form + Zod | Performant, type-safe validation |
| Styling | Tailwind CSS | Utility-first, fast development, consistent |
| Component library | shadcn/ui | Copy-paste components, full customization |
| Auth | NextAuth.js v5 | Built for Next.js, multiple providers, Prisma adapter |
| ORM | Prisma | Type-safe queries, migrations, great DX |
| Email | Resend | Modern API, React Email support, good deliverability |
| PDF | @react-pdf/renderer | React-based, server-side rendering |
| Charts | Recharts | React-native, composable, responsive |
| Cron | Inngest | Reliable, retries, observability, dead letter queue |
| Payments | Stripe + PayPal + Razorpay | Maximum coverage for global users |
| Rate limiting | Upstash Ratelimit | Serverless-native, fast, persists across instances |
| Client portal tokens | crypto.randomBytes(32) | Cryptographically secure, no enumeration possible |
| UPI subscriptions | Razorpay eMandate (AutoPay) | Only viable way to do recurring UPI payments |
| Testing | Vitest + Playwright | Modern, fast, TypeScript-native |

---

# 20. ANALYTICS & MONITORING

- **Vercel Analytics** — Page views, performance
- **Vercel Speed Insights** — Core Web Vitals
- **Sentry** — Error tracking (optional, Phase 2)
- **Custom Dashboard Events**:
  - Invoice created / sent / paid / partially_paid
  - Reminder sent / opened / bounced
  - User signed up / subscribed / canceled / downgraded
  - Legal escalation triggered
  - Free plan limit hit
  - Email bounced
  - Cron job failure

---

# 21. SUCCESS METRICS

| Metric | Target (Month 1) | Target (Month 3) |
|--------|------------------|------------------|
| Registered users | 500 | 2,000 |
| Active users (weekly) | 200 | 800 |
| Invoices created | 1,000 | 5,000 |
| Premium conversion rate | 8% | 15% |
| Reminder open rate | 65% | 75% |
| Payment recovery rate | 40% | 60% |
| MRR | $1,000 | $5,000 |
| Churn rate (monthly) | < 8% | < 5% |
| Email bounce rate | < 3% | < 2% |

---

# 22. FUTURE ROADMAP (Post v1)

| Feature | Timeline |
|---------|----------|
| Mobile apps (React Native) | Q2 |
| Zapier / Make integration | Q2 |
| Team/agency accounts (multi-seat) | Q2 |
| Automated tax reporting (1099, VAT) | Q3 |
| Credit score impact reporting | Q3 |
| Integration with QuickBooks / Xero | Q3 |
| AI-powered payment negotiation | Q4 |
| Marketplace of collections attorneys | Q4 |
| Multi-currency support (EUR, GBP, INR) | Q4 |
| Inbound email parsing (auto-detect client replies) | Q4 |

---

*End of PRD v1.1 — DeathFear Freelance Payment Recovery Platform*
*This document is intended to be used by AI agents (Claude Code, GPT, DeepSeek, Gemini, etc.) to build the complete platform without requiring additional clarification.*
