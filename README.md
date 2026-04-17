# Maternix Track

A web-based clinical skills tracking system for nursing students in **RLE 107: Care of Mother, Child, and Adolescent (Well Client)**. Instructors assign and evaluate Return Demonstration (RETDEM) procedures; students track their progress and view evaluations in real time.

---

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
| `admin@maternixtrack.edu` | Full access: sections, instructors, user approvals |

### Instructors

| Email                        | Name                 | Assigned Section |
| ---------------------------- | -------------------- | ---------------- |
| `sarah.mitchell@nursing.edu` | Dr. Sarah Mitchell   | BSN 2A           |
| `jennifer.lopez@nursing.edu` | Prof. Jennifer Lopez | BSN 2B           |

### Students — BSN 2A (Dr. Sarah Mitchell)

| Email                         | Name            | Student No   | Notes                                                                  |
| ----------------------------- | --------------- | ------------ | ---------------------------------------------------------------------- |
| `emily.rodriguez@nursing.edu` | Emily Rodriguez | NSG-2024-007 | **Main test student** — has evaluated + completed + pending procedures |
| `maria.rodriguez@nursing.edu` | Maria Rodriguez | NSG-2024-001 | Leopold's completed                                                    |
| `james.chen@nursing.edu`      | James Chen      | NSG-2024-002 | Leopold's evaluated, EINC completed                                    |
| `sarah.thompson@nursing.edu`  | Sarah Thompson  | NSG-2024-003 | Leopold's + EINC pending                                               |
| `david.kim@nursing.edu`       | David Kim       | NSG-2024-004 | Leopold's in progress                                                  |
| `emily.martinez@nursing.edu`  | Emily Martinez  | NSG-2024-005 | Leopold's completed                                                    |
| `michael.johnson@nursing.edu` | Michael Johnson | NSG-2024-006 | Leopold's pending                                                      |

### Students — BSN 2B (Prof. Jennifer Lopez)

| Email                         | Name            | Student No   | Notes                          |
| ----------------------------- | --------------- | ------------ | ------------------------------ |
| `lisa.anderson@nursing.edu`   | Lisa Anderson   | NSG-2024-008 | Labor and Delivery pending     |
| `robert.taylor@nursing.edu`   | Robert Taylor   | NSG-2024-009 | Labor and Delivery pending     |
| `jennifer.white@nursing.edu`  | Jennifer White  | NSG-2024-010 | Labor and Delivery completed   |
| `christopher.lee@nursing.edu` | Christopher Lee | NSG-2024-011 | Labor and Delivery in progress |
| `amanda.garcia@nursing.edu`   | Amanda Garcia   | NSG-2024-012 | Labor and Delivery pending     |

### Students — BSN 2C (no instructor assigned)

| Email                        | Name           | Student No   |
| ---------------------------- | -------------- | ------------ |
| `daniel.brown@nursing.edu`   | Daniel Brown   | NSG-2024-013 |
| `jessica.davis@nursing.edu`  | Jessica Davis  | NSG-2024-014 |
| `matthew.wilson@nursing.edu` | Matthew Wilson | NSG-2024-015 |
| `ashley.miller@nursing.edu`  | Ashley Miller  | NSG-2024-016 |

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
npm run build    # Build for production
npm run start    # Start production server (run build first)
npm run lint     # Run ESLint
```
