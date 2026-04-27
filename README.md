# Maternix Track

A web-based clinical skills tracking system for nursing students in **RLE 107: Care of Mother, Child, and Adolescent (Well Client)**. Instructors assign and evaluate Return Demonstration (RETDEM) procedures; students track their progress and view evaluations in real time.

---

$env:BACKEND_URL="https://maternix-frontend-backend-production.up.railway.app"
$env:NEXT_PUBLIC_API_URL="https://maternix-frontend-backend-production.up.railway.app"
$env:NEXT_PUBLIC_APP_URL="https://maternix-frontend-backend2.andrei-montaniel-cics.workers.dev"
npm run build:cloudflare

## Tech Stack

| Layer           | Technology                  |
| --------------- | --------------------------- |
| Framework       | Next.js 15 (App Router)     |
| Language        | TypeScript                  |
| Styling         | Tailwind CSS v4             |
| Auth & Database | Supabase (PostgreSQL + RLS) |
| Animations      | Framer Motion               |
| Icons           | Lucide React                |
| Notifications   | Sonner                      |

---

## Project Structure

```
Maternix/
├── frontend/                  # Next.js app
│   ├── public/images/         # Static assets
│   ├── src/
│   │   ├── app/               # App Router pages & API routes
│   │   │   ├── auth/callback/ # Supabase email-confirm handler
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   ├── pending-approval/
│   │   │   ├── forgot-password/
│   │   │   ├── reset-password/
│   │   │   ├── student/
│   │   │   ├── instructor/
│   │   │   └── admin/
│   │   ├── components/        # React components
│   │   │   ├── instructor/    # Instructor-specific panels
│   │   │   └── ...
│   │   └── lib/supabase/      # Supabase client helpers
│   └── middleware.ts          # Route protection
├── supabase/                  # All SQL files (run in order)
│   ├── schema.sql
│   ├── fix-rls.sql
│   ├── fix-rls-instructor-writes.sql
│   ├── migration-email-trigger.sql
│   ├── seed.sql
│   └── seed-data.sql
└── README.md
```

---

## Prerequisites

- Node.js v18+
- A [Supabase](https://supabase.com) project (free tier is fine)

---

## Local Setup

### 1. Clone and install

```bash
git clone https://github.com/afdmandreimontaniel/Maternix.git
cd Maternix/frontend
npm install
```

### 2. Configure environment variables

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001   # NestJS backend (approval emails)
```

Both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are in your Supabase project under **Settings → API**.

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Supabase Setup (run once, in order)

Go to **Supabase Dashboard → SQL Editor** and run each file in this order. Paste the full contents of each file and click **Run**.

### Step 1 — `supabase/schema.sql`

Creates all 8 tables with columns and basic RLS.

### Step 2 — `supabase/fix-rls.sql`

**Critical.** Replaces recursive RLS policies with `SECURITY DEFINER` helper functions. Without this, logging in causes a 500 error.

### Step 3 — `supabase/fix-rls-instructor-writes.sql`

Adds the missing write policies:

- Students/instructors can update their own profile
- Instructors can insert/update/delete `student_procedures` for students in their sections

### Step 4 — `supabase/migration-email-trigger.sql`

Adds `phone_number` column to `profiles` and creates the database trigger that inserts profile/student/instructor rows only **after** a user confirms their email.

### Step 5 — `supabase/seed.sql`

Creates 19 pre-approved test accounts (see credentials below). All use password `password123`.

### Step 6 — `supabase/seed-data.sql`

Seeds real content: 6 clinical procedures, student procedure assignments with mixed statuses, 2 evaluations, and 3 announcements — replacing what used to be hardcoded mock data in the frontend.

---

## Supabase Dashboard Settings (manual)

### Authentication → URL Configuration

Add to **Redirect URLs**:

```

```

This is required for the email confirmation link to redirect correctly after signup.

### Authentication → Email Settings

Make sure **Confirm email** is **enabled**. This is the default for new projects.

---

## Test Credentials

All accounts use password: **`password123`**

### Admin

| Email                     | Notes                                              |
| ------------------------- | -------------------------------------------------- |
| `dapla.lmje@shc.edu.ph` | Full access: sections, instructors, user approvals |

### Instructors

| Email                        | Name                 | Assigned Section |
| ---------------------------- | -------------------- | ---------------- |
| `sarah.mitchell@nursing.edu` | Dr. Sarah Mitchell   | BSN 2A           |
| `jennifer.lopez@nursing.edu` | Prof. Jennifer Lopez | BSN 2B           |

### Students — BSN 2A (Dr. Sarah Mitchell)

| Email                         | Name            | Student No | Notes                                                                  |
| ----------------------------- | --------------- | ---------- | ---------------------------------------------------------------------- |
| `emily.rodriguez@nursing.edu` | Emily Rodriguez | 24-00007   | **Main test student** — has evaluated + completed + pending procedures |
| `maria.rodriguez@nursing.edu` | Maria Rodriguez | 24-00001   | Leopold's completed                                                    |
| `james.chen@nursing.edu`      | James Chen      | 24-00002   | Leopold's evaluated, EINC completed                                    |
| `sarah.thompson@nursing.edu`  | Sarah Thompson  | 24-00003   | Leopold's + EINC pending                                               |
| `david.kim@nursing.edu`       | David Kim       | 24-00004   | Leopold's in progress                                                  |
| `emily.martinez@nursing.edu`  | Emily Martinez  | 24-00005   | Leopold's completed                                                    |
| `michael.johnson@nursing.edu` | Michael Johnson | 24-00006   | Leopold's pending                                                      |

### Students — BSN 2B (Prof. Jennifer Lopez)

| Email                         | Name            | Student No | Notes                          |
| ----------------------------- | --------------- | ---------- | ------------------------------ |
| `lisa.anderson@nursing.edu`   | Lisa Anderson   | 24-00008   | Labor and Delivery pending     |
| `robert.taylor@nursing.edu`   | Robert Taylor   | 24-00009   | Labor and Delivery pending     |
| `jennifer.white@nursing.edu`  | Jennifer White  | 24-00010   | Labor and Delivery completed   |
| `christopher.lee@nursing.edu` | Christopher Lee | 24-00011   | Labor and Delivery in progress |
| `amanda.garcia@nursing.edu`   | Amanda Garcia   | 24-00012   | Labor and Delivery pending     |

### Students — BSN 2C (no instructor assigned)

| Email                        | Name           | Student No |
| ---------------------------- | -------------- | ---------- |
| `daniel.brown@nursing.edu`   | Daniel Brown   | 24-00013   |
| `jessica.davis@nursing.edu`  | Jessica Davis  | 24-00014   |
| `matthew.wilson@nursing.edu` | Matthew Wilson | 24-00015   |
| `ashley.miller@nursing.edu`  | Ashley Miller  | 24-00016   |

---

## Seeded Procedures

| Procedure               | Category                  | Created By           |
| ----------------------- | ------------------------- | -------------------- |
| Leopold's Maneuver      | Clinical Procedure        | Dr. Sarah Mitchell   |
| EINC                    | Newborn Care              | Dr. Sarah Mitchell   |
| Labor and Delivery      | Clinical Procedure        | Prof. Jennifer Lopez |
| Intramuscular Injection | Medication Administration | Dr. Sarah Mitchell   |
| Intradermal Injection   | Medication Administration | Dr. Sarah Mitchell   |
| NICU                    | Specialized Care          | Dr. Sarah Mitchell   |

> **Note:** Intramuscular Injection, Intradermal Injection, and NICU are not yet assigned to any student (they appear as "locked" in the student dashboard).

---

## User Flows

### Signup (new user)

1. Go to `/signup` → fill form → submit
2. "Check your email" message appears — no DB row created yet
3. User clicks the confirmation link in their email → redirected to `/pending-approval`
4. Admin logs in → **User Approvals** tab → clicks **Approve**
5. User receives approval email and can now log in at `/login`

### Instructor

1. Log in → **Instructor Dashboard**
2. **Procedure Management** — toggle section buttons to assign a procedure to all students in that section; click a procedure → view students → Evaluate / Leave Note
3. **Announcements** — post new announcements that appear in the student dashboard and popup
4. **Student Masterlist** — expand sections to see individual student completion percentages

### Student

1. Log in → **Student Dashboard** — see assigned procedures with real statuses
2. Click any non-locked procedure card for full detail (notes, evaluation score, feedback)
3. Toggle to **Announcements** tab to see instructor posts
4. Go to **Profile Settings** to update name, phone, and photo

### Admin

1. Log in → **Admin Dashboard**
2. **Section Management** — add/edit/delete sections; click a section name to view and move its students
3. **Instructor Management** — edit instructor name, employee ID, department
4. **User Approvals** — approve or reject pending registrations

---

## Available Scripts

All commands run from `frontend/`:

```bash
npm run dev      # Start development server with hot reload
npm run build    # Local Next.js production build
npm run build:cloudflare # Cloudflare/OpenNext production bundle
npm run start    # Start production server (run build first)
npm run lint     # Run ESLint
```

---

## Public Deployment (Cloudflare + Railway + Custom Domain)

### 1. Backend (Railway) must allow your frontend origin

Set backend environment variables in Railway:

```env
FRONTEND_URL=https://your-frontend-domain.com
CORS_ORIGINS=https://your-frontend-domain.com,https://your-workers-subdomain.workers.dev
```

`CORS_ORIGINS` supports comma-separated origins.

### 2. Frontend build must target a public backend URL

For production builds, set:

```env
BACKEND_URL=https://your-backend-domain.com
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
NEXT_PUBLIC_APP_URL=https://your-frontend-domain.com
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Important:

- Do not use `http://localhost:3001` for production.
- The app now fails production build if backend URL is missing or localhost.
- For a local production build in PowerShell, run:

```powershell
$env:BACKEND_URL="https://your-backend-domain.com"
$env:NEXT_PUBLIC_API_URL="https://your-backend-domain.com"
$env:NEXT_PUBLIC_APP_URL="https://your-frontend-domain.com"
npm run build:cloudflare
```

### 3. Deploy frontend Worker

From `frontend/`:

```bash
npm run build:cloudflare
npm run deploy:built
```

If you are building the Cloudflare bundle on Windows and your project path contains an apostrophe
(for example `Nelson's Laptop`), `opennextjs-cloudflare` may fail while bundling. In that case,
run the deploy build from WSL or move the project to a path without apostrophes before running
`npm run build:cloudflare`.

If your host has only one deploy command field, use `npm run deploy`; it runs the
Cloudflare build before deploying. If your host has separate build and deploy
fields, set the build command to `npm run build:cloudflare` and the deploy command to
`npm run deploy:built`.

### 4. Map custom domain in Cloudflare

1. Open Workers & Pages → your worker (`maternix-frontend`)
2. Add a Custom Domain (for example `app.yourdomain.com`)
3. Wait for SSL to provision
4. Update `NEXT_PUBLIC_APP_URL` to that final domain and redeploy

### 5. Validate production flow

1. Open your public domain
2. Login and open Instructor Dashboard
3. Confirm API calls go to your public backend URL (not localhost)
4. Test `/auth/callback` and protected pages
